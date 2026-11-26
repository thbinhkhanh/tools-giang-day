
import { normalizeQuestion } from "./questionSchema";
import { normalizeAnswerText } from "./questionUtils";

export const checkAnswer = (rawQuestion, answer) => {
  const question = normalizeQuestion(rawQuestion);

  switch (question.type) {
    // 1. Trắc nghiệm một đáp án
    case "single":
      return (
        Number.isInteger(answer) &&
        answer === question.correctIndex
      );

    // 2. Trắc nghiệm nhiều đáp án
    case "multiple": {
      if (!Array.isArray(answer)) return false;

      const selected = [...new Set(answer)].sort((a, b) => a - b);
      const correct = [...new Set(question.correctIndexes)].sort(
        (a, b) => a - b
      );

      return (
        selected.length === correct.length &&
        selected.every((value, index) => value === correct[index])
      );
    }

    // 3. Đúng / Sai
    case "true_false":
      return (
        typeof answer === "boolean" &&
        answer === question.correctAnswer
      );

    // 4. Sắp xếp thứ tự
    case "ordering":
      return (
        Array.isArray(answer) &&
        answer.length === question.correctOrder.length &&
        answer.every(
          (value, index) => value === question.correctOrder[index]
        )
      );

    // 5. Điền từ hoặc đáp án
    case "fill_blank": {
      const userAnswer = normalizeAnswerText(answer);

      if (!userAnswer) return false;

      return question.acceptedAnswers.some(
        (accepted) =>
          normalizeAnswerText(accepted) === userAnswer
      );
    }

    // 6. Nối cặp
    
    case "matching": {
    if (!Array.isArray(answer)) return false;

    // Chỉ kiểm tra những cặp có đủ nội dung
    const validPairs = question.pairs
        .map((pair, index) => ({
        pair,
        index,
        }))
        .filter(
        ({ pair }) =>
            pair &&
            String(pair.left ?? "").trim() !== "" &&
            String(pair.right ?? "").trim() !== ""
        );

    if (validPairs.length === 0) return false;

    // Tất cả các cặp hợp lệ phải được nối đúng
    const selected = validPairs.map(({ index }) => answer[index]);

    // Không được bỏ trống
    if (
        selected.some(
        (value) => !Number.isInteger(value)
        )
    ) {
        return false;
    }

    // Không được dùng một đáp án bên phải nhiều lần
    if (new Set(selected).size !== selected.length) {
        return false;
    }

    // So sánh với cặp đúng theo chỉ số ban đầu trong Firestore
    return validPairs.every(
        ({ index }) => answer[index] === index
    );
    }


    default:
      return false;
  }
};
