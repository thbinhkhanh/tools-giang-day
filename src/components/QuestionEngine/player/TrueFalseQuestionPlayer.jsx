
import React from "react";

import {
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
  Paper,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function TrueFalseQuestionPlayer({
  question,
  answer = null,
  onChange,
  disabled = false,
  result = null,
}) {
  const options = [
    { value: true, label: "Đúng" },
    { value: false, label: "Sai" },
  ];

  return (
    <Box>
      <Typography
        fontWeight={600}
        mb={1.2}
        mt={1.2}
        fontSize={14}
        lineHeight={1.5}
        color="#1e293b"
      >
        {question.question}
      </Typography>

      <RadioGroup
        value={answer === null ? "" : String(answer)}
        onChange={(event) => {
          if (!disabled) {
            onChange?.(event.target.value === "true");
          }
        }}
      >
        {options.map((option) => {
          const isSelected = answer === option.value;
          const isCorrect =
            result === true &&
            option.value === question.correctAnswer;

          return (
            <Paper
              key={String(option.value)}
              variant="outlined"
              sx={{
                mb: 1,
                borderRadius: 2,
                borderColor: isCorrect
                  ? "#16A34A"
                  : isSelected
                  ? "primary.main"
                  : "#dbe3ee",
                bgcolor: isCorrect ? "#F0FDF4" : "#fff",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  pr: 1.2,
                }}
              >
                <FormControlLabel
                  value={String(option.value)}
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
                      fontSize={14}
                      fontWeight={isSelected ? 700 : 600}
                      lineHeight={1.5}
                      color="#1e293b"
                    >
                      {option.label}
                    </Typography>
                  }
                  sx={{
                    flex: 1,
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

                {isCorrect && (
                  <CheckCircleIcon
                    sx={{
                      color: "#16A34A",
                      fontSize: 21,
                      flexShrink: 0,
                      mr: 2,
                    }}
                  />
                )}
              </Box>
            </Paper>
          );
        })}
      </RadioGroup>
    </Box>
  );
}
