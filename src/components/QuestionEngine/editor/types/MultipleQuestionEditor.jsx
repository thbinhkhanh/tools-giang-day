
import React from "react";
import {
  Box,
  TextField,
  Checkbox,
  Tooltip,
  Typography,
  Button,
  IconButton,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function MultipleQuestionEditor({ question, onChange }) {
  const options = Array.isArray(question.options)
    ? question.options
    : [];

  const correctIndexes = Array.isArray(question.correctIndexes)
    ? question.correctIndexes.map(Number)
    : [];

  // Cập nhật nội dung phương án
  const updateOption = (index, value) => {
    const nextOptions = [...options];
    nextOptions[index] = value;

    onChange({
      ...question,
      options: nextOptions,
    });
  };

  // Thêm phương án
  const addOption = () => {
    if (options.length >= 26) return;

    onChange({
      ...question,
      options: [...options, ""],
    });
  };

  // Xóa phương án và cập nhật lại chỉ số đáp án đúng
  const removeOption = (index) => {
    if (options.length <= 2) return;

    const nextOptions = options.filter(
      (_, i) => i !== index
    );

    const nextCorrectIndexes = correctIndexes
      .filter((item) => item !== index)
      .map((item) => (item > index ? item - 1 : item));

    onChange({
      ...question,
      options: nextOptions,
      correctIndexes: nextCorrectIndexes,
    });
  };

  // Chọn hoặc bỏ chọn đáp án đúng
  const toggleCorrect = (index) => {
    const nextCorrectIndexes = correctIndexes.includes(index)
      ? correctIndexes.filter((item) => item !== index)
      : [...correctIndexes, index];

    onChange({
      ...question,
      correctIndexes: nextCorrectIndexes,
    });
  };

  return (
    <Box>
      {options.map((option, index) => {
        const selected = correctIndexes.includes(index);

        return (
          <Box
            key={index}
            display="flex"
            alignItems="center"
            gap={1}
            mb={1.2}
          >
            {/* Ký hiệu phương án */}
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
              onChange={(e) =>
                updateOption(index, e.target.value)
              }
              placeholder={`Nhập phương án ${String.fromCharCode(
                65 + index
              )}`}
            />

            {/* Chọn đáp án đúng */}
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

            {/* Xóa phương án */}
            <Tooltip title="Xóa phương án">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={options.length <= 2}
                  onClick={() => removeOption(index)}
                  sx={{
                    flexShrink: 0,
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      })}

      {/* Thêm phương án */}
      <Button
        size="small"
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={addOption}
        disabled={options.length >= 26}
        sx={{
          mt: 0.5,
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 2,
        }}
      >
        Thêm đáp án
      </Button>

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        mt={0.8}
      >
        Có thể thêm tối đa 26 phương án. Cần ít nhất 2 phương án.
      </Typography>
    </Box>
  );
}
