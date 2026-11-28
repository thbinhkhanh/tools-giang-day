
import React from "react";
import {
  Menu,
  Box,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import LockResetIcon from "@mui/icons-material/LockReset";
import LogoutIcon from "@mui/icons-material/Logout";

const AccountMenu = ({
  anchorEl,
  openMenu,
  handleMenuClose,
  handleOpenProfile,
  setOpenChangePassword,
  handleLogout,
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={openMenu}
      onClose={handleMenuClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      PaperProps={{
        sx: {
          width: 200,
          minWidth: 200,
          overflow: "hidden",
          boxShadow: "0 12px 35px rgba(0,0,0,0.18)",
          borderRadius: 2,
          p: 0,
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: "#fff",
          fontWeight: 600,
          fontSize: 14,
          borderBottom: "1px solid #eee",
          color: "#d32f2f",
        }}
      >
        TÀI KHOẢN
      </Box>

      {/* CẬP NHẬT THÔNG TIN */}
      <Box
        onClick={handleOpenProfile}
        sx={{
          px: 2,
          py: 1.5,
          cursor: "pointer",
          bgcolor: "#f5f7fa",
          display: "flex",
          alignItems: "center",
          gap: 1,
          transition: "0.2s",
          "&:hover": {
            bgcolor: "#e9eef5",
          },
        }}
      >
        <PersonIcon sx={{ fontSize: 18, color: "#1976d2" }} />
        Cập nhật thông tin
      </Box>

      {/* ĐỔI MẬT KHẨU */}
      <Box
        onClick={() => {
          handleMenuClose();
          setOpenChangePassword(true);
        }}
        sx={{
          px: 2,
          py: 1.5,
          cursor: "pointer",
          bgcolor: "#f5f7fa",
          display: "flex",
          alignItems: "center",
          gap: 1,
          transition: "0.2s",
          "&:hover": {
            bgcolor: "#e9eef5",
          },
        }}
      >
        <LockResetIcon sx={{ fontSize: 18, color: "#1976d2" }} />
        Đổi mật khẩu
      </Box>

      {/* PHÂN CÁCH */}
      <Box
        sx={{
          height: "1px",
          bgcolor: "#e5e7eb",
          mx: 1,
        }}
      />

      {/* ĐĂNG XUẤT */}
      <Box
        onClick={() => {
          handleMenuClose();
          handleLogout();
        }}
        sx={{
          px: 2,
          py: 1.5,
          cursor: "pointer",
          bgcolor: "#f5f7fa",
          display: "flex",
          alignItems: "center",
          gap: 1,
          transition: "0.2s",
          "&:hover": {
            bgcolor: "#fee2e2",
          },
        }}
      >
        <LogoutIcon sx={{ fontSize: 18, color: "#d32f2f" }} />
        Đăng xuất
      </Box>
    </Menu>
  );
};

export default AccountMenu;
