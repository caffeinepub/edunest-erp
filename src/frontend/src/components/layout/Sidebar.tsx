import {
  BarChart2,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  ChevronRight,
  ClipboardList,
  DollarSign,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Settings,
  Shield,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { UserRole } from "../../backend";
import { useAuth } from "../../contexts/AuthContext";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navConfig: Record<UserRole, NavItem[]> = {
  student: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "attendance", label: "Attendance", icon: UserCheck },
    { id: "assignments", label: "Assignments", icon: ClipboardList },
    { id: "fees", label: "Fee Details", icon: DollarSign },
    { id: "notices", label: "Notices", icon: Bell },
    { id: "exams", label: "Exam Schedule", icon: Calendar },
    { id: "documents", label: "Documents", icon: FileText },
  ],
  teacher: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "attendance", label: "Mark Attendance", icon: UserCheck },
    { id: "notes", label: "Upload Notes", icon: BookOpen },
    { id: "assignments", label: "Assignments", icon: ClipboardList },
    { id: "notices", label: "Post Notice", icon: Bell },
    { id: "exams", label: "Exam Schedule", icon: Calendar },
  ],
  feeManager: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "records", label: "Fee Records", icon: DollarSign },
    { id: "payments", label: "Add Payment", icon: DollarSign },
  ],
  principal: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "students", label: "Students Overview", icon: GraduationCap },
    { id: "teachers", label: "Teacher Activities", icon: Users },
    { id: "fees", label: "Fee Reports", icon: DollarSign },
    { id: "notices", label: "Notice Board", icon: Bell },
  ],
  admin: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "students", label: "Students", icon: GraduationCap },
    { id: "users", label: "User Management", icon: Users },
    { id: "notices", label: "Notices", icon: Bell },
    { id: "security", label: "Password Reset", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
  ],
  superAdmin: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "colleges", label: "Colleges", icon: Building2 },
    { id: "admins", label: "Administrators", icon: Users },
    { id: "settings", label: "Platform Settings", icon: Settings },
  ],
};

interface SidebarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;
  const items = navConfig[user.role] ?? [];

  const SidebarContent = () => (
    <div
      className="flex flex-col h-full"
      style={{
        background: "linear-gradient(180deg, #0B2A57 0%, #061A3A 100%)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">
            EduNest ERP
          </p>
          <p className="text-white/50 text-xs truncate capitalize">
            {user.role === "superAdmin"
              ? "Super Admin"
              : user.role === "feeManager"
                ? "Fee Manager"
                : user.role}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
              whileHover={{ x: isActive ? 0 : 2 }}
              whileTap={{ scale: 0.97 }}
              data-ocid={`sidebar.${item.id}.link`}
            >
              <Icon
                className={`w-4.5 h-4.5 flex-shrink-0 ${
                  isActive
                    ? "text-white"
                    : "text-white/50 group-hover:text-white"
                }`}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-white/70" />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {user.name.split(" ").slice(0, 2).join(" ")}
            </p>
            <p className="text-white/40 text-xs capitalize truncate">
              {user.role === "superAdmin"
                ? "Super Admin"
                : user.role === "feeManager"
                  ? "Fee Manager"
                  : user.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white dark:bg-card rounded-lg p-2 shadow-card"
        onClick={() => setMobileOpen((v) => !v)}
        data-ocid="sidebar.toggle"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed left-0 top-0 h-full w-64 z-50 lg:hidden"
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-white/60 hover:text-white z-10"
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-60 xl:w-64 flex-shrink-0 flex-col h-screen fixed left-0 top-0">
        <SidebarContent />
      </div>
    </>
  );
}
