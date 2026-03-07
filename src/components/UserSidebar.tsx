import { Link } from "react-router-dom";
import { X, Home, BookOpen, User, FileText, Calendar, MessageCircle, Link as LinkIcon, Share2, Download } from "lucide-react";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function UserSidebar({ open, onClose }: Props) {
  const settings = useAppSettings();
  const { userDoc } = useAuth();

  if (!open) return null;

  const activeCourse = userDoc?.enrolledCourses?.find(
    (c) => c.courseId === userDoc.activeCourseId
  );

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: settings.appName, url: window.location.origin });
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-50" onClick={onClose} />
      <div className="fixed top-0 left-0 bottom-0 w-72 bg-background z-50 border-r border-border overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">{settings.appName || "LMS"}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <nav className="p-2">
          <SidebarLink to="/" icon={Home} label="Home" onClick={onClose} />
          <SidebarLink to="/my-courses" icon={BookOpen} label="My Courses" onClick={onClose} />
          <SidebarLink to="/profile" icon={User} label="Profile" onClick={onClose} />

          <div className="my-2 border-t border-border" />

          {activeCourse && (
            <>
              <p className="px-3 py-1 text-xs text-muted-foreground font-medium uppercase">Course</p>
              {userDoc?.enrolledCourses?.find(c => c.courseId === userDoc.activeCourseId) && (
                <>
                  <SidebarLink to={`/my-courses/${userDoc.activeCourseId}`} icon={FileText} label="All Materials" onClick={onClose} />
                </>
              )}
            </>
          )}

          {settings.usefulLinks?.length > 0 && (
            <>
              <div className="my-2 border-t border-border" />
              <p className="px-3 py-1 text-xs text-muted-foreground font-medium uppercase">Useful Links</p>
              {settings.usefulLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent"
                  onClick={onClose}
                >
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  {link.name}
                </a>
              ))}
            </>
          )}

          <div className="my-2 border-t border-border" />
          <button
            onClick={handleShare}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent w-full"
          >
            <Share2 className="h-4 w-4 text-muted-foreground" />
            Share App
          </button>
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
