import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  BookOpen,
  Calendar,
  ClipboardList,
  Loader2,
  UserCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Notice } from "../../backend";
import { backendAPI as backend } from "../../backendAPI";
import { useAuth } from "../../contexts/AuthContext";

const CARD = "bg-card rounded-2xl border border-border shadow-card p-5";
const INPUT =
  "w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";

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
    <div className="text-center py-10" data-ocid={ocid}>
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="font-semibold text-foreground text-sm">{title}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function RecentNoticesList({
  notices,
  filter,
}: {
  notices: Notice[];
  filter?: (n: Notice) => boolean;
}) {
  const filtered = filter ? notices.filter(filter) : notices;
  if (filtered.length === 0) return null;
  return (
    <div className="space-y-2 mt-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Recently Posted
      </p>
      {filtered.slice(0, 5).map((n, i) => (
        <div
          key={n.id}
          className="py-2.5 px-3 bg-muted/40 rounded-xl border border-border"
          data-ocid={`teacher.recent.item.${i + 1}`}
        >
          <p className="text-sm font-medium text-foreground">{n.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {n.content}
          </p>
        </div>
      ))}
    </div>
  );
}

export function TeacherDashboard({ section }: { section: string }) {
  const { user } = useAuth();
  const token = user?.token ?? "";
  const collegeId = user?.collegeId ?? "";

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);

  // shared form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formExtra1, setFormExtra1] = useState(""); // date / due date / subject
  const [formExtra2, setFormExtra2] = useState(""); // time / subject
  const [formExtra3, setFormExtra3] = useState(""); // venue
  const [targetRole, setTargetRole] = useState("student");
  const [posting, setPosting] = useState(false);

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormExtra1("");
    setFormExtra2("");
    setFormExtra3("");
  };

  const fetchNotices = useCallback(async () => {
    if (!token || !collegeId) return;
    setLoading(true);
    try {
      const data = await backend.listNotices(token, collegeId);
      setNotices(data);
    } catch {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  }, [token, collegeId]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // ── Attendance ──
  if (section === "attendance") {
    const postAttendance = async () => {
      if (!formExtra1 || !formTitle) {
        toast.error("Subject/Class and date are required");
        return;
      }
      setPosting(true);
      try {
        await backend.createNotice(
          token,
          collegeId,
          `Attendance: ${formTitle} - ${formExtra1}`,
          formContent || "Attendance recorded.",
          "student",
        );
        toast.success("Attendance posted!");
        resetForm();
        fetchNotices();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to post");
      } finally {
        setPosting(false);
      }
    };

    const attendanceNotices = notices.filter((n) =>
      n.title.toLowerCase().includes("attendance"),
    );

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Mark Attendance</h2>
        </div>
        <div className={CARD}>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Subject / Class *
              </Label>
              <input
                className={INPUT}
                placeholder="e.g. Mathematics, Physics Lab"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                data-ocid="teacher.attendance.subject.input"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Date *
              </Label>
              <input
                className={INPUT}
                type="date"
                value={formExtra1}
                onChange={(e) => setFormExtra1(e.target.value)}
                data-ocid="teacher.attendance.date.input"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Attendance Notes
              </Label>
              <Textarea
                className="min-h-[100px]"
                placeholder="e.g. Roll numbers 1, 2, 3 were present. Roll 4 was absent."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                data-ocid="teacher.attendance.notes.textarea"
              />
            </div>
            <Button
              onClick={postAttendance}
              disabled={posting || !formTitle || !formExtra1}
              className="w-full"
              data-ocid="teacher.attendance.submit_button"
            >
              {posting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Post Attendance
            </Button>
          </div>
          <RecentNoticesList notices={attendanceNotices} />
        </div>
      </div>
    );
  }

  // ── Notes ──
  if (section === "notes") {
    const postNote = async () => {
      if (!formTitle || !formContent) {
        toast.error("Title and content are required");
        return;
      }
      setPosting(true);
      try {
        await backend.createNotice(
          token,
          collegeId,
          formTitle,
          formContent,
          targetRole,
        );
        toast.success("Note posted!");
        resetForm();
        fetchNotices();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to post");
      } finally {
        setPosting(false);
      }
    };

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Upload Study Notes
          </h2>
        </div>
        <div className={CARD}>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Note Title *
              </Label>
              <input
                className={INPUT}
                placeholder="e.g. Chapter 3: Data Structures"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                data-ocid="teacher.notes.title.input"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Content *
              </Label>
              <Textarea
                className="min-h-[140px]"
                placeholder="Paste notes content, key points, or study material here…"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                data-ocid="teacher.notes.content.textarea"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Target Audience
              </Label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger data-ocid="teacher.notes.target.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={postNote}
              disabled={posting || !formTitle || !formContent}
              className="w-full"
              data-ocid="teacher.notes.submit_button"
            >
              {posting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Post Note
            </Button>
          </div>
          <RecentNoticesList notices={notices} />
        </div>
      </div>
    );
  }

  // ── Assignments ──
  if (section === "assignments") {
    const postAssignment = async () => {
      if (!formTitle || !formContent) {
        toast.error("Title and description are required");
        return;
      }
      setPosting(true);
      try {
        await backend.createNotice(
          token,
          collegeId,
          `Assignment: ${formTitle}`,
          `${formContent}${formExtra1 ? `\nDue: ${formExtra1}` : ""}${formExtra2 ? `\nSubject: ${formExtra2}` : ""}`,
          "student",
        );
        toast.success("Assignment posted!");
        resetForm();
        fetchNotices();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to post");
      } finally {
        setPosting(false);
      }
    };

    const assignmentNotices = notices.filter((n) =>
      n.title.toLowerCase().includes("assignment"),
    );

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Post Assignment</h2>
        </div>
        <div className={CARD}>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Assignment Title *
              </Label>
              <input
                className={INPUT}
                placeholder="e.g. Sorting Algorithm Implementation"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                data-ocid="teacher.assignment.title.input"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Subject
              </Label>
              <input
                className={INPUT}
                placeholder="e.g. Data Structures, Mathematics"
                value={formExtra2}
                onChange={(e) => setFormExtra2(e.target.value)}
                data-ocid="teacher.assignment.subject.input"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Description *
              </Label>
              <Textarea
                className="min-h-[100px]"
                placeholder="Describe the assignment requirements…"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                data-ocid="teacher.assignment.description.textarea"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Due Date
              </Label>
              <input
                className={INPUT}
                type="date"
                value={formExtra1}
                onChange={(e) => setFormExtra1(e.target.value)}
                data-ocid="teacher.assignment.due_date.input"
              />
            </div>
            <Button
              onClick={postAssignment}
              disabled={posting || !formTitle || !formContent}
              className="w-full"
              data-ocid="teacher.assignment.submit_button"
            >
              {posting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Post Assignment
            </Button>
          </div>
          <RecentNoticesList notices={assignmentNotices} />
        </div>
      </div>
    );
  }

  // ── Exams ──
  if (section === "exams") {
    const postExam = async () => {
      if (!formTitle) {
        toast.error("Subject is required");
        return;
      }
      setPosting(true);
      try {
        await backend.createNotice(
          token,
          collegeId,
          `Exam: ${formTitle}`,
          `Date: ${formExtra1 || "TBD"}${formExtra2 ? `\nTime: ${formExtra2}` : ""}${formExtra3 ? `\nVenue: ${formExtra3}` : ""}${formContent ? `\nNotes: ${formContent}` : ""}`,
          "all",
        );
        toast.success("Exam schedule posted!");
        resetForm();
        fetchNotices();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to post");
      } finally {
        setPosting(false);
      }
    };

    const examNotices = notices.filter((n) =>
      n.title.toLowerCase().includes("exam"),
    );

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Post Exam Schedule
          </h2>
        </div>
        <div className={CARD}>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Subject / Exam Name *
              </Label>
              <input
                className={INPUT}
                placeholder="e.g. Mathematics, Physics Lab"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                data-ocid="teacher.exam.subject.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                  Exam Date
                </Label>
                <input
                  className={INPUT}
                  type="date"
                  value={formExtra1}
                  onChange={(e) => setFormExtra1(e.target.value)}
                  data-ocid="teacher.exam.date.input"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                  Time
                </Label>
                <input
                  className={INPUT}
                  placeholder="e.g. 10:00 AM"
                  value={formExtra2}
                  onChange={(e) => setFormExtra2(e.target.value)}
                  data-ocid="teacher.exam.time.input"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Venue / Room
              </Label>
              <input
                className={INPUT}
                placeholder="e.g. Hall A, Room 101"
                value={formExtra3}
                onChange={(e) => setFormExtra3(e.target.value)}
                data-ocid="teacher.exam.venue.input"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Additional Notes
              </Label>
              <Textarea
                placeholder="Any additional instructions for students…"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                data-ocid="teacher.exam.notes.textarea"
              />
            </div>
            <Button
              onClick={postExam}
              disabled={posting || !formTitle}
              className="w-full"
              data-ocid="teacher.exam.submit_button"
            >
              {posting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Post Exam Schedule
            </Button>
          </div>
          {examNotices.length > 0 && (
            <RecentNoticesList notices={examNotices} />
          )}
        </div>
      </div>
    );
  }

  // ── Notices ──
  if (section === "notices") {
    const postNotice = async () => {
      if (!formTitle || !formContent) {
        toast.error("Title and content are required");
        return;
      }
      setPosting(true);
      try {
        await backend.createNotice(
          token,
          collegeId,
          formTitle,
          formContent,
          targetRole,
        );
        toast.success("Notice posted!");
        resetForm();
        fetchNotices();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to post");
      } finally {
        setPosting(false);
      }
    };

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Post Notice</h2>
        </div>
        <div className={CARD}>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Notice Title *
              </Label>
              <input
                className={INPUT}
                placeholder="Notice title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                data-ocid="teacher.notice.input"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Content *
              </Label>
              <Textarea
                className="min-h-[120px]"
                placeholder="Notice content…"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                data-ocid="teacher.notice.textarea"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5">
                Target Audience
              </Label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger data-ocid="teacher.notice.target.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="teacher">Teachers</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={postNotice}
              disabled={posting || !formTitle || !formContent}
              className="w-full"
              data-ocid="teacher.notice.submit_button"
            >
              {posting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Post Notice
            </Button>
          </div>
          <div className="mt-6">
            <h3 className="font-semibold text-foreground mb-3 text-sm">
              Posted Notices
            </h3>
            {notices.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No notices yet"
                ocid="teacher.notices.empty_state"
              />
            ) : (
              <div className="space-y-2">
                {notices.map((n, i) => (
                  <div
                    key={n.id}
                    className="py-2.5 px-3 bg-muted/40 rounded-xl border border-border"
                    data-ocid={`teacher.notices.item.${i + 1}`}
                  >
                    <p className="font-medium text-foreground text-sm">
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
        </div>
      </div>
    );
  }

  // ── Default dashboard ──
  const myNotices = notices.filter(
    (n) => n.targetRole === "teacher" || n.targetRole === "all",
  );

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-bold text-foreground">Teacher Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome, {user?.name}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={CARD}>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Notices
          </h3>
          {loading ? (
            <div
              className="flex items-center justify-center py-6"
              data-ocid="teacher.dashboard.loading_state"
            >
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : myNotices.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notices yet"
              ocid="teacher.dashboard.notices.empty_state"
            />
          ) : (
            <div className="space-y-3">
              {myNotices.slice(0, 5).map((n, i) => (
                <div
                  key={n.id}
                  className="py-2 border-b border-border last:border-0"
                  data-ocid={`teacher.dashboard.notices.item.${i + 1}`}
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
            <Users className="w-4 h-4 text-primary" /> Profile
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium text-foreground">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="font-medium text-foreground">Teacher / Faculty</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">College ID</p>
              <p className="font-medium text-foreground">{collegeId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
