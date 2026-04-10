import { useEffect, useState } from 'react'
import api from '../services/api'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const statusClasses = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-sky-100 text-sky-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

const createEmptyMedicine = () => ({
  name: '',
  dosage: '',
  frequency: '',
  duration: '',
})

function DoctorAppointments() {
  const [appointments, setAppointments] = useState([])
  const [selectedDay, setSelectedDay] = useState('Mon')
  const [loading, setLoading] = useState(true)
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [savingStatusId, setSavingStatusId] = useState('')
  const [submittingPrescriptionId, setSubmittingPrescriptionId] = useState('')
  const [prescriptionForms, setPrescriptionForms] = useState({})
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
      setSavingStatusId(appointmentId)
      const { data } = await api.put(`/appointments/${appointmentId}/status`, { status })
      setAppointments((current) =>
        current.map((appointment) => (
          appointment._id === appointmentId
            ? {
              ...appointment,
              ...data.appointment,
              patient: appointment.patient,
              patientProfile: appointment.patientProfile,
              prescription: appointment.prescription,
            }
            : appointment
        )),
      )
      setSuccess(`Appointment ${status} successfully.`)
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to update appointment status.')
    } finally {
      setSavingStatusId('')
    }
  }

  const getPrescriptionForm = (appointmentId) => (
    prescriptionForms[appointmentId] || {
      medicines: [createEmptyMedicine()],
      notes: '',
    }
  )

  const updatePrescriptionForm = (appointmentId, updater) => {
    setPrescriptionForms((current) => {
      const existing = current[appointmentId] || {
        medicines: [createEmptyMedicine()],
        notes: '',
      }

      return {
        ...current,
        [appointmentId]: updater(existing),
      }
    })
  }

  const handleMedicineChange = (appointmentId, index, field, value) => {
    updatePrescriptionForm(appointmentId, (current) => ({
      ...current,
      medicines: current.medicines.map((medicine, medicineIndex) => (
        medicineIndex === index
          ? { ...medicine, [field]: value }
          : medicine
      )),
    }))
  }

  const handleAddMedicine = (appointmentId) => {
    updatePrescriptionForm(appointmentId, (current) => ({
      ...current,
      medicines: [...current.medicines, createEmptyMedicine()],
    }))
  }

  const handleRemoveMedicine = (appointmentId, index) => {
    updatePrescriptionForm(appointmentId, (current) => ({
      ...current,
      medicines: current.medicines.filter((_, medicineIndex) => medicineIndex !== index),
    }))
  }

  const handleNotesChange = (appointmentId, value) => {
    updatePrescriptionForm(appointmentId, (current) => ({
      ...current,
      notes: value,
    }))
  }

  const handleSubmitPrescription = async (appointmentId) => {
    const currentForm = getPrescriptionForm(appointmentId)

    try {
      setError('')
      setSuccess('')
      setSubmittingPrescriptionId(appointmentId)
      const { data } = await api.post('/prescriptions', {
        appointmentId,
        medicines: currentForm.medicines,
        notes: currentForm.notes,
      })

      setAppointments((current) =>
        current.map((appointment) => (
          appointment._id === appointmentId
            ? { ...appointment, prescription: data.prescription }
            : appointment
        )),
      )
      setSuccess('Prescription submitted successfully.')
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to submit prescription.')
    } finally {
      setSubmittingPrescriptionId('')
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
              Confirm, cancel, or complete appointments after reviewing patient
              context. Completed visits can be closed with a structured
              e-prescription.
            </p>
          </div>

          {error ? <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          {success ? <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

          {loading ? (
            <p className="mt-8 text-slate-600">Loading appointment requests...</p>
          ) : appointments.length ? (
            <div className="mt-10 grid gap-5">
              {appointments.map((appointment) => {
                const prescriptionForm = getPrescriptionForm(appointment._id)

                return (
                  <article key={appointment._id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        {appointment.patientProfile?.profilePhoto ? (
                          <img src={appointment.patientProfile.profilePhoto} alt={appointment.patient?.name} className="h-16 w-16 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#2563eb,_#16a34a)] text-xl font-bold text-white">
                            {appointment.patient?.name?.charAt(0) || 'P'}
                          </div>
                        )}
                        <div>
                          <h3 className="text-2xl font-bold tracking-tight text-slate-950">{appointment.patient?.name}</h3>
                          <p className="mt-2 text-sm text-slate-500">{appointment.patient?.email}</p>
                          <p className="mt-2 text-sm text-slate-500">
                            {appointment.patientProfile?.gender || 'Gender not set'} | {appointment.patientProfile?.bloodGroup || 'Blood group not set'}
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
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Description</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{appointment.description || 'No notes provided by the patient.'}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Diseases</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{appointment.patientProfile?.diseases || 'No known conditions listed.'}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button type="button" disabled={appointment.status !== 'pending' || savingStatusId === appointment._id} onClick={() => handleStatusUpdate(appointment._id, 'confirmed')} className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                        Confirm
                      </button>
                      <button type="button" disabled={appointment.status !== 'pending' || savingStatusId === appointment._id} onClick={() => handleStatusUpdate(appointment._id, 'cancelled')} className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                        Cancel
                      </button>
                      {appointment.status === 'confirmed' ? (
                        <button type="button" disabled={savingStatusId === appointment._id} onClick={() => handleStatusUpdate(appointment._id, 'completed')} className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                          Mark as Completed
                        </button>
                      ) : null}
                    </div>

                    {appointment.status === 'completed' ? (
                      <section className="mt-6 rounded-[1.5rem] border border-emerald-100 bg-white p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">E-Prescription</p>
                            <h4 className="mt-2 text-xl font-bold text-slate-950">Treatment and follow-up plan</h4>
                          </div>
                          {appointment.prescription ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                              Prescription saved
                            </span>
                          ) : null}
                        </div>

                        {appointment.prescription ? (
                          <div className="mt-5 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              {appointment.prescription.medicines?.map((medicine, index) => (
                                <div key={`${appointment._id}-prescription-${index}`} className="rounded-2xl bg-slate-50 p-4">
                                  <p className="font-semibold text-slate-900">{medicine.name}</p>
                                  <p className="mt-2 text-sm text-slate-600">Dosage: {medicine.dosage}</p>
                                  <p className="mt-1 text-sm text-slate-600">Frequency: {medicine.frequency}</p>
                                  <p className="mt-1 text-sm text-slate-600">Duration: {medicine.duration}</p>
                                </div>
                              ))}
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Notes</p>
                              <p className="mt-2 text-sm leading-7 text-slate-600">
                                {appointment.prescription.notes || 'No additional prescription notes.'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-5 space-y-5">
                            {prescriptionForm.medicines.map((medicine, index) => (
                              <div key={`${appointment._id}-medicine-form-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-slate-900">Medicine {index + 1}</p>
                                  <button type="button" onClick={() => handleRemoveMedicine(appointment._id, index)} disabled={prescriptionForm.medicines.length === 1} className="text-sm font-semibold text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300">
                                    Remove
                                  </button>
                                </div>

                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                  <input type="text" value={medicine.name} onChange={(event) => handleMedicineChange(appointment._id, index, 'name', event.target.value)} placeholder="Medicine name" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
                                  <input type="text" value={medicine.dosage} onChange={(event) => handleMedicineChange(appointment._id, index, 'dosage', event.target.value)} placeholder="Dosage" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
                                  <input type="text" value={medicine.frequency} onChange={(event) => handleMedicineChange(appointment._id, index, 'frequency', event.target.value)} placeholder="Frequency" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
                                  <input type="text" value={medicine.duration} onChange={(event) => handleMedicineChange(appointment._id, index, 'duration', event.target.value)} placeholder="Duration" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
                                </div>
                              </div>
                            ))}

                            <button type="button" onClick={() => handleAddMedicine(appointment._id)} className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-700 transition hover:-translate-y-0.5">
                              Add Medicine
                            </button>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
                              <textarea rows="4" value={prescriptionForm.notes} onChange={(event) => handleNotesChange(appointment._id, event.target.value)} placeholder="Care advice, tests, and follow-up guidance." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
                            </div>

                            <button type="button" disabled={submittingPrescriptionId === appointment._id} onClick={() => handleSubmitPrescription(appointment._id)} className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#0284c7,_#16a34a)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-100 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70">
                              {submittingPrescriptionId === appointment._id ? 'Submitting Prescription...' : 'Submit Prescription'}
                            </button>
                          </div>
                        )}
                      </section>
                    ) : null}
                  </article>
                )
              })}
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
