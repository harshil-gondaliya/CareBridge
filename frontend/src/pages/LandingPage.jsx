import { Link } from 'react-router-dom'
import FeatureCard from '../components/FeatureCard'
import Hero from '../components/Hero'
import Navbar from '../components/Navbar'
import RoleSelector from '../components/RoleSelector'

const features = [
  {
    title: 'OCR Prescription Scanner',
    description:
      'Turn handwritten prescriptions into structured medicine details with one upload.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path fill="currentColor" d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m7 1.5V9h4.5zM8 13h8v1.5H8zm0 3h8v1.5H8zm0-6h3v1.5H8z" />
      </svg>
    ),
  },
  {
    title: 'Appointment Booking',
    description:
      'Book, reschedule, and track consultations without manual coordination.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path fill="currentColor" d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v13a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2h3zm13 8H4v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z" />
      </svg>
    ),
  },
  {
    title: 'Real-Time Chat',
    description:
      'Keep doctor-patient communication active for follow-ups and care updates.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path fill="currentColor" d="M12 3c5.52 0 10 3.58 10 8s-4.48 8-10 8a12 12 0 0 1-4-.67L3 21l1.8-4A7.2 7.2 0 0 1 2 11c0-4.42 4.48-8 10-8" />
      </svg>
    ),
  },
  {
    title: 'Medical History Timeline',
    description:
      'Review reports, visits, and prescriptions in one chronological health story.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path fill="currentColor" d="M11 7h2v6h4v2h-6zm1-5a10 10 0 1 1 0 20a10 10 0 0 1 0-20" />
      </svg>
    ),
  },
  {
    title: 'E-Prescriptions',
    description:
      'Doctors can create clear, digital prescriptions patients can access anytime.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path fill="currentColor" d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M8 8h8v2H8zm0 4h8v2H8zm0 4h5v2H8z" />
      </svg>
    ),
  },
  {
    title: 'Secure Data',
    description:
      'Role-based access and protected records keep sensitive healthcare data safe.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path fill="currentColor" d="M12 2l8 4v6c0 5.25-3.4 10.16-8 11.75C7.4 22.16 4 17.25 4 12V6zm0 5a3 3 0 0 0-3 3v1H8v6h8v-6h-1v-1a3 3 0 0 0-3-3m-1 4v-1a1 1 0 1 1 2 0v1z" />
      </svg>
    ),
  },
]

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-900">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),_transparent_40%),radial-gradient(circle_at_80%_20%,_rgba(22,163,74,0.24),_transparent_28%),linear-gradient(180deg,_#eff8ff_0%,_#f8fafc_42%,_#ecfdf5_100%)]" />
      <Navbar />
      <Hero />

      <main className="relative z-10">
        <RoleSelector />

        <section id="features" className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-sky-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
              Platform Features
            </span>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
              Built for the real rhythm of healthcare
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              CareBridge combines clarity for patients with practical tools for
              doctors, so care feels organized instead of fragmented.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-10 lg:px-12">
          <div className="overflow-hidden rounded-[2rem] border border-emerald-300/30 bg-[linear-gradient(135deg,_rgba(37,99,235,0.95),_rgba(22,163,74,0.92))] px-8 py-12 text-white shadow-2xl shadow-sky-900/20 sm:px-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">Ready When You Are</p>
                <h3 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                  Start your healthcare journey today
                </h3>
                <p className="mt-4 text-lg leading-8 text-emerald-50/90">
                  Create your account, log in securely, and step into a calmer,
                  connected healthcare experience.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-sky-700 transition hover:-translate-y-0.5 hover:bg-slate-100">
                  Register
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 text-sm text-slate-600 sm:px-10 md:flex-row md:items-center md:justify-between lg:px-12">
          <div>
            <p className="font-semibold text-slate-900">CareBridge</p>
            <p className="mt-2 max-w-xl">
              A digital bridge between patients, doctors, and the records that
              keep care moving.
            </p>
          </div>
          <div className="flex flex-wrap gap-6">
            <a href="#about" className="transition hover:text-sky-700">About</a>
            <a href="mailto:support@carebridge.app" className="transition hover:text-sky-700">Contact</a>
            <a href="#privacy" className="transition hover:text-sky-700">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
