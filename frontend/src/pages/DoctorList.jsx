import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

function DoctorList() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('All')

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

  const specializations = useMemo(() => (
    ['All', ...new Set(doctors.map((doctor) => doctor.specialization).filter(Boolean))]
  ), [doctors])

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch = [doctor.name, doctor.specialization, doctor.about]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesSpecialization = selectedSpecialization === 'All'
        || doctor.specialization === selectedSpecialization

      return matchesSearch && matchesSpecialization
    })
  }, [doctors, searchTerm, selectedSpecialization])

  const averageExperience = doctors.length
    ? Math.round(doctors.reduce((total, doctor) => total + (doctor.experience || 0), 0) / doctors.length)
    : 0

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_20%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_45%,_#f0fdf4_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2.4rem] border border-white/80 bg-white/90 shadow-2xl shadow-sky-100/70 backdrop-blur">
          <div className="relative px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_45%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_38%)]" />
            <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-700">Verified Specialists</p>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
                  Discover care that feels qualified, calm, and close at hand
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                  Browse verified doctors, compare specialties, and move from
                  discovery to booking in one clear flow designed for real
                  healthcare decisions.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[1.6rem] border border-sky-100 bg-white/90 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Verified Doctors</p>
                    <p className="mt-3 text-3xl font-bold text-slate-950">{doctors.length}</p>
                  </div>
                  <div className="rounded-[1.6rem] border border-sky-100 bg-white/90 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Specialties</p>
                    <p className="mt-3 text-3xl font-bold text-slate-950">{Math.max(specializations.length - 1, 0)}</p>
                  </div>
                  <div className="rounded-[1.6rem] border border-sky-100 bg-white/90 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Avg. Experience</p>
                    <p className="mt-3 text-3xl font-bold text-slate-950">{averageExperience} yrs</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-sky-100 bg-white/95 p-6 shadow-xl shadow-sky-100/50">
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-sky-700">Find Your Match</p>
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Search doctor or specialty</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search cardiology, pediatrics, Dr. name..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="mt-5">
                  <label className="mb-3 block text-sm font-medium text-slate-700">Filter by specialization</label>
                  <div className="flex flex-wrap gap-3">
                    {specializations.map((specialization) => (
                      <button
                        key={specialization}
                        type="button"
                        onClick={() => setSelectedSpecialization(specialization)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selectedSpecialization === specialization ? 'bg-[linear-gradient(135deg,_#0284c7,_#16a34a)] text-white shadow-lg shadow-sky-100' : 'border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700'}`}
                      >
                        {specialization}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error ? <p className="mx-5 mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:mx-8">{error}</p> : null}

          {loading ? (
            <p className="px-5 pb-8 text-slate-600 sm:px-8 sm:pb-10">Loading doctors...</p>
          ) : filteredDoctors.length ? (
            <div className="border-t border-slate-100 px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Showing <span className="font-semibold text-slate-900">{filteredDoctors.length}</span> doctors matched to your search
                </p>
                <p className="text-sm text-slate-500">
                  Curated verified profiles only
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredDoctors.map((doctor) => (
                  <article key={doctor.id} className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-md shadow-sky-100 transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
                    <div className="relative h-64 overflow-hidden bg-[linear-gradient(135deg,_rgba(2,132,199,0.2),_rgba(22,163,74,0.18))]">
                      {doctor.profilePhoto ? (
                        <img src={doctor.profilePhoto} alt={doctor.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-6xl font-bold text-sky-800/70">
                          {doctor.name?.charAt(0) || 'D'}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/70 to-transparent" />
                      <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                          Verified
                        </span>
                        <span className="rounded-full bg-slate-950/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                          {doctor.experience} yrs
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold tracking-tight text-slate-950">{doctor.name}</h2>
                          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">{doctor.specialization}</p>
                        </div>
                        <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">CareBridge</p>
                          <p className="mt-1 text-xs text-slate-500">Reviewed</p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Experience</p>
                          <p className="mt-2 font-semibold text-slate-900">{doctor.experience} years</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Qualification</p>
                          <p className="mt-2 font-semibold text-slate-900">{doctor.qualification || 'Profile updated'}</p>
                        </div>
                      </div>

                      <p className="mt-5 min-h-[6.5rem] text-sm leading-7 text-slate-600">
                        {doctor.about || 'A verified CareBridge doctor ready to provide thoughtful, evidence-based care.'}
                      </p>

                      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Next Step</p>
                          <p className="mt-1 text-sm font-medium text-slate-600">View profile and book an available slot</p>
                        </div>
                        <Link to={`/doctor/${doctor.id}`} className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#0284c7,_#16a34a)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-100 transition hover:-translate-y-0.5">
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-5 mb-6 mt-6 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600 sm:mx-8 sm:mb-8 sm:mt-8 sm:p-8">
              No doctors matched your filters yet. Try another specialization or clear the search to explore the full directory.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default DoctorList
