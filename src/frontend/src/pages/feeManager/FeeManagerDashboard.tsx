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
  CheckCircle,
  DollarSign,
  Download,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { FeeRecord, StudentRecord, User } from "../../backend";
import { UserRole } from "../../backend";
import { backendAPI as backend } from "../../backendAPI";
import { useAuth } from "../../contexts/AuthContext";
import { parseCSV } from "../../utils/csvParser";
import {
  type FeeDueRow,
  type FeePaidRow,
  downloadFeeDuePdf,
  downloadFeePaidPdf,
} from "../../utils/pdfExport";

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

// ── Add Fee Record Dialog ────────────────────────────────────────────────
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

// ── Update Fee Dialog ──────────────────────────────────────────────────────────
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

// ── Fee Payment CSV Upload Panel ─────────────────────────────────────────────
interface FeePaymentImportResult {
  success: number;
  skipped: { row: number; rollNumber: string; reason: string }[];
}

function FeePaymentCsvPanel({
  token,
  collegeId,
  onUpdated,
}: { token: string; collegeId: string; onUpdated: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<FeePaymentImportResult | null>(null);

  const downloadTemplate = () => {
    const content =
      "rollNumber,amountPaid,paymentDate,paymentMode\nCSE/2024/001,15000,2026-04-01,Cash\nCSE/2024/002,25000,2026-04-02,Online";
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fee-payments-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => setCsvText(evt.target?.result as string);
    reader.readAsText(file);
  };

  const handleProcess = async () => {
    if (!csvText) {
      toast.error("Please select a CSV file first.");
      return;
    }

    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      toast.error("CSV file is empty or has no data rows.");
      return;
    }

    const required = ["rollnumber", "amountpaid", "paymentdate"];
    const firstRow = rows[0];
    const missing = required.filter((col) => !(col in firstRow));
    if (missing.length > 0) {
      toast.error(
        `Missing columns: ${missing.join(", ")}. Check your CSV headers.`,
      );
      return;
    }

    setProcessing(true);
    const res: FeePaymentImportResult = { success: 0, skipped: [] };

    // Fetch all student records and fee records in parallel
    let studentRecords: StudentRecord[] = [];
    let feeRecords: FeeRecord[] = [];

    try {
      [studentRecords, feeRecords] = await Promise.all([
        backend.listStudentRecords(token, collegeId),
        backend.listFeeRecords(token, collegeId),
      ]);
    } catch {
      toast.error("Failed to fetch student/fee data.");
      setProcessing(false);
      return;
    }

    // Build lookup maps
    const rollToStudentRecord = new Map(
      studentRecords.map((r) => [r.rollNumber.toLowerCase(), r]),
    );
    const studentIdToFeeRecord = new Map(
      feeRecords.map((f) => [f.studentId, f]),
    );
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rollNumber = row.rollnumber?.trim();
      const amountPaidStr = row.amountpaid?.trim();
      if (!rollNumber || !amountPaidStr) {
        res.skipped.push({
          row: i + 2,
          rollNumber: rollNumber || `Row ${i + 2}`,
          reason: "Roll number and amount paid are required",
        });
        continue;
      }

      const studentRecord = rollToStudentRecord.get(rollNumber.toLowerCase());
      if (!studentRecord) {
        res.skipped.push({
          row: i + 2,
          rollNumber,
          reason: "Student not found with this roll number",
        });
        continue;
      }

      const feeRecord = studentIdToFeeRecord.get(studentRecord.studentId);
      if (!feeRecord) {
        res.skipped.push({
          row: i + 2,
          rollNumber,
          reason: "No fee record found for this student",
        });
        continue;
      }

      const amountPaid = Number(amountPaidStr);
      const totalFee = Number(feeRecord.amount);
      const status =
        amountPaid >= totalFee
          ? "paid"
          : amountPaid > 0
            ? "partial"
            : "pending";

      try {
        await backend.updateFeeRecord(
          token,
          feeRecord.id,
          BigInt(amountPaid),
          status,
        );
        res.success++;
      } catch (err: unknown) {
        res.skipped.push({
          row: i + 2,
          rollNumber,
          reason: err instanceof Error ? err.message : "Update failed",
        });
      }
    }

    setResult(res);
    setProcessing(false);

    if (res.success > 0) {
      toast.success(`${res.success} payment(s) updated successfully!`);
      onUpdated();
    }
    if (res.skipped.length > 0) {
      toast.error(`${res.skipped.length} row(s) skipped. See details below.`);
    }
  };

  return (
    <div className={`${CARD} space-y-4`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">
            Upload Fee Payments CSV
          </h3>
          <p className="text-xs text-muted-foreground">
            Bulk update payment status for existing students
          </p>
        </div>
      </div>

      {/* Template */}
      <div className="p-3 bg-muted/40 rounded-xl">
        <p className="text-xs text-muted-foreground mb-2">
          Required columns:{" "}
          <span className="font-mono text-primary">
            rollNumber, amountPaid, paymentDate, paymentMode
          </span>
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadTemplate}
          data-ocid="fee.csv_upload.download_template.button"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Download Template
        </Button>
      </div>

      {/* Upload */}
      <button
        type="button"
        className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all"
        onClick={() => fileInputRef.current?.click()}
        data-ocid="fee.csv_upload.dropzone"
      >
        <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        {fileName ? (
          <p className="font-medium text-foreground text-sm">{fileName}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click to upload CSV file
          </p>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
        data-ocid="fee.csv_upload.upload_button"
      />

      <Button
        onClick={handleProcess}
        disabled={processing || !csvText}
        className="w-full"
        data-ocid="fee.csv_upload.process.button"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing payments...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Process Payment CSV
          </>
        )}
      </Button>

      {/* Results */}
      {result && (
        <div className="space-y-3" data-ocid="fee.csv_upload.success_state">
          {result.success > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                {result.success} payment{result.success !== 1 ? "s" : ""}{" "}
                updated successfully
              </p>
            </div>
          )}
          {result.skipped.length > 0 && (
            <div
              className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
              data-ocid="fee.csv_upload.error_state"
            >
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  {result.skipped.length} row
                  {result.skipped.length !== 1 ? "s" : ""} skipped
                </p>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {result.skipped.map((s) => (
                  <div
                    key={`${s.row}-${s.rollNumber}`}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span className="font-mono text-amber-500 w-12 flex-shrink-0">
                      Row {s.row}
                    </span>
                    <span className="font-medium text-amber-700 dark:text-amber-300 w-28 flex-shrink-0 truncate">
                      {s.rollNumber}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400">
                      {s.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function FeeManagerDashboard({ section }: { section: string }) {
  const { user } = useAuth();
  const token = user?.token ?? "";
  const collegeId = user?.collegeId ?? "";

  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showCsvPanel, setShowCsvPanel] = useState(false);

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

  const handleDownloadFeeDue = async () => {
    setGeneratingPdf(true);
    toast("Generating PDF...");
    try {
      const [studentRecords, students] = await Promise.all([
        backend.listStudentRecords(token, collegeId),
        backend.listUsers(token, collegeId, UserRole.student),
      ]);

      const studentMap = new Map(students.map((u) => [u.id, u]));
      const recordMap = new Map(studentRecords.map((r) => [r.studentId, r]));

      const rows: FeeDueRow[] = feeRecords
        .filter((f) => f.status === "pending" || f.status === "partial")
        .map((f) => {
          const user = studentMap.get(f.studentId);
          const rec = recordMap.get(f.studentId);
          return {
            name: user?.name ?? "Unknown",
            rollNumber: rec?.rollNumber ?? f.studentId,
            department: rec?.department ?? "—",
            totalFee: Number(f.amount),
            amountPaid: Number(f.paidAmount),
            amountDue: Number(f.amount) - Number(f.paidAmount),
          };
        });

      if (rows.length === 0) {
        toast.error("No pending/partial fee records to export.");
        return;
      }

      downloadFeeDuePdf(rows);
      toast.success(
        `Fee Due PDF opened with ${rows.length} record(s). Use your browser's Print dialog to save as PDF.`,
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate PDF",
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadFeePaid = async () => {
    setGeneratingPdf(true);
    toast("Generating PDF...");
    try {
      const [studentRecords, students] = await Promise.all([
        backend.listStudentRecords(token, collegeId),
        backend.listUsers(token, collegeId, UserRole.student),
      ]);

      const studentMap = new Map(students.map((u) => [u.id, u]));
      const recordMap = new Map(studentRecords.map((r) => [r.studentId, r]));

      const rows: FeePaidRow[] = feeRecords
        .filter((f) => f.status === "paid")
        .map((f) => {
          const u = studentMap.get(f.studentId);
          const rec = recordMap.get(f.studentId);
          return {
            name: u?.name ?? "Unknown",
            rollNumber: rec?.rollNumber ?? f.studentId,
            department: rec?.department ?? "—",
            totalFee: Number(f.amount),
            amountPaid: Number(f.paidAmount),
            paymentDate: f.dueDate,
          };
        });

      if (rows.length === 0) {
        toast.error("No paid fee records to export.");
        return;
      }

      downloadFeePaidPdf(rows);
      toast.success(
        `Fee Paid PDF opened with ${rows.length} record(s). Use your browser's Print dialog to save as PDF.`,
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate PDF",
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (section === "records") {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Fee Records</h2>
          <div className="flex gap-2 flex-wrap">
            {/* PDF Download buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadFeeDue}
              disabled={generatingPdf}
              className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20"
              data-ocid="fee.records.download_due_pdf.button"
            >
              {generatingPdf ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1" />
              )}
              Fee Due PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadFeePaid}
              disabled={generatingPdf}
              className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
              data-ocid="fee.records.download_paid_pdf.button"
            >
              {generatingPdf ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1" />
              )}
              Fee Paid PDF
            </Button>
            {/* CSV Upload toggle */}
            <Button
              variant={showCsvPanel ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCsvPanel((v) => !v)}
              data-ocid="fee.records.upload_csv.button"
            >
              <Upload className="w-4 h-4 mr-1" />
              {showCsvPanel ? "Hide CSV Upload" : "Upload Payments CSV"}
            </Button>
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

        {/* CSV Payment Upload Panel */}
        {showCsvPanel && (
          <FeePaymentCsvPanel
            token={token}
            collegeId={collegeId}
            onUpdated={() => {
              fetchRecords();
              setShowCsvPanel(false);
            }}
          />
        )}

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

      {/* Quick action buttons on dashboard home */}
      <div className="flex gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadFeeDue}
          disabled={generatingPdf}
          className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400"
          data-ocid="fee.dashboard.download_due_pdf.button"
        >
          <Download className="w-4 h-4 mr-1.5" />
          Download Fee Due PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadFeePaid}
          disabled={generatingPdf}
          className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400"
          data-ocid="fee.dashboard.download_paid_pdf.button"
        >
          <Download className="w-4 h-4 mr-1.5" />
          Download Fee Paid PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCsvPanel((v) => !v)}
          data-ocid="fee.dashboard.upload_csv.button"
        >
          <Upload className="w-4 h-4 mr-1.5" />
          Upload Payment CSV
        </Button>
      </div>

      {/* CSV Panel on dashboard home */}
      {showCsvPanel && (
        <FeePaymentCsvPanel
          token={token}
          collegeId={collegeId}
          onUpdated={() => {
            fetchRecords();
            setShowCsvPanel(false);
          }}
        />
      )}

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
