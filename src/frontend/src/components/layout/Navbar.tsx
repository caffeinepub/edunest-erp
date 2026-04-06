import { Bell, ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface NavbarProps {
  isDark: boolean;
  onToggleDark: () => void;
  pageTitle: string;
}

const roleLabels: Record<string, string> = {
  student: "Student",
  teacher: "Faculty",
  feeManager: "Fee Manager",
  principal: "Principal",
  admin: "Administrator",
  superAdmin: "Super Admin",
};

const roleBadgeColors: Record<string, string> = {
  student: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  teacher:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  feeManager:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  principal:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  admin:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  superAdmin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export function Navbar({ isDark, onToggleDark, pageTitle }: NavbarProps) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-card/95 dark:bg-card/95 backdrop-blur-sm border-b border-border px-6 py-3 flex items-center gap-4">
      {/* Page title */}
      <div className="min-w-0 flex-shrink-0 hidden md:block">
        <h1 className="text-base font-semibold text-foreground truncate">
          {pageTitle}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={onToggleDark}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          data-ocid="navbar.dark_mode.toggle"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Notifications bell (UI only) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="p-2 rounded-lg hover:bg-muted transition-colors relative"
            data-ocid="navbar.notifications.button"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                className="absolute right-0 top-full mt-2 w-72 bg-card rounded-xl shadow-card-md border border-border overflow-hidden"
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                data-ocid="navbar.notifications.popover"
              >
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-semibold text-sm text-foreground">
                    Notifications
                  </p>
                </div>
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No new notifications
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
            data-ocid="navbar.profile.button"
          >
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-border"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {user.name.split(" ").slice(0, 2).join(" ")}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl shadow-card-md border border-border overflow-hidden"
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                data-ocid="navbar.profile.dropdown_menu"
              >
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-3 mb-2">
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {initials}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {user.name}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${
                          roleBadgeColors[user.role] ?? ""
                        }`}
                      >
                        {roleLabels[user.role] ?? user.role}
                      </span>
                    </div>
                  </div>
                </div>
                {user.collegeId && user.collegeId !== "" && (
                  <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
                    <p>College ID: {user.collegeId}</p>
                  </div>
                )}
                <div className="border-t border-border">
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                    data-ocid="navbar.logout.button"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
