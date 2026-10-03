"use client";

import { useState, useEffect } from "react";
import { User, LogOut, Moon, Sun, Keyboard, Monitor } from "lucide-react";
import { signOutAction } from "@/app/(dashboard)/actions";
import { useTheme } from "@/components/layout/theme-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const shortcuts = [
  { keys: "Ctrl / ⌘ + K", action: "Open search" },
  { keys: "?", action: "Keyboard shortcuts" },
  { keys: "Esc", action: "Close dialogs" },
];

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key !== "?" || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && (event.target.matches("input, textarea, select") || event.target.isContentEditable)) return;
      event.preventDefault();
      setShortcutsOpen((value) => !value);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);
  return <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-button border border-border bg-card text-ink" aria-label="User menu"><User className="h-4 w-4" aria-hidden="true" /></button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0" aria-label="Account and appearance">
        <div className="border-b border-border px-4 py-3"><p className="text-sm font-medium">Nita Travels</p><p className="text-xs text-muted">Fleet administration</p></div>
        <fieldset className="border-b border-border p-3">
          <legend className="sr-only">Appearance</legend>
          <p className="mb-2 text-xs text-muted">Appearance</p>
          <div className="flex gap-1">
            {([{ value: "light", label: "Light", Icon: Sun }, { value: "dark", label: "Dark", Icon: Moon }, { value: "system", label: "Auto", Icon: Monitor }] as const).map(({ value, label, Icon }) => <button key={value} type="button" onClick={() => setTheme(value)} aria-pressed={theme === value} className={`flex min-h-10 flex-1 items-center justify-center gap-1 rounded-input px-2 text-xs ${theme === value ? "bg-brand-blue/10 text-brand-blue font-medium" : "text-muted hover:bg-surface-secondary"}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}</button>)}
          </div>
        </fieldset>
        <div className="p-2">
          <button type="button" onClick={() => { setOpen(false); setShortcutsOpen(true); }} className="flex min-h-10 w-full items-center gap-2 rounded-input px-2 text-sm hover:bg-surface-secondary"><Keyboard className="h-4 w-4" aria-hidden="true" />Keyboard Shortcuts</button>
          <form action={signOutAction}><button type="submit" className="flex min-h-10 w-full items-center gap-2 rounded-input px-2 text-sm text-status-error hover:bg-status-error/10"><LogOut className="h-4 w-4" aria-hidden="true" />Sign Out</button></form>
        </div>
      </PopoverContent>
    </Popover>
    <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Keyboard Shortcuts</DialogTitle><DialogDescription>Navigate fleet records with your keyboard.</DialogDescription></DialogHeader>
        <dl className="space-y-3">{shortcuts.map((shortcut) => <div key={shortcut.keys} className="flex items-center justify-between gap-3"><dt className="text-sm">{shortcut.action}</dt><dd><kbd className="rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-muted">{shortcut.keys}</kbd></dd></div>)}</dl>
      </DialogContent>
    </Dialog>
  </>;
}
