
import React from "react";
import {
  Box,
  TextField,
  MenuItem,
  Typography,
} from "@mui/material";

import {
  QUESTION_TYPE_OPTIONS,
} from "../core/questionSchema";

export default function QuestionTypeSelector({
  value = "single",
  onChange,
  disabled = false,
}) {
  return (
    <Box>
      <Typography
        fontSize={13}
        fontWeight={800}
        color="#475569"
        mb={0.8}
      >
        DẠNG CÂU HỎI
      </Typography>

      <TextField
        select
        fullWidth
        size="small"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            bgcolor: "#fff",
          },
        }}
      >
        {QUESTION_TYPE_OPTIONS.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
