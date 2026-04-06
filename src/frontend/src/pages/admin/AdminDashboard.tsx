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
  BookOpen,
  Camera,
  GraduationCap,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { College, Notice, User } from "../../backend";
import { UserRole } from "../../backend";
import { backendAPI as backend } from "../../backendAPI";
import { useAuth } from "../../contexts/AuthContext";
import { AdminStudents } from "./AdminStudents";

// Extended user type with optional photoUrl (backend runtime supports it)
type UserWithPhoto = User & { photoUrl?: string };

const CARD = "bg-card rounded-2xl border border-border shadow-card p-5";
// Local types for Department and Course (new backend features)
interface Department {
  id: string;
  collegeId: string;
  name: string;
  code: string;
  createdAt: bigint;
}
interface Course {
  id: string;
  collegeId: string;
  departmentId: string;
  name: string;
  code: string;
  duration: string;
  createdAt: bigint;
}

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

// ── Upload User Photo Dialog ──────────────────────────────────────────────────
function UploadUserPhotoDialog({
  user: targetUser,
  token,
  onUpdated,
}: { user: UserWithPhoto; token: string; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setPhotoDataUrl(dataUrl);
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!photoDataUrl) {
      toast.error("Please select an image first.");
      return;
    }
    setLoading(true);
    try {
      // biome-ignore lint/suspicious/noExplicitAny: uploadUserPhoto added in backend runtime
      await (backend as any).uploadUserPhoto(
        token,
        targetUser.id,
        photoDataUrl,
      );
      toast.success(`Photo uploaded for "${targetUser.name}"!`);
      setOpen(false);
      setPreviewUrl("");
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

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setPreviewUrl("");
      setPhotoDataUrl("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-ocid="admin.users.photo.open_modal_button"
        >
          <ImageIcon className="w-3.5 h-3.5 mr-1" /> Photo
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="admin.users.photo.dialog">
        <DialogHeader>
          <DialogTitle>Upload Profile Photo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Upload a profile photo for <strong>{targetUser.name}</strong>
          </p>

          {/* Current photo preview */}
          {targetUser.photoUrl && !previewUrl && (
            <div className="space-y-1.5">
              <Label>Current Photo</Label>
              <div className="flex items-center gap-3">
                <img
                  src={targetUser.photoUrl}
                  alt={targetUser.name}
                  className="w-14 h-14 rounded-full object-cover border border-border"
                />
                <span className="text-xs text-muted-foreground">
                  Photo already set. Upload a new one to replace it.
                </span>
              </div>
            </div>
          )}

          {/* New image preview */}
          {previewUrl && (
            <div className="space-y-1.5">
              <Label>Preview</Label>
              <div className="flex items-center gap-3">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border border-border"
                />
                <span className="text-xs text-muted-foreground">
                  This will be saved as the profile photo.
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="user-photo-file">Select Photo *</Label>
            <Input
              id="user-photo-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              data-ocid="admin.users.photo.upload_button"
              className="cursor-pointer file:cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, GIF, WebP. Recommended: 200×200px or square.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            data-ocid="admin.users.photo.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !photoDataUrl}
            data-ocid="admin.users.photo.submit_button"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? "Uploading..." : "Save Photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetState = () => {
    setForm({ name: "", username: "", email: "", password: "", phone: "" });
    setPhotoDataUrl("");
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetState();
  };

  const handleSubmit = async () => {
    if (!form.name || !form.username || !form.password) {
      toast.error("Name, username and password are required.");
      return;
    }
    setLoading(true);
    try {
      const newUser = await backend.createUser(
        token,
        form.username,
        form.email,
        form.password,
        role,
        collegeId,
        form.name,
        form.phone,
      );
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
          toast.error(`${roleLabel} created but photo upload failed.`);
        }
      }
      toast.success(`${roleLabel} "${form.name}" created!`);
      resetState();
      setOpen(false);
      onCreated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          {/* Inline Photo Upload */}
          <div className="space-y-2">
            <Label>Photo (Optional)</Label>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-muted"
              data-ocid={`admin.${role}.photo.dropzone`}
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
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            {photoDataUrl && (
              <button
                type="button"
                onClick={() => {
                  setPhotoDataUrl("");
                  if (photoInputRef.current) photoInputRef.current.value = "";
                }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
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
  const [users, setUsers] = useState<UserWithPhoto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await backend.listUsers(token, collegeId, role);
      setUsers(data as UserWithPhoto[]);
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

  const toggleActive = async (u: UserWithPhoto) => {
    try {
      await backend.updateUser(
        token,
        u.id,
        u.name,
        u.email,
        u.phone,
        !u.isActive,
      );
      setUsers((prev: UserWithPhoto[]) =>
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
                  <TableHead className="w-12">Photo</TableHead>
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
                    <TableCell>
                      {u.photoUrl ? (
                        <img
                          src={u.photoUrl}
                          alt={u.name}
                          className="w-9 h-9 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {u.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                    </TableCell>
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
                      <div className="flex gap-1.5 flex-wrap">
                        <UploadUserPhotoDialog
                          user={u}
                          token={token}
                          onUpdated={fetchUsers}
                        />
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

// ── Departments & Courses Section ────────────────────────────────────────────
function DepartmentsSection({
  collegeId,
  token,
}: { collegeId: string; token: string }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Department form state
  const [addDeptOpen, setAddDeptOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", code: "" });
  const [savingDept, setSavingDept] = useState(false);

  // Edit department state
  const [editDeptOpen, setEditDeptOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editDeptForm, setEditDeptForm] = useState({ name: "", code: "" });
  const [updatingDept, setUpdatingDept] = useState(false);

  // Course form state
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    name: "",
    code: "",
    departmentId: "",
    duration: "",
  });
  const [savingCourse, setSavingCourse] = useState(false);

  // Edit course state
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseForm, setEditCourseForm] = useState({
    name: "",
    code: "",
    duration: "",
  });
  const [updatingCourse, setUpdatingCourse] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setLoadingDepts(true);
    try {
      // biome-ignore lint/suspicious/noExplicitAny: listDepartments added in backend runtime
      const data = (await (backend as any).listDepartments(
        token,
        collegeId,
      )) as Department[];
      setDepartments(data);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load departments",
      );
    } finally {
      setLoadingDepts(false);
    }
  }, [token, collegeId]);

  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      // biome-ignore lint/suspicious/noExplicitAny: listCourses added in backend runtime
      const data = (await (backend as any).listCourses(
        token,
        collegeId,
      )) as Course[];
      setCourses(data);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load courses",
      );
    } finally {
      setLoadingCourses(false);
    }
  }, [token, collegeId]);

  useEffect(() => {
    Promise.all([fetchDepartments(), fetchCourses()]);
  }, [fetchDepartments, fetchCourses]);

  // ── Department CRUD ──────────────────────────────
  const handleAddDept = async () => {
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      toast.error("Department name and code are required.");
      return;
    }
    setSavingDept(true);
    try {
      // biome-ignore lint/suspicious/noExplicitAny: createDepartment added in backend runtime
      await (backend as any).createDepartment(
        token,
        collegeId,
        deptForm.name.trim(),
        deptForm.code.trim(),
      );
      toast.success(`Department "${deptForm.name}" created!`);
      setDeptForm({ name: "", code: "" });
      setAddDeptOpen(false);
      fetchDepartments();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create department",
      );
    } finally {
      setSavingDept(false);
    }
  };

  const openEditDept = (dept: Department) => {
    setEditingDept(dept);
    setEditDeptForm({ name: dept.name, code: dept.code });
    setEditDeptOpen(true);
  };

  const handleUpdateDept = async () => {
    if (!editingDept) return;
    if (!editDeptForm.name.trim() || !editDeptForm.code.trim()) {
      toast.error("Department name and code are required.");
      return;
    }
    setUpdatingDept(true);
    try {
      // biome-ignore lint/suspicious/noExplicitAny: updateDepartment added in backend runtime
      await (backend as any).updateDepartment(
        token,
        editingDept.id,
        editDeptForm.name.trim(),
        editDeptForm.code.trim(),
      );
      toast.success("Department updated!");
      setEditDeptOpen(false);
      setEditingDept(null);
      fetchDepartments();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update department",
      );
    } finally {
      setUpdatingDept(false);
    }
  };

  const handleDeleteDept = async (dept: Department) => {
    if (
      !window.confirm(
        `Delete department "${dept.name}"? This cannot be undone.`,
      )
    )
      return;
    try {
      // biome-ignore lint/suspicious/noExplicitAny: deleteDepartment added in backend runtime
      await (backend as any).deleteDepartment(token, dept.id);
      toast.success(`Department "${dept.name}" deleted.`);
      fetchDepartments();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete department",
      );
    }
  };

  // ── Course CRUD ──────────────────────────────────
  const handleAddCourse = async () => {
    if (
      !courseForm.name.trim() ||
      !courseForm.code.trim() ||
      !courseForm.departmentId ||
      !courseForm.duration.trim()
    ) {
      toast.error("All course fields are required.");
      return;
    }
    setSavingCourse(true);
    try {
      // biome-ignore lint/suspicious/noExplicitAny: createCourse added in backend runtime
      await (backend as any).createCourse(
        token,
        collegeId,
        courseForm.departmentId,
        courseForm.name.trim(),
        courseForm.code.trim(),
        courseForm.duration.trim(),
      );
      toast.success(`Course "${courseForm.name}" created!`);
      setCourseForm({ name: "", code: "", departmentId: "", duration: "" });
      setAddCourseOpen(false);
      fetchCourses();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create course",
      );
    } finally {
      setSavingCourse(false);
    }
  };

  const openEditCourse = (course: Course) => {
    setEditingCourse(course);
    setEditCourseForm({
      name: course.name,
      code: course.code,
      duration: course.duration,
    });
    setEditCourseOpen(true);
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;
    if (
      !editCourseForm.name.trim() ||
      !editCourseForm.code.trim() ||
      !editCourseForm.duration.trim()
    ) {
      toast.error("Course name, code, and duration are required.");
      return;
    }
    setUpdatingCourse(true);
    try {
      // biome-ignore lint/suspicious/noExplicitAny: updateCourse added in backend runtime
      await (backend as any).updateCourse(
        token,
        editingCourse.id,
        editCourseForm.name.trim(),
        editCourseForm.code.trim(),
        editCourseForm.duration.trim(),
      );
      toast.success("Course updated!");
      setEditCourseOpen(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update course",
      );
    } finally {
      setUpdatingCourse(false);
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (
      !window.confirm(`Delete course "${course.name}"? This cannot be undone.`)
    )
      return;
    try {
      // biome-ignore lint/suspicious/noExplicitAny: deleteCourse added in backend runtime
      await (backend as any).deleteCourse(token, course.id);
      toast.success(`Course "${course.name}" deleted.`);
      fetchCourses();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete course",
      );
    }
  };

  const getDeptName = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? `${dept.name}` : "—";
  };

  return (
    <div className="space-y-5">
      <Tabs defaultValue="departments" data-ocid="admin.departments.tab">
        <TabsList>
          <TabsTrigger
            value="departments"
            data-ocid="admin.departments.departments.tab"
          >
            Departments
          </TabsTrigger>
          <TabsTrigger
            value="courses"
            data-ocid="admin.departments.courses.tab"
          >
            Courses
          </TabsTrigger>
        </TabsList>

        {/* ── Departments Tab ── */}
        <TabsContent value="departments" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              Departments
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({departments.length})
              </span>
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDepartments}
                data-ocid="admin.departments.refresh.button"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingDepts ? "animate-spin" : ""}`}
                />
              </Button>

              {/* Add Department Dialog */}
              <Dialog open={addDeptOpen} onOpenChange={setAddDeptOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    data-ocid="admin.departments.add.open_modal_button"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent data-ocid="admin.departments.add.dialog">
                  <DialogHeader>
                    <DialogTitle>Add Department</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="dept-name">Department Name *</Label>
                      <Input
                        id="dept-name"
                        placeholder="e.g. Computer Science"
                        value={deptForm.name}
                        onChange={(e) =>
                          setDeptForm((p) => ({ ...p, name: e.target.value }))
                        }
                        data-ocid="admin.departments.add.name.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dept-code">Code *</Label>
                      <Input
                        id="dept-code"
                        placeholder="e.g. CS"
                        value={deptForm.code}
                        onChange={(e) =>
                          setDeptForm((p) => ({ ...p, code: e.target.value }))
                        }
                        data-ocid="admin.departments.add.code.input"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setAddDeptOpen(false)}
                      data-ocid="admin.departments.add.cancel_button"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddDept}
                      disabled={savingDept}
                      data-ocid="admin.departments.add.submit_button"
                    >
                      {savingDept && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Create Department
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className={CARD}>
            {loadingDepts ? (
              <div
                className="flex items-center justify-center py-10"
                data-ocid="admin.departments.loading_state"
              >
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : departments.length === 0 ? (
              <div
                className="text-center py-12"
                data-ocid="admin.departments.empty_state"
              >
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground">
                  No departments yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your first department to get started.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept, i) => (
                      <TableRow
                        key={dept.id}
                        data-ocid={`admin.departments.row.${i + 1}`}
                      >
                        <TableCell className="font-medium">
                          {dept.name}
                        </TableCell>
                        <TableCell>
                          <Badge className="border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-mono">
                            {dept.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1.5 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDept(dept)}
                              data-ocid={`admin.departments.edit_button.${i + 1}`}
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteDept(dept)}
                              data-ocid={`admin.departments.delete_button.${i + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
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

          {/* Edit Department Dialog */}
          <Dialog
            open={editDeptOpen}
            onOpenChange={(open) => {
              setEditDeptOpen(open);
              if (!open) setEditingDept(null);
            }}
          >
            <DialogContent data-ocid="admin.departments.edit.dialog">
              <DialogHeader>
                <DialogTitle>Edit Department</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-dept-name">Department Name *</Label>
                  <Input
                    id="edit-dept-name"
                    placeholder="e.g. Computer Science"
                    value={editDeptForm.name}
                    onChange={(e) =>
                      setEditDeptForm((p) => ({ ...p, name: e.target.value }))
                    }
                    data-ocid="admin.departments.edit.name.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-dept-code">Code *</Label>
                  <Input
                    id="edit-dept-code"
                    placeholder="e.g. CS"
                    value={editDeptForm.code}
                    onChange={(e) =>
                      setEditDeptForm((p) => ({ ...p, code: e.target.value }))
                    }
                    data-ocid="admin.departments.edit.code.input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditDeptOpen(false)}
                  data-ocid="admin.departments.edit.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateDept}
                  disabled={updatingDept}
                  data-ocid="admin.departments.edit.save_button"
                >
                  {updatingDept && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── Courses Tab ── */}
        <TabsContent value="courses" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              Courses
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({courses.length})
              </span>
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCourses}
                data-ocid="admin.courses.refresh.button"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingCourses ? "animate-spin" : ""}`}
                />
              </Button>

              {/* Add Course Dialog */}
              <Dialog open={addCourseOpen} onOpenChange={setAddCourseOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    data-ocid="admin.courses.add.open_modal_button"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Course
                  </Button>
                </DialogTrigger>
                <DialogContent data-ocid="admin.courses.add.dialog">
                  <DialogHeader>
                    <DialogTitle>Add Course</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="course-name">Course Name *</Label>
                      <Input
                        id="course-name"
                        placeholder="e.g. Bachelor of Computer Applications"
                        value={courseForm.name}
                        onChange={(e) =>
                          setCourseForm((p) => ({ ...p, name: e.target.value }))
                        }
                        data-ocid="admin.courses.add.name.input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="course-code">Code *</Label>
                        <Input
                          id="course-code"
                          placeholder="e.g. BCA"
                          value={courseForm.code}
                          onChange={(e) =>
                            setCourseForm((p) => ({
                              ...p,
                              code: e.target.value,
                            }))
                          }
                          data-ocid="admin.courses.add.code.input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="course-duration">Duration *</Label>
                        <Input
                          id="course-duration"
                          placeholder="e.g. 3 Years"
                          value={courseForm.duration}
                          onChange={(e) =>
                            setCourseForm((p) => ({
                              ...p,
                              duration: e.target.value,
                            }))
                          }
                          data-ocid="admin.courses.add.duration.input"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="course-dept">Department *</Label>
                      <Select
                        value={courseForm.departmentId}
                        onValueChange={(val) =>
                          setCourseForm((p) => ({ ...p, departmentId: val }))
                        }
                      >
                        <SelectTrigger
                          id="course-dept"
                          data-ocid="admin.courses.add.department.select"
                        >
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.length === 0 ? (
                            <SelectItem value="__none__" disabled>
                              No departments — add one first
                            </SelectItem>
                          ) : (
                            departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name} ({dept.code})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {departments.length === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Please add a department first before creating courses.
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setAddCourseOpen(false)}
                      data-ocid="admin.courses.add.cancel_button"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddCourse}
                      disabled={savingCourse || departments.length === 0}
                      data-ocid="admin.courses.add.submit_button"
                    >
                      {savingCourse && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Create Course
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className={CARD}>
            {loadingCourses ? (
              <div
                className="flex items-center justify-center py-10"
                data-ocid="admin.courses.loading_state"
              >
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : courses.length === 0 ? (
              <div
                className="text-center py-12"
                data-ocid="admin.courses.empty_state"
              >
                <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground">No courses yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add departments first, then create courses under them.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course, i) => (
                      <TableRow
                        key={course.id}
                        data-ocid={`admin.courses.row.${i + 1}`}
                      >
                        <TableCell className="font-medium">
                          {course.name}
                        </TableCell>
                        <TableCell>
                          <Badge className="border-0 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-mono">
                            {course.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getDeptName(course.departmentId)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {course.duration}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1.5 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditCourse(course)}
                              data-ocid={`admin.courses.edit_button.${i + 1}`}
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteCourse(course)}
                              data-ocid={`admin.courses.delete_button.${i + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
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

          {/* Edit Course Dialog */}
          <Dialog
            open={editCourseOpen}
            onOpenChange={(open) => {
              setEditCourseOpen(open);
              if (!open) setEditingCourse(null);
            }}
          >
            <DialogContent data-ocid="admin.courses.edit.dialog">
              <DialogHeader>
                <DialogTitle>Edit Course</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {editingCourse && (
                  <p className="text-xs text-muted-foreground">
                    Department:{" "}
                    <strong>{getDeptName(editingCourse.departmentId)}</strong>{" "}
                    (not editable)
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-course-name">Course Name *</Label>
                  <Input
                    id="edit-course-name"
                    placeholder="Course name"
                    value={editCourseForm.name}
                    onChange={(e) =>
                      setEditCourseForm((p) => ({ ...p, name: e.target.value }))
                    }
                    data-ocid="admin.courses.edit.name.input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-course-code">Code *</Label>
                    <Input
                      id="edit-course-code"
                      placeholder="Course code"
                      value={editCourseForm.code}
                      onChange={(e) =>
                        setEditCourseForm((p) => ({
                          ...p,
                          code: e.target.value,
                        }))
                      }
                      data-ocid="admin.courses.edit.code.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-course-duration">Duration *</Label>
                    <Input
                      id="edit-course-duration"
                      placeholder="e.g. 3 Years"
                      value={editCourseForm.duration}
                      onChange={(e) =>
                        setEditCourseForm((p) => ({
                          ...p,
                          duration: e.target.value,
                        }))
                      }
                      data-ocid="admin.courses.edit.duration.input"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditCourseOpen(false)}
                  data-ocid="admin.courses.edit.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateCourse}
                  disabled={updatingCourse}
                  data-ocid="admin.courses.edit.save_button"
                >
                  {updatingCourse && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
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

  if (section === "departments") {
    return (
      <div className="p-6 space-y-5">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" /> Departments &amp;
          Courses
        </h2>
        <DepartmentsSection collegeId={collegeId} token={token} />
      </div>
    );
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
