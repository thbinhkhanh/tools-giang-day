
import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Radio,
  RadioGroup,
  Checkbox,
  FormControlLabel,
  TextField,
  MenuItem,
  Alert,
  Paper,
  Divider,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  createEmptyAnswer,
} from "../core/questionUtils";

export default function QuestionPreview({
  open,
  question,
  onClose,
}) {
  const [answer, setAnswer] = useState(null);

  useEffect(() => {
    if (open && question) {
      setAnswer(createEmptyAnswer(question.type || "single"));
    }
  }, [open, question]);

  if (!question) return null;

  const options = question.options || [];

  const moveOrder = (index, direction) => {
    const current = Array.isArray(answer) ? [...answer] : [];

    const ordered = current.length
      ? current
      : options.map((_, i) => i);

    const position = ordered.indexOf(index);
    const nextPosition = position + direction;

    if (
      position < 0 ||
      nextPosition < 0 ||
      nextPosition >= ordered.length
    ) {
      return;
    }

    [ordered[position], ordered[nextPosition]] = [
      ordered[nextPosition],
      ordered[position],
    ];

    setAnswer(ordered);
  };

  const renderQuestion = () => {
    switch (question.type || "single") {
      case "single":
        return (
          <RadioGroup
            value={answer === null ? "" : String(answer)}
            onChange={(e) => setAnswer(Number(e.target.value))}
          >
            {options.map((option, index) => (
              <Paper
                key={index}
                variant="outlined"
                sx={{ mb: 1, borderRadius: 2 }}
              >
                <FormControlLabel
                  value={String(index)}
                  control={<Radio />}
                  label={`${String.fromCharCode(65 + index)}. ${option}`}
                  sx={{ mx: 0.5, width: "100%", py: 0.5 }}
                />
              </Paper>
            ))}
          </RadioGroup>
        );

      case "multiple":
        return options.map((option, index) => {
          const selected = (answer || []).includes(index);

          return (
            <Paper
              key={index}
              variant="outlined"
              sx={{ mb: 1, borderRadius: 2 }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selected}
                    onChange={() =>
                      setAnswer((prev) =>
                        (prev || []).includes(index)
                          ? prev.filter((i) => i !== index)
                          : [...(prev || []), index]
                      )
                    }
                  />
                }
                label={`${String.fromCharCode(65 + index)}. ${option}`}
                sx={{ mx: 0.5, width: "100%", py: 0.5 }}
              />
            </Paper>
          );
        });

      case "true_false":
        return (
          <RadioGroup
            value={answer === null ? "" : String(answer)}
            onChange={(e) => setAnswer(e.target.value === "true")}
          >
            <Paper variant="outlined" sx={{ mb: 1, borderRadius: 2 }}>
              <FormControlLabel
                value="true"
                control={<Radio color="success" />}
                label="ĐÚNG"
                sx={{ mx: 1, width: "100%" }}
              />
            </Paper>

            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              <FormControlLabel
                value="false"
                control={<Radio color="error" />}
                label="SAI"
                sx={{ mx: 1, width: "100%" }}
              />
            </Paper>
          </RadioGroup>
        );

      case "ordering": {
        const order = Array.isArray(answer) && answer.length
          ? answer
          : options.map((_, index) => index);

        return (
          <Box>
            <Alert severity="info" sx={{ mb: 1.5 }}>
              Sử dụng nút lên/xuống để sắp xếp các nội dung.
            </Alert>

            {order.map((optionIndex, position) => (
              <Paper
                key={optionIndex}
                variant="outlined"
                sx={{
                  p: 1,
                  mb: 1,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography
                  fontWeight={900}
                  color="primary"
                  width={25}
                >
                  {position + 1}.
                </Typography>

                <Typography flex={1}>
                  {options[optionIndex]}
                </Typography>

                <Button
                  size="small"
                  disabled={position === 0}
                  onClick={() => moveOrder(optionIndex, -1)}
                >
                  ↑
                </Button>

                <Button
                  size="small"
                  disabled={position === order.length - 1}
                  onClick={() => moveOrder(optionIndex, 1)}
                >
                  ↓
                </Button>
              </Paper>
            ))}
          </Box>
        );
      }

      case "fill_blank":
        return (
          <TextField
            fullWidth
            label="Câu trả lời của em"
            placeholder="Nhập câu trả lời..."
            value={answer || ""}
            onChange={(e) => setAnswer(e.target.value)}
          />
        );

      case "matching":
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 1.5 }}>
              Chọn nội dung tương ứng ở cột bên phải.
            </Alert>

            {(question.pairs || []).map((pair, index) => (
              <Box
                key={index}
                display="grid"
                gridTemplateColumns="1fr 1.2fr"
                alignItems="center"
                gap={1}
                mb={1.2}
              >
                <Paper
                  variant="outlined"
                  sx={{ p: 1.2, borderRadius: 2 }}
                >
                  <Typography fontWeight={700}>
                    {pair.left}
                  </Typography>
                </Paper>

                <TextField
                  select
                  size="small"
                  label="Chọn nội dung nối"
                  value={
                    Array.isArray(answer) && answer[index] != null
                      ? String(answer[index])
                      : ""
                  }
                  onChange={(e) => {
                    const next = [...(answer || [])];
                    next[index] = Number(e.target.value);
                    setAnswer(next);
                  }}
                >
                  {(question.pairs || []).map((item, rightIndex) => (
                    <MenuItem key={rightIndex} value={rightIndex}>
                      {item.right}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            ))}
          </Box>
        );

      default:
        return <Alert severity="warning">Dạng câu hỏi chưa được hỗ trợ.</Alert>;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: "#eff6ff",
          color: "#1e40af",
          fontWeight: 900,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        XEM TRƯỚC GIAO DIỆN HỌC SINH

        <Button
          onClick={onClose}
          color="inherit"
          sx={{ minWidth: 36 }}
        >
          <CloseRoundedIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1.5}
        >
          <Typography fontWeight={800} color="#64748b" fontSize={13}>
            CÂU HỎI
          </Typography>

          <Typography fontSize={12} color="primary" fontWeight={800}>
            BẢN XEM TRƯỚC
          </Typography>
        </Box>

        <Typography
          fontSize={18}
          fontWeight={900}
          color="#172554"
          mb={2.5}
        >
          {question.question || "Chưa nhập nội dung câu hỏi"}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {renderQuestion()}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="outlined"
          onClick={() => setAnswer(createEmptyAnswer(question.type))}
        >
          Làm lại
        </Button>

        <Button variant="contained" onClick={onClose}>
          Đóng xem trước
        </Button>
      </DialogActions>
    </Dialog>
  );
}
