import {
  useState,
} from "react";

import {
  useAssessment,
} from "./context";

import {
  AssessmentBankManager,
} from "./components/assessment-banks";

import {
  QuestionBank,
} from "./components/question-bank";

import {
  TaxonomyManager,
} from "./components/taxonomy";

import {
  TemplateBuilder,
} from "./components/templates";

const WORKSPACE_TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
  },
  {
    id: "banks",
    label: "Banks",
  },
  {
    id: "taxonomy",
    label:
      "Classification Hierarchy",
  },
  {
    id: "questions",
    label: "Question Bank",
  },
  {
    id: "templates",
    label: "Templates",
  },
];

function SummaryCard({
  label,
  value,
  description,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>
    </article>
  );
}

function Dashboard() {
  const {
    assessmentBanks,
    categories,
    subjects,
    topics,
    questions,
    templates,

    assessmentsLoading,
    assessmentsError,

    refreshAssessmentCenter,
  } = useAssessment();

  const classificationRecordCount =
    categories.length +
    subjects.length +
    topics.length;

  return (
    <div className="space-y-6">
      {assessmentsError && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-800">
            {assessmentsError}
          </p>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Assessment banks"
          value={
            assessmentBanks.length
          }
          description="Governed libraries containing reusable assessment questions."
        />

        <SummaryCard
          label="Questions"
          value={questions.length}
          description="Questions currently available on the active result page."
        />

        <SummaryCard
          label="Templates"
          value={templates.length}
          description="Assessment structures available for authoring and publishing."
        />

        <SummaryCard
          label="Classification records"
          value={
            classificationRecordCount
          }
          description="Categories, subjects, and topics used to organize assessment content."
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-blue-700">
          Assessment workspace
        </p>

        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Authoring foundation
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Create an Assessment Bank,
          configure the Classification
          Hierarchy, and then use the
          Question Bank to author reusable
          assessment questions.
        </p>

        <button
          type="button"
          onClick={() =>
            refreshAssessmentCenter()
          }
          disabled={
            assessmentsLoading
          }
          className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {assessmentsLoading
            ? "Refreshing…"
            : "Refresh workspace"}
        </button>
      </section>
    </div>
  );
}

export default function AssessmentCenter() {
  const [
    activeTab,
    setActiveTab,
  ] = useState("dashboard");

  return (
    <div className="min-w-0 space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-7 text-white shadow-sm sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
          Assessment Center
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Build, publish, and manage
          assessments
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-50 sm:text-base">
          Manage assessment banks,
          question authoring,
          classification hierarchies,
          templates, and lifecycle
          controls.
        </p>
      </section>

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {WORKSPACE_TABS.map(
          (tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(tab.id)
              }
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ),
        )}
      </nav>

      {activeTab ===
        "dashboard" && (
        <Dashboard />
      )}

      {activeTab ===
        "banks" && (
        <AssessmentBankManager />
      )}

      {activeTab ===
        "taxonomy" && (
        <TaxonomyManager />
      )}

      {activeTab ===
        "questions" && (
        <QuestionBank />
      )}

      {activeTab ===
        "templates" && (
        <TemplateBuilder />
      )}
    </div>
  );
}