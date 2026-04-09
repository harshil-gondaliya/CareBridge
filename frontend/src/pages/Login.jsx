import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

const redirectByRole = (role) => {
  const pathMap = {
    patient: '/patient/dashboard',
    doctor: '/doctor/appointments',
    admin: '/admin/dashboard',
  }

  return pathMap[role] || '/'
}

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    try {
      setLoading(true)
      const { data } = await api.post('/auth/login', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      })

      localStorage.setItem('carebridgeToken', data.token)
      localStorage.setItem('carebridgeUser', JSON.stringify(data.user))

      navigate(redirectByRole(data.user.role))
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to log in right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(22,163,74,0.25),_transparent_28%)]" />
      <section className="relative w-full max-w-md rounded-[2rem] border border-white/15 bg-white/95 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur sm:p-10">
        <Link to="/" className="text-sm font-semibold text-sky-700 transition hover:text-sky-800">
          ? Back to home
        </Link>

        <div className="mt-6">
          <span className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Secure Login
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
            Welcome back to CareBridge
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Access appointments, reports, messages, and digital care tools from
            one secure place.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
          </div>

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          ) : null}

          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-emerald-700 hover:text-emerald-800">
            Register
          </Link>
        </p>
      </section>
    </main>
  )
}

export default Login
