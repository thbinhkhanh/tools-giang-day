
import React, { useCallback, useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  TextField,
  MenuItem,
  Tooltip,
  Snackbar,
  Fade,
  Divider,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import RefreshRoundedIcon from "@mui/icons-material/Refresh";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "../firebase";

export default function AccountsDialog({ open, onClose }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Thông báo
  const [message, setMessage] = useState({
    open: false,
    type: "success",
    text: "",
  });

  // Dialog chỉnh sửa
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [editData, setEditData] = useState({
    hoVaTen: "",
    lopDay: "",
    tenTruong: "",
    status: "active",
  });

  // Dialog xác nhận
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState("");
  const [confirmAccount, setConfirmAccount] = useState(null);

  // =========================================
  // THÔNG BÁO
  // =========================================

  const showMessage = (type, text) => {
    setMessage({
      open: true,
      type,
      text,
    });
  };

  // =========================================
  // ĐỊNH DẠNG NGÀY
  // =========================================

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";

    try {
      const date = timestamp?.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

      if (Number.isNaN(date.getTime())) return "—";

      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // =========================================
  // HIỂN THỊ LỚP DẠY
  // =========================================

  const formatClasses = (value) => {
    if (Array.isArray(value)) {
      return value.join(", ") || "—";
    }

    return value || "—";
  };

  // =========================================
  // TẢI DANH SÁCH TÀI KHOẢN
  // =========================================

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const snapshot = await getDocs(collection(db, "USERS"));

      const accountList = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          username: data.username || docSnap.id,
          hoVaTen: data.hoVaTen || "",
          lopDay: data.lopDay || "",
          status: data.status || "inactive",
          tenTruong: data.tenTruong || "",
          createdAt: data.createdAt || null,
        };
      });

      accountList.sort((a, b) => {
        const dateA =
          a.createdAt?.toDate?.()?.getTime() || 0;

        const dateB =
          b.createdAt?.toDate?.()?.getTime() || 0;

        return dateB - dateA;
      });

      setAccounts(accountList);
    } catch (err) {
      console.error("Lỗi tải danh sách tài khoản:", err);

      setError(
        "Không thể tải danh sách tài khoản. Vui lòng kiểm tra quyền truy cập Firestore."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadAccounts();
    }
  }, [open, loadAccounts]);

  // =========================================
  // MỞ CHỈNH SỬA TÀI KHOẢN
  // =========================================

  const handleEdit = (account) => {
    setSelectedAccount(account);

    setEditData({
      hoVaTen: account.hoVaTen || "",
      lopDay: Array.isArray(account.lopDay)
        ? account.lopDay.join(", ")
        : account.lopDay || "",
      tenTruong: account.tenTruong || "",
      status: account.status || "inactive",
    });

    setEditOpen(true);
  };

  // =========================================
  // LƯU THÔNG TIN TÀI KHOẢN
  // =========================================

  const handleSaveEdit = async () => {
    if (!selectedAccount) return;

    if (!editData.hoVaTen.trim()) {
      showMessage("warning", "Vui lòng nhập họ và tên.");
      return;
    }

    try {
      setSaving(true);

      await updateDoc(
        doc(db, "USERS", selectedAccount.id),
        {
          hoVaTen: editData.hoVaTen.trim(),
          lopDay: editData.lopDay.trim(),
          tenTruong: editData.tenTruong.trim(),
          status: editData.status,
        }
      );

      setEditOpen(false);
      setSelectedAccount(null);

      await loadAccounts();

      showMessage(
        "success",
        "Đã cập nhật thông tin tài khoản."
      );
    } catch (err) {
      console.error("Lỗi cập nhật tài khoản:", err);

      showMessage(
        "error",
        "Không thể cập nhật thông tin tài khoản."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // MỞ XÁC NHẬN RESET / XÓA
  // =========================================

  const handleConfirmAction = (type, account) => {
    setConfirmType(type);
    setConfirmAccount(account);
    setConfirmOpen(true);
  };

  // =========================================
  // THỰC HIỆN RESET / XÓA
  // =========================================

  const handleConfirm = async () => {
    if (!confirmAccount) return;

    try {
      setSaving(true);

      const accountRef = doc(
        db,
        "USERS",
        confirmAccount.id
      );

      if (confirmType === "reset") {
        await updateDoc(accountRef, {
          matKhau: "123456",
        });

        showMessage(
          "success",
          `Đã reset mật khẩu tài khoản ${confirmAccount.username} về 123456.`
        );
      }

      if (confirmType === "delete") {
        await deleteDoc(accountRef);

        showMessage(
          "success",
          `Đã xóa tài khoản ${confirmAccount.username}.`
        );
      }

      setConfirmOpen(false);
      setConfirmAccount(null);

      await loadAccounts();
    } catch (err) {
      console.error("Lỗi quản lý tài khoản:", err);

      showMessage(
        "error",
        confirmType === "reset"
          ? "Không thể reset mật khẩu tài khoản."
          : "Không thể xóa tài khoản."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // GIAO DIỆN
  // =========================================

  
return (
    <>
      {/* ===================================== */}
      {/* DIALOG DANH SÁCH TÀI KHOẢN */}
      {/* ===================================== */}

      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            width: { xs: "calc(100% - 8px)", sm: "100%" },
            maxWidth: { xs: "none", sm: 900 },
            margin: { xs: "4px", sm: "32px" },
            borderRadius: { xs: 4, sm: 4 },
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 25px 80px rgba(15,23,42,.25)",
            position: "relative",
            height: "94dvh",
            maxHeight: "94dvh",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            position: "relative",
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            color: "#fff",
            background:
              "linear-gradient(115deg, #101b3c 0%, #173b82 55%, #087db5 100%)",
            flexShrink: 0,
          }}
        >
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 14,
              color: "#fff",
              bgcolor: "rgba(255,255,255,.10)",
              border: "1px solid rgba(255,255,255,.16)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,.2)",
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              pr: 5,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2.5,
                color: "#fff",
                background:
                  "linear-gradient(145deg, #38bdf8, #2563eb)",
                border: "1px solid rgba(255,255,255,.3)",
              }}
            >
              <PeopleAltRoundedIcon sx={{ fontSize: 27 }} />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: { xs: 17, sm: 23 },
                  fontWeight: 900,
                  letterSpacing: 0.5,
                  lineHeight: 1.3,
                }}
              >
                QUẢN LÝ TÀI KHOẢN
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,
                  fontSize: 14,
                  color: "rgba(219,234,254,.85)",
                }}
              >
                Quản lý thông tin và trạng thái tài khoản
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* NỘI DUNG */}
        <DialogContent
          sx={{
            px: { xs: 1, sm: 2 },
            py: 1.5,
            background:
              "linear-gradient(180deg,#f8fbff 0%,#ffffff 100%)",
            display: "flex",
            flexDirection: "column",
            flex: "1 1 0",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* THANH CÔNG CỤ */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              mb: 1.5,
              flexShrink: 0,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 900,
                  color: "#1e3a5f",
                }}
              >
                DANH SÁCH NGƯỜI DÙNG
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                Tổng số: {accounts.length} tài khoản
              </Typography>
            </Box>

            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshRoundedIcon />}
              onClick={loadAccounts}
              disabled={loading}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              Làm mới
            </Button>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 1.5,
                fontSize: 13,
                "& .MuiAlert-message": { fontSize: 13 },
              }}
            >
              {error}
            </Alert>
          )}

          {/* BẢNG TÀI KHOẢN */}
          {loading ? (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
              }}
            >
              <CircularProgress size={25} />

              <Typography
                sx={{ fontSize: 14, color: "#64748b" }}
              >
                Đang tải danh sách tài khoản...
              </Typography>
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
                border: "1px solid #e2e8f0",
                borderRadius: 2,
                "&::-webkit-scrollbar": {
                  width: 6,
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "#cbd5e1",
                  borderRadius: 10,
                },
              }}
            >
              <Table
                size="small"
                stickyHeader
                sx={{
                  width: "100%",
                  tableLayout: "fixed",
                  "& td, & th": {
                    px: { xs: 0.5, sm: 0.8 },
                    py: 1.5,
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    {[
                      { label: "STT", width: "5%" },
                      { label: "Họ và tên", width: "16%" },
                      { label: "Lớp dạy", width: "10%" },
                      { label: "Tên trường", width: "15%" },
                      { label: "Tên đăng nhập", width: "13%" },
                      { label: "Ngày tạo", width: "15%" },
                      { label: "Trạng thái", width: "11%" },
                      { label: "Quản lý", width: "15%" },
                    ].map((item) => (
                      <TableCell
                        key={item.label}
                        align="center"
                        sx={{
                          width: item.width,
                          fontWeight: 900,
                          color: "#1e3a5f",
                          background: "#eff6ff",
                          fontSize: { xs: 11, sm: 13 },
                          lineHeight: 1.4,
                        }}
                      >
                        {item.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {accounts.map((account, index) => (
                    <TableRow
                      key={account.id}
                      hover
                      sx={{
                        "&:nth-of-type(even)": {
                          background: "#f8fafc",
                        },
                        "&:hover": {
                          background: "#eff6ff !important",
                        },
                      }}
                    >
                      {/* STT */}
                      <TableCell
                        align="center"
                        sx={{ fontSize: 13 }}
                      >
                        {index + 1}
                      </TableCell>

                      {/* HỌ VÀ TÊN */}
                      <TableCell
                        sx={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "#1e293b",
                        }}
                      >
                        {account.hoVaTen || "—"}
                      </TableCell>

                      {/* LỚP DẠY */}
                      <TableCell
                        align="center"
                        sx={{
                          fontSize: 13,
                          color: "#475569",
                        }}
                      >
                        {formatClasses(account.lopDay)}
                      </TableCell>

                      {/* TÊN TRƯỜNG */}
                      <TableCell
                        sx={{
                          fontSize: 13,
                          color: "#475569",
                        }}
                      >
                        {account.tenTruong || "—"}
                      </TableCell>

                      {/* TÊN ĐĂNG NHẬP */}
                      <TableCell
                        sx={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#2563eb",
                        }}
                      >
                        {account.username}
                      </TableCell>

                      {/* NGÀY TẠO */}
                      <TableCell
                        align="center"
                        sx={{
                          fontSize: 12,
                          color: "#64748b",
                        }}
                      >
                        {formatDate(account.createdAt)}
                      </TableCell>

                      {/* TRẠNG THÁI */}
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={
                            account.status === "active"
                              ? "Hoạt động"
                              : "Không hoạt động"
                          }
                          color={
                            account.status === "active"
                              ? "success"
                              : "default"
                          }
                          sx={{
                            height: "auto",
                            maxWidth: "100%",
                            fontSize: { xs: 10, sm: 11 },
                            fontWeight: 800,
                            "& .MuiChip-label": {
                              px: 0.6,
                              py: 0.5,
                              whiteSpace: "normal",
                              textAlign: "center",
                            },
                          }}
                        />
                      </TableCell>

                      {/* QUẢN LÝ TÀI KHOẢN */}
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: { xs: 0, sm: 0.3 },
                          }}
                        >
                          <Tooltip title="Sửa thông tin">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(account)}
                              sx={{
                                color: "#2563eb",
                                p: 0.6,
                                "&:hover": {
                                  bgcolor: "#dbeafe",
                                },
                              }}
                            >
                              <EditRoundedIcon
                                sx={{ fontSize: 20 }}
                              />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Reset mật khẩu">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleConfirmAction(
                                  "reset",
                                  account
                                )
                              }
                              sx={{
                                color: "#d97706",
                                p: 0.6,
                                "&:hover": {
                                  bgcolor: "#fef3c7",
                                },
                              }}
                            >
                              <KeyRoundedIcon
                                sx={{ fontSize: 20 }}
                              />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Xóa tài khoản">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleConfirmAction(
                                  "delete",
                                  account
                                )
                              }
                              sx={{
                                color: "#dc2626",
                                p: 0.6,
                                "&:hover": {
                                  bgcolor: "#fee2e2",
                                },
                              }}
                            >
                              <DeleteOutlineRoundedIcon
                                sx={{ fontSize: 20 }}
                              />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!accounts.length && !error && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        align="center"
                        sx={{ py: 5 }}
                      >
                        <PeopleAltRoundedIcon
                          sx={{
                            fontSize: 35,
                            color: "#cbd5e1",
                            mb: 1,
                          }}
                        />

                        <Typography
                          sx={{
                            fontSize: 14,
                            color: "#94a3b8",
                          }}
                        >
                          Chưa có tài khoản nào.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        {/* FOOTER */}
        <DialogActions
          sx={{
            px: 2.5,
            py: 1.3,
            borderTop: "1px solid #e2e8f0",
            flexShrink: 0,
          }}
        >
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 3,
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================================== */}
      {/* DIALOG SỬA THÔNG TIN TÀI KHOẢN */}
      {/* ===================================== */}

      <Dialog
        open={editOpen}
        onClose={() => {
          if (!saving) setEditOpen(false);
        }}
        fullWidth
        maxWidth="sm"
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 25px 80px rgba(15,23,42,.25)",
          },
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2,
            color: "#fff",
            background:
              "linear-gradient(115deg, #101b3c, #173b82, #087db5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              SỬA THÔNG TIN TÀI KHOẢN
            </Typography>

            <Typography
              sx={{
                fontSize: 13,
                mt: 0.4,
                color: "#bfdbfe",
              }}
            >
              Cập nhật thông tin người dùng
            </Typography>
          </Box>

          <IconButton
            onClick={() => setEditOpen(false)}
            disabled={saving}
            sx={{ color: "#fff" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent
          sx={{
            p: 2.5,
            background: "#f8fafc",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* TÊN ĐĂNG NHẬP */}
            <Box>
              <Typography
                sx={{
                  mb: 0.7,
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#475569",
                }}
              >
                Tên đăng nhập
              </Typography>

              <TextField
                fullWidth
                size="small"
                value={selectedAccount?.username || ""}
                disabled
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: "#e2e8f0",
                    fontSize: 14,
                  },
                }}
              />
            </Box>

            {/* HỌ VÀ TÊN */}
            <Box>
              <Typography
                sx={{
                  mb: 0.7,
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#475569",
                }}
              >
                Họ và tên
              </Typography>

              <TextField
                fullWidth
                size="small"
                value={editData.hoVaTen}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    hoVaTen: e.target.value,
                  }))
                }
                placeholder="Nhập họ và tên"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: "#fff",
                    fontSize: 14,
                  },
                  "& input": { fontSize: 14 },
                }}
              />
            </Box>

            {/* LỚP DẠY */}
            <Box>
              <Typography
                sx={{
                  mb: 0.7,
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#475569",
                }}
              >
                Lớp dạy
              </Typography>

              <TextField
                fullWidth
                size="small"
                value={editData.lopDay}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    lopDay: e.target.value,
                  }))
                }
                placeholder="Ví dụ: 1.1, 1.2, 2.1"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: "#fff",
                    fontSize: 14,
                  },
                  "& input": { fontSize: 14 },
                }}
              />
            </Box>

            {/* TÊN TRƯỜNG */}
            <Box>
              <Typography
                sx={{
                  mb: 0.7,
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#475569",
                }}
              >
                Tên trường
              </Typography>

              <TextField
                fullWidth
                size="small"
                value={editData.tenTruong}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    tenTruong: e.target.value,
                  }))
                }
                placeholder="Nhập tên trường"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: "#fff",
                    fontSize: 14,
                  },
                  "& input": { fontSize: 14 },
                }}
              />
            </Box>

            {/* TRẠNG THÁI */}
            <Box>
              <Typography
                sx={{
                  mb: 0.7,
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#475569",
                }}
              >
                Trạng thái tài khoản
              </Typography>

              <TextField
                select
                fullWidth
                size="small"
                value={editData.status}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: "#fff",
                    fontSize: 14,
                  },
                  "& .MuiSelect-select": { fontSize: 14 },
                }}
              >
                <MenuItem value="active" sx={{ fontSize: 14 }}>
                  Hoạt động
                </MenuItem>

                <MenuItem value="inactive" sx={{ fontSize: 14 }}>
                  Không hoạt động
                </MenuItem>
              </TextField>
            </Box>
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions
          sx={{
            px: 2.5,
            py: 1.5,
            gap: 1,
          }}
        >
          <Button
            onClick={() => setEditOpen(false)}
            disabled={saving}
            sx={{
              textTransform: "none",
              color: "#64748b",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Hủy
          </Button>

          <Button
            variant="contained"
            startIcon={
              saving ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SaveRoundedIcon />
              )
            }
            onClick={handleSaveEdit}
            disabled={saving}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 2.5,
              fontWeight: 800,
              fontSize: 14,
              background:
                "linear-gradient(90deg,#2563eb,#0ea5e9)",
            }}
          >
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================================== */}
      {/* DIALOG XÁC NHẬN RESET / XÓA */}
      {/* ===================================== */}

      <Dialog
        open={confirmOpen}
        onClose={() => {
          if (!saving) setConfirmOpen(false);
        }}
        fullWidth
        maxWidth="xs"
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            color: "#fff",
            background:
              confirmType === "delete"
                ? "linear-gradient(110deg,#991b1b,#dc2626)"
                : "linear-gradient(110deg,#92400e,#d97706)",
          }}
        >
          {confirmType === "delete" ? (
            <DeleteOutlineRoundedIcon sx={{ fontSize: 27 }} />
          ) : (
            <KeyRoundedIcon sx={{ fontSize: 27 }} />
          )}

          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            {confirmType === "delete"
              ? "XÓA TÀI KHOẢN"
              : "RESET MẬT KHẨU"}
          </Typography>
        </Box>

        <DialogContent sx={{ p: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              alignItems: "flex-start",
            }}
          >
            <WarningAmberRoundedIcon
              sx={{
                color:
                  confirmType === "delete"
                    ? "#dc2626"
                    : "#d97706",
                fontSize: 27,
                mt: 0.1,
              }}
            />

            <Box>
              {confirmType === "delete" ? (
                <Typography
                  sx={{
                    fontSize: 15,
                    color: "#334155",
                    lineHeight: 1.7,
                  }}
                >
                  Bạn có chắc chắn muốn xóa tài khoản{" "}
                  <Box
                    component="span"
                    sx={{
                      fontWeight: 900,
                      color: "#dc2626",
                    }}
                  >
                    {confirmAccount?.username}
                  </Box>
                  ? Thao tác này không thể hoàn tác.
                </Typography>
              ) : (
                <Typography
                  sx={{
                    fontSize: 15,
                    color: "#334155",
                    lineHeight: 1.7,
                  }}
                >
                  Bạn có chắc chắn muốn đặt lại mật khẩu
                  tài khoản{" "}
                  <Box
                    component="span"
                    sx={{
                      fontWeight: 900,
                      color: "#d97706",
                    }}
                  >
                    {confirmAccount?.username}
                  </Box>{" "}
                  về{" "}
                  <Box
                    component="span"
                    sx={{
                      fontWeight: 900,
                      color: "#dc2626",
                    }}
                  >
                    123456
                  </Box>
                {" "}không?
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.5,
            py: 1.5,
            borderTop: "1px solid #e2e8f0",
            gap: 1,
          }}
        >
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={saving}
            sx={{
              textTransform: "none",
              color: "#64748b",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Hủy
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
            color={
              confirmType === "delete"
                ? "error"
                : "warning"
            }
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 2.5,
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            {confirmType === "delete"
              ? "Xác nhận xóa"
              : "Xác nhận"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================================== */}
      {/* SNACKBAR */}
      {/* ===================================== */}

      <Snackbar
        open={message.open}
        autoHideDuration={4000}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        onClose={(event, reason) => {
          if (reason === "clickaway") return;

          setMessage((prev) => ({
            ...prev,
            open: false,
          }));
        }}
      >
        <Alert
          severity={message.type}
          variant="filled"
          onClose={() =>
            setMessage((prev) => ({
              ...prev,
              open: false,
            }))
          }
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </>
  );

}
