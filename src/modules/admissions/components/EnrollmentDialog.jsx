import {
  AlertCircle,
  GraduationCap,
  Loader2,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

const EMPTY_FORM = {
  offer_id: "",
  application_id: "",
  applicant_id: "",
  decision_id: "",
  target_grade_level: "",
  enrollment_start_date: "",
};

const INPUT_CLASSES =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

function normalizeItems(
  value,
) {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    Array.isArray(value?.items)
  ) {
    return value.items;
  }

  return [];
}

function getOfferLabel(
  offer,
) {
  const offerNumber =
    offer?.offer_number ||
    "Offer";

  const grade =
    offer?.entry_grade_level ||
    "Grade not set";

  const status =
    String(
      offer?.status || "",
    )
      .replaceAll("_", " ")
      .trim();

  return [
    offerNumber,
    grade,
    status,
  ]
    .filter(Boolean)
    .join(" — ");
}

function getInitialForm({
  mode,
  conversion,
}) {
  if (
    mode !== "edit" ||
    !conversion
  ) {
    return {
      ...EMPTY_FORM,
    };
  }

  return {
    offer_id:
      conversion.offer_id ||
      "",

    application_id:
      conversion.application_id ||
      "",

    applicant_id:
      conversion.applicant_id ||
      "",

    decision_id:
      conversion.decision_id ||
      "",

    target_grade_level:
      conversion.target_grade_level ||
      "",

    enrollment_start_date:
      conversion.enrollment_start_date ||
      "",
  };
}

