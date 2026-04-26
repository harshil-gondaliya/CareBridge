import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'

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

function DoctorProfile() {
  const { id } = useParams()
  const user = getStoredUser()
  const [doctor, setDoctor] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [slotLoading, setSlotLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [description, setDescription] = useState('')
  const [bookingMessage, setBookingMessage] = useState('')

  useEffect(() => {
    const loadDoctor = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/doctor/${id}`)
        setDoctor(data.doctor)
      } catch (apiError) {
        setLoadError(apiError.response?.data?.message || 'Unable to load doctor profile.')
      } finally {
        setLoading(false)
      }
    }

    loadDoctor()
  }, [id])

  useEffect(() => {
    const loadAvailability = async () => {
      if (!doctor?.userId || !selectedDate) {
        setSlots([])
        return
      }

      try {
        setSlotLoading(true)
        const { data } = await api.get(`/availability/${doctor.userId}`, {
          params: { date: selectedDate },
        })
        setSlots(data.slots || [])
      } catch (apiError) {
        setBookingError(apiError.response?.data?.message || 'Unable to load available slots.')
      } finally {
        setSlotLoading(false)
      }
    }

    loadAvailability()
  }, [doctor?.userId, selectedDate])

  const handleBookAppointment = async (event) => {
    event.preventDefault()
    setBookingError('')
    setBookingMessage('')

    if (!selectedDate || !selectedSlot) {
      setBookingError('Please select a date and available time slot.')
      return
    }

    try {
      setBooking(true)
      await api.post('/appointments', {
        doctorId: doctor.userId,
        date: selectedDate,
        time: selectedSlot,
        description: description.trim(),
      })
      setBookingMessage('Appointment request sent successfully. It is now waiting for doctor approval.')
      setDescription('')
      setSelectedSlot('')

      const { data } = await api.get(`/availability/${doctor.userId}`, {
        params: { date: selectedDate },
      })
      setSlots(data.slots || [])
    } catch (apiError) {
      setBookingError(apiError.response?.data?.message || 'Unable to book this appointment.')
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#eff6ff_0%,_#f0fdf4_100%)] px-6">
        <p className="text-slate-600">Loading doctor profile...</p>
      </main>
    )
  }

  if (loadError || !doctor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#eff6ff_0%,_#f0fdf4_100%)] px-6">
        <div className="max-w-xl rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-xl shadow-rose-100/60">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Profile Unavailable</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">We could not load this doctor</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{loadError || 'This profile may no longer exist.'}</p>
          <Link to="/doctors" className="mt-6 inline-flex rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
            Back to doctors
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.14),_transparent_22%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_55%,_#f0fdf4_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <Link to="/doctors" className="inline-flex text-sm font-semibold text-sky-700 transition hover:text-sky-800">
          Back to doctors
        </Link>

        <section className="mt-6 overflow-hidden rounded-[2.4rem] border border-white/70 bg-white/90 shadow-2xl shadow-sky-100/70 backdrop-blur">
          <div className="grid xl:grid-cols-[0.82fr_1.18fr]">
            <div className="bg-[linear-gradient(180deg,_#0f172a,_#0f766e)] p-5 text-white sm:p-8 xl:p-10">
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
                {doctor.profilePhoto ? (
                  <img src={doctor.profilePhoto} alt={doctor.name} className="h-80 w-full object-cover sm:h-[26rem] xl:h-[30rem]" />
                ) : (
                  <div className="flex h-80 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_38%),linear-gradient(135deg,_rgba(2,132,199,0.2),_rgba(22,163,74,0.2))] text-7xl font-bold text-white/80 sm:h-[26rem] sm:text-8xl xl:h-[30rem]">
                    {doctor.name?.charAt(0) || 'D'}
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">Contact</p>
                  <p className="mt-3 text-base font-semibold">{doctor.email}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">Trust Marker</p>
                  <p className="mt-3 text-base font-semibold">Verified by CareBridge</p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">Why Patients Choose This Doctor</p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-200">
                  <li>Evidence-based consultations with a clear specialist profile.</li>
                  <li>Visible schedule publishing and transparent booking flow.</li>
                  <li>Structured approval workflow for a professional care experience.</li>
                </ul>
              </div>
            </div>

            <div className="p-5 sm:p-8 xl:p-12">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Verified CareBridge Doctor
                </span>
                <span className="inline-flex rounded-full bg-sky-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                  {doctor.specialization}
                </span>
              </div>

              <div className="mt-6 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl md:text-5xl">{doctor.name}</h1>
                  <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
                    A verified specialist profile designed to help patients move from trust to booking without friction.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Experience</p>
                      <p className="mt-3 text-2xl font-bold text-slate-950">{doctor.experience} years</p>
                    </div>
                    <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Qualification</p>
                      <p className="mt-3 text-lg font-bold text-slate-950">{doctor.qualification || 'Not added yet'}</p>
                    </div>
                  </div>

                  <div className="mt-8 rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Clinical Introduction</p>
                    <p className="mt-4 text-base leading-8 text-slate-600">
                      {doctor.about || 'This doctor has not added an introduction yet.'}
                    </p>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-sky-100 bg-[linear-gradient(180deg,_#f8fafc,_#f0fdf4)] p-6 shadow-xl shadow-sky-100/50">
                  <div className="max-w-2xl">
                    <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">Book Appointment</p>
                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">Choose an available consultation slot</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      Select a date, review live availability, and send a short
                      note so the doctor can review your request clearly.
                    </p>
                  </div>

                  {user?.role !== 'patient' ? (
                    <p className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                      Log in as a patient to book an appointment with this doctor.
                    </p>
                  ) : (
                    <form onSubmit={handleBookAppointment} className="mt-6 grid gap-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Select Date</label>
                      <input type="date" value={selectedDate} min={new Date().toISOString().split('T')[0]} onChange={(event) => {
                        setSelectedDate(event.target.value)
                        setSelectedSlot('')
                      }} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
                    </div>

                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">Available Slots</p>
                      {slotLoading ? (
                        <p className="text-sm text-slate-500">Loading available slots...</p>
                      ) : slots.length ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {slots.map((slot) => (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={slot.isBooked}
                              onClick={() => setSelectedSlot(slot.time)}
                              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${slot.isBooked ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : selectedSlot === slot.time ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700'}`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      ) : selectedDate ? (
                        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
                          No available slots for the selected date.
                        </p>
                      ) : (
                        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
                          Choose a date to view available slots.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Describe your concern</label>
                      <textarea rows="4" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Headache for 3 days, follow-up on skin rash, routine consultation..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
                    </div>

                    {bookingError ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{bookingError}</p> : null}
                    {bookingMessage ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{bookingMessage}</p> : null}

                    <button type="submit" disabled={booking} className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#0284c7,_#16a34a)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-100 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70">
                      {booking ? 'Booking appointment...' : 'Book Appointment'}
                    </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default DoctorProfile
