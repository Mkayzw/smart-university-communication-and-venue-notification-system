export const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-border/70 bg-white/70 p-6 shadow-inner shadow-brand-500/5 backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </div>
  )
}
