import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  removeApplicationDocumentFile,
  uploadApplicationDocumentFile,
} from "../services";

const EMPTY_APPLICATION_DOCUMENTS =
  Object.freeze({
    items: [],
    total: 0,
    page: 1,
    pageSize: 50,
    pageCount: 0,
  });

function getErrorMessage(
  error,
  fallbackMessage,
) {
  return (
    error?.message ||
    fallbackMessage
  );
}

function normalizePagedResult(
  result,
) {
  if (!result) {
    return {
      ...EMPTY_APPLICATION_DOCUMENTS,
    };
  }

  if (Array.isArray(result)) {
    return {
      items: result,
      total: result.length,
      page: 1,
      pageSize: 50,
      pageCount:
        result.length > 0
          ? 1
          : 0,
    };
  }

  return {
    items:
      Array.isArray(result.items)
        ? result.items
        : [],

    total:
      Number(result.total) ||
      0,

    page:
      Number(result.page) ||
      1,

    pageSize:
      Number(result.pageSize) ||
      50,

    pageCount:
      Number(result.pageCount) ||
      0,
  };
}

export default function useApplicationDocumentState({
  service,

  workspaceReady,
  authorizationReady,

  canViewAdmissions,
  canCreateAdmissions,
  canEditAdmissions,

  organizationId,
  schoolId,
  campusId,

  selectedApplicationId,
  selectedApplication,

  refreshDashboard,
}) {
  const requestRef =
    useRef(0);

  const mountedRef =
    useRef(false);

  const [
    applicationDocuments,
    setApplicationDocuments,
  ] = useState(
    EMPTY_APPLICATION_DOCUMENTS,
  );

  const [
    selectedApplicationDocumentId,
    setSelectedApplicationDocumentId,
  ] = useState(null);

  const [
    applicationDocumentsLoading,
    setApplicationDocumentsLoading,
  ] = useState(false);

  const [
    applicationDocumentsError,
    setApplicationDocumentsError,
  ] = useState("");

  const [
    documentMutationLoading,
    setDocumentMutationLoading,
  ] = useState(false);

  const [
    documentMutationError,
    setDocumentMutationError,
  ] = useState("");

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, []);

  const selectedApplicationDocument =
    useMemo(
      () =>
        applicationDocuments.items.find(
          (document) =>
            document.id ===
            selectedApplicationDocumentId,
        ) || null,
      [
        applicationDocuments.items,
        selectedApplicationDocumentId,
      ],
    );

  const canUploadApplicationDocuments =
    Boolean(
      service &&
      workspaceReady &&
      authorizationReady &&
      selectedApplicationId &&
      organizationId &&
      schoolId &&
      (
        canCreateAdmissions ||
        canEditAdmissions
      ),
    );

  const resetApplicationDocuments =
    useCallback(() => {
      requestRef.current += 1;

      setApplicationDocuments(
        EMPTY_APPLICATION_DOCUMENTS,
      );

      setSelectedApplicationDocumentId(
        null,
      );

      setApplicationDocumentsLoading(
        false,
      );

      setApplicationDocumentsError("");

      setDocumentMutationLoading(
        false,
      );

      setDocumentMutationError("");

      setUploadProgress(0);
    }, []);

  const refreshApplicationDocuments =
    useCallback(async () => {
      if (
        !service ||
        !workspaceReady ||
        !authorizationReady ||
        !canViewAdmissions ||
        !selectedApplicationId
      ) {
        resetApplicationDocuments();

        return {
          ...EMPTY_APPLICATION_DOCUMENTS,
        };
      }

      const requestId =
        ++requestRef.current;

      setApplicationDocumentsLoading(
        true,
      );

      setApplicationDocumentsError("");

      try {
        const result =
          await service
            .getApplicationDocuments(
              selectedApplicationId,
              {
                page: 1,
                pageSize: 50,
                sortBy: "created_at",
                ascending: true,
              },
            );

        if (
          !mountedRef.current ||
          requestId !==
            requestRef.current
        ) {
          return {
            ...EMPTY_APPLICATION_DOCUMENTS,
          };
        }

        const normalizedResult =
          normalizePagedResult(
            result,
          );

        setApplicationDocuments(
          normalizedResult,
        );

        setSelectedApplicationDocumentId(
          (currentDocumentId) => {
            if (
              currentDocumentId &&
              normalizedResult.items.some(
                (document) =>
                  document.id ===
                  currentDocumentId,
              )
            ) {
              return currentDocumentId;
            }

            return (
              normalizedResult.items[0]
                ?.id || null
            );
          },
        );

        return normalizedResult;
      } catch (error) {
        if (
          !mountedRef.current ||
          requestId !==
            requestRef.current
        ) {
          return {
            ...EMPTY_APPLICATION_DOCUMENTS,
          };
        }

        setApplicationDocuments(
          EMPTY_APPLICATION_DOCUMENTS,
        );

        setSelectedApplicationDocumentId(
          null,
        );

        setApplicationDocumentsError(
          getErrorMessage(
            error,
            "Unable to load application documents.",
          ),
        );

        return {
          ...EMPTY_APPLICATION_DOCUMENTS,
        };
      } finally {
        if (
          mountedRef.current &&
          requestId ===
            requestRef.current
        ) {
          setApplicationDocumentsLoading(
            false,
          );
        }
      }
    }, [
      service,
      workspaceReady,
      authorizationReady,
      canViewAdmissions,
      selectedApplicationId,
      resetApplicationDocuments,
    ]);

  const uploadApplicationDocument =
    useCallback(
      async ({
        file,
        documentType,
        documentLabel,
        requirementStatus =
          "required",
        issuedOn = null,
        expiresOn = null,
        notes = null,
        metadata = {},
      } = {}) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (
          !workspaceReady ||
          !authorizationReady
        ) {
          throw new Error(
            "The Admissions workspace is not ready.",
          );
        }

        if (
          !canCreateAdmissions &&
          !canEditAdmissions
        ) {
          throw new Error(
            "You do not have permission to upload application documents.",
          );
        }

        if (!selectedApplicationId) {
          throw new Error(
            "Select an application before uploading a document.",
          );
        }

        if (!selectedApplication) {
          throw new Error(
            "The selected application could not be loaded.",
          );
        }

        if (!organizationId) {
          throw new Error(
            "Organization scope is required.",
          );
        }

        if (!schoolId) {
          throw new Error(
            "School scope is required.",
          );
        }

        if (!file) {
          throw new Error(
            "Select a document to upload.",
          );
        }

        if (
          !String(
            documentType || "",
          ).trim()
        ) {
          throw new Error(
            "Document type is required.",
          );
        }

        if (
          !String(
            documentLabel || "",
          ).trim()
        ) {
          throw new Error(
            "Document label is required.",
          );
        }

        setDocumentMutationLoading(
          true,
        );

        setDocumentMutationError("");

        setUploadProgress(10);

        let uploadedFile = null;

        try {
          uploadedFile =
            await uploadApplicationDocumentFile({
              file,
              organizationId,
              schoolId,
              campusId,
              applicationId:
                selectedApplicationId,
            });

          if (
            mountedRef.current
          ) {
            setUploadProgress(65);
          }

          let createdDocument;

          try {
            createdDocument =
              await service
                .createApplicationDocument(
                  selectedApplicationId,
                  {
                    document_type:
                      String(
                        documentType,
                      ).trim(),

                    document_label:
                      String(
                        documentLabel,
                      ).trim(),

                    requirement_status:
                      requirementStatus,

                    status:
                      "uploaded",

                    file_name:
                      uploadedFile
                        .fileName,

                    storage_bucket:
                      uploadedFile
                        .bucket,

                    storage_path:
                      uploadedFile
                        .path,

                    mime_type:
                      uploadedFile
                        .mimeType,

                    file_size_bytes:
                      uploadedFile
                        .fileSizeBytes,

                    uploaded_at:
                      new Date()
                        .toISOString(),

                    issued_on:
                      issuedOn || null,

                    expires_on:
                      expiresOn || null,

                    notes:
                      notes || null,

                    metadata:
                      metadata &&
                      typeof metadata ===
                        "object" &&
                      !Array.isArray(
                        metadata,
                      )
                        ? metadata
                        : {},
                  },
                );
          } catch (
            metadataError
          ) {
            try {
              await removeApplicationDocumentFile({
                bucket:
                  uploadedFile.bucket,

                path:
                  uploadedFile.path,
              });
            } catch (
              cleanupError
            ) {
              console.error(
                "Unable to remove the uploaded document after metadata creation failed.",
                cleanupError,
              );
            }

            throw metadataError;
          }

          if (
            mountedRef.current
          ) {
            setUploadProgress(90);
          }

          await Promise.all([
            refreshApplicationDocuments(),

            typeof refreshDashboard ===
              "function"
              ? refreshDashboard()
              : Promise.resolve(),
          ]);

          if (
            mountedRef.current
          ) {
            setSelectedApplicationDocumentId(
              createdDocument?.id ||
                null,
            );

            setUploadProgress(100);
          }

          return createdDocument;
        } catch (error) {
          if (
            mountedRef.current
          ) {
            setDocumentMutationError(
              getErrorMessage(
                error,
                "Unable to upload the application document.",
              ),
            );
          }

          throw error;
        } finally {
          if (
            mountedRef.current
          ) {
            setDocumentMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        workspaceReady,
        authorizationReady,

        canCreateAdmissions,
        canEditAdmissions,

        organizationId,
        schoolId,
        campusId,

        selectedApplicationId,
        selectedApplication,

        refreshApplicationDocuments,
        refreshDashboard,
      ],
    );

  const selectApplicationDocument =
    useCallback(
      (documentOrId) => {
        if (!documentOrId) {
          setSelectedApplicationDocumentId(
            null,
          );

          return;
        }

        if (
          typeof documentOrId ===
          "string"
        ) {
          setSelectedApplicationDocumentId(
            documentOrId,
          );

          return;
        }

        setSelectedApplicationDocumentId(
          documentOrId.id || null,
        );
      },
      [],
    );

  const clearApplicationDocumentsError =
    useCallback(() => {
      setApplicationDocumentsError("");
    }, []);

  const clearDocumentMutationError =
    useCallback(() => {
      setDocumentMutationError("");
    }, []);

  const resetUploadProgress =
    useCallback(() => {
      if (
        !documentMutationLoading
      ) {
        setUploadProgress(0);
      }
    }, [
      documentMutationLoading,
    ]);

  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAdmissions ||
      !selectedApplicationId
    ) {
      resetApplicationDocuments();
      return;
    }

    refreshApplicationDocuments();
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAdmissions,
    selectedApplicationId,
    refreshApplicationDocuments,
    resetApplicationDocuments,
  ]);

  return useMemo(
    () => ({
      applicationDocuments,

      selectedApplicationDocumentId,
      selectedApplicationDocument,

      applicationDocumentsLoading,
      applicationDocumentsError,

      documentMutationLoading,
      documentMutationError,

      uploadProgress,

      canUploadApplicationDocuments,

      refreshApplicationDocuments,
      resetApplicationDocuments,

      uploadApplicationDocument,

      selectApplicationDocument,

      clearApplicationDocumentsError,
      clearDocumentMutationError,

      resetUploadProgress,
    }),
    [
      applicationDocuments,

      selectedApplicationDocumentId,
      selectedApplicationDocument,

      applicationDocumentsLoading,
      applicationDocumentsError,

      documentMutationLoading,
      documentMutationError,

      uploadProgress,

      canUploadApplicationDocuments,

      refreshApplicationDocuments,
      resetApplicationDocuments,

      uploadApplicationDocument,

      selectApplicationDocument,

      clearApplicationDocumentsError,
      clearDocumentMutationError,

      resetUploadProgress,
    ],
  );
}