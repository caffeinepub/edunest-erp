import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  DollarSign,
  GraduationCap,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { FeeRecord, Notice, User } from "../../backend";
import { UserRole } from "../../backend";
import { backendAPI as backend } from "../../backendAPI";
import { useAuth } from "../../contexts/AuthContext";

const CARD = "bg-card rounded-2xl border border-border shadow-card p-5";

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <motion.div
      className={`${CARD} flex items-start gap-4`}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">
          {label}
        </p>
      </div>
    </motion.div>
  );
}

export function PrincipalDashboard({ section }: { section: string }) {
  const { user } = useAuth();
  const token = user?.token ?? "";
  const collegeId = user?.collegeId ?? "";

  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token || !collegeId) return;
    setLoading(true);
    try {
      const [studs, tchs, nts, fees] = await Promise.all([
        backend.listUsers(token, collegeId, UserRole.student).catch(() => []),
        backend.listUsers(token, collegeId, UserRole.teacher).catch(() => []),
        backend.listNotices(token, collegeId).catch(() => []),
        backend.listFeeRecords(token, collegeId).catch(() => []),
      ]);
      setStudents(studs);
      setTeachers(tchs);
      setNotices(nts);
      setFeeRecords(fees);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [token, collegeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (section === "students") {
    return (
      <div className="p-6 space-y-5">
        <h2 className="text-xl font-bold text-foreground">Students Overview</h2>
        <div className={CARD}>
          {loading ? (
            <div
              className="flex items-center justify-center py-10"
              data-ocid="principal.students.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : students.length === 0 ? (
            <div
              className="text-center py-10"
              data-ocid="principal.students.empty_state"
            >
              <GraduationCap className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No students yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["#", "Name", "Username", "Status"].map((h) => (
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
                  {students.map((s, i) => (
                    <tr
                      key={s.id}
                      className="border-b border-border last:border-0"
                      data-ocid={`principal.students.row.${i + 1}`}
                    >
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-foreground">
                        {s.name}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">
                        {s.username}
                      </td>
                      <td className="py-2.5">
                        <Badge
                          className={`border-0 text-xs ${s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {s.isActive ? "Active" : "Inactive"}
                        </Badge>
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

  if (section === "teachers") {
    return (
      <div className="p-6 space-y-5">
        <h2 className="text-xl font-bold text-foreground">Teachers</h2>
        <div className={CARD}>
          {loading ? (
            <div
              className="flex items-center justify-center py-10"
              data-ocid="principal.teachers.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : teachers.length === 0 ? (
            <div
              className="text-center py-10"
              data-ocid="principal.teachers.empty_state"
            >
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No teachers yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["#", "Name", "Username", "Email", "Status"].map((h) => (
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
                  {teachers.map((t, i) => (
                    <tr
                      key={t.id}
                      className="border-b border-border last:border-0"
                      data-ocid={`principal.teachers.row.${i + 1}`}
                    >
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-foreground">
                        {t.name}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">
                        {t.username}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {t.email || "—"}
                      </td>
                      <td className="py-2.5">
                        <Badge
                          className={`border-0 text-xs ${t.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {t.isActive ? "Active" : "Inactive"}
                        </Badge>
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

  if (section === "notices") {
    return (
      <div className="p-6 space-y-5">
        <h2 className="text-xl font-bold text-foreground">Notice Board</h2>
        <div className={CARD}>
          {loading ? (
            <div
              className="flex items-center justify-center py-8"
              data-ocid="principal.notices.loading_state"
            >
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : notices.length === 0 ? (
            <div
              className="text-center py-8"
              data-ocid="principal.notices.empty_state"
            >
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notices yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.map((n, i) => (
                <div
                  key={n.id}
                  className="py-3 border-b border-border last:border-0"
                  data-ocid={`principal.notices.item.${i + 1}`}
                >
                  <p className="font-medium text-foreground">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {n.content}
                  </p>
                  <Badge className="border-0 bg-blue-100 text-blue-700 text-xs mt-2">
                    {n.targetRole}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (section === "fees") {
    const totalCollected = feeRecords.reduce(
      (sum, f) => sum + Number(f.paidAmount),
      0,
    );
    const pending = feeRecords.filter((f) => f.status === "pending").length;
    return (
      <div className="p-6 space-y-5">
        <h2 className="text-xl font-bold text-foreground">Fee Reports</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={DollarSign}
            value={`₹${(totalCollected / 1000).toFixed(1)}K`}
            label="Total Collected"
            color="bg-green-100 text-green-600"
          />
          <StatCard
            icon={DollarSign}
            value={String(pending)}
            label="Pending"
            color="bg-red-100 text-red-600"
          />
        </div>
        <div className={CARD}>
          {feeRecords.length === 0 ? (
            <div
              className="text-center py-6"
              data-ocid="principal.fees.empty_state"
            >
              <p className="text-sm text-muted-foreground">
                No fee records yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {feeRecords.slice(0, 10).map((f, i) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  data-ocid={`principal.fees.item.${i + 1}`}
                >
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">
                      {f.studentId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {f.dueDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ₹{Number(f.amount).toLocaleString()}
                    </p>
                    <Badge
                      className={`border-0 text-xs ${f.status === "paid" ? "bg-green-100 text-green-700" : f.status === "partial" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                    >
                      {f.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default dashboard
  const totalCollected = feeRecords.reduce(
    (sum, f) => sum + Number(f.paidAmount),
    0,
  );

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Principal Dashboard
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Welcome, {user?.name}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            data-ocid="principal.dashboard.refresh.button"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          value={String(students.length)}
          label="Students"
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          icon={Users}
          value={String(teachers.length)}
          label="Teachers"
          color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatCard
          icon={Bell}
          value={String(notices.length)}
          label="Notices"
          color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
        />
        <StatCard
          icon={DollarSign}
          value={`₹${(totalCollected / 1000).toFixed(1)}K`}
          label="Fees Collected"
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
      </div>

      {loading && (
        <div
          className="flex items-center justify-center py-6"
          data-ocid="principal.dashboard.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={CARD}>
          <h3 className="font-semibold text-foreground mb-4">Recent Notices</h3>
          {notices.length === 0 ? (
            <div
              className="text-center py-6"
              data-ocid="principal.dashboard.notices.empty_state"
            >
              <p className="text-sm text-muted-foreground">No notices yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.slice(0, 4).map((n, i) => (
                <div
                  key={n.id}
                  className="py-2 border-b border-border last:border-0"
                  data-ocid={`principal.dashboard.notices.item.${i + 1}`}
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
          <h3 className="font-semibold text-foreground mb-4">
            Recent Fee Records
          </h3>
          {feeRecords.length === 0 ? (
            <div
              className="text-center py-6"
              data-ocid="principal.dashboard.fees.empty_state"
            >
              <p className="text-sm text-muted-foreground">
                No fee records yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {feeRecords.slice(0, 4).map((f, i) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  data-ocid={`principal.dashboard.fees.item.${i + 1}`}
                >
                  <p className="text-xs font-mono text-muted-foreground">
                    {f.studentId}
                  </p>
                  <Badge
                    className={`border-0 text-xs ${f.status === "paid" ? "bg-green-100 text-green-700" : f.status === "partial" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
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
