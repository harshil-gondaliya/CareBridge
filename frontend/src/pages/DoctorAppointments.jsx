import { useEffect, useState } from 'react'
import api from '../services/api'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const statusClasses = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

function DoctorAppointments() {
  const [appointments, setAppointments] = useState([])
  const [selectedDay, setSelectedDay] = useState('Mon')
  const [loading, setLoading] = useState(true)
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/appointments/doctor')
      setAppointments(data.appointments || [])
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to load appointment requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const handleSaveAvailability = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      setSavingAvailability(true)
      await api.post('/availability', {
        day: selectedDay,
        startTime: '11:00 AM',
        endTime: '5:00 PM',
        slotDuration: 30,
      })
      setSuccess(`Availability saved for ${selectedDay}. Patients can now request appointments from 11:00 AM to 5:00 PM.`)
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to save availability.')
    } finally {
      setSavingAvailability(false)
    }
  }

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      setError('')
      setSuccess('')
      await api.put(`/appointments/${appointmentId}`, { status })
      setAppointments((current) =>
        current.map((appointment) => (
          appointment._id === appointmentId
            ? { ...appointment, status }
            : appointment
        )),
      )
      setSuccess(`Appointment ${status} successfully.`)
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to update appointment status.')
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#eff6ff_0%,_#ecfeff_45%,_#f0fdf4_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-sky-100/60">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Availability Setup</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Open your consultation schedule</h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Publish a weekday schedule so patients can request slots. CareBridge
                will generate 30-minute appointment windows automatically between
                11:00 AM and 5:00 PM.
              </p>
            </div>

            <form onSubmit={handleSaveAvailability} className="rounded-[1.75rem] border border-sky-100 bg-slate-50 p-6 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-slate-700">Select Day</label>
              <select value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
                {days.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Start Time</p>
                  <p className="mt-2 font-semibold text-slate-900">11:00 AM</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">End Time</p>
                  <p className="mt-2 font-semibold text-slate-900">5:00 PM</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Slot Duration</p>
                <p className="mt-2 font-semibold text-slate-900">30 minutes</p>
              </div>

              <button type="submit" disabled={savingAvailability} className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#0284c7,_#16a34a)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-100 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70">
                {savingAvailability ? 'Saving schedule...' : 'Save Availability'}
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-sky-100/60">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Appointment Requests</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Review patient bookings</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Confirm or cancel incoming appointment requests and review the
              patient context before your consultation window.
            </p>
          </div>

          {error ? <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          {success ? <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

          {loading ? (
            <p className="mt-8 text-slate-600">Loading appointment requests...</p>
          ) : appointments.length ? (
            <div className="mt-10 grid gap-5">
              {appointments.map((appointment) => (
                <article key={appointment._id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      {appointment.patientProfile?.profilePhoto ? (
                        <img src={appointment.patientProfile.profilePhoto} alt={appointment.patientProfile.name} className="h-16 w-16 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#2563eb,_#16a34a)] text-xl font-bold text-white">
                          {appointment.patientProfile?.name?.charAt(0) || 'P'}
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-slate-950">{appointment.patientProfile?.name}</h3>
                        <p className="mt-2 text-sm text-slate-500">{appointment.patientProfile?.email}</p>
                        <p className="mt-2 text-sm text-slate-500">
                          {appointment.patientProfile?.gender || 'Gender not set'} • {appointment.patientProfile?.bloodGroup || 'Blood group not set'}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${statusClasses[appointment.status] || 'bg-slate-100 text-slate-700'}`}>
                      {appointment.status}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Date</p>
                      <p className="mt-2 font-semibold text-slate-900">{new Date(appointment.date).toLocaleDateString()}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Time</p>
                      <p className="mt-2 font-semibold text-slate-900">{appointment.time}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Age</p>
                      <p className="mt-2 font-semibold text-slate-900">{appointment.patientProfile?.age ?? 'Not set'}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Mobile</p>
                      <p className="mt-2 font-semibold text-slate-900">{appointment.patientProfile?.mobile || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Diagnosis Notes</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{appointment.description || 'No notes provided by the patient.'}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Medical Context</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{appointment.patientProfile?.diseases || 'No known conditions listed.'}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" disabled={appointment.status === 'confirmed'} onClick={() => handleStatusUpdate(appointment._id, 'confirmed')} className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                      Confirm
                    </button>
                    <button type="button" disabled={appointment.status === 'cancelled'} onClick={() => handleStatusUpdate(appointment._id, 'cancelled')} className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                      Cancel
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
              No appointment requests yet. Once patients book from your public profile, they will appear here.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default DoctorAppointments
