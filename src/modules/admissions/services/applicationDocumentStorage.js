import {
  supabase,
} from "../../../services/supabase";

export const ADMISSION_DOCUMENT_BUCKET =
  "admission-documents";

export const MAX_APPLICATION_DOCUMENT_SIZE =
  10 * 1024 * 1024;

export const ALLOWED_APPLICATION_DOCUMENT_TYPES =
  Object.freeze([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ]);

function requireValue(
  value,
  label,
) {
  if (!value) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return value;
}

function normalizeIdentifier(
  value,
  label,
) {
  return String(
    requireValue(
      value,
      label,
    ),
  ).trim();
}

export function sanitizeApplicationDocumentFileName(
  fileName,
) {
  const normalized = String(
    fileName || "document",
  )
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-zA-Z0-9._-]+/g,
      "-",
    )
    .replace(
      /-+/g,
      "-",
    )
    .replace(
      /^[-.]+|[-.]+$/g,
      "",
    )
    .toLowerCase();

  return (
    normalized ||
    "document"
  );
}

export function validateApplicationDocumentFile(
  file,
) {
  if (!file) {
    throw new Error(
      "Select a document to upload.",
    );
  }

  if (
    typeof File !==
      "undefined" &&
    !(file instanceof File)
  ) {
    throw new Error(
      "The selected upload is not a valid file.",
    );
  }

  if (
    !ALLOWED_APPLICATION_DOCUMENT_TYPES
      .includes(file.type)
  ) {
    throw new Error(
      "Only PDF, DOCX, JPG, and PNG files are supported.",
    );
  }

  if (
    !Number.isFinite(file.size) ||
    file.size <= 0
  ) {
    throw new Error(
      "The selected document is empty.",
    );
  }

  if (
    file.size >
    MAX_APPLICATION_DOCUMENT_SIZE
  ) {
    throw new Error(
      "The selected document exceeds the 10 MB limit.",
    );
  }

  return file;
}

export function buildApplicationDocumentPath({
  organizationId,
  schoolId,
  campusId,
  applicationId,
  fileName,
}) {
  const organization =
    normalizeIdentifier(
      organizationId,
      "Organization id",
    );

  const school =
    normalizeIdentifier(
      schoolId,
      "School id",
    );

  const application =
    normalizeIdentifier(
      applicationId,
      "Application id",
    );

  const campus =
    campusId
      ? normalizeIdentifier(
          campusId,
          "Campus id",
        )
      : "school";

  const safeFileName =
    sanitizeApplicationDocumentFileName(
      fileName,
    );

  const uniquePrefix = [
    Date.now(),
    globalThis.crypto
      ?.randomUUID?.() ||
      Math.random()
        .toString(36)
        .slice(2, 12),
  ].join("-");

  return [
    organization,
    school,
    campus,
    application,
    `${uniquePrefix}-${safeFileName}`,
  ].join("/");
}

export async function uploadApplicationDocumentFile({
  file,
  organizationId,
  schoolId,
  campusId,
  applicationId,
}) {
  validateApplicationDocumentFile(
    file,
  );

  const storagePath =
    buildApplicationDocumentPath({
      organizationId,
      schoolId,
      campusId,
      applicationId,
      fileName: file.name,
    });

  const {
    data,
    error,
  } = await supabase.storage
    .from(
      ADMISSION_DOCUMENT_BUCKET,
    )
    .upload(
      storagePath,
      file,
      {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      },
    );

  if (error) {
    throw new Error(
      error.message ||
        "Unable to upload the application document.",
    );
  }

  return {
    bucket:
      ADMISSION_DOCUMENT_BUCKET,

    path:
      data?.path ||
      storagePath,

    fileName:
      file.name,

    mimeType:
      file.type,

    fileSizeBytes:
      file.size,
  };
}

export async function removeApplicationDocumentFile({
  bucket =
    ADMISSION_DOCUMENT_BUCKET,
  path,
}) {
  requireValue(
    bucket,
    "Storage bucket",
  );

  requireValue(
    path,
    "Storage path",
  );

  const {
    data,
    error,
  } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(
      error.message ||
        "Unable to remove the application document.",
    );
  }

  return data || [];
}

export async function createApplicationDocumentSignedUrl({
  bucket =
    ADMISSION_DOCUMENT_BUCKET,
  path,
  expiresIn = 300,
}) {
  requireValue(
    bucket,
    "Storage bucket",
  );

  requireValue(
    path,
    "Storage path",
  );

  const normalizedExpiresIn =
    Number(expiresIn);

  if (
    !Number.isInteger(
      normalizedExpiresIn,
    ) ||
    normalizedExpiresIn <= 0
  ) {
    throw new Error(
      "Signed URL duration must be a positive whole number.",
    );
  }

  const {
    data,
    error,
  } = await supabase.storage
    .from(bucket)
    .createSignedUrl(
      path,
      normalizedExpiresIn,
    );

  if (error) {
    throw new Error(
      error.message ||
        "Unable to create a secure document link.",
    );
  }

  if (!data?.signedUrl) {
    throw new Error(
      "The secure document link was not returned.",
    );
  }

  return data.signedUrl;
}

export async function downloadApplicationDocumentFile({
  bucket =
    ADMISSION_DOCUMENT_BUCKET,
  path,
}) {
  requireValue(
    bucket,
    "Storage bucket",
  );

  requireValue(
    path,
    "Storage path",
  );

  const {
    data,
    error,
  } = await supabase.storage
    .from(bucket)
    .download(path);

  if (error) {
    throw new Error(
      error.message ||
        "Unable to download the application document.",
    );
  }

  if (!data) {
    throw new Error(
      "The application document file was not returned.",
    );
  }

  return data;
}