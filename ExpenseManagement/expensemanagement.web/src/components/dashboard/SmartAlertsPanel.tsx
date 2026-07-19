import type { AlertDto } from "@/Types";
import { AlertTriangle, CheckCircle, Info, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

const CONFIG = {
  warning: {
    wrap: "bg-amber-50 border-amber-100",
    icon: "text-amber-500",
    msg: "text-amber-800",
    Icon: AlertTriangle,
  },
  success: {
    wrap: "bg-emerald-50 border-emerald-100",
    icon: "text-emerald-500",
    msg: "text-emerald-800",
    Icon: CheckCircle,
  },
  info: {
    wrap: "bg-blue-50 border-blue-100",
    icon: "text-blue-500",
    msg: "text-blue-800",
    Icon: Info,
  },
  danger: {
    wrap: "bg-red-50 border-red-100",
    icon: "text-red-500",
    msg: "text-red-800",
    Icon: AlertTriangle,
  },
};

type SmartAlertsPanelProps = { alerts: AlertDto[] };

export function SmartAlertsPanel({ alerts }: SmartAlertsPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-800">
          {t("dashboard.smartAlerts.title")}
        </h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        {t("dashboard.smartAlerts.subtitle")}
      </p>

      {/* Empty state */}
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-6 text-center">
          <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-gray-600">
            {t("dashboard.smartAlerts.allClear")}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {t("dashboard.smartAlerts.noIssues")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map((alert, i) => {
            const c = CONFIG[alert.type] ?? CONFIG.info;
            return (
              <div
                key={i}
                className={`flex items-start gap-3 px-3.5 py-3 rounded-xl border ${c.wrap}`}
              >
                <c.Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${c.icon}`} />
                <p className={`text-xs leading-relaxed ${c.msg}`}>
                  {alert.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
