import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Database, Languages, MonitorCog, Moon, Palette, Sun, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import Heading from "@/components/ui/Heading";
import { useTheme } from "@/context/ThemeContext";
import { usePreferences } from "@/context/PreferencesContext";

export const Route = createFileRoute("/dashboard/settings/")({
  component: SettingsPage,
});

function ChoiceButton({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-h-28 w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary/15"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
      }`}
    >
      <span className="rounded-xl border border-border bg-background p-2.5 text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span>
      </span>
      {active && <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />}
    </button>
  );
}

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { showEmptySections, setShowEmptySections } = usePreferences();

  return (
    <div className="space-y-6">
      <Heading HeadTitle={t("settings.title")} SubTitle={t("settings.subtitle")} />

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-xl bg-primary/10 p-2.5 text-primary"><Palette className="h-5 w-5" /></span>
          <div>
            <h2 className="font-semibold text-card-foreground">{t("settings.appearance.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("settings.appearance.subtitle")}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ChoiceButton
            active={theme === "light"}
            icon={<Sun className="h-5 w-5" />}
            title={t("settings.appearance.light")}
            description={t("settings.appearance.lightHint")}
            onClick={() => setTheme("light")}
          />
          <ChoiceButton
            active={theme === "dark"}
            icon={<Moon className="h-5 w-5" />}
            title={t("settings.appearance.dark")}
            description={t("settings.appearance.darkHint")}
            onClick={() => setTheme("dark")}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-xl bg-primary/10 p-2.5 text-primary"><Languages className="h-5 w-5" /></span>
          <div>
            <h2 className="font-semibold text-card-foreground">{t("settings.language.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("settings.language.subtitle")}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ChoiceButton
            active={!i18n.language.startsWith("ar")}
            icon={<span className="text-sm font-bold">EN</span>}
            title="English"
            description={t("settings.language.englishHint")}
            onClick={() => void i18n.changeLanguage("en")}
          />
          <ChoiceButton
            active={i18n.language.startsWith("ar")}
            icon={<span className="text-sm font-bold">AR</span>}
            title="العربية"
            description={t("settings.language.arabicHint")}
            onClick={() => void i18n.changeLanguage("ar")}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-xl bg-primary/10 p-2.5 text-primary"><MonitorCog className="h-5 w-5" /></span>
          <div>
            <h2 className="font-semibold text-card-foreground">{t("settings.dashboard.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("settings.dashboard.subtitle")}</p>
          </div>
        </div>
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-border bg-background p-4">
          <span>
            <span className="block font-medium text-foreground">{t("settings.dashboard.showEmpty")}</span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{t("settings.dashboard.showEmptyHint")}</span>
          </span>
          <input
            type="checkbox"
            checked={showEmptySections}
            onChange={(event) => setShowEmptySections(event.target.checked)}
            className="mt-1 h-5 w-5 accent-primary"
          />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold text-card-foreground">{t("settings.data.title")}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("settings.data.description")}</p>
              <span className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">SQL Server</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <UserRound className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold text-card-foreground">{t("settings.profile.title")}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("settings.profile.description")}</p>
              <Link to="/dashboard/user/profile" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
                {t("settings.profile.open")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
