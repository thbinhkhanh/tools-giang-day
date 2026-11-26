
import React from "react";
import {
  Box,
  TextField,
  Checkbox,
  Tooltip,
  Alert,
} from "@mui/material";

export default function MultipleQuestionEditor({ question, onChange }) {
  const updateOption = (index, value) => {
    const options = [...question.options];
    options[index] = value;
    onChange({ ...question, options });
  };

  // Chọn hoặc bỏ chọn đáp án đúng
  const toggleCorrect = (index) => {
    const current = question.correctIndexes || [];

    const correctIndexes = current.includes(index)
      ? current.filter((item) => item !== index)
      : [...current, index];

    onChange({ ...question, correctIndexes });
  };

  return (
    <Box>
      {question.options.map((option, index) => {
        const selected = (question.correctIndexes || []).includes(index);

        return (
          <Box
            key={index}
            display="flex"
            alignItems="center"
            gap={1}
            mb={1.2}
          >
            <TextField
              fullWidth
              size="small"
              label={`Phương án ${String.fromCharCode(65 + index)}`}
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
            />

            <Tooltip
              title={
                selected
                  ? "Đáp án đúng – nhấn để bỏ chọn"
                  : "Chọn làm đáp án đúng"
              }
            >
              <Checkbox
                checked={selected}
                onChange={() => toggleCorrect(index)}
                icon={
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      border: "2px solid #94a3b8",
                      borderRadius: 1,
                      bgcolor: "#fff",
                    }}
                  />
                }
                checkedIcon={
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: 1,
                      bgcolor: "#16a34a",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 17,
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </Box>
                }
                sx={{
                  p: 0.8,
                  flexShrink: 0,
                }}
              />
            </Tooltip>
          </Box>
        );
      })}
    </Box>
  );
}
