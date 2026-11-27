
import React from "react";

import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  Paper,
} from "@mui/material";

export default function MultipleQuestionPlayer({
  question,
  answer = [],
  onChange,
  disabled = false,
}) {
  const selected = Array.isArray(answer) ? answer : [];

  // Chỉ lấy các phương án có nội dung
  // Giữ nguyên chỉ số gốc của phương án
  const options = Array.isArray(question?.options)
    ? question.options
        .map((option, index) => ({
          content: option,
          originalIndex: index,
        }))
        .filter(
          (item) => String(item.content ?? "").trim() !== ""
        )
    : [];

  const handleToggle = (index) => {
    if (disabled) return;

    const next = selected.includes(index)
      ? selected.filter((item) => item !== index)
      : [...selected, index];

    onChange?.(next);
  };

  return (
    <Box>
      {/* Nội dung câu hỏi */}
      <Typography
        fontWeight={700}
        mb={1.2}
        mt={1.2}
        fontSize={15}
        lineHeight={1.6}
        color="#1e293b"
      >
        {question.question}
      </Typography>

      {/* Danh sách phương án hợp lệ */}
      {options.map((option) => {
        const index = option.originalIndex;
        const isSelected = selected.includes(index);

        return (
          <Paper
            key={index}
            variant="outlined"
            sx={{
              mb: 1,
              borderRadius: 2,
              borderColor: isSelected
                ? "primary.main"
                : "#dbe3ee",
              overflow: "hidden",
            }}
          >
            <FormControlLabel
              disabled={disabled}
              sx={{
                width: "100%",
                m: 0,
                px: 1.5,
                py: 0.35,
                minHeight: 42,

                alignItems: "center",

                "& .MuiFormControlLabel-label": {
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                },
              }}
              control={
                <Checkbox
                  size="small"
                  checked={isSelected}
                  onChange={() => handleToggle(index)}
                  sx={{
                    p: 0.7,
                    mr: 0.3,
                  }}
                />
              }
              label={
                <Typography
                  fontSize={14}
                  lineHeight={1.5}
                  fontWeight={isSelected ? 700 : 600}
                  color="#1e293b"
                  sx={{
                    overflowWrap: "anywhere",
                  }}
                >
                  {String.fromCharCode(65 + index)}. {option.content}
                </Typography>
              }
            />
          </Paper>
        );
      })}
    </Box>
  );
}
