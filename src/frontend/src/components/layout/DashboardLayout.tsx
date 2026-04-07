import { type ReactNode, useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: (activeSection: string) => ReactNode;
  defaultSection?: string;
  pageTitle?: string;
  isDark: boolean;
  onToggleDark: () => void;
}

export function DashboardLayout({
  children,
  defaultSection = "dashboard",
  pageTitle = "Dashboard",
  isDark,
  onToggleDark,
}: DashboardLayoutProps) {
  const [activeSection, setActiveSection] = useState(defaultSection);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60 xl:ml-64 overflow-hidden">
        <Navbar
          isDark={isDark}
          onToggleDark={onToggleDark}
          pageTitle={pageTitle}
        />
        <main className="flex-1 overflow-y-auto">
          {children(activeSection)}
        </main>
        <footer className="border-t border-border py-3 px-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Made by Vikas Sirvi | Powered by Motoko
          on the Internet Computer
        </footer>
      </div>
    </div>
  );
}
