import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import type { AppRole } from "@/lib/pms/types";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof Users;
};

export const HR_NAV: NavItem[] = [
  { href: "/dashboard/hr/employees", label: "Employee management", icon: Users },
  { href: "/dashboard/hr/scorecards", label: "Productivity scorecard", icon: BarChart3 },
  { href: "/dashboard/hr/tasks", label: "All tasks", icon: ClipboardList },
  { href: "/dashboard/hr/add", label: "Add employees", icon: UserPlus },
];

export const HR_SETTINGS: NavItem = {
  href: "/dashboard/hr/settings",
  label: "Settings",
  icon: Settings,
};

export const ROLE_NAV: Record<AppRole, NavItem[]> = {
  boss: [{ href: "/dashboard/boss", label: "Boss dashboard", icon: LayoutDashboard }],
  hr: HR_NAV,
  employee: [{ href: "/dashboard/employee", label: "Employee dashboard", icon: LayoutDashboard }],
};

export const ROLE_SETTINGS: Partial<Record<AppRole, NavItem>> = {
  hr: HR_SETTINGS,
};

export const HR_SECTION_META: Record<string, { title: string; description: string }> = {
  "/dashboard/hr/employees": {
    title: "Employee management",
    description: "View, update, and remove employee profiles and credentials.",
  },
  "/dashboard/hr/scorecards": {
    title: "Productivity scorecard",
    description: "Track completion rates and workload health across the team.",
  },
  "/dashboard/hr/tasks": {
    title: "All tasks",
    description: "Read-only view of every task in the organization.",
  },
  "/dashboard/hr/add": {
    title: "Add employees",
    description: "Create a new employee account with login credentials.",
  },
  "/dashboard/hr/settings": {
    title: "Settings",
    description: "Account preferences and demo data controls.",
  },
};
