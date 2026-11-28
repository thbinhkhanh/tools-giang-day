
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Stack,
  Fade,
  MenuItem,
  CircularProgress,
} from "@mui/material";

import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";

import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

import DialogHeader from "./DialogHeader";

const paperSx = {
  borderRadius: 3,
  border: "1px solid #e2e8f0",
  bgcolor: "#fff",
  boxShadow: "none",
};

const primaryButtonSx = {
  borderRadius: 2.5,
  fontWeight: 900,
  textTransform: "none",
  background: "linear-gradient(90deg,#2563eb,#0ea5e9)",
  boxShadow: "0 5px 14px rgba(37,99,235,.18)",
  "&:hover": {
    background: "linear-gradient(90deg,#1d4ed8,#0284c7)",
  },
  "&.Mui-disabled": {
    color: "#fff",
    opacity: 0.5,
  },
};

export default function ArenaConfigDialog({
  open,
  onClose,
  duration,
  setDuration,
  questionLimit,
  setQuestionLimit,
  pointsPerQuestion,
  setPointsPerQuestion,
  totalQuestions = 0,
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const currentUser = JSON.parse(
        localStorage.getItem("tools_user") || "{}"
      );

      const username = currentUser?.username;

      if (!username) {
        throw new Error("Không xác định được tài khoản đăng nhập.");
      }

      const config = {
        duration: Number(duration),
        questionLimit:
          questionLimit === "all"
            ? "all"
            : Math.max(1, Number(questionLimit) || 1),
        pointsPerQuestion: Number(pointsPerQuestion),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "USERS", username), {
        knowledgeArenaConfig: config,
      });

      onClose();
    } catch (err) {
      console.error("Lỗi lưu cấu hình cuộc thi:", err);
      setError(err.message || "Không thể lưu cấu hình cuộc thi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          display: "flex",
          flexDirection: "column",
          height: "min(590px, 90vh)",
          maxHeight: "90vh",
          overflow: "hidden",
          borderRadius: 3,
        },
      }}
    >
      <DialogHeader
        title="CẤU HÌNH CUỘC THI"
        subtitle="Tùy chỉnh thử thách theo cách của bạn"
        icon={<SettingsRoundedIcon />}
        onClose={onClose}
      />

      <DialogContent
        sx={{
          p: 2,
          overflowY: "auto",
          minHeight: 0,
          flex: 1,
          bgcolor: "#f8fbff",
        }}
      >
        <Stack spacing={1.5}>
          {/* THỜI GIAN */}
          <Paper sx={{ ...paperSx, p: 1.8 }}>
            <Stack spacing={1.3}>
              <Stack direction="row" alignItems="center" spacing={1.2}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2.5,
                    display: "grid",
                    placeItems: "center",
                    color: "#2563eb",
                    bgcolor: "#eff6ff",
                  }}
                >
                  <TimerRoundedIcon />
                </Box>

                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 1000 }}>
                    THỜI GIAN TRẢ LỜI
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>
                    Thời gian tối đa cho mỗi câu hỏi
                  </Typography>
                </Box>
              </Stack>

              <TextField
                select
                fullWidth
                size="small"
                label="Thời gian mỗi câu"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                {[10, 15, 20, 30, 45, 60].map((value) => (
                  <MenuItem key={value} value={value}>
                    {value} giây
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Paper>

          {/* SỐ LƯỢNG CÂU HỎI */}
          <Paper sx={{ ...paperSx, p: 1.8 }}>
            <Stack spacing={1.3}>
              <Stack direction="row" alignItems="center" spacing={1.2}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2.5,
                    display: "grid",
                    placeItems: "center",
                    color: "#7c3aed",
                    bgcolor: "#f5f3ff",
                  }}
                >
                  <QuizRoundedIcon />
                </Box>

                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 1000 }}>
                    SỐ LƯỢNG CÂU HỎI
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>
                    Hiện có {totalQuestions} câu hỏi hợp lệ
                  </Typography>
                </Box>
              </Stack>

              <TextField
                fullWidth
                size="small"
                type="number"
                label="Nhập số câu hỏi"
                value={questionLimit === "all" ? "" : questionLimit}
                onChange={(e) => {
                  const value = e.target.value;

                  if (value === "") {
                    setQuestionLimit("all");
                  } else {
                    setQuestionLimit(Math.max(1, Number(value)));
                  }
                }}
                inputProps={{
                  min: 1,
                  max: totalQuestions || undefined,
                  step: 1,
                }}
                helperText="Để trống để sử dụng tất cả câu hỏi hiện có."
              />

              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: "#f5f3ff",
                  color: "#6d28d9",
                }}
              >
                <Typography sx={{ fontSize: 10, fontWeight: 800 }}>
                  {questionLimit === "all"
                    ? `Sẽ sử dụng toàn bộ ${totalQuestions} câu hỏi`
                    : `Đã chọn ${questionLimit} câu hỏi`}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* ĐIỂM THƯỞNG */}
          <Paper sx={{ ...paperSx, p: 1.8 }}>
            <Stack spacing={1.3}>
              <Stack direction="row" alignItems="center" spacing={1.2}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2.5,
                    display: "grid",
                    placeItems: "center",
                    color: "#d97706",
                    bgcolor: "#fffbeb",
                  }}
                >
                  <EmojiEventsRoundedIcon />
                </Box>

                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 1000 }}>
                    ĐIỂM THƯỞNG
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>
                    Điểm cộng khi trả lời chính xác
                  </Typography>
                </Box>
              </Stack>

              <TextField
                select
                fullWidth
                size="small"
                label="Điểm cho mỗi câu đúng"
                value={pointsPerQuestion}
                onChange={(e) =>
                  setPointsPerQuestion(Number(e.target.value))
                }
              >
                {[5, 10, 15, 20, 25].map((value) => (
                  <MenuItem key={value} value={value}>
                    {value} điểm
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Paper>

          {error && (
            <Typography
              sx={{
                fontSize: 11,
                color: "#dc2626",
                fontWeight: 700,
              }}
            >
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: 1.5,
          borderTop: "1px solid #e2e8f0",
          flexShrink: 0,
          bgcolor: "#fff",
        }}
      >
        <Button
          onClick={handleSave}
          variant="contained"
          fullWidth
          disabled={saving}
          sx={primaryButtonSx}
        >
          {saving ? (
            <CircularProgress size={19} color="inherit" />
          ) : (
            "HOÀN TẤT"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
