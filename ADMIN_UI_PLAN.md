# Admin UI Modern — Implementation Plan & Summary

## Objective
Replace the legacy Jinja2 admin/miniapp HTML pages with a modern, dark-themed React SPA that centralizes all SoundCork controls.

## Architecture
- **Backend**: FastAPI with a new JSON API layer (`/api/v1/`) while keeping all Bose protocol endpoints (`/marge`, `/bmx`) intact.
- **Frontend**: React SPA served as static files under `/admin/`.
- **Transport**: HTTP REST JSON.

## Backend — New Files & Changes

### `soundcork/api_v1.py`
New REST API module with 24 endpoints:
- **Devices**: list, detail, now-playing, volume, command (play/stop/volume/power/reboot/set_name/set_language/switch_to_soundcork/configure_account)
- **Accounts**: CRUD + detail with nested devices/presets/sources/recents/groups
- **Presets**: CRUD per account
- **Sources**: CRUD per account
- **Groups**: stereo pair management for ST10
- **Network**: UPnP scan + recents scan
- **Spotify**: list linked accounts + init OAuth flow
- **System**: status endpoint

### `soundcork/main.py`
- Added `get_api_v1_router(datastore, speakers)` mount.
- Removed legacy `get_admin_router` and `get_miniapp_router` HTML mounts.
- Added `StaticFiles` mount for `/admin` pointing to `static/admin/`.
- Root `/` redirects to `/admin/`.

### `Dockerfile`
Updated to multi-stage build:
- Stage 1: Node 20 Alpine builds the frontend.
- Stage 2: Python 3.12 slim runs the backend with built static files copied in.

## Frontend — New Project (`frontend/`)

### Stack
- Vite + React 18 + TypeScript
- TailwindCSS v3 (custom dark color palette)
- React Router v6 (with `basename="/admin"`)
- TanStack Query (React Query) for server state
- Axios for HTTP client (`baseURL: /api/v1`)
- Lucide React for icons

### Theme (Dark / Black / Modern)
- Background: `#000000`
- Surface: `#0a0a0a`
- Cards: `#171717`
- Borders: `#262626`
- Primary text: `#fafafa`
- Secondary text: `#a3a3a3`
- Accent: `#ffffff`

### Pages
| Route | Content |
|---|---|
| `/` | Dashboard — stats, quick devices, system status |
| `/devices` | Device grid with search + quick actions |
| `/devices/:id` | Device detail — now playing, volume, playback controls, info |
| `/accounts` | Account list + create/delete |
| `/accounts/:id` | Account detail tabs: Presets, Sources, Groups, Recents |
| `/presets` | Visual preset grid (select account first) |
| `/sources` | Source list (select account first) |
| `/groups` | Stereo group management (select account first) |
| `/spotify` | Spotify integration status + link flow |
| `/settings/system` | Server info + network scan |

### API Hooks
- `useDevices.ts` — list + detail with polling
- `useCommand.ts` — send device commands + now-playing + volume polling
- `useAccounts.ts` — list + detail + create + delete
- `usePresets.ts` — list + update + delete
- `useSources.ts` — list + add + delete
- `useGroups.ts` — list + create + delete
- `useSpotify.ts` — accounts + init flow
- `useSystem.ts` — status + network scan

## Integration
- `npm run build` outputs to `frontend/dist/`.
- The `dist/` contents are copied to `soundcork/static/admin/`.
- FastAPI serves `/admin/{path:path}` as a single-page application (fallback to `index.html`).

## Missing Bose API Endpoints (Candidates for Future Additions)
Per the official Bose SoundTouch Web API and the existing API spec docs:
- `/bass` — Get/set bass level
- `/key` — Simulate remote key presses (PRESET_1..6, MUTE, etc.)
- `/select` — Select input source (AUX, Bluetooth, etc.)
- `/setZone` — Multi-room zone setup (explicitly excluded per user request)
- `/volume` — Already covered via command endpoint
- `/now_playing` — Already covered
- `/info` — Already covered via device scan

## Build & Run

### Local development
```bash
cd frontend/
npm install
npm run dev

cd ../soundcork/
fastapi dev main.py
# Open http://localhost:8000/admin/
```

### Production (Docker)
```bash
docker build -t soundcork .
docker run -p 8000:8000 soundcork
```

## Status
- [x] Backend API v1 implemented
- [x] Frontend scaffolded and themed
- [x] All pages implemented
- [x] Docker multi-stage updated
- [x] Static build integrated
- [x] Python imports & routing validated
