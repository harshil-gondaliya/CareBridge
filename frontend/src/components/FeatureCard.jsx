function FeatureCard({ title, description, icon }) {
  return (
    <article className="group rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-200/40">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_rgba(37,99,235,0.14),_rgba(22,163,74,0.18))] text-sky-700 transition group-hover:scale-105">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
    </article>
  )
}

export default FeatureCard
