"use client";

/**
 * app/(dashboard)/settings/page.tsx
 *
 * User Profile, Password Update, and Organization metadata settings panel.
 * Allows standard members and admins to modify details securely.
 */
import { useState, useEffect } from "react";
import { 
  Settings, 
  User, 
  Lock, 
  Building, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ShieldAlert 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "org">("profile");

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Load current values
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setUsername(user.username || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");

    if (!fullName.trim() || !username.trim()) {
      setProfileError("Full Name and Username cannot be empty.");
      return;
    }

    setProfileLoading(true);
    try {
      await authService.updateProfile({
        full_name: fullName.trim(),
        username: username.trim(),
      });
      await refreshUser();
      setProfileSuccess("Profile details updated successfully!");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to update profile.";
      setProfileError(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword, confirmPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password updated successfully!");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to update password.";
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Settings Panel
        </h2>
        <p className="text-xs text-muted-foreground">
          Modify your profile preferences, change credentials, and view organization properties
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            activeTab === "profile" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-3.5 w-3.5" />
          My Profile
        </button>

        <button
          onClick={() => setActiveTab("password")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            activeTab === "password" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          Account Security
        </button>

        <button
          onClick={() => setActiveTab("org")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            activeTab === "org" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          Organization Information
        </button>
      </div>

      {/* Profile Form Tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleUpdateProfile} className="rounded-xl border border-border bg-card p-6 space-y-5 max-w-xl">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Profile Settings</h3>
            <p className="text-xs text-muted-foreground">Update your identity and display preferences</p>
          </div>

          {profileError && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 p-2.5 rounded-lg border border-green-500/20">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">Email Address (Read-only)</label>
              <input
                type="text"
                disabled
                value={user.email}
                className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground outline-none cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">Full Display Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">User account handle</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          <Button type="submit" size="sm" className="text-xs h-9" disabled={profileLoading}>
            {profileLoading ? "Saving Updates..." : "Save Profile Details"}
          </Button>
        </form>
      )}

      {/* Password Form Tab */}
      {activeTab === "password" && (
        <form onSubmit={handleUpdatePassword} className="rounded-xl border border-border bg-card p-6 space-y-5 max-w-xl">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Update Password</h3>
            <p className="text-xs text-muted-foreground">Keep your authentication credentials protected</p>
          </div>

          {passwordError && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 p-2.5 rounded-lg border border-green-500/20">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          <Button type="submit" size="sm" className="text-xs h-9 border-primary bg-primary text-primary-foreground" disabled={passwordLoading}>
            {passwordLoading ? "Updating..." : "Update Security Password"}
          </Button>
        </form>
      )}

      {/* Organization Tab */}
      {activeTab === "org" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-5 max-w-xl">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Organization Context</h3>
            <p className="text-xs text-muted-foreground">Details and metadata of your parent organization</p>
          </div>

          {user.organization_name ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 border border-border p-4 rounded-xl bg-muted/10 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-muted-foreground">Org Name</span>
                  <span className="font-semibold text-foreground">{user.organization_name}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-muted-foreground">Context ID</span>
                  <span className="font-mono text-muted-foreground">#{user.organization}</span>
                </div>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex gap-3 text-xs leading-relaxed">
                <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Data Isolation Notice</p>
                  <p className="text-muted-foreground mt-1">
                    Your account is securely bound to the organization scope. All tickets, tasks, projects, 
                    and operational data logs belong exclusively to this organization context and cannot be 
                    accessed by users from other tenants.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-amber-500/20 bg-amber-500/5 p-4 rounded-xl text-center space-y-2">
              <AlertCircle className="mx-auto h-6 w-6 text-amber-400" />
              <p className="text-xs font-semibold text-foreground">No active organization bound</p>
              <p className="text-[11px] text-muted-foreground leading-normal">
                This account is currently in public demo/root context. Please bind your account to an organization context 
                to enable scoped ticket/task management operations.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
