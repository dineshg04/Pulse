import { LayoutDashboard, Bug, Activity } from "lucide-react";

import { NavLink } from "react-router-dom";

interface SidebarProps {
  mobileOpen: boolean;
  desktopOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    label: "Issues",
    icon: Bug,
    path: "/issues",
  },
];

const drawerWidth = 250;

function Sidebar({ mobileOpen, desktopOpen, onClose }: SidebarProps) {
  const drawerContent = (
    <div className="flex h-full flex-col bg-sidebar text-foreground transition-colors duration-200">
      {/* Logo */}
      <div className="flex h-[72px] shrink-0 items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-[0_4px_12px_rgba(99,91,255,0.25)]">
          <Activity size={20} />
        </div>

        <span className="text-xl font-extrabold tracking-[-0.5px]">Pulse</span>

        <div className="ml-auto rounded-md bg-muted px-2 py-1">
          <span className="text-xs font-semibold text-muted-foreground">
            MONITOR
          </span>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Navigation */}
      <div className="px-4 pt-6">
        <p className="px-3 text-xs font-bold tracking-[1px] text-muted-foreground">
          WORKSPACE
        </p>

        <nav className="mt-3 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `mb-2 flex min-h-[46px] items-center gap-[10px] rounded-lg px-3 text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 font-bold text-primary"
                      : "font-medium text-foreground hover:translate-x-[3px] hover:bg-muted"
                  }`
                }
              >
                <span className="flex min-w-[38px] items-center">
                  <Icon size={22} />
                </span>

                <span className="text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="mt-auto p-4">
        <div className="mb-4 border-t border-border" />

        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]" />

            <span className="text-xs text-foreground">Monitoring active</span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Pulse -Error Monitoring Platform
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden shrink-0 overflow-hidden transition-transform duration-300 md:block ${
          desktopOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: drawerWidth }}
      >
        {drawerContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onClose}
          />

          <aside
            className="fixed inset-y-0 left-0 z-50 md:hidden"
            style={{ width: drawerWidth }}
          >
            {drawerContent}
          </aside>
        </>
      )}
    </>
  );
}

export default Sidebar;
