import { useEffect, useState } from 'react'
import api from '../services/api'

const patientInitialState = {
  age: '',
  gender: '',
  mobile: '',
  bloodGroup: '',
  diseases: '',
  profilePhoto: '',
}

const doctorInitialState = {
  specialization: '',
  experience: '',
  qualification: '',
  about: '',
  profilePhoto: '',
}

function Profile() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('')
  const [patientForm, setPatientForm] = useState(patientInitialState)
  const [doctorForm, setDoctorForm] = useState(doctorInitialState)
  const [patientPhotoFile, setPatientPhotoFile] = useState(null)
  const [doctorPhotoFile, setDoctorPhotoFile] = useState(null)
  const [patientPhotoPreview, setPatientPhotoPreview] = useState('')
  const [doctorPhotoPreview, setDoctorPhotoPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/profile/me')

        setUser(data.user)
        setRole(data.user.role)

        if (data.user.role === 'patient') {
          setPatientForm({
            age: data.profile?.age?.toString() || '',
            gender: data.profile?.gender || '',
            mobile: data.profile?.mobile || '',
            bloodGroup: data.profile?.bloodGroup || '',
            diseases: data.profile?.diseases || '',
            profilePhoto: data.profile?.profilePhoto || '',
          })
          setPatientPhotoPreview('')
        }

        if (data.user.role === 'doctor') {
          setDoctorForm({
            specialization: data.profile?.specialization || data.user.specialization || '',
            experience: data.profile?.experience?.toString() || data.user.experience?.toString() || '',
            qualification: data.profile?.qualification || '',
            about: data.profile?.about || '',
            profilePhoto: data.profile?.profilePhoto || '',
          })
          setDoctorPhotoPreview('')
        }

        localStorage.setItem('carebridgeUser', JSON.stringify({
          ...data.user,
          profilePhoto: data.profile?.profilePhoto || '',
        }))
        window.dispatchEvent(new Event('carebridge-user-updated'))
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Unable to load your profile.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  useEffect(() => {
    return () => {
      if (patientPhotoPreview) {
        URL.revokeObjectURL(patientPhotoPreview)
      }

      if (doctorPhotoPreview) {
        URL.revokeObjectURL(doctorPhotoPreview)
      }
    }
  }, [patientPhotoPreview, doctorPhotoPreview])

  const handlePatientChange = (event) => {
    const { name, value } = event.target
    setPatientForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleDoctorChange = (event) => {
    const { name, value } = event.target
    setDoctorForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handlePatientPhotoChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      setPatientPhotoFile(null)
      if (patientPhotoPreview) {
        URL.revokeObjectURL(patientPhotoPreview)
      }
      setPatientPhotoPreview('')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Profile photo must be 2MB or smaller.')
      return
    }

    setError('')
    setPatientPhotoFile(file)
    if (patientPhotoPreview) {
      URL.revokeObjectURL(patientPhotoPreview)
    }
    setPatientPhotoPreview(URL.createObjectURL(file))
  }

  const handleDoctorPhotoChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      setDoctorPhotoFile(null)
      if (doctorPhotoPreview) {
        URL.revokeObjectURL(doctorPhotoPreview)
      }
      setDoctorPhotoPreview('')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Profile photo must be 2MB or smaller.')
      return
    }

    setError('')
    setDoctorPhotoFile(file)
    if (doctorPhotoPreview) {
      URL.revokeObjectURL(doctorPhotoPreview)
    }
    setDoctorPhotoPreview(URL.createObjectURL(file))
  }

  const syncStoredUser = (nextUser, profilePhoto) => {
    localStorage.setItem('carebridgeUser', JSON.stringify({
      ...nextUser,
      profilePhoto: profilePhoto || '',
    }))
    window.dispatchEvent(new Event('carebridge-user-updated'))
  }

  const handlePatientSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('age', patientForm.age)
      formData.append('gender', patientForm.gender.trim())
      formData.append('mobile', patientForm.mobile.trim())
      formData.append('bloodGroup', patientForm.bloodGroup.trim())
      formData.append('diseases', patientForm.diseases.trim())

      if (patientPhotoFile) {
        formData.append('profilePhoto', patientPhotoFile)
      }

      const { data } = await api.put('/profile/patient', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setUser(data.user)
      setPatientForm({
        age: data.profile?.age?.toString() || '',
        gender: data.profile?.gender || '',
        mobile: data.profile?.mobile || '',
        bloodGroup: data.profile?.bloodGroup || '',
        diseases: data.profile?.diseases || '',
        profilePhoto: data.profile?.profilePhoto || '',
      })
      setPatientPhotoFile(null)
      if (patientPhotoPreview) {
        URL.revokeObjectURL(patientPhotoPreview)
      }
      setPatientPhotoPreview('')
      syncStoredUser(data.user, data.profile?.profilePhoto)
      setSuccess('Profile updated successfully.')
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to update your profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleDoctorSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('specialization', doctorForm.specialization.trim())
      formData.append('experience', doctorForm.experience)
      formData.append('qualification', doctorForm.qualification.trim())
      formData.append('about', doctorForm.about.trim())

      if (doctorPhotoFile) {
        formData.append('profilePhoto', doctorPhotoFile)
      }

      const { data } = await api.put('/profile/doctor', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setUser(data.user)
      setDoctorForm({
        specialization: data.profile?.specialization || '',
        experience: data.profile?.experience?.toString() || '',
        qualification: data.profile?.qualification || '',
        about: data.profile?.about || '',
        profilePhoto: data.profile?.profilePhoto || '',
      })
      setDoctorPhotoFile(null)
      if (doctorPhotoPreview) {
        URL.revokeObjectURL(doctorPhotoPreview)
      }
      setDoctorPhotoPreview('')
      syncStoredUser(data.user, data.profile?.profilePhoto)
      setSuccess('Profile updated successfully.')
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to update your profile.')
    } finally {
      setSaving(false)
    }
  }

  const currentPhoto = role === 'doctor'
    ? (doctorPhotoPreview || doctorForm.profilePhoto)
    : (patientPhotoPreview || patientForm.profilePhoto)
  const currentInitial = user?.name?.charAt(0)?.toUpperCase() || 'C'

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#eff6ff_0%,_#f0fdf4_100%)] px-6">
        <p className="text-slate-600">Loading your profile...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_25%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_40%,_#f0fdf4_100%)] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl shadow-sky-100/70 backdrop-blur">
          <div className="bg-[linear-gradient(135deg,_#0f172a,_#0284c7,_#16a34a)] px-8 py-10 text-white">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {currentPhoto ? (
                <img src={currentPhoto} alt={user?.name} className="h-24 w-24 rounded-full border-4 border-white/30 object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20 bg-white/10 text-3xl font-bold text-white">
                  {currentInitial}
                </div>
              )}

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-100">My Profile</p>
                <h1 className="mt-3 text-4xl font-bold tracking-tight">{user?.name}</h1>
                <p className="mt-2 text-base text-sky-50">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-8">
            {error ? <p className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            {success ? <p className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

            {role === 'patient' ? (
              <form onSubmit={handlePatientSubmit} className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
                    <input type="text" value={user?.name || ''} readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                    <input type="email" value={user?.email || ''} readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none" />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Age</label>
                    <input type="number" min="0" name="age" value={patientForm.age} onChange={handlePatientChange} placeholder="28" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
                    <input type="text" name="gender" value={patientForm.gender} onChange={handlePatientChange} placeholder="Female" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Mobile</label>
                    <input type="text" name="mobile" value={patientForm.mobile} onChange={handlePatientChange} placeholder="+91 9876543210" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Blood Group</label>
                    <input type="text" name="bloodGroup" value={patientForm.bloodGroup} onChange={handlePatientChange} placeholder="O+" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Diseases</label>
                  <input type="text" name="diseases" value={patientForm.diseases} onChange={handlePatientChange} placeholder="Diabetes, BP" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <label className="mb-3 block text-sm font-medium text-slate-700">Profile Photo</label>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {patientPhotoPreview || patientForm.profilePhoto ? (
                      <img src={patientPhotoPreview || patientForm.profilePhoto} alt={user?.name} className="h-20 w-20 rounded-full object-cover shadow-md" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#2563eb,_#16a34a)] text-2xl font-bold text-white">
                        {currentInitial}
                      </div>
                    )}
                    <div className="flex-1">
                      <input type="file" accept=".jpg,.jpeg,.png,image/png,image/jpeg" onChange={handlePatientPhotoChange} className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-sky-100 file:px-4 file:py-2 file:font-semibold file:text-sky-700 hover:file:bg-sky-200" />
                      <p className="mt-2 text-xs text-slate-500">Upload a JPG or PNG image up to 2MB.</p>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#0284c7,_#16a34a)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70">
                  {saving ? 'Saving changes...' : 'Save Changes'}
                </button>
              </form>
            ) : null}

            {role === 'doctor' ? (
              <form onSubmit={handleDoctorSubmit} className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
                    <input type="text" value={user?.name || ''} readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                    <input type="email" value={user?.email || ''} readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none" />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Specialization</label>
                    <input type="text" name="specialization" value={doctorForm.specialization} onChange={handleDoctorChange} placeholder="Cardiology" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Experience</label>
                    <input type="number" min="0" name="experience" value={doctorForm.experience} onChange={handleDoctorChange} placeholder="8" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Qualification</label>
                  <input type="text" name="qualification" value={doctorForm.qualification} onChange={handleDoctorChange} placeholder="MBBS, MD" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">About</label>
                  <textarea name="about" rows="5" value={doctorForm.about} onChange={handleDoctorChange} placeholder="Share your professional background and care approach." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <label className="mb-3 block text-sm font-medium text-slate-700">Profile Photo</label>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {doctorPhotoPreview || doctorForm.profilePhoto ? (
                      <img src={doctorPhotoPreview || doctorForm.profilePhoto} alt={user?.name} className="h-20 w-20 rounded-full object-cover shadow-md" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#2563eb,_#16a34a)] text-2xl font-bold text-white">
                        {currentInitial}
                      </div>
                    )}
                    <div className="flex-1">
                      <input type="file" accept=".jpg,.jpeg,.png,image/png,image/jpeg" onChange={handleDoctorPhotoChange} className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-sky-100 file:px-4 file:py-2 file:font-semibold file:text-sky-700 hover:file:bg-sky-200" />
                      <p className="mt-2 text-xs text-slate-500">Upload a JPG or PNG image up to 2MB.</p>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#0284c7,_#16a34a)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70">
                  {saving ? 'Saving changes...' : 'Save Changes'}
                </button>
              </form>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}

export default Profile
