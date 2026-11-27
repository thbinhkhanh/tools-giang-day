
import React, { useState, useEffect } from "react";

import {
  Box,
  TextField,
  Typography,
  Paper,
  Divider,
  Chip,
} from "@mui/material";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ShuffleIcon from "@mui/icons-material/Shuffle";

export default function FillBlankQuestionEditor({ question, onChange }) {
  // State riêng cho nội dung câu hỏi
  const [questionText, setQuestionText] = useState(
    question?.question || ""
  );

  // State riêng cho phương án nhiễu
  const [distractorText, setDistractorText] = useState(
    Array.isArray(question?.distractorWords)
      ? question.distractorWords.join("\n")
      : ""
  );

  // Đồng bộ nội dung câu hỏi khi dữ liệu bên ngoài thay đổi
  useEffect(() => {
    setQuestionText(question?.question || "");
  }, [question?.question]);

  // Đồng bộ phương án nhiễu khi dữ liệu bên ngoài thay đổi
  const savedDistractorText = Array.isArray(question?.distractorWords)
    ? question.distractorWords.join("\n")
    : "";

  useEffect(() => {
    setDistractorText(savedDistractorText);
  }, [savedDistractorText]);

  // Đáp án đúng của chỗ trống đầu tiên
  const firstAnswers = Array.isArray(question?.acceptedAnswers)
    ? question.acceptedAnswers.map(String)
    : [];

  // Các chỗ trống tiếp theo
  const extraBlanks = Array.isArray(question?.blanks)
    ? question.blanks
    : [];

  // Đếm số chỗ trống theo ký hiệu [...]
  const blankCount = (
    questionText.match(/\[\.\.\.\]/g) || []
  ).length;

  // Danh sách đáp án đúng theo số chỗ trống
  const answersList = Array.from(
    { length: blankCount },
    (_, index) => {
      if (index === 0) return firstAnswers;

      const blank = extraBlanks[index - 1];

      return Array.isArray(blank?.acceptedAnswers)
        ? blank.acceptedAnswers.map(String)
        : [];
    }
  );

  // Các phương án nhiễu dùng để hiển thị thẻ
  const distractorWords = distractorText
    .split("\n")
    .map((word) => word.trim())
    .filter(Boolean);

  // Cập nhật danh sách đáp án đúng
  const updateAnswers = (newList) => {
    onChange({
      ...question,
      acceptedAnswers: newList[0] || [],
      blanks: newList.slice(1).map((answers) => ({
        acceptedAnswers: answers,
      })),
    });
  };

  // Thay đổi nội dung câu hỏi
  const handleQuestionChange = (value) => {
    setQuestionText(value);

    const newBlankCount = (
      value.match(/\[\.\.\.\]/g) || []
    ).length;

    // Giữ lại đáp án của các chỗ trống cũ
    const currentAnswers = [
      firstAnswers,
      ...extraBlanks.map((blank) =>
        Array.isArray(blank?.acceptedAnswers)
          ? blank.acceptedAnswers.map(String)
          : []
      ),
    ];

    // Tạo danh sách đáp án theo số chỗ trống mới
    const newAnswers = Array.from(
      { length: newBlankCount },
      (_, index) => currentAnswers[index] || []
    );

    onChange({
      ...question,
      question: value,
      acceptedAnswers: newAnswers[0] || [],
      blanks: newAnswers.slice(1).map((answers) => ({
        acceptedAnswers: answers,
      })),
      distractorWords: question?.distractorWords || [],
    });
  };

  // Nhập các đáp án được chấp nhận
  // Mỗi dòng là một đáp án, giữ nguyên khoảng trắng khi đang nhập
  const handleAnswerChange = (blankIndex, value) => {
    const newAnswersList = answersList.map((answers) => [...answers]);

    // Tách theo xuống dòng, KHÔNG trim để không mất khoảng trắng
    newAnswersList[blankIndex] = value.split("\n");

    updateAnswers(newAnswersList);
  };

  // Nhập phương án nhiễu
  const handleDistractorChange = (value) => {
    setDistractorText(value);

    // Giữ nguyên nội dung từng dòng
    const newDistractors = value.split("\n");

    onChange({
      ...question,
      distractorWords: newDistractors,
    });
  };

  return (
    <Box>
      {/* PHẦN ĐÁP ÁN ĐÚNG */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 1.5,
          borderRadius: 2,
          borderColor: "#bfdbfe",
          bgcolor: "#f8fbff",
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          mb={1}
        >
          <CheckCircleOutlineIcon
            sx={{ color: "#16a34a", fontSize: 20 }}
          />

          <Typography
            fontWeight={900}
            fontSize={13}
            color="#166534"
          >
            ĐÁP ÁN ĐÚNG
          </Typography>

          <Chip
            size="small"
            label={`${blankCount} chỗ trống`}
            sx={{
              ml: "auto",
              height: 23,
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "stretch",
            gap: 1,
          }}
        >
          {answersList.map((answers, index) => (
            <Paper
              key={index}
              variant="outlined"
              sx={{
                flex: "1 1 220px",
                minWidth: 200,
                maxWidth: 320,
                p: 1,
                borderRadius: 2,
                borderColor: "#dbe3ee",
                bgcolor: "#fff",
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={0.5}
              >
                <Typography
                  fontWeight={800}
                  fontSize={13}
                  color="#2563eb"
                >
                  CHỖ TRỐNG {index + 1}
                </Typography>

                <Typography
                  fontSize={10}
                  color="text.secondary"
                >
                  Đáp án đúng
                </Typography>
              </Box>

              <TextField
                fullWidth
                multiline
                minRows={1}
                maxRows={4}
                size="small"
                placeholder="Mỗi dòng một đáp án"
                value={answers.join("\n")}
                onChange={(e) =>
                  handleAnswerChange(index, e.target.value)
                }
                sx={{
                  "& .MuiInputBase-root": {
                    fontSize: 13,
                  },
                  "& .MuiInputBase-input": {
                    py: 0.6,
                    lineHeight: 1.5,
                  },
                }}
              />

              <Typography
                fontSize={11}
                color="text.secondary"
                sx={{ mt: 0.3 }}
              >
                Mỗi dòng là một cách trả lời đúng.
              </Typography>
            </Paper>
          ))}

          {blankCount === 0 && (
            <Typography
              fontSize={12}
              color="text.secondary"
              sx={{ py: 1 }}
            >
              Chưa có chỗ trống. Hãy nhập ký hiệu [...] trong nội dung câu hỏi.
            </Typography>
          )}
        </Box>
      </Paper>

      {/* PHẦN PHƯƠNG ÁN NHIỄU */}
      <Paper
        variant="outlined"
        sx={{
          p: 1,
          borderRadius: 2,
          borderColor: "#fed7aa",
          bgcolor: "#fffaf5",
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={0.75}
          mb={0.75}
        >
          <ShuffleIcon
            sx={{ color: "#ea580c", fontSize: 18 }}
          />

          <Typography
            fontWeight={900}
            fontSize={12}
            color="#c2410c"
          >
            PHƯƠNG ÁN NHIỄU
          </Typography>

          <Chip
            size="small"
            label={`${distractorWords.length} từ`}
            sx={{
              ml: "auto",
              height: 20,
              fontSize: 10,
              fontWeight: 700,
            }}
          />
        </Box>

        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          size="small"
          label="Nhập các từ gây nhiễu"
          placeholder={"Ví dụ:\nBàn phím\nChuột máy tính\nMàn hình"}
          value={distractorText}
          onChange={(e) =>
            handleDistractorChange(e.target.value)
          }
          helperText="Mỗi dòng là một thẻ từ không phải đáp án đúng."
          sx={{
            "& .MuiInputBase-root": {
              fontSize: 13,
            },
            "& .MuiInputBase-input": {
              py: 0.6,
              lineHeight: 1.5,
            },
            "& .MuiInputLabel-root": {
              fontSize: 13,
            },
            "& .MuiFormHelperText-root": {
              fontSize: 10,
              mt: 0.3,
              mx: 0,
            },
          }}
        />

        {distractorWords.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.5,
              mt: 0.75,
            }}
          >
            {distractorWords.map((word, index) => (
              <Chip
                key={`${word}-${index}`}
                label={word}
                size="small"
                sx={{
                  height: 23,
                  bgcolor: "#ffedd5",
                  color: "#9a3412",
                  fontWeight: 700,
                  fontSize: 11,
                }}
              />
            ))}
          </Box>
        )}
      </Paper>

      <Divider sx={{ my: 1.5 }} />
    </Box>
  );
}
