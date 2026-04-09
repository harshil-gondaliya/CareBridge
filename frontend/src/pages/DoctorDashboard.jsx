import { useEffect, useState } from 'react'
import api from '../services/api'

const initialFormData = {
  specialization: '',
  experience: '',
  qualification: '',
  about: '',
  profilePhoto: '',
}

function DoctorDashboard() {
  const [formData, setFormData] = useState(initialFormData)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const syncStoredUser = (profileData) => {
    const storedUser = localStorage.getItem('carebridgeUser')

    if (!storedUser) {
      return
    }

    try {
      const parsedUser = JSON.parse(storedUser)
      localStorage.setItem('carebridgeUser', JSON.stringify({
        ...parsedUser,
        specialization: profileData.specialization,
        experience: profileData.experience,
        profilePhoto: profileData.profilePhoto || '',
      }))
      window.dispatchEvent(new Event('carebridge-user-updated'))
    } catch {
      localStorage.removeItem('carebridgeUser')
    }
  }

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/doctor/dashboard')
        const currentProfile = data.dashboard.profile

        if (currentProfile) {
          setProfile(currentProfile)
          syncStoredUser(currentProfile)
          setFormData({
            specialization: currentProfile.specialization || '',
            experience: currentProfile.experience?.toString() || '',
            qualification: currentProfile.qualification || '',
            about: currentProfile.about || '',
            profilePhoto: currentProfile.profilePhoto || '',
          })
        } else {
          setFormData((current) => ({
            ...current,
            specialization: data.dashboard.specialization || '',
            experience: data.dashboard.experience?.toString() || '',
          }))
        }
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Unable to load your doctor profile.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.specialization.trim() || !formData.experience.toString().trim()) {
      setError('Specialization and experience are required.')
      return
    }

    try {
      setSaving(true)
      const { data } = await api.post('/doctor/profile', {
        specialization: formData.specialization.trim(),
        experience: Number(formData.experience),
        qualification: formData.qualification.trim(),
        about: formData.about.trim(),
        profilePhoto: formData.profilePhoto.trim(),
      })

      setProfile(data.profile)
      syncStoredUser(data.profile)
      setFormData({
        specialization: data.profile.specialization || '',
        experience: data.profile.experience?.toString() || '',
        qualification: data.profile.qualification || '',
        about: data.profile.about || '',
        profilePhoto: data.profile.profilePhoto || '',
      })
      setSuccess('Doctor profile saved successfully.')
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to save doctor profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#eff6ff_0%,_#f0fdf4_100%)] px-6 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-sky-100 bg-white p-8 shadow-xl shadow-sky-100/60">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Doctor Workspace</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Build your public CareBridge profile</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Add the professional details patients need to trust you. Once your
            profile is reviewed by an admin, it becomes visible in the patient
            doctor directory.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Specialization</label>
                <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="Cardiology" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Experience</label>
                <input type="number" min="0" name="experience" value={formData.experience} onChange={handleChange} placeholder="8" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Qualification</label>
              <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} placeholder="MBBS, MD" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Profile Photo URL</label>
              <input type="url" name="profilePhoto" value={formData.profilePhoto} onChange={handleChange} placeholder="https://example.com/doctor-photo.jpg" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">About</label>
              <textarea name="about" rows="5" value={formData.about} onChange={handleChange} placeholder="Share your approach, expertise, and patient care philosophy." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" />
            </div>

            {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            {success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

            <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#0284c7,_#16a34a)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70">
              {saving ? 'Saving profile...' : profile ? 'Update profile' : 'Create profile'}
            </button>
          </form>
        </section>

        <aside className="rounded-[2rem] border border-emerald-100 bg-slate-950 p-8 text-white shadow-xl shadow-slate-900/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Current Profile</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Public preview</h2>
            </div>
            <span className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${profile?.isVerified ? 'bg-emerald-400/20 text-emerald-200' : 'bg-amber-400/20 text-amber-200'}`}>
              {profile?.isVerified ? 'Verified' : 'Pending review'}
            </span>
          </div>

          {loading ? (
            <p className="mt-8 text-slate-300">Loading dashboard...</p>
          ) : profile ? (
            <div className="mt-8 space-y-6">
              <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5">
                {profile.profilePhoto ? (
                  <img src={profile.profilePhoto} alt={profile.name} className="h-64 w-full object-cover" />
                ) : (
                  <div className="flex h-64 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.32),_transparent_45%),linear-gradient(135deg,_rgba(2,132,199,0.2),_rgba(22,163,74,0.2))] text-5xl font-bold text-white/80">
                    {profile.name?.charAt(0) || 'D'}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-2xl font-bold">{profile.name}</h3>
                <p className="mt-2 text-emerald-200">{profile.specialization}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Experience</p>
                  <p className="mt-2 text-lg font-semibold">{profile.experience} years</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Qualification</p>
                  <p className="mt-2 text-lg font-semibold">{profile.qualification || 'Add your credentials'}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">About</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  {profile.about || 'Tell patients about your clinical style and areas of focus.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-slate-300">
              Your profile has not been created yet. Fill the form to publish your professional details for admin review.
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}

export default DoctorDashboard
