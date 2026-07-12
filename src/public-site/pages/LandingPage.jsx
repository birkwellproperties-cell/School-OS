import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  LockKeyhole,
  Network,
  School,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";

const capabilities = [
  {
    title: "Admissions & Enrollment",
    description:
      "Manage inquiries, applications, documents, assessments, interviews, decisions, offers, and enrollment.",
    icon: GraduationCap,
  },
  {
    title: "Student Information",
    description:
      "Maintain authoritative student, guardian, enrollment, health, attendance, and lifecycle records.",
    icon: Users,
  },
  {
    title: "Academics",
    description:
      "Coordinate academic years, terms, classes, subjects, assignments, examinations, grading, and reporting.",
    icon: BookOpen,
  },
  {
    title: "Human Resources",
    description:
      "Manage employees, departments, recruitment, contracts, attendance, leave, performance, and development.",
    icon: Building2,
  },
  {
    title: "Finance & Billing",
    description:
      "Control fee structures, invoices, payments, expenses, budgets, procurement, and financial intelligence.",
    icon: WalletCards,
  },
  {
    title: "Executive Intelligence",
    description:
      "Monitor cross-school performance, risks, trends, approvals, workflows, and enterprise outcomes.",
    icon: BarChart3,
  },
];

const trustItems = [
  "Multi-organization",
  "Multi-school",
  "Multi-campus",
  "Role-based access",
  "Tenant-isolated data",
  "Workflow governed",
];

