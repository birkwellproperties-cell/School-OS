import { createBrowserRouter } from "react-router-dom";

import AppShell from "../AppShell";

import {
  AuthenticatedRoute,
  ProtectedRoute,
  PublicOnlyRoute,
} from "../../platform/auth";

import {
  ModuleRouteGuard,
} from "../../platform/authorization";

import AccessDeniedPage from "../../modules/authentication/AccessDeniedPage";
import AccountPendingPage from "../../modules/authentication/AccountPendingPage";
import ForgotPasswordPage from "../../modules/authentication/ForgotPasswordPage";
import LoginPage from "../../modules/authentication/LoginPage";
import ResetPasswordPage from "../../modules/authentication/ResetPasswordPage";

import CommandCenter from "../../modules/command-center/CommandCenter";
import DesignLab from "../../modules/design-lab/DesignLab";

import PublicSiteLayout from "../../public-site/layouts/PublicSiteLayout";
import LandingPage from "../../public-site/pages/LandingPage";
import NotFoundPage from "../../public-site/pages/NotFoundPage";
import PublicPagePlaceholder from "../../public-site/pages/PublicPagePlaceholder";

import ModulePlaceholder from "../../shared/components/ModulePlaceholder";

const applicationPages = {
  admissions: {
    title: "Admissions Center",
    permission: "applications.view",
    description:
      "Manage inquiries, applications, document verification, assessments, interviews, admission decisions, offers, and enrollment.",
  },
  students: {
    title: "Student Center",
    permission: "students.view",
    description:
      "Manage permanent student records, guardians, enrollments, documents, medical alerts, status history, and lifecycle activity.",
  },
  academics: {
    title: "Academic Center",
    permission: "academics.view",
    description:
      "Configure academic years, terms, classes, sections, subjects, assignments, examinations, grading, and report cards.",
  },
  attendance: {
    title: "Attendance Center",
    permission: "attendance.view",
    description:
      "Record student attendance, monitor absences and late arrivals, notify guardians, and analyze attendance risk.",
  },
  finance: {
    title: "Finance Center",
    permission: "finance.view",
    description:
      "Manage fee structures, invoices, payments, receipts, scholarships, expenses, budgets, and financial reporting.",
  },
  procurement: {
    title: "Procurement Center",
    permission: "procurement.view",
    description:
      "Manage purchase requests, approvals, quotations, purchase orders, receiving, invoice matching, and payment approval.",
  },
  inventory: {
    title: "Inventory & Assets",
    permission: "inventory.view",
    description:
      "Track consumables, textbooks, uniforms, equipment, fixed assets, stock movements, maintenance, and work orders.",
  },
  "human-resources": {
    title: "Human Resources",
    permission: "staff.view",
    description:
      "Manage employees, departments, positions, recruitment, onboarding, contracts, leave, attendance, performance, and training.",
  },
  communications: {
    title: "Communications Center",
    permission: "communications.view",
    description:
      "Coordinate announcements, messages, email, SMS, WhatsApp, push notifications, and parent communications.",
  },
  reports: {
    title: "Reports Center",
    permission: "reports.view",
    description:
      "Produce academic, financial, attendance, procurement, inventory, HR, and executive reports.",
  },
  settings: {
    title: "Settings",
    permission: "settings.view",
    description:
      "Configure organizations, schools, campuses, users, permissions, notifications, integrations, security, and subscriptions.",
  },
};

const publicPages = [
  {
    path: "platform",
    eyebrow: "Platform",
    title: "One governed platform for every institutional operation.",
    description:
      "Explore the architecture, services, workflows, modules, and enterprise controls powering SchoolOS.",
  },
  {
    path: "solutions",
    eyebrow: "Solutions",
    title: "Built for schools, groups, campuses, and education networks.",
    description:
      "See how SchoolOS supports independent schools, multi-campus organizations, education groups, and institutional operators.",
  },
  {
    path: "pricing",
    eyebrow: "Pricing",
    title: "Plans designed around institutional scale and capability.",
    description:
      "Compare SchoolOS editions for growing schools, professional institutions, enterprise groups, and government deployments.",
  },
  {
    path: "security",
    eyebrow: "Security",
    title:
      "Enterprise identity, tenant isolation, permissions, and auditability.",
    description:
      "Review the security model protecting organizations, schools, campuses, users, and institutional information.",
  },
  {
    path: "resources",
    eyebrow: "Resources",
    title: "Documentation and resources for SchoolOS institutions.",
    description:
      "Access product documentation, implementation guides, security resources, platform updates, and support materials.",
  },
  {
    path: "contact",
    eyebrow: "Contact",
    title: "Speak with the SchoolOS enterprise team.",
    description:
      "Connect with Tavaro Group about platform access, implementation, partnerships, support, and enterprise deployment.",
  },
  {
    path: "request-access",
    eyebrow: "Controlled onboarding",
    title: "Request SchoolOS platform access.",
    description:
      "Submit your organization for Tavaro review. Approved institutions receive a secure onboarding invitation.",
  },
  {
    path: "about",
    eyebrow: "About",
    title: "Enterprise technology for modern institutions.",
    description:
      "Learn about Tavaro Group LLC and the vision, governance, and engineering standards behind SchoolOS.",
  },
  {
    path: "privacy",
    eyebrow: "Legal",
    title: "SchoolOS privacy policy.",
    description:
      "Review how SchoolOS and Tavaro Group protect organizational, user, and institutional information.",
  },
  {
    path: "terms",
    eyebrow: "Legal",
    title: "SchoolOS terms and conditions.",
    description:
      "Review the terms governing access to and use of the SchoolOS Enterprise platform.",
  },
  {
    path: "status",
    eyebrow: "Platform status",
    title: "SchoolOS service status.",
    description:
      "View platform availability, maintenance notices, service health, and operational updates.",
  },
];

function ApplicationPlaceholder({ page }) {
  const config = applicationPages[page];

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
    element: <PublicSiteLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      ...publicPages.map((page) => ({
        path: page.path,
        element: (
          <PublicPagePlaceholder
            eyebrow={page.eyebrow}
            title={page.title}
            description={page.description}
          />
        ),
      })),
    ],
  },

  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
      },
    ],
  },

  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },

  {
    element: <AuthenticatedRoute />,
    children: [
      {
        path: "/account-pending",
        element: <AccountPendingPage />,
      },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/app",
        element: <AppShell />,
        children: [
          {
            index: true,
            element: (
              <ModuleRouteGuard permission="command_center.view">
                <CommandCenter />
              </ModuleRouteGuard>
            ),
          },
          {
            path: "access-denied",
            element: <AccessDeniedPage />,
          },
          {
            path: "design-lab",
            element: (
              <ModuleRouteGuard permission="design_lab.view">
                <DesignLab />
              </ModuleRouteGuard>
            ),
          },
          ...Object.entries(applicationPages).map(
            ([page, config]) => ({
              path: page,
              element: (
                <ModuleRouteGuard
                  permission={config.permission}
                >
                  <ApplicationPlaceholder page={page} />
                </ModuleRouteGuard>
              ),
            }),
          ),
        ],
      },
    ],
  },

  {
    path: "*",
    element: <NotFoundPage />,
  },
]);