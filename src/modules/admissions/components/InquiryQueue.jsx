import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  UserRoundCheck,
} from "lucide-react";

import {
  AdmissionsTable,
} from "./index";

import InquiryFilters
  from "./InquiryFilters";

import InquiryStatusBadge
  from "./InquiryStatusBadge";

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
      timeStyle: "short",
    },
  ).format(date);
}

function formatLabel(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function getStudentName(inquiry) {
  return [
    inquiry
      ?.prospective_student_first_name,
    inquiry
      ?.prospective_student_middle_name,
    inquiry
      ?.prospective_student_last_name,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function InquiryQueue({
  onCreateInquiry,
  onEditInquiry,
  onConvertInquiry,
}) {
  const {
    inquiries,
    inquiryFilters,

    inquiriesLoading,
    inquiriesError,

    canCreateInquiries,
    canEditInquiries,

    selectInquiry,
    setInquiryFilters,
    refreshInquiries,
  } = useAdmissions();

  const currentPage =
    inquiries.page || 1;

  const pageCount =
    inquiries.pageCount || 0;

  const columns = [
    {
      key: "inquiry_number",
      label: "Inquiry",
      render: (row) => (
        <div>
          <p className="font-black text-slate-950">
            {row.inquiry_number}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {formatLabel(row.source)}
          </p>
        </div>
      ),
    },
    {
      key: "student",
      label: "Prospective student",
      render: (row) => (
        <div>
          <p className="font-black text-slate-950">
            {getStudentName(row) ||
              "Unnamed prospect"}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {row
              .prospective_grade_level ||
              "Grade not set"}
          </p>
        </div>
      ),
    },
    {
      key: "contact_name",
      label: "Primary contact",
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">
            {row.contact_name}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {row.contact_email ||
              row.contact_phone ||
              "No contact channel"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <InquiryStatusBadge
          status={row.status}
        />
      ),
    },
    {
      key: "next_follow_up_at",
      label: "Next follow-up",
      render: (row) =>
        formatDate(
          row.next_follow_up_at,
        ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (row) =>
        formatDate(row.created_at),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {canEditInquiries && (
            <button
              type="button"
              onClick={() => {
                selectInquiry(row);
                onEditInquiry?.(row);
              }}
              className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil size={14} />
              Edit
            </button>
          )}

          {row.status ===
            "qualified" && (
            <button
              type="button"
              onClick={() => {
                selectInquiry(row);
                onConvertInquiry?.(row);
              }}
              className="flex min-h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3 text-xs font-black text-white transition hover:bg-indigo-500"
            >
              <UserRoundCheck
                size={14}
              />
              Convert
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
            Inquiry queue
          </h2>

          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Search, review, update, and
            progress prospective-family
            inquiries.
          </p>
        </div>

        {canCreateInquiries && (
          <button
            type="button"
            onClick={onCreateInquiry}
            className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-500"
          >
            New inquiry
          </button>
        )}
      </header>

      <div className="border-b border-slate-100 p-5">
        <InquiryFilters />
      </div>

      {inquiriesError && (
        <div
          role="alert"
          className="m-5 rounded-2xl border border-red-200 bg-red-50 p-4"
        >
          <p className="font-black text-red-800">
            Inquiry queue could not be
            loaded.
          </p>

          <p className="mt-1 text-sm font-semibold text-red-700">
            {inquiriesError}
          </p>

          <button
            type="button"
            onClick={() =>
              refreshInquiries()
            }
            className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white"
          >
            Try again
          </button>
        </div>
      )}

      <div className="p-5">
        {inquiriesLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
            <p className="font-black text-slate-800">
              Loading inquiries...
            </p>
          </div>
        ) : (
          <AdmissionsTable
            columns={columns}
            rows={
              inquiries.items || []
            }
            emptyTitle="No matching inquiries"
            emptyDescription="Create an inquiry or adjust the current filters."
          />
        )}
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-500">
          {inquiries.total || 0}
          {" "}
          total inquiries
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={
              inquiriesLoading ||
              currentPage <= 1
            }
            onClick={() =>
              setInquiryFilters(
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
              inquiriesLoading ||
              pageCount === 0 ||
              currentPage >=
                pageCount
            }
            onClick={() =>
              setInquiryFilters(
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