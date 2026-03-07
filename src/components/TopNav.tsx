import { Menu, Download, Sun, Moon } from "lucide-react";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useTheme } from "@/hooks/use-theme";
import { useState, useEffect } from "react";

interface Props {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: Props) {
  const settings = useAppSettings();
  const { dark, toggle } = useTheme();
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      setInstallPrompt(null);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">
            {settings.appName || "LMS"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {installPrompt && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground"
            >
              <Download className="h-4 w-4" />
              Install
            </button>
          )}
          <button onClick={toggle} className="p-2 text-foreground rounded-md">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
