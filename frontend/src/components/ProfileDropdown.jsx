import { Link, useNavigate } from 'react-router-dom'

const redirectByRole = (role) => {
  const pathMap = {
    patient: '/patient/dashboard',
    doctor: '/doctor/appointments',
    admin: '/admin/dashboard',
  }

  return pathMap[role] || '/'
}

function ProfileDropdown({ onClose }) {
  const navigate = useNavigate()
  const storedUser = localStorage.getItem('carebridgeUser')
  let user = null

  if (storedUser) {
    try {
      user = JSON.parse(storedUser)
    } catch {
      localStorage.removeItem('carebridgeUser')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('carebridgeToken')
    localStorage.removeItem('carebridgeUser')
    window.dispatchEvent(new Event('carebridge-user-updated'))
    onClose()
    navigate('/login')
  }

  return (
    <div className="absolute right-0 top-[calc(100%+0.75rem)] w-52 overflow-hidden rounded-[1.5rem] border border-sky-100 bg-white p-2 shadow-2xl shadow-sky-100/70">
      <Link
        to={redirectByRole(user?.role)}
        onClick={onClose}
        className="flex items-center rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
      >
        Dashboard
      </Link>
      <Link
        to="/profile"
        onClick={onClose}
        className="flex items-center rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
      >
        Profile
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center rounded-2xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
      >
        Logout
      </button>
    </div>
  )
}

export default ProfileDropdown
