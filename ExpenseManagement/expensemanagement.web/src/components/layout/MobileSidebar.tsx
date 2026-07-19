import { Link, useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { navItems } from "./Sidebar";

export default function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { location } = useRouterState();
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="Close navigation"
      />

      <aside className="absolute inset-y-0 start-0 flex h-dvh w-[min(19rem,86vw)] flex-col overflow-hidden border-e border-border bg-sidebar shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/app-logo.svg"
              alt="Expense Management"
              className="h-10 w-10 shrink-0 rounded-xl"
            />
            <span className="truncate font-bold text-sidebar-foreground">
              Expense Manager
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-sidebar-accent"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <div className="flex flex-col gap-1.5 pb-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === "/dashboard"
                  ? location.pathname === "/dashboard"
                  : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent"
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
    </div>
  );
}
