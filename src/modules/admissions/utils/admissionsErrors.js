export class AdmissionsRepositoryError extends Error {
  constructor(
    message,
    {
      operation = "",
      table = "",
      cause = null,
      code = "",
      details = "",
      hint = "",
    } = {},
  ) {
    super(message);

    this.name = "AdmissionsRepositoryError";
    this.operation = operation;
    this.table = table;
    this.code = code;
    this.details = details;
    this.hint = hint;
    this.cause = cause;
  }
}

export function createAdmissionsRepositoryError({
  error,
  operation,
  table,
  fallbackMessage,
}) {
  return new AdmissionsRepositoryError(
    error?.message || fallbackMessage,
    {
      operation,
      table,
      cause: error || null,
      code: error?.code || "",
      details: error?.details || "",
      hint: error?.hint || "",
    },
  );
}
