import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const EMPTY_DOCUMENT_REQUIREMENTS =
  Object.freeze({
    items: [],
    total: 0,
    page: 1,
    pageSize: 100,
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
      ...EMPTY_DOCUMENT_REQUIREMENTS,
    };
  }

  if (Array.isArray(result)) {
    return {
      items: result,
      total: result.length,
      page: 1,
      pageSize: 100,
      pageCount:
        result.length > 0
          ? 1
          : 0,
    };
  }

  const items =
    Array.isArray(result.items)
      ? result.items
      : [];

  return {
    items,

    total:
      Number(result.total) ||
      items.length,

    page:
      Number(result.page) ||
      1,

    pageSize:
      Number(result.pageSize) ||
      100,

    pageCount:
      Number(result.pageCount) ||
      (
        items.length > 0
          ? 1
          : 0
      ),
  };
}

export default function useApplicationDocumentRequirementState({
  service,

  workspaceReady,
  authorizationReady,

  canViewAdmissions,
  canCreateAdmissions,
  canEditAdmissions,

  selectedAdmissionCycleId,

  refreshDashboard,
}) {
  const requestRef =
    useRef(0);

  const mountedRef =
    useRef(false);

  const [
    documentRequirements,
    setDocumentRequirements,
  ] = useState(
    EMPTY_DOCUMENT_REQUIREMENTS,
  );

  const [
    selectedDocumentRequirementId,
    setSelectedDocumentRequirementId,
  ] = useState(null);

  const [
    documentRequirementsLoading,
    setDocumentRequirementsLoading,
  ] = useState(false);

  const [
    documentRequirementsError,
    setDocumentRequirementsError,
  ] = useState("");

  const [
    documentRequirementMutationLoading,
    setDocumentRequirementMutationLoading,
  ] = useState(false);

  const [
    documentRequirementMutationError,
    setDocumentRequirementMutationError,
  ] = useState("");

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, []);

  const selectedDocumentRequirement =
    useMemo(
      () =>
        documentRequirements.items.find(
          (requirement) =>
            requirement.id ===
            selectedDocumentRequirementId,
        ) || null,
      [
        documentRequirements.items,
        selectedDocumentRequirementId,
      ],
    );

  const activeDocumentRequirements =
    useMemo(
      () =>
        documentRequirements.items.filter(
          (requirement) =>
            requirement.is_active !==
              false &&
            !requirement.archived_at &&
            !requirement.deleted_at,
        ),
      [
        documentRequirements.items,
      ],
    );

  const requiredDocumentRequirements =
    useMemo(
      () =>
        activeDocumentRequirements.filter(
          (requirement) =>
            requirement
              .requirement_status ===
            "required",
        ),
      [
        activeDocumentRequirements,
      ],
    );

  const optionalDocumentRequirements =
    useMemo(
      () =>
        activeDocumentRequirements.filter(
          (requirement) =>
            requirement
              .requirement_status ===
            "optional",
        ),
      [
        activeDocumentRequirements,
      ],
    );

  const conditionalDocumentRequirements =
    useMemo(
      () =>
        activeDocumentRequirements.filter(
          (requirement) =>
            requirement
              .requirement_status ===
            "conditionally_required",
        ),
      [
        activeDocumentRequirements,
      ],
    );

  const canManageDocumentRequirements =
    Boolean(
      service &&
      workspaceReady &&
      authorizationReady &&
      selectedAdmissionCycleId &&
      (
        canCreateAdmissions ||
        canEditAdmissions
      ),
    );

  const resetDocumentRequirements =
    useCallback(() => {
      requestRef.current += 1;

      setDocumentRequirements(
        EMPTY_DOCUMENT_REQUIREMENTS,
      );

      setSelectedDocumentRequirementId(
        null,
      );

      setDocumentRequirementsLoading(
        false,
      );

      setDocumentRequirementsError("");

      setDocumentRequirementMutationLoading(
        false,
      );

      setDocumentRequirementMutationError(
        "",
      );
    }, []);

  const refreshDocumentRequirements =
    useCallback(async () => {
      if (
        !service ||
        !workspaceReady ||
        !authorizationReady ||
        !canViewAdmissions ||
        !selectedAdmissionCycleId
      ) {
        resetDocumentRequirements();

        return {
          ...EMPTY_DOCUMENT_REQUIREMENTS,
        };
      }

      const requestId =
        ++requestRef.current;

      setDocumentRequirementsLoading(
        true,
      );

      setDocumentRequirementsError("");

      try {
        const result =
          await service
            .getDocumentRequirements({
              admissionCycleId:
                selectedAdmissionCycleId,

              page: 1,
              pageSize: 100,
              sortBy: "display_order",
              ascending: true,
            });

        if (
          !mountedRef.current ||
          requestId !==
            requestRef.current
        ) {
          return {
            ...EMPTY_DOCUMENT_REQUIREMENTS,
          };
        }

        const normalizedResult =
          normalizePagedResult(
            result,
          );

        setDocumentRequirements(
          normalizedResult,
        );

        setSelectedDocumentRequirementId(
          (currentRequirementId) => {
            if (
              currentRequirementId &&
              normalizedResult.items.some(
                (requirement) =>
                  requirement.id ===
                  currentRequirementId,
              )
            ) {
              return currentRequirementId;
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
            ...EMPTY_DOCUMENT_REQUIREMENTS,
          };
        }

        setDocumentRequirements(
          EMPTY_DOCUMENT_REQUIREMENTS,
        );

        setSelectedDocumentRequirementId(
          null,
        );

        setDocumentRequirementsError(
          getErrorMessage(
            error,
            "Unable to load document requirements.",
          ),
        );

        return {
          ...EMPTY_DOCUMENT_REQUIREMENTS,
        };
      } finally {
        if (
          mountedRef.current &&
          requestId ===
            requestRef.current
        ) {
          setDocumentRequirementsLoading(
            false,
          );
        }
      }
    }, [
      service,
      workspaceReady,
      authorizationReady,
      canViewAdmissions,
      selectedAdmissionCycleId,
      resetDocumentRequirements,
    ]);

  const createDocumentRequirement =
    useCallback(
      async (payload = {}) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (
          !canManageDocumentRequirements
        ) {
          throw new Error(
            "You do not have permission to create document requirements.",
          );
        }

        setDocumentRequirementMutationLoading(
          true,
        );

        setDocumentRequirementMutationError(
          "",
        );

        try {
          const createdRequirement =
            await service
              .createDocumentRequirement({
                ...payload,

                admission_cycle_id:
                  selectedAdmissionCycleId,
              });

          await Promise.all([
            refreshDocumentRequirements(),

            typeof refreshDashboard ===
              "function"
              ? refreshDashboard()
              : Promise.resolve(),
          ]);

          if (
            mountedRef.current &&
            createdRequirement?.id
          ) {
            setSelectedDocumentRequirementId(
              createdRequirement.id,
            );
          }

          return createdRequirement;
        } catch (error) {
          if (mountedRef.current) {
            setDocumentRequirementMutationError(
              getErrorMessage(
                error,
                "Unable to create the document requirement.",
              ),
            );
          }

          throw error;
        } finally {
          if (mountedRef.current) {
            setDocumentRequirementMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canManageDocumentRequirements,
        selectedAdmissionCycleId,
        refreshDocumentRequirements,
        refreshDashboard,
      ],
    );

  const updateDocumentRequirement =
    useCallback(
      async (
        requirementId,
        updates = {},
      ) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (
          !canManageDocumentRequirements
        ) {
          throw new Error(
            "You do not have permission to update document requirements.",
          );
        }

        if (!requirementId) {
          throw new Error(
            "Document requirement id is required.",
          );
        }

        setDocumentRequirementMutationLoading(
          true,
        );

        setDocumentRequirementMutationError(
          "",
        );

        try {
          const updatedRequirement =
            await service
              .updateDocumentRequirement(
                requirementId,
                updates,
              );

          await Promise.all([
            refreshDocumentRequirements(),

            typeof refreshDashboard ===
              "function"
              ? refreshDashboard()
              : Promise.resolve(),
          ]);

          if (mountedRef.current) {
            setSelectedDocumentRequirementId(
              updatedRequirement?.id ||
                requirementId,
            );
          }

          return updatedRequirement;
        } catch (error) {
          if (mountedRef.current) {
            setDocumentRequirementMutationError(
              getErrorMessage(
                error,
                "Unable to update the document requirement.",
              ),
            );
          }

          throw error;
        } finally {
          if (mountedRef.current) {
            setDocumentRequirementMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canManageDocumentRequirements,
        refreshDocumentRequirements,
        refreshDashboard,
      ],
    );

  const archiveDocumentRequirement =
    useCallback(
      async (requirementId) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (
          !canManageDocumentRequirements
        ) {
          throw new Error(
            "You do not have permission to archive document requirements.",
          );
        }

        if (!requirementId) {
          throw new Error(
            "Document requirement id is required.",
          );
        }

        setDocumentRequirementMutationLoading(
          true,
        );

        setDocumentRequirementMutationError(
          "",
        );

        try {
          const archivedRequirement =
            await service
              .archiveDocumentRequirement(
                requirementId,
              );

          await Promise.all([
            refreshDocumentRequirements(),

            typeof refreshDashboard ===
              "function"
              ? refreshDashboard()
              : Promise.resolve(),
          ]);

          return archivedRequirement;
        } catch (error) {
          if (mountedRef.current) {
            setDocumentRequirementMutationError(
              getErrorMessage(
                error,
                "Unable to archive the document requirement.",
              ),
            );
          }

          throw error;
        } finally {
          if (mountedRef.current) {
            setDocumentRequirementMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canManageDocumentRequirements,
        refreshDocumentRequirements,
        refreshDashboard,
      ],
    );

  const deleteDocumentRequirement =
    useCallback(
      async (requirementId) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (
          !canManageDocumentRequirements
        ) {
          throw new Error(
            "You do not have permission to delete document requirements.",
          );
        }

        if (!requirementId) {
          throw new Error(
            "Document requirement id is required.",
          );
        }

        setDocumentRequirementMutationLoading(
          true,
        );

        setDocumentRequirementMutationError(
          "",
        );

        try {
          const deletedRequirement =
            await service
              .deleteDocumentRequirement(
                requirementId,
              );

          if (mountedRef.current) {
            setSelectedDocumentRequirementId(
              null,
            );
          }

          await Promise.all([
            refreshDocumentRequirements(),

            typeof refreshDashboard ===
              "function"
              ? refreshDashboard()
              : Promise.resolve(),
          ]);

          return deletedRequirement;
        } catch (error) {
          if (mountedRef.current) {
            setDocumentRequirementMutationError(
              getErrorMessage(
                error,
                "Unable to delete the document requirement.",
              ),
            );
          }

          throw error;
        } finally {
          if (mountedRef.current) {
            setDocumentRequirementMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canManageDocumentRequirements,
        refreshDocumentRequirements,
        refreshDashboard,
      ],
    );

  const clearDocumentRequirementMutationError =
    useCallback(() => {
      setDocumentRequirementMutationError(
        "",
      );
    }, []);

  useEffect(() => {
    void refreshDocumentRequirements();
  }, [
    refreshDocumentRequirements,
  ]);

  return {
    documentRequirements,
    documentRequirementItems:
      documentRequirements.items,

    activeDocumentRequirements,
    requiredDocumentRequirements,
    optionalDocumentRequirements,
    conditionalDocumentRequirements,

    selectedDocumentRequirementId,
    selectedDocumentRequirement,

    documentRequirementsLoading,
    documentRequirementsError,

    documentRequirementMutationLoading,
    documentRequirementMutationError,

    canManageDocumentRequirements,

    setSelectedDocumentRequirementId,

    refreshDocumentRequirements,
    resetDocumentRequirements,

    createDocumentRequirement,
    updateDocumentRequirement,
    archiveDocumentRequirement,
    deleteDocumentRequirement,

    clearDocumentRequirementMutationError,
  };
}