import {
  ClipboardCheck,
  GraduationCap,
  PackageSearch,
  ReceiptText,
  UserRoundSearch,
  Warehouse,
} from "lucide-react";

import {
  KpiCard,
  ResponsiveKpiGrid,
  Section,
} from "../../design-system";

const metrics = [
  {
    label: "Active Students",
    value: "0",
    helper: "No students enrolled yet",
    tone: "violet",
    icon: GraduationCap,
  },
  {
    label: "Applications",
    value: "0",
    helper: "No pending applications",
    tone: "blue",
    icon: UserRoundSearch,
  },
  {
    label: "Attendance Today",
    value: "—",
    helper: "Attendance has not been recorded",
    tone: "emerald",
    icon: ClipboardCheck,
  },
  {
    label: "Outstanding Fees",
    value: "$0",
    helper: "No student balances",
    tone: "amber",
    icon: ReceiptText,
  },
  {
    label: "Purchase Requests",
    value: "0",
    helper: "No approvals required",
    tone: "slate",
    icon: PackageSearch,
  },
  {
    label: "Low Stock",
    value: "0",
    helper: "Inventory is not configured",
    tone: "red",
    icon: Warehouse,
  },
];

export default function CommandCenter() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-blue-200 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 p-6 text-white shadow-lg sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100">
          Executive Operations
        </p>

        <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
          School Command Center
        </h1>

        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-blue-50 sm:text-base">
          Monitor enrollment, attendance, finance, procurement, staffing, and
          institutional risk from one operational workspace.
        </p>
      </section>

      <ResponsiveKpiGrid columns={3}>
        {metrics.map((metric) => (
          <KpiCard key={metric.label} {...metric} />
        ))}
      </ResponsiveKpiGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Section
          title="Operational Priorities"
          description="Immediate actions required to finish the SchoolOS foundation."
        >
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="font-bold text-slate-700">
              Complete school onboarding
            </p>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Configure the school, academic year, terms, roles, and initial
              administrators.
            </p>
          </div>
        </Section>

        <Section
          title="Recent Activity"
          description="The latest operational events across the school."
        >
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-medium text-slate-500">
            Operational activity will appear here as the school begins using
            SchoolOS.
          </div>
        </Section>
      </div>
    </div>
  );
}