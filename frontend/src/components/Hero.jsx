import { Link } from 'react-router-dom'

function Hero() {
  return (
    <section id="home" className="mx-auto max-w-7xl px-6 pb-14 pt-10 sm:px-10 lg:px-12 lg:pb-20">
      <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <span className="inline-flex rounded-full border border-sky-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700 shadow-sm">
            Smart Care Platform
          </span>
          <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Smart Healthcare,
            <span className="block bg-[linear-gradient(135deg,_#2563eb,_#16a34a)] bg-clip-text text-transparent">
              Simplified
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            Upload prescriptions, connect with doctors, and manage your health
            records in one place with a calmer, more connected digital care
            experience.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-700">
              Get Started as Patient
            </Link>
            <Link to="/register" className="inline-flex items-center justify-center rounded-full border border-emerald-300 bg-white/80 px-6 py-3.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50">
              Join as Doctor
            </Link>
          </div>

          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
            {[
              ['24/7', 'Record access'],
              ['OCR', 'Prescription scanning'],
              ['Secure', 'Role-based auth'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                <p className="text-2xl font-bold text-slate-950">{value}</p>
                <p className="mt-1 text-sm text-slate-600">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -left-6 top-8 h-24 w-24 rounded-full bg-emerald-300/50 blur-2xl" />
          <div className="absolute -right-2 top-0 h-32 w-32 rounded-full bg-sky-300/50 blur-3xl" />

          <div className="relative overflow-hidden rounded-[2.25rem] border border-white/70 bg-white/80 p-6 shadow-2xl shadow-slate-300/40 backdrop-blur-xl">
            <div className="rounded-[1.7rem] bg-[linear-gradient(180deg,_#eff6ff,_#ecfdf5)] p-6">
              <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Today&apos;s Snapshot</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">Healthy systems, happier visits</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <svg viewBox="0 0 24 24" className="h-7 w-7">
                    <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4C8.24 4 9.91 4.81 11 6.09C12.09 4.81 13.76 4 15.5 4A4.5 4.5 0 0 1 20 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
                  </svg>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-lg">
                  <p className="text-sm text-slate-300">Appointments</p>
                  <p className="mt-3 text-3xl font-bold">12</p>
                  <p className="mt-2 text-sm text-emerald-300">This week&apos;s consultations</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">OCR Queue</p>
                  <p className="mt-3 text-3xl font-bold text-slate-950">03</p>
                  <p className="mt-2 text-sm text-sky-700">Prescriptions ready for review</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Health Timeline</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">Unified patient journey</p>
                  </div>
                  <div className="h-3 w-24 rounded-full bg-slate-100">
                    <div className="h-3 w-16 rounded-full bg-[linear-gradient(90deg,_#2563eb,_#16a34a)]" />
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {[
                    ['Prescription scanned', '2 mins ago'],
                    ['Appointment booked', 'Today'],
                    ['E-prescription delivered', 'Yesterday'],
                  ].map(([title, time]) => (
                    <div key={title} className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      <div className="flex-1 rounded-xl bg-slate-50 px-4 py-3">
                        <p className="font-medium text-slate-900">{title}</p>
                        <p className="text-sm text-slate-500">{time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
