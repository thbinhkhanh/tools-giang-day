
import React from "react";
import {
  Box,
  Checkbox,
  Typography,
} from "@mui/material";

export default function TrueFalseQuestionEditor({ question, onChange }) {
  const renderCheckbox = (value, label) => {
    const selected = question.correctAnswer === value;

    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap={0.5}
        onClick={() =>
          onChange({ ...question, correctAnswer: value })
        }
        sx={{
          flex: "0 1 130px",
          width: 130,
          maxWidth: 130,
          minHeight: 38,
          border: "1px solid",
          borderColor: selected ? "#86cda0" : "#dbe3ed",
          borderRadius: 2,
          bgcolor: selected ? "#f0fdf4" : "#fff",
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": {
            borderColor: "#16a34a",
            bgcolor: "#f0fdf4",
          },
        }}
      >
        <Checkbox
          checked={selected}
          onChange={() =>
            onChange({ ...question, correctAnswer: value })
          }
          onClick={(e) => e.stopPropagation()}
          icon={
            <Box
              sx={{
                width: 19,
                height: 19,
                border: "2px solid #94a3b8",
                borderRadius: 1,
                bgcolor: "#fff",
              }}
            />
          }
          checkedIcon={
            <Box
              sx={{
                width: 19,
                height: 19,
                borderRadius: 1,
                bgcolor: "#16a34a",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              ✓
            </Box>
          }
          sx={{ p: 0.5 }}
        />

        <Typography
          fontWeight={900}
          fontSize={13}
          color={selected ? "#15803d" : "#334155"}
        >
          {label}
        </Typography>
      </Box>
    );
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      {renderCheckbox(true, "ĐÚNG")}
      {renderCheckbox(false, "SAI")}
    </Box>
  );
}
