
import React from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
} from "@mui/material";

export default function TrueFalseQuestionEditor({ question, onChange }) {
  return (
    <Box>
      <Typography fontWeight={900} fontSize={14} mb={1.5}>
        THIẾT LẬP ĐÁP ÁN ĐÚNG
      </Typography>

      <Box display="flex" gap={1.5}>
        <Button
          fullWidth
          variant={question.correctAnswer === true ? "contained" : "outlined"}
          color="success"
          onClick={() =>
            onChange({ ...question, correctAnswer: true })
          }
          sx={{
            minHeight: 54,
            borderRadius: 2,
            fontWeight: 900,
          }}
        >
          ĐÚNG
        </Button>

        <Button
          fullWidth
          variant={question.correctAnswer === false ? "contained" : "outlined"}
          color="error"
          onClick={() =>
            onChange({ ...question, correctAnswer: false })
          }
          sx={{
            minHeight: 54,
            borderRadius: 2,
            fontWeight: 900,
          }}
        >
          SAI
        </Button>
      </Box>

      <Alert severity="info" sx={{ mt: 1.5 }}>
        Học sinh sẽ chọn một trong hai phương án Đúng hoặc Sai.
      </Alert>
    </Box>
  );
}
