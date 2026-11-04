import {
  LayoutDashboard,
  Bell,
  Car,
  Gauge,
  Wrench,
  Hammer,
  StickyNote,
  Receipt,
  Calendar,
  CalendarDays,
  BarChart3,
  ShieldAlert,
  FileBarChart,
  RefreshCcw,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "alerts";
  adminOnly?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Command",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/alerts", label: "Alert Center", icon: Bell, badge: "alerts" },
    ],
  },
  {
    label: "Fleet",
    items: [
      { href: "/vehicles", label: "Vehicles", icon: Car },
      { href: "/mileage", label: "Mileage Log", icon: Gauge },
      { href: "/service", label: "Service Status", icon: Wrench },
      { href: "/repairs", label: "Repairs Log", icon: Hammer },
      { href: "/notes", label: "Vehicle Notes", icon: StickyNote },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/transactions", label: "Transactions", icon: Receipt },
      { href: "/monthly", label: "Monthly Breakdown", icon: Calendar },
      { href: "/weekly", label: "Weekly Breakdown", icon: CalendarDays },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/reports", label: "Reports", icon: FileBarChart },
      { href: "/replacement", label: "Replacement Review", icon: RefreshCcw },
      { href: "/data-quality", label: "Data Quality", icon: ShieldAlert },
      { href: "/staff", label: "Users & Access", icon: Users, adminOnly: true },
    ],
  },
];
