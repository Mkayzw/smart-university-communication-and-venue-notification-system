const tones = {
  success: 'bg-brand-100 text-brand-700 border-brand-200',
  info: 'bg-slate-100 text-slate-600 border-slate-200',
  warning: 'bg-accent-100 text-accent-700 border-accent-200'
}

export const StatusPill = ({ tone = 'info', children }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tones[tone] || tones.info}`}
    >
      {children}
    </span>
  )
}
