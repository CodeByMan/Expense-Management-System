import MobileSidebar from "@/components/layout/MobileSidebar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuth } from "@/context/AuthContext";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard")({ component: DashboardLayout });

function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: "/login", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <MobileSidebar open={open} onClose={() => setOpen(false)} />

      <div className="flex min-h-dvh min-w-0 flex-col lg:ps-72">
        <Topbar onMenuClick={() => setOpen(true)} />
        <main className="min-w-0 flex-1 overflow-x-hidden bg-muted/40 p-4 sm:p-6 lg:p-8 xl:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
