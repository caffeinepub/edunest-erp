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
import { Building2, Loader2, Plus, RefreshCw, Users } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { College, User } from "../../backend";
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

// ── Add College Dialog ──────────────────────────────────────────────────────
function AddCollegeDialog({
  token,
  onCreated,
}: { token: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", address: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.code) {
      toast.error("College name and code are required.");
      return;
    }
    setLoading(true);
    try {
      await backend.createCollege(token, form.name, form.code, form.address);
      toast.success(`College "${form.name}" created!`);
      setForm({ name: "", code: "", address: "" });
      setOpen(false);
      onCreated();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create college",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-ocid="super.colleges.open_modal_button">
          <Plus className="w-4 h-4 mr-1" /> Add College
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="super.colleges.dialog">
        <DialogHeader>
          <DialogTitle>Add New College</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="col-name">College Name *</Label>
            <Input
              id="col-name"
              placeholder="e.g. Aravali Institute of Technical Studies"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              data-ocid="super.colleges.name.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="col-code">College Code *</Label>
            <Input
              id="col-code"
              placeholder="e.g. AITS"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              data-ocid="super.colleges.code.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="col-addr">Address</Label>
            <Input
              id="col-addr"
              placeholder="City, State"
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
              data-ocid="super.colleges.address.input"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-ocid="super.colleges.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            data-ocid="super.colleges.submit_button"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create College
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit College Dialog ─────────────────────────────────────────────────────
function EditCollegeDialog({
  college,
  token,
  onUpdated,
}: { college: College; token: string; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: college.name,
    address: college.address,
    status: college.status,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await backend.updateCollege(
        token,
        college.id,
        form.name,
        form.address,
        form.status,
      );
      toast.success("College updated!");
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
        <Button
          variant="outline"
          size="sm"
          data-ocid="super.colleges.edit_button"
        >
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit College</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>College Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Admin Dialog ────────────────────────────────────────────────────────
function AddAdminDialog({
  colleges,
  token,
  onCreated,
}: { colleges: College[]; token: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    collegeId: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.username || !form.password || !form.collegeId) {
      toast.error("Name, username, password and college are required.");
      return;
    }
    setLoading(true);
    try {
      await backend.createUser(
        token,
        form.username,
        form.email,
        form.password,
        UserRole.admin,
        form.collegeId,
        form.name,
        form.phone,
      );
      toast.success(`Admin "${form.name}" created!`);
      setForm({
        name: "",
        username: "",
        email: "",
        password: "",
        phone: "",
        collegeId: "",
      });
      setOpen(false);
      onCreated();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create admin",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-ocid="super.admins.open_modal_button">
          <Plus className="w-4 h-4 mr-1" /> Add Admin
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="super.admins.dialog">
        <DialogHeader>
          <DialogTitle>Add Administrator</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Assign to College *</Label>
            <Select
              value={form.collegeId}
              onValueChange={(v) => setForm((p) => ({ ...p, collegeId: v }))}
            >
              <SelectTrigger data-ocid="super.admins.college.select">
                <SelectValue placeholder="Select college" />
              </SelectTrigger>
              <SelectContent>
                {colleges.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                placeholder="Admin name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                data-ocid="super.admins.name.input"
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
                data-ocid="super.admins.username.input"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="admin@college.edu"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              data-ocid="super.admins.email.input"
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
                data-ocid="super.admins.password.input"
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
                data-ocid="super.admins.phone.input"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-ocid="super.admins.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            data-ocid="super.admins.submit_button"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Admin
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
      toast.error(
        err instanceof Error ? err.message : "Failed to reset password",
      );
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
          data-ocid="super.admins.reset_password.button"
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
            data-ocid="super.admins.new_password.input"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-ocid="super.admins.reset_cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleReset}
            disabled={loading || !newPwd}
            data-ocid="super.admins.reset_confirm_button"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Reset Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export function SuperAdminDashboard({ section }: { section: string }) {
  const { user } = useAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const token = user?.token ?? "";

  const fetchColleges = useCallback(async () => {
    setLoadingColleges(true);
    try {
      const data = await backend.listColleges(token);
      setColleges(data);
    } catch {
      toast.error("Failed to load colleges");
    } finally {
      setLoadingColleges(false);
    }
  }, [token]);

  const fetchAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    try {
      const data = await backend.listUsers(token, "", UserRole.admin);
      setAdmins(data);
    } catch {
      toast.error("Failed to load admins");
    } finally {
      setLoadingAdmins(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchColleges();
      fetchAdmins();
    }
  }, [token, fetchColleges, fetchAdmins]);

  const activeColleges = colleges.filter((c) => c.status === "active").length;

  const toggleCollegeStatus = async (college: College) => {
    const newStatus = college.status === "active" ? "suspended" : "active";
    try {
      await backend.updateCollege(
        token,
        college.id,
        college.name,
        college.address,
        newStatus,
      );
      setColleges((prev) =>
        prev.map((c) =>
          c.id === college.id ? { ...c, status: newStatus } : c,
        ),
      );
      toast.success(`College ${newStatus}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const toggleAdminStatus = async (admin: User) => {
    try {
      await backend.updateUser(
        token,
        admin.id,
        admin.name,
        admin.email,
        admin.phone,
        !admin.isActive,
      );
      setAdmins((prev) =>
        prev.map((a) =>
          a.id === admin.id ? { ...a, isActive: !a.isActive } : a,
        ),
      );
      toast.success(`Admin ${!admin.isActive ? "activated" : "deactivated"}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  // Colleges tab
  if (section === "colleges") {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Colleges</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchColleges}
              disabled={loadingColleges}
              data-ocid="super.colleges.refresh.button"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingColleges ? "animate-spin" : ""}`}
              />
            </Button>
            <AddCollegeDialog token={token} onCreated={fetchColleges} />
          </div>
        </div>

        <div className={CARD}>
          {loadingColleges ? (
            <div
              className="flex items-center justify-center py-12"
              data-ocid="super.colleges.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : colleges.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="super.colleges.empty_state"
            >
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground">
                No colleges added yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first college to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="super.colleges.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>College Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colleges.map((c, i) => (
                    <TableRow
                      key={c.id}
                      data-ocid={`super.colleges.row.${i + 1}`}
                    >
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {c.code}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.address || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`border-0 text-xs ${
                            c.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <EditCollegeDialog
                            college={c}
                            token={token}
                            onUpdated={fetchColleges}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCollegeStatus(c)}
                            data-ocid={`super.colleges.toggle.${i + 1}`}
                          >
                            {c.status === "active" ? "Suspend" : "Activate"}
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

  // Admins tab
  if (section === "admins") {
    const collegeMap = Object.fromEntries(colleges.map((c) => [c.id, c.name]));
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Administrators</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchAdmins();
                fetchColleges();
              }}
              disabled={loadingAdmins}
              data-ocid="super.admins.refresh.button"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingAdmins ? "animate-spin" : ""}`}
              />
            </Button>
            <AddAdminDialog
              colleges={colleges}
              token={token}
              onCreated={fetchAdmins}
            />
          </div>
        </div>

        <div className={CARD}>
          {loadingAdmins ? (
            <div
              className="flex items-center justify-center py-12"
              data-ocid="super.admins.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : admins.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="super.admins.empty_state"
            >
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground">No admins yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add an admin and assign them to a college.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="super.admins.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((a, i) => (
                    <TableRow
                      key={a.id}
                      data-ocid={`super.admins.row.${i + 1}`}
                    >
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {a.username}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.email || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {collegeMap[a.collegeId] || a.collegeId}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`border-0 text-xs ${
                            a.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {a.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <ResetPasswordDialog user={a} token={token} />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAdminStatus(a)}
                            data-ocid={`super.admins.toggle.${i + 1}`}
                          >
                            {a.isActive ? "Deactivate" : "Activate"}
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

  // Default: Dashboard overview
  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-bold text-foreground">Platform Overview</h2>
        <p className="text-muted-foreground text-sm mt-1">
          EduNest ERP — Super Admin Control Panel
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Building2}
          value={String(colleges.length)}
          label="Total Colleges"
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          icon={Users}
          value={String(admins.length)}
          label="Total Admins"
          color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatCard
          icon={Building2}
          value={String(activeColleges)}
          label="Active Colleges"
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={CARD}>
          <h3 className="font-semibold text-foreground mb-4">
            Recent Colleges
          </h3>
          {loadingColleges ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : colleges.length === 0 ? (
            <div
              className="text-center py-8"
              data-ocid="super.dashboard.colleges.empty_state"
            >
              <p className="text-sm text-muted-foreground">No colleges yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {colleges.slice(0, 5).map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  data-ocid={`super.dashboard.colleges.item.${i + 1}`}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {c.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.code}</p>
                  </div>
                  <Badge
                    className={`border-0 text-xs ${
                      c.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={CARD}>
          <h3 className="font-semibold text-foreground mb-4">Recent Admins</h3>
          {loadingAdmins ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : admins.length === 0 ? (
            <div
              className="text-center py-8"
              data-ocid="super.dashboard.admins.empty_state"
            >
              <p className="text-sm text-muted-foreground">No admins yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {admins.slice(0, 5).map((a, i) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  data-ocid={`super.dashboard.admins.item.${i + 1}`}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {a.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.username}
                    </p>
                  </div>
                  <Badge
                    className={`border-0 text-xs ${
                      a.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {a.isActive ? "Active" : "Inactive"}
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
