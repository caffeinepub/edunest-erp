import { Badge } from "@/components/ui/badge";
import { Bell, DollarSign, GraduationCap, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { FeeRecord, Notice } from "../../backend";
import { backendAPI as backend } from "../../backendAPI";
import { useAuth } from "../../contexts/AuthContext";

const CARD = "bg-card rounded-2xl border border-border shadow-card p-5";

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
      // Filter fees for this student
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

  // Notices section
  if (section === "notices") {
    const studentNotices = notices.filter(
      (n) => n.targetRole === "student" || n.targetRole === "all",
    );
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <h2 className="text-xl font-bold text-foreground">Notices</h2>
        {studentNotices.length === 0 ? (
          <div
            className={`${CARD} text-center py-10`}
            data-ocid="student.notices.empty_state"
          >
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notices yet.</p>
          </div>
        ) : (
          studentNotices.map((n) => (
            <motion.div
              key={n.id}
              className={CARD}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-semibold text-foreground">{n.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {n.content}
              </p>
            </motion.div>
          ))
        )}
      </div>
    );
  }

  // Fees section
  if (section === "fees") {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <h2 className="text-xl font-bold text-foreground">Fee Details</h2>
        {feeRecords.length === 0 ? (
          <div
            className={`${CARD} text-center py-10`}
            data-ocid="student.fees.empty_state"
          >
            <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No fee records found.
            </p>
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

  // Default dashboard
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
            <div
              className="text-center py-6"
              data-ocid="student.dashboard.notices.empty_state"
            >
              <p className="text-sm text-muted-foreground">No notices yet.</p>
            </div>
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
            <div
              className="text-center py-6"
              data-ocid="student.dashboard.fees.empty_state"
            >
              <p className="text-sm text-muted-foreground">
                No fee records found.
              </p>
            </div>
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
