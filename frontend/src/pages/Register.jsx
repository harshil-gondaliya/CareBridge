import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

const initialFormState = {
  name: '',
  email: '',
  password: '',
  specialization: '',
  experience: '',
  licenseNumber: '',
}

const roleCopy = {
  patient: {
    title: 'Patient registration',
    subtitle: 'Track reports, prescriptions, and appointments in one timeline.',
  },
  doctor: {
    title: 'Doctor registration',
    subtitle: 'Join CareBridge to manage consultations, prescriptions, and follow-ups.',
  },
}

function Register() {
  const navigate = useNavigate()
  const [role, setRole] = useState('patient')
  const [formData, setFormData] = useState(initialFormState)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const currentCopy = useMemo(() => roleCopy[role], [role])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      return 'Name, email, and password are required.'
    }

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long.'
    }

    if (role === 'doctor') {
      if (!formData.specialization.trim() || !formData.experience.toString().trim() || !formData.licenseNumber.trim()) {
        return 'Specialization, experience, and license number are required for doctors.'
      }

      if (Number.isNaN(Number(formData.experience)) || Number(formData.experience) < 0) {
        return 'Experience must be a valid non-negative number.'
      }
    }

    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const validationMessage = validateForm()

    if (validationMessage) {
      setError(validationMessage)
      return
    }

    const endpoint = role === 'doctor' ? '/auth/register/doctor' : '/auth/register/patient'

    const payload = role === 'doctor'
      ? {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          specialization: formData.specialization.trim(),
          experience: Number(formData.experience),
          licenseNumber: formData.licenseNumber.trim(),
        }
      : {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }

    try {
      setLoading(true)
      await api.post(endpoint, payload)
      setSuccess('Registration successful. You can log in now.')
      setFormData(initialFormState)

      window.setTimeout(() => {
        navigate('/login')
      }, 1200)
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to complete registration right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(22,163,74,0.22),_transparent_28%)]" />
      <section className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-sky-700 via-sky-600 to-emerald-600 p-8 text-white shadow-2xl shadow-slate-950/30">
          <Link to="/" className="text-sm font-semibold text-white/80 transition hover:text-white">
            ? Back to home
          </Link>
          <div className="mt-8 max-w-md">
            <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/85">
              Join CareBridge
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight">Build care around clarity, not chaos.</h1>
            <p className="mt-4 text-lg leading-8 text-white/85">
              Patients get a calmer health record experience. Doctors get a
              practical digital workspace that keeps consultations organized.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {['patient', 'doctor'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setRole(item)
                  setError('')
                  setSuccess('')
                }}
                className={`rounded-2xl border px-5 py-5 text-left transition ${role === item ? 'border-white bg-white text-sky-700 shadow-lg' : 'border-white/20 bg-white/10 text-white hover:bg-white/15'}`}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.22em]">{item}</p>
                <p className="mt-2 text-sm leading-6">
                  {item === 'patient'
                    ? 'Upload reports, manage records, and consult with confidence.'
                    : 'Manage appointments, patient insights, and prescriptions.'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/15 bg-white/95 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">Step 1: Choose Role</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{currentCopy.title}</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">{currentCopy.subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700">Step 2: Fill Details</p>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter full name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Minimum 6 characters" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
            </div>

            {role === 'doctor' ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Specialization</label>
                  <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="Cardiology, Dermatology, Pediatrics..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Experience</label>
                    <input type="number" min="0" name="experience" value={formData.experience} onChange={handleChange} placeholder="Years" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">License Number</label>
                    <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="Enter license number" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
                  </div>
                </div>
              </>
            ) : null}

            {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            {success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-sky-700 hover:text-sky-800">
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default Register
