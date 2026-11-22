import { useState, type ReactNode } from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const handleMobileMenuClick = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleDesktopMenuClick = () => {
    setDesktopOpen((prev) => !prev);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        desktopOpen={desktopOpen}
        onClose={handleDrawerClose}
      />

      <div
        className={`flex min-h-screen min-w-0 flex-col transition-[margin] duration-300 ${
          desktopOpen ? "md:ml-[250px]" : "md:ml-0"
        }`}
      >
        <Header
          onMobileMenuClick={handleMobileMenuClick}
          onDesktopMenuClick={handleDesktopMenuClick}
          desktopOpen={desktopOpen}
        />

        <div className="h-16 shrink-0" />

        <main className="mx-auto w-full max-w-[1600px] min-w-0 flex-1 p-4 sm:p-6 md:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
