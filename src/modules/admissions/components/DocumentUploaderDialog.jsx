import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";

import {
  useAdmissions,
} from "../hooks";

import {
  MAX_APPLICATION_DOCUMENT_SIZE,
  validateApplicationDocumentFile,
} from "../services";

const INITIAL_FORM = Object.freeze({
  document_type: "",
  document_label: "",
  requirement_status: "required",
  issued_on: "",
  expires_on: "",
  notes: "",
});

const DOCUMENT_TYPE_OPTIONS = [
  {
    value: "birth_certificate",
    label: "Birth Certificate",
  },
  {
    value: "passport_photo",
    label: "Passport Photo",
  },
  {
    value: "previous_school_report",
    label: "Previous School Report",
  },
  {
    value: "immunization_record",
    label: "Immunization Record",
  },
  {
    value: "guardian_identification",
    label: "Guardian Identification",
  },
  {
    value: "recommendation_letter",
    label: "Recommendation Letter",
  },
  {
    value: "transfer_certificate",
    label: "Transfer Certificate",
  },
  {
    value: "medical_record",
    label: "Medical Record",
  },
  {
    value: "assessment_record",
    label: "Assessment Record",
  },
  {
    value: "other",
    label: "Other",
  },
];

const REQUIREMENT_OPTIONS = [
  {
    value: "required",
    label: "Required",
  },
  {
    value: "optional",
    label: "Optional",
  },
  {
    value: "conditionally_required",
    label: "Conditionally Required",
  },
];

