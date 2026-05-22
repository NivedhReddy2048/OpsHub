"use client";

/**
 * app/(dashboard)/team/page.tsx
 *
 * Team management page for OpsHub.
 * - Admins can view all organization members and register new members.
 * - Support agents / team members see their own details with a graceful prompt.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, UserPlus, AlertCircle, Shield, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";
import type { User as UserType, UserRole } from "@/types";

const ROLE_BADGES: Record<UserRole, { label: string; class: string }> = {
  admin: { label: "Admin", class: "bg-red-500/10 text-red-400 border-red-500/20" },
  support_agent: { label: "Support Agent", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  team_member: { label: "Team Member", class: "bg-green-500/10 text-green-400 border-green-500/20" },
};

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [showAddMember, setShowAddMember] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<UserRole>("team_member");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const isAdmin = currentUser?.role === "admin";

  const { data: members, isLoading, isError, error } = useQuery<UserType[]>({
    queryKey: ["team-members"],
    queryFn: async () => {
      // Non-admins do not have access to accounts/users/ list
      if (currentUser?.role !== "admin") {
        throw new Error("AdminAccessOnly");
      }
      return await authService.listUsers();
    },
    enabled: !!currentUser,
    retry: false,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      setFormSuccess("");
      if (!email.trim() || !fullName.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) {
        throw new Error("All fields are required.");
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }
      return await authService.createUser({
        email: email.trim(),
        full_name: fullName.trim(),
        username: username.trim(),
        role,
        password: password.trim(),
        confirm_password: confirmPassword.trim(),
      });
    },
    onSuccess: () => {
      setFormSuccess("Member registered successfully!");
      setEmail("");
      setFullName("");
      setUsername("");
      setRole("team_member");
      setPassword("");
      setConfirmPassword("");
      qc.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to register member.";
      setFormError(msg);
    },
  });

  // Decide what user list to render
  let displayList: UserType[] = [];
  let showAdminNotice = false;

  if (members) {
    displayList = members;
  } else if (currentUser) {
    // Graceful fallback for support agents and team members
    displayList = [currentUser];
    showAdminNotice = true;
  }

  const initial = (u: UserType) => u.full_name?.[0] ?? u.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Team Members</h2>
          <p className="text-xs text-muted-foreground">
            Manage and view members of your organization
          </p>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setShowAddMember((prev) => !prev)}
          >
            <UserPlus className="h-4 w-4" />
            {showAddMember ? "View List" : "Add Member"}
          </Button>
        )}
      </div>

      {showAdminNotice && (
        <div className="rounded-lg border border-border bg-card p-4 flex gap-3 text-xs">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Standard Member View</p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              To add or manage other organization members, please sign in with an Administrator account. 
              Standard members are authorized to view only their own active profile details.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : showAddMember ? (
        /* Register Member Form */
        <div className="max-w-md rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Register Organization Member
          </h3>

          {formError && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 p-2.5 rounded-lg border border-green-500/20">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Sarah Connor"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase">Username</label>
              <input
                type="text"
                placeholder="e.g. sarahconnor"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase">Email Address</label>
              <input
                type="email"
                placeholder="sarah@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase">Role Badge</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary"
              >
                <option value="team_member">Team Member</option>
                <option value="support_agent">Support Agent</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <Button
            className="w-full text-xs h-9 mt-2"
            disabled={registerMutation.isPending}
            onClick={() => registerMutation.mutate()}
          >
            {registerMutation.isPending ? "Registering..." : "Add Member to Organization"}
          </Button>
        </div>
      ) : displayList.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground mt-2">No team members found</p>
        </div>
      ) : (
        /* Team Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayList.map((member) => {
            const badge = ROLE_BADGES[member.role] ?? { label: member.role, class: "bg-muted text-muted-foreground" };
            return (
              <div
                key={member.id}
                className="rounded-xl border border-border bg-card p-4 flex gap-3 hover:border-primary/20 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {initial(member)}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {member.full_name || "Anonymous Member"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate font-mono">
                    {member.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold border ${badge.class}`}>
                      {badge.label}
                    </span>
                    {!member.is_active && (
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold border bg-red-500/10 text-red-400 border-red-500/20">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
