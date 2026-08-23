"use client";

import { useState, useEffect, useRef } from "react";
import { User, LogOut, Moon, Sun, Keyboard, Monitor } from "lucide-react";
import { signOutAction } from "@/app/(dashboard)/actions";
import { useTheme } from "@/components/layout/theme-provider";

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Global keyboard shortcut for ? to open shortcuts help
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const shortcuts = [
    { keys: "Ctrl + K", action: "Open search" },
    { keys: "?", action: "Keyboard shortcuts" },
    { keys: "Esc", action: "Close dialogs" },
  ];

  return (
    <>
      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/10 text-teal-dark dark:text-teal-light cursor-pointer hover:bg-teal/20 transition-colors border border-teal/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light"
          aria-label="User menu"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <User className="h-4 w-4" />
        </button>

        {open && (
          <div
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card shadow-card-elevated animate-scale-in origin-top-right"
            role="menu"
            aria-label="User menu"
          >
            {/* User info */}
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-ink">Nita Travels Admin</p>
              <p className="text-xs text-muted">Owner</p>
            </div>

            {/* Theme options */}
            <div className="border-b border-border p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted">Theme</p>
              <div className="flex gap-1">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light ${
                    theme === "light" ? "bg-teal/10 text-teal font-medium" : "text-muted hover:bg-surface hover:text-ink"
                  }`}
                  role="menuitemradio"
                  aria-checked={theme === "light"}
                >
                  <Sun className="h-3.5 w-3.5" />
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light ${
                    theme === "dark" ? "bg-teal/10 text-teal font-medium" : "text-muted hover:bg-surface hover:text-ink"
                  }`}
                  role="menuitemradio"
                  aria-checked={theme === "dark"}
                >
                  <Moon className="h-3.5 w-3.5" />
                  Dark
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light ${
                    theme === "system" ? "bg-teal/10 text-teal font-medium" : "text-muted hover:bg-surface hover:text-ink"
                  }`}
                  role="menuitemradio"
                  aria-checked={theme === "system"}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  Auto
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={() => { setOpen(false); setShortcutsOpen(true); }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-surface hover:text-ink transition-colors focus-visible:outline-none focus-visible:bg-surface/80"
                role="menuitem"
              >
                <Keyboard className="h-4 w-4" />
                Keyboard Shortcuts
                <kbd className="ml-auto rounded bg-surface px-1.5 font-mono text-[10px] border border-border">?</kbd>
              </button>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-status-red hover:bg-red-500/5 transition-colors focus-visible:outline-none focus-visible:bg-red-500/5"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Dialog */}
      {shortcutsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/70 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-card-elevated animate-scale-in"
            role="dialog"
            aria-label="Keyboard shortcuts"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShortcutsOpen(false)}
                className="rounded-md p-1 text-muted hover:bg-surface hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light"
                aria-label="Close shortcuts dialog"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {shortcuts.map((s) => (
                <div key={s.keys} className="flex items-center justify-between rounded-md px-2 py-2">
                  <span className="text-sm text-ink">{s.action}</span>
                  <kbd className="rounded bg-surface px-2 py-0.5 font-mono text-xs text-muted border border-border">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
