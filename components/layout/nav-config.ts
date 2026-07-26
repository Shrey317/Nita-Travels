import { LayoutDashboard, Car, Receipt, Wrench, Gauge, ClipboardCheck, StickyNote, CalendarRange, BarChart3 } from "lucide-react";

/** Sidebar nav, in order, per SRS 14.2. */
export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicles", icon: Car },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/repairs", label: "Repairs Log", icon: Wrench },
  { href: "/mileage", label: "Mileage Log", icon: Gauge },
  { href: "/service", label: "Service Status", icon: ClipboardCheck },
  { href: "/notes", label: "Vehicle Notes", icon: StickyNote },
  { href: "/monthly", label: "Monthly Breakdown", icon: CalendarRange },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;
