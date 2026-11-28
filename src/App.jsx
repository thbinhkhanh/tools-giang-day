
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
import { WorksheetProvider } from "./context/WorksheetContext";

import AppHeader from "./components/AppHeader";
import AccountMenu from "./components/AccountMenu";

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
      <WorksheetProvider>
        <>
          <AppHeader
            user={user}
            getShortName={getShortName}
            setOpenLogo={setOpenLogo}
            handleMenuOpen={handleMenuOpen}
          />

          {/* ================================================= */}
          {/* MENU TÀI KHOẢN */}
          {/* ================================================= */}

          <AccountMenu
            anchorEl={anchorEl}
            openMenu={openMenu}
            handleMenuClose={handleMenuClose}
            handleOpenProfile={handleOpenProfile}
            setOpenChangePassword={setOpenChangePassword}
            handleLogout={handleLogout}
          />

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
      </WorksheetProvider>
    </StudentProvider>
  );
}
