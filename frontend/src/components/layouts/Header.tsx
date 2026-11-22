import {
  Menu,
  Sun,
  Moon,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAppTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  onMobileMenuClick: () => void;
  onDesktopMenuClick: () => void;
  desktopOpen: boolean;
}

function Header({
  onMobileMenuClick,
  onDesktopMenuClick,
  desktopOpen,
}: HeaderProps) {
  const navigate = useNavigate();

  const { mode, toggleTheme } = useAppTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl transition-[left] duration-300 ${
        desktopOpen ? "md:left-[250px]" : "md:left-0"
      }`}
    >
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-4 sm:px-6">
        {/* Mobile menu */}
        <button
          onClick={onMobileMenuClick}
          aria-label="Open navigation menu"
          className="inline-flex rounded-lg p-2 text-foreground transition-colors hover:bg-muted md:hidden"
        >
          <Menu size={21} />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          onClick={onDesktopMenuClick}
          aria-label={desktopOpen ? "Close sidebar" : "Open sidebar"}
          title={desktopOpen ? "Close sidebar" : "Open sidebar"}
          className="hidden rounded-lg p-2 text-foreground transition-colors hover:bg-muted md:inline-flex"
        >
          {desktopOpen ? (
            <PanelLeftClose size={21} />
          ) : (
            <PanelLeftOpen size={21} />
          )}
        </button>

        {/* Page branding */}
        <div className="flex min-w-0 flex-col">
          <p className="text-sm font-bold leading-[1.3] tracking-tight text-foreground">
            Monitoring Dashboard
          </p>

          <p className="hidden text-xs text-muted-foreground sm:block">
            Application error monitoring and tracking
          </p>
        </div>

        <div className="flex-1" />

        {/* User information */}
        {user && (
          <div className="hidden min-w-0 items-center gap-3 rounded-lg bg-muted px-3 py-2 sm:flex">
            <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {user.email.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="max-w-[130px] truncate text-sm font-semibold text-foreground md:max-w-[180px]">
                {user.email}
              </p>

              <p className="text-xs capitalize text-muted-foreground">
                {user.role}
              </p>
            </div>

            <span
              className={`hidden rounded-full px-2 py-1 text-[11px] font-bold capitalize lg:inline-flex ${
                user.role === "admin"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {user.role}
            </span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-all duration-200 hover:rotate-12 hover:bg-muted"
        >
          {mode === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        <div className="my-2 hidden h-8 border-l border-border sm:block" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex h-[38px] min-w-[38px] items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-danger hover:text-white sm:px-3"
        >
          <LogOut size={17} />

          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
