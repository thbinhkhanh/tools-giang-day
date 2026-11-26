
import React from "react";
import { Box, TextField, Typography } from "@mui/material";

export default function FillBlankQuestionPlayer({
  question,
  answer = "",
  onChange,
  disabled = false,
}) {
  return (
    <Box>
      <Typography fontWeight={600} mb={2} mt={2}>
        {question.question}
      </Typography>

      <TextField
        fullWidth
        value={answer}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Nhập câu trả lời..."
      />
    </Box>
  );
}
