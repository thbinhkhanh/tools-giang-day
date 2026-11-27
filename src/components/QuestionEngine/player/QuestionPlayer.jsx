
import React, { useState, useEffect } from "react";

import {
  Box,
  Paper,
  Button,
  Typography,
  Alert,
  Stack,
  Divider,
} from "@mui/material";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ReplayIcon from "@mui/icons-material/Replay";

import SingleQuestionPlayer from "./SingleQuestionPlayer";
import MultipleQuestionPlayer from "./MultipleQuestionPlayer";
import TrueFalseQuestionPlayer from "./TrueFalseQuestionPlayer";
import OrderingQuestionPlayer from "./OrderingQuestionPlayer";
import FillBlankQuestionPlayer from "./FillBlankQuestionPlayer";
import MatchingQuestionPlayer from "./MatchingQuestionPlayer";

import { checkAnswer } from "../core/answerChecker";
import { createEmptyAnswer } from "../core/questionUtils";

// Lấy nội dung đáp án đúng theo từng dạng câu hỏi
const getCorrectAnswerText = (question) => {
  if (!question) return "";

  const type = question.type || "single";
  const options = question.options || [];

  switch (type) {
    case "single":
      return options[question.correctIndex] ?? "Chưa thiết lập đáp án";

    case "multiple":
      return (question.correctIndexes || [])
        .map((index) => options[index])
        .filter(Boolean)
        .join(", ") || "Chưa thiết lập đáp án";

    case "true_false":
      return question.correctAnswer === true
        ? "Đúng"
        : question.correctAnswer === false
        ? "Sai"
        : "Chưa thiết lập đáp án";

    case "ordering":
      return (question.correctOrder || [])
        .map((index) => options[index])
        .filter(Boolean)
        .join(" → ") || "Chưa thiết lập đáp án";

    case "fill_blank":
      return (question.acceptedAnswers || [])
        .filter(Boolean)
        .join(" / ") || "Chưa thiết lập đáp án";

    case "matching":
      return (question.pairs || [])
        .map((pair) => `${pair.left} → ${pair.right}`)
        .join("\n") || "Chưa thiết lập đáp án";

    default:
      return "Chưa thiết lập đáp án";
  }
};

export default function QuestionPlayer({
  question,
  answer,
  onChange,
  disabled = false,
  onCheck,
  showCheckButton = true,
}) {
  const [result, setResult] = useState(null);

  const type = question?.type || "single";

  useEffect(() => {
    setResult(null);
  }, [question]);

  if (!question) return null;

  const handleCheck = () => {
    const isCorrect = checkAnswer(question, answer);

    setResult(isCorrect);

    if (typeof onCheck === "function") {
      onCheck({
        question,
        answer,
        isCorrect,
      });
    }
  };

  const handleRetry = () => {
    setResult(null);
    onChange?.(createEmptyAnswer(type));
  };

  const playerProps = {
    question,
    answer,
    onChange,
    disabled: disabled || result !== null,
  };

  const renderPlayer = () => {
    switch (type) {
      case "single":
        return (
            <SingleQuestionPlayer
            {...playerProps}
            result={result}
            />
        );

      case "multiple":
        return <MultipleQuestionPlayer {...playerProps} />;

      case "true_false":
        return <TrueFalseQuestionPlayer {...playerProps} />;

      case "ordering":
        return <OrderingQuestionPlayer {...playerProps} />;

      case "fill_blank":
        return <FillBlankQuestionPlayer {...playerProps} />;

      case "matching":
        return <MatchingQuestionPlayer {...playerProps} />;

      default:
        return (
          <Alert severity="warning">
            Dạng câu hỏi chưa được hỗ trợ.
          </Alert>
        );
    }
  };

  const correctAnswerText = getCorrectAnswerText(question);

  return (
    <Box>
      {renderPlayer()}

      {!disabled && showCheckButton && result !== true && (
        <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 3 }}
        >
            <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<CheckCircleOutlineIcon />}
            disabled={result !== null}
            onClick={handleCheck}
            sx={{
                py: 1.2,
                borderRadius: 2,
                fontWeight: 700,
            }}
            >
            KIỂM TRA ĐÁP ÁN
            </Button>

            {result === false && (
            <Button
                variant="outlined"
                startIcon={<ReplayIcon />}
                onClick={handleRetry}
                sx={{
                borderRadius: 2,
                whiteSpace: "nowrap",
                }}
            >
                Làm lại
            </Button>
            )}
        </Stack>
        )}

      {result !== null && (
        <Paper
            elevation={0}
            sx={{
                mt: 1.5,
                p: 1.25,
                borderRadius: 1.5,
                bgcolor: result ? "#44844a" : "#FFF3E0",
                border: "1px solid",
                borderColor: result ? "#81C784" : "#FFCC80",
            }}
            >
            <Stack direction="row" spacing={0.75} alignItems="center">
                {result ? (
                <CheckCircleOutlineIcon
                    color="success"
                    sx={{ fontSize: 19 }}
                />
                ) : (
                <Typography fontSize={17}>❌</Typography>
                )}

                <Typography
                fontSize={13}
                fontWeight={700}
                color={result ? "success.dark" : "warning.dark"}
                >
                {result
                    ? "Chính xác! Em trả lời rất tốt."
                    : "Chưa chính xác! Em hãy xem đáp án đúng nhé."}
                </Typography>
            </Stack>

            {!result && (
                <>
                <Divider sx={{ my: 1 }} />

                <Typography
                    fontSize={12.5}
                    fontWeight={700}
                    color="success.dark"
                    sx={{ mb: 0.5 }}
                >
                    Đáp án đúng:
                </Typography>

                <Typography
                    fontSize={13}
                    color="text.primary"
                    sx={{
                    whiteSpace: "pre-line",
                    fontWeight: 600,
                    lineHeight: 1.5,
                    }}
                >
                    {correctAnswerText}
                </Typography>
                </>
            )}
            </Paper>
      )}
    </Box>
  );
}
