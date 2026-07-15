import {
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FilePlus2,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  getAdmissionStatusLabel,
} from "../constants";

import {
  useAdmissions,
} from "../hooks";

import DocumentUploaderDialog
  from "./DocumentUploaderDialog";

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
    },
  ).format(date);
}

function formatFileSize(value) {
  const bytes = Number(value);

  if (
    !Number.isFinite(bytes) ||
    bytes < 0
  ) {
    return "Not available";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function DocumentStatusBadge({
  status,
}) {
  const tone =
    status === "verified"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "uploaded" ||
          status === "under_review"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : status === "rejected" ||
            status === "expired"
          ? "border-red-200 bg-red-50 text-red-700"
          : status === "waived"
            ? "border-slate-200 bg-slate-100 text-slate-700"
            : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-black",
        tone,
      ].join(" ")}
    >
      {getAdmissionStatusLabel(
        status,
      )}
    </span>
  );
}

function RequirementBadge({
  status,
}) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
      {getAdmissionStatusLabel(
        status,
      )}
    </span>
  );
}

function getDocumentIcon(
  status,
) {
  if (status === "verified") {
    return CheckCircle2;
  }

  if (
    status === "uploaded" ||
    status === "under_review"
  ) {
    return Clock3;
  }

  if (
    status === "rejected" ||
    status === "expired"
  ) {
    return AlertCircle;
  }

  return FileText;
}

export default function ApplicationDocuments() {
  const {
    applicationDocuments,

    selectedApplicationDocumentId,

    applicationDocumentsLoading,
    applicationDocumentsError,

    canUploadApplicationDocuments,
    documentMutationLoading,

    refreshApplicationDocuments,
    selectApplicationDocument,
  } = useAdmissions();

  const [
    uploaderOpen,
    setUploaderOpen,
  ] = useState(false);

  const documents =
    applicationDocuments.items || [];

  const requiredDocuments =
    documents.filter(
      (document) =>
        document.requirement_status ===
          "required" ||
        document.requirement_status ===
          "conditionally_required",
    );

  const verifiedRequiredDocuments =
    requiredDocuments.filter(
      (document) =>
        document.status ===
          "verified" ||
        document.status ===
          "waived",
    );

  const completionPercentage =
    requiredDocuments.length > 0
      ? Math.round(
          (
            verifiedRequiredDocuments.length /
            requiredDocuments.length
          ) * 100,
        )
      : 0;

  const handleOpenUploader = () => {
    if (
      !canUploadApplicationDocuments ||
      documentMutationLoading
    ) {
      return;
    }

    setUploaderOpen(true);
  };

  const handleCloseUploader = () => {
    if (documentMutationLoading) {
      return;
    }

    setUploaderOpen(false);
  };

  return (
    <>
      <section
        id="application-documents"
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <FileCheck2 size={18} />
            </div>

            <div>
              <h4 className="font-black text-slate-950">
                Application documents
              </h4>

              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                Required and optional records
                associated with this
                application.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleOpenUploader}
              disabled={
                !canUploadApplicationDocuments ||
                documentMutationLoading
              }
              className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {documentMutationLoading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <FilePlus2 size={16} />
              )}

              {documentMutationLoading
                ? "Uploading..."
                : "Upload document"}
            </button>

            <button
              type="button"
              onClick={() =>
                refreshApplicationDocuments()
              }
              disabled={
                applicationDocumentsLoading ||
                documentMutationLoading
              }
              className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  applicationDocumentsLoading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Total documents
            </p>

            <p className="mt-2 text-2xl font-black text-slate-950">
              {documents.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Required verified
            </p>

            <p className="mt-2 text-2xl font-black text-slate-950">
              {verifiedRequiredDocuments.length}
              {" / "}
              {requiredDocuments.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Document completion
            </p>

            <p className="mt-2 text-2xl font-black text-indigo-700">
              {completionPercentage}%
            </p>
          </div>
        </div>

        {applicationDocumentsError && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4"
          >
            <p className="font-black text-red-800">
              Documents could not be
              loaded.
            </p>

            <p className="mt-1 text-sm font-semibold text-red-700">
              {applicationDocumentsError}
            </p>
          </div>
        )}

        {applicationDocumentsLoading &&
        !documents.length ? (
          <div className="mt-5 flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            <div className="text-center">
              <Loader2
                size={22}
                className="mx-auto animate-spin text-indigo-600"
              />

              <p className="mt-3 text-sm font-black text-slate-700">
                Loading documents...
              </p>
            </div>
          </div>
        ) : !documents.length ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <FileText
              size={25}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 font-black text-slate-800">
              No application documents
            </p>

            <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-slate-500">
              Upload the first document
              or add document
              requirements for this
              application.
            </p>

            {canUploadApplicationDocuments && (
              <button
                type="button"
                onClick={handleOpenUploader}
                disabled={
                  documentMutationLoading
                }
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FilePlus2 size={16} />

                Upload first document
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {documents.map(
              (document) => {
                const Icon =
                  getDocumentIcon(
                    document.status,
                  );

                const selected =
                  document.id ===
                  selectedApplicationDocumentId;

                return (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() =>
                      selectApplicationDocument(
                        document,
                      )
                    }
                    className={[
                      "w-full rounded-2xl border p-4 text-left transition",
                      selected
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            document.status ===
                              "verified"
                              ? "bg-emerald-100 text-emerald-700"
                              : document.status ===
                                    "rejected" ||
                                  document.status ===
                                    "expired"
                                ? "bg-red-100 text-red-700"
                                : document.status ===
                                      "uploaded" ||
                                    document.status ===
                                      "under_review"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-600",
                          ].join(" ")}
                        >
                          <Icon size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-950">
                            {document.document_label ||
                              document.document_type}
                          </p>

                          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                            {document.file_name ||
                              "No file uploaded"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <DocumentStatusBadge
                          status={
                            document.status
                          }
                        />

                        <RequirementBadge
                          status={
                            document
                              .requirement_status
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-xs font-semibold text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                      <p>
                        Type:{" "}
                        <span className="font-black text-slate-700">
                          {getAdmissionStatusLabel(
                            document.document_type,
                          )}
                        </span>
                      </p>

                      <p>
                        Uploaded:{" "}
                        <span className="font-black text-slate-700">
                          {formatDate(
                            document.uploaded_at,
                          )}
                        </span>
                      </p>

                      <p>
                        Verified:{" "}
                        <span className="font-black text-slate-700">
                          {formatDate(
                            document.verified_at,
                          )}
                        </span>
                      </p>

                      <p>
                        Size:{" "}
                        <span className="font-black text-slate-700">
                          {formatFileSize(
                            document.file_size_bytes,
                          )}
                        </span>
                      </p>
                    </div>

                    {document.notes && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-white/70 p-3">
                        <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                          Notes
                        </p>

                        <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-600">
                          {document.notes}
                        </p>
                      </div>
                    )}

                    {document.rejection_reason && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-xs font-black uppercase tracking-[0.1em] text-red-700">
                          Rejection reason
                        </p>

                        <p className="mt-1 text-sm font-semibold text-red-700">
                          {
                            document.rejection_reason
                          }
                        </p>
                      </div>
                    )}

                    {document.status ===
                      "verified" && (
                      <div className="mt-4 flex items-center gap-2 text-xs font-black text-emerald-700">
                        <ShieldCheck
                          size={15}
                        />

                        Verified document
                      </div>
                    )}
                  </button>
                );
              },
            )}
          </div>
        )}
      </section>

      <DocumentUploaderDialog
        open={uploaderOpen}
        onClose={
          handleCloseUploader
        }
      />
    </>
  );
}