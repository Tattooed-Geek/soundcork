"""Admin REST API v1 for SoundCork.

Provides JSON endpoints for the React admin SPA.
"""

import logging
import shutil
import time
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from soundcork.config import Settings
from soundcork.datastore import DataStore
from soundcork.devices import (
    add_device_by_ip,
    addr_is_reachable,
    default_sources,
    get_bose_devices,
    hostname_for_device,
    override_speaker_config,
    override_speaker_config_non_rooted,
    read_device_info,
    read_recents,
    reboot_speaker,
)
from soundcork.model import ConfiguredSource, Group, Preset, Recent
from soundcork.spotify_service import SpotifyService
from soundcork.ui.speakers import CombinedDevice, Speakers

logger = logging.getLogger(__name__)
settings = Settings()
spotify = SpotifyService()


# ---------------------------------------------------------------------------
# Response / Input models
# ---------------------------------------------------------------------------

class DeviceOut(BaseModel):
    id: str
    ip: str
    name: str
    online: bool
    account: str | None = None
    in_soundcork: bool
    marge_server: str
    reachable: bool
    language_code: str | None = None
    product_code: str | None = None
    firmware_version: str | None = None


class AccountOut(BaseModel):
    id: str
    label: str
    device_count: int


class AccountDetailOut(BaseModel):
    id: str
    label: str
    devices: list[DeviceOut]
    presets: list[Preset]
    sources: list[ConfiguredSource]
    recents: list[Recent]
    groups: list[Group]


class NowPlayingOut(BaseModel):
    source: str | None = None
    track: str | None = None
    artist: str | None = None
    album: str | None = None
    art: str | None = None
    station: str | None = None
    duration: int | None = None
    position: int | None = None
    play_state: str | None = None
    volume: int | None = None
    muted: bool | None = None


class CommandIn(BaseModel):
    action: str = Field(..., description="play, stop, volume, power, reboot, set_name, set_language, switch_to_soundcork, configure_account")
    value: str | None = None
    content_item_id: str | None = None


class NameIn(BaseModel):
    name: str


class CreateAccountIn(BaseModel):
    account_id: str
    account_name: str


class GroupCreateIn(BaseModel):
    name: str
    left_id: str
    right_id: str


class SpotifyAccountOut(BaseModel):
    displayName: str
    createdAt: str
    spotifyUserId: str


class SystemStatusOut(BaseModel):
    uptime_seconds: int
    version: str
    base_url: str
    data_dir: str
    spotify_configured: bool


class BassIn(BaseModel):
    level: int = Field(..., ge=-10, le=10, description="Bass level from -10 to +10")


class KeyIn(BaseModel):
    key: str = Field(..., description="Media key: PLAY, PAUSE, STOP, NEXT, PREV, MUTE, VOLUME_UP, VOLUME_DOWN, PRESET_1..6, POWER")


class SelectIn(BaseModel):
    source: str = Field(..., description="Source to select: AUX, BLUETOOTH, TUNEIN, SPOTIFY, etc.")
    source_account: str | None = None


# ---------------------------------------------------------------------------

def _combined_device_to_out(cd: CombinedDevice, datastore: DataStore) -> DeviceOut:
    product_code = None
    firmware = None
    if cd.account and cd.in_soundcork:
        try:
            info = datastore.get_device_info(cd.account, cd.id)
            product_code = info.product_code
            firmware = info.firmware_version
        except Exception:
            pass
    return DeviceOut(
        id=cd.id,
        ip=cd.ip,
        name=cd.name,
        online=cd.online,
        account=cd.account,
        in_soundcork=cd.in_soundcork,
        marge_server=cd.marge_server,
        reachable=cd.reachable,
        language_code=cd.language_code,
        product_code=product_code,
        firmware_version=firmware,
    )


