"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function ConnectionStatus() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (!offline) return null;
  return <div role="status" className="flex items-center justify-center gap-2 border-b border-border bg-status-warning-bg px-4 py-3 text-sm text-ink">
    <WifiOff aria-hidden="true" className="h-4 w-4 shrink-0" />
    <p>You’re offline. Reconnect before saving changes or refreshing records.</p>
  </div>;
}
