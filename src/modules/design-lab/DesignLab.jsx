import {
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  GraduationCap,
  PackageSearch,
  Plus,
  Search,
  Users,
} from "lucide-react";

import {
  Button,
  Card,
  KpiCard,
  ResponsiveKpiGrid,
  Section,
} from "../../design-system";

const colors = [
  ["Primary", "#2563eb"],
  ["Accent", "#059669"],
  ["Information", "#0ea5e9"],
  ["Success", "#22c55e"],
  ["Warning", "#f59e0b"],
  ["Danger", "#ef4444"],
  ["Canvas", "#f7f9fc"],
  ["Surface", "#ffffff"],
];

export default function DesignLab() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-blue-200 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 p-6 text-white shadow-lg sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100">
          Product System
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          SchoolOS Design Lab
        </h1>

        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-blue-50 sm:text-base">
          A permanent visual workspace for validating SchoolOS components,
          colors, responsiveness, accessibility, and mobile behavior.
        </p>
      </section>

      <Section
        title="Color system"
        description="The brighter education-focused visual palette."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {colors.map(([name, value]) => (
            <div key={name}>
              <div
                className="h-20 rounded-2xl border border-black/5 shadow-sm"
                style={{ backgroundColor: value }}
              />
              <p className="mt-2 text-sm font-bold text-slate-800">{name}</p>
              <p className="text-xs font-semibold uppercase text-slate-500">
                {value}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Buttons"
        description="Core action hierarchy and touch-target validation."
      >
        <div className="flex flex-wrap gap-3">
          <Button>
            <Plus size={18} />
            Primary
          </Button>

          <Button variant="secondary">Secondary</Button>
          <Button variant="accent">Confirm</Button>
          <Button variant="subtle">Subtle</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section
        title="Key performance indicators"
        description="Responsive operational metrics."
      >
        <ResponsiveKpiGrid columns={4}>
          <KpiCard
            label="Students"
            value="1,248"
            helper="42 joined this term"
            tone="blue"
            icon={GraduationCap}
          />

          <KpiCard
            label="Attendance"
            value="94.6%"
            helper="Up 1.8% this week"
            tone="emerald"
            icon={Check}
          />

          <KpiCard
            label="Open Requests"
            value="17"
            helper="5 require approval"
            tone="amber"
            icon={PackageSearch}
          />

          <KpiCard
            label="Critical Alerts"
            value="3"
            helper="Immediate attention required"
            tone="red"
            icon={CircleAlert}
          />
        </ResponsiveKpiGrid>
      </Section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section
          title="Form controls"
          description="Mobile-safe field sizes and spacing."
        >
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">
                Student name
              </span>

              <input
                type="text"
                placeholder="Enter student name"
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">
                Grade level
              </span>

              <select className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                <option>Select grade</option>
                <option>Grade 1</option>
                <option>Grade 2</option>
              </select>
            </label>
          </div>
        </Section>

        <Section
          title="Operational list"
          description="List hierarchy for desktop and mobile."
        >
          <div className="space-y-3">
            {[
              ["Admissions", "12 applications awaiting review", BookOpen],
              ["Staff", "4 leave requests require action", Users],
              ["Notifications", "8 unread operational alerts", Bell],
            ].map(([title, description, Icon]) => (
              <button
                key={title}
                type="button"
                className="flex min-h-16 w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
              >
                <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                  <Icon size={20} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-black text-slate-900">
                    {title}
                  </span>
                  <span className="block truncate text-sm font-medium text-slate-500">
                    {description}
                  </span>
                </span>

                <ChevronRight size={19} className="text-slate-400" />
              </button>
            ))}
          </div>
        </Section>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-black text-slate-950">
              Search and command pattern
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              This pattern will later power global search and command actions.
            </p>
          </div>

          <button
            type="button"
            className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm font-bold text-slate-600"
          >
            <Search size={18} />
            Search SchoolOS
            <span className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs">
              Ctrl K
            </span>
          </button>
        </div>
      </Card>
    </div>
  );
}