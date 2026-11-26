
import React from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";

export default function UpdateProfileDialog({
  open,
  onClose,
  user,
  profileData,
  setProfileData,
  loadingProfile,
  savingProfile,
  profileError,
  onSave,
}) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!savingProfile) onClose();
      }}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      {/* TIÊU ĐỀ */}
      <DialogTitle
        sx={{
          bgcolor: "#1976d2",
          color: "#fff",
          fontWeight: 600,
          fontSize: 18,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <PersonIcon />
        CẬP NHẬT THÔNG TIN
      </DialogTitle>

      {/* NỘI DUNG */}
      <DialogContent
        sx={{
          pt: "24px !important",
          px: 3,
          pb: 2,
        }}
      >
        {loadingProfile ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 5,
            }}
          >
            <CircularProgress size={30} />
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2.2,
              mt: 1,
            }}
          >
            {/* TÊN ĐĂNG NHẬP */}
            <TextField
              label="Tên đăng nhập"
              value={user?.username || ""}
              fullWidth
              size="small"
              disabled
            />

            {/* HỌ VÀ TÊN */}
            <TextField
              label="Họ và tên"
              value={profileData.hoVaTen}
              onChange={(e) =>
                setProfileData((prev) => ({
                  ...prev,
                  hoVaTen: e.target.value,
                }))
              }
              fullWidth
              size="small"
              required
              placeholder="Nhập họ và tên"
            />

            {/* LỚP DẠY */}
            <TextField
              label="Lớp dạy"
              value={profileData.lopDay}
              onChange={(e) =>
                setProfileData((prev) => ({
                  ...prev,
                  lopDay: e.target.value,
                }))
              }
              fullWidth
              size="small"
              required
              placeholder="Ví dụ: 4.3"
            />

            {/* TÊN TRƯỜNG */}
            <TextField
              label="Tên trường"
              value={profileData.tenTruong}
              onChange={(e) =>
                setProfileData((prev) => ({
                  ...prev,
                  tenTruong: e.target.value,
                }))
              }
              fullWidth
              size="small"
              required
              placeholder="Nhập tên trường"
            />

            {/* THÔNG BÁO LỖI */}
            {profileError && (
              <Alert severity="error">
                {profileError}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      {/* NÚT CHỨC NĂNG */}
      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
          pt: 1,
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          color="inherit"
          disabled={savingProfile}
          sx={{
            textTransform: "none",
          }}
        >
          Đóng
        </Button>

        <Button
          variant="contained"
          onClick={onSave}
          disabled={loadingProfile || savingProfile}
          startIcon={
            savingProfile ? (
              <CircularProgress size={16} color="inherit" />
            ) : null
          }
          sx={{
            textTransform: "none",
            minWidth: 130,
            borderRadius: 2,
            boxShadow: "none",
          }}
        >
          {savingProfile ? "Đang lưu..." : "Lưu thông tin"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
