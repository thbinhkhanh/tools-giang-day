
import { normalizeQuestion } from "./questionSchema";

export const validateQuestion = (rawQuestion) => {
  const question = normalizeQuestion(rawQuestion);

  if (!question.question.trim()) {
    return {
      valid: false,
      message: "Chưa nhập nội dung câu hỏi.",
    };
  }

  const filledOptions = question.options
    .map((option, index) => ({ option: option.trim(), index }))
    .filter((item) => item.option);

  switch (question.type) {
    case "single": {
      if (filledOptions.length < 2) {
        return {
          valid: false,
          message: "Cần nhập ít nhất 2 phương án.",
        };
      }

      if (!question.options[question.correctIndex]?.trim()) {
        return {
          valid: false,
          message: "Chưa chọn đáp án đúng.",
        };
      }

      break;
    }

    case "multiple": {
      if (filledOptions.length < 2) {
        return {
          valid: false,
          message: "Cần nhập ít nhất 2 phương án.",
        };
      }

      const validIndexes = new Set(
        filledOptions.map((item) => item.index)
      );

      if (
        question.correctIndexes.length === 0 ||
        question.correctIndexes.some((index) => !validIndexes.has(index))
      ) {
        return {
          valid: false,
          message: "Hãy chọn ít nhất một đáp án đúng hợp lệ.",
        };
      }

      if (
        new Set(question.correctIndexes).size !==
        question.correctIndexes.length
      ) {
        return {
          valid: false,
          message: "Đáp án đúng đang bị trùng.",
        };
      }

      break;
    }

    case "true_false": {
      if (typeof question.correctAnswer !== "boolean") {
        return {
          valid: false,
          message: "Chưa chọn đáp án Đúng hoặc Sai.",
        };
      }

      break;
    }

    case "ordering": {
      const expectedIndexes = filledOptions.map((item) => item.index);
      const order = question.correctOrder;

      if (expectedIndexes.length < 2) {
        return {
          valid: false,
          message: "Cần nhập ít nhất 2 nội dung cần sắp xếp.",
        };
      }

      if (
        order.length !== expectedIndexes.length ||
        new Set(order).size !== expectedIndexes.length ||
        expectedIndexes.some((index) => !order.includes(index))
      ) {
        return {
          valid: false,
          message: "Hãy thiết lập đầy đủ thứ tự đúng, không trùng lặp.",
        };
      }

      break;
    }

    case "fill_blank": {
      if (!question.acceptedAnswers.some((item) => item.trim())) {
        return {
          valid: false,
          message: "Cần nhập ít nhất một đáp án được chấp nhận.",
        };
      }

      break;
    }

    case "matching": {
      if (question.pairs.length < 2) {
        return {
          valid: false,
          message: "Cần có ít nhất 2 cặp nội dung.",
        };
      }

      if (
        question.pairs.some(
          (pair) => !pair.left.trim() || !pair.right.trim()
        )
      ) {
        return {
          valid: false,
          message: "Cần nhập đầy đủ cả hai vế của từng cặp.",
        };
      }

      break;
    }

    default:
      return {
        valid: false,
        message: "Dạng câu hỏi không hợp lệ.",
      };
  }

  return {
    valid: true,
    message: "",
    question,
  };
};

// Kiểm tra toàn bộ danh sách câu hỏi
export const validateQuestions = (questions = []) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return {
      valid: false,
      index: -1,
      message: "Danh sách câu hỏi đang trống.",
    };
  }

  for (let index = 0; index < questions.length; index++) {
    const result = validateQuestion(questions[index]);

    if (!result.valid) {
      return {
        valid: false,
        index,
        message: `Câu ${index + 1}: ${result.message}`,
      };
    }
  }

  return {
    valid: true,
    index: -1,
    message: "",
  };
};
