
import React, { useState, useEffect } from "react";

import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  Box,
  IconButton,
  Menu,
} from "@mui/material";

import AppsIcon from "@mui/icons-material/Apps";
import LockResetIcon from "@mui/icons-material/LockReset";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

import Auth from "./pages/Auth";
import Tools from "./pages/Tools";
import ChangePasswordDialog from "./dialog/ChangePasswordDialog";
import UpdateProfileDialog from "./dialog/UpdateProfileDialog";

import { StudentProvider } from "./context/StudentContext";

import QuestionEngineTest from "./components/QuestionEngine/QuestionEngineTest";

export default function App() {

  //return <QuestionEngineTest />;
  // =====================================================
  // STATE
  // =====================================================

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tools_user") || "null");
    } catch {
      localStorage.removeItem("tools_user");
      return null;
    }
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const [openChangePw, setOpenChangePw] = useState(false);
  const [openLogo, setOpenLogo] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  

  // CẬP NHẬT THÔNG TIN
  const [openProfile, setOpenProfile] = useState(false);

  const [profileData, setProfileData] = useState({
    hoVaTen: "",
    lopDay: "",
    tenTruong: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const openMenu = Boolean(anchorEl);

  // =====================================================
  // ĐĂNG NHẬP
  // =====================================================

  const handleLogin = (profile) => {
    localStorage.setItem("tools_user", JSON.stringify(profile));
    setUser(profile);
  };

  // =====================================================
  // ĐĂNG XUẤT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("tools_user");
    setUser(null);
    setAnchorEl(null);
  };

  // =====================================================
  // MENU
  // =====================================================

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // =====================================================
  // MỞ DIALOG CẬP NHẬT THÔNG TIN
  // =====================================================

  const handleOpenProfile = async () => {
    handleMenuClose();

    setOpenProfile(true);
    setProfileError("");
    setLoadingProfile(true);

    try {
      const username = user?.username;

      if (!username) {
        throw new Error("Không xác định được tài khoản!");
      }

      const userRef = doc(db, "USERS", username);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();

        setProfileData({
          hoVaTen: data.hoVaTen || "",
          lopDay: data.lopDay || "",
          tenTruong: data.tenTruong || "",
        });
      } else {
        setProfileData({
          hoVaTen: user.hoVaTen || "",
          lopDay: user.lopDay || "",
          tenTruong: user.tenTruong || "",
        });
      }
    } catch (error) {
      console.error("Lỗi tải thông tin:", error);
      setProfileError("Không thể tải thông tin tài khoản!");
    } finally {
      setLoadingProfile(false);
    }
  };

  // =====================================================
  // LƯU THÔNG TIN
  // =====================================================

  const handleSaveProfile = async () => {
    if (!profileData.hoVaTen.trim()) {
      setProfileError("Vui lòng nhập họ và tên!");
      return;
    }

    if (!profileData.lopDay.trim()) {
      setProfileError("Vui lòng nhập lớp dạy!");
      return;
    }

    if (!profileData.tenTruong.trim()) {
      setProfileError("Vui lòng nhập tên trường!");
      return;
    }

    setSavingProfile(true);
    setProfileError("");

    try {
      const username = user?.username;

      if (!username) {
        throw new Error("Không xác định được tài khoản!");
      }

      const updatedData = {
        hoVaTen: profileData.hoVaTen.trim(),
        lopDay: profileData.lopDay.trim(),
        tenTruong: profileData.tenTruong.trim(),
      };

      // CẬP NHẬT FIRESTORE
      await setDoc(
        doc(db, "USERS", username),
        updatedData,
        { merge: true }
      );

      // CẬP NHẬT LOCAL STORAGE
      const updatedUser = {
        ...user,
        ...updatedData,
      };

      localStorage.setItem(
        "tools_user",
        JSON.stringify(updatedUser)
      );

      setUser(updatedUser);
      setOpenProfile(false);

    } catch (error) {
      console.error("Lỗi cập nhật thông tin:", error);
      setProfileError("Cập nhật thông tin thất bại!");
    } finally {
      setSavingProfile(false);
    }
  };

  // =====================================================
  // LƯU MẬT KHẨU
  // =====================================================

  const handleChangePassword = async () => {
    if (!newPw.trim()) {
      setPwError("Mật khẩu mới không được để trống!");
      return;
    }

    if (newPw !== confirmPw) {
      setPwError("Mật khẩu nhập lại không khớp!");
      return;
    }

    // TODO: Gắn xử lý cập nhật mật khẩu theo cơ chế xác thực

    setPwError("");
    setOpenChangePw(false);
    setNewPw("");
    setConfirmPw("");
  };

  // =====================================================
  // CHƯA ĐĂNG NHẬP
  // =====================================================

  if (!user?.username) {
    return <Auth onLogin={handleLogin} />;
  }

  const getShortName = (hoVaTen = "") => {
    const parts = hoVaTen.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) return "";

    const middleWord = parts[parts.length - 2];

    if (
      parts.length >= 2 &&
      ["Thị", "Văn"].includes(middleWord)
    ) {
      return parts[parts.length - 1];
    }

    return parts.slice(-2).join(" ");
  };

  // =====================================================
  // GIAO DIỆN CHÍNH
  // =====================================================

  return (
    <StudentProvider>
      <>
        {/* ================================================= */}
        {/* APP BAR */}
        {/* ================================================= */}

        <AppBar
          position="fixed"
          sx={{
            background: "#1976d2",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
              minHeight: "48px !important",
              paddingTop: 0,
              paddingBottom: 0,
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {/* LEFT: LOGO + DASHBOARD */}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexShrink: 0,
              }}
            >
              <Box
                component="img"
                src="/Logo.png"
                alt="Logo"
                onClick={() => setOpenLogo(true)}
                sx={{
                  height: 34,
                  flexShrink: 0,
                  ml: { xs: -1, sm: -2 },
                  mr: 1,
                  cursor: "pointer",
                }}
              />

              <Button
                sx={{
                  color: "#fff",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "default",
                  "&:hover": {
                    bgcolor: "transparent",
                  },
                }}
              >
                {user?.username
                  ? (user?.tenTruong || "TH BÌNH KHÁNH").replace(/^Trường\s+/i, "")
                  : "TH BÌNH KHÁNH"}
              </Button>
            </Box>

            {/* RIGHT: USER AREA */}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexShrink: 0,
                ml: "auto",
              }}
            >
              {/* TÊN NGƯỜI DÙNG */}

              <Typography
                sx={{
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "block",
                  maxWidth: 180,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                  {getShortName(user?.hoVaTen)}
                </Box>

                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  {user?.hoVaTen || ""}
                </Box>
              </Typography>

              {/* ICON TÀI KHOẢN */}
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  bgcolor:
                    user?.username?.trim().toLowerCase() === "thaipv"
                      ? "#FEF3C7"
                      : "#DBEAFE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid",
                  borderColor:
                    user?.username?.trim().toLowerCase() === "thaipv"
                      ? "#FCD34D"
                      : "#93C5FD",
                  boxShadow:
                    user?.username?.trim().toLowerCase() === "thaipv"
                      ? "0 2px 8px rgba(217,119,6,0.18)"
                      : "0 2px 8px rgba(37,99,235,0.18)",
                }}
              >
                {user?.username?.trim().toLowerCase() === "thaipv" ? (
                  <AdminPanelSettingsIcon
                    sx={{ color: "#B45309", fontSize: 21 }}
                  />
                ) : (
                  <PersonIcon
                    sx={{ color: "#1D4ED8", fontSize: 21 }}
                  />
                )}
              </Box>

              {/* MENU 9 Ô VUÔNG */}

              <IconButton
                onClick={handleMenuOpen}
                sx={{
                  color: "#fff",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.12)",
                  },
                }}
              >
                <AppsIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* ================================================= */}
        {/* MENU TÀI KHOẢN */}
        {/* ================================================= */}

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

          {/* ĐƯỜNG PHÂN CÁCH */}

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

        {/* ================================================= */}
        {/* DIALOG CẬP NHẬT THÔNG TIN */}
        {/* ================================================= */}

        {/* DIALOG CẬP NHẬT THÔNG TIN */}
        <UpdateProfileDialog
          open={openProfile}
          onClose={() => setOpenProfile(false)}
          user={user}
          profileData={profileData}
          setProfileData={setProfileData}
          loadingProfile={loadingProfile}
          savingProfile={savingProfile}
          profileError={profileError}
          onSave={handleSaveProfile}
        />

        {/* ================================================= */}
        {/* DIALOG ĐỔI MẬT KHẨU */}
        {/* ================================================= */}

        <ChangePasswordDialog
          open={openChangePassword}
          onClose={() => setOpenChangePassword(false)}
          username={user?.username}
        />

        {/* ================================================= */}
        {/* PHÓNG TO LOGO */}
        {/* ================================================= */}

        {openLogo && (
          <Box
            onClick={() => setOpenLogo(false)}
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2000,
              cursor: "pointer",
            }}
          >
            <Box
              sx={{
                width: "clamp(180px, 60vw, 320px)",
                height: "clamp(180px, 60vw, 320px)",
                bgcolor: "white",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                animation: "zoomIn 0.3s ease",
              }}
            >
              <Box
                component="img"
                src="/Logo.png"
                alt="Logo lớn"
                sx={{
                  maxWidth: "85%",
                  maxHeight: "85%",
                  objectFit: "contain",
                }}
              />
            </Box>
          </Box>
        )}

        {/* ================================================= */}
        {/* NỘI DUNG TOOLS */}
        {/* ================================================= */}

        <Box
          sx={{
            paddingTop: "48px",
            minHeight: "100vh",
            width: "100%",
          }}
        >
          <Tools />
        </Box>
      </>
    </StudentProvider>
  );
}
