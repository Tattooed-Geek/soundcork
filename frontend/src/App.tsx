import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Player from './pages/Player'
import Devices from './pages/Devices'
import DeviceDetail from './pages/DeviceDetail'
import Accounts from './pages/Accounts'
import AccountDetail from './pages/AccountDetail'
import Presets from './pages/Presets'
import Stations from './pages/Stations'
import Sources from './pages/Sources'
import Groups from './pages/Groups'
import Spotify from './pages/Spotify'
import SystemSettings from './pages/SystemSettings'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/player" element={<Player />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/devices/:id" element={<DeviceDetail />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/:id" element={<AccountDetail />} />
        <Route path="/presets" element={<Presets />} />
        <Route path="/stations" element={<Stations />} />
        <Route path="/sources" element={<Sources />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/spotify" element={<Spotify />} />
        <Route path="/settings/system" element={<SystemSettings />} />
      </Routes>
    </Layout>
  )
}

export default App