def get_api_v1_router(datastore: DataStore, speakers: Speakers) -> APIRouter:
    router = APIRouter(prefix="/api/v1", tags=["v1"])
    _startup_time = time.time()

    # -------------------------------------------------------------------
    # Devices
    # -------------------------------------------------------------------

    @router.get("/devices")
    def list_devices() -> list[DeviceOut]:
        combined = speakers.all_devices()
        return [_combined_device_to_out(combined[k], datastore) for k in sorted(combined)]

    @router.get("/devices/{device_id}")
    def get_device(device_id: str) -> DeviceOut:
        cd = speakers.all_devices().get(device_id)
        if not cd:
            raise HTTPException(status_code=404, detail="Device not found")
        return _combined_device_to_out(cd, datastore)

    @router.get("/devices/{device_id}/now-playing")
    def now_playing(device_id: str) -> NowPlayingOut:
        cd = speakers.all_devices().get(device_id)
        if not cd or not cd.st_device:
            raise HTTPException(status_code=404, detail="Device not found or offline")
        try:
            from bosesoundtouchapi.soundtouchclient import SoundTouchClient
            client = SoundTouchClient(cd.st_device)
            info = client.GetNowPlayingStatus()
            vol = client.GetVolume()
            return NowPlayingOut(
                source=info.Source,
                track=getattr(info, "Track", None),
                artist=getattr(info, "Artist", None),
                album=getattr(info, "Album", None),
                art=getattr(info, "ArtImageUrl", None),
                station=getattr(info, "StationName", None),
                duration=getattr(info, "Duration", None),
                position=getattr(info, "Position", None),
                play_state=getattr(info, "PlayState", None),
                volume=getattr(vol, "Level", None),
                muted=getattr(vol, "IsMuted", None),
            )
        except Exception as e:
            logger.warning(f"now_playing failed for {device_id}: {e}")
            raise HTTPException(status_code=500, detail="Could not fetch now playing")

    @router.get("/devices/{device_id}/volume")
    def get_volume(device_id: str) -> dict[str, Any]:
        cd = speakers.all_devices().get(device_id)
        if not cd or not cd.st_device:
            raise HTTPException(status_code=404, detail="Device not found or offline")
        try:
            from bosesoundtouchapi.soundtouchclient import SoundTouchClient
            vol = SoundTouchClient(cd.st_device).GetVolume()
            return {"volume": getattr(vol, "Level", 0), "muted": getattr(vol, "IsMuted", False)}
        except Exception as e:
            logger.warning(f"get_volume failed for {device_id}: {e}")
            raise HTTPException(status_code=500, detail="Could not fetch volume")

    @router.post("/devices/{device_id}/command")
    async def device_command(device_id: str, cmd: CommandIn) -> dict[str, Any]:
        cd = speakers.all_devices().get(device_id)
        if not cd:
            raise HTTPException(status_code=404, detail="Device not found")

        action = cmd.action.lower()

        if action == "play":
            if not cd.account or not cd.st_device:
                raise HTTPException(status_code=400, detail="Device offline or no account")
            ci_id = cmd.content_item_id or ""
            ok = speakers.play_content_item(device_id, ci_id)
            if not ok:
                raise HTTPException(status_code=500, detail="Playback failed")
            return {"success": True, "action": action}

        if action == "stop":
            if not cd.st_device:
                raise HTTPException(status_code=400, detail="Device offline")
            ok = speakers.stop_playback(device_id)
            if not ok:
                raise HTTPException(status_code=500, detail="Stop failed")
            return {"success": True, "action": action}

        if action == "volume":
            if not cd.st_device:
                raise HTTPException(status_code=400, detail="Device offline")
            try:
                level = int(cmd.value or "0")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid volume value")
            from bosesoundtouchapi.soundtouchclient import SoundTouchClient
            SoundTouchClient(cd.st_device).SetVolumeLevel(level)
            return {"success": True, "action": action, "volume": level}

        if action == "power":
            if not cd.st_device:
                raise HTTPException(status_code=400, detail="Device offline")
            from bosesoundtouchapi.soundtouchclient import SoundTouchClient
            SoundTouchClient(cd.st_device).SendKeyPress("POWER")
            return {"success": True, "action": action}

        if action == "reboot":
            if cd.reachable:
                ok = reboot_speaker(cd.ip)
            else:
                ok = await override_speaker_config_non_rooted(cd.ip)
            speakers.clear_device(device_id)
            return {"success": ok, "action": action}

        if action == "set_name":
            name = cmd.value or ""
            ok = await speakers.set_name(device_id, name)
            if not ok:
                raise HTTPException(status_code=500, detail="Rename failed")
            return {"success": True, "action": action, "name": name}

        if action == "set_language":
            lang = cmd.value or ""
            ok = await speakers.set_language(device_id, lang)
            if not ok:
                raise HTTPException(status_code=500, detail="Language set failed")
            return {"success": True, "action": action, "language": lang}

        if action == "switch_to_soundcork":
            if not cd.reachable:
                raise HTTPException(status_code=400, detail="Device not reachable via SSH")
            ok = override_speaker_config(cd.ip)
            rb = reboot_speaker(cd.ip)
            speakers.clear_device(device_id)
            return {"success": ok, "action": action, "reboot": rb}

        if action == "configure_account":
            if not cd.st_device:
                raise HTTPException(status_code=400, detail="Device offline")
            ok = add_device_by_ip(cd.ip, cd.reachable)
            if not ok:
                raise HTTPException(status_code=500, detail="Configure account failed")
            return {"success": True, "action": action}

        raise HTTPException(status_code=400, detail=f"Unknown action: {cmd.action}")

    # -------------------------------------------------------------------
    # Bass
    # -------------------------------------------------------------------

    @router.get("/devices/{device_id}/bass")
    def get_bass(device_id: str) -> dict[str, Any]:
        cd = speakers.all_devices().get(device_id)
        if not cd or not cd.st_device:
            raise HTTPException(status_code=404, detail="Device not found or offline")
        try:
            from bosesoundtouchapi.soundtouchclient import SoundTouchClient
            bass = SoundTouchClient(cd.st_device).GetBass()
            return {"level": getattr(bass, "ActualBass", None), "target": getattr(bass, "TargetBass", None)}
        except Exception as e:
            logger.warning(f"get_bass failed for {device_id}: {e}")
            raise HTTPException(status_code=500, detail="Could not fetch bass")

    @router.post("/devices/{device_id}/bass")
    def set_bass(device_id: str, payload: BassIn) -> dict[str, Any]:
        cd = speakers.all_devices().get(device_id)
        if not cd or not cd.st_device:
            raise HTTPException(status_code=404, detail="Device not found or offline")
        try:
            from bosesoundtouchapi.soundtouchclient import SoundTouchClient
            SoundTouchClient(cd.st_device).SetBassLevel(payload.level)
            return {"success": True, "level": payload.level}
        except Exception as e:
            logger.warning(f"set_bass failed for {device_id}: {e}")
            raise HTTPException(status_code=500, detail="Could not set bass")

    # -------------------------------------------------------------------
    # Key
    # -------------------------------------------------------------------

    @router.post("/devices/{device_id}/key")
    def send_key(device_id: str, payload: KeyIn) -> dict[str, Any]:
        cd = speakers.all_devices().get(device_id)
        if not cd or not cd.st_device:
            raise HTTPException(status_code=404, detail="Device not found or offline")
        key = payload.key.upper()
        key_map = {
            "PLAY": "MediaPlay",
            "PAUSE": "MediaPause",
            "STOP": "MediaStop",
            "PLAY_PAUSE": "MediaPlayPause",
            "NEXT": "MediaNextTrack",
            "PREV": "MediaPreviousTrack",
            "MUTE": "Mute",
            "MUTE_ON": "MuteOn",
            "MUTE_OFF": "MuteOff",
            "VOLUME_UP": "VolumeUp",
            "VOLUME_DOWN": "VolumeDown",
            "PRESET_1": "SelectPreset1",
            "PRESET_2": "SelectPreset2",
            "PRESET_3": "SelectPreset3",
            "PRESET_4": "SelectPreset4",
            "PRESET_5": "SelectPreset5",
            "PRESET_6": "SelectPreset6",
            "POWER": "Power",
            "POWER_ON": "PowerOn",
            "POWER_OFF": "PowerOff",
        }
        method_name = key_map.get(key)
        if not method_name:
            raise HTTPException(status_code=400, detail=f"Unknown key: {payload.key}")
        try:
            from bosesoundtouchapi.soundtouchclient import SoundTouchClient
            client = SoundTouchClient(cd.st_device)
            getattr(client, method_name)()
            return {"success": True, "key": key}
        except Exception as e:
            logger.warning(f"send_key failed for {device_id}: {e}")
            raise HTTPException(status_code=500, detail="Could not send key")

    # -------------------------------------------------------------------
    # Select
    # -------------------------------------------------------------------

    @router.post("/devices/{device_id}/select")
    def select_source(device_id: str, payload: SelectIn) -> dict[str, Any]:
        cd = speakers.all_devices().get(device_id)
        if not cd or not cd.st_device:
            raise HTTPException(status_code=404, detail="Device not found or offline")
        try:
            from bosesoundtouchapi.soundtouchclient import SoundTouchClient
            client = SoundTouchClient(cd.st_device)
            if payload.source.upper() in ("AUX", "BLUETOOTH"):
                client.SelectLocalSource(payload.source.upper())
            else:
                client.SelectSource(payload.source, payload.source_account or "")
            return {"success": True, "source": payload.source}
        except Exception as e:
            logger.warning(f"select_source failed for {device_id}: {e}")
            raise HTTPException(status_code=500, detail="Could not select source")

    # -------------------------------------------------------------------
    # Accounts
    # -------------------------------------------------------------------

    @router.get("/accounts")
    def list_accounts() -> list[AccountOut]:
        out: list[AccountOut] = []
        for acc_id in datastore.list_accounts():
            if not acc_id:
                continue
            label = datastore.get_account_info(acc_id)
            out.append(AccountOut(id=acc_id, label=label, device_count=len(datastore.list_devices(acc_id))))
        return out

    @router.get("/accounts/{account_id}")
    def get_account(account_id: str) -> AccountDetailOut:
        if not datastore.account_exists(account_id):
            raise HTTPException(status_code=404, detail="Account not found")
        label = datastore.get_account_info(account_id)
        devices: list[DeviceOut] = []
        for dev_id in datastore.list_devices(account_id):
            if dev_id:
                try:
                    info = datastore.get_device_info(account_id, dev_id)
                    devices.append(DeviceOut(
                        id=dev_id, ip=info.ip_address, name=info.name, online=False,
                        account=account_id, in_soundcork=True, marge_server="N/A",
                        reachable=False, product_code=info.product_code,
                        firmware_version=info.firmware_version,
                    ))
                except Exception:
                    pass
        presets = datastore.get_presets(account_id)
        sources = datastore.get_configured_sources(account_id)
        recents: list[Recent] = []
        for dev_id in datastore.list_devices(account_id):
            if dev_id:
                try:
                    recents.extend(datastore.get_recents(account_id, dev_id))
                except Exception:
                    pass
        groups = []
        try:
            groups = datastore.list_groups(account_id)
        except Exception:
            pass
        return AccountDetailOut(
            id=account_id, label=label, devices=devices,
            presets=presets, sources=sources, recents=recents, groups=groups,
        )

    @router.post("/accounts")
    def create_account(payload: CreateAccountIn) -> AccountOut:
        if datastore.account_exists(payload.account_id):
            raise HTTPException(status_code=409, detail="Account already exists")
        datastore.create_account(payload.account_id, payload.account_name)
        datastore.save_configured_sources(payload.account_id, default_sources())
        datastore.save_presets(payload.account_id, "", [])
        datastore.save_recents(payload.account_id, "", [])
        return AccountOut(id=payload.account_id, label=payload.account_name, device_count=0)

    @router.delete("/accounts/{account_id}")
    def delete_account(account_id: str) -> dict[str, Any]:
        if not datastore.account_exists(account_id):
            raise HTTPException(status_code=404, detail="Account not found")
        shutil.rmtree(datastore.account_dir(account_id), ignore_errors=True)
        datastore.initialize_accounts_file()
        return {"success": True, "deleted": account_id}

    # -------------------------------------------------------------------
    # Presets
    # -------------------------------------------------------------------

    @router.get("/accounts/{account_id}/presets")
    def list_presets(account_id: str) -> list[Preset]:
        if not datastore.account_exists(account_id):
            raise HTTPException(status_code=404, detail="Account not found")
        return datastore.get_presets(account_id)

    @router.put("/accounts/{account_id}/presets/{preset_id}")
    def update_preset(account_id: str, preset_id: str, preset: Preset) -> Preset:
        if not datastore.account_exists(account_id):
            raise HTTPException(status_code=404, detail="Account not found")
        existing = datastore.get_presets(account_id)
        found = False
        for i, p in enumerate(existing):
            if p.id == preset_id:
                existing[i] = preset
                found = True
                break
        if not found:
            existing.append(preset)
        datastore.save_presets(account_id, "", existing)
        return preset

    @router.delete("/accounts/{account_id}/presets/{preset_id}")
    def delete_preset_ep(account_id: str, preset_id: str) -> dict[str, Any]:
        if not datastore.account_exists(account_id):
            raise HTTPException(status_code=404, detail="Account not found")
        existing = datastore.get_presets(account_id)
        datastore.save_presets(account_id, "", [p for p in existing if p.id != preset_id])
        return {"success": True}

    # -------------------------------------------------------------------
    # Sources
    # -------------------------------------------------------------------

    @router.get("/accounts/{account_id}/sources")
    def list_sources(account_id: str) -> list[ConfiguredSource]:
        if not datastore.account_exists(account_id):
            raise HTTPException(status_code=404, detail="Account not found")
        return datastore.get_configured_sources(account_id)

    @router.post("/accounts/{account_id}/sources")
    def add_source_ep(account_id: str, source: ConfiguredSource) -> ConfiguredSource:
        if not datastore.account_exists(account_id):
            raise HTTPException(status_code=404, detail="Account not found")
        return datastore.add_source(account_id, source)

    @router.delete("/accounts/{account_id}/sources/{source_id}")
    def delete_source(account_id: str, source_id: str) -> dict[str, Any]:
        if not datastore.account_exists(account_id):
            raise HTTPException(status_code=404, detail="Account not found")
        ok = datastore.remove_source(account_id, source_id)
        return {"success": ok}

    # -------------------------------------------------------------------
    # Recents
    # -------------------------------------------------------------------

    @router.get("/accounts/{account_id}/recents")
    def list_recents(account_id: str) -> list[Recent]:
        if not datastore.account_exists(account_id):
            raise HTTPException(status_code=404, detail="Account not found")
        recents: list[Recent] = []
        for dev_id in datastore.list_devices(account_id):
            if dev_id:
                try:
                    recents.extend(datastore.get_recents(account_id, dev_id))
                except Exception:
                    pass
        return recents

    # -------------------------------------------------------------------
    # Groups
    # -------------------------------------------------------------------

    @router.get("/accounts/{account_id}/groups")
    def list_groups(account_id: str) -> list[Group]:
        if not datastore.account_exists(account_id):
            raise HTTPException(status_code=404, detail="Account not found")
        return datastore.list_groups(account_id)

    @router.post("/accounts/{account_id}/groups")
    def create_group(account_id: str, payload: GroupCreateIn) -> Group:
        if not datastore.account_exists(account_id):
            raise HTTPException(status_code=404, detail="Account not found")
        try:
            left_info = datastore.get_device_info(account_id, payload.left_id)
            right_info = datastore.get_device_info(account_id, payload.right_id)
        except Exception:
            raise HTTPException(status_code=404, detail="One or both devices not found")
        group = Group(
            id="", name=payload.name, master_id=payload.left_id,
            left_id=payload.left_id, left_ip=left_info.ip_address,
            right_id=payload.right_id, right_ip=right_info.ip_address,
        )
        datastore.add_group(account_id, group)
        return group

    @router.delete("/accounts/{account_id}/groups/{group_id}")
    def delete_group(account_id: str, group_id: str) -> dict[str, Any]:
        if not datastore.account_exists(account_id):
            raise HTTPException(status_code=404, detail="Account not found")
        datastore.delete_group(account_id, group_id)
        return {"success": True}

    # -------------------------------------------------------------------
    # Network / Scan
    # -------------------------------------------------------------------

    @router.post("/network/scan")
    def network_scan() -> list[DeviceOut]:
        devices = get_bose_devices()
        result: list[DeviceOut] = []
        for dev in devices:
            host = hostname_for_device(dev)
            try:
                info_str = read_device_info(host)
                if not info_str:
                    continue
                info_elem = ET.fromstring(info_str)
                dev_id = info_elem.attrib.get("deviceID", "")
                name_elem = info_elem.find("name")
                name = name_elem.text if name_elem is not None else ""
                account_elem = info_elem.find("margeAccountUUID")
                account = account_elem.text if account_elem is not None else None
                reachable = addr_is_reachable(host)
                result.append(DeviceOut(
                    id=dev_id, ip=host, name=name, online=True,
                    account=account,
                    in_soundcork=datastore.account_exists(account) if account else False,
                    marge_server="Unknown", reachable=reachable,
                ))
            except Exception:
                continue
        return result

    @router.post("/network/scan-recents")
    def network_scan_recents() -> list[dict[str, Any]]:
        devices = get_bose_devices()
        out: list[dict[str, Any]] = []
        for dev in devices:
            host = hostname_for_device(dev)
            try:
                rec = read_recents(host)
                out.append({"hostname": host, "name": dev.friendly_name, "recents_length": len(rec)})
            except Exception:
                out.append({"hostname": host, "name": dev.friendly_name, "recents_length": 0})
        return out

    # -------------------------------------------------------------------
    # Spotify
    # -------------------------------------------------------------------

    @router.get("/spotify/accounts")
    def get_spotify_accounts() -> list[SpotifyAccountOut]:
        accounts = spotify.list_accounts()
        return [SpotifyAccountOut(**{k: a[k] for k in ["displayName", "createdAt", "spotifyUserId"]}) for a in accounts]

    @router.post("/spotify/init")
    def init_spotify(request: Request) -> dict[str, str]:
        if not settings.spotify_client_id:
            raise HTTPException(status_code=503, detail="Spotify integration not configured")
        callback_url = settings.base_url.rstrip("/") + "/mgmt/spotify/callback"
        authorize_url = spotify.build_authorize_url(redirect_uri=callback_url)
        return {"redirectUrl": authorize_url}

    # -------------------------------------------------------------------
    # System
    # -------------------------------------------------------------------

    @router.get("/system/status")
    def system_status() -> SystemStatusOut:
        return SystemStatusOut(
            uptime_seconds=int(time.time() - _startup_time),
            version="0.0.1",
            base_url=settings.base_url,
            data_dir=settings.data_dir,
            spotify_configured=bool(settings.spotify_client_id and settings.spotify_client_secret),
        )

    return router
