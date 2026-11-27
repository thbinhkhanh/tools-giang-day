
import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Fade,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import ThemePreviewDialog from "../dialog/ThemePreviewDialog";

import {
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

// ======================================================
// DANH SÁCH BẢN ĐỒ
// ======================================================

export const MAP_THEMES = {
  tropical: {
    name: "Đảo Nhiệt Đới",
    emoji: "🏝️",
    description: "Khám phá hòn đảo xanh",
    color: "#0ea5e9",
    light: "#e0f2fe",
  },
  arctic: {
    name: "Vương Quốc Băng Giá",
    emoji: "❄️",
    description: "Chinh phục miền băng tuyết",
    color: "#6366f1",
    light: "#eef2ff",
  },
  desert: {
    name: "Sa Mạc Kim Tự Tháp",
    emoji: "🏜️",
    description: "Tìm kho báu giữa sa mạc",
    color: "#d97706",
    light: "#fef3c7",
  },
  volcano: {
    name: "Đảo Núi Lửa Thần",
    emoji: "🌋",
    description: "Vượt thử thách núi lửa",
    color: "#e11d48",
    light: "#ffe4e6",
  },
};

const THEME_KEYS = Object.keys(MAP_THEMES);

// ======================================================
// LẤY TÀI KHOẢN ĐĂNG NHẬP
// ======================================================

const getCurrentUsername = () => {
  try {
    const user = JSON.parse(
      localStorage.getItem("tools_user") || "null"
    );

    return String(user?.username || "")
      .trim()
      .toLowerCase();
  } catch {
    return "";
  }
};

// ======================================================
// COMPONENT
// ======================================================

export default function TreasureMapConfigDialog({
  open,
  onClose,
  themeId = "tropical",
  stageCount = 4,
  mode = "teacher",
  onApply,
}) {
  const [draftThemeId, setDraftThemeId] = useState(themeId);
  const [draftStageCount, setDraftStageCount] = useState(stageCount);
  const [draftMode, setDraftMode] = useState(mode);

  const [previewThemeId, setPreviewThemeId] = useState(null);

  const [savingConfig, setSavingConfig] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const currentTheme =
    MAP_THEMES[draftThemeId] || MAP_THEMES.tropical;

  // ====================================================
  // THÔNG BÁO
  // ====================================================

  const showMessage = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const closeSnackbar = () => {
    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }));
  };

  // ====================================================
  // ĐỒNG BỘ CẤU HÌNH TỪ TRANG TRÒ CHƠI
  // ====================================================

  useEffect(() => {
    if (!open) return;

    setDraftThemeId(
      MAP_THEMES[themeId] ? themeId : "tropical"
    );

    setDraftStageCount(
      Math.min(8, Math.max(3, Number(stageCount) || 4))
    );

    setDraftMode(
      ["teacher", "quiz"].includes(mode) ? mode : "teacher"
    );
  }, [open, themeId, stageCount, mode]);

  // ====================================================
  // TỰ ĐỘNG LƯU CẤU HÌNH VÀO USERS/{username}
  // ====================================================

  const saveGameConfig = async (nextConfig) => {
    const username = getCurrentUsername();

    if (!username) {
      showMessage(
        "Không xác định được tài khoản đăng nhập.",
        "error"
      );
      return false;
    }

    try {
      setSavingConfig(true);

      const userRef = doc(db, "USERS", username);

      const updates = {
        "treasureMapConfig.updatedAt": serverTimestamp(),
      };

      if (nextConfig.themeId !== undefined) {
        updates["treasureMapConfig.themeId"] =
          nextConfig.themeId;
      }

      if (nextConfig.stageCount !== undefined) {
        updates["treasureMapConfig.stageCount"] =
          nextConfig.stageCount;
      }

      if (nextConfig.mode !== undefined) {
        updates["treasureMapConfig.mode"] =
          nextConfig.mode;
      }

      await updateDoc(userRef, updates);

      return true;
    } catch (error) {
      console.error("Lỗi lưu cấu hình trò chơi:", error);

      showMessage(
        "Không thể lưu cấu hình vào Firestore.",
        "error"
      );

      return false;
    } finally {
      setSavingConfig(false);
    }
  };

  // ====================================================
  // CHỌN BẢN ĐỒ - CẬP NHẬT NGAY
  // ====================================================

  const handleSelectTheme = async (nextThemeId) => {
    if (!MAP_THEMES[nextThemeId]) return;

    setDraftThemeId(nextThemeId);

    onApply?.({
      themeId: nextThemeId,
      stageCount: draftStageCount,
      mode: draftMode,
    });

    await saveGameConfig({
      themeId: nextThemeId,
    });
  };

  // ====================================================
  // CHỌN CHẾ ĐỘ CHƠI - CẬP NHẬT NGAY
  // ====================================================

  const handleSelectMode = async (nextMode) => {
    if (!["teacher", "quiz"].includes(nextMode)) return;

    setDraftMode(nextMode);

    onApply?.({
      themeId: draftThemeId,
      stageCount: draftStageCount,
      mode: nextMode,
    });

    await saveGameConfig({
      mode: nextMode,
    });
  };

  // ====================================================
  // THAY ĐỔI SỐ CHẶNG - CẬP NHẬT NGAY
  // ====================================================

  const handleStageCountChange = async (nextCount) => {
    const count = Math.min(
      8,
      Math.max(3, Number(nextCount))
    );

    if (count === draftStageCount) return;

    setDraftStageCount(count);

    onApply?.({
      themeId: draftThemeId,
      stageCount: count,
      mode: draftMode,
    });

    await saveGameConfig({
      stageCount: count,
    });
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <>
      <Dialog
        open={open}
        onClose={() => {}}
        fullWidth
        maxWidth={false}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            width: {
              xs: "calc(100vw - 16px)",
              sm: "900px",
            },
            maxWidth: "900px",
            borderRadius: { xs: 3, sm: 3 },
            overflow: "hidden",
            maxHeight: "94vh",
          },
        }}
      >
        {/* HEADER */}

        <DialogTitle
          sx={{
            p: 2,
            color: "#fff",
            background:
              "linear-gradient(120deg, #075985, #2563eb)",
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
          >
            <Box display="flex" alignItems="center" gap={1.2}>
              <SettingsRoundedIcon sx={{ fontSize: 27 }} />

              <Box>
                <Typography
                  fontWeight={800}
                  fontSize={18}
                  lineHeight={1.3}
                >
                  CẤU HÌNH BẢN ĐỒ KHO BÁU
                </Typography>

                <Typography fontSize={12} sx={{ opacity: 0.9 }}>
                  Thiết lập bản đồ và chế độ chơi
                </Typography>
              </Box>
            </Box>

            <IconButton onClick={onClose} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            backgroundColor: "#f8fafc",
          }}
        >
          {/* 1. CHỌN BẢN ĐỒ */}

          <Box mb={2.5}>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              mb={1.2}
              mt={3}
            >
              <PublicRoundedIcon color="primary" />

              <Typography fontWeight={800} fontSize={15}>
                1. CHỌN BẢN ĐỒ
              </Typography>
            </Box>

            <Box
              display="grid"
              gridTemplateColumns={{
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(4, minmax(0, 1fr))",
              }}
              gap={1}
            >
              {THEME_KEYS.map((key) => {
                const item = MAP_THEMES[key];
                const selected = draftThemeId === key;

                return (
                  <Paper
                    key={key}
                    onClick={() => handleSelectTheme(key)}
                    elevation={0}
                    sx={{
                      p: { xs: 1, sm: 1.2 },
                      textAlign: "center",
                      cursor: "pointer",
                      borderRadius: 2,
                      border: selected
                        ? `2px solid ${item.color}`
                        : "1px solid #e2e8f0",
                      backgroundColor: selected
                        ? item.light
                        : "#fff",
                      transition: "0.2s",
                      minWidth: 0,
                      "&:hover": {
                        borderColor: item.color,
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <Typography fontSize={{ xs: 26, sm: 30 }}>
                      {item.emoji}
                    </Typography>

                    <Typography
                      fontSize={{ xs: 11, sm: 12 }}
                      fontWeight={800}
                      sx={{ lineHeight: 1.35, mt: 0.5 }}
                    >
                      {item.name}
                    </Typography>

                    <Button
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPreviewThemeId(key);
                      }}
                      sx={{
                        mt: 0.5,
                        minWidth: 0,
                        fontSize: 11,
                        textTransform: "none",
                      }}
                    >
                      Xem trước
                    </Button>

                    {selected && (
                      <CheckCircleRoundedIcon
                        sx={{
                          display: "block",
                          mx: "auto",
                          color: item.color,
                          fontSize: 18,
                          mt: 0.2,
                        }}
                      />
                    )}
                  </Paper>
                );
              })}
            </Box>

            {savingConfig && (
              <Typography
                mt={0.8}
                fontSize={12}
                color="text.secondary"
              >
                Đang lưu cấu hình...
              </Typography>
            )}
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          {/* 2. SỐ LƯỢNG CHẶNG */}

          <Box mb={2.5}>
            <Box
              display="flex"
              alignItems="center"
              gap={0.8}
              mb={1.3}
            >
              <SettingsRoundedIcon
                sx={{ fontSize: 22, color: "#2563eb" }}
              />

              <Typography
                fontSize={14}
                fontWeight={900}
                color="#172554"
              >
                2. SỐ LƯỢNG CHẶNG
              </Typography>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 3,
                border: "1px solid #dbeafe",
                background:
                  "linear-gradient(110deg,#eff6ff 0%,#fff 65%,#f0f9ff 100%)",
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap={1}
              >
                <Box minWidth={0}>
                  <Typography
                    fontSize={14}
                    fontWeight={800}
                    color="#334155"
                  >
                    Hành trình khám phá
                  </Typography>

                  <Typography
                    mt={0.35}
                    fontSize={12}
                    color="#64748b"
                  >
                    Từ 3 đến 8 chặng
                  </Typography>
                </Box>

                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  flexShrink={0}
                >
                  <IconButton
                    size="small"
                    disabled={draftStageCount <= 3}
                    onClick={() =>
                      handleStageCountChange(draftStageCount - 1)
                    }
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      color: "#2563eb",
                      border: "1px solid #bfdbfe",
                      bgcolor: "#fff",
                    }}
                  >
                    <Typography fontSize={22} lineHeight={1}>
                      −
                    </Typography>
                  </IconButton>

                  <Box minWidth={65} textAlign="center">
                    <Typography
                      fontSize={24}
                      lineHeight={1.1}
                      fontWeight={900}
                      color="#1d4ed8"
                    >
                      {draftStageCount}
                    </Typography>

                    <Typography
                      fontSize={11}
                      fontWeight={800}
                      color="#64748b"
                    >
                      CHẶNG
                    </Typography>
                  </Box>

                  <IconButton
                    size="small"
                    disabled={draftStageCount >= 8}
                    onClick={() =>
                      handleStageCountChange(draftStageCount + 1)
                    }
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      color: "#fff",
                      bgcolor: "#2563eb",
                      "&:hover": {
                        bgcolor: "#1d4ed8",
                      },
                      "&.Mui-disabled": {
                        bgcolor: "#e2e8f0",
                        color: "#94a3b8",
                      },
                    }}
                  >
                    <AddRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Box
                display="flex"
                alignItems="center"
                gap={0.5}
                mt={1.6}
              >
                {Array.from({ length: 8 }, (_, index) => (
                  <Box
                    key={index}
                    flex={1}
                    height={7}
                    borderRadius={5}
                    bgcolor={
                      index < draftStageCount
                        ? "#3b82f6"
                        : "#e2e8f0"
                    }
                  />
                ))}
              </Box>
            </Paper>
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          {/* 3. CHẾ ĐỘ CHƠI */}

          <Box mb={2}>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              mb={1}
            >
              <SchoolRoundedIcon color="primary" />

              <Typography fontWeight={800} fontSize={15}>
                3. CHẾ ĐỘ CHƠI
              </Typography>
            </Box>

            <Box
              display="grid"
              gridTemplateColumns="repeat(2, minmax(0, 1fr))"
              gap={1.2}
            >
              <Paper
                onClick={() => handleSelectMode("teacher")}
                elevation={0}
                sx={{
                  p: 1.5,
                  cursor: "pointer",
                  borderRadius: 2,
                  border:
                    draftMode === "teacher"
                      ? "2px solid #0284c7"
                      : "1px solid #e2e8f0",
                  background:
                    draftMode === "teacher" ? "#e0f2fe" : "#fff",
                }}
              >
                <Typography fontSize={25} textAlign="center">
                  👩‍🏫
                </Typography>

                <Typography
                  fontWeight={800}
                  fontSize={14}
                  textAlign="center"
                >
                  GV điều khiển
                </Typography>

                <Typography
                  fontSize={12}
                  color="text.secondary"
                  textAlign="center"
                >
                  Giáo viên điều khiển trò chơi
                </Typography>

                {draftMode === "teacher" && (
                  <CheckCircleRoundedIcon
                    sx={{
                      display: "block",
                      mx: "auto",
                      mt: 0.5,
                      color: "#0284c7",
                    }}
                  />
                )}
              </Paper>

              <Paper
                onClick={() => handleSelectMode("quiz")}
                elevation={0}
                sx={{
                  p: 1.5,
                  cursor: "pointer",
                  borderRadius: 2,
                  border:
                    draftMode === "quiz"
                      ? "2px solid #0284c7"
                      : "1px solid #e2e8f0",
                  background:
                    draftMode === "quiz" ? "#e0f2fe" : "#fff",
                }}
              >
                <Typography fontSize={25} textAlign="center">
                  🧑‍🎓
                </Typography>

                <Typography
                  fontWeight={800}
                  fontSize={14}
                  textAlign="center"
                >
                  HS trả lời
                </Typography>

                <Typography
                  fontSize={12}
                  color="text.secondary"
                  textAlign="center"
                >
                  Học sinh chọn đáp án
                </Typography>

                {draftMode === "quiz" && (
                  <CheckCircleRoundedIcon
                    sx={{
                      display: "block",
                      mx: "auto",
                      mt: 0.5,
                      color: "#0284c7",
                    }}
                  />
                )}
              </Paper>
            </Box>
          </Box>

          {/* TỔNG QUAN */}

          <Paper
            elevation={0}
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              border: "1px solid #bae6fd",
              backgroundColor: "#f0f9ff",
            }}
          >
            <Typography
              fontSize={14}
              fontWeight={800}
              color="#075985"
              mb={1}
            >
              TỔNG QUAN CẤU HÌNH
            </Typography>

            <Box display="flex" flexDirection="column" gap={0.6}>
              <Typography fontSize={13} color="#334155">
                <strong>Bản đồ:</strong>{" "}
                {currentTheme.emoji} {currentTheme.name}
              </Typography>

              <Typography fontSize={13} color="#334155">
                <strong>Số chặng:</strong> {draftStageCount} chặng
              </Typography>

              <Typography fontSize={13} color="#334155">
                <strong>Chế độ:</strong>{" "}
                {draftMode === "quiz"
                  ? "HS trả lời"
                  : "GV điều khiển"}
              </Typography>
            </Box>
          </Paper>
        </DialogContent>

        {/* FOOTER */}
      </Dialog>

      {/* THÔNG BÁO */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={closeSnackbar}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* XEM TRƯỚC BẢN ĐỒ */}

      <ThemePreviewDialog
        open={Boolean(previewThemeId)}
        themeId={previewThemeId}
        theme={MAP_THEMES[previewThemeId]}
        onClose={() => setPreviewThemeId(null)}
        onSelect={() => {
          if (previewThemeId) {
            handleSelectTheme(previewThemeId);
          }
          setPreviewThemeId(null);
        }}
      />
    </>
  );
}
