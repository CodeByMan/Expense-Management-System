type AuthLayoutProps = {
  children: React.ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <section className="hidden flex-col justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-slate-100 px-10 xl:flex xl:px-20">
        <div className="max-w-xl">
          <div className="mb-8 flex items-center gap-3">
            <img src="/app-logo.svg" alt="Expense Manager" className="h-14 w-14 rounded-2xl shadow-sm" />
            <div>
              <p className="text-lg font-bold text-emerald-800">Expense Manager</p>
              <p className="text-sm text-slate-500">Your financial companion</p>
            </div>
          </div>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-slate-900 2xl:text-7xl">
            Make every rupee <span className="text-emerald-700">accountable.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg font-light leading-relaxed text-slate-600">
            Track spending, plan monthly budgets and build savings goals with a clean PKR-first experience.
          </p>
          <div className="mt-10 w-fit rounded-2xl border-l-4 border-emerald-700 bg-white p-6 shadow-sm">
            <p className="text-xs text-slate-400">Smarter financial habits</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">One expense at a time</p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-card px-4 py-8 sm:px-6 lg:px-10">
        <div className="w-full max-w-xl">
          <div className="mb-6 flex items-center gap-3 xl:hidden">
            <img src="/app-logo.svg" alt="Expense Manager" className="h-11 w-11 rounded-xl" />
            <div>
              <p className="font-bold text-foreground">Expense Manager</p>
              <p className="text-xs text-muted-foreground">PKR personal finance dashboard</p>
            </div>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
