import { Outlet } from "react-router-dom";
import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { UserSidebar } from "@/components/UserSidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userDoc } = useAuth();
  const isAdmin = userDoc?.role === "admin";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav onMenuClick={() => setSidebarOpen(true)} />
      
      {isAdmin ? (
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      ) : (
        <UserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 pb-16">
        <Outlet />
      </main>

      <BottomNav onMoreClick={() => setSidebarOpen(true)} />
    </div>
  );
}
