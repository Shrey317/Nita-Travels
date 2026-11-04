"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  CheckCircle2,
  Ban,
  KeyRound,
  Trash2,
  ShieldCheck,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export interface StaffAccountItem {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface StaffManagementProps {
  initialAccounts: StaffAccountItem[];
  adminUsername: string;
}

function statusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="success">Active</Badge>;
    case "PENDING":
      return <Badge variant="warning">Pending Approval</Badge>;
    case "DISABLED":
      return <Badge variant="destructive">Disabled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function StaffManagement({ initialAccounts, adminUsername }: StaffManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<StaffAccountItem[]>(initialAccounts);

  // Create new user form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [creating, setCreating] = useState(false);

  // Action loading state
  const [busyId, setBusyId] = useState<string | null>(null);

  // Inline password reset state
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  async function handleCreateUser(e: FormEvent) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Failed to create user account.", variant: "destructive" });
        return;
      }
      setAccounts((prev) => [data.account, ...prev]);
      setName("");
      setEmail("");
      setPassword("");
      toast({ title: `User account for ${data.account.name} created and activated.` });
      router.refresh();
    } catch {
      toast({ title: "Network error while creating user account.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(account: StaffAccountItem, nextStatus: "ACTIVE" | "DISABLED") {
    if (busyId) return;
    setBusyId(account.id);
    try {
      const res = await fetch(`/api/staff/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Failed to update user status.", variant: "destructive" });
        return;
      }
      setAccounts((prev) => prev.map((a) => (a.id === account.id ? data.account : a)));
      toast({
        title:
          nextStatus === "ACTIVE"
            ? `${account.name} is now active and can sign in.`
            : `${account.name} has been disabled and signed out.`,
      });
      router.refresh();
    } catch {
      toast({ title: "Network error while updating user status.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleResetPassword(account: StaffAccountItem, e: FormEvent) {
    e.preventDefault();
    if (busyId) return;
    setBusyId(account.id);
    try {
      const res = await fetch(`/api/staff/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPasswordValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Failed to reset password.", variant: "destructive" });
        return;
      }
      setAccounts((prev) => prev.map((a) => (a.id === account.id ? data.account : a)));
      setResettingId(null);
      setResetPasswordValue("");
      toast({ title: `Password updated for ${account.name}.` });
    } catch {
      toast({ title: "Network error while resetting password.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteUser(account: StaffAccountItem) {
    if (busyId) return;
    if (!window.confirm(`Delete user account "${account.name}" (${account.email})? This cannot be undone.`)) {
      return;
    }
    setBusyId(account.id);
    try {
      const res = await fetch(`/api/staff/${account.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Failed to delete user account.", variant: "destructive" });
        return;
      }
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
      toast({ title: `Deleted user account for ${account.name}.` });
      router.refresh();
    } catch {
      toast({ title: "Network error while deleting user account.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = accounts.filter((a) => a.status === "PENDING").length;
  const activeCount = accounts.filter((a) => a.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Role Permissions Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-5 shadow-card-elevated">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-ink">Administrator Account (1 Owner Account)</h2>
            <Badge variant="default" className="ml-auto">Full Control</Badge>
          </div>
          <p className="mt-2 text-xs text-ink-secondary">
            Signed in as <span className="font-mono font-semibold text-ink">{adminUsername}</span>. Only the Administrator can edit or delete vehicles, transactions, mileage entries, and notes, and manage user accounts.
          </p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-card p-5 shadow-card-elevated">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-ink">Staff / User Accounts ({activeCount} Active)</h2>
            <Badge variant="secondary" className="ml-auto">Add & View Only</Badge>
          </div>
          <p className="mt-2 text-xs text-ink-secondary">
            Regular users can view fleet pages and add new <strong>Transactions</strong>, <strong>Mileage entries</strong>, <strong>Vehicle Notes</strong>, and <strong>Vehicles</strong>, but cannot edit or delete any existing records.
          </p>
        </div>
      </div>

      {/* Create New User Account Form */}
      <div className="rounded-xl border border-border-subtle bg-card p-6 shadow-card-elevated">
        <div className="flex items-center gap-2.5 mb-1">
          <UserPlus className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-ink">Create New User Account</h2>
        </div>
        <p className="text-xs text-muted mb-5">
          Create a user account directly. Accounts created here are immediately active so the user can sign in right away.
        </p>

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-user-name">Full Name *</Label>
            <Input
              id="new-user-name"
              placeholder="e.g. Sipho Dlamini"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-user-email">Username or Email *</Label>
            <Input
              id="new-user-email"
              placeholder="e.g. sipho@nitatravels.co.za or sipho"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              minLength={3}
              maxLength={254}
              autoCapitalize="none"
              spellCheck={false}
            />
            <p className="text-[11px] text-muted">Used in the &ldquo;Username&rdquo; field on the login screen.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-user-password">Password (min 8 chars) *</Label>
            <div className="relative">
              <Input
                id="new-user-password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={72}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-2.5 top-2.5 text-muted hover:text-ink"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="sm:col-span-3 flex items-center justify-end pt-1">
            <Button type="submit" disabled={creating}>
              <UserPlus className="h-4 w-4" />
              {creating ? "Creating User..." : "Create & Activate User"}
            </Button>
          </div>
        </form>
      </div>

      {/* Existing User Accounts & Registration Requests */}
      <div className="rounded-xl border border-border-subtle bg-card p-6 shadow-card-elevated space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-ink">User Accounts & Registration Requests</h2>
            <p className="text-xs text-muted">
              Manage staff accounts or approve pending requests submitted at <span className="font-mono">/register</span>.
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="warning">{pendingCount} Pending Approval</Badge>
          )}
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-subtle p-10 text-center text-sm text-muted">
            No user accounts yet. Use the form above to add a staff user, or have them request access at <span className="font-mono">/register</span>.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username / Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => {
                const isBusy = busyId === account.id;
                const isResetting = resettingId === account.id;

                return (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium text-ink">{account.name}</TableCell>
                    <TableCell className="font-mono text-xs text-ink-secondary">{account.email}</TableCell>
                    <TableCell>{statusBadge(account.status)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted">
                      {formatDate(account.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {account.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="default"
                            disabled={isBusy}
                            onClick={() => handleStatusChange(account, "ACTIVE")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve & Activate
                          </Button>
                        )}

                        {account.status === "DISABLED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => handleStatusChange(account, "ACTIVE")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
                            Activate
                          </Button>
                        )}

                        {account.status === "ACTIVE" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => handleStatusChange(account, "DISABLED")}
                          >
                            <Ban className="h-3.5 w-3.5 text-status-warning" />
                            Disable
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => {
                            if (isResetting) {
                              setResettingId(null);
                              setResetPasswordValue("");
                            } else {
                              setResettingId(account.id);
                              setResetPasswordValue("");
                              setShowResetPassword(false);
                            }
                          }}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          {isResetting ? "Cancel Reset" : "Reset Password"}
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() => handleDeleteUser(account)}
                          className="text-status-error hover:text-status-error hover:bg-status-error/10"
                          aria-label={`Delete ${account.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {isResetting && (
                        <form
                          onSubmit={(e) => handleResetPassword(account, e)}
                          className="mt-3 flex flex-wrap items-center justify-end gap-2 rounded-lg border border-border-subtle bg-surface-elevated p-2.5"
                        >
                          <div className="relative">
                            <Input
                              type={showResetPassword ? "text" : "password"}
                              placeholder="New password (min 8 chars)"
                              value={resetPasswordValue}
                              onChange={(e) => setResetPasswordValue(e.target.value)}
                              required
                              minLength={8}
                              maxLength={72}
                              className="h-8 w-56 pr-8 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowResetPassword((v) => !v)}
                              className="absolute right-2 top-2 text-muted hover:text-ink"
                              aria-label={showResetPassword ? "Hide password" : "Show password"}
                            >
                              {showResetPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          <Button type="submit" size="sm" disabled={isBusy} className="h-8 text-xs">
                            Save Password
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
