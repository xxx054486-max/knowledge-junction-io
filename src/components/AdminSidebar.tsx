import { Link } from "react-router-dom";
import { X, LayoutDashboard, Users, BookOpen, Video, Settings, LogOut, Sun, Moon, Download, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: Props) {
  const { logout } = useAuth();
  const { dark, toggle } = useTheme();

  if (!open) return null;

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-50" onClick={onClose} />
      <div className="fixed top-0 left-0 bottom-0 w-72 bg-background z-50 border-r border-border overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Admin Panel</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <nav className="p-2">
          <SidebarLink to="/admin" icon={LayoutDashboard} label="Dashboard" onClick={onClose} />
          <SidebarLink to="/admin/users" icon={Users} label="Users" onClick={onClose} />
          <SidebarLink to="/admin/courses" icon={BookOpen} label="Courses" onClick={onClose} />
          <SidebarLink to="/admin/videos" icon={Video} label="Videos" onClick={onClose} />
          <SidebarLink to="/admin/settings" icon={Settings} label="Settings" onClick={onClose} />

          <div className="my-2 border-t border-border" />

          <SidebarLink to="/admin/data" icon={Download} label="Import / Export Data" onClick={onClose} />

          <div className="my-2 border-t border-border" />

          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent w-full"
          >
            {dark ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
            {dark ? "Light Mode" : "Dark Mode"}
          </button>

          <div className="my-2 border-t border-border" />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-destructive hover:bg-accent w-full">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Logout</AlertDialogTitle>
                <AlertDialogDescription>Are you sure you want to logout?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </nav>
      </div>
    </>
  );
}

function SidebarLink({ to, icon: Icon, label, onClick }: { to: string; icon: any; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </Link>
  );
}
