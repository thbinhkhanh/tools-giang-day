
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
export const createEmptyQuestion = (question = {}) => ({
  type: question.type || QUESTION_TYPES.SINGLE,

  question: String(question.question || ""),

  options: Array.from({ length: 4 }, (_, index) =>
    String(question.options?.[index] ?? "")
  ),

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

  acceptedAnswers: Array.isArray(question.acceptedAnswers)
    ? question.acceptedAnswers.map(String)
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
});

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
