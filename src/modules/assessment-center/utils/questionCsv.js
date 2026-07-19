const QUESTION_CSV_HEADERS = Object.freeze([
  "question_number",
  "title",
  "question_type",
  "prompt",
  "prompt_format",
  "instructions",
  "learning_outcome",
  "explanation",
  "difficulty",
  "default_marks",
  "negative_marks",
  "allow_partial_credit",
  "status",
  "category_id",
  "subject_id",
  "topic_id",
]);

const REQUIRED_HEADERS = Object.freeze([
  "question_type",
  "prompt",
]);

const VALID_QUESTION_TYPES = Object.freeze([
  "multiple_choice",
  "multiple_select",
  "true_false",
  "short_answer",
  "long_answer",
  "essay",
  "matching",
  "fill_in_the_blank",
  "numeric",
]);

const VALID_PROMPT_FORMATS = Object.freeze([
  "plain_text",
  "html",
  "markdown",
]);

const VALID_DIFFICULTIES = Object.freeze([
  "easy",
  "medium",
  "hard",
]);

const VALID_STATUSES = Object.freeze([
  "draft",
  "active",
  "archived",
]);

function normalizeText(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}

function normalizeHeader(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function escapeCsvValue(value) {
  const normalized =
    value === undefined ||
    value === null
      ? ""
      : String(value);

  if (
    normalized.includes(",") ||
    normalized.includes('"') ||
    normalized.includes("\n") ||
    normalized.includes("\r")
  ) {
    return `"${normalized.replace(
      /"/g,
      '""',
    )}"`;
  }

  return normalized;
}

function parseBoolean(
  value,
  fallback = false,
) {
  const normalized =
    normalizeText(value).toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (
    [
      "true",
      "1",
      "yes",
      "y",
    ].includes(normalized)
  ) {
    return true;
  }

  if (
    [
      "false",
      "0",
      "no",
      "n",
    ].includes(normalized)
  ) {
    return false;
  }

  return fallback;
}

function parseNumber(
  value,
  fallback,
) {
  const normalized =
    normalizeText(value);

  if (!normalized) {
    return fallback;
  }

  const parsed =
    Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function parseCsvRows(csvText) {
  const text =
    String(csvText || "")
      .replace(/^\uFEFF/, "");

  const rows = [];
  let row = [];
  let field = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    const character =
      text[index];

    const nextCharacter =
      text[index + 1];

    if (insideQuotes) {
      if (
        character === '"' &&
        nextCharacter === '"'
      ) {
        field += '"';
        index += 1;
        continue;
      }

      if (character === '"') {
        insideQuotes = false;
        continue;
      }

      field += character;
      continue;
    }

    if (character === '"') {
      insideQuotes = true;
      continue;
    }

    if (character === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (
      character === "\n" ||
      character === "\r"
    ) {
      if (
        character === "\r" &&
        nextCharacter === "\n"
      ) {
        index += 1;
      }

      row.push(field);
      field = "";

      const hasContent =
        row.some(
          (value) =>
            normalizeText(value) !== "",
        );

      if (hasContent) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    field += character;
  }

  row.push(field);

  if (
    row.some(
      (value) =>
        normalizeText(value) !== "",
    )
  ) {
    rows.push(row);
  }

  return rows;
}

function createHeaderIndex(headers) {
  return headers.reduce(
    (
      accumulator,
      header,
      index,
    ) => {
      const normalized =
        normalizeHeader(header);

      if (normalized) {
        accumulator[normalized] =
          index;
      }

      return accumulator;
    },
    {},
  );
}

function readColumn(
  row,
  headerIndex,
  column,
) {
  const index =
    headerIndex[column];

  if (
    index === undefined ||
    index === null
  ) {
    return "";
  }

  return normalizeText(
    row[index],
  );
}

function createRowPayload(
  row,
  headerIndex,
) {
  return {
    question_number:
      readColumn(
        row,
        headerIndex,
        "question_number",
      ) || null,

    title:
      readColumn(
        row,
        headerIndex,
        "title",
      ) || null,

    question_type:
      readColumn(
        row,
        headerIndex,
        "question_type",
      ).toLowerCase(),

    prompt:
      readColumn(
        row,
        headerIndex,
        "prompt",
      ),

    prompt_format:
      readColumn(
        row,
        headerIndex,
        "prompt_format",
      ).toLowerCase() ||
      "plain_text",

    instructions:
      readColumn(
        row,
        headerIndex,
        "instructions",
      ) || null,

    learning_outcome:
      readColumn(
        row,
        headerIndex,
        "learning_outcome",
      ) || null,

    explanation:
      readColumn(
        row,
        headerIndex,
        "explanation",
      ) || null,

    difficulty:
      readColumn(
        row,
        headerIndex,
        "difficulty",
      ).toLowerCase() ||
      "medium",

    default_marks:
      parseNumber(
        readColumn(
          row,
          headerIndex,
          "default_marks",
        ),
        1,
      ),

    negative_marks:
      parseNumber(
        readColumn(
          row,
          headerIndex,
          "negative_marks",
        ),
        0,
      ),

    allow_partial_credit:
      parseBoolean(
        readColumn(
          row,
          headerIndex,
          "allow_partial_credit",
        ),
        false,
      ),

    status:
      readColumn(
        row,
        headerIndex,
        "status",
      ).toLowerCase() ||
      "draft",

    category_id:
      readColumn(
        row,
        headerIndex,
        "category_id",
      ) || null,

    subject_id:
      readColumn(
        row,
        headerIndex,
        "subject_id",
      ) || null,

    topic_id:
      readColumn(
        row,
        headerIndex,
        "topic_id",
      ) || null,
  };
}

function validateQuestionRow(
  question,
  rowNumber,
) {
  const errors = [];

  if (!question.question_type) {
    errors.push(
      "Question type is required.",
    );
  } else if (
    !VALID_QUESTION_TYPES.includes(
      question.question_type,
    )
  ) {
    errors.push(
      `Unknown question type "${question.question_type}".`,
    );
  }

  if (!question.prompt) {
    errors.push(
      "Question prompt is required.",
    );
  }

  if (
    !VALID_PROMPT_FORMATS.includes(
      question.prompt_format,
    )
  ) {
    errors.push(
      `Unknown prompt format "${question.prompt_format}".`,
    );
  }

  if (
    !VALID_DIFFICULTIES.includes(
      question.difficulty,
    )
  ) {
    errors.push(
      `Unknown difficulty "${question.difficulty}".`,
    );
  }

  if (
    !VALID_STATUSES.includes(
      question.status,
    )
  ) {
    errors.push(
      `Unknown status "${question.status}".`,
    );
  }

  if (
    !Number.isFinite(
      question.default_marks,
    ) ||
    question.default_marks < 0
  ) {
    errors.push(
      "Default marks must be zero or greater.",
    );
  }

  if (
    !Number.isFinite(
      question.negative_marks,
    ) ||
    question.negative_marks < 0
  ) {
    errors.push(
      "Negative marks must be zero or greater.",
    );
  }

  return errors.map(
    (message) => ({
      rowNumber,
      message,
    }),
  );
}

export function parseQuestionCsv(
  csvText,
) {
  const rows =
    parseCsvRows(csvText);

  if (rows.length === 0) {
    return {
      questions: [],
      errors: [
        {
          rowNumber: 1,
          message:
            "The CSV file is empty.",
        },
      ],
      headers: [],
    };
  }

  const headers =
    rows[0].map(
      normalizeHeader,
    );

  const headerIndex =
    createHeaderIndex(headers);

  const missingHeaders =
    REQUIRED_HEADERS.filter(
      (header) =>
        headerIndex[header] ===
        undefined,
    );

  if (
    missingHeaders.length > 0
  ) {
    return {
      questions: [],
      errors: [
        {
          rowNumber: 1,
          message:
            `Missing required column${
              missingHeaders.length > 1
                ? "s"
                : ""
            }: ${missingHeaders.join(
              ", ",
            )}.`,
        },
      ],
      headers,
    };
  }

  const questions = [];
  const errors = [];
  const seenQuestionNumbers =
    new Set();

  rows
    .slice(1)
    .forEach(
      (
        row,
        index,
      ) => {
        const rowNumber =
          index + 2;

        const question =
          createRowPayload(
            row,
            headerIndex,
          );

        const rowErrors =
          validateQuestionRow(
            question,
            rowNumber,
          );

        if (
          question.question_number
        ) {
          const normalizedNumber =
            question.question_number
              .toLowerCase();

          if (
            seenQuestionNumbers.has(
              normalizedNumber,
            )
          ) {
            rowErrors.push({
              rowNumber,
              message:
                `Duplicate question number "${question.question_number}" in the CSV file.`,
            });
          } else {
            seenQuestionNumbers.add(
              normalizedNumber,
            );
          }
        }

        if (
          rowErrors.length > 0
        ) {
          errors.push(
            ...rowErrors,
          );
          return;
        }

        questions.push({
          ...question,
          import_row_number:
            rowNumber,
        });
      },
    );

  return {
    questions,
    errors,
    headers,
  };
}

export async function readQuestionCsvFile(
  file,
) {
  if (!(file instanceof File)) {
    throw new Error(
      "A CSV file is required.",
    );
  }

  const fileName =
    normalizeText(
      file.name,
    ).toLowerCase();

  if (
    !fileName.endsWith(".csv")
  ) {
    throw new Error(
      "Only CSV files are supported.",
    );
  }

  const text =
    await file.text();

  return parseQuestionCsv(
    text,
  );
}

export function createQuestionTemplateCsv() {
  const example = {
    question_number:
      "Q-0001",

    title:
      "Example question",

    question_type:
      "multiple_choice",

    prompt:
      "What is 2 + 2?",

    prompt_format:
      "plain_text",

    instructions:
      "Select one answer.",

    learning_outcome:
      "Basic addition",

    explanation:
      "Two plus two equals four.",

    difficulty:
      "easy",

    default_marks:
      1,

    negative_marks:
      0,

    allow_partial_credit:
      false,

    status:
      "draft",

    category_id:
      "",

    subject_id:
      "",

    topic_id:
      "",
  };

  return [
    QUESTION_CSV_HEADERS.join(
      ",",
    ),

    QUESTION_CSV_HEADERS
      .map(
        (header) =>
          escapeCsvValue(
            example[header],
          ),
      )
      .join(","),
  ].join("\r\n");
}

export function exportQuestionsToCsv(
  questions = [],
) {
  const records =
    Array.isArray(questions)
      ? questions
      : [];

  const lines = [
    QUESTION_CSV_HEADERS.join(
      ",",
    ),
  ];

  records.forEach(
    (question) => {
      lines.push(
        QUESTION_CSV_HEADERS
          .map(
            (header) =>
              escapeCsvValue(
                question?.[header],
              ),
          )
          .join(","),
      );
    },
  );

  return lines.join("\r\n");
}

export function downloadCsv(
  csvText,
  filename,
) {
  const blob =
    new Blob(
      [
        "\uFEFF",
        csvText,
      ],
      {
        type:
          "text/csv;charset=utf-8",
      },
    );

  const url =
    URL.createObjectURL(
      blob,
    );

  const anchor =
    document.createElement(
      "a",
    );

  anchor.href = url;
  anchor.download =
    normalizeText(filename) ||
    "assessment-questions.csv";

  document.body.appendChild(
    anchor,
  );

  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(
    url,
  );
}

export function downloadQuestionTemplateCsv() {
  downloadCsv(
    createQuestionTemplateCsv(),
    "assessment-question-import-template.csv",
  );
}

export function downloadQuestionExportCsv(
  questions,
  filename =
    "assessment-questions.csv",
) {
  downloadCsv(
    exportQuestionsToCsv(
      questions,
    ),
    filename,
  );
}

export {
  QUESTION_CSV_HEADERS,
  REQUIRED_HEADERS,
  VALID_DIFFICULTIES,
  VALID_PROMPT_FORMATS,
  VALID_QUESTION_TYPES,
  VALID_STATUSES,
};