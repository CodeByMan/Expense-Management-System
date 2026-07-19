import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Languages, LogOut, Moon, Settings, Sun, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useSignalR } from "@/context/SignalRContext";
import { useTheme } from "@/context/ThemeContext";
import { useAuthActions } from "@/hooks/useAuthActions";
import { resolveAvatarUrl } from "@/lib/avatar";

export default function HeaderUser() {
  const { i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { logout, isLoggingOut } = useAuthActions();
  const { notifications, clearNotifications } = useSignalR();

  const [langOpen, setLangOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(target)) setShowNotifications(false);
      if (langRef.current && !langRef.current.contains(target)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const isArabic = i18n.language === "ar";
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.documentElement.lang = isArabic ? "ar" : "en";
  }, [i18n.language]);

  const menuClass = "absolute right-0 mt-3 rounded-xl border border-border bg-card text-card-foreground shadow-xl overflow-hidden z-50";
  const controlClass = "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-border bg-card hover:bg-muted transition";

  return (
    <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
      <div ref={langRef} className="relative hidden sm:block">
        <button
          onClick={() => setLangOpen((value) => !value)}
          className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-medium hover:bg-muted"
          aria-label="Change language"
        >
          <Languages size={16} />
          <span>{i18n.language === "ar" ? "AR" : "EN"}</span>
          <ChevronDown size={13} className={langOpen ? "rotate-180 transition" : "transition"} />
        </button>
        {langOpen && (
          <div className={`${menuClass} w-36 py-1`}>
            {[
              ["en", "English"],
              ["ar", "العربية"],
            ].map(([code, label]) => (
              <button
                key={code}
                onClick={() => { void i18n.changeLanguage(code); setLangOpen(false); }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-muted ${i18n.language === code ? "bg-muted font-semibold" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={toggleTheme} className={controlClass} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="relative" ref={notificationRef}>
        <button onClick={() => setShowNotifications((value) => !value)} className={`relative ${controlClass}`} aria-label="Notifications">
          <Bell size={18} />
          {notifications.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-card bg-red-500 px-1 text-[10px] font-bold text-white">
              {notifications.length}
            </span>
          )}
        </button>
        {showNotifications && (
          <div className={`${menuClass} w-[min(18rem,calc(100vw-1rem))]`}>
            <div className="flex items-center justify-between border-b border-border px-4 py-2 text-sm font-medium">
              <span>Notifications</span>
              {notifications.length > 0 && <button onClick={clearNotifications} className="text-xs text-primary hover:underline">Clear</button>}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
              ) : notifications.map((note, index) => (
                <div key={`${note}-${index}`} className="border-b border-border px-4 py-3 last:border-0 hover:bg-muted">
                  <p className="text-sm">{note}</p>
                  <span className="text-[10px] text-muted-foreground">Now</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div ref={dropdownRef} className="relative min-w-0">
        <button onClick={() => setOpen((value) => !value)} className="flex min-w-0 items-center gap-2 rounded-full p-0.5 hover:bg-muted sm:pr-2" aria-label="Open user menu">
          <img
            src={resolveAvatarUrl(user?.profileImageUrl)}
            alt={user?.userName || "Profile"}
            className="h-9 w-9 rounded-full border border-border object-cover sm:h-10 sm:w-10"
          />
          <span className="hidden max-w-32 truncate text-sm font-medium lg:block">{user?.userName}</span>
          <ChevronDown size={15} className={`hidden sm:block transition ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className={`${menuClass} w-52 py-1`}>
            <div className="border-b border-border px-4 py-3 sm:hidden">
              <p className="truncate text-sm font-semibold">{user?.userName}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Link to="/dashboard/user/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted">
              <User size={16} /> Profile
            </Link>
            <Link to="/dashboard/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted">
              <Settings size={16} /> Settings
            </Link>
            <button
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-2 border-t border-border px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            >
              <LogOut size={16} /> {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
