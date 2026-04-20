import { Routes, Route } from 'react-router-dom'
import { useTheme } from './hooks/useTheme.jsx'
import './index.css'

import EventsList from './screens/EventsList.jsx'
import EventDetail from './screens/EventDetail.jsx'
import AddEvent from './screens/AddEvent.jsx'
import Checklist from './screens/Checklist.jsx'
import Vehicles from './screens/Vehicles.jsx'
import AddVehicle from './screens/AddVehicle.jsx'
import Venues from './screens/Venues.jsx'
import AddVenue from './screens/AddVenue.jsx'
import Settings from './screens/Settings.jsx'
import TemplateEditor from './screens/TemplateEditor.jsx'

export default function PreGridApp() {
  const { theme } = useTheme()

  return (
    <div className="pregrid-root" data-theme={theme}>
      <Routes>
        <Route path="/" element={<EventsList />} />
        <Route path="/events/new" element={<AddEvent />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/edit" element={<AddEvent />} />
        <Route path="/events/:id/checklist/:type" element={<Checklist />} />
        <Route path="/events/:id/session/:sessionId/checklist" element={<Checklist />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/vehicles/new" element={<AddVehicle />} />
        <Route path="/vehicles/:id/edit" element={<AddVehicle />} />
        <Route path="/venues" element={<Venues />} />
        <Route path="/venues/new" element={<AddVenue />} />
        <Route path="/venues/:id/edit" element={<AddVenue />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/templates" element={<TemplateEditor />} />
      </Routes>
    </div>
  )
}
