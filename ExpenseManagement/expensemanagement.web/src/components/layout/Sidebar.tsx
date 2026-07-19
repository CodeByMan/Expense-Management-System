import { ROUTES } from "@/lib/routes";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarClock,
  LayoutGrid,
  LineChart,
  ReceiptText,
  Settings,
  Target,
  WalletMinimal,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export const navItems = [
  { key: "nav.dashboard", to: ROUTES.DASHBOARD, icon: LayoutGrid },
  { key: "nav.categories", to: ROUTES.CATEGORIES, icon: ReceiptText },
  { key: "nav.expenses", to: ROUTES.EXPENSES, icon: WalletMinimal },
  { key: "nav.reports", to: ROUTES.REPORTS, icon: BarChart3 },
  { key: "nav.analytics", to: ROUTES.ANALYSIS, icon: LineChart },
  { key: "nav.savingGoal", to: ROUTES.SAVINGS, icon: Target },
  { key: "nav.recurring", to: ROUTES.RECURRING, icon: CalendarClock },
  { key: "nav.settings", to: ROUTES.SETTINGS, icon: Settings },
];

export function Sidebar() {
  const { location } = useRouterState();
  const { t } = useTranslation();

  return (
    <aside className="fixed inset-y-0 start-0 z-40 hidden h-dvh w-72 flex-col overflow-hidden border-e border-border bg-sidebar lg:flex">
      <div className="flex shrink-0 items-center gap-3 border-b border-border/70 px-6 py-7">
        <img
          src="/app-logo.svg"
          alt="Expense Management"
          className="h-12 w-12 rounded-2xl shadow-sm"
        />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold leading-none text-sidebar-foreground">
            {t("mainTitle")}
          </h1>
          <p className="mt-1 truncate text-[10px] font-bold tracking-widest text-primary">
            {t("title")}
          </p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
        <div className="flex flex-col gap-1.5 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.to === "/dashboard"
                ? location.pathname === "/dashboard"
                : item.to !== "#" && location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.key}
                to={item.to}
                className={`flex items-center gap-4 rounded-xl px-5 py-3.5 text-sm font-bold transition ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{t(item.key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
