
import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  TextField,
  Chip,
  Divider,
} from "@mui/material";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

import CloseIcon from "@mui/icons-material/Close";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";

const PRESETS = [1, 2, 3, 5];

const DEFAULT_BACKGROUND = "";

const BACKGROUNDS = [
  { label: "Mặc định", value: "" },
  ...Array.from({ length: 13 }, (_, index) => ({
    label: `Hình nền ${index + 1}`,
    value: `/header-background-${index + 1}.png`,
  })),
];

export default function TimeLimitDialog({
  open,
  onClose,
  timeLimitMinutes = 10,
  headerBackground = DEFAULT_BACKGROUND,
  onChangeBackground,
}) {
  const [minutes, setMinutes] = useState(timeLimitMinutes);

  const [selectedBackground, setSelectedBackground] =
    useState(headerBackground);

  const [savingMinutes, setSavingMinutes] = useState(false);
  const [savingBackground, setSavingBackground] = useState(false);

  // Lấy tài khoản đang đăng nhập
  const getUsername = () => {
    const currentUser = JSON.parse(
      localStorage.getItem("tools_user") || "null"
    );

    return String(currentUser?.username || "")
      .trim()
      .toLowerCase();
  };

  // Đọc cấu hình từ Firestore
  useEffect(() => {
    if (!open) return;

    let active = true;

    const loadSettings = async () => {
      try {
        const username = getUsername();

        if (!username) return;

        const userSnap = await getDoc(
          doc(db, "USERS", username)
        );

        if (!active || !userSnap.exists()) return;

        const data = userSnap.data();

        const background =
          data.headerBackground ?? DEFAULT_BACKGROUND;

        setSelectedBackground(background);
        onChangeBackground?.(background);

        if (Number(data.timeLimitMinutes) > 0) {
          setMinutes(Number(data.timeLimitMinutes));
        }
      } catch (error) {
        console.error("Lỗi tải cấu hình:", error);
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setMinutes(timeLimitMinutes);
    }
  }, [open, timeLimitMinutes]);

  // Lưu thời gian vào Firestore
  const saveMinutes = async (value) => {
    if (
      !Number.isInteger(Number(value)) ||
      Number(value) < 1 ||
      Number(value) > 99 ||
      savingMinutes
    ) {
      return;
    }

    const username = getUsername();

    if (!username) {
      alert("Không xác định được tài khoản đăng nhập!");
      return;
    }

    try {
      setSavingMinutes(true);

      await setDoc(
        doc(db, "USERS", username),
        {
          timeLimitMinutes: Number(value),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMinutes(Number(value));
    } catch (error) {
      console.error("Lỗi lưu thời gian:", error);
      alert("Không thể lưu thời gian làm bài!");
    } finally {
      setSavingMinutes(false);
    }
  };

  // Chọn thời gian nhanh
  const handleSelectPreset = (value) => {
    setMinutes(value);
    saveMinutes(value);
  };

  // Nhập thời gian tùy chỉnh
  const handleMinutesChange = (event) => {
    const value = event.target.value;

    setMinutes(value === "" ? "" : value);

    if (value === "") return;

    const number = Number(value);

    if (
      Number.isInteger(number) &&
      number >= 1 &&
      number <= 99
    ) {
      saveMinutes(number);
    }
  };

  // Chọn hình nền
  const handleSelectBackground = async (image) => {
    if (
      savingBackground ||
      image === selectedBackground
    ) {
      return;
    }

    const username = getUsername();

    if (!username) {
      alert("Không xác định được tài khoản đăng nhập!");
      return;
    }

    try {
      setSavingBackground(true);

      await setDoc(
        doc(db, "USERS", username),
        {
          headerBackground: image,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSelectedBackground(image);
      onChangeBackground?.(image);
    } catch (error) {
      console.error("Lỗi lưu hình nền:", error);
      alert("Không thể lưu hình nền!");
    } finally {
      setSavingBackground(false);
    }
  };

  const handleClose = (event, reason) => {
    if (reason === "backdropClick") return;
    onClose?.();
  };

  const validMinutes =
    minutes !== "" &&
    Number.isInteger(Number(minutes)) &&
    Number(minutes) >= 1 &&
    Number(minutes) <= 99;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          width: { xs: "calc(100% - 16px)", sm: "100%" },
          maxWidth: { xs: "none", sm: "650px" },
          m: { xs: "8px", sm: 3 },
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: "#ffffff",
          boxShadow: "none",
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 1.5,
          color: "#ffffff",
          background: "linear-gradient(135deg,#1d4ed8,#0891b2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(255,255,255,.2)",
            }}
          >
            <AccessTimeRoundedIcon sx={{ fontSize: 25 }} />
          </Box>

          <Box>
            <Typography fontWeight={900} fontSize={16}>
              CẤU HÌNH PHIẾU HỌC TẬP
            </Typography>

            <Typography fontSize={11} sx={{ opacity: 0.85 }}>
              Thời gian và hình nền phiếu học tập
            </Typography>
          </Box>
        </Stack>

        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: "#ffffff",
            "&:hover": {
              bgcolor: "rgba(255,255,255,.15)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 2,
          bgcolor: "#ffffff",
        }}
      >
        {/* THỜI GIAN LÀM BÀI */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          mb={1.2}
        >
          <AccessTimeRoundedIcon
            color="primary"
            sx={{ fontSize: 21 }}
          />

          <Typography
            fontWeight={900}
            fontSize={14}
            color="primary.dark"
          >
            THỜI GIAN LÀM BÀI
          </Typography>
        </Stack>

        {/* BỐ CỤC 2 CỘT */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "0.85fr 1.5fr",
            },
            gap: 1.5,
            alignItems: "stretch",
          }}
        >
          {/* CỘT TRÁI: THỜI LƯỢNG ĐƯỢC CHỌN */}
          <Box
            sx={{
              minHeight: { xs: 105, sm: 145 },
              p: 2,
              borderRadius: 2.5,
              bgcolor: "#eff6ff",
              border: "1px solid #bfdbfe",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 0.7,
                color: "#475569",
                mb: 0.5,
              }}
            >
              THỜI LƯỢNG ĐƯỢC CHỌN
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: 34, sm: 40 },
                fontWeight: 900,
                color: "#2563eb",
                lineHeight: 1.2,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {minutes === "" ? "--" : minutes}
            </Typography>

            <Typography
              sx={{
                mt: 0.3,
                fontSize: 14,
                fontWeight: 800,
                color: "#2563eb",
              }}
            >
              phút
            </Typography>
          </Box>

          {/* CỘT PHẢI: CHỌN NHANH VÀ NHẬP THỜI GIAN */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 1.3,
            }}
          >
            <Box>
              <Typography
                sx={{
                  mb: 0.8,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: 0.6,
                  color: "#475569",
                }}
              >
                CHỌN THỜI GIAN NHANH
              </Typography>

              <Stack
                direction="row"
                spacing={0.8}
                sx={{ width: "100%" }}
              >
                {PRESETS.map((value) => {
                  const selected = Number(minutes) === value;

                  return (
                    <Chip
                      key={value}
                      label={`${value} phút`}
                      clickable
                      disabled={savingMinutes}
                      onClick={() => handleSelectPreset(value)}
                      sx={{
                        flex: 1,
                        height: 35,
                        fontWeight: 900,
                        fontSize: 12,
                        borderRadius: 2,
                        bgcolor: selected ? "#2563eb" : "#f1f5f9",
                        color: selected ? "#ffffff" : "#475569",
                        border: selected
                          ? "1px solid #2563eb"
                          : "1px solid #e2e8f0",
                        "&:hover": {
                          bgcolor: selected ? "#1d4ed8" : "#e2e8f0",
                        },
                        "& .MuiChip-label": {
                          px: 0.8,
                        },
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            <Box>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Thời gian tùy chỉnh (phút)"
                value={minutes}
                onChange={handleMinutesChange}
                inputProps={{
                  min: 1,
                  max: 99,
                  step: 1,
                }}
                error={minutes !== "" && !validMinutes}
                helperText={
                  minutes !== "" && !validMinutes
                    ? "Vui lòng nhập từ 1 đến 99 phút."
                    : savingMinutes
                      ? "Đang lưu thời gian..."
                      : "Thời gian hợp lệ được lưu tự động."
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: "#ffffff",
                  },
                  "& .MuiFormHelperText-root": {
                    fontSize: 10,
                    mt: 0.4,
                    mx: 0.2,
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* CHỌN HÌNH NỀN */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          mb={1.2}
        >
          <ImageRoundedIcon
            color="primary"
            sx={{ fontSize: 21 }}
          />

          <Typography
            fontWeight={900}
            fontSize={14}
            color="primary.dark"
          >
            HÌNH NỀN
          </Typography>
        </Stack>

        {/* LƯỚI HÌNH NỀN */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: { xs: 0.8, sm: 1 },
          }}
        >
          {BACKGROUNDS.map((background) => {
            const selected =
              selectedBackground === background.value;

            return (
              <Box
                key={background.label}
                onClick={() =>
                  handleSelectBackground(background.value)
                }
                sx={{
                  cursor: savingBackground ? "wait" : "pointer",
                  opacity: savingBackground ? 0.65 : 1,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: selected
                    ? "2px solid #2563eb"
                    : "1px solid #cbd5e1",
                  bgcolor: selected ? "#eff6ff" : "#fff",
                  transition: "all 0.2s",
                  minWidth: 0,
                  "&:hover": {
                    borderColor: "#2563eb",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                {/* ẢNH XEM TRƯỚC */}
                <Box
                  sx={{
                    height: { xs: 60, sm: 75 },
                    width: "100%",
                    overflow: "hidden",
                    bgcolor: "#e2e8f0",
                    position: "relative",
                  }}
                >
                  {background.value ? (
                    <Box
                      component="img"
                      src={background.value}
                      alt={background.label}
                      onError={(event) => {
                        console.error(
                          "Lỗi tải ảnh:",
                          background.value
                        );

                        event.currentTarget.style.display = "none";
                      }}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        background:
                          "linear-gradient(120deg, #38bdf8 0%, #0288cc 50%, #0ea5e9 100%)",
                      }}
                    />
                  )}
                </Box>

                <Box
                  sx={{
                    px: 0.8,
                    py: 0.6,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.3,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 0.4,
                    }}
                  >
                    <Typography
                      fontSize={11}
                      fontWeight={800}
                      color={
                        selected ? "primary.main" : "text.primary"
                      }
                      noWrap
                    >
                      {background.label}
                    </Typography>

                    {selected && (
                      <Chip
                        label="Đang chọn"
                        color="primary"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: 9,
                          fontWeight: 800,
                          "& .MuiChip-label": {
                            px: 0.7,
                          },
                        }}
                      />
                    )}
                  </Box>

                  <Typography
                    fontSize={9}
                    color="text.secondary"
                    noWrap
                    title={background.value || "Nền mặc định"}
                  >
                    {background.value || "Nền mặc định"}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* NÚT ĐÓNG */}
        <Box sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<CloseIcon />}
            onClick={handleClose}
            sx={{
              py: 0.9,
              borderRadius: 2,
              fontWeight: 900,
              textTransform: "none",
              borderColor: "#cbd5e1",
              color: "#475569",
            }}
          >
            Đóng
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
