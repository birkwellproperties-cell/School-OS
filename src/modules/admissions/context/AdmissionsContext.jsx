import {
  createContext,
  useContext,
} from "react";

export const AdmissionsContext =
  createContext(null);

export function useAdmissionsContext() {
  const context =
    useContext(AdmissionsContext);

  if (!context) {
    throw new Error(
      "useAdmissionsContext must be used within an AdmissionsProvider.",
    );
  }

  return context;
}
