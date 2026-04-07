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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  CheckCircle,
  Download,
  FileText,
  GraduationCap,
  ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Upload,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { StudentRecord, User } from "../../backend";
import { UserRole } from "../../backend";
import { backendAPI as backend } from "../../backendAPI";
import { parseCSV } from "../../utils/csvParser";

const CARD = "bg-card rounded-2xl border border-border shadow-card p-5";
const INPUT =
  "w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";
const LABEL = "block text-xs font-medium text-muted-foreground mb-1.5";

// ── Upload Student Photo Dialog ────────────────────────────────────────────────
function UploadStudentPhotoDialog({
  student,
  token,
  onUpdated,
}: {
  student: User & { photoUrl?: string };
  token: string;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setPhotoDataUrl(evt.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!photoDataUrl) {
      toast.error("Please select an image.");
      return;
    }
    setLoading(true);
    try {
      // biome-ignore lint/suspicious/noExplicitAny: uploadUserPhoto added in backend runtime
      await (backend as any).uploadUserPhoto(token, student.id, photoDataUrl);
      toast.success(`Photo uploaded for "${student.name}"!`);
      setOpen(false);
      setPhotoDataUrl("");
      onUpdated();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload photo",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setPhotoDataUrl("");
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          data-ocid="admin.students.photo.open_modal_button"
        >
          <ImageIcon className="w-3 h-3 mr-1" /> Photo
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="admin.students.photo.dialog">
        <DialogHeader>
          <DialogTitle>Upload Student Photo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {student.photoUrl && !photoDataUrl && (
            <div className="flex items-center gap-3">
              <img
                src={student.photoUrl}
                alt={student.name}
                className="w-14 h-14 rounded-full object-cover border border-border"
              />
              <span className="text-xs text-muted-foreground">
                Current photo. Upload to replace.
              </span>
            </div>
          )}
          {photoDataUrl && (
            <div className="flex items-center gap-3">
              <img
                src={photoDataUrl}
                alt="Preview"
                className="w-14 h-14 rounded-full object-cover border border-border"
              />
              <span className="text-xs text-muted-foreground">
                New photo preview
              </span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor={`student-photo-${student.id}`}>Select Photo</Label>
            <Input
              id={`student-photo-${student.id}`}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              data-ocid="admin.students.photo.upload_button"
              className="cursor-pointer file:cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-ocid="admin.students.photo.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !photoDataUrl}
            data-ocid="admin.students.photo.submit_button"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? "Uploading..." : "Save Photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── All Students Tab ────────────────────────────────────────────────────────────
function AllStudentsTab({
  students,
  studentRecords,
  loading,
  token,
  onRefresh,
}: {
  students: (User & { photoUrl?: string })[];
  studentRecords: StudentRecord[];
  loading: boolean;
  token: string;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");

  const recordsMap = Object.fromEntries(
    studentRecords.map((r) => [r.studentId, r]),
  );

  const filtered = students.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className={`${INPUT} pl-10`}
          placeholder="Search by name or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-ocid="admin.students.search_input"
        />
      </div>
      <div className={CARD}>
        {loading ? (
          <div
            className="flex items-center justify-center py-10"
            data-ocid="admin.students.loading_state"
          >
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-10"
            data-ocid="admin.students.empty_state"
          >
            <GraduationCap className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">No students yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first student to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="admin.students.table">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Photo",
                    "#",
                    "Name",
                    "Username",
                    "Department",
                    "Roll No",
                    "Year",
                    "Status",
                    "Actions",
                  ].map((h) => (
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
                {filtered.map((s, i) => {
                  const rec = recordsMap[s.id];
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      data-ocid={`admin.students.row.${i + 1}`}
                    >
                      <td className="py-2.5 pr-4">
                        {s.photoUrl ? (
                          <img
                            src={s.photoUrl}
                            alt={s.name}
                            className="w-9 h-9 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {s.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-foreground">
                        {s.name}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">
                        {s.username}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {rec?.department || "—"}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">
                        {rec?.rollNumber || "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {rec?.year || "—"}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge
                          className={`border-0 text-xs ${
                            s.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {s.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-2.5">
                        <UploadStudentPhotoDialog
                          student={s}
                          token={token}
                          onUpdated={onRefresh}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-3">
              {filtered.length} students
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Student Dialog ────────────────────────────────────────────────────────────
interface DeptItem {
  id: string;
  name: string;
}
interface CourseItem {
  id: string;
  name: string;
}

function AddStudentTab({
  collegeId,
  token,
  onCreated,
  departments = [],
  courses = [],
}: {
  collegeId: string;
  token: string;
  onCreated: () => void;
  departments?: DeptItem[];
  courses?: CourseItem[];
}) {
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    department: "",
    year: "1st Year",
    course: "",
    section: "A",
    rollNumber: "",
    admissionYear: String(new Date().getFullYear()),
    fatherName: "",
    motherName: "",
    parentPhone: "",
    address: "",
    dob: "",
    gender: "Male",
    totalFee: "",
    hostelFee: "",
    busFee: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.username || !form.password) {
      toast.error("Name, username and password are required.");
      return;
    }
    setSubmitting(true);
    try {
      const newUser = await backend.createUser(
        token,
        form.username,
        form.email,
        form.password,
        UserRole.student,
        collegeId,
        form.name,
        form.phone,
      );
      // Add student record
      if (form.rollNumber) {
        await backend.addStudentRecord(
          token,
          collegeId,
          newUser.id,
          form.department,
          form.year,
          form.course,
          form.section,
          form.rollNumber,
          form.admissionYear,
          form.fatherName,
          form.motherName,
          form.parentPhone,
          form.address,
          form.dob,
          form.gender,
          BigInt(form.totalFee || "0"),
          BigInt(form.hostelFee || "0"),
          BigInt(form.busFee || "0"),
        );
      }
      // Upload photo inline if provided
      if (photoDataUrl) {
        try {
          // biome-ignore lint/suspicious/noExplicitAny: uploadUserPhoto added in backend runtime
          await (backend as any).uploadUserPhoto(
            token,
            newUser.id,
            photoDataUrl,
          );
        } catch {
          toast.error("Student added but photo upload failed.");
        }
      }
      toast.success(`Student "${form.name}" added!`);
      setForm({
        name: "",
        username: "",
        email: "",
        password: "",
        phone: "",
        department: "",
        year: "1st Year",
        course: "",
        section: "A",
        rollNumber: "",
        admissionYear: String(new Date().getFullYear()),
        fatherName: "",
        motherName: "",
        parentPhone: "",
        address: "",
        dob: "",
        gender: "Male",
        totalFee: "",
        hostelFee: "",
        busFee: "",
      });
      setPhotoDataUrl("");
      if (photoInputRef.current) photoInputRef.current.value = "";
      onCreated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add student");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={CARD}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span className={LABEL}>Full Name *</span>
          <input
            className={INPUT}
            placeholder="Full name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            data-ocid="admin.add_student.name.input"
          />
        </div>
        <div>
          <span className={LABEL}>Username *</span>
          <input
            className={INPUT}
            placeholder="Login username"
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            data-ocid="admin.add_student.username.input"
          />
        </div>
        <div>
          <span className={LABEL}>Password *</span>
          <input
            className={INPUT}
            type="password"
            placeholder="Set password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            data-ocid="admin.add_student.password.input"
          />
        </div>
        <div>
          <span className={LABEL}>Email</span>
          <input
            className={INPUT}
            type="email"
            placeholder="student@college.edu"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            data-ocid="admin.add_student.email.input"
          />
        </div>
        <div>
          <span className={LABEL}>Phone</span>
          <input
            className={INPUT}
            placeholder="10-digit phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            data-ocid="admin.add_student.phone.input"
          />
        </div>
        <div>
          <span className={LABEL}>Roll Number</span>
          <input
            className={INPUT}
            placeholder="e.g. CSE/2024/001"
            value={form.rollNumber}
            onChange={(e) => set("rollNumber", e.target.value)}
            data-ocid="admin.add_student.roll_number.input"
          />
        </div>
        <div>
          <span className={LABEL}>Department</span>
          <select
            className={INPUT}
            value={form.department}
            onChange={(e) => set("department", e.target.value)}
            data-ocid="admin.add_student.department.select"
          >
            {departments.length === 0 ? (
              <option value="">No departments added yet</option>
            ) : (
              departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <span className={LABEL}>Course</span>
          <select
            className={INPUT}
            value={form.course}
            onChange={(e) => set("course", e.target.value)}
            data-ocid="admin.add_student.course.select"
          >
            {courses.length === 0 ? (
              <option value="">No courses added yet</option>
            ) : (
              courses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <span className={LABEL}>Year</span>
          <select
            className={INPUT}
            value={form.year}
            onChange={(e) => set("year", e.target.value)}
            data-ocid="admin.add_student.year.select"
          >
            {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <span className={LABEL}>Section</span>
          <input
            className={INPUT}
            placeholder="A"
            value={form.section}
            onChange={(e) => set("section", e.target.value)}
            data-ocid="admin.add_student.section.input"
          />
        </div>
        <div>
          <span className={LABEL}>Gender</span>
          <select
            className={INPUT}
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
            data-ocid="admin.add_student.gender.select"
          >
            {["Male", "Female", "Other"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <span className={LABEL}>Date of Birth</span>
          <input
            className={INPUT}
            type="date"
            value={form.dob}
            onChange={(e) => set("dob", e.target.value)}
            data-ocid="admin.add_student.dob.input"
          />
        </div>
        <div>
          <span className={LABEL}>Father Name</span>
          <input
            className={INPUT}
            placeholder="Father's name"
            value={form.fatherName}
            onChange={(e) => set("fatherName", e.target.value)}
            data-ocid="admin.add_student.father_name.input"
          />
        </div>
        <div>
          <span className={LABEL}>Mother Name</span>
          <input
            className={INPUT}
            placeholder="Mother's name"
            value={form.motherName}
            onChange={(e) => set("motherName", e.target.value)}
            data-ocid="admin.add_student.mother_name.input"
          />
        </div>
        <div>
          <span className={LABEL}>Parent Phone</span>
          <input
            className={INPUT}
            placeholder="Parent contact"
            value={form.parentPhone}
            onChange={(e) => set("parentPhone", e.target.value)}
            data-ocid="admin.add_student.parent_phone.input"
          />
        </div>
        <div>
          <span className={LABEL}>Admission Year</span>
          <input
            className={INPUT}
            placeholder={String(new Date().getFullYear())}
            value={form.admissionYear}
            onChange={(e) => set("admissionYear", e.target.value)}
            data-ocid="admin.add_student.admission_year.input"
          />
        </div>
        <div className="sm:col-span-2">
          <span className={LABEL}>Address</span>
          <textarea
            className={`${INPUT} min-h-[72px] resize-none`}
            placeholder="Full address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            data-ocid="admin.add_student.address.textarea"
          />
        </div>
        <div>
          <span className={LABEL}>Total Fee (₹)</span>
          <input
            className={INPUT}
            type="number"
            placeholder="0"
            value={form.totalFee}
            onChange={(e) => set("totalFee", e.target.value)}
            data-ocid="admin.add_student.total_fee.input"
          />
        </div>
        <div>
          <span className={LABEL}>Hostel Fee (₹)</span>
          <input
            className={INPUT}
            type="number"
            placeholder="0"
            value={form.hostelFee}
            onChange={(e) => set("hostelFee", e.target.value)}
            data-ocid="admin.add_student.hostel_fee.input"
          />
        </div>
        <div>
          <span className={LABEL}>Bus Fee (₹)</span>
          <input
            className={INPUT}
            type="number"
            placeholder="0"
            value={form.busFee}
            onChange={(e) => set("busFee", e.target.value)}
            data-ocid="admin.add_student.bus_fee.input"
          />
        </div>
        <div className="sm:col-span-2">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-400">
            College ID (auto-assigned): <strong>{collegeId}</strong>
          </div>
        </div>
        {/* Student Photo Upload */}
        <div className="sm:col-span-2">
          <span className={LABEL}>Student Photo (Optional)</span>
          <div className="flex items-center gap-4 mt-1">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-muted flex-shrink-0"
              data-ocid="admin.add_student.photo.dropzone"
            >
              {photoDataUrl ? (
                <img
                  src={photoDataUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-6 h-6 text-muted-foreground" />
              )}
            </button>
            <div>
              <p className="text-xs text-muted-foreground">
                Click to upload student photo
              </p>
              {photoDataUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoDataUrl("");
                    if (photoInputRef.current) photoInputRef.current.value = "";
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors mt-1"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-5"
        data-ocid="admin.add_student.submit_button"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <UserPlus className="w-4 h-4 mr-2" />
        )}
        Add Student
      </Button>
    </div>
  );
}

// ── CSV Import Result types ──────────────────────────────────────────────────
interface ImportResult {
  success: number;
  failures: { row: number; name: string; error: string }[];
}

// ── CSV Import Tab ────────────────────────────────────────────────────────────
function CsvImportTab({
  collegeId,
  token,
  onImported,
}: { collegeId: string; token: string; onImported: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [csvText, setCsvText] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const downloadTemplate = () => {
    const content =
      "name,rollNumber,mobile,department,year,course,section,gender\nJohn Doe,CSE/2024/001,9876543210,CSE,1st Year,BTech,A,Male\nJane Smith,CSE/2024/002,9876543211,AI & ML,2nd Year,BTech,B,Female";
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student-template.csv";
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

  const handleImport = async () => {
    if (!csvText) {
      toast.error("Please select a CSV file first.");
      return;
    }

    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      toast.error("CSV file is empty or has no data rows.");
      return;
    }

    // Validate required columns
    const required = [
      "name",
      "rollnumber",
      "mobile",
      "department",
      "year",
      "course",
      "section",
      "gender",
    ];
    const firstRow = rows[0];
    const missing = required.filter((col) => !(col in firstRow));
    if (missing.length > 0) {
      toast.error(
        `Missing columns: ${missing.join(", ")}. Check your CSV headers.`,
      );
      return;
    }

    setImporting(true);
    const res: ImportResult = { success: 0, failures: [] };
    const admissionYear = String(new Date().getFullYear());

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row.name?.trim();
      const rollNumber = row.rollnumber?.trim();
      const mobile = row.mobile?.trim();
      const department = row.department?.trim() || "CSE";
      const year = row.year?.trim() || "1st Year";
      const course = row.course?.trim() || "BTech";
      const section = row.section?.trim() || "A";
      const gender = row.gender?.trim() || "Male";

      if (!name || !rollNumber) {
        res.failures.push({
          row: i + 2,
          name: name || `Row ${i + 2}`,
          error: "Name and roll number are required",
        });
        continue;
      }

      try {
        // password = rollNumber (as specified)
        const newUser = await backend.createUser(
          token,
          rollNumber,
          "",
          rollNumber,
          UserRole.student,
          collegeId,
          name,
          mobile || "",
        );
        await backend.addStudentRecord(
          token,
          collegeId,
          newUser.id,
          department,
          year,
          course,
          section,
          rollNumber,
          admissionYear,
          "",
          "",
          "",
          "",
          "",
          gender,
          BigInt(0),
          BigInt(0),
          BigInt(0),
        );
        res.success++;
      } catch (err: unknown) {
        res.failures.push({
          row: i + 2,
          name,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    setResult(res);
    setImporting(false);

    if (res.success > 0) {
      toast.success(`${res.success} student(s) imported successfully!`);
      onImported();
    }
    if (res.failures.length > 0) {
      toast.error(`${res.failures.length} row(s) failed. See details below.`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Template download */}
      <div className={CARD}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-sm">
              Step 1: Download Template
            </h3>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Download the sample CSV template with the correct column format:
              <span className="font-mono text-xs ml-1 text-primary">
                name, rollNumber, mobile, department, year, course, section,
                gender
              </span>
            </p>
            <div className="p-3 bg-muted/50 rounded-lg font-mono text-xs text-muted-foreground mb-3">
              name,rollNumber,mobile,department,year,course,section,gender
              <br />
              John Doe,CSE/2024/001,9876543210,CSE,1st Year,BTech,A,Male
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              <strong>Note:</strong> Default password for each student will be
              their roll number.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              data-ocid="admin.csv_import.download_template.button"
            >
              <Download className="w-4 h-4 mr-2" />
              Download student-template.csv
            </Button>
          </div>
        </div>
      </div>

      {/* File upload */}
      <div className={CARD}>
        <h3 className="font-semibold text-foreground text-sm mb-3">
          Step 2: Upload Your CSV File
        </h3>
        <button
          type="button"
          className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
          onClick={() => fileInputRef.current?.click()}
          data-ocid="admin.csv_import.dropzone"
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          {fileName ? (
            <>
              <p className="font-medium text-foreground text-sm">{fileName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click to choose a different file
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-foreground text-sm">
                Click to upload CSV file
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Only .csv files are accepted
              </p>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
          data-ocid="admin.csv_import.upload_button"
        />

        <Button
          onClick={handleImport}
          disabled={importing || !csvText}
          className="mt-4 w-full"
          data-ocid="admin.csv_import.import.button"
        >
          {importing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing students...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Import Students from CSV
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3" data-ocid="admin.csv_import.success_state">
          {result.success > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-700 dark:text-green-300 text-sm">
                  {result.success} student{result.success !== 1 ? "s" : ""}{" "}
                  imported successfully
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                  Default password set to each student's roll number.
                </p>
              </div>
            </div>
          )}
          {result.failures.length > 0 && (
            <div
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
              data-ocid="admin.csv_import.error_state"
            >
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="font-semibold text-red-700 dark:text-red-300 text-sm">
                  {result.failures.length} row
                  {result.failures.length !== 1 ? "s" : ""} failed to import
                </p>
              </div>
              <div className="space-y-2">
                {result.failures.map((f) => (
                  <div
                    key={`${f.row}-${f.name}`}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span className="font-mono text-red-500 dark:text-red-400 w-12 flex-shrink-0">
                      Row {f.row}
                    </span>
                    <span className="font-medium text-red-700 dark:text-red-300 w-32 flex-shrink-0 truncate">
                      {f.name}
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      {f.error}
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

// ── Main Component ────────────────────────────────────────────────────────────
export function AdminStudents({
  collegeId,
  token,
}: { collegeId: string; token: string }) {
  const [students, setStudents] = useState<User[]>([]);
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [departments, setDepartments] = useState<DeptItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token || !collegeId) return;
    setLoading(true);
    try {
      const [studs, recs, depts, crses] = await Promise.all([
        backend.listUsers(token, collegeId, UserRole.student),
        backend.listStudentRecords(token, collegeId),
        // biome-ignore lint/suspicious/noExplicitAny: dynamic method
        (backend as any)
          .listDepartments(token, collegeId)
          .catch(() => []),
        // biome-ignore lint/suspicious/noExplicitAny: dynamic method
        (backend as any)
          .listCourses(token, collegeId)
          .catch(() => []),
      ]);
      setStudents(studs);
      setStudentRecords(recs);
      setDepartments(depts);
      setCourses(crses);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [token, collegeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Student Management
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage students in your college
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          data-ocid="admin.students.refresh.button"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList
          className="w-full sm:w-auto mb-5"
          data-ocid="admin.students.tab"
        >
          <TabsTrigger value="all" data-ocid="admin.students.all.tab">
            All Students ({students.length})
          </TabsTrigger>
          <TabsTrigger value="add" data-ocid="admin.students.add.tab">
            Add Student
          </TabsTrigger>
          <TabsTrigger value="csv" data-ocid="admin.students.csv.tab">
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            CSV Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AllStudentsTab
            students={students as (User & { photoUrl?: string })[]}
            studentRecords={studentRecords}
            loading={loading}
            token={token}
            onRefresh={fetchData}
          />
        </TabsContent>
        <TabsContent value="add">
          {departments.length === 0 && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-300">
              ⚠️ Please add departments first from the{" "}
              <strong>Departments &amp; Courses</strong> section before adding
              students.
            </div>
          )}
          <AddStudentTab
            collegeId={collegeId}
            token={token}
            onCreated={fetchData}
            departments={departments}
            courses={courses}
          />
        </TabsContent>
        <TabsContent value="csv">
          <CsvImportTab
            collegeId={collegeId}
            token={token}
            onImported={fetchData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
