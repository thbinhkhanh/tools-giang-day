
import React from "react";
import {
  Box,
  TextField,
  Typography,
  Alert,
} from "@mui/material";

export default function FillBlankQuestionEditor({ question, onChange }) {
  return (
    <Box>
      <Typography fontWeight={900} fontSize={14} mb={1}>
        CÁC ĐÁP ÁN ĐƯỢC CHẤP NHẬN
      </Typography>

      <TextField
        fullWidth
        multiline
        minRows={3}
        label="Nhập đáp án"
        placeholder={"Ví dụ:\nHà Nội\nThủ đô Hà Nội"}
        value={(question.acceptedAnswers || []).join("\n")}
        onChange={(e) =>
          onChange({
            ...question,
            acceptedAnswers: e.target.value
              .split("\n")
              .map((item) => item.trim()),
          })
        }
        helperText="Mỗi dòng là một cách trả lời đúng. Không phân biệt chữ hoa và chữ thường."
      />
    </Box>
  );
}
