
import React from "react";
import {
  Box,
  TextField,
  Checkbox,
  Tooltip,
  Typography,
} from "@mui/material";

export default function SingleQuestionEditor({ question, onChange }) {
  const updateOption = (index, value) => {
    const options = [...question.options];
    options[index] = value;
    onChange({ ...question, options });
  };

  return (
    <Box>
      {question.options.map((option, index) => {
        const selected = question.correctIndex === index;

        return (
          <Box
            key={index}
            display="flex"
            alignItems="center"
            gap={1}
            mb={1.2}
          >
            {/* Ký hiệu phương án A, B, C... */}
            <Typography
              sx={{
                width: 28,
                minWidth: 28,
                fontSize: 14,
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
              }}
            >
              {String.fromCharCode(65 + index)}.
            </Typography>

            {/* Nội dung phương án */}
            <TextField
              fullWidth
              size="small"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Nhập phương án ${String.fromCharCode(65 + index)}`}
            />

            {/* Chọn đáp án đúng */}
            <Tooltip
              title={
                selected
                  ? "Đáp án đúng"
                  : "Chọn làm đáp án đúng"
              }
            >
              <Checkbox
                checked={selected}
                onChange={() =>
                  onChange({
                    ...question,
                    correctIndex: index,
                  })
                }
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
