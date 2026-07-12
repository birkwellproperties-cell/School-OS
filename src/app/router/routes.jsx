import { createBrowserRouter } from "react-router-dom";

import AppShell from "../AppShell";
import CommandCenter from "../../modules/command-center/CommandCenter";
import ModulePlaceholder from "../../shared/components/ModulePlaceholder";
import DesignLab from "../../modules/design-lab/DesignLab";

const placeholderPages = {
  admissions: {
    title: "Admissions Center",
    description:
      "Manage inquiries, student applications, document verification, interviews, admission decisions, offers, and enrollment conversion.",
  },
  students: {
    title: "Student Center",
    description:
      "Manage permanent student records, guardians, enrollments, documents, medical alerts, status history, and lifecycle activity.",
  },
  academics: {
    title: "Academic Center",
    description:
      "Configure academic years, terms, classes, sections, subjects, teacher assignments, examinations, grades, and report cards.",
  },
  attendance: {
    title: "Attendance Center",
    description:
      "Record daily attendance, monitor absences and late arrivals, notify guardians, and analyze attendance risk.",
  },
  finance: {
    title: "Finance Center",
    description:
      "Manage fee structures, invoices, payments, receipts, scholarships, discounts, expenses, budgets, and financial reporting.",
  },
  procurement: {
    title: "Procurement Center",
    description:
      "Manage purchase requests, approvals, supplier quotations, purchase orders, goods receiving, invoice matching, and payment approval.",
  },
  inventory: {
    title: "Inventory & Assets",
    description:
      "Track consumables, textbooks, uniforms, equipment, fixed assets, stock movements, maintenance, and work orders.",
  },
  staff: {
    title: "Staff & HR Center",
    description:
      "Manage staff profiles, contracts, departments, assignments, attendance, leave, payroll records, and performance.",
  },
  communications: {
    title: "Communications Center",
    description:
      "Coordinate announcements, messages, email, SMS, WhatsApp, push notifications, and parent communications.",
  },
  reports: {
    title: "Reports Center",
    description:
      "Produce academic, financial, attendance, procurement, inventory, staff, and executive reports.",
  },
  settings: {
    title: "Settings",
    description:
      "Configure the school, academic calendar, users, permissions, notifications, integrations, security, backups, and subscriptions.",
  },
};

function PlaceholderPage({ page }) {
  const config = placeholderPages[page];

  return (
    <ModulePlaceholder
      title={config.title}
      description={config.description}
    />
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <CommandCenter />,
      },
      {
        path: "design-lab",
        element: <DesignLab />,
      },
      ...Object.keys(placeholderPages).map((page) => ({
        path: page,
        element: <PlaceholderPage page={page} />,
      })),
    ],
  },
]);