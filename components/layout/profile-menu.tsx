"use client";

import Link from "next/link";
import { User, LogOut, Shield, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { signOutAction } from "./actions";

interface ProfileMenuProps {
  isAdmin?: boolean;
  userName?: string;
  userEmail?: string;
}

export function ProfileMenu({ isAdmin = true, userName = "admin", userEmail }: ProfileMenuProps) {
  const roleLabel = isAdmin ? "Administrator" : "Staff User";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu" className="rounded-full bg-surface-secondary">
          <User className="h-5 w-5 text-ink" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-2">
        <div className="px-2 py-1.5 text-sm font-semibold text-ink truncate">
          {userName}
        </div>
        {userEmail && (
          <div className="px-2 pb-1 text-xs text-muted truncate">
            {userEmail}
          </div>
        )}
        <div className="px-2 pb-2 text-xs text-muted flex items-center gap-1 border-b border-border mb-1">
          <Shield className="h-3 w-3 text-teal" /> {roleLabel}
        </div>
        {isAdmin && (
          <Link
            href="/staff"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink hover:bg-surface-secondary transition-colors mb-1"
          >
            <Users className="h-4 w-4 text-primary" />
            Users & Access
          </Link>
        )}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
