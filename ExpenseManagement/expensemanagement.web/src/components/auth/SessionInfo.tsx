import { useQuery } from "@tanstack/react-query";
import { getUserSessionsApi } from "@/api/auth";
import type { UserSession } from "@/Types";
import { Monitor, Smartphone, Tablet, Wifi, Clock } from "lucide-react";

function DeviceIcon({ type }: { type: string }) {
  if (type === "Mobile") return <Smartphone size={15} className="text-gray-400" />;
  if (type === "Tablet") return <Tablet size={15} className="text-gray-400" />;
  return <Monitor size={15} className="text-gray-400" />;
}

export function SessionInfo() {
  const { data: sessions = [], isPending } = useQuery({
    queryKey: ["user-sessions"],
    queryFn: getUserSessionsApi,
  });

  if (isPending) return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
      <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
      {[1, 2].map((i) => (
        <div key={i} className="h-14 bg-slate-100 rounded-xl mb-3" />
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <Wifi size={16} className="text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-800">Login Sessions</h3>
      </div>

      <div className="flex flex-col gap-3">
        {sessions.map((session: UserSession) => (
          <div
            key={session.id}
            className={`flex items-center gap-4 p-4 rounded-xl border transition ${
              session.isActive
                ? "bg-green-50 border-green-200"
                : "bg-slate-50 border-slate-100"
            }`}
          >
            {/* Device icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              session.isActive ? "bg-green-100" : "bg-slate-100"
            }`}>
              <DeviceIcon type={session.deviceInfo} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-medium text-gray-800">
                  {session.browser} · {session.os}
                </p>
                {session.isActive && (
                  <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">
                    Active now
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Wifi size={10} />
                  {session.ipAddress}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(session.loginAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}