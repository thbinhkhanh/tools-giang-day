
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
} from "@mui/material";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

import CloseIcon from "@mui/icons-material/Close";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

const PRESETS = [1, 2, 3, 5];

export default function TimeLimitDialog({
  open,
  onClose,
  timeLimitMinutes = 10,
  onSave,
}) {

const currentUser = JSON.parse(
  localStorage.getItem("tools_user") || "null"
);

const username = currentUser?.username;
  const [minutes, setMinutes] = useState(timeLimitMinutes);

  useEffect(() => {
    if (open) {
      setMinutes(timeLimitMinutes);
    }
  }, [open, timeLimitMinutes]);

  const handleMinutesChange = (event) => {
    const value = event.target.value;

    if (value === "") {
      setMinutes("");
      return;
    }

    setMinutes(value);
  };

  const handleSelectPreset = (value) => {
    setMinutes(value);
  };

  const handleSave = async () => {
    const value = Number(minutes);

    if (!Number.isInteger(value) || value < 1 || value > 99) {
        return;
    }

    if (!username) {
        alert("Không xác định được tài khoản đăng nhập!");
        return;
    }

    try {
        const userRef = doc(db, "USERS", username);

        await setDoc(
        userRef,
        {
            timeLimitMinutes: value,
            updatedAt: serverTimestamp(),
        },
        { merge: true }
        );

        // Cập nhật thời gian ở component cha
        onSave?.(value);

        onClose?.();
    } catch (error) {
        console.error("Lỗi lưu thời gian:", error);
        alert("Không thể lưu thời gian làm bài!");
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
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          width: { xs: "calc(100% - 8px)", sm: "100%" },
          maxWidth: { xs: "none", sm: "444px" },
          m: { xs: "4px", sm: 3 },
          borderRadius: 4,
          overflow: "hidden",
          bgcolor: "#ffffff",
          boxShadow: "none",
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          px: 3,
          py: 2.2,
          color: "#ffffff",
          background: "linear-gradient(135deg,#1d4ed8,#0891b2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.3}>
          <Box
            sx={{
              width: 43,
              height: 43,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(255,255,255,.2)",
            }}
          >
            <AccessTimeRoundedIcon sx={{ fontSize: 28 }} />
          </Box>

          <Box>
            <Typography fontWeight={900} fontSize={17}>
              THỜI GIAN LÀM BÀI
            </Typography>

            <Typography fontSize={12} sx={{ opacity: 0.85 }}>
              Thiết lập thời lượng cho phiếu học tập
            </Typography>
          </Box>
        </Stack>

        <IconButton
          onClick={handleClose}
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
          px: { xs: 2.5, sm: 3 },
          py: 3,
          bgcolor: "#ffffff",
        }}
      >
        {/* THỜI GIAN HIỆN TẠI */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: 3,
            textAlign: "center",
            bgcolor: "#eff6ff",
            border: "1px solid #bfdbfe",
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 0.8,
              color: "#475569",
            }}
          >
            THỜI LƯỢNG ĐƯỢC CHỌN
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              fontSize: 42,
              fontWeight: 900,
              color: "#2563eb",
              lineHeight: 1.3,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {minutes === "" ? "--" : minutes}
            <Box
              component="span"
              sx={{ ml: 1, fontSize: 18, fontWeight: 800 }}
            >
              phút
            </Box>
          </Typography>
        </Box>

        {/* CHỌN NHANH */}
        <Box sx={{ mt: 2.5 }}>
          <Typography
            sx={{
              mb: 1.3,
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 0.7,
              color: "#475569",
            }}
          >
            CHỌN THỜI GIAN NHANH
          </Typography>

          <Stack direction="row" spacing={1}>
            {PRESETS.map((value) => {
              const selected = Number(minutes) === value;

              return (
                <Chip
                  key={value}
                  label={`${value} phút`}
                  clickable
                  onClick={() => handleSelectPreset(value)}
                  sx={{
                    flex: 1,
                    height: 40,
                    fontWeight: 900,
                    borderRadius: 2.5,
                    bgcolor: selected ? "#dbeafe" : "#f1f5f9",
                    color: selected ? "#1d4ed8" : "#475569",
                    border: selected
                      ? "1px solid #93c5fd"
                      : "1px solid transparent",
                    "&:hover": {
                      bgcolor: selected ? "#bfdbfe" : "#e2e8f0",
                    },
                    "& .MuiChip-label": {
                      px: 0.5,
                    },
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        {/* NHẬP THỜI GIAN */}
        <Box sx={{ mt: 2.5 }}>
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
                : "Có thể nhập thời gian từ 1 đến 99 phút."
            }
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.5,
                bgcolor: "#ffffff",
              },
              "& .MuiInputLabel-root": {
                fontWeight: 600,
              },
            }}
          />
        </Box>

        {/* NÚT LƯU */}
        <Stack direction="row" spacing={1.2} sx={{ mt: 2.5 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={handleClose}
            sx={{
              flex: 1,
              py: 1.3,
              borderRadius: 2.5,
              fontWeight: 900,
              fontSize: 14,
              textTransform: "none",
              borderColor: "#cbd5e1",
              color: "#475569",
              "&:hover": {
                borderColor: "#2563eb",
                bgcolor: "#eff6ff",
              },
            }}
          >
            Hủy
          </Button>

          <Button
            fullWidth
            variant="contained"
            startIcon={<SaveRoundedIcon />}
            onClick={handleSave}
            disabled={!validMinutes}
            sx={{
              flex: 1,
              py: 1.3,
              borderRadius: 2.5,
              fontWeight: 900,
              fontSize: 14,
              textTransform: "none",
              background: "linear-gradient(135deg,#2563eb,#0891b2)",
              boxShadow: "none",
              "&:hover": {
                background: "linear-gradient(135deg,#1d4ed8,#0e7490)",
                boxShadow: "none",
              },
            }}
          >
            Lưu cấu hình
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
