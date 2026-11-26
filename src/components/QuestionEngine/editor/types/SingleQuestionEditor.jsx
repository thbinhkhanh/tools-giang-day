
import React from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Alert,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

export default function SingleQuestionEditor({ question, onChange }) {
  const updateOption = (index, value) => {
    const options = [...question.options];
    options[index] = value;
    onChange({ ...question, options });
  };

  return (
    <Box>
      <Typography fontWeight={900} fontSize={14} mb={1}>
        CÁC PHƯƠNG ÁN – CHỌN MỘT ĐÁP ÁN ĐÚNG
      </Typography>

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
            <TextField
              fullWidth
              size="small"
              label={`Phương án ${String.fromCharCode(65 + index)}`}
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
            />

            <Button
              variant={selected ? "contained" : "outlined"}
              color={selected ? "success" : "primary"}
              onClick={() =>
                onChange({ ...question, correctIndex: index })
              }
              sx={{
                minWidth: 82,
                minHeight: 40,
                borderRadius: 2,
                fontWeight: 800,
              }}
            >
              {selected ? (
                <CheckCircleRoundedIcon />
              ) : (
                "Đáp án"
              )}
            </Button>
          </Box>
        );
      })}

      <Alert severity="info" sx={{ mt: 1 }}>
        Học sinh chỉ được chọn một phương án.
      </Alert>
    </Box>
  );
}
