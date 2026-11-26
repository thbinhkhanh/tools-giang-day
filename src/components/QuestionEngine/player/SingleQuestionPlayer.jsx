
import React from "react";

import {
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
  Paper,
} from "@mui/material";

export default function SingleQuestionPlayer({
  question,
  answer,
  onChange,
  disabled = false,
}) {
  const selectedValue = answer ?? "";

  return (
    <Box>
      {/* Nội dung câu hỏi */}
      <Typography
        fontWeight={700}
        mb={1.2}
        mt={1.5}
        fontSize={15}
        lineHeight={1.6}
        color="#1e293b"
      >
        {question.question}
      </Typography>

      {/* Danh sách phương án */}
      <RadioGroup
        value={String(selectedValue)}
        onChange={(event) => {
          if (!disabled) {
            onChange?.(Number(event.target.value));
          }
        }}
      >
        {(question.options || []).map((option, index) => {
          const isSelected = selectedValue === index;

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
                value={String(index)}
                disabled={disabled}
                control={
                  <Radio
                    size="small"
                    sx={{
                      p: 0.7,
                      mr: 0.3,
                    }}
                  />
                }
                label={
                  <Typography
                    fontSize={15}
                    lineHeight={1.5}
                    fontWeight={isSelected ? 700 : 600}
                    color="#1e293b"
                    sx={{
                      overflowWrap: "anywhere",
                    }}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </Typography>
                }
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
              />
            </Paper>
          );
        })}
      </RadioGroup>
    </Box>
  );
}
