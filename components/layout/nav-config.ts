import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Car,
  Receipt,
  Wrench,
  Gauge,
  ClipboardCheck,
  StickyNote,
  CalendarRange,
  CalendarDays,
  BarChart3,
  Bell,
  FileBarChart,
  ListChecks,
  RefreshCw,
  Users,
} from "lucide-react";

export type NavGroup = {
  label: string;
  items: { href: string; label: string; icon: LucideIcon; adminOnly?: boolean }[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "OVERVIEW",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/alerts", label: "Alert Center", icon: Bell },
    ],
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
      { href: "/weekly", label: "Weekly Breakdown", icon: CalendarDays },
    ],
  },
  {
    label: "REPORTING",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/reports", label: "Reports", icon: FileBarChart },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { href: "/replacement", label: "Replacement Review", icon: RefreshCw },
      { href: "/data-quality", label: "Data Quality", icon: ListChecks },
      { href: "/staff", label: "Users & Access", icon: Users, adminOnly: true },
      { href: "/admin-recovery", label: "Admin Recovery", icon: Users, adminOnly: true },
      { href: "/monitoring", label: "Monitoring", icon: ListChecks, adminOnly: true },
      { href: "/approvals", label: "Change Approvals", icon: ClipboardCheck },
      { href: "/documents", label: "Document Register", icon: ClipboardCheck },
      { href: "/work-orders", label: "Service & Repairs", icon: Wrench },
    ],
  },
];

export const RTO_NAV_GROUPS: NavGroup[] = [
  { label: 'RENT-TO-OWN', items: [
    { href: '/rent-to-own', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/rent-to-own/vehicles', label: 'Vehicles', icon: Car },
    { href: '/rent-to-own/agreements', label: 'Agreements & Drivers', icon: Users },
    { href: '/rent-to-own/payments', label: 'Payments & Charges', icon: Receipt },
    { href: '/rent-to-own/mileage', label: 'Mileage', icon: Gauge },
    { href: '/rent-to-own/repairs', label: 'Repairs & Approvals', icon: Wrench },
    { href: '/rent-to-own/service', label: 'Scheduled Servicing', icon: ClipboardCheck },
    { href: '/rent-to-own/downtime', label: 'Downtime & Replacements', icon: RefreshCw },
    { href: '/rent-to-own/documents', label: 'Documents', icon: FileBarChart },
    { href: '/rent-to-own/settlements', label: 'Settlement Reviews', icon: Receipt },
    { href: '/rent-to-own/alerts', label: 'Alerts', icon: Bell },
    { href: '/rent-to-own/reports', label: 'Reports', icon: BarChart3 },
    { href: '/rent-to-own/manage', label: 'Setup & Transfers', icon: ListChecks, adminOnly: true },
  ] },
];
export function navigationGroups(pathname: string): NavGroup[] {
  const groups = pathname.startsWith('/rent-to-own') ? RTO_NAV_GROUPS : NAV_GROUPS;
  return [...groups, { label: 'SHARED ADMINISTRATION', items: [
    { href: '/bank-finance', label: 'Private Bank Finance', icon: Receipt, adminOnly: true },
  ] }];
}
export function isNavigationActive(pathname: string, href: string) {
  return href === '/' || href === '/rent-to-own' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}
