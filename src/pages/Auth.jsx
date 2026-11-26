
import React, { useState } from "react";

import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  AppBar,
  Toolbar,
} from "@mui/material";

import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

// Chuẩn hóa họ tên
const normalizeVietnameseName = (name) =>
  name
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("vi-VN")
    .replace(/(^|\s)\p{L}/gu, (letter) =>
      letter.toLocaleUpperCase("vi-VN")
    );

// Tạo tên đăng nhập: Phạm Văn Thái -> thaipv
const makeUsername = (name) => {
  const parts = name
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .split(/\s+/);

  if (!parts.length || !parts[0]) return "";

  const ten = parts[parts.length - 1];

  const vietTat = parts
    .slice(0, -1)
    .map((part) => part[0])
    .join("");

  return `${ten}${vietTat}`;
};

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");

  const [hoVaTen, setHoVaTen] = useState("");
  const [lopDay, setLopDay] = useState("");

  const [matKhau, setMatKhau] = useState("");
  const [showPassword, setShowPassword] = useState(false);
 
  const [loading, setLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const isRegister = mode === "register";
  const username = makeUsername(hoVaTen);

  const showMessage = (message, severity = "info") => {
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

  // ĐĂNG KÝ
  const handleRegister = async () => {
    const name = hoVaTen.trim().replace(/\s+/g, " ");

    if (!name) {
      showMessage("Vui lòng nhập họ và tên!", "error");
      return;
    }

    if (name.split(" ").length < 2) {
      showMessage("Vui lòng nhập đầy đủ họ và tên!", "error");
      return;
    }

    if (!lopDay.trim()) {
      showMessage("Vui lòng nhập lớp giảng dạy!", "error");
      return;
    }

    if (matKhau.length < 6) {
      showMessage("Mật khẩu phải có ít nhất 6 ký tự!", "error");
      return;
    }

    const normalizedName = normalizeVietnameseName(name);
    const normalizedUsername = makeUsername(normalizedName);

    const normalizedClasses = lopDay
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ");

    if (!normalizedClasses) {
      showMessage("Vui lòng nhập ít nhất một lớp!", "error");
      return;
    }

    setLoading(true);

    try {
      const userRef = doc(db, "USERS", normalizedUsername);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        showMessage(
          "Tên đăng nhập đã tồn tại. Vui lòng kiểm tra lại!",
          "error"
        );
        return;
      }

      await setDoc(userRef, {
        hoVaTen: normalizedName,
        username: normalizedUsername,
        lopDay: normalizedClasses,
        matKhau,
        status: "active",
        createdAt: serverTimestamp(),
      });

      setHoVaTen(normalizedName);
      setMatKhau("");
      setXacNhanMatKhau("");
      setMode("login");

      showMessage(
        `Đăng ký thành công! Tên đăng nhập của bạn là ${normalizedUsername}.`,
        "success"
      );
    } catch (err) {
      console.error("Lỗi đăng ký:", err);

      showMessage(
        "Không thể đăng ký tài khoản. Vui lòng kiểm tra kết nối và quyền Firestore.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ĐĂNG NHẬP
  const handleLogin = async () => {
    const loginValue = hoVaTen.trim().replace(/\s+/g, " ");

    if (!loginValue) {
      showMessage("Vui lòng nhập họ và tên hoặc tên đăng nhập!", "error");
      return;
    }

    if (!matKhau) {
      showMessage("Vui lòng nhập mật khẩu!", "error");
      return;
    }

    // Nếu nhập họ tên thì chuyển thành username.
    // Nếu nhập username thì giữ nguyên username.
    const loginUsername = loginValue.includes(" ")
      ? makeUsername(loginValue)
      : loginValue.toLowerCase();

    setLoading(true);

    try {
      const userRef = doc(db, "USERS", loginUsername);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        showMessage(
          "Họ tên, tên đăng nhập hoặc mật khẩu không chính xác!",
          "error"
        );
        return;
      }

      const userData = userSnap.data();

      if (userData.matKhau !== matKhau) {
        showMessage(
          "Họ tên, tên đăng nhập hoặc mật khẩu không chính xác!",
          "error"
        );
        return;
      }

      const profile = {
        username: userData.username,
        hoVaTen: userData.hoVaTen,
        tenTruong: userData.tenTruong || "",
        lopDay: userData.lopDay || "",
      };

      localStorage.removeItem(`tools_account_status_${profile.username}`);
      localStorage.setItem("tools_user", JSON.stringify(profile));

      onLogin?.(profile);
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);

      showMessage(
        "Lỗi khi đăng nhập. Vui lòng kiểm tra Firestore Rules!",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // XỬ LÝ FORM
  const handleSubmit = (e) => {
    e.preventDefault();

    if (loading) return;

    if (isRegister) {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  // CHUYỂN ĐỔI ĐĂNG NHẬP / ĐĂNG KÝ
  const switchMode = (nextMode) => {
    setMode(nextMode);
    setMatKhau("");
    setShowPassword(false);
  };

  // STYLE Ô NHẬP
  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "#fff",
      borderRadius: "5px",
      minHeight: 42,
      fontSize: 14,

      "& fieldset": {
        borderColor: "#dbe2ea",
      },

      "&:hover fieldset": {
        borderColor: "#90b4df",
      },

      "&.Mui-focused fieldset": {
        borderColor: "#1976d2",
        borderWidth: 2,
      },
    },

    // Ẩn con mắt mặc định của Microsoft Edge
    "& input::-ms-reveal": {
      display: "none",
    },

    "& input::-ms-clear": {
      display: "none",
    },
  };

  const labelSx = {
    fontSize: 13,
    fontWeight: 650,
    color: "#334155",
    mb: 0.8,
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        backgroundImage: `
          linear-gradient(
            135deg,
            rgba(219, 239, 255, 0.12),
            rgba(239, 246, 255, 0.16)
          ),
          url("/background.png")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: { xs: "scroll", md: "fixed" },
        fontFamily: '"Roboto","Inter","Arial",sans-serif',
      }}
    >
      {/* APP BAR */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: "#1976d2",
          height: 48,
          justifyContent: "center",
          zIndex: 1200,
        }}
      >
        <Toolbar
          sx={{
            minHeight: "48px !important",
            height: 48,
            px: { xs: 1.5, sm: 2 },
            gap: 1.2,
          }}
        >
          <Box
            component="img"
            src="/Logo.png"
            alt="Logo"
            sx={{
              height: 30,
              width: "auto",
              objectFit: "contain",
            }}
          />

          <Typography
            sx={{
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              ml: 0.5,
              whiteSpace: "nowrap",
            }}
          >
            TH BÌNH KHÁNH
          </Typography>

          <Box sx={{ flex: 1 }} />
        </Toolbar>
      </AppBar>

      {/* NỘI DUNG ĐĂNG NHẬP / ĐĂNG KÝ */}
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          boxSizing: "border-box",
          background: "transparent",
          px: 2,
          pt: "48px",
          pb: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: '"Roboto","Inter","Arial",sans-serif',
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 440 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: "14px",
              overflow: "hidden",
              background: "rgba(255,255,255,0.96)",
              border: "1px solid rgba(255,255,255,0.85)",
              boxShadow: "0 16px 50px rgba(15, 65, 120, 0.22)",
              backdropFilter: "blur(10px)",
            }}
          >
            {/* HEADER CARD */}
            <Box
              sx={{
                px: 3,
                py: 1.5,
                background: "#1976d2",
                color: "#fff",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
                  {isRegister
                    ? "Đăng ký tài khoản"
                    : "Đăng nhập hệ thống"}
                </Typography>
              </Stack>
            </Box>

            {/* CONTENT */}
            <Box sx={{ px: 3, py: 3.5 }}>
              <Stack
                spacing={2.2}
                alignItems="center"
                sx={{ width: "100%" }}
              >
                {/* ICON */}
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      flexShrink: 0,
                      borderRadius: "50%",
                      bgcolor: "#e3f2fd",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      border: "3px solid #fff",
                      boxShadow: "0 4px 12px rgba(25,118,210,0.12)",
                    }}
                  >
                    {isRegister ? "📝" : "🔐"}
                  </Box>
                </Box>

                {/* TITLE */}
                <Box
                  sx={{
                    width: "100%",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{
                      width: "100%",
                      textAlign: "center",
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                  >
                    {isRegister ? "Tạo tài khoản" : "Chào mừng"}
                  </Typography>

                  <Typography
                    sx={{
                      width: "100%",
                      textAlign: "center",
                      fontSize: 14,
                      color: "#64748b",
                      mt: 0.5,
                    }}
                  >
                    {isRegister
                      ? "Điền thông tin để đăng ký sử dụng"
                      : "Vui lòng đăng nhập để tiếp tục"}
                  </Typography>
                </Box>

                {/* FORM */}
                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  sx={{ width: "100%" }}
                >
                  <Stack spacing={2}>
                    {/* HỌ TÊN / TÊN ĐĂNG NHẬP */}
                    <Box>
                      <Typography sx={labelSx}>
                        {isRegister
                          ? "Họ và tên"
                          : "Tên đăng nhập"}
                      </Typography>

                      <TextField
                        fullWidth
                        size="small"
                        value={hoVaTen}
                        onChange={(e) => setHoVaTen(e.target.value)}
                        //placeholder={isRegister ? "Nhập họ và tên" : "Nhập tên tài khoản"}
                        autoComplete="username"
                        required
                        sx={fieldSx}
                      />

                      {isRegister && hoVaTen.trim() && (
                        <Typography
                          sx={{
                            mt: 0.7,
                            fontSize: 12,
                            color: "#1976d2",
                            fontWeight: 700,
                          }}
                        >
                          Tên đăng nhập: {username}
                        </Typography>
                      )}
                    </Box>                   

                    {/* MẬT KHẨU */}
                    <Box>
                      <Typography sx={labelSx}>
                        Mật khẩu
                      </Typography>

                      <TextField
                        fullWidth
                        size="small"
                        type={showPassword ? "text" : "password"}
                        value={matKhau}
                        onChange={(e) => setMatKhau(e.target.value)}
                        //placeholder="Nhập mật khẩu"
                        autoComplete={
                          isRegister
                            ? "new-password"
                            : "current-password"
                        }
                        required
                        sx={fieldSx}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  setShowPassword((prev) => !prev)
                                }
                                edge="end"
                                aria-label="Hiện hoặc ẩn mật khẩu"
                                sx={{ color: "#64748b" }}
                              >
                                <RemoveRedEyeOutlinedIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    {/* THÔNG TIN LỚP */}
                    {isRegister && (
                      <>
                        <Box>
                          <Typography sx={labelSx}>
                            Lớp giảng dạy
                          </Typography>

                          <TextField
                            fullWidth
                            size="small"
                            value={lopDay}
                            onChange={(e) => setLopDay(e.target.value)}
                            placeholder="Ví dụ: 1.1, 1.2, 2.1"
                            helperText="Có thể nhập nhiều lớp, cách nhau bằng dấu phẩy."
                            required
                            sx={fieldSx}
                          />
                        </Box>
                      </>
                    )}

                    {/* NÚT ĐĂNG NHẬP / ĐĂNG KÝ */}
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={loading}
                      sx={{
                        textTransform: "none",
                        borderRadius: "12px",
                        py: 1.2,
                        fontWeight: 700,
                        fontSize: 15,
                        boxShadow: "none",
                        background: "#1976d2",
                        "&:hover": {
                          background: "#1565c0",
                          boxShadow: "none",
                        },
                      }}
                    >
                      {loading
                        ? "Đang xử lý..."
                        : isRegister
                          ? "📝 Đăng ký tài khoản"
                          : "🔐 Đăng nhập"}
                    </Button>
                  </Stack>
                </Box>

                {/* CHUYỂN ĐỔI ĐĂNG NHẬP / ĐĂNG KÝ */}
                <Box
                  sx={{
                    width: "100%",
                    mt: 0.5,
                    pt: 2,
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    spacing={0.5}
                    flexWrap="wrap"
                    sx={{ width: "100%" }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: 1.5,
                        m: 0,
                        color: "#64748b",
                      }}
                    >
                      {isRegister
                        ? "Bạn đã có tài khoản?"
                        : "Bạn chưa có tài khoản?"}
                    </Typography>

                    <Button
                      size="small"
                      onClick={() =>
                        switchMode(isRegister ? "login" : "register")
                      }
                      sx={{
                        minWidth: "auto",
                        lineHeight: 1.5,
                        py: 0,
                        px: 0.5,
                        verticalAlign: "middle",
                        fontWeight: 700,
                        textTransform: "none",
                      }}
                    >
                      {isRegister ? "Đăng nhập" : "Đăng ký"}
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Card>
        </Box>

        {/* SNACKBAR */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={closeSnackbar}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
        >
          <Alert
            severity={snackbar.severity}
            variant="filled"
            onClose={closeSnackbar}
            sx={{ borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
