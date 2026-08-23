import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Car, Receipt, Wrench, Gauge, ClipboardCheck, StickyNote, CalendarRange, BarChart3 } from "lucide-react";

export type NavGroup = {
  label: string;
  items: { href: string; label: string; icon: LucideIcon }[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "OVERVIEW",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "FLEET",
    items: [
      { href: "/vehicles", label: "Vehicles", icon: Car },
      { href: "/mileage", label: "Mileage Log", icon: Gauge },
      { href: "/service", label: "Service Status", icon: ClipboardCheck },
      { href: "/repairs", label: "Repairs Log", icon: Wrench },
      { href: "/notes", label: "Vehicle Notes", icon: StickyNote },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { href: "/transactions", label: "Transactions", icon: Receipt },
      { href: "/monthly", label: "Monthly Breakdown", icon: CalendarRange },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];
