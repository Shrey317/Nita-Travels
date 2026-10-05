"use client";

import { useEffect } from "react";
import useSWR from "swr";
import type { FleetNotification } from "@/lib/db/notifications";

async function fetchNotifications(url: string): Promise<FleetNotification[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Alerts could not be loaded.");
  return response.json();
}

/** Navigation badges and the alert panel share one SWR request and cache. */
export function useFleetNotifications() {
  const result = useSWR("/api/notifications", fetchNotifications, { refreshInterval: 60000 });
  const { mutate } = result;
  useEffect(() => {
    const refresh = () => { void mutate(); };
    window.addEventListener("fleet-data-changed", refresh);
    return () => window.removeEventListener("fleet-data-changed", refresh);
  }, [mutate]);
  return result;
}
