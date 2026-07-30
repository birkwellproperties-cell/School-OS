import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarDays,
  FileCheck2,
  FileText,
  GraduationCap,
  Loader2,
  Save,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

const INPUT_CLASSES =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

const SELECT_CLASSES =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

const TEXTAREA_CLASSES =
  "min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

const EMPTY_FORM = {
  application_id: "",
  decision_id: "",
  offer_number: "",
  entry_grade_level: "",
  intended_start_date: "",
  offered_on: "",
  expires_at: "",
  tuition_amount: "",
  currency_code: "USD",
  deposit_amount: "",
  deposit_due_on: "",
  scholarship_amount: "",
  financial_aid_amount: "",
  conditions: "",
  offer_message: "",
  internal_notes: "",
  supersedes_offer_id: "",
};

function toDateInputValue(
  value,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function toDateTimeInputValue(
  value,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const timezoneOffset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
        timezoneOffset *
          60 *
          1000,
    );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function normalizeMoneyInput(
  value,
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue,
  )
    ? String(numberValue)
    : "";
}

function getApplicantName(
  record,
) {
  return (
    record?.applicant_name ||
    record?.applicant?.full_name ||
    [
      record?.applicant?.first_name,
      record?.applicant?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    [
      record?.first_name,
      record?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Applicant"
  );
}

function getApplicationLabel(
  application,
) {
  const applicantName =
    getApplicantName(
      application,
    );

  const applicationNumber =
    application
      ?.application_number ||
    "Application";

  const grade =
    application
      ?.entry_grade_level;

  return [
    applicationNumber,
    applicantName,
    grade
      ? `Grade ${grade}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function getDecisionLabel(
  decision,
) {
  const decisionType =
    decision
      ?.decision_type ||
    decision
      ?.decision_outcome ||
    decision?.outcome ||
    decision?.status ||
    "Decision";

  const applicationNumber =
    decision
      ?.application_number ||
    decision
      ?.application
      ?.application_number;

  return [
    String(decisionType)
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase(),
      ),

    applicationNumber,
  ]
    .filter(Boolean)
    .join(" · ");
}

function buildInitialForm(
  offer,
) {
  if (!offer) {
    return {
      ...EMPTY_FORM,
    };
  }

  return {
    application_id:
      offer.application_id ||
      "",

    decision_id:
      offer.decision_id ||
      "",

    offer_number:
      offer.offer_number ||
      "",

    entry_grade_level:
      offer.entry_grade_level ||
      "",

    intended_start_date:
      toDateInputValue(
        offer.intended_start_date,
      ),

    offered_on:
      toDateInputValue(
        offer.offered_on,
      ),

    expires_at:
      toDateTimeInputValue(
        offer.expires_at,
      ),

    tuition_amount:
      normalizeMoneyInput(
        offer.tuition_amount,
      ),

    currency_code:
      offer.currency_code ||
      "USD",

    deposit_amount:
      normalizeMoneyInput(
        offer.deposit_amount,
      ),

    deposit_due_on:
      toDateInputValue(
        offer.deposit_due_on,
      ),

    scholarship_amount:
      normalizeMoneyInput(
        offer.scholarship_amount,
      ),

    financial_aid_amount:
      normalizeMoneyInput(
        offer.financial_aid_amount,
      ),

    conditions:
      offer.conditions ||
      "",

    offer_message:
      offer.offer_message ||
      "",

    internal_notes:
      offer.internal_notes ||
      "",

    supersedes_offer_id:
      offer.supersedes_offer_id ||
      "",
  };
}

function normalizeOptionalMoney(
  value,
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue,
  )
    ? numberValue
    : null;
}

function FieldLabel({
  children,
  required = false,
}) {
  return (
    <span className="mb-2 block text-sm font-black text-slate-700">
      {children}

      {required && (
        <span className="ml-1 text-red-600">
          *
        </span>
      )}
    </span>
  );
}

export default function OfferDialog({
  open = false,
  mode = "create",
  offer = null,
  applications = [],
  decisions = [],
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

  const isEditMode =
    mode === "edit";

  const title =
    isEditMode
      ? "Edit Admission Offer"
      : "Create Admission Offer";

  const availableApplications =
    useMemo(
      () =>
        Array.isArray(
          applications,
        )
          ? applications
          : applications?.items ||
            [],
      [
        applications,
      ],
    );

  const availableDecisions =
    useMemo(
      () =>
        Array.isArray(
          decisions,
        )
          ? decisions
          : decisions?.items ||
            [],
      [
        decisions,
      ],
    );

  const availableOffers =
    useMemo(
      () =>
        Array.isArray(offers)
          ? offers
          : offers?.items ||
            [],
      [
        offers,
      ],
    );

  const selectedApplication =
    useMemo(
      () =>
        availableApplications.find(
          (application) =>
            application.id ===
            form.application_id,
        ) || null,
      [
        availableApplications,
        form.application_id,
      ],
    );

  const eligibleDecisions =
    useMemo(
      () =>
        availableDecisions.filter(
          (decision) => {
            if (
              !form.application_id
            ) {
              return true;
            }

            return (
              decision.application_id ===
              form.application_id
            );
          },
        ),
      [
        availableDecisions,
        form.application_id,
      ],
    );

  const supersededOfferOptions =
    useMemo(
      () =>
        availableOffers.filter(
          (candidateOffer) =>
            candidateOffer.id !==
              offer?.id &&
            (!form.application_id ||
              candidateOffer.application_id ===
                form.application_id),
        ),
      [
        availableOffers,
        form.application_id,
        offer?.id,
      ],
    );

  const estimatedNetTuition =
    useMemo(() => {
      const tuition =
        Number(
          form.tuition_amount,
        ) || 0;

      const scholarship =
        Number(
          form.scholarship_amount,
        ) || 0;

      const financialAid =
        Number(
          form.financial_aid_amount,
        ) || 0;

      return Math.max(
        tuition -
          scholarship -
          financialAid,
        0,
      );
    }, [
      form.tuition_amount,
      form.scholarship_amount,
      form.financial_aid_amount,
    ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      buildInitialForm(
        isEditMode
          ? offer
          : null,
      ),
    );

    setLocalError("");
  }, [
    open,
    isEditMode,
    offer,
  ]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (
      event,
    ) => {
      if (
        event.key === "Escape" &&
        !loading
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
    loading,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  const updateField = (
    field,
    value,
  ) => {
    setForm(
      (currentForm) => ({
        ...currentForm,
        [field]: value,
      }),
    );

    if (localError) {
      setLocalError("");
    }
  };

  const handleApplicationChange = (
    applicationId,
  ) => {
    const application =
      availableApplications.find(
        (candidate) =>
          candidate.id ===
          applicationId,
      );

    setForm(
      (currentForm) => ({
        ...currentForm,

        application_id:
          applicationId,

        decision_id: "",

        entry_grade_level:
          application
            ?.entry_grade_level ||
          currentForm
            .entry_grade_level,

        intended_start_date:
          toDateInputValue(
            application
              ?.intended_start_date ||
            application
              ?.requested_start_date ||
            currentForm
              .intended_start_date,
          ),
      }),
    );

    setLocalError("");
  };
  const validateForm = () => {
    if (
      !form.application_id
    ) {
      return "Application is required.";
    }

    if (
      !form.decision_id
    ) {
      return "Admission decision is required.";
    }

    if (
      !form.offer_number.trim()
    ) {
      return "Offer number is required.";
    }

    if (
      !form.entry_grade_level.trim()
    ) {
      return "Entry grade level is required.";
    }

    const moneyFields = [
      [
        "Tuition amount",
        form.tuition_amount,
      ],
      [
        "Deposit amount",
        form.deposit_amount,
      ],
      [
        "Scholarship amount",
        form.scholarship_amount,
      ],
      [
        "Financial aid amount",
        form.financial_aid_amount,
      ],
    ];

    for (
      const [
        label,
        value,
      ] of moneyFields
    ) {
      if (
        value === "" ||
        value === null ||
        value === undefined
      ) {
        continue;
      }

      const numberValue =
        Number(value);

      if (
        !Number.isFinite(
          numberValue,
        ) ||
        numberValue < 0
      ) {
        return `${label} must be zero or greater.`;
      }
    }

    if (
      form.deposit_due_on &&
      !form.deposit_amount
    ) {
      return "Enter a deposit amount before setting a deposit due date.";
    }

    if (
      form.expires_at
    ) {
      const expiryDate =
        new Date(
          form.expires_at,
        );

      if (
        Number.isNaN(
          expiryDate.getTime(),
        )
      ) {
        return "Offer expiry date and time is invalid.";
      }

      if (
        form.offered_on
      ) {
        const offeredDate =
          new Date(
            `${form.offered_on}T00:00:00`,
          );

        if (
          expiryDate <
          offeredDate
        ) {
          return "Offer expiry cannot be earlier than the offer date.";
        }
      }
    }

    return "";
  };

  const buildPayload = () => ({
    application_id:
      form.application_id,

    decision_id:
      form.decision_id,

    offer_number:
      form.offer_number.trim(),

    entry_grade_level:
      form.entry_grade_level.trim(),

    intended_start_date:
      form.intended_start_date ||
      null,

    offered_on:
      form.offered_on ||
      null,

    expires_at:
      form.expires_at
        ? new Date(
            form.expires_at,
          ).toISOString()
        : null,

    tuition_amount:
      normalizeOptionalMoney(
        form.tuition_amount,
      ),

    currency_code:
      form.currency_code
        .trim()
        .toUpperCase() ||
      "USD",

    deposit_amount:
      normalizeOptionalMoney(
        form.deposit_amount,
      ),

    deposit_due_on:
      form.deposit_due_on ||
      null,

    scholarship_amount:
      normalizeOptionalMoney(
        form.scholarship_amount,
      ),

    financial_aid_amount:
      normalizeOptionalMoney(
        form.financial_aid_amount,
      ),

    conditions:
      form.conditions.trim() ||
      null,

    offer_message:
      form.offer_message.trim() ||
      null,

    internal_notes:
      form.internal_notes.trim() ||
      null,

    supersedes_offer_id:
      form.supersedes_offer_id ||
      null,
  });

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const validationError =
        validateForm();

      if (
        validationError
      ) {
        setLocalError(
          validationError,
        );
        return;
      }

      setLocalError("");

      try {
        await onSave?.(
          buildPayload(),
        );
      } catch {
        // Mutation errors are exposed by offer state.
      }
    };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !loading
        ) {
          onClose?.();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-dialog-title"
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <FileCheck2
                size={23}
              />
            </div>

            <div>
              <h2
                id="offer-dialog-title"
                className="text-xl font-black text-slate-950"
              >
                {title}
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                {isEditMode
                  ? "Update the financial terms, dates, and communication for this admission offer."
                  : "Create a draft offer linked to an approved admission decision."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onClose?.()
            }
            disabled={loading}
            aria-label="Close admission offer dialog"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

        <form
          onSubmit={
            handleSubmit
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-6 p-5 sm:p-6">
              {(localError ||
                error) && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={18}
                      className="mt-0.5 shrink-0 text-red-600"
                    />

                    <p className="text-sm font-black leading-6 text-red-800">
                      {localError ||
                        error}
                    </p>
                  </div>
                </div>
              )}

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <GraduationCap
                      size={20}
                    />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-950">
                      Application and Decision
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Link this offer to the correct applicant application and approved decision.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <label className="block">
                    <FieldLabel
                      required
                    >
                      Application
                    </FieldLabel>

                    <select
                      value={
                        form.application_id
                      }
                      onChange={(
                        event,
                      ) =>
                        handleApplicationChange(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        loading ||
                        isEditMode
                      }
                      className={
                        SELECT_CLASSES
                      }
                    >
                      <option value="">
                        Select an application
                      </option>

                      {availableApplications.map(
                        (
                          application,
                        ) => (
                          <option
                            key={
                              application.id
                            }
                            value={
                              application.id
                            }
                          >
                            {getApplicationLabel(
                              application,
                            )}
                          </option>
                        ),
                      )}
                    </select>

                    {isEditMode && (
                      <p className="mt-2 text-xs font-bold text-slate-400">
                        The linked application cannot be changed after the offer is created.
                      </p>
                    )}
                  </label>

                  <label className="block">
                    <FieldLabel
                      required
                    >
                      Admission decision
                    </FieldLabel>

                    <select
                      value={
                        form.decision_id
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "decision_id",
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        loading ||
                        isEditMode ||
                        !form.application_id
                      }
                      className={
                        SELECT_CLASSES
                      }
                    >
                      <option value="">
                        {form.application_id
                          ? "Select an approved decision"
                          : "Select an application first"}
                      </option>

                      {eligibleDecisions.map(
                        (
                          decision,
                        ) => (
                          <option
                            key={
                              decision.id
                            }
                            value={
                              decision.id
                            }
                          >
                            {getDecisionLabel(
                              decision,
                            )}
                          </option>
                        ),
                      )}
                    </select>

                    {isEditMode && (
                      <p className="mt-2 text-xs font-bold text-slate-400">
                        The linked decision cannot be changed after the offer is created.
                      </p>
                    )}
                  </label>

                  <label className="block">
                    <FieldLabel
                      required
                    >
                      Offer number
                    </FieldLabel>

                    <input
                      type="text"
                      value={
                        form.offer_number
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "offer_number",
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        loading
                      }
                      placeholder="Example: OFF-2026-00125"
                      className={
                        INPUT_CLASSES
                      }
                    />
                  </label>

                  <label className="block">
                    <FieldLabel
                      required
                    >
                      Entry grade level
                    </FieldLabel>

                    <input
                      type="text"
                      value={
                        form.entry_grade_level
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "entry_grade_level",
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        loading
                      }
                      placeholder="Example: Grade 9"
                      className={
                        INPUT_CLASSES
                      }
                    />
                  </label>

                  <label className="block">
                    <FieldLabel>
                      Intended start date
                    </FieldLabel>

                    <div className="relative">
                      <CalendarDays
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="date"
                        value={
                          form.intended_start_date
                        }
                        onChange={(
                          event,
                        ) =>
                          updateField(
                            "intended_start_date",
                            event.target
                              .value,
                          )
                        }
                        disabled={
                          loading
                        }
                        className={`${INPUT_CLASSES} pl-11`}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <FieldLabel>
                      Supersedes offer
                    </FieldLabel>

                    <select
                      value={
                        form.supersedes_offer_id
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "supersedes_offer_id",
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        loading
                      }
                      className={
                        SELECT_CLASSES
                      }
                    >
                      <option value="">
                        No previous offer
                      </option>

                      {supersededOfferOptions.map(
                        (
                          candidateOffer,
                        ) => (
                          <option
                            key={
                              candidateOffer.id
                            }
                            value={
                              candidateOffer.id
                            }
                          >
                            {candidateOffer.offer_number ||
                              "Unnamed offer"}{" "}
                            ·{" "}
                            {String(
                              candidateOffer.status ||
                                "draft",
                            )
                              .replaceAll(
                                "_",
                                " ",
                              )
                              .replace(
                                /\b\w/g,
                                (
                                  character,
                                ) =>
                                  character.toUpperCase(),
                              )}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </div>

                {selectedApplication && (
                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-500">
                      Selected applicant
                    </p>

                    <p className="mt-2 font-black text-blue-950">
                      {getApplicantName(
                        selectedApplication,
                      )}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-blue-700">
                      {selectedApplication.application_number ||
                        "Application number unavailable"}
                    </p>
                  </div>
                )}
              </section>
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <BadgeDollarSign
                      size={20}
                    />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-950">
                      Financial Terms
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Define tuition, assistance, deposit requirements, and currency.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="block">
                    <FieldLabel>
                      Tuition amount
                    </FieldLabel>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.tuition_amount
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "tuition_amount",
                          event.target.value,
                        )
                      }
                      disabled={loading}
                      placeholder="0.00"
                      className={
                        INPUT_CLASSES
                      }
                    />
                  </label>

                  <label className="block">
                    <FieldLabel>
                      Currency code
                    </FieldLabel>

                    <input
                      type="text"
                      maxLength={3}
                      value={
                        form.currency_code
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "currency_code",
                          event.target.value
                            .toUpperCase(),
                        )
                      }
                      disabled={loading}
                      placeholder="USD"
                      className={
                        INPUT_CLASSES
                      }
                    />
                  </label>

                  <label className="block">
                    <FieldLabel>
                      Deposit amount
                    </FieldLabel>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.deposit_amount
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "deposit_amount",
                          event.target.value,
                        )
                      }
                      disabled={loading}
                      placeholder="0.00"
                      className={
                        INPUT_CLASSES
                      }
                    />
                  </label>

                  <label className="block">
                    <FieldLabel>
                      Deposit due date
                    </FieldLabel>

                    <input
                      type="date"
                      value={
                        form.deposit_due_on
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "deposit_due_on",
                          event.target.value,
                        )
                      }
                      disabled={loading}
                      className={
                        INPUT_CLASSES
                      }
                    />
                  </label>

                  <label className="block">
                    <FieldLabel>
                      Scholarship amount
                    </FieldLabel>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.scholarship_amount
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "scholarship_amount",
                          event.target.value,
                        )
                      }
                      disabled={loading}
                      placeholder="0.00"
                      className={
                        INPUT_CLASSES
                      }
                    />
                  </label>

                  <label className="block">
                    <FieldLabel>
                      Financial aid amount
                    </FieldLabel>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.financial_aid_amount
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "financial_aid_amount",
                          event.target.value,
                        )
                      }
                      disabled={loading}
                      placeholder="0.00"
                      className={
                        INPUT_CLASSES
                      }
                    />
                  </label>
                </div>

                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-600">
                    Estimated net tuition
                  </p>

                  <p className="mt-2 text-2xl font-black text-emerald-950">
                    {new Intl.NumberFormat(
                      "en-US",
                      {
                        style:
                          "currency",
                        currency:
                          form.currency_code ||
                          "USD",
                      },
                    ).format(
                      estimatedNetTuition,
                    )}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-emerald-700">
                    Tuition less scholarship and financial aid.
                  </p>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <CalendarDays
                      size={20}
                    />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-950">
                      Offer Dates
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Dates may be finalized later when the approved offer is sent.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <FieldLabel>
                      Offer date
                    </FieldLabel>

                    <input
                      type="date"
                      value={
                        form.offered_on
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "offered_on",
                          event.target.value,
                        )
                      }
                      disabled={loading}
                      className={
                        INPUT_CLASSES
                      }
                    />
                  </label>

                  <label className="block">
                    <FieldLabel>
                      Offer expires
                    </FieldLabel>

                    <input
                      type="datetime-local"
                      value={
                        form.expires_at
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "expires_at",
                          event.target.value,
                        )
                      }
                      disabled={loading}
                      className={
                        INPUT_CLASSES
                      }
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <FileText
                      size={20}
                    />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-950">
                      Offer Communication
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Record conditions, the applicant-facing message, and internal administrative notes.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <label className="block">
                    <FieldLabel>
                      Conditions
                    </FieldLabel>

                    <textarea
                      value={
                        form.conditions
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "conditions",
                          event.target.value,
                        )
                      }
                      disabled={loading}
                      placeholder="List enrollment conditions, outstanding requirements, or other obligations."
                      className={
                        TEXTAREA_CLASSES
                      }
                    />
                  </label>

                  <label className="block">
                    <FieldLabel>
                      Offer message
                    </FieldLabel>

                    <textarea
                      value={
                        form.offer_message
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "offer_message",
                          event.target.value,
                        )
                      }
                      disabled={loading}
                      placeholder="Enter the message that will accompany the admission offer."
                      className={
                        TEXTAREA_CLASSES
                      }
                    />
                  </label>

                  <label className="block">
                    <FieldLabel>
                      Internal notes
                    </FieldLabel>

                    <textarea
                      value={
                        form.internal_notes
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "internal_notes",
                          event.target.value,
                        )
                      }
                      disabled={loading}
                      placeholder="Administrative notes are not intended for the applicant."
                      className={
                        TEXTAREA_CLASSES
                      }
                    />
                  </label>
                </div>
              </section>
            </div>
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="text-xs font-bold leading-5 text-slate-500">
              New offers are saved as drafts and must complete the approval workflow before they can be sent.
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  onClose?.()
                }
                disabled={loading}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}

                {loading
                  ? "Saving..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Offer"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
