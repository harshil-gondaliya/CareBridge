import { useEffect, useState } from 'react'
import api from '../services/api'

function AdminDashboard() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const loadDoctors = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/admin/doctors')
      setDoctors(data.doctors || [])
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to load doctor submissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctors()
  }, [])

  const handleVerifyDoctor = async (doctorId) => {
    try {
      setActionMessage('')
      setError('')
      await api.put(`/admin/verify-doctor/${doctorId}`)
      setDoctors((current) =>
        current.map((doctor) => (
          doctor.id === doctorId
            ? { ...doctor, isVerified: true }
            : doctor
        )),
      )
      setActionMessage('Doctor verified successfully.')
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to verify this doctor right now.')
    }
  }

  const handleBlockDoctor = async (doctorId) => {
    try {
      setActionMessage('')
      setError('')
      await api.put(`/admin/block-doctor/${doctorId}`)
      setDoctors((current) =>
        current.map((doctor) => (
          doctor.id === doctorId
            ? { ...doctor, isVerified: false }
            : doctor
        )),
      )
      setActionMessage('Doctor blocked successfully.')
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to block this doctor right now.')
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#ecfeff_0%,_#eff6ff_45%,_#f0fdf4_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-xl shadow-sky-100/60">
          <div className="bg-[linear-gradient(135deg,_#0f172a,_#0f766e)] px-8 py-10 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">Admin Verification</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Doctor approval queue</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">
              Review doctor profiles, confirm their details, and control which
              professionals appear in the patient directory.
            </p>
          </div>

          <div className="px-8 py-8">
            {error ? <p className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            {actionMessage ? <p className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{actionMessage}</p> : null}

            {loading ? (
              <p className="text-slate-600">Loading doctor profiles...</p>
            ) : doctors.length ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {doctors.map((doctor) => (
                  <article key={doctor.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-950">{doctor.name}</h2>
                        <p className="mt-2 text-sm text-slate-500">{doctor.email}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${doctor.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {doctor.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Specialization</p>
                        <p className="mt-2 font-semibold text-slate-900">{doctor.specialization}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Experience</p>
                        <p className="mt-2 font-semibold text-slate-900">{doctor.experience} years</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">About</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {doctor.about || 'No doctor bio has been added yet.'}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={doctor.isVerified}
                        onClick={() => handleVerifyDoctor(doctor.id)}
                        className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#0284c7,_#16a34a)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                      >
                        {doctor.isVerified ? 'Already verified' : 'Verify Doctor'}
                      </button>

                      <button
                        type="button"
                        disabled={!doctor.isVerified}
                        onClick={() => handleBlockDoctor(doctor.id)}
                        className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        Block Doctor
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
                No doctor profiles have been submitted yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default AdminDashboard
