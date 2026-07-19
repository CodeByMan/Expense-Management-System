import { Menu, Search } from "lucide-react";
import HeaderUser from "./HeaderUser";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-3 py-2 shadow-sm backdrop-blur sm:px-5 lg:min-h-20 lg:px-7">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card lg:hidden" onClick={onMenuClick} aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 items-center gap-2 lg:hidden">
          <img src="/app-logo.svg" alt="Expense Manager" className="h-9 w-9 shrink-0 rounded-xl" />
          <span className="hidden truncate text-sm font-bold text-foreground sm:block">Expense Manager</span>
        </div>
        <label className="hidden min-w-0 max-w-xl flex-1 items-center gap-2 rounded-full border border-border bg-muted px-4 py-2.5 md:flex">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Search data or reports..." type="search" />
        </label>
      </div>
      <HeaderUser />
    </header>
  );
}
