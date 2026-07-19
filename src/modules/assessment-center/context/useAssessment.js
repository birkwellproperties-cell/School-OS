import {
  useAssessmentContext,
} from "./AssessmentContext";

export function useAssessment() {
  return useAssessmentContext();
}

export default useAssessment;