// Full-screen card shared by the auth pages; it sets its own color tokens so it stays readable under any theme.
export function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-8 text-[#0F2537]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/" aria-label="Poultry Manager homepage"><img className="mx-auto mb-5 h-20 w-auto object-contain" src="https://media.base44.com/images/public/6b061182a1600b9474d20b36/bafda81549edc84979539273b58a4939_poultry-manager-logo-transparent.png" alt="Poultry Manager"/></a>
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F2537]">
            <Icon className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-sm">{children}</div>
        {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
      </div>
    </div>
  );
}