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
  Palette,
} from "lucide-react";

export const navigationItems = [
  {
    label: "Command Center",
    path: "/app",
    icon: BarChart3,
    permission: "command_center.view",
  },
  {
    label: "Admissions",
    path: "/app/admissions",
    icon: UserRoundSearch,
    permission: "applications.view",
  },
  {
    label: "Students",
    path: "/app/students",
    icon: GraduationCap,
    permission: "students.view",
  },
  {
    label: "Academics",
    path: "/app/academics",
    icon: BookOpen,
    permission: "academics.view",
  },
  {
    label: "Attendance",
    path: "/app/attendance",
    icon: ClipboardCheck,
    permission: "attendance.view",
  },
  {
    label: "Finance",
    path: "/app/finance",
    icon: ReceiptText,
    permission: "finance.view",
  },
  {
    label: "Procurement",
    path: "/app/procurement",
    icon: PackageSearch,
    permission: "procurement.view",
  },
  {
    label: "Inventory & Assets",
    path: "/app/inventory",
    icon: Boxes,
    permission: "inventory.view",
  },
  {
    label: "Human Resources",
    path: "/app/human-resources",
    icon: Users,
    permission: "staff.view",
  },
  {
    label: "Communications",
    path: "/app/communications",
    icon: Megaphone,
    permission: "communications.view",
  },
  {
    label: "Reports",
    path: "/app/reports",
    icon: ShieldCheck,
    permission: "reports.view",
  },
  {
    label: "Settings",
    path: "/app/settings",
    icon: Settings,
    permission: "settings.view",
  },
  {
    label: "Design Lab",
    path: "/app/design-lab",
    icon: Palette,
    permission: "design_lab.view",
  },
];

