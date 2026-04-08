import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10 lg:px-12">
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

        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#home" className="transition hover:text-sky-700">Home</a>
          <Link to="/login" className="transition hover:text-sky-700">Login</Link>
          <Link to="/register" className="rounded-full bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-700">
            Register
          </Link>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
