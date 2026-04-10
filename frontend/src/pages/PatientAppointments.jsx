import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const statusClasses = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-sky-100 text-sky-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

function PatientAppointments() {
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        const [appointmentsResponse, prescriptionsResponse] = await Promise.all([
          api.get('/appointments/my'),
          api.get('/prescriptions/my'),
        ])

        setAppointments(appointmentsResponse.data.appointments || [])
        setPrescriptions(prescriptionsResponse.data.prescriptions || [])
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Unable to load your healthcare history.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_25%),linear-gradient(180deg,_#eff6ff_0%,_#f0fdf4_100%)] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-sky-100/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Patient Dashboard</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Your care journey</h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Track every consultation request, review real-time status
                changes, and keep your prescription history available whenever
                you need it.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/patient/reports" className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm transition hover:-translate-y-0.5">
                Scan Prescription
              </Link>
              <Link to="/doctors" className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#0284c7,_#16a34a)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-100 transition hover:-translate-y-0.5">
                Book New Appointment
              </Link>
            </div>
          </div>

          {error ? <p className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          {loading ? (
            <p className="mt-8 text-slate-600">Loading appointments and prescriptions...</p>
          ) : (
            <div className="mt-10 space-y-10">
              <section>
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">My Appointments</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Consultation timeline</h2>
                </div>

                {appointments.length ? (
                  <div className="mt-6 grid gap-5">
                    {appointments.map((appointment) => (
                      <article key={appointment._id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                              Dr. {appointment.doctorId?.name}
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">{appointment.doctorId?.email}</p>
                            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                              {appointment.doctorId?.specialization || 'CareBridge Specialist'}
                            </p>
                          </div>
                          <span className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${statusClasses[appointment.status] || 'bg-slate-100 text-slate-700'}`}>
                            {appointment.status}
                          </span>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Date</p>
                            <p className="mt-2 font-semibold text-slate-900">
                              {new Date(appointment.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Time</p>
                            <p className="mt-2 font-semibold text-slate-900">{appointment.time}</p>
                          </div>
                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Requested</p>
                            <p className="mt-2 font-semibold text-slate-900">
                              {new Date(appointment.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-white p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Description</p>
                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            {appointment.description || 'No additional notes were shared.'}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
                    You have not booked any appointments yet.
                  </div>
                )}
              </section>

              <section>
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">My Prescriptions</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Treatment history</h2>
                </div>

                {prescriptions.length ? (
                  <div className="mt-6 grid gap-5">
                    {prescriptions.map((prescription) => (
                      <article key={prescription._id} className="rounded-[1.75rem] border border-emerald-100 bg-[linear-gradient(180deg,_#f8fafc_0%,_#f0fdf4_100%)] p-6 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-2xl font-bold tracking-tight text-slate-950">
                              Dr. {prescription.doctorId?.name}
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">{prescription.doctorId?.specialization || 'CareBridge Specialist'}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                            {new Date(prescription.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                          {prescription.medicines?.map((medicine, index) => (
                            <div key={`${prescription._id}-medicine-${index}`} className="rounded-2xl bg-white p-4">
                              <p className="font-semibold text-slate-900">{medicine.name}</p>
                              <p className="mt-2 text-sm text-slate-600">Dosage: {medicine.dosage}</p>
                              <p className="mt-1 text-sm text-slate-600">Frequency: {medicine.frequency}</p>
                              <p className="mt-1 text-sm text-slate-600">Duration: {medicine.duration}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Consultation</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {prescription.appointmentId?.date ? new Date(prescription.appointmentId.date).toLocaleDateString() : 'Date unavailable'} at {prescription.appointmentId?.time || 'Time unavailable'}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Notes</p>
                            <p className="mt-2 text-sm leading-7 text-slate-600">
                              {prescription.notes || 'No additional prescription notes.'}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
                    Prescriptions will appear here after a doctor completes your appointment and records treatment guidance.
                  </div>
                )}
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default PatientAppointments