function formatFileSize(value) {
  const bytes = Number(value);

  if (
    !Number.isFinite(bytes) ||
    bytes < 0
  ) {
    return "Unknown size";
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

function validateForm({
  form,
  selectedFile,
}) {
  if (!selectedFile) {
    return "Select a document file.";
  }

  try {
    validateApplicationDocumentFile(
      selectedFile,
    );
  } catch (error) {
    return (
      error?.message ||
      "The selected file is not valid."
    );
  }

  if (
    !form.document_type.trim()
  ) {
    return "Document type is required.";
  }

  if (
    !form.document_label.trim()
  ) {
    return "Document label is required.";
  }

  if (
    form.issued_on &&
    form.expires_on &&
    form.expires_on <
      form.issued_on
  ) {
    return "Expiry date cannot be before the issue date.";
  }

  return "";
}

export default function DocumentUploaderDialog({
  open,
  onClose,
}) {
  const fileInputRef =
    useRef(null);

  const {
    selectedApplication,

    uploadApplicationDocument,

    canUploadApplicationDocuments,

    documentMutationLoading,
    documentMutationError,

    uploadProgress,

    clearDocumentMutationError,
    resetUploadProgress,
  } = useAdmissions();

  const [
    form,
    setForm,
  ] = useState({
    ...INITIAL_FORM,
  });

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);

  const [
    dragActive,
    setDragActive,
  ] = useState(false);

  const [
    localError,
    setLocalError,
  ] = useState("");

  const [
    uploadSucceeded,
    setUploadSucceeded,
  ] = useState(false);

  const visibleError =
    localError ||
    documentMutationError;

  const applicationNumber =
    selectedApplication
      ?.application_number ||
    "Selected application";

  const maxSizeLabel =
    formatFileSize(
      MAX_APPLICATION_DOCUMENT_SIZE,
    );

  const selectedDocumentType =
    useMemo(
      () =>
        DOCUMENT_TYPE_OPTIONS.find(
          (option) =>
            option.value ===
            form.document_type,
        ) || null,
      [
        form.document_type,
      ],
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      ...INITIAL_FORM,
    });

    setSelectedFile(null);
    setDragActive(false);
    setLocalError("");
    setUploadSucceeded(false);

    clearDocumentMutationError?.();
    resetUploadProgress?.();
  }, [
    open,
    clearDocumentMutationError,
    resetUploadProgress,
  ]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown =
      (event) => {
        if (
          event.key === "Escape" &&
          !documentMutationLoading
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
    documentMutationLoading,
    onClose,
  ]);

  useEffect(() => {
    if (
      form.document_type &&
      !form.document_label.trim() &&
      selectedDocumentType
    ) {
      setForm((current) => ({
        ...current,
        document_label:
          selectedDocumentType.label,
      }));
    }
  }, [
    form.document_type,
    form.document_label,
    selectedDocumentType,
  ]);

  if (!open) {
    return null;
  }

  const clearErrors = () => {
    setLocalError("");
    clearDocumentMutationError?.();
  };

  const updateField =
    (field) => (event) => {
      const value =
        event.target.value;

      setForm((current) => ({
        ...current,
        [field]: value,
      }));

      clearErrors();
      setUploadSucceeded(false);
    };

  const selectFile = (file) => {
    if (!file) {
      return;
    }

    try {
      validateApplicationDocumentFile(
        file,
      );

      setSelectedFile(file);
      setLocalError("");
      setUploadSucceeded(false);

      if (
        !form.document_label.trim()
      ) {
        const fallbackLabel =
          file.name
            .replace(
              /\.[^.]+$/,
              "",
            )
            .replace(
              /[-_]+/g,
              " ",
            )
            .replace(
              /\b\w/g,
              (character) =>
                character.toUpperCase(),
            );

        setForm((current) => ({
          ...current,
          document_label:
            fallbackLabel,
        }));
      }
    } catch (error) {
      setSelectedFile(null);

      setLocalError(
        error?.message ||
          "The selected file is not valid.",
      );
    }
  };

  const handleFileInputChange =
    (event) => {
      const file =
        event.target.files?.[0];

      selectFile(file);

      event.target.value = "";
    };

  const handleDragEnter =
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (
        !documentMutationLoading
      ) {
        setDragActive(true);
      }
    };

  const handleDragOver =
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (
        !documentMutationLoading
      ) {
        setDragActive(true);
      }
    };

  const handleDragLeave =
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (
        event.currentTarget ===
        event.target
      ) {
        setDragActive(false);
      }
    };

  const handleDrop =
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      setDragActive(false);

      if (
        documentMutationLoading
      ) {
        return;
      }

      const file =
        event.dataTransfer
          ?.files?.[0];

      selectFile(file);
    };

  const handleRemoveFile = () => {
    if (
      documentMutationLoading
    ) {
      return;
    }

    setSelectedFile(null);
    setUploadSucceeded(false);
    clearErrors();
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const validationError =
        validateForm({
          form,
          selectedFile,
        });

      if (validationError) {
        setLocalError(
          validationError,
        );

        return;
      }

      if (
        !canUploadApplicationDocuments
      ) {
        setLocalError(
          "You do not have permission to upload application documents.",
        );

        return;
      }

      try {
        await uploadApplicationDocument({
          file: selectedFile,

          documentType:
            form.document_type,

          documentLabel:
            form.document_label,

          requirementStatus:
            form.requirement_status,

          issuedOn:
            form.issued_on ||
            null,

          expiresOn:
            form.expires_on ||
            null,

          notes:
            form.notes.trim() ||
            null,

          metadata: {},
        });

        setUploadSucceeded(true);

        onClose?.();
      } catch {
        // Mutation errors are exposed
        // through document state.
      }
    };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !documentMutationLoading
        ) {
          onClose?.();
        }
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="document-uploader-dialog-title"
          className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:p-7">
            <div>
              <div className="flex items-center gap-2 text-indigo-700">
                <UploadCloud
                  size={18}
                />

                <p className="text-xs font-black uppercase tracking-[0.16em]">
                  Application documents
                </p>
              </div>

              <h2
                id="document-uploader-dialog-title"
                className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl"
              >
                Upload document
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                Add a secure document
                to{" "}
                <span className="font-black text-slate-900">
                  {applicationNumber}
                </span>
                . Files are stored in
                the private Admissions
                document repository.
              </p>
            </div>

            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              disabled={
                documentMutationLoading
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={19} />
            </button>
          </header>

          <form
            onSubmit={handleSubmit}
          >
            <div className="space-y-6 p-5 sm:p-7">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">
                  Application scope
                </p>

                <p className="mt-2 font-black text-slate-950">
                  {applicationNumber}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-600">
                  Uploaded documents
                  remain linked to this
                  application and its
                  applicant record.
                </p>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (
                    !documentMutationLoading
                  ) {
                    fileInputRef.current
                      ?.click();
                  }
                }}
                onKeyDown={(event) => {
                  if (
                    (
                      event.key ===
                        "Enter" ||
                      event.key === " "
                    ) &&
                    !documentMutationLoading
                  ) {
                    event.preventDefault();

                    fileInputRef.current
                      ?.click();
                  }
                }}
                onDragEnter={
                  handleDragEnter
                }
                onDragOver={
                  handleDragOver
                }
                onDragLeave={
                  handleDragLeave
                }
                onDrop={handleDrop}
                className={[
                  "cursor-pointer rounded-3xl border-2 border-dashed p-7 text-center transition",
                  dragActive
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/40",
                  documentMutationLoading
                    ? "cursor-not-allowed opacity-60"
                    : "",
                ].join(" ")}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                  onChange={
                    handleFileInputChange
                  }
                  disabled={
                    documentMutationLoading
                  }
                  className="hidden"
                />

                {selectedFile ? (
                  <div>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <CheckCircle2
                        size={25}
                      />
                    </div>

                    <p className="mt-4 break-all font-black text-slate-950">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {formatFileSize(
                        selectedFile.size,
                      )}
                      {" · "}
                      {selectedFile.type ||
                        "Unknown file type"}
                    </p>

                    {!documentMutationLoading && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveFile();
                        }}
                        className="mt-4 text-sm font-black text-red-600 hover:text-red-700"
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                      <UploadCloud
                        size={26}
                      />
                    </div>

                    <p className="mt-4 font-black text-slate-950">
                      Drag and drop a
                      document here
                    </p>

                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                      Or click to browse.
                      PDF, DOCX, JPG, and
                      PNG files are
                      supported up to{" "}
                      {maxSizeLabel}.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-black text-slate-800">
                    Document type
                    <span className="text-red-600">
                      {" *"}
                    </span>
                  </span>

                  <select
                    value={
                      form.document_type
                    }
                    onChange={updateField(
                      "document_type",
                    )}
                    disabled={
                      documentMutationLoading
                    }
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">
                      Select document
                      type
                    </option>

                    {DOCUMENT_TYPE_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-black text-slate-800">
                    Document label
                    <span className="text-red-600">
                      {" *"}
                    </span>
                  </span>

                  <input
                    type="text"
                    value={
                      form.document_label
                    }
                    onChange={updateField(
                      "document_label",
                    )}
                    disabled={
                      documentMutationLoading
                    }
                    placeholder="Example: Birth Certificate"
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-slate-800">
                    Requirement
                  </span>

                  <select
                    value={
                      form.requirement_status
                    }
                    onChange={updateField(
                      "requirement_status",
                    )}
                    disabled={
                      documentMutationLoading
                    }
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {REQUIREMENT_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <div />

                <label className="block">
                  <span className="text-sm font-black text-slate-800">
                    Issue date
                  </span>

                  <input
                    type="date"
                    value={
                      form.issued_on
                    }
                    onChange={updateField(
                      "issued_on",
                    )}
                    disabled={
                      documentMutationLoading
                    }
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-slate-800">
                    Expiry date
                  </span>

                  <input
                    type="date"
                    value={
                      form.expires_on
                    }
                    onChange={updateField(
                      "expires_on",
                    )}
                    disabled={
                      documentMutationLoading
                    }
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-sm font-black text-slate-800">
                    Notes
                  </span>

                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={updateField(
                      "notes",
                    )}
                    disabled={
                      documentMutationLoading
                    }
                    placeholder="Add internal context about this document."
                    className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
              </div>

              {visibleError && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      size={19}
                      className="mt-0.5 shrink-0 text-red-700"
                    />

                    <div>
                      <p className="font-black text-red-800">
                        Document upload
                        failed
                      </p>

                      <p className="mt-1 text-sm font-semibold leading-6 text-red-700">
                        {visibleError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {uploadSucceeded && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      size={19}
                      className="mt-0.5 shrink-0 text-emerald-700"
                    />

                    <div>
                      <p className="font-black text-emerald-800">
                        Document
                        uploaded
                      </p>

                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        The application
                        document was
                        uploaded
                        successfully.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {documentMutationLoading && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-black text-indigo-800">
                      Uploading document
                    </p>

                    <p className="text-sm font-black text-indigo-700">
                      {Math.min(
                        100,
                        Math.max(
                          0,
                          Number(
                            uploadProgress,
                          ) || 0,
                        ),
                      )}
                      %
                    </p>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-indigo-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            Number(
                              uploadProgress,
                            ) || 0,
                          ),
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-xs font-semibold leading-5 text-indigo-700">
                    Do not close this
                    window while the
                    file is being
                    uploaded.
                  </p>
                </div>
              )}
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-end sm:p-7">
              <button
                type="button"
                onClick={onClose}
                disabled={
                  documentMutationLoading
                }
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  documentMutationLoading ||
                  !canUploadApplicationDocuments
                }
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {documentMutationLoading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud
                      size={17}
                    />

                    Upload document
                  </>
                )}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </div>
  );
}