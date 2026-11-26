
import { QUESTION_TYPE_OPTIONS } from "./questionSchema";

// Lấy tên dạng câu hỏi
export const getQuestionTypeLabel = (type) => {
  return (
    QUESTION_TYPE_OPTIONS.find((item) => item.value === type)?.label ||
    "Trắc nghiệm một đáp án"
  );
};

// Chuẩn hóa văn bản trả lời
export const normalizeAnswerText = (value) => {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("vi");
};

// Kiểm tra hai câu trả lời văn bản có giống nhau không
export const isSameAnswerText = (first, second) => {
  return normalizeAnswerText(first) === normalizeAnswerText(second);
};

// Tạo trạng thái trả lời ban đầu theo dạng câu hỏi
export const createEmptyAnswer = (type) => {
  switch (type) {
    case "multiple":
      return [];

    case "true_false":
      return null;

    case "ordering":
      return [];

    case "fill_blank":
      return "";

    case "matching":
      return [];

    case "single":
    default:
      return null;
  }
};
