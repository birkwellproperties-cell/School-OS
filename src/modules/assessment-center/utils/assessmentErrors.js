function getRepositoryErrorCode(
  error,
) {
  return (
    error?.code ||
    error?.statusCode ||
    null
  );
}

export function createAssessmentRepositoryError({
  error,
  operation,
  table,
  fallbackMessage,
}) {
  const message =
    error?.message ||
    fallbackMessage ||
    "The assessment operation could not be completed.";

  const repositoryError =
    new Error(message);

  repositoryError.name =
    "AssessmentRepositoryError";

  repositoryError.code =
    getRepositoryErrorCode(
      error,
    );

  repositoryError.operation =
    operation || null;

  repositoryError.table =
    table || null;

  repositoryError.details =
    error?.details || null;

  repositoryError.hint =
    error?.hint || null;

  repositoryError.cause =
    error || null;

  return repositoryError;
}

export function getAssessmentErrorMessage(
  error,
  fallbackMessage =
    "The assessment operation could not be completed.",
) {
  return (
    error?.message ||
    fallbackMessage
  );
}