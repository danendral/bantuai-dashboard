import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthProvider from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TicketsPage from './pages/TicketsPage'
import ConversationsPage from './pages/ConversationsPage'
import ProductsPage from './pages/ProductsPage'
import TalkToDBPage from './pages/TalkToDBPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin routes (protected) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="conversations" element={<ConversationsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="talk-to-db" element={<TalkToDBPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
