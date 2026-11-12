"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import useSWR from "swr";
import { usePathname } from "next/navigation";
import type { FleetNotification } from "@/lib/db/notifications";

const READ_STORAGE_KEY = "nita-read-notifications";
const READ_CHANGED_EVENT = "fleet-notifications-read";

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(READ_STORAGE_KEY) ?? "[]");
    if (Array.isArray(saved)) {
      return new Set(saved.filter((id): id is string => typeof id === "string"));
    }
  } catch {
    /* Read state is optional when storage is blocked. */
  }
  return new Set();
}

let memoryReadIds = new Set<string>();

async function fetchNotifications(url: string): Promise<FleetNotification[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Alerts could not be loaded.");
  return response.json();
}

/** Navigation badges, dashboard alerts, and the notification popover share one SWR cache and read state. */
export function useFleetNotifications() {
  const pathname = usePathname();
  const rto = pathname.startsWith("/rent-to-own");
  const result = useSWR("/api/notifications", fetchNotifications, { refreshInterval: 60000 });
  const { mutate } = result;
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set(memoryReadIds));

  useEffect(() => {
    const stored = loadReadIds();
    if (stored.size > 0) {
      memoryReadIds = stored;
      setReadIds(new Set(stored));
    }
    const syncRead = () => {
      const latest = loadReadIds();
      memoryReadIds = new Set([...memoryReadIds, ...latest]);
      setReadIds(new Set(memoryReadIds));
    };
    const refresh = () => {
      void mutate();
    };
    window.addEventListener(READ_CHANGED_EVENT, syncRead);
    window.addEventListener("storage", syncRead);
    window.addEventListener("fleet-data-changed", refresh);
    return () => {
      window.removeEventListener(READ_CHANGED_EVENT, syncRead);
      window.removeEventListener("storage", syncRead);
      window.removeEventListener("fleet-data-changed", refresh);
    };
  }, [mutate]);

  const markRead = useCallback((ids: string[]) => {
    const next = new Set([...memoryReadIds, ...loadReadIds(), ...ids]);
    memoryReadIds = next;
    setReadIds(next);
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...next].slice(-500)));
    } catch {
      /* Keep the panel usable without storage. */
    }
    window.dispatchEvent(new Event(READ_CHANGED_EVENT));
  }, []);

  const data = useMemo(() => (result.data ?? []).filter(item => item.href.startsWith("/rent-to-own") === rto), [result.data, rto]);
  const unreadData = useMemo(
    () => data.filter((item) => !readIds.has(item.id)),
    [data, readIds]
  );

  return {
    ...result,
    data,
    unreadData,
    readIds,
    markRead,
  };
}
