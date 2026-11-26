
import React, { useEffect, useState } from "react";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Divider,
  Alert,
  Tooltip,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";

import {
  createEmptyQuestion,
  normalizeQuestions,
} from "../core/questionSchema";

import {
  validateQuestion,
} from "../core/questionValidator";

import QuestionTypeSelector from "./QuestionTypeSelector";
import QuestionPreview from "./QuestionPreview";

import SingleQuestionEditor from "./types/SingleQuestionEditor";
import MultipleQuestionEditor from "./types/MultipleQuestionEditor";
import TrueFalseQuestionEditor from "./types/TrueFalseQuestionEditor";
import OrderingQuestionEditor from "./types/OrderingQuestionEditor";
import FillBlankQuestionEditor from "./types/FillBlankQuestionEditor";
import MatchingQuestionEditor from "./types/MatchingQuestionEditor";

const EDITOR_COMPONENTS = {
  single: SingleQuestionEditor,
  multiple: MultipleQuestionEditor,
  true_false: TrueFalseQuestionEditor,
  ordering: OrderingQuestionEditor,
  fill_blank: FillBlankQuestionEditor,
  matching: MatchingQuestionEditor,
};

export default function QuestionEditor({
  questions,
  onChange,
  title = "NGÂN HÀNG CÂU HỎI",
  readOnly = false,
  minQuestions = 1,
  maxQuestions = Infinity,
}) {
  const [draftQuestions, setDraftQuestions] = useState(() =>
    normalizeQuestions(
      Array.isArray(questions) && questions.length
        ? questions
        : [createEmptyQuestion()]
    )
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Nhận dữ liệu mới từ component cha
  useEffect(() => {
    if (Array.isArray(questions)) {
      const normalized = normalizeQuestions(
        questions.length ? questions : [createEmptyQuestion()]
      );

      setDraftQuestions(normalized);

      setCurrentIndex((prev) =>
        Math.min(prev, normalized.length - 1)
      );
    }
  }, [questions]);

  const currentQuestion =
    draftQuestions[currentIndex] || createEmptyQuestion();

  const updateQuestions = (nextQuestions) => {
    setDraftQuestions(nextQuestions);

    // Chỉ trả dữ liệu về component cha, không tự lưu Firestore
    onChange?.(nextQuestions);
  };

  const updateCurrentQuestion = (updatedQuestion) => {
    const nextQuestions = draftQuestions.map((item, index) =>
      index === currentIndex ? updatedQuestion : item
    );

    updateQuestions(nextQuestions);
  };

  // Thay đổi dạng câu hỏi
  const handleChangeType = (type) => {
    const updatedQuestion = {
      ...currentQuestion,
      type,
      correctIndex: 0,
      correctIndexes: [],
      correctAnswer: null,
      correctOrder: [],
      acceptedAnswers: [],
      pairs: [
        { left: "", right: "" },
        { left: "", right: "" },
      ],
    };

    updateCurrentQuestion(updatedQuestion);
  };

  // Thêm câu hỏi
  const handleAddQuestion = () => {
    if (draftQuestions.length >= maxQuestions) return;

    const nextQuestions = [
        ...draftQuestions,
        createEmptyQuestion(),
    ];

    updateQuestions(nextQuestions);
    setCurrentIndex(nextQuestions.length - 1);
    };

  // Xóa câu hỏi
  const handleDeleteQuestion = () => {
    if (draftQuestions.length <= minQuestions) return;

    const nextQuestions = draftQuestions.filter(
      (_, index) => index !== currentIndex
    );

    updateQuestions(nextQuestions);

    setCurrentIndex((prev) =>
      Math.min(prev, nextQuestions.length - 1)
    );
  };

  // Kiểm tra câu hỏi hiện tại
  const validation = validateQuestion(currentQuestion);

  // Component nhập liệu theo dạng câu hỏi
  const CurrentEditor =
    EDITOR_COMPONENTS[currentQuestion.type] ||
    SingleQuestionEditor;

  return (
    <Box>
      {/* TIÊU ĐỀ */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        mb={2}
      >
        <Box>
          <Typography
            fontSize={17}
            fontWeight={900}
            color="#1e3a8a"
          >
            {title}
          </Typography>

          <Typography fontSize={12} color="text.secondary">
            Tạo và quản lý câu hỏi theo 6 dạng khác nhau
          </Typography>
        </Box>

        <Chip
          label={`${draftQuestions.length} câu hỏi`}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 800 }}
        />
      </Box>

      {/* DANH SÁCH CÂU HỎI */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 2,
          border: "1px solid #dbeafe",
          borderRadius: 2.5,
          bgcolor: "#f8fafc",
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
          mb={1.2}
        >
          <Typography fontSize={13} fontWeight={900}>
            DANH SÁCH CÂU HỎI
          </Typography>

          {!readOnly && (
            <Button
                size="small"
                variant="contained"
                startIcon={<AddRoundedIcon />}
                disabled={draftQuestions.length >= maxQuestions}
                onClick={handleAddQuestion}
                sx={{ borderRadius: 2, fontWeight: 800 }}
                >
                Thêm câu
            </Button>
          )}
        </Box>

        <Box display="flex" flexWrap="wrap" gap={0.8}>
          {draftQuestions.map((item, index) => {
            const result = validateQuestion(item);
            const active = currentIndex === index;

            return (
              <Chip
                key={index}
                clickable
                onClick={() => setCurrentIndex(index)}
                label={`Câu ${index + 1}`}
                color={
                  active
                    ? "primary"
                    : result.valid
                      ? "success"
                      : "default"
                }
                variant={active ? "filled" : "outlined"}
                sx={{ fontWeight: 800 }}
              />
            );
          })}
        </Box>
      </Paper>

      {/* NỘI DUNG CÂU HỎI */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          border: "1px solid #bfdbfe",
          borderRadius: 3,
          bgcolor: "#fff",
        }}
      >
        {/* TIÊU ĐỀ CÂU */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
          mb={2}
        >
          <Typography
            fontSize={16}
            fontWeight={900}
            color="#1d4ed8"
          >
            CÂU HỎI {currentIndex + 1}
          </Typography>

          {!readOnly && (
            <Box display="flex" gap={0.5}>
              <Tooltip title="Xem trước giao diện học sinh">
                <IconButton
                  color="primary"
                  onClick={() => setPreviewOpen(true)}
                >
                  <VisibilityRoundedIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Xóa câu hỏi hiện tại">
                <span>
                  <IconButton
                    color="error"
                    disabled={draftQuestions.length <= minQuestions}
                    onClick={handleDeleteQuestion}
                  >
                    <DeleteOutlineRoundedIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* DẠNG CÂU HỎI */}
        <QuestionTypeSelector
          value={currentQuestion.type}
          onChange={handleChangeType}
          disabled={readOnly}
        />

        {/* NỘI DUNG */}
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Nội dung câu hỏi"
          placeholder="Nhập nội dung câu hỏi..."
          value={currentQuestion.question}
          disabled={readOnly}
          onChange={(e) =>
            updateCurrentQuestion({
              ...currentQuestion,
              question: e.target.value,
            })
          }
          sx={{
            mt: 2,
            mb: 2.5,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: "#f8fafc",
            },
          }}
        />

        <Divider sx={{ mb: 2.5 }} />

        {/* GIAO DIỆN NHẬP THEO TỪNG DẠNG */}
        <CurrentEditor
          question={currentQuestion}
          onChange={updateCurrentQuestion}
          disabled={readOnly}
        />

        {/* TRẠNG THÁI KIỂM TRA */}
        <Box mt={2.5}>
          {validation.valid ? (
            <Alert severity="success">
              Câu hỏi đã có nội dung và đáp án hợp lệ.
            </Alert>
          ) : (
            <Alert severity="warning">
              {validation.message}
            </Alert>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* ĐIỀU HƯỚNG */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
        >
          <Button
            variant="outlined"
            disabled={currentIndex === 0}
            onClick={() =>
              setCurrentIndex((prev) => prev - 1)
            }
            startIcon={<ArrowBackIosNewRoundedIcon />}
            sx={{ borderRadius: 2, fontWeight: 800 }}
          >
            Câu trước
          </Button>

          <Typography
            fontSize={12}
            fontWeight={900}
            color="text.secondary"
            whiteSpace="nowrap"
          >
            {currentIndex + 1}/{draftQuestions.length}
          </Typography>

          <Button
            variant="contained"
            disabled={currentIndex === draftQuestions.length - 1}
            onClick={() =>
              setCurrentIndex((prev) => prev + 1)
            }
            endIcon={<ArrowForwardIosRoundedIcon />}
            sx={{ borderRadius: 2, fontWeight: 800 }}
          >
            Câu tiếp
          </Button>
        </Box>

        {/* XEM TRƯỚC */}
        {!readOnly && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<VisibilityRoundedIcon />}
            onClick={() => setPreviewOpen(true)}
            sx={{
              mt: 2,
              minHeight: 44,
              borderRadius: 2,
              fontWeight: 900,
            }}
          >
            XEM TRƯỚC GIAO DIỆN HỌC SINH
          </Button>
        )}
      </Paper>

      {/* DIALOG XEM TRƯỚC */}
      <QuestionPreview
        open={previewOpen}
        question={currentQuestion}
        onClose={() => setPreviewOpen(false)}
      />
    </Box>
  );
}
