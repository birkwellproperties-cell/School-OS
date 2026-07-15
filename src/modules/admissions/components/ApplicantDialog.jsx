import {
  Loader2,
  Save,
  UserPlus,
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

const INPUT_CLASSES =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

const EMPTY_FORM = Object.freeze({
  first_name: "",
  middle_name: "",
  last_name: "",
  preferred_name: "",

  date_of_birth: "",
  gender: "",

  nationality: "",
  country_of_birth: "",
  primary_language: "",
  additional_languages: "",

  email: "",
  phone: "",

  current_school_name: "",
  current_grade_level: "",

  address_line_1: "",
  address_line_2: "",
  city: "",
  region: "",
  postal_code: "",
  country_code: "",

  medical_notes: "",
  learning_support_notes: "",
  accessibility_notes: "",

  status: "applicant",
});

function createFormState(applicant) {
  if (!applicant) {
    return {
      ...EMPTY_FORM,
    };
  }

  return {
    first_name:
      applicant.first_name || "",

    middle_name:
      applicant.middle_name || "",

    last_name:
      applicant.last_name || "",

    preferred_name:
      applicant.preferred_name || "",

    date_of_birth:
      applicant.date_of_birth || "",

    gender:
      applicant.gender || "",

    nationality:
      applicant.nationality || "",

    country_of_birth:
      applicant.country_of_birth || "",

    primary_language:
      applicant.primary_language || "",

    additional_languages:
      Array.isArray(
        applicant.additional_languages,
      )
        ? applicant.additional_languages.join(
            ", ",
          )
        : "",

    email:
      applicant.email || "",

    phone:
      applicant.phone || "",

    current_school_name:
      applicant.current_school_name || "",

    current_grade_level:
      applicant.current_grade_level || "",

    address_line_1:
      applicant.address_line_1 || "",

    address_line_2:
      applicant.address_line_2 || "",

    city:
      applicant.city || "",

    region:
      applicant.region || "",

    postal_code:
      applicant.postal_code || "",

    country_code:
      applicant.country_code || "",

    medical_notes:
      applicant.medical_notes || "",

    learning_support_notes:
      applicant.learning_support_notes ||
      "",

    accessibility_notes:
      applicant.accessibility_notes ||
      "",

    status:
      applicant.status || "applicant",
  };
}

function validateForm(form) {
  if (!form.first_name.trim()) {
    return "Applicant first name is required.";
  }

  if (!form.last_name.trim()) {
    return "Applicant last name is required.";
  }

  if (
    form.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      form.email.trim(),
    )
  ) {
    return "Enter a valid email address.";
  }

  if (
    form.country_code &&
    !/^[A-Za-z]{2}$/.test(
      form.country_code.trim(),
    )
  ) {
    return "Country code must contain exactly two letters.";
  }

  return "";
}

function Field({
  label,
  required = false,
  helper,
  children,
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-800">
        {label}

        {required && (
          <span className="ml-1 text-red-600">
            *
          </span>
        )}
      </span>

      <span className="mt-2 block">
        {children}
      </span>

      {helper && (
        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
          {helper}
        </span>
      )}
    </label>
  );
}

