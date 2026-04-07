import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bell,
  Calendar,
  ClipboardList,
  DollarSign,
  FileText,
  GraduationCap,
  Loader2,
  UserCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { FeeRecord, Notice } from "../../backend";
import { backendAPI as backend } from "../../backendAPI";
import { useAuth } from "../../contexts/AuthContext";

const CARD = "bg-card rounded-2xl border border-border shadow-card p-5";

function EmptyState({
  icon: Icon,
  title,
  subtitle,
  ocid,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  ocid?: string;
}) {
  return (
    <div className="text-center py-12" data-ocid={ocid}>
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export function StudentDashboard({ section }: { section: string }) {
  const { user } = useAuth();
  const token = user?.token ?? "";
  const collegeId = user?.collegeId ?? "";

  const [notices, setNotices] = useState<Notice[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token || !collegeId) return;
    setLoading(true);
    try {
      const [nts, fees] = await Promise.all([
        backend.listNotices(token, collegeId).catch(() => []),
        backend.listFeeRecords(token, collegeId).catch(() => []),
      ]);
      setNotices(nts);
      setFeeRecords(fees.filter((f) => f.studentId === user?.userId));
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [token, collegeId, user?.userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-64"
        data-ocid="student.dashboard.loading_state"
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Attendance ──
  if (section === "attendance") {
    const attendanceNotices = notices.filter(
      (n) =>
        n.title.toLowerCase().includes("attendance") ||
        n.title.toLowerCase().includes("present") ||
        n.title.toLowerCase().includes("absent"),
    );
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Attendance</h2>
        </div>
        <div className={CARD}>
          <p className="text-sm text-muted-foreground mb-4">
            Your attendance records will appear here once your teacher marks
            them.
          </p>
          {attendanceNotices.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No attendance records yet"
              subtitle="Your teacher will post attendance updates here."
              ocid="student.attendance.empty_state"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Date", "Subject / Notes", "Details"].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 pr-4 text-muted-foreground font-medium text-xs"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendanceNotices.map((n, i) => (
                    <tr
                      key={n.id}
                      className="border-b border-border last:border-0"
                      data-ocid={`student.attendance.item.${i + 1}`}
                    >
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {new Date(
                          Number(n.createdAt) / 1_000_000,
                        ).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 font-medium text-foreground">
                        {n.title}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground max-w-xs truncate">
                        {n.content}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Assignments ──
  if (section === "assignments") {
    const assignmentNotices = notices.filter(
      (n) =>
        n.title.toLowerCase().includes("assignment") ||
        (n.targetRole === "student" && n.title.toLowerCase().includes("task")),
    );
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Assignments</h2>
        </div>
        {assignmentNotices.length === 0 ? (
          <div className={CARD}>
            <EmptyState
              icon={ClipboardList}
              title="No assignments posted yet"
              subtitle="Your teacher will post assignments here. Check back soon."
              ocid="student.assignments.empty_state"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {assignmentNotices.map((n, i) => (
              <motion.div
                key={n.id}
                className={CARD}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                data-ocid={`student.assignments.item.${i + 1}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ClipboardList className="w-4 h-4 text-primary flex-shrink-0" />
                      <h3 className="font-semibold text-foreground">
                        {n.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {n.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Posted by Teacher ·{" "}
                      {new Date(
                        Number(n.createdAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs flex-shrink-0">
                    Assignment
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Exams ──
  if (section === "exams") {
    const examNotices = notices.filter(
      (n) =>
        n.title.toLowerCase().includes("exam") ||
        n.title.toLowerCase().includes("schedule") ||
        n.title.toLowerCase().includes("test"),
    );
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Exam Schedule</h2>
        </div>
        {examNotices.length === 0 ? (
          <div className={CARD}>
            <EmptyState
              icon={Calendar}
              title="No exam schedule yet"
              subtitle="Your exam schedule will appear here once published."
              ocid="student.exams.empty_state"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {examNotices.map((n, i) => (
              <motion.div
                key={n.id}
                className={CARD}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                data-ocid={`student.exams.item.${i + 1}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                      <h3 className="font-semibold text-foreground">
                        {n.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {n.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(
                        Number(n.createdAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="border-0 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs flex-shrink-0">
                    Exam
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Documents ──
  if (section === "documents") {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Documents &amp; Announcements
          </h2>
        </div>
        {notices.length === 0 ? (
          <div className={CARD}>
            <EmptyState
              icon={FileText}
              title="No documents available yet"
              subtitle="All announcements and documents will be listed here."
              ocid="student.documents.empty_state"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {notices.map((n, i) => (
              <motion.div
                key={n.id}
                className={`${CARD} flex flex-col gap-3`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                data-ocid={`student.documents.item.${i + 1}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {n.content}
                    </p>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      data-ocid={`student.documents.view.button.${i + 1}`}
                    >
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{n.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {n.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                        <Badge className="border-0 bg-blue-100 text-blue-700 text-xs">
                          {n.targetRole}
                        </Badge>
                        <span>
                          {new Date(
                            Number(n.createdAt) / 1_000_000,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Notices ──
  if (section === "notices") {
    const studentNotices = notices.filter(
      (n) => n.targetRole === "student" || n.targetRole === "all",
    );
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Notices</h2>
        </div>
        {studentNotices.length === 0 ? (
          <div className={CARD}>
            <EmptyState
              icon={Bell}
              title="No notices yet"
              subtitle="Notices from your college administration will appear here."
              ocid="student.notices.empty_state"
            />
          </div>
        ) : (
          studentNotices.map((n, i) => (
            <motion.div
              key={n.id}
              className={CARD}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              data-ocid={`student.notices.item.${i + 1}`}
            >
              <h3 className="font-semibold text-foreground">{n.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {n.content}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(Number(n.createdAt) / 1_000_000).toLocaleDateString()}
              </p>
            </motion.div>
          ))
        )}
      </div>
    );
  }

  // ── Fees ──
  if (section === "fees") {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Fee Details</h2>
        </div>
        {feeRecords.length === 0 ? (
          <div className={CARD}>
            <EmptyState
              icon={DollarSign}
              title="No fee records found"
              subtitle="Your fee details will appear here once your admin sets them up."
              ocid="student.fees.empty_state"
            />
          </div>
        ) : (
          feeRecords.map((f) => (
            <div key={f.id} className={CARD}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    Total: ₹{Number(f.amount).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Paid: ₹{Number(f.paidAmount).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Remaining: ₹
                    {(Number(f.amount) - Number(f.paidAmount)).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Due Date: {f.dueDate}
                  </p>
                </div>
                <Badge
                  className={`border-0 ${
                    f.status === "paid"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : f.status === "partial"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {f.status}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // ── Default dashboard ──
  const studentNotices = notices.filter(
    (n) => n.targetRole === "student" || n.targetRole === "all",
  );

  return (
    <div className="p-6 space-y-6">
      <motion.div
        className={`${CARD} bg-gradient-to-r from-primary/10 to-accent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <p className="text-muted-foreground text-sm">Welcome back</p>
          <h2 className="text-xl font-bold text-foreground mt-0.5">
            {user?.name}
          </h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs text-muted-foreground bg-background rounded-full px-2.5 py-1">
              Student
            </span>
            <span className="text-xs text-muted-foreground bg-background rounded-full px-2.5 py-1">
              College ID: {collegeId}
            </span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={CARD}>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Recent Notices
          </h3>
          {studentNotices.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notices yet"
              ocid="student.dashboard.notices.empty_state"
            />
          ) : (
            <div className="space-y-3">
              {studentNotices.slice(0, 4).map((n) => (
                <div
                  key={n.id}
                  className="py-2 border-b border-border last:border-0"
                >
                  <p className="text-sm font-medium text-foreground">
                    {n.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {n.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={CARD}>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Fee Summary
          </h3>
          {feeRecords.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No fee records"
              ocid="student.dashboard.fees.empty_state"
            />
          ) : (
            <div className="space-y-3">
              {feeRecords.map((f) => (
                <div
                  key={f.id}
                  className="flex justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Total: ₹{Number(f.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Paid: ₹{Number(f.paidAmount).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    className={`border-0 text-xs self-start ${
                      f.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : f.status === "partial"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {f.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
