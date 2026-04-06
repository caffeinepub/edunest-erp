import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { FeeManagerDashboard } from "./pages/feeManager/FeeManagerDashboard";
import { PrincipalDashboard } from "./pages/principal/PrincipalDashboard";
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { SuperAdminDashboard } from "./pages/superAdmin/SuperAdminDashboard";
import { TeacherDashboard } from "./pages/teacher/TeacherDashboard";

const pageTitles: Record<string, Record<string, string>> = {
  student: {
    dashboard: "Student Dashboard",
    attendance: "Attendance",
    assignments: "Assignments",
    fees: "Fee Details",
    notices: "Notices",
    exams: "Exam Schedule",
    documents: "Documents",
  },
  teacher: {
    dashboard: "Teacher Dashboard",
    attendance: "Mark Attendance",
    notes: "Upload Notes",
    assignments: "Assignments",
    notices: "Post Notice",
    exams: "Exam Schedule",
  },
  feeManager: {
    dashboard: "Fee Management",
    records: "Fee Records",
    payments: "Add Payment",
    reports: "Reports",
  },
  principal: {
    dashboard: "Principal Dashboard",
    students: "Students Overview",
    teachers: "Teacher Activities",
    attendance: "Attendance Analytics",
    fees: "Fee Reports",
    notices: "Notice Board",
  },
  admin: {
    dashboard: "Admin Dashboard",
    users: "User Management",
    students: "Student Management",
    departments: "Departments",
    notices: "Notices",
    settings: "System Settings",
    security: "Password Reset",
  },
  superAdmin: {
    dashboard: "Platform Dashboard",
    colleges: "Colleges",
    admins: "Administrators",
    settings: "Platform Settings",
  },
};

function AppContent() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("erp_theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("erp_theme", isDark ? "dark" : "light");
  }, [isDark]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading EduNest ERP…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Login />
        </motion.div>
      </AnimatePresence>
    );
  }

  const renderDashboard = (section: string) => {
    switch (user.role) {
      case "student":
        return <StudentDashboard section={section} />;
      case "teacher":
        return <TeacherDashboard section={section} />;
      case "feeManager":
        return <FeeManagerDashboard section={section} />;
      case "principal":
        return <PrincipalDashboard section={section} />;
      case "admin":
        return <AdminDashboard section={section} />;
      case "superAdmin":
        return <SuperAdminDashboard section={section} />;
      default:
        return <div className="p-6">Unknown role</div>;
    }
  };

  const roleTitles = pageTitles[user.role] ?? {};

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={user.userId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="h-screen"
      >
        <DashboardLayout
          isDark={isDark}
          onToggleDark={() => setIsDark((v) => !v)}
          pageTitle={roleTitles.dashboard ?? "Dashboard"}
        >
          {(activeSection) => (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="min-h-full"
              >
                {renderDashboard(activeSection)}
              </motion.div>
            </AnimatePresence>
          )}
        </DashboardLayout>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}
