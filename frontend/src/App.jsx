import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import DoctorAppointments from './pages/DoctorAppointments'
import Chat from './pages/Chat'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorList from './pages/DoctorList'
import DoctorProfile from './pages/DoctorProfile'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import PatientAppointments from './pages/PatientAppointments'
import PatientReports from './pages/PatientReports'
import Timeline from './pages/Timeline'
import Profile from './pages/Profile'
import Register from './pages/Register'
import Navbar from './components/Navbar'
import ChatbotButton from './components/chatbot/ChatbotButton'
import ChatbotWindow from './components/chatbot/ChatbotWindow'

const getStoredUser = () => {
  const rawUser = localStorage.getItem('carebridgeUser')

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser)
  } catch {
    localStorage.removeItem('carebridgeUser')
    return null
  }
}

const redirectByRole = (role) => {
  const pathMap = {
    patient: '/patient/dashboard',
    doctor: '/doctor/appointments',
    admin: '/admin/dashboard',
  }

  return pathMap[role] || '/'
}

const ProtectedRoute = ({ allowedRoles, children }) => {
  const token = localStorage.getItem('carebridgeToken')
  const user = getStoredUser()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={redirectByRole(user.role)} replace />
  }

  return children
}

const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem('carebridgeToken')
  const user = getStoredUser()

  if (token && user) {
    return <Navigate to={redirectByRole(user.role)} replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

function AppContent() {
  const location = useLocation()
  const hideNavbar = ['/login', '/register'].includes(location.pathname)
  const [user, setUser] = useState(getStoredUser())
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    const syncUser = () => {
      setUser(getStoredUser())
    }

    syncUser()

    window.addEventListener('storage', syncUser)
    window.addEventListener('focus', syncUser)
    window.addEventListener('carebridge-user-updated', syncUser)

    return () => {
      window.removeEventListener('storage', syncUser)
      window.removeEventListener('focus', syncUser)
      window.removeEventListener('carebridge-user-updated', syncUser)
    }
  }, [location.pathname])

  const shouldShowChatbot = Boolean(user && ['patient', 'doctor'].includes(user.role) && !hideNavbar)

  return (
    <>
      {hideNavbar ? null : <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/doctors" element={<DoctorList />} />
        <Route path="/doctor/:id" element={<DoctorProfile />} />
        <Route
          path="/patient/dashboard"
          element={(
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientAppointments />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/patient/reports"
          element={(
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientReports />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/patient/timeline"
          element={(
            <ProtectedRoute allowedRoles={['patient']}>
              <Timeline />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/profile"
          element={(
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <Profile />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/chat/:appointmentId"
          element={(
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <Chat />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/doctor/appointments"
          element={(
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorAppointments />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/doctor/dashboard"
          element={(
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/dashboard"
          element={(
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {shouldShowChatbot ? (
        <>
          <ChatbotButton isOpen={isChatOpen} onClick={() => setIsChatOpen((current) => !current)} />
          <ChatbotWindow isOpen={isChatOpen} user={user} onClose={() => setIsChatOpen(false)} />
        </>
      ) : null}
    </>
  )
}

export default App
