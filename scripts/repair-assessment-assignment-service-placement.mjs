import fs from "node:fs";

const servicePath =
  "./src/modules/assessment-center/services/AssessmentService.js";

let source =
  fs.readFileSync(
    servicePath,
    "utf8",
  );

const lineEnding =
  source.includes("\r\n")
    ? "\r\n"
    : "\n";

const assignmentStartMarker =
  [
    "  // ============================================================",
    "  // ASSESSMENT RUNTIME — ASSIGNMENTS",
    "  // ============================================================",
  ].join(
    lineEnding,
  );

const deleteMessage =
  '"Unable to delete the assessment assignment.",';

const classBoundaryMarker =
  [
    "",
    "}",
    "",
    "/*",
    " * Parts 1-4 complete:",
  ].join(
    lineEnding,
  );

const assignmentStartIndex =
  source.indexOf(
    assignmentStartMarker,
  );

if (
  assignmentStartIndex < 0
) {
  throw new Error(
    "The misplaced assessment assignment block was not found.",
  );
}

const deleteMessageIndex =
  source.indexOf(
    deleteMessage,
    assignmentStartIndex,
  );

if (
  deleteMessageIndex < 0
) {
  throw new Error(
    "The assignment delete-method ending was not found.",
  );
}

const methodClosingMarker =
  [
    "",
    "    );",
    "  }",
  ].join(
    lineEnding,
  );

const assignmentEndMarkerIndex =
  source.indexOf(
    methodClosingMarker,
    deleteMessageIndex,
  );

if (
  assignmentEndMarkerIndex < 0
) {
  throw new Error(
    "The end of the misplaced assignment block was not found.",
  );
}

const assignmentEndIndex =
  assignmentEndMarkerIndex +
  methodClosingMarker.length;

const assignmentBlock =
  source.slice(
    assignmentStartIndex,
    assignmentEndIndex,
  );

source =
  `${
    source.slice(
      0,
      assignmentStartIndex,
    )
  }${
    source.slice(
      assignmentEndIndex,
    )
  }`;

const classBoundaryIndex =
  source.lastIndexOf(
    classBoundaryMarker,
  );

if (
  classBoundaryIndex < 0
) {
  throw new Error(
    "The real AssessmentService class boundary was not found.",
  );
}

source =
  `${
    source.slice(
      0,
      classBoundaryIndex,
    )
  }${
    lineEnding
  }${
    assignmentBlock
  }${
    lineEnding
  }${
    source.slice(
      classBoundaryIndex,
    )
  }`;

fs.writeFileSync(
  servicePath,
  source,
  "utf8",
);

console.log(
  "Assessment assignment methods relocated successfully.",
);
