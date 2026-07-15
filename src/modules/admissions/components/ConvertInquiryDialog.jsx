import {
  CheckCircle2,
  Loader2,
  UserRoundCheck,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAdmissions,
} from "../hooks";

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

export default function ConvertInquiryDialog({
  open,
  inquiry,
  onClose,
  onConverted,
}) {
  const {
    convertInquiryToApplicant,

    inquiryMutationLoading,
    inquiryMutationError,
    clearInquiryMutationError,
  } = useAdmissions();

  const [
    transitionNotes,
    setTransitionNotes,
  ] = useState("");

  const [
    localError,
    setLocalError,
  ] = useState("");

  const studentName =
    useMemo(
      () =>
        getStudentName(inquiry) ||
        "Unnamed prospective student",
      [inquiry],
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    setTransitionNotes("");
    setLocalError("");
    clearInquiryMutationError();
  }, [
    open,
    inquiry,
    clearInquiryMutationError,
  ]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        !inquiryMutationLoading
      ) {
        onClose?.();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    open,
    inquiryMutationLoading,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  const handleConvert =
    async () => {
      if (!inquiry?.id) {
        setLocalError(
          "The inquiry could not be identified.",
        );
        return;
      }

      if (
        inquiry.status !==
        "qualified"
      ) {
        setLocalError(
          "Only qualified inquiries can be converted to applicants.",
        );
        return;
      }

      try {
        const result =
          await convertInquiryToApplicant(
            inquiry.id,
            {
              transitionNotes:
                transitionNotes.trim() ||
                null,
            },
          );

        onConverted?.(result);
        onClose?.();
      } catch {
        // The normalized provider error is
        // displayed below.
      }
    };

  const visibleError =
    localError ||
    inquiryMutationError;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !inquiryMutationLoading
        ) {
          onClose?.();
        }
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="convert-inquiry-dialog-title"
          className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:p-7">
            <div>
              <div className="flex items-center gap-2 text-indigo-700">
                <UserRoundCheck
                  size={19}
                />

                <p className="text-xs font-black uppercase tracking-[0.16em]">
                  Admissions workflow
                </p>
              </div>

              <h2
                id="convert-inquiry-dialog-title"
                className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl"
              >
                Convert inquiry to applicant
              </h2>

              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                This conversion is completed
                atomically and records the
                lifecycle transition.
              </p>
            </div>

            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              disabled={
                inquiryMutationLoading
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={19} />
            </button>
          </header>

          <div className="p-5 sm:p-7">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600">
                Prospective student
              </p>

              <p className="mt-2 text-xl font-black text-slate-950">
                {studentName}
              </p>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-slate-600">
                <span>
                  Inquiry:{" "}
                  <strong className="text-slate-900">
                    {inquiry
                      ?.inquiry_number ||
                      "Not assigned"}
                  </strong>
                </span>

                <span>
                  Grade:{" "}
                  <strong className="text-slate-900">
                    {inquiry
                      ?.prospective_grade_level ||
                      "Not set"}
                  </strong>
                </span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-black text-slate-900">
                This action will:
              </p>

              <div className="mt-3 space-y-3">
                {[
                  "Create a new applicant record",
                  "Preserve the original inquiry",
                  "Link the inquiry to the applicant",
                  "Mark the inquiry as converted",
                  "Record inquiry and applicant status history",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />

                    <p className="text-sm font-semibold text-slate-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <label className="mt-6 block">
              <span className="text-sm font-black text-slate-800">
                Transition notes
              </span>

              <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
                Optional internal context for
                the conversion history.
              </span>

              <textarea
                rows="4"
                value={transitionNotes}
                onChange={(event) => {
                  setTransitionNotes(
                    event.target.value,
                  );

                  setLocalError("");
                  clearInquiryMutationError();
                }}
                placeholder="Add conversion notes..."
                disabled={
                  inquiryMutationLoading
                }
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70"
              />
            </label>

            {visibleError && (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4"
              >
                <p className="font-black text-red-800">
                  The inquiry could not be
                  converted.
                </p>

                <p className="mt-1 text-sm font-semibold text-red-700">
                  {visibleError}
                </p>
              </div>
            )}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:justify-end sm:p-7">
            <button
              type="button"
              onClick={onClose}
              disabled={
                inquiryMutationLoading
              }
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConvert}
              disabled={
                inquiryMutationLoading ||
                !inquiry?.id ||
                inquiry?.status !==
                  "qualified"
              }
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {inquiryMutationLoading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <UserRoundCheck
                  size={17}
                />
              )}

              {inquiryMutationLoading
                ? "Converting..."
                : "Convert inquiry"}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}