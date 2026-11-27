
import React from "react";
import {
  Box,
  TextField,
  Typography,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function OrderingQuestionEditor({ question, onChange }) {
  const options = Array.isArray(question.options)
    ? question.options
    : [];

  const order = Array.isArray(question.correctOrder)
    ? question.correctOrder
    : [];

  // Các mục đã nhập nội dung
  const filledIndexes = options
    .map((item, index) =>
      String(item ?? "").trim() ? index : -1
    )
    .filter((index) => index >= 0);

  // Cập nhật nội dung phương án
  const updateOption = (index, value) => {
    const nextOptions = [...options];
    nextOptions[index] = value;

    // Bỏ mục không còn nội dung khỏi thứ tự
    const correctOrder = order.filter(
      (item) =>
        nextOptions[item] !== undefined &&
        String(nextOptions[item]).trim()
    );

    onChange({
      ...question,
      options: nextOptions,
      correctOrder,
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

  // Xóa phương án và điều chỉnh lại chỉ số trong correctOrder
  const removeOption = (index) => {
    if (options.length <= 2) return;

    const nextOptions = options.filter(
      (_, i) => i !== index
    );

    const correctOrder = order
      .filter((item) => item !== index)
      .map((item) => (item > index ? item - 1 : item));

    onChange({
      ...question,
      options: nextOptions,
      correctOrder,
    });
  };

  // Cập nhật vị trí đúng
  const updatePosition = (index, position) => {
    const currentOrder = order.filter((item) =>
      filledIndexes.includes(item)
    );

    const baseOrder = [
      ...filledIndexes.filter(
        (item) => !currentOrder.includes(item)
      ),
      ...currentOrder,
    ];

    const oldPosition = baseOrder.indexOf(index);
    if (oldPosition < 0) return;

    baseOrder.splice(oldPosition, 1);
    baseOrder.splice(position, 0, index);

    onChange({
      ...question,
      correctOrder: baseOrder,
    });
  };

  // Thứ tự hiển thị
  const displayOrder = [
    ...order.filter((item) => filledIndexes.includes(item)),
    ...filledIndexes.filter((item) => !order.includes(item)),
  ];

  return (
    <Box>
      <Typography fontSize={12} color="text.secondary" mb={1.5}>
        Nhập từng nội dung, sau đó chọn thứ tự đúng từ 1 đến số mục đã nhập.
      </Typography>

      {options.map((option, index) => {
        const position = displayOrder.indexOf(index);

        return (
          <Box
            key={index}
            display="flex"
            alignItems="center"
            gap={1}
            mb={1.2}
          >
            {/* Ký hiệu A, B, C... */}
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

            {/* Nội dung */}
            <TextField
              fullWidth
              size="small"
              value={option}
              placeholder={`Nhập nội dung ${String.fromCharCode(
                65 + index
              )}`}
              onChange={(e) =>
                updateOption(index, e.target.value)
              }
            />

            {/* Chọn thứ tự */}
            <TextField
              select
              size="small"
              label="Thứ tự"
              value={position >= 0 ? position + 1 : ""}
              disabled={!String(option ?? "").trim()}
              onChange={(e) =>
                updatePosition(
                  index,
                  Number(e.target.value) - 1
                )
              }
              sx={{ width: 115, flexShrink: 0 }}
            >
              {filledIndexes.map((_, i) => (
                <MenuItem key={i} value={i + 1}>
                  {i + 1}
                </MenuItem>
              ))}
            </TextField>

            {/* Xóa phương án */}
            <Tooltip title="Xóa phương án">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={options.length <= 2}
                  onClick={() => removeOption(index)}
                  sx={{ flexShrink: 0 }}
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
    </Box>
  );
}
