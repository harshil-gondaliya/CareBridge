import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

function DoctorList() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/doctor')
        setDoctors(data.doctors || [])
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Unable to load verified doctors.')
      } finally {
        setLoading(false)
      }
    }

    loadDoctors()
  }, [])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#f0fdf4_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-sky-100 bg-white/90 p-8 shadow-xl shadow-sky-100/70 backdrop-blur">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Verified Specialists</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Find a doctor you can trust</h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Browse verified doctors across specialties, compare experience, and
              open detailed profiles before you continue to the next stage of
              care.
            </p>
          </div>

          {error ? <p className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          {loading ? (
            <p className="mt-8 text-slate-600">Loading doctors...</p>
          ) : doctors.length ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {doctors.map((doctor) => (
                <article key={doctor.id} className="group overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white shadow-md shadow-sky-100 transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
                  <div className="relative h-60 overflow-hidden bg-[linear-gradient(135deg,_rgba(2,132,199,0.22),_rgba(22,163,74,0.22))]">
                    {doctor.profilePhoto ? (
                      <img src={doctor.profilePhoto} alt={doctor.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl font-bold text-sky-800/70">
                        {doctor.name?.charAt(0) || 'D'}
                      </div>
                    )}
                    <span className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                      Verified
                    </span>
                  </div>

                  <div className="p-6">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-950">{doctor.name}</h2>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">{doctor.specialization}</p>
                    <p className="mt-4 text-sm text-slate-500">{doctor.experience} years of experience</p>
                    <p className="mt-4 min-h-[7rem] text-sm leading-7 text-slate-600">
                      {doctor.about || 'A verified CareBridge doctor ready to provide expert support.'}
                    </p>

                    <Link to={`/doctor/${doctor.id}`} className="mt-6 inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#0284c7,_#16a34a)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-100 transition hover:-translate-y-0.5">
                      View Profile
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
              No verified doctors are available yet. Check back after profiles are reviewed by the admin team.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default DoctorList
