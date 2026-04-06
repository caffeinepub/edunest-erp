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
import {
  Building2,
  Camera,
  ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { College, User } from "../../backend";
import { UserRole } from "../../backend";
import { backendAPI as backend } from "../../backendAPI";
import { useAuth } from "../../contexts/AuthContext";

// Extended user type with optional photoUrl (backend runtime supports it)
type UserWithPhoto = User & { photoUrl?: string };

const CARD = "bg-card rounded-2xl border border-border shadow-card p-5";

// Extend College with optional logoUrl (backend supports it even if generated types lag)
type CollegeWithLogo = College & { logoUrl?: string };

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

// ── Upload Logo Dialog ──────────────────────────────────────────────────────
function UploadLogoDialog({
  college,
  token,
  onUpdated,
}: { college: CollegeWithLogo; token: string; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [logoDataUrl, setLogoDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setLogoDataUrl(dataUrl);
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!logoDataUrl) {
      toast.error("Please select an image first.");
      return;
    }
    setLoading(true);
    try {
      // biome-ignore lint/suspicious/noExplicitAny: uploadCollegeLogo added in backend but not yet in generated types
      await (backend as any).uploadCollegeLogo(token, college.id, logoDataUrl);
      toast.success(`Logo uploaded for "${college.name}"!`);
      setOpen(false);
      setPreviewUrl("");
      setLogoDataUrl("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUpdated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setPreviewUrl("");
      setLogoDataUrl("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-ocid="super.colleges.logo.open_modal_button"
        >
          <ImageIcon className="w-4 h-4 mr-1" /> Logo
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="super.colleges.logo.dialog">
        <DialogHeader>
          <DialogTitle>Upload College Logo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Upload a logo for <strong>{college.name}</strong>
          </p>

          {/* Current logo preview */}
          {college.logoUrl && !previewUrl && (
            <div className="space-y-1.5">
              <Label>Current Logo</Label>
              <div className="flex items-center gap-3">
                <img
                  src={college.logoUrl}
                  alt={`${college.name} logo`}
                  className="w-16 h-16 rounded-lg object-cover border border-border"
                />
                <span className="text-xs text-muted-foreground">
                  Logo already set. Upload a new one to replace it.
                </span>
              </div>
            </div>
          )}

          {/* New image preview */}
          {previewUrl && (
            <div className="space-y-1.5">
              <Label>Preview</Label>
              <div className="flex items-center justify-center rounded-xl border border-border bg-muted/30 p-3">
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  className="max-h-[120px] max-w-full rounded-lg object-contain"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="logo-file">Select Image *</Label>
            <Input
              id="logo-file"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              data-ocid="super.colleges.logo.upload_button"
              className="cursor-pointer file:cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, GIF, WebP. Recommended size: 200×200px.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            data-ocid="super.colleges.logo.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !logoDataUrl}
            data-ocid="super.colleges.logo.submit_button"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? "Uploading..." : "Save Logo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Upload User Photo Dialog (for admins) ─────────────────────────────────────
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
          data-ocid="super.admins.photo.open_modal_button"
        >
          <ImageIcon className="w-3.5 h-3.5 mr-1" /> Photo
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="super.admins.photo.dialog">
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
            <Label htmlFor="admin-photo-file">Select Photo *</Label>
            <Input
              id="admin-photo-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              data-ocid="super.admins.photo.upload_button"
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
            data-ocid="super.admins.photo.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !photoDataUrl}
            data-ocid="super.admins.photo.submit_button"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? "Uploading..." : "Save Photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add College Dialog ──────────────────────────────────────────────────────
function AddCollegeDialog({
  token,
  onCreated,
}: { token: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", address: "" });
  const [logoDataUrl, setLogoDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetState = () => {
    setForm({ name: "", code: "", address: "" });
    setLogoDataUrl("");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetState();
  };

  const handleSubmit = async () => {
    if (!form.name || !form.code) {
      toast.error("College name and code are required.");
      return;
    }
    setLoading(true);
    try {
      const newCollege = await backend.createCollege(
        token,
        form.name,
        form.code,
        form.address,
      );
      // Upload logo inline if provided
      if (logoDataUrl) {
        try {
          // biome-ignore lint/suspicious/noExplicitAny: uploadCollegeLogo added in backend runtime
          await (backend as any).uploadCollegeLogo(
            token,
            newCollege.id,
            logoDataUrl,
          );
        } catch {
          // Non-fatal: college created, logo upload failed
          toast.error("College created but logo upload failed.");
        }
      }
      toast.success(`College "${form.name}" created!`);
      resetState();
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          {/* Inline Logo Upload */}
          <div className="space-y-2">
            <Label>College Logo (Optional)</Label>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-muted"
              data-ocid="super.colleges.logo.dropzone"
            >
              {logoDataUrl ? (
                <img
                  src={logoDataUrl}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Building2 className="w-6 h-6 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">
                    Upload Logo
                  </span>
                </div>
              )}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoSelect}
            />
            {logoDataUrl && (
              <button
                type="button"
                onClick={() => {
                  setLogoDataUrl("");
                  if (logoInputRef.current) logoInputRef.current.value = "";
                }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Remove logo
              </button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
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
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetState = () => {
    setForm({
      name: "",
      username: "",
      email: "",
      password: "",
      phone: "",
      collegeId: "",
    });
    setPhotoDataUrl("");
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetState();
  };

  const handleSubmit = async () => {
    if (!form.name || !form.username || !form.password || !form.collegeId) {
      toast.error("Name, username, password and college are required.");
      return;
    }
    setLoading(true);
    try {
      const newAdmin = await backend.createUser(
        token,
        form.username,
        form.email,
        form.password,
        UserRole.admin,
        form.collegeId,
        form.name,
        form.phone,
      );
      // Upload photo inline if provided
      if (photoDataUrl) {
        try {
          // biome-ignore lint/suspicious/noExplicitAny: uploadUserPhoto added in backend runtime
          await (backend as any).uploadUserPhoto(
            token,
            newAdmin.id,
            photoDataUrl,
          );
        } catch {
          // Non-fatal: admin created, photo upload failed
          toast.error("Admin created but photo upload failed.");
        }
      }
      toast.success(`Admin "${form.name}" created!`);
      resetState();
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          {/* Inline Admin Photo Upload */}
          <div className="space-y-2">
            <Label>Admin Photo (Optional)</Label>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-muted"
              data-ocid="super.admins.photo.dropzone"
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
  const [colleges, setColleges] = useState<CollegeWithLogo[]>([]);
  const [admins, setAdmins] = useState<UserWithPhoto[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const token = user?.token ?? "";

  const fetchColleges = useCallback(async () => {
    setLoadingColleges(true);
    try {
      const data = await backend.listColleges(token);
      setColleges(data as CollegeWithLogo[]);
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
      setAdmins(data as UserWithPhoto[]);
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

  const toggleCollegeStatus = async (college: CollegeWithLogo) => {
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

  const deleteCollege = async (college: CollegeWithLogo) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${college.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await backend.deleteCollege(token, college.id);
      setColleges((prev) => prev.filter((c) => c.id !== college.id));
      toast.success(`College "${college.name}" deleted.`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete college",
      );
    }
  };

  const toggleAdminStatus = async (admin: UserWithPhoto) => {
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

  const deleteAdmin = async (admin: UserWithPhoto) => {
    if (
      !window.confirm(
        `Are you sure you want to delete admin "${admin.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await backend.deleteUser(token, admin.id);
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      toast.success(`Admin "${admin.name}" deleted.`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete admin",
      );
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
                    <TableHead>Logo</TableHead>
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
                      <TableCell>
                        {c.logoUrl ? (
                          <img
                            src={c.logoUrl}
                            alt={`${c.name} logo`}
                            className="w-10 h-10 rounded-lg object-cover border border-border"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            <span className="text-xs">No logo</span>
                          </div>
                        )}
                      </TableCell>
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
                        <div className="flex gap-2 flex-wrap">
                          <EditCollegeDialog
                            college={c}
                            token={token}
                            onUpdated={fetchColleges}
                          />
                          <UploadLogoDialog
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
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteCollege(c)}
                            data-ocid={`super.colleges.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
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
                    <TableHead className="w-12">Photo</TableHead>
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
                      <TableCell>
                        {a.photoUrl ? (
                          <img
                            src={a.photoUrl}
                            alt={a.name}
                            className="w-9 h-9 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {a.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                      </TableCell>
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
                        <div className="flex gap-1.5 flex-wrap">
                          <UploadUserPhotoDialog
                            user={a}
                            token={token}
                            onUpdated={fetchAdmins}
                          />
                          <ResetPasswordDialog user={a} token={token} />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAdminStatus(a)}
                            data-ocid={`super.admins.toggle.${i + 1}`}
                          >
                            {a.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteAdmin(a)}
                            data-ocid={`super.admins.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
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
                  <div className="flex items-center gap-3">
                    {c.logoUrl ? (
                      <img
                        src={c.logoUrl}
                        alt={`${c.name} logo`}
                        className="w-8 h-8 rounded-md object-cover border border-border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {c.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{c.code}</p>
                    </div>
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
                  <div className="flex items-center gap-3">
                    {a.photoUrl ? (
                      <img
                        src={a.photoUrl}
                        alt={a.name}
                        className="w-8 h-8 rounded-full object-cover border border-border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                        {a.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {a.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.username}
                      </p>
                    </div>
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