function SectionHeading({
  title,
  description,
}) {
  return (
    <div className="sm:col-span-2">
      <h3 className="text-base font-black text-slate-950">
        {title}
      </h3>

      {description && (
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

function normalizeOptionalText(value) {
  const normalized =
    value?.trim?.() || "";

  return normalized || null;
}

export default function ApplicantDialog({
  open,
  mode = "create",
  applicant = null,
  onClose,
}) {
  const {
    createApplicant,
    updateApplicant,

    canCreateApplicants,
    canEditApplicants,

    applicantMutationLoading,
    applicantMutationError,
    clearApplicantMutationError,
  } = useAdmissions();

  const isEditMode =
    mode === "edit" &&
    Boolean(applicant);

  const canSubmit =
    isEditMode
      ? canEditApplicants
      : canCreateApplicants;

  const [
    form,
    setForm,
  ] = useState(() =>
    createFormState(applicant),
  );

  const [
    localError,
    setLocalError,
  ] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      createFormState(
        isEditMode
          ? applicant
          : null,
      ),
    );

    setLocalError("");
    clearApplicantMutationError();
  }, [
    open,
    isEditMode,
    applicant,
    clearApplicantMutationError,
  ]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        !applicantMutationLoading
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
    applicantMutationLoading,
    onClose,
  ]);

  const payload = useMemo(
    () => ({
      first_name:
        form.first_name.trim(),

      middle_name:
        normalizeOptionalText(
          form.middle_name,
        ),

      last_name:
        form.last_name.trim(),

      preferred_name:
        normalizeOptionalText(
          form.preferred_name,
        ),

      date_of_birth:
        form.date_of_birth || null,

      gender:
        form.gender || null,

      nationality:
        normalizeOptionalText(
          form.nationality,
        ),

      country_of_birth:
        normalizeOptionalText(
          form.country_of_birth,
        ),

      primary_language:
        normalizeOptionalText(
          form.primary_language,
        ),

      additional_languages:
        form.additional_languages
          .split(",")
          .map((language) =>
            language.trim(),
          )
          .filter(Boolean),

      email:
        normalizeOptionalText(
          form.email,
        ),

      phone:
        normalizeOptionalText(
          form.phone,
        ),

      current_school_name:
        normalizeOptionalText(
          form.current_school_name,
        ),

      current_grade_level:
        normalizeOptionalText(
          form.current_grade_level,
        ),

      address_line_1:
        normalizeOptionalText(
          form.address_line_1,
        ),

      address_line_2:
        normalizeOptionalText(
          form.address_line_2,
        ),

      city:
        normalizeOptionalText(
          form.city,
        ),

      region:
        normalizeOptionalText(
          form.region,
        ),

      postal_code:
        normalizeOptionalText(
          form.postal_code,
        ),

      country_code:
        form.country_code.trim()
          ? form.country_code
              .trim()
              .toUpperCase()
          : null,

      medical_notes:
        normalizeOptionalText(
          form.medical_notes,
        ),

      learning_support_notes:
        normalizeOptionalText(
          form.learning_support_notes,
        ),

      accessibility_notes:
        normalizeOptionalText(
          form.accessibility_notes,
        ),

      status:
        form.status,
    }),
    [form],
  );

  if (!open) {
    return null;
  }

  const updateField =
    (field) => (event) => {
      setForm((current) => ({
        ...current,
        [field]:
          event.target.value,
      }));

      setLocalError("");
      clearApplicantMutationError();
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const validationError =
        validateForm(form);

      if (validationError) {
        setLocalError(
          validationError,
        );
        return;
      }

      if (!canSubmit) {
        setLocalError(
          "You do not have permission to perform this action.",
        );
        return;
      }

      try {
        if (isEditMode) {
          await updateApplicant(
            applicant.id,
            payload,
          );
        } else {
          await createApplicant(
            payload,
          );
        }

        onClose?.();
      } catch {
        // Mutation errors are exposed by
        // applicant state.
      }
    };

  const visibleError =
    localError ||
    applicantMutationError;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !applicantMutationLoading
        ) {
          onClose?.();
        }
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="applicant-dialog-title"
          className="w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:p-7">
            <div>
              <div className="flex items-center gap-2 text-indigo-700">
                <UserPlus size={18} />

                <p className="text-xs font-black uppercase tracking-[0.16em]">
                  Applicant record
                </p>
              </div>

              <h2
                id="applicant-dialog-title"
                className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl"
              >
                {isEditMode
                  ? "Edit applicant"
                  : "Create applicant"}
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                Maintain the prospective
                student’s personal, academic,
                contact, address, and support
                information.
              </p>
            </div>

            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              disabled={
                applicantMutationLoading
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={19} />
            </button>
          </header>

          <form
            onSubmit={handleSubmit}
          >
            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
              <SectionHeading
                title="Identity"
                description="Core applicant identity and demographic details."
              />

              <Field
                label="First name"
                required
              >
                <input
                  type="text"
                  value={form.first_name}
                  onChange={updateField(
                    "first_name",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="Middle name">
                <input
                  type="text"
                  value={form.middle_name}
                  onChange={updateField(
                    "middle_name",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field
                label="Last name"
                required
              >
                <input
                  type="text"
                  value={form.last_name}
                  onChange={updateField(
                    "last_name",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="Preferred name">
                <input
                  type="text"
                  value={
                    form.preferred_name
                  }
                  onChange={updateField(
                    "preferred_name",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="Date of birth">
                <input
                  type="date"
                  value={
                    form.date_of_birth
                  }
                  onChange={updateField(
                    "date_of_birth",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="Gender">
                <select
                  value={form.gender}
                  onChange={updateField(
                    "gender",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                >
                  <option value="">
                    Not specified
                  </option>

                  <option value="female">
                    Female
                  </option>

                  <option value="male">
                    Male
                  </option>

                  <option value="non_binary">
                    Non-binary
                  </option>

                  <option value="prefer_not_to_say">
                    Prefer not to say
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </Field>

              <Field label="Applicant status">
                <select
                  value={form.status}
                  onChange={updateField(
                    "status",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                >
                  <option value="prospect">
                    Prospect
                  </option>

                  <option value="applicant">
                    Applicant
                  </option>

                  <option value="offered">
                    Offered
                  </option>

                  <option value="accepted">
                    Accepted
                  </option>

                  <option value="enrolled">
                    Enrolled
                  </option>

                  <option value="withdrawn">
                    Withdrawn
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>
              </Field>

              <div className="hidden sm:block" />

              <SectionHeading
                title="Nationality and languages"
                description="Country and language information used for admissions planning."
              />

              <Field label="Nationality">
                <input
                  type="text"
                  value={form.nationality}
                  onChange={updateField(
                    "nationality",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="Country of birth">
                <input
                  type="text"
                  value={
                    form.country_of_birth
                  }
                  onChange={updateField(
                    "country_of_birth",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="Primary language">
                <input
                  type="text"
                  value={
                    form.primary_language
                  }
                  onChange={updateField(
                    "primary_language",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field
                label="Additional languages"
                helper="Separate multiple languages with commas."
              >
                <input
                  type="text"
                  value={
                    form.additional_languages
                  }
                  onChange={updateField(
                    "additional_languages",
                  )}
                  placeholder="Spanish, French"
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <SectionHeading
                title="Contact and academic background"
                description="Applicant contact information and current education."
              />

              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={updateField(
                    "email",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="Phone">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={updateField(
                    "phone",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="Current school">
                <input
                  type="text"
                  value={
                    form.current_school_name
                  }
                  onChange={updateField(
                    "current_school_name",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="Current grade">
                <input
                  type="text"
                  value={
                    form.current_grade_level
                  }
                  onChange={updateField(
                    "current_grade_level",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <SectionHeading
                title="Address"
                description="Residential or mailing address."
              />

              <Field label="Address line 1">
                <input
                  type="text"
                  value={
                    form.address_line_1
                  }
                  onChange={updateField(
                    "address_line_1",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="Address line 2">
                <input
                  type="text"
                  value={
                    form.address_line_2
                  }
                  onChange={updateField(
                    "address_line_2",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="City">
                <input
                  type="text"
                  value={form.city}
                  onChange={updateField(
                    "city",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="State / region">
                <input
                  type="text"
                  value={form.region}
                  onChange={updateField(
                    "region",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="Postal code">
                <input
                  type="text"
                  value={form.postal_code}
                  onChange={updateField(
                    "postal_code",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field
                label="Country code"
                helper="Two-letter ISO code, such as US or KE."
              >
                <input
                  type="text"
                  maxLength="2"
                  value={form.country_code}
                  onChange={updateField(
                    "country_code",
                  )}
                  disabled={
                    applicantMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <SectionHeading
                title="Health and support"
                description="Sensitive internal information used for planning and accommodations."
              />

              <div className="sm:col-span-2">
                <Field label="Medical notes">
                  <textarea
                    rows="3"
                    value={
                      form.medical_notes
                    }
                    onChange={updateField(
                      "medical_notes",
                    )}
                    disabled={
                      applicantMutationLoading
                    }
                    className={`${INPUT_CLASSES} resize-y py-3`}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Learning support notes">
                  <textarea
                    rows="3"
                    value={
                      form.learning_support_notes
                    }
                    onChange={updateField(
                      "learning_support_notes",
                    )}
                    disabled={
                      applicantMutationLoading
                    }
                    className={`${INPUT_CLASSES} resize-y py-3`}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Accessibility notes">
                  <textarea
                    rows="3"
                    value={
                      form.accessibility_notes
                    }
                    onChange={updateField(
                      "accessibility_notes",
                    )}
                    disabled={
                      applicantMutationLoading
                    }
                    className={`${INPUT_CLASSES} resize-y py-3`}
                  />
                </Field>
              </div>

              {visibleError && (
                <div
                  role="alert"
                  className="sm:col-span-2 rounded-2xl border border-red-200 bg-red-50 p-4"
                >
                  <p className="font-black text-red-800">
                    The applicant could not be saved.
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
                  applicantMutationLoading
                }
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  applicantMutationLoading ||
                  !canSubmit
                }
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {applicantMutationLoading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}

                {applicantMutationLoading
                  ? "Saving..."
                  : isEditMode
                    ? "Save changes"
                    : "Create applicant"}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </div>
  );
}