import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  DollarSign,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { FeeRecord } from "../../backend";
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

// ── Add Fee Record Dialog ──────────────────────────────────────────────────
function AddFeeRecordDialog({
  collegeId,
  token,
  onCreated,
}: { collegeId: string; token: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    amount: "",
    paidAmount: "",
    dueDate: "",
    status: "pending",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.studentId || !form.amount || !form.dueDate) {
      toast.error("Student ID, amount and due date are required.");
      return;
    }
    setLoading(true);
    try {
      await backend.addFeeRecord(
        token,
        collegeId,
        form.studentId,
        BigInt(form.amount),
        BigInt(form.paidAmount || "0"),
        form.dueDate,
        form.status,
      );
      toast.success("Fee record added!");
      setForm({
        studentId: "",
        amount: "",
        paidAmount: "",
        dueDate: "",
        status: "pending",
      });
      setOpen(false);
      onCreated();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add fee record",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-ocid="fee.records.open_modal_button">
          <Plus className="w-4 h-4 mr-1" /> Add Fee Record
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="fee.records.dialog">
        <DialogHeader>
          <DialogTitle>Add Fee Record</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Student User ID *</Label>
            <Input
              placeholder="Student user ID"
              value={form.studentId}
              onChange={(e) =>
                setForm((p) => ({ ...p, studentId: e.target.value }))
              }
              data-ocid="fee.records.student_id.input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Total Amount (₹) *</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.amount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: e.target.value }))
                }
                data-ocid="fee.records.amount.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Paid Amount (₹)</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.paidAmount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, paidAmount: e.target.value }))
                }
                data-ocid="fee.records.paid_amount.input"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Due Date *</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, dueDate: e.target.value }))
              }
              data-ocid="fee.records.due_date.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
            >
              <SelectTrigger data-ocid="fee.records.status.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-ocid="fee.records.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            data-ocid="fee.records.submit_button"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Update Fee Dialog ─────────────────────────────────────────────────────────────
function UpdateFeeDialog({
  record,
  token,
  onUpdated,
}: { record: FeeRecord; token: string; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState(String(record.paidAmount));
  const [status, setStatus] = useState(record.status);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await backend.updateFeeRecord(
        token,
        record.id,
        BigInt(paidAmount || "0"),
        status,
      );
      toast.success("Fee record updated!");
      setOpen(false);
      onUpdated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-ocid="fee.records.edit_button">
          Update
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Fee Record</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Paid Amount (₹)</Label>
            <Input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              data-ocid="fee.records.update_paid.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            data-ocid="fee.records.update_confirm_button"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export function FeeManagerDashboard({ section }: { section: string }) {
  const { user } = useAuth();
  const token = user?.token ?? "";
  const collegeId = user?.collegeId ?? "";

  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchRecords = useCallback(async () => {
    if (!token || !collegeId) return;
    setLoading(true);
    try {
      const data = await backend.listFeeRecords(token, collegeId);
      setFeeRecords(data);
    } catch {
      toast.error("Failed to load fee records");
    } finally {
      setLoading(false);
    }
  }, [token, collegeId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filtered = feeRecords.filter(
    (f) => !search || f.studentId.toLowerCase().includes(search.toLowerCase()),
  );

  const totalCollected = feeRecords.reduce(
    (sum, f) => sum + Number(f.paidAmount),
    0,
  );
  const pendingCount = feeRecords.filter(
    (f) => f.status === "pending" || f.status === "partial",
  ).length;
  const paidCount = feeRecords.filter((f) => f.status === "paid").length;

  if (section === "records") {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Fee Records</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecords}
              data-ocid="fee.records.refresh.button"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <AddFeeRecordDialog
              collegeId={collegeId}
              token={token}
              onCreated={fetchRecords}
            />
          </div>
        </div>

        <div className={CARD}>
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-10 px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              placeholder="Search by student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-ocid="fee.records.search_input"
            />
          </div>

          {loading ? (
            <div
              className="flex items-center justify-center py-10"
              data-ocid="fee.records.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="text-center py-10"
              data-ocid="fee.records.empty_state"
            >
              <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No fee records yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Student ID",
                      "Amount",
                      "Paid",
                      "Remaining",
                      "Due Date",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 pr-4 text-muted-foreground font-medium whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f, i) => (
                    <tr
                      key={f.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                      data-ocid={`fee.records.row.${i + 1}`}
                    >
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                        {f.studentId}
                      </td>
                      <td className="py-3 pr-4 font-medium">
                        ₹{Number(f.amount).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-green-600">
                        ₹{Number(f.paidAmount).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-red-500">
                        ₹
                        {(
                          Number(f.amount) - Number(f.paidAmount)
                        ).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {f.dueDate}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          className={`border-0 text-xs ${
                            f.status === "paid"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : f.status === "partial"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {f.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <UpdateFeeDialog
                          record={f}
                          token={token}
                          onUpdated={fetchRecords}
                        />
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

  if (section === "payments") {
    return (
      <div className="p-6 space-y-5">
        <h2 className="text-xl font-bold text-foreground">Add Payment</h2>
        <div className={CARD}>
          <p className="text-sm text-muted-foreground mb-4">
            Use "Add Fee Record" to create new fee records, or update existing
            records below.
          </p>
          <AddFeeRecordDialog
            collegeId={collegeId}
            token={token}
            onCreated={fetchRecords}
          />
        </div>
      </div>
    );
  }

  // Dashboard home
  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-bold text-foreground">
          Fee Management Dashboard
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage student fees for your college
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={TrendingUp}
          value={`₹${(totalCollected / 1000).toFixed(1)}K`}
          label="Total Collected"
          color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatCard
          icon={AlertCircle}
          value={String(pendingCount)}
          label="Pending / Partial"
          color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
        <StatCard
          icon={Users}
          value={String(paidCount)}
          label="Paid"
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
      </div>

      <div className={CARD}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Fee Records</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecords}
            data-ocid="fee.dashboard.refresh.button"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {loading ? (
          <div
            className="flex items-center justify-center py-8"
            data-ocid="fee.dashboard.loading_state"
          >
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : feeRecords.length === 0 ? (
          <div
            className="text-center py-8"
            data-ocid="fee.dashboard.empty_state"
          >
            <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No fee records yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feeRecords.slice(0, 8).map((f, i) => (
              <div
                key={f.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
                data-ocid={`fee.dashboard.records.item.${i + 1}`}
              >
                <div>
                  <p className="text-sm font-mono text-muted-foreground">
                    {f.studentId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due: {f.dueDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    ₹{Number(f.amount).toLocaleString()}
                  </p>
                  <Badge
                    className={`border-0 text-xs ${
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
