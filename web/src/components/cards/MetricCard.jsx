export const MetricCard = ({ label, value, delta, tone = 'brand' }) => {
  const toneStyles = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200 shadow-brand-500/10',
    accent: 'bg-accent-50 text-accent-700 border-accent-200 shadow-accent-500/10',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200 shadow-slate-500/10'
  }

  return (
    <div className={`rounded-3xl border bg-white/90 p-5 shadow-soft backdrop-blur ${toneStyles[tone]}`}>
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-3 flex items-baseline gap-3">
        <p className="text-3xl font-semibold text-slate-900">{value}</p>
        {delta ? <span className="text-xs font-semibold text-brand-600">{delta}</span> : null}
      </div>
    </div>
  )
}
