import {
  BarChart3,
  BookOpen,
  Boxes,
  ClipboardCheck,
  GraduationCap,
  Megaphone,
  PackageSearch,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserRoundSearch,
  Users,
} from "lucide-react";

export const navigationItems = [
  {
    label: "Command Center",
    path: "/",
    icon: BarChart3,
    permission: "command_center.view",
  },
  {
    label: "Admissions",
    path: "/admissions",
    icon: UserRoundSearch,
    permission: "applications.view",
  },
  {
    label: "Students",
    path: "/students",
    icon: GraduationCap,
    permission: "students.view",
  },
  {
    label: "Academics",
    path: "/academics",
    icon: BookOpen,
    permission: "academics.view",
  },
  {
    label: "Attendance",
    path: "/attendance",
    icon: ClipboardCheck,
    permission: "attendance.view",
  },
  {
    label: "Finance",
    path: "/finance",
    icon: ReceiptText,
    permission: "finance.view",
  },
  {
    label: "Procurement",
    path: "/procurement",
    icon: PackageSearch,
    permission: "procurement.view",
  },
  {
    label: "Inventory & Assets",
    path: "/inventory",
    icon: Boxes,
    permission: "inventory.view",
  },
  {
    label: "Staff & HR",
    path: "/staff",
    icon: Users,
    permission: "staff.view",
  },
  {
    label: "Communications",
    path: "/communications",
    icon: Megaphone,
    permission: "communications.view",
  },
  {
    label: "Reports",
    path: "/reports",
    icon: ShieldCheck,
    permission: "reports.view",
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
    permission: "settings.view",
  },
];