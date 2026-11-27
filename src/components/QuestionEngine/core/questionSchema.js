
export const QUESTION_TYPES = {
  SINGLE: "single",
  MULTIPLE: "multiple",
  TRUE_FALSE: "true_false",
  ORDERING: "ordering",
  FILL_BLANK: "fill_blank",
  MATCHING: "matching",
};

export const QUESTION_TYPE_OPTIONS = [
  { value: "single", label: "Chọn 1 đáp án" },
  { value: "multiple", label: "Chọn nhiều đáp án" },
  { value: "true_false", label: "Đúng – Sai" },
  { value: "ordering", label: "Sắp xếp" },
  { value: "fill_blank", label: "Điền khuyết" },
  { value: "matching", label: "Nối cặp" },
];

// Tạo câu hỏi mới theo cấu trúc chuẩn
export const createEmptyQuestion = (question = {}) => {
  const rawAnswers = Array.isArray(question.acceptedAnswers)
    ? question.acceptedAnswers
    : [];

  // Chuyển dữ liệu cũ nếu trước đây đã lưu mảng lồng nhau
  const isOldMultiFormat = rawAnswers.some(Array.isArray);

  const firstAnswers = isOldMultiFormat
    ? Array.isArray(rawAnswers[0])
      ? rawAnswers[0]
      : []
    : rawAnswers;

  const oldExtraBlanks = isOldMultiFormat
    ? rawAnswers.slice(1).map((item) => ({
        acceptedAnswers: Array.isArray(item) ? item : [],
      }))
    : [];

  const blanks = Array.isArray(question.blanks)
    ? question.blanks
    : oldExtraBlanks;

  // Giữ nguyên số phương án hiện có.
  // Chỉ tạo 4 phương án mặc định khi tạo câu hỏi mới.
  const options =
    Array.isArray(question.options) && question.options.length > 0
      ? question.options.map((item) => String(item ?? ""))
      : ["", "", "", ""];

  return {
    type: question.type || QUESTION_TYPES.SINGLE,

    question: String(question.question || ""),

    options,

    correctIndex: Number(question.correctIndex ?? 0),

    correctIndexes: Array.isArray(question.correctIndexes)
      ? question.correctIndexes.map(Number)
      : [],

    correctAnswer:
      typeof question.correctAnswer === "boolean"
        ? question.correctAnswer
        : null,

    correctOrder: Array.isArray(question.correctOrder)
      ? question.correctOrder.map(Number)
      : [],

    // Đáp án ô đầu tiên: mảng một chiều
    acceptedAnswers: firstAnswers.map(String),

    // Các ô tiếp theo: mảng object, không lồng mảng
    blanks: blanks.map((blank) => ({
      acceptedAnswers: Array.isArray(blank?.acceptedAnswers)
        ? blank.acceptedAnswers.map(String)
        : [],
    })),

    // Các phương án nhiễu
    distractorWords: Array.isArray(question.distractorWords)
      ? question.distractorWords.map(String)
      : [],

    pairs: Array.isArray(question.pairs)
      ? question.pairs.map((pair) => ({
          left: String(pair?.left ?? ""),
          right: String(pair?.right ?? ""),
        }))
      : [
          { left: "", right: "" },
          { left: "", right: "" },
        ],
  };
};

// Chuẩn hóa câu hỏi khi đọc từ dữ liệu cũ hoặc mới
export const normalizeQuestion = (question = {}) => {
  const type = Object.values(QUESTION_TYPES).includes(question.type)
    ? question.type
    : QUESTION_TYPES.SINGLE;

  return {
    ...createEmptyQuestion(question),
    type,
  };
};

// Chuẩn hóa danh sách câu hỏi
export const normalizeQuestions = (questions = []) => {
  if (!Array.isArray(questions)) return [];

  return questions.map((question) =>
    normalizeQuestion(question)
  );
};
