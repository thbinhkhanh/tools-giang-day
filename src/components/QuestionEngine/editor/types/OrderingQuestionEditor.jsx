
import React from "react";
import {
  Box,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";

export default function OrderingQuestionEditor({ question, onChange }) {
  const filledIndexes = question.options
    .map((item, index) => item.trim() ? index : -1)
    .filter((index) => index >= 0);

  const order = question.correctOrder || [];

  const updateOption = (index, value) => {
    const options = [...question.options];
    options[index] = value;

    // Bỏ các mục đã xóa khỏi thứ tự
    const correctOrder = order.filter(
      (item) => options[item]?.trim()
    );

    onChange({ ...question, options, correctOrder });
  };

  const updatePosition = (index, position) => {
    const currentOrder = filledIndexes.includes(index)
      ? [...order.filter((item) => filledIndexes.includes(item))]
      : [...filledIndexes];

    const baseOrder = [
      ...filledIndexes.filter((item) => !currentOrder.includes(item)),
      ...currentOrder,
    ];

    const oldPosition = baseOrder.indexOf(index);
    if (oldPosition < 0) return;

    baseOrder.splice(oldPosition, 1);
    baseOrder.splice(position, 0, index);

    onChange({ ...question, correctOrder: baseOrder });
  };

  const displayOrder = [
    ...order.filter((item) => filledIndexes.includes(item)),
    ...filledIndexes.filter((item) => !order.includes(item)),
  ];

  return (
    <Box>
      <Typography fontSize={12} color="text.secondary" mb={1.5}>
        Nhập từng nội dung, sau đó chọn thứ tự đúng từ 1 đến số mục đã nhập.
      </Typography>

      {question.options.map((option, index) => {
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
              placeholder={`Nhập nội dung ${String.fromCharCode(65 + index)}`}
              onChange={(e) => updateOption(index, e.target.value)}
            />

            {/* Chọn thứ tự */}
            <TextField
              select
              size="small"
              label="Thứ tự"
              value={position >= 0 ? position + 1 : ""}
              disabled={!option.trim()}
              onChange={(e) =>
                updatePosition(index, Number(e.target.value) - 1)
              }
              sx={{ width: 115, flexShrink: 0 }}
            >
              {filledIndexes.map((_, i) => (
                <MenuItem key={i} value={i + 1}>
                  {i + 1}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        );
      })}
    </Box>
  );
}
