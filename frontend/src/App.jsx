import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'

const DashboardPlaceholder = ({ role }) => {
  const titles = {
    patient: 'Patient Dashboard',
    doctor: 'Doctor Dashboard',
    admin: 'Admin Dashboard',
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-20 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.28),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(22,163,74,0.2),_transparent_35%)]" />
      <section className="relative mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/8 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
        <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">
          CareBridge
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
          {titles[role]}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
          Authentication is working and your role-based redirect landed here.
          We can build the full dashboard experience next.
        </p>
      </section>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/patient/dashboard" element={<DashboardPlaceholder role="patient" />} />
        <Route path="/doctor/dashboard" element={<DashboardPlaceholder role="doctor" />} />
        <Route path="/admin/dashboard" element={<DashboardPlaceholder role="admin" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
