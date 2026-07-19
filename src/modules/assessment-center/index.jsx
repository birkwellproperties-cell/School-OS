import AssessmentCenter from "./AssessmentCenter";

import {
  AssessmentProvider,
} from "./context";

function AssessmentCenterModule() {
  return (
    <AssessmentProvider>
      <AssessmentCenter />
    </AssessmentProvider>
  );
}

export {
  AssessmentCenter,
  AssessmentCenterModule,
  AssessmentProvider,
};

export default AssessmentCenterModule;