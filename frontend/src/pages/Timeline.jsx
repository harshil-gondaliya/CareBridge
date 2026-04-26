import { useEffect, useState } from 'react'
import api from '../services/api'

const itemTheme = {
  appointment: {
    icon: 'AP',
    badge: 'bg-sky-100 text-sky-700',
    card: 'border-sky-200 bg-sky-50/40',
  },
  prescription: {
    icon: 'RX',
    badge: 'bg-emerald-100 text-emerald-700',
    card: 'border-emerald-200 bg-emerald-50/40',
  },
  report: {
    icon: 'RP',
    badge: 'bg-slate-200 text-slate-700',
    card: 'border-slate-200 bg-slate-50/70',
  },
}

function Timeline() {
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/timeline')
        setTimeline(data.timeline || [])
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Unable to load medical timeline.')
      } finally {
        setLoading(false)
      }
    }

    loadTimeline()
  }, [])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#f0fdfa_45%,_#ecfeff_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <section className="mx-auto max-w-5xl rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-2xl shadow-sky-100/60 sm:p-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">Medical Timeline</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Your complete healthcare history</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Appointments, prescriptions, and OCR reports in one chronological timeline.
          </p>
        </div>

        {error ? <p className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        {loading ? (
          <p className="mt-8 text-slate-600">Loading timeline...</p>
        ) : timeline.length ? (
          <div className="relative mt-8 pl-6 sm:mt-10 sm:pl-8">
            <div className="absolute left-2.5 top-0 h-full w-0.5 bg-slate-200 sm:left-3" />

            <div className="space-y-6">
              {timeline.map((item) => {
                const theme = itemTheme[item.type] || itemTheme.report

                return (
                  <article key={`${item.type}-${item.data._id}`} className="relative">
                    <div className={`absolute -left-[1.45rem] top-6 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold shadow-sm sm:-left-[1.95rem] sm:h-6 sm:w-6 sm:text-xs ${theme.badge}`}>
                      {theme.icon}
                    </div>

                    <div className={`rounded-[1.5rem] border p-4 shadow-sm sm:p-6 ${theme.card}`}>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${theme.badge}`}>
                          {item.type}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {item.type === 'appointment' ? (
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <p className="text-sm text-slate-700">
                            Doctor: <span className="font-semibold text-slate-900">Dr. {item.data.doctorId?.name || 'Unknown'}</span>
                          </p>
                          <p className="text-sm text-slate-700">
                            Date: <span className="font-semibold text-slate-900">{new Date(item.data.date).toLocaleDateString()} at {item.data.time}</span>
                          </p>
                          <p className="text-sm text-slate-700 md:col-span-2">
                            Status: <span className="font-semibold capitalize text-slate-900">{item.data.status}</span>
                          </p>
                        </div>
                      ) : null}

                      {item.type === 'prescription' ? (
                        <div className="mt-4 space-y-4">
                          <p className="text-sm text-slate-700">
                            Doctor: <span className="font-semibold text-slate-900">Dr. {item.data.doctorId?.name || 'Unknown'}</span>
                          </p>
                          <div className="grid gap-3 md:grid-cols-2">
                            {item.data.medicines?.map((medicine, index) => (
                              <div key={`${item.data._id}-medicine-${index}`} className="rounded-2xl border border-emerald-200 bg-white p-3">
                                <p className="font-semibold text-slate-900">{medicine.name}</p>
                                <p className="mt-1 text-sm text-slate-600">Dosage: {medicine.dosage}</p>
                                <p className="mt-1 text-sm text-slate-600">Frequency: {medicine.frequency}</p>
                                <p className="mt-1 text-sm text-slate-600">Duration: {medicine.duration}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm leading-7 text-slate-700">Notes: {item.data.notes || 'No additional notes.'}</p>
                        </div>
                      ) : null}

                      {item.type === 'report' ? (
                        <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                          <a href={item.data.imageUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <img src={item.data.imageUrl} alt="Uploaded report" className="h-40 w-full object-cover sm:h-48" />
                          </a>
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Extracted Text / Medicines</p>
                            <p className="mt-2 line-clamp-6 text-sm leading-7 text-slate-600">
                              {item.data.extractedText || 'No extracted text.'}
                            </p>
                            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              {item.data.isVerified ? 'Verified OCR' : 'Pending Verification'}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600 sm:p-8">
            No timeline data yet. Book appointments, receive prescriptions, or upload reports to build your medical timeline.
          </div>
        )}
      </section>
    </main>
  )
}

export default Timeline
