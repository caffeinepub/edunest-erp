import { Bell, Loader2, Users } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Notice } from "../../backend";
import { backendAPI as backend } from "../../backendAPI";
import { useAuth } from "../../contexts/AuthContext";

const CARD = "bg-card rounded-2xl border border-border shadow-card p-5";
const INPUT =
  "w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";

export function TeacherDashboard({ section }: { section: string }) {
  const { user } = useAuth();
  const token = user?.token ?? "";
  const collegeId = user?.collegeId ?? "";

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [posting, setPosting] = useState(false);

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

  if (section === "notices") {
    const postNotice = async () => {
      if (!noticeTitle || !noticeContent) {
        toast.error("Title and content are required");
        return;
      }
      setPosting(true);
      try {
        await backend.createNotice(
          token,
          collegeId,
          noticeTitle,
          noticeContent,
          "student",
        );
        toast.success("Notice posted!");
        setNoticeTitle("");
        setNoticeContent("");
        fetchNotices();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to post");
      } finally {
        setPosting(false);
      }
    };

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h2 className="text-xl font-bold text-foreground">Post Notice</h2>
        <div className={CARD}>
          <div className="space-y-4">
            <input
              className={INPUT}
              placeholder="Notice title"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              data-ocid="teacher.notice.input"
            />
            <textarea
              className={`${INPUT} min-h-[120px] resize-y`}
              placeholder="Notice content..."
              value={noticeContent}
              onChange={(e) => setNoticeContent(e.target.value)}
              data-ocid="teacher.notice.textarea"
            />
            <button
              type="button"
              onClick={postNotice}
              disabled={posting || !noticeTitle || !noticeContent}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              data-ocid="teacher.notice.submit_button"
            >
              {posting && <Loader2 className="w-4 h-4 animate-spin" />}
              Post Notice
            </button>
          </div>
        </div>
        <div className={CARD}>
          <h3 className="font-semibold text-foreground mb-3">Posted Notices</h3>
          {notices.length === 0 ? (
            <div
              className="text-center py-6"
              data-ocid="teacher.notices.empty_state"
            >
              <p className="text-sm text-muted-foreground">No notices yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.map((n, i) => (
                <div
                  key={n.id}
                  className="py-2 border-b border-border last:border-0"
                  data-ocid={`teacher.notices.item.${i + 1}`}
                >
                  <p className="font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {n.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default dashboard
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
            <div
              className="text-center py-6"
              data-ocid="teacher.dashboard.notices.empty_state"
            >
              <p className="text-sm text-muted-foreground">No notices yet.</p>
            </div>
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
