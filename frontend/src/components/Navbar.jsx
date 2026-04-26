import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import ProfileDropdown from './ProfileDropdown'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const syncUserFromStorage = () => {
      const storedUser = localStorage.getItem('carebridgeUser')

      if (!storedUser) {
        setUser(null)
        return
      }

      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('carebridgeUser')
        setUser(null)
      }
    }

    const hydrateProfile = async () => {
      const token = localStorage.getItem('carebridgeToken')

      if (!token) {
        return
      }

      try {
        const { data } = await api.get('/profile/me')
        const mergedUser = {
          ...data.user,
          profilePhoto: data.profile?.profilePhoto || '',
        }

        localStorage.setItem('carebridgeUser', JSON.stringify(mergedUser))
        setUser(mergedUser)
      } catch {
        syncUserFromStorage()
      }
    }

    syncUserFromStorage()
    hydrateProfile()

    const handleUserUpdate = () => {
      syncUserFromStorage()
      setIsDropdownOpen(false)
    }

    window.addEventListener('carebridge-user-updated', handleUserUpdate)

    return () => {
      window.removeEventListener('carebridge-user-updated', handleUserUpdate)
    }
  }, [])

  const userInitial = useMemo(() => user?.name?.charAt(0)?.toUpperCase() || 'C', [user])
  const navItems = useMemo(() => {
    const commonItems = [
      { label: 'Home', to: '/' },
      { label: 'Doctors', to: '/doctors' },
    ]

    if (!user) {
      return commonItems
    }

    if (user.role === 'patient') {
      return [
        ...commonItems,
        { label: 'My Appointments', to: '/patient/dashboard' },
        { label: 'Medical Timeline', to: '/patient/timeline' },
        { label: 'Prescription Scan', to: '/patient/reports' },
        { label: 'Profile', to: '/profile' },
      ]
    }

    if (user.role === 'doctor') {
      return [
        ...commonItems,
        { label: 'Requests', to: '/doctor/appointments' },
        { label: 'Doctor Workspace', to: '/doctor/dashboard' },
        { label: 'Profile', to: '/profile' },
      ]
    }

    if (user.role === 'admin') {
      return [
        ...commonItems,
        { label: 'Admin Dashboard', to: '/admin/dashboard' },
      ]
    }

    return commonItems
  }, [user])

  const currentPageLabel = useMemo(() => {
    const matched = navItems.find((item) => isNavItemActive(item.to, location.pathname))

    return matched?.label || 'CareBridge'
  }, [location.pathname, navItems])

  const navLinkClassName = (isActive) => `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-[linear-gradient(135deg,_#dbeafe,_#dcfce7)] text-slate-950 shadow-sm'
      : 'text-slate-600 hover:bg-white hover:text-sky-700'
  }`

  function isNavItemActive(targetPath, currentPath) {
    if (targetPath === '/') {
      return currentPath === '/'
    }

    if (targetPath === '/doctors') {
      return currentPath === '/doctors' || currentPath.startsWith('/doctor/')
    }

    return currentPath.startsWith(targetPath)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/75 backdrop-blur-xl">
      <nav className="mx-auto max-w-7xl px-6 py-4 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#2563eb,_#16a34a)] text-white shadow-lg shadow-sky-200">
            <svg viewBox="0 0 24 24" className="h-6 w-6">
              <path fill="currentColor" d="M19 8h-3V5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v3H5a1 1 0 0 0 0 2h3v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3h3a1 1 0 1 0 0-2" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-slate-950">CareBridge</p>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Digital Healthcare</p>
          </div>
        </Link>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 p-1 shadow-lg shadow-sky-100/50">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className={navLinkClassName(isNavItemActive(item.to, location.pathname))}>
                {item.label}
              </Link>
            ))}
          </div>

          {user ? (
            <>
              <div className="rounded-full border border-emerald-100 bg-emerald-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                {currentPageLabel}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((current) => !current)}
                  className="flex items-center gap-3 rounded-full border border-sky-100 bg-white px-2 py-2 shadow-lg shadow-sky-100/60 transition hover:-translate-y-0.5"
                >
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#2563eb,_#16a34a)] text-sm font-bold text-white">
                      {userInitial}
                    </div>
                  )}
                  <div className="pr-3 text-left">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{user.role}</p>
                  </div>
                </button>

                {isDropdownOpen ? (
                  <ProfileDropdown onClose={() => setIsDropdownOpen(false)} />
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={navLinkClassName(location.pathname === '/login')}>Login</Link>
              <Link to="/register" className="rounded-full bg-[linear-gradient(135deg,_#0284c7,_#16a34a)] px-5 py-2.5 font-semibold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5">
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-sky-700 lg:hidden"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            {isMobileMenuOpen ? (
              <path fill="currentColor" d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.7 2.88 18.3 9.17 12 2.88 5.71 4.29 4.3l6.3 6.29 6.29-6.3z" />
            ) : (
              <path fill="currentColor" d="M4 7h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
            )}
          </svg>
        </button>
        </div>

        {isMobileMenuOpen ? (
          <div className="mt-4 rounded-[1.75rem] border border-slate-200 bg-white/95 p-4 shadow-xl shadow-sky-100/60 lg:hidden">
            {user ? (
              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#2563eb,_#16a34a)] text-sm font-bold text-white">
                    {userInitial}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{user.role}</p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={navLinkClassName(isNavItemActive(item.to, location.pathname))}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {user ? (
              <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4">
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  {currentPageLabel}
                </div>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700">
                  Manage Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('carebridgeToken')
                    localStorage.removeItem('carebridgeUser')
                    window.dispatchEvent(new Event('carebridge-user-updated'))
                    setIsMobileMenuOpen(false)
                    navigate('/login')
                  }}
                  className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700">
                  Login
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="rounded-2xl bg-[linear-gradient(135deg,_#0284c7,_#16a34a)] px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-sky-100 transition hover:-translate-y-0.5">
                  Register
                </Link>
              </div>
            )}
          </div>
        ) : null}
      </nav>
    </header>
  )
}

export default Navbar
