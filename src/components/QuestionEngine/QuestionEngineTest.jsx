
import React, { useState } from "react";

import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
  Grid,
  LinearProgress,
  Alert,
} from "@mui/material";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { QuestionPlayer } from "./index";

const sampleQuestions = [
  {
    type: "single",
    question: "Thủ đô của Việt Nam là thành phố nào?",
    options: ["Hải Phòng", "Hà Nội", "Đà Nẵng", "Cần Thơ"],
    correctIndex: 1,
  },
  {
    type: "multiple",
    question: "Những số nào là số chẵn?",
    options: ["1", "2", "3", "4"],
    correctIndexes: [1, 3],
  },
  {
    type: "true_false",
    question: "Mặt trời mọc ở hướng Đông.",
    correctAnswer: true,
  },
  {
    type: "ordering",
    question: "Sắp xếp các số theo thứ tự tăng dần.",
    options: ["8", "2", "10", "4"],
    correctOrder: [1, 3, 0, 2],
  },
  {
    type: "fill_blank",
    question: "Một tuần có bao nhiêu ngày?",
    acceptedAnswers: ["7", "bảy", "Bảy"],
  },
  {
    type: "matching",
    question: "Nối phép tính với kết quả tương ứng.",
    pairs: [
      { left: "2 + 3", right: "5" },
      { left: "4 + 4", right: "8" },
      { left: "5 + 5", right: "10" },
    ],
  },
];

function createAnswer(question) {
  switch (question.type) {
    case "multiple":
    case "ordering":
    case "matching":
      return [];

    case "true_false":
      return null;

    case "fill_blank":
      return "";

    case "single":
    default:
      return null;
  }
}

export default function QuestionEngineTest() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checkedResults, setCheckedResults] = useState({});

  const question = sampleQuestions[currentIndex];

  const answer = Object.prototype.hasOwnProperty.call(
    answers,
    currentIndex
  )
    ? answers[currentIndex]
    : createAnswer(question);

  // Cập nhật câu trả lời và xóa kết quả cũ nếu học sinh làm lại
  const handleAnswerChange = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: value,
    }));

    setCheckedResults((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, currentIndex)) {
        return prev;
      }

      const next = { ...prev };
      delete next[currentIndex];
      return next;
    });
  };

  // Lưu kết quả kiểm tra từng câu
  const handleCheck = ({ isCorrect, answer }) => {
    setCheckedResults((prev) => ({
      ...prev,
      [currentIndex]: isCorrect,
    }));

    console.log("Câu hỏi:", currentIndex + 1);
    console.log("Câu trả lời:", answer);
    console.log("Kết quả:", isCorrect ? "ĐÚNG" : "SAI");
  };

  // Thống kê kết quả
  const totalQuestions = sampleQuestions.length;

  const completedQuestions = sampleQuestions.filter(
    (_, index) =>
      typeof checkedResults[index] === "boolean"
  ).length;

  const correctCount = Object.values(checkedResults).filter(
    (result) => result === true
  ).length;

  const incorrectCount = Object.values(checkedResults).filter(
    (result) => result === false
  ).length;

  const completionRate = Math.round(
    (completedQuestions / totalQuestions) * 100
  );

  const accuracyRate =
    completedQuestions > 0
      ? Math.round((correctCount / completedQuestions) * 100)
      : 0;

  const isCompleted = completedQuestions === totalQuestions;

  return (
    <Box sx={{ maxWidth: 850, mx: "auto", p: 2 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }} elevation={3}>
        <Typography variant="h5" fontWeight={700} mb={1}>
          KIỂM TRA QUESTION ENGINE
        </Typography>

        <Typography color="text.secondary" mb={2}>
          Thử nghiệm giao diện trả lời của học sinh
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography fontWeight={700} color="primary">
            Câu {currentIndex + 1} / {totalQuestions}
          </Typography>

          <Chip
            label={question.type}
            color="primary"
            variant="outlined"
          />
        </Stack>

        <QuestionPlayer
          question={question}
          answer={answer}
          onChange={handleAnswerChange}
          onCheck={handleCheck}
        />

        <Divider sx={{ my: 3 }} />

        <Stack
          direction="row"
          spacing={1}
          justifyContent="space-between"
        >
          <Button
            variant="outlined"
            disabled={currentIndex === 0}
            onClick={() =>
              setCurrentIndex((prev) => prev - 1)
            }
          >
            Câu trước
          </Button>

          <Button
            variant="contained"
            disabled={currentIndex === totalQuestions - 1}
            onClick={() =>
              setCurrentIndex((prev) => prev + 1)
            }
          >
            Câu tiếp theo
          </Button>
        </Stack>

        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: "#f5f7fb",
            borderRadius: 2,
          }}
        >
          <Typography fontWeight={700} mb={1}>
            Dữ liệu câu trả lời hiện tại:
          </Typography>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              margin: 0,
            }}
          >
            {JSON.stringify(answer, null, 2)}
          </pre>
        </Box>

        {/* THỐNG KÊ TIẾN ĐỘ */}
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 2,
            border: "1px solid #dbe3ef",
            borderRadius: 2,
          }}
        >
          <Typography fontWeight={700} mb={2}>
            TIẾN ĐỘ LÀM BÀI
          </Typography>

          <Stack
            direction="row"
            justifyContent="space-between"
            mb={1}
          >
            <Typography variant="body2" color="text.secondary">
              Đã kiểm tra {completedQuestions}/{totalQuestions} câu
            </Typography>

            <Typography
              variant="body2"
              fontWeight={700}
              color="primary"
            >
              {completionRate}%
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={completionRate}
            sx={{
              height: 9,
              borderRadius: 5,
              bgcolor: "#e5eaf1",
              "& .MuiLinearProgress-bar": {
                borderRadius: 5,
              },
            }}
          />

          <Grid container spacing={1.5} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "#e8f5e9",
                  borderRadius: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color="success.main"
                >
                  {correctCount}
                </Typography>
                <Typography variant="caption">
                  Câu đúng
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={4}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "#ffebee",
                  borderRadius: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color="error.main"
                >
                  {incorrectCount}
                </Typography>
                <Typography variant="caption">
                  Câu sai
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={4}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "#e3f2fd",
                  borderRadius: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color="primary.main"
                >
                  {accuracyRate}%
                </Typography>
                <Typography variant="caption">
                  Tỷ lệ đúng
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* TỔNG KẾT KHI HOÀN THÀNH */}
        {isCompleted && (
          <Alert
            severity={correctCount === totalQuestions ? "success" : "info"}
            icon={<CheckCircleOutlineIcon />}
            sx={{ mt: 3, borderRadius: 2 }}
          >
            <Typography fontWeight={700} mb={0.5}>
              ĐÃ HOÀN THÀNH BÀI KIỂM TRA!
            </Typography>

            <Typography variant="body2">
              Em trả lời đúng {correctCount}/{totalQuestions} câu,
              đạt tỷ lệ chính xác {accuracyRate}%.
            </Typography>

            {correctCount === totalQuestions
              ? " Tuyệt vời! Em đã trả lời đúng tất cả các câu."
              : " Em hãy xem lại những câu trả lời chưa chính xác nhé."}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
