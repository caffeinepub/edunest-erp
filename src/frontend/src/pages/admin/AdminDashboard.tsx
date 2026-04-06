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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { College, Notice, User } from "../../backend";
import { UserRole } from "../../backend";
import { backendAPI as backend } from "../../backendAPI";
import { useAuth } from "../../contexts/AuthContext";
import { AdminStudents } from "./AdminStudents";

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

// ── Add User Dialog ───────────────────────────────────────────────────────────
function AddUserDialog({
  role,
  collegeId,
  token,
  onCreated,
}: {
  role: UserRole;
  collegeId: string;
  token: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  const roleLabel =
    role === UserRole.teacher
      ? "Teacher"
      : role === UserRole.student
        ? "Student"
        : role === UserRole.feeManager
          ? "Fee Manager"
          : role === UserRole.principal
            ? "Principal"
            : "User";

  const handleSubmit = async () => {
    if (!form.name || !form.username || !form.password) {
      toast.error("Name, username and password are required.");
      return;
    }
    setLoading(true);
    try {
      await backend.createUser(
        token,
        form.username,
        form.email,
        form.password,
        role,
        collegeId,
        form.name,
        form.phone,
      );
      toast.success(`${roleLabel} "${form.name}" created!`);
      setForm({ name: "", username: "", email: "", password: "", phone: "" });
      setOpen(false);
      onCreated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-ocid={`admin.${role}.open_modal_button`}>
          <Plus className="w-4 h-4 mr-1" /> Add {roleLabel}
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid={`admin.${role}.dialog`}>
        <DialogHeader>
          <DialogTitle>Add {roleLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                placeholder="Full name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                data-ocid={`admin.${role}.name.input`}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Username *</Label>
              <Input
                placeholder="Login username"
                value={form.username}
                onChange={(e) =>
                  setForm((p) => ({ ...p, username: e.target.value }))
                }
                data-ocid={`admin.${role}.username.input`}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="email@college.edu"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              data-ocid={`admin.${role}.email.input`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input
                type="password"
                placeholder="Set password"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                data-ocid={`admin.${role}.password.input`}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                data-ocid={`admin.${role}.phone.input`}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-ocid={`admin.${role}.cancel_button`}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            data-ocid={`admin.${role}.submit_button`}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create {roleLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Reset Password Dialog ───────────────────────────────────────────────────
function ResetPasswordDialog({
  user: targetUser,
  token,
}: { user: User; token: string }) {
  const [open, setOpen] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!newPwd) return;
    setLoading(true);
    try {
      await backend.resetPassword(token, targetUser.id, newPwd);
      toast.success(`Password reset for ${targetUser.name}`);
      setNewPwd("");
      setOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-ocid="admin.users.reset_password.button"
        >
          Reset Pwd
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <p className="text-sm text-muted-foreground">
            Set a new password for <strong>{targetUser.name}</strong>
          </p>
          <Input
            type="password"
            placeholder="New password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            data-ocid="admin.users.new_password.input"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-ocid="admin.users.reset_cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleReset}
            disabled={loading || !newPwd}
            data-ocid="admin.users.reset_confirm_button"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Users Tab by Role ────────────────────────────────────────────────────────────
function RoleUsersTab({
  role,
  collegeId,
  token,
}: { role: UserRole; collegeId: string; token: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await backend.listUsers(token, collegeId, role);
      setUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token, collegeId, role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const roleLabel =
    role === UserRole.teacher
      ? "Teacher"
      : role === UserRole.student
        ? "Student"
        : role === UserRole.feeManager
          ? "Fee Manager"
          : role === UserRole.principal
            ? "Principal"
            : "User";

  const toggleActive = async (u: User) => {
    try {
      await backend.updateUser(
        token,
        u.id,
        u.name,
        u.email,
        u.phone,
        !u.isActive,
      );
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, isActive: !x.isActive } : x)),
      );
      toast.success(`User ${!u.isActive ? "activated" : "deactivated"}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {users.length} {roleLabel.toLowerCase()}(s)
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            data-ocid={`admin.${role}.refresh.button`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <AddUserDialog
            role={role}
            collegeId={collegeId}
            token={token}
            onCreated={fetchUsers}
          />
        </div>
      </div>

      <div className={CARD}>
        {loading ? (
          <div
            className="flex items-center justify-center py-10"
            data-ocid={`admin.${role}.loading_state`}
          >
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div
            className="text-center py-10"
            data-ocid={`admin.${role}.empty_state`}
          >
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">
              No {roleLabel.toLowerCase()}s yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first {roleLabel.toLowerCase()} to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u, i) => (
                  <TableRow key={u.id} data-ocid={`admin.${role}.row.${i + 1}`}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {u.username}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.email || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`border-0 text-xs ${
                          u.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <ResetPasswordDialog user={u} token={token} />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(u)}
                          data-ocid={`admin.${role}.toggle.${i + 1}`}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Notices Section ───────────────────────────────────────────────────────────────
function NoticesSection({
  collegeId,
  token,
}: { collegeId: string; token: string }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState("all");
  const [submitting, setSubmitting] = useState(false);

  const fetchNotices = useCallback(async () => {
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

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSubmitting(true);
    try {
      await backend.createNotice(token, collegeId, title, content, targetRole);
      toast.success("Notice posted!");
      setTitle("");
      setContent("");
      fetchNotices();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to post notice");
    } finally {
      setSubmitting(false);
    }
  };

  const INPUT =
    "w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";

  return (
    <div className="space-y-5">
      <div className={CARD}>
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Post New Notice
        </h3>
        <div className="space-y-3">
          <input
            className={INPUT}
            placeholder="Notice title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            data-ocid="admin.notices.title.input"
          />
          <textarea
            className={`${INPUT} min-h-[90px] resize-y`}
            placeholder="Notice content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            data-ocid="admin.notices.content.textarea"
          />
          <div className="flex items-center gap-3">
            <Label className="text-sm">Target:</Label>
            <Select value={targetRole} onValueChange={setTargetRole}>
              <SelectTrigger
                className="w-40"
                data-ocid="admin.notices.target.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="feeManager">Fee Manager</SelectItem>
                <SelectItem value="principal">Principal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handlePost}
            disabled={submitting || !title || !content}
            className="w-full"
            data-ocid="admin.notices.submit_button"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Post Notice
          </Button>
        </div>
      </div>

      <div className={CARD}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">All Notices</h3>
          <Button variant="outline" size="sm" onClick={fetchNotices}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {loading ? (
          <div
            className="flex items-center justify-center py-8"
            data-ocid="admin.notices.loading_state"
          >
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : notices.length === 0 ? (
          <div
            className="text-center py-8"
            data-ocid="admin.notices.empty_state"
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
                data-ocid={`admin.notices.item.${i + 1}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {n.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {n.content}
                    </p>
                  </div>
                  <Badge className="border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs flex-shrink-0">
                    {n.targetRole}
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

// ── Main Dashboard ──────────────────────────────────────────────────────────
export function AdminDashboard({ section }: { section: string }) {
  const { user } = useAuth();
  const token = user?.token ?? "";
  const collegeId = user?.collegeId ?? "";

  const [college, setCollege] = useState<College | null>(null);
  const [userCounts, setUserCounts] = useState({
    students: 0,
    teachers: 0,
    feeManagers: 0,
    principals: 0,
  });
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!token || !collegeId) return;
    setLoadingStats(true);
    try {
      const [col, studs, tchs, fms, prins, nts] = await Promise.all([
        backend.getCollege(token, collegeId).catch(() => null),
        backend.listUsers(token, collegeId, UserRole.student).catch(() => []),
        backend.listUsers(token, collegeId, UserRole.teacher).catch(() => []),
        backend
          .listUsers(token, collegeId, UserRole.feeManager)
          .catch(() => []),
        backend.listUsers(token, collegeId, UserRole.principal).catch(() => []),
        backend.listNotices(token, collegeId).catch(() => []),
      ]);
      setCollege(col);
      setUserCounts({
        students: studs.length,
        teachers: tchs.length,
        feeManagers: fms.length,
        principals: prins.length,
      });
      setNotices(nts);
    } finally {
      setLoadingStats(false);
    }
  }, [token, collegeId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (section === "students") {
    return <AdminStudents collegeId={collegeId} token={token} />;
  }

  if (section === "users") {
    return (
      <div className="p-6 space-y-5">
        <h2 className="text-xl font-bold text-foreground">User Management</h2>
        <Tabs defaultValue="teachers">
          <TabsList data-ocid="admin.users.tab">
            <TabsTrigger value="teachers" data-ocid="admin.users.teachers.tab">
              Teachers
            </TabsTrigger>
            <TabsTrigger
              value="feeManagers"
              data-ocid="admin.users.feemanagers.tab"
            >
              Fee Managers
            </TabsTrigger>
            <TabsTrigger
              value="principals"
              data-ocid="admin.users.principals.tab"
            >
              Principals
            </TabsTrigger>
          </TabsList>
          <TabsContent value="teachers" className="mt-5">
            <RoleUsersTab
              role={UserRole.teacher}
              collegeId={collegeId}
              token={token}
            />
          </TabsContent>
          <TabsContent value="feeManagers" className="mt-5">
            <RoleUsersTab
              role={UserRole.feeManager}
              collegeId={collegeId}
              token={token}
            />
          </TabsContent>
          <TabsContent value="principals" className="mt-5">
            <RoleUsersTab
              role={UserRole.principal}
              collegeId={collegeId}
              token={token}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  if (section === "notices") {
    return (
      <div className="p-6 space-y-5">
        <h2 className="text-xl font-bold text-foreground">Notices</h2>
        <NoticesSection collegeId={collegeId} token={token} />
      </div>
    );
  }

  if (section === "security") {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Password Reset
        </h2>
        <div className={CARD}>
          <p className="text-sm text-muted-foreground mb-4">
            Use the User Management section to reset passwords for individual
            users.
          </p>
          <Tabs defaultValue="teachers">
            <TabsList>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
              <TabsTrigger value="feeManagers">Fee Managers</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
            </TabsList>
            <TabsContent value="teachers" className="mt-5">
              <RoleUsersTab
                role={UserRole.teacher}
                collegeId={collegeId}
                token={token}
              />
            </TabsContent>
            <TabsContent value="feeManagers" className="mt-5">
              <RoleUsersTab
                role={UserRole.feeManager}
                collegeId={collegeId}
                token={token}
              />
            </TabsContent>
            <TabsContent value="students" className="mt-5">
              <RoleUsersTab
                role={UserRole.student}
                collegeId={collegeId}
                token={token}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  if (section === "settings") {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <div className={CARD}>
          <p className="text-sm text-muted-foreground">
            College ID: <strong>{collegeId}</strong>
          </p>
          {college && (
            <div className="mt-4 space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Name:</span>{" "}
                <strong>{college.name}</strong>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Code:</span>{" "}
                <strong>{college.code}</strong>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Address:</span>{" "}
                <strong>{college.address || "—"}</strong>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Status:</span>{" "}
                <Badge
                  className={`border-0 text-xs ${
                    college.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {college.status}
                </Badge>
              </p>
            </div>
          )}
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
        <h2 className="text-xl font-bold text-foreground">Admin Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {college?.name ?? "Your College"}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          value={String(userCounts.students)}
          label="Students"
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          icon={Users}
          value={String(userCounts.teachers)}
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
          icon={Shield}
          value={String(userCounts.principals)}
          label="Principals"
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
      </div>

      {loadingStats && (
        <div
          className="flex items-center justify-center py-8"
          data-ocid="admin.dashboard.loading_state"
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
              data-ocid="admin.dashboard.notices.empty_state"
            >
              <p className="text-sm text-muted-foreground">No notices yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.slice(0, 5).map((n, i) => (
                <div
                  key={n.id}
                  className="py-2 border-b border-border last:border-0"
                  data-ocid={`admin.dashboard.notices.item.${i + 1}`}
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
          <h3 className="font-semibold text-foreground mb-4">College Info</h3>
          {college ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {college.code.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {college.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {college.address}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Code</p>
                  <p className="font-medium text-foreground">{college.code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    className={`border-0 text-xs ${
                      college.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {college.status}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                Loading college info…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