function DashboardPreview() {
  return (
    <div className="relative mx-auto mt-14 max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-indigo-950/50 backdrop-blur sm:p-5">
        <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-slate-50 shadow-xl">
          <div className="flex min-h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <School size={17} />
              </span>

              <div>
                <p className="text-xs font-black text-slate-950">
                  SchoolOS Command Center
                </p>

                <p className="text-[10px] font-semibold text-slate-400">
                  Enterprise workspace preview
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="h-8 w-24 rounded-lg bg-slate-100" />
              <span className="h-8 w-8 rounded-full bg-indigo-100" />
            </div>
          </div>

          <div className="grid min-h-[430px] grid-cols-1 md:grid-cols-[190px_1fr]">
            <div className="hidden border-r border-slate-200 bg-white p-4 md:block">
              <div className="space-y-2">
                {[
                  "Command Center",
                  "Admissions",
                  "Students",
                  "Academics",
                  "Human Resources",
                  "Finance",
                  "Reports",
                ].map((item, index) => (
                  <div
                    key={item}
                    className={[
                      "rounded-xl px-3 py-2.5 text-xs font-bold",
                      index === 0
                        ? "bg-indigo-600 text-white"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-indigo-600">
                    Enterprise Overview
                  </p>

                  <h3 className="mt-2 text-xl font-black text-slate-950">
                    Executive Command Center
                  </h3>
                </div>

                <span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                  Platform operational
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Students", "2,486"],
                  ["Admissions", "184"],
                  ["Staff", "219"],
                  ["Collections", "94%"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <p className="text-xs font-bold text-slate-400">
                      {label}
                    </p>

                    <p className="mt-2 text-2xl font-black text-slate-950">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-slate-950">
                      Institutional Performance
                    </p>

                    <BarChart3
                      size={18}
                      className="text-indigo-600"
                    />
                  </div>

                  <div className="mt-8 flex h-40 items-end gap-3">
                    {[44, 70, 58, 88, 76, 96, 82].map(
                      (height, index) => (
                        <div
                          key={`${height}-${index}`}
                          className="flex-1 rounded-t-lg bg-gradient-to-t from-indigo-600 to-cyan-400"
                          style={{
                            height: `${height}%`,
                          }}
                        />
                      ),
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-black text-slate-950">
                    Priority Workflows
                  </p>

                  <div className="mt-5 space-y-4">
                    {[
                      "Admission decisions",
                      "Fee approvals",
                      "Staff onboarding",
                      "Attendance review",
                    ].map((item, index) => (
                      <div
                        key={item}
                        className="flex items-center gap-3"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-xs font-black text-indigo-700">
                          {index + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-700">
                            {item}
                          </p>

                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-indigo-500"
                              style={{
                                width: `${80 - index * 12}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 pb-24 pt-32 sm:pt-36 lg:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(79,70,229,0.65),transparent_35%),radial-gradient(circle_at_84%_18%,rgba(6,182,212,0.35),transparent_34%),linear-gradient(135deg,#090f2d_0%,#1e1b4b_48%,#312e81_100%)]" />

        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:44px_44px]" />

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-indigo-100 backdrop-blur">
            <Sparkles size={15} />
            The enterprise operating system for education
          </div>

          <h1 className="mx-auto mt-7 max-w-5xl text-4xl font-black leading-[1.08] text-white sm:text-5xl lg:text-7xl">
            One platform.
            <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-200 bg-clip-text text-transparent">
              Every institution.
            </span>
            Limitless potential.
          </h1>

          <p className="mx-auto mt-7 max-w-3xl text-base font-medium leading-8 text-slate-300 sm:text-lg lg:text-xl">
            SchoolOS connects admissions, student information,
            academics, human resources, finance, operations,
            communications, analytics, and enterprise workflows in
            one secure institutional platform.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/request-access"
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 text-base font-black text-indigo-700 shadow-xl shadow-indigo-950/30 transition hover:-translate-y-0.5 hover:bg-indigo-50 sm:w-auto"
            >
              Request Platform Access
              <ArrowRight size={19} />
            </Link>

            <Link
              to="/platform"
              className="flex min-h-14 w-full items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 text-base font-black text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
            >
              Explore the platform
            </Link>
          </div>

          <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {trustItems.map((item) => (
              <span
                key={item}
                className="flex items-center gap-2 text-xs font-bold text-indigo-100"
              >
                <CheckCircle2
                  size={15}
                  className="text-cyan-300"
                />
                {item}
              </span>
            ))}
          </div>
        </div>

        <DashboardPreview />
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-600">
              Unified platform
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Everything your institution needs to operate with
              confidence.
            </h2>

            <p className="mt-5 text-base font-medium leading-8 text-slate-500">
              Replace disconnected systems and manual processes with
              one governed source of institutional truth.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {capabilities.map((capability) => {
              const Icon = capability.icon;

              return (
                <article
                  key={capability.title}
                  className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/70"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">
                    <Icon size={23} />
                  </span>

                  <h3 className="mt-5 text-xl font-black text-slate-950">
                    {capability.title}
                  </h3>

                  <p className="mt-3 text-sm font-medium leading-7 text-slate-500">
                    {capability.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-600">
              Enterprise architecture
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              Designed for organizations, schools, campuses, and
              every team within them.
            </h2>

            <p className="mt-5 text-base font-medium leading-8 text-slate-500">
              SchoolOS applies consistent identity, permissions,
              workflows, auditability, and tenant isolation across
              every module and institution.
            </p>

            <div className="mt-8 space-y-4">
              {[
                [Network, "Multi-tenant by design"],
                [ShieldCheck, "Enterprise authorization and RLS"],
                [Workflow, "Governed cross-module workflows"],
                [LockKeyhole, "Controlled account provisioning"],
              ].map(([Icon, label]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Icon size={20} />
                  </span>

                  <p className="font-black text-slate-800">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-950 p-6 shadow-2xl shadow-indigo-200 sm:p-8">
            <div className="grid gap-4">
              {[
                ["Organization", "Enterprise tenant"],
                ["School", "Institutional workspace"],
                ["Campus", "Operational location"],
                ["Departments", "Functional teams"],
                ["Users", "Authorized personnel"],
                ["Students", "Institutional records"],
              ].map(([title, helper], index) => (
                <div
                  key={title}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-white backdrop-blur"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-indigo-700">
                    {index + 1}
                  </span>

                  <div>
                    <p className="font-black">
                      {title}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-indigo-200">
                      {helper}
                    </p>
                  </div>

                  {index < 5 && (
                    <ArrowRight
                      size={17}
                      className="ml-auto text-indigo-300"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-[2.25rem] bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-600 px-6 py-14 text-white shadow-2xl shadow-indigo-200 sm:px-10 sm:py-16">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-100">
              Begin with controlled access
            </p>

            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
              Bring your institution onto a secure enterprise
              platform built for long-term growth.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-8 text-indigo-100">
              Submit an access request for Tavaro review. Approved
              institutions receive a secure, time-limited onboarding
              invitation.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/request-access"
                className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-base font-black text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                Request Platform Access
                <ArrowRight size={19} />
              </Link>

              <Link
                to="/login"
                className="flex min-h-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 text-base font-black text-white transition hover:bg-white/15"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