export default function EnrollmentDialog({
  open,
  mode = "create",
  conversion = null,
  offers = [],
  loading = false,
  error = "",
  onClose,
  onSave,
}) {
  const [
    form,
    setForm,
  ] = useState({
    ...EMPTY_FORM,
  });

  const [
    localError,
    setLocalError,
  ] = useState("");

  const offerItems =
    useMemo(
      () =>
        normalizeItems(offers),
      [offers],
    );

  const eligibleOffers =
    useMemo(
      () =>
        offerItems.filter(
          (offer) =>
            offer?.status ===
              "accepted" ||
            offer?.id ===
              conversion?.offer_id,
        ),
      [
        offerItems,
        conversion?.offer_id,
      ],
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      getInitialForm({
        mode,
        conversion,
      }),
    );

    setLocalError("");
  }, [
    open,
    mode,
    conversion,
  ]);

  if (!open) {
    return null;
  }

  const isEdit =
    mode === "edit";

  const updateField = (
    field,
    value,
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );

    setLocalError("");
  };

  const handleOfferChange = (
    offerId,
  ) => {
    const selectedOffer =
      eligibleOffers.find(
        (offer) =>
          offer.id ===
          offerId,
      );

    if (!selectedOffer) {
      setForm({
        ...EMPTY_FORM,
      });

      return;
    }

    setForm(
      (current) => ({
        ...current,

        offer_id:
          selectedOffer.id,

        application_id:
          selectedOffer.application_id ||
          "",

        applicant_id:
          selectedOffer.applicant_id ||
          "",

        decision_id:
          selectedOffer.decision_id ||
          "",

        target_grade_level:
          current.target_grade_level ||
          selectedOffer.entry_grade_level ||
          "",

        enrollment_start_date:
          current.enrollment_start_date ||
          selectedOffer.intended_start_date ||
          "",
      }),
    );

    setLocalError("");
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (!form.offer_id) {
        setLocalError(
          "Select an accepted admission offer.",
        );

        return;
      }

      if (!form.application_id) {
        setLocalError(
          "The selected offer is missing its application.",
        );

        return;
      }

      if (!form.applicant_id) {
        setLocalError(
          "The selected offer is missing its applicant.",
        );

        return;
      }

      if (!form.decision_id) {
        setLocalError(
          "The selected offer is missing its admission decision.",
        );

        return;
      }

      if (
        !form.target_grade_level
          .trim()
      ) {
        setLocalError(
          "Target grade level is required.",
        );

        return;
      }

      if (
        !form.enrollment_start_date
      ) {
        setLocalError(
          "Enrollment start date is required.",
        );

        return;
      }

      const payload = {
        offer_id:
          form.offer_id,

        application_id:
          form.application_id,

        applicant_id:
          form.applicant_id,

        decision_id:
          form.decision_id,

        target_grade_level:
          form.target_grade_level
            .trim(),

        enrollment_start_date:
          form.enrollment_start_date,
      };

      try {
        setLocalError("");

        await onSave?.(
          payload,
        );
      } catch (saveError) {
        setLocalError(
          saveError?.message ||
          "Unable to save the enrollment conversion.",
        );
      }
    };

  const displayedError =
    localError ||
    error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="enrollment-dialog-title"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/20 bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <GraduationCap
                size={21}
              />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600">
                Student transition
              </p>

              <h2
                id="enrollment-dialog-title"
                className="mt-1 text-xl font-black text-slate-950"
              >
                {isEdit
                  ? "Edit Enrollment Conversion"
                  : "Create Enrollment Conversion"}
              </h2>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                {isEdit
                  ? "Update the target grade and enrollment start date."
                  : "Convert an accepted admission offer into an enrollment request."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close enrollment dialog"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-6 p-6"
        >
          {displayedError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"
            >
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0 text-red-700"
              />

              <div>
                <p className="font-black text-red-800">
                  Enrollment conversion could not be saved.
                </p>

                <p className="mt-1 text-sm font-semibold text-red-700">
                  {displayedError}
                </p>
              </div>
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-black text-slate-950">
              Accepted admission offer
            </h3>

            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              The application, applicant, and decision are automatically derived from the selected offer.
            </p>

            <label className="mt-4 block">
              <span className="text-sm font-black text-slate-700">
                Admission offer
              </span>

              <select
                value={
                  form.offer_id
                }
                onChange={(
                  event,
                ) =>
                  handleOfferChange(
                    event.target.value,
                  )
                }
                disabled={
                  loading ||
                  isEdit
                }
                className={`${INPUT_CLASSES} mt-2`}
                required
              >
                <option value="">
                  Select an accepted offer
                </option>

                {eligibleOffers.map(
                  (offer) => (
                    <option
                      key={offer.id}
                      value={offer.id}
                    >
                      {getOfferLabel(
                        offer,
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>

            {!isEdit &&
              eligibleOffers.length ===
                0 && (
                <p className="mt-3 text-sm font-black text-amber-700">
                  No accepted offers are available for enrollment conversion.
                </p>
              )}
          </section>

          <section className="grid gap-5 rounded-2xl border border-slate-200 p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <h3 className="font-black text-slate-950">
                Enrollment details
              </h3>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                These values control the student’s intended enrollment placement.
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-black text-slate-700">
                Target grade level
              </span>

              <input
                type="text"
                value={
                  form.target_grade_level
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "target_grade_level",
                    event.target.value,
                  )
                }
                disabled={loading}
                placeholder="Example: Grade 7"
                className={`${INPUT_CLASSES} mt-2`}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-700">
                Enrollment start date
              </span>

              <input
                type="date"
                value={
                  form.enrollment_start_date
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "enrollment_start_date",
                    event.target.value,
                  )
                }
                disabled={loading}
                className={`${INPUT_CLASSES} mt-2`}
                required
              />
            </label>
          </section>

          <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Application ID
              </p>

              <p className="mt-1 break-all text-sm font-bold text-slate-800">
                {form.application_id ||
                  "Not selected"}
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Applicant ID
              </p>

              <p className="mt-1 break-all text-sm font-bold text-slate-800">
                {form.applicant_id ||
                  "Not selected"}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Decision ID
              </p>

              <p className="mt-1 break-all text-sm font-bold text-slate-800">
                {form.decision_id ||
                  "Not selected"}
              </p>
            </div>
          </section>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                (!isEdit &&
                  eligibleOffers.length ===
                    0)
              }
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              )}

              {loading
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Conversion"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}