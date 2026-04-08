import { Link } from 'react-router-dom'

const roles = [
  {
    title: 'Patient',
    description:
      'Upload reports, use OCR, book appointments, and keep your medical story organized.',
    bullets: ['Prescription uploads', 'Medical history timeline', 'Doctor chat'],
    cta: 'Start as Patient',
    accent: 'sky',
  },
  {
    title: 'Doctor',
    description:
      'Manage patients, appointments, e-prescriptions, and follow-up communication with ease.',
    bullets: ['Availability management', 'Digital prescriptions', 'Care continuity'],
    cta: 'Join as Doctor',
    accent: 'emerald',
  },
]

function RoleSelector() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:px-12">
      <div className="grid gap-6 lg:grid-cols-2">
        {roles.map((role) => (
          <article key={role.title} className="group overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-xl shadow-slate-200/70 backdrop-blur transition duration-300 hover:-translate-y-1">
            <div className={`inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${role.accent === 'sky' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {role.title}
            </div>

            <h3 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
              {role.title === 'Patient' ? 'A personal health command center' : 'A digital clinic that feels organized'}
            </h3>
            <p className="mt-4 text-base leading-8 text-slate-600">{role.description}</p>

            <div className="mt-6 space-y-3">
              {role.bullets.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-700">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${role.accent === 'sky' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4">
                      <path fill="currentColor" d="m9.55 18l-5.7-5.7l1.4-1.4l4.3 4.3l8.9-8.9l1.4 1.4z" />
                    </svg>
                  </div>
                  {item}
                </div>
              ))}
            </div>

            <Link to="/register" className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${role.accent === 'sky' ? 'bg-sky-600 text-white hover:bg-sky-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
              {role.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

export default RoleSelector
