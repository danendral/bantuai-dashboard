import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import TicketsPage from './pages/TicketsPage'
import ConversationsPage from './pages/ConversationsPage'
import TalkToDBPage from './pages/TalkToDBPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/talk-to-db" element={<TalkToDBPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
