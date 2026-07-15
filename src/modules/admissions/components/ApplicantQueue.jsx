import {
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  Pencil,
  UserPlus,
} from "lucide-react";

import AdmissionsTable
  from "./AdmissionsTable";

import ApplicantFilters
  from "./ApplicantFilters";

import ApplicantStatusBadge
  from "./ApplicantStatusBadge";

import {
  useAdmissions,
} from "../hooks";

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
    },
  ).format(date);
}

function getApplicantName(applicant) {
  return [
    applicant?.first_name,
    applicant?.middle_name,
    applicant?.last_name,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function ApplicantQueue({
  onCreateApplicant,
  onEditApplicant,
  onCreateApplication,
}) {
  const {
    applicants,
    applicantsLoading,
    applicantsError,

    canCreateApplicants,
    canEditApplicants,

    selectApplicant,
    setApplicantFilters,
    refreshApplicants,
  } = useAdmissions();

  const currentPage =
    applicants.page || 1;

  const pageCount =
    applicants.pageCount || 0;

  const columns = [
    {
      key: "applicant_number",
      label: "Applicant",
      render: (row) => (
        <div>
          <p className="font-black text-slate-950">
            {row.applicant_number ||
              "Not assigned"}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Created {formatDate(
              row.created_at,
            )}
          </p>
        </div>
      ),
    },
    {
      key: "name",
      label: "Student",
      render: (row) => (
        <div>
          <p className="font-black text-slate-950">
            {getApplicantName(row) ||
              "Unnamed applicant"}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {row.preferred_name
              ? `Preferred name: ${row.preferred_name}`
              : row.current_grade_level ||
                "Grade not set"}
          </p>
        </div>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">
            {row.email ||
              row.phone ||
              "No contact details"}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {row.current_school_name ||
              "Current school not set"}
          </p>
        </div>
      ),
    },
    {
      key: "date_of_birth",
      label: "Date of birth",
      render: (row) =>
        formatDate(
          row.date_of_birth,
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <ApplicantStatusBadge
          status={row.status}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {canEditApplicants && (
            <button
              type="button"
              onClick={() => {
                selectApplicant(row);
                onEditApplicant?.(row);
              }}
              className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil size={14} />

              Edit
            </button>
          )}

          {[
            "prospect",
            "applicant",
          ].includes(row.status) && (
            <button
              type="button"
              onClick={() => {
                selectApplicant(row);
                onCreateApplication?.(
                  row,
                );
              }}
              className="flex min-h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3 text-xs font-black text-white transition hover:bg-indigo-500"
            >
              <FilePlus2 size={14} />

              Start application
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600">
            Admissions operations
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-950">
            Applicant queue
          </h2>

          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Review prospective students,
            maintain applicant records, and
            begin formal applications.
          </p>
        </div>

        {canCreateApplicants && (
          <button
            type="button"
            onClick={onCreateApplicant}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-500"
          >
            <UserPlus size={17} />

            New applicant
          </button>
        )}
      </header>

      <div className="border-b border-slate-100 p-5">
        <ApplicantFilters />
      </div>

      {applicantsError && (
        <div
          role="alert"
          className="m-5 rounded-2xl border border-red-200 bg-red-50 p-4"
        >
          <p className="font-black text-red-800">
            Applicant queue could not be
            loaded.
          </p>

          <p className="mt-1 text-sm font-semibold text-red-700">
            {applicantsError}
          </p>

          <button
            type="button"
            onClick={() =>
              refreshApplicants()
            }
            className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white"
          >
            Try again
          </button>
        </div>
      )}

      <div className="p-5">
        {applicantsLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
            <p className="font-black text-slate-800">
              Loading applicants...
            </p>
          </div>
        ) : (
          <AdmissionsTable
            columns={columns}
            rows={
              applicants.items || []
            }
            emptyTitle="No matching applicants"
            emptyDescription="Create an applicant or convert a qualified inquiry."
          />
        )}
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-500">
          {applicants.total || 0}
          {" "}
          total applicants
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={
              applicantsLoading ||
              currentPage <= 1
            }
            onClick={() =>
              setApplicantFilters(
                {
                  page:
                    currentPage - 1,
                },
                {
                  resetPage: false,
                },
              )
            }
            className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={16} />

            Previous
          </button>

          <span className="px-2 text-sm font-black text-slate-700">
            Page {currentPage}
            {" of "}
            {Math.max(
              pageCount,
              1,
            )}
          </span>

          <button
            type="button"
            disabled={
              applicantsLoading ||
              pageCount === 0 ||
              currentPage >=
                pageCount
            }
            onClick={() =>
              setApplicantFilters(
                {
                  page:
                    currentPage + 1,
                },
                {
                  resetPage: false,
                },
              )
            }
            className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next

            <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    </section>
  );
}