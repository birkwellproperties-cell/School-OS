import {
  createContext,
  useContext,
} from "react";

export const AssessmentContext =
  createContext(null);

export function useAssessmentContext() {
  const context =
    useContext(
      AssessmentContext,
    );

  if (!context) {
    throw new Error(
      "useAssessmentContext must be used within an AssessmentProvider.",
    );
  }

  return context;
}

export default AssessmentContext;