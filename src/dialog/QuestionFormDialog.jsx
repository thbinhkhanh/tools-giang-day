import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Chip,
  Fade,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

// =========================
// DANH SÁCH MÔN HỌC TIỂU HỌC
// =========================
const SUBJECTS = [
  "Tiếng Việt",
  "Toán",
  "Đạo đức",
  "Tự nhiên và Xã hội",
  "Khoa học",
  "Lịch sử và Địa lí",
  "Tiếng Anh",
  "Tin học",
  "Công nghệ",
  "Giáo dục thể chất",
  "Âm nhạc",
  "Mĩ thuật",
  "Hoạt động trải nghiệm",
];

// =========================
// LẤY TUẦN ĐANG ĐƯỢC CHỌN
// =========================
const getSelectedWeek = () => {
  try {
    const value = localStorage.getItem("tools_tuan");
    const week = Number(value);

    return week >= 1 && week <= 35 ? String(week) : "";
  } catch (error) {
    console.error("Lỗi đọc tuần đang chọn:", error);
    return "";
  }
};

export default function QuestionFormDialog({
  open,
  onClose,
  onSave,
  drawing = false,
  schoolYear = "2025-2026",
}) {
  const [questionInfo, setQuestionInfo] = useState({
    grade: "",
    subject: "",
    week: getSelectedWeek(),
    lesson: "",
    content: "",
  });

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [saving, setSaving] = useState(false);

  const [gradeList, setGradeList] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // =========================
  // LẤY TÀI KHOẢN ĐANG ĐĂNG NHẬP
  // =========================
  const getCurrentUsername = () => {
    try {
      const currentUser = JSON.parse(
        localStorage.getItem("tools_user") || "null"
      );

      return String(currentUser?.username || "").trim();
    } catch (error) {
      console.error("Lỗi đọc tài khoản đăng nhập:", error);
      return "";
    }
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const fetchGrades = async () => {
      setLoadingGrades(true);

      try {
        const username = getCurrentUsername();

        if (!username) {
          throw new Error("Không xác định được tài khoản đăng nhập.");
        }

        const userRef = doc(db, "USERS", username);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          throw new Error("Không tìm thấy thông tin tài khoản.");
        }

        const lopDay = userSnap.data()?.lopDay;

        // Hỗ trợ lopDay là chuỗi hoặc mảng
        const classValues = Array.isArray(lopDay)
          ? lopDay
          : String(lopDay || "").split(",");

        // Ví dụ: ["4.3", "2.1", "5.6"] => ["2", "4", "5"]
        const grades = [
          ...new Set(
            classValues
              .map((item) => {
                const match = String(item).trim().match(/^(\d+)\s*\./);
                return match ? match[1] : "";
              })
              .filter(Boolean)
          ),
        ].sort((a, b) => Number(a) - Number(b));

        if (!cancelled) {
          setGradeList(grades);

          // Nếu khối đang chọn không còn trong danh sách được phân công
          setQuestionInfo((prev) => ({
            ...prev,
            grade: grades.includes(prev.grade) ? prev.grade : "",
            content: grades.includes(prev.grade) ? prev.content : "",
            lesson: grades.includes(prev.grade) ? prev.lesson : "",
          }));
        }
      } catch (error) {
        console.error("Lỗi tải danh sách lớp được phân công:", error);

        if (!cancelled) {
          setGradeList([]);
          showNotification(
            error.message || "Không thể tải danh sách lớp được phân công.",
            "error"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingGrades(false);
        }
      }
    };

    fetchGrades();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // =========================
  // THÔNG BÁO
  // =========================
  const showNotification = (message, severity = "success") => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  // =========================
  // TẠO ID TÀI LIỆU
  // MỖI MÔN ĐƯỢC LƯU TRONG
  // MỘT NHÓM RIÊNG
  // =========================
  const getQuestionDocumentId = (grade, week) => {
    return `quiz_Lớp ${grade}_${week}`;
  };

  // =========================
  // ĐƯỜNG DẪN FIRESTORE
  // USERS/{username}
  //   /CAUHOI_NGAUNHIEN/{subject}
  //   /DANHSACH/{documentId}
  // =========================
  const getQuestionDocumentRef = (
    username,
    subject,
    documentId
  ) => {
    return doc(
      db,
      "USERS",
      username,
      "CAUHOI_NGAUNHIEN",
      subject,
      "DANHSACH",
      documentId
    );
  };

  // =========================
  // CẬP NHẬT THÔNG TIN
  // =========================
  const handleQuestionInfoChange = (field, value) => {
    setQuestionInfo((prev) => ({
      ...prev,
      [field]: value,

      ...(field === "grade" ||
      field === "subject" ||
      field === "week"
        ? {
            content: "",
          }
        : {}),
    }));
  };

  // =========================
  // KHI MỞ HỘP THOẠI
  // CẬP NHẬT TUẦN ĐANG CHỌN
  // =========================
  useEffect(() => {
    if (!open) return;

    const selectedWeek = getSelectedWeek();

    setQuestionInfo((prev) => ({
      ...prev,
      week: selectedWeek || prev.week,
    }));
  }, [open]);

  // =========================
  // TỰ ĐỘNG TẢI CÂU HỎI
  // KHI CHỌN LỚP + MÔN + TUẦN
  // =========================
  useEffect(() => {
    if (!open) return;

    const { grade, subject, week } = questionInfo;

    if (!grade || !subject || !week) {
      setLoadingQuestions(false);
      return;
    }

    let cancelled = false;

    const fetchQuestions = async () => {
      setLoadingQuestions(true);

      try {
        const username = getCurrentUsername();

        if (!username) {
          throw new Error(
            "Không xác định được tài khoản đăng nhập."
          );
        }

        const documentId = getQuestionDocumentId(
          grade,
          week
        );

        const documentRef = getQuestionDocumentRef(
          username,
          subject,
          documentId
        );

        console.log(
          "Đang tải câu hỏi:",
          documentRef.path
        );

        const snapshot = await getDoc(documentRef);

        if (cancelled) return;

        if (snapshot.exists()) {
          const data = snapshot.data();

          const questions = Array.isArray(data.cauHoi)
            ? data.cauHoi
                .filter((item) => typeof item === "string")
                .map((item) => item.trim())
                .filter(Boolean)
            : [];

          setQuestionInfo((prev) => ({
            ...prev,
            content: questions.join("\n"),
            lesson: data.tenBai || "",
          }));

          console.log("Đã tải câu hỏi:", questions.length);
        } else {
          setQuestionInfo((prev) => ({
            ...prev,
            content: "",
            lesson: "",
          }));

          console.log(
            "Chưa có câu hỏi:",
            documentRef.path
          );
        }
      } catch (error) {
        console.error("Lỗi tải câu hỏi:", error);

        if (!cancelled) {
          setQuestionInfo((prev) => ({
            ...prev,
            content: "",
          }));

          showNotification(
            error.message ||
              "Không thể tải danh sách câu hỏi từ Firestore.",
            "error"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingQuestions(false);
        }
      }
    };

    fetchQuestions();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    questionInfo.grade,
    questionInfo.subject,
    questionInfo.week,
  ]);

  // =========================
  // ĐẾM CÂU HỎI
  // =========================
  const questionCount = questionInfo.content
    .split("\n")
    .filter((item) => item.trim()).length;

  // =========================
  // LƯU CÂU HỎI FIRESTORE
  // =========================
  const handleSave = async () => {
    if (drawing || saving || loadingQuestions) return;

    const list = questionInfo.content
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!questionInfo.grade) {
      showNotification("Vui lòng chọn lớp học.", "warning");
      return;
    }

    if (!questionInfo.subject) {
      showNotification("Vui lòng chọn môn học.", "warning");
      return;
    }

    if (!questionInfo.week) {
      showNotification(
        "Vui lòng chọn tuần học.",
        "warning"
      );
      return;
    }

    if (!questionInfo.lesson.trim()) {
      showNotification("Vui lòng nhập tên bài.", "warning");
      return;
    }

    if (!list.length) {
      showNotification(
        "Vui lòng nhập danh sách câu hỏi.",
        "warning"
      );
      return;
    }

    setSaving(true);

    try {
      const username = getCurrentUsername();

      if (!username) {
        throw new Error(
          "Không xác định được tài khoản đăng nhập."
        );
      }

      const documentId = getQuestionDocumentId(
        questionInfo.grade,
        questionInfo.week
      );

      const documentData = {
        lop: `Lớp ${questionInfo.grade}`,
        khoi: Number(questionInfo.grade),
        monHoc: questionInfo.subject,
        tuan: Number(questionInfo.week),
        tenBai: questionInfo.lesson.trim(),
        cauHoi: list,
        soLuong: list.length,
        namHoc: schoolYear,
        updatedAt: serverTimestamp(),
      };

      const documentRef = getQuestionDocumentRef(
        username,
        questionInfo.subject,
        documentId
      );

      console.log(
        "Đường dẫn lưu câu hỏi:",
        documentRef.path
      );

      console.log("Tài khoản lưu:", username);
      console.log("Môn học:", questionInfo.subject);

      await setDoc(documentRef, documentData);

      showNotification(
        "Đã lưu câu hỏi thành công.",
        "success"
      );

      onSave?.(list, questionInfo);
    } catch (error) {
      console.error("Lỗi lưu câu hỏi:", error);

      showNotification(
        error.message ||
          "Không thể lưu câu hỏi. Vui lòng thử lại.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // ĐIỀU KIỆN VÔ HIỆU HÓA NÚT LƯU
  // =========================
  const canSave =
    questionInfo.grade &&
    questionInfo.subject &&
    questionInfo.week &&
    questionInfo.lesson.trim() &&
    questionInfo.content.trim() &&
    !drawing &&
    !loadingQuestions &&
    !saving;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: 900,
            height: "94dvh",
            maxHeight: "94dvh",
            borderRadius: 4,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            background: "#F8FAFC",
            boxShadow: "0 25px 80px rgba(15,23,42,.25)",
          },
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            color: "#fff",
            background:
              "linear-gradient(115deg,#101b3c 0%,#173b82 55%,#087db5 100%)",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              bgcolor: "rgba(255,255,255,.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EditNoteRoundedIcon sx={{ fontSize: 27 }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={900} fontSize={17}>
              NHẬP CÂU HỎI
            </Typography>

            <Typography
              fontSize={11}
              color="rgba(219,234,254,.85)"
            >
              Thông tin bài học và danh sách câu hỏi
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
            disabled={drawing || saving}
            size="small"
            sx={{
              color: "#fff",
              bgcolor: "rgba(255,255,255,.12)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,.22)",
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* CONTENT */}
        <DialogContent
          sx={{
            p: 2.5,
            bgcolor: "#f8fbff",
            overflowY: "auto",
          }}
        >
          {/* THÔNG TIN BÀI HỌC */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid #dbeafe",
              bgcolor: "#fff",
            }}
          >
            <Typography
              fontSize={13}
              fontWeight={900}
              color="#172554"
              mb={2}
            >
              <QuizRoundedIcon
                sx={{
                  fontSize: 19,
                  verticalAlign: "middle",
                  mr: 1,
                  color: "#2563eb",
                }}
              />
              THÔNG TIN BÀI HỌC
            </Typography>

            <Stack
              direction="row"
              spacing={1.2}
              alignItems="center"
              sx={{
                width: "100%",
                flexWrap: "nowrap",
              }}
            >
              {/* LỚP */}
              <FormControl
                size="small"
                sx={{
                  width: 105,
                  flexShrink: 0,
                }}
              >
                <InputLabel>Lớp</InputLabel>

                <Select
                  value={questionInfo.grade}
                  label="Lớp"
                  disabled={loadingGrades || gradeList.length === 0}
                  onChange={(e) =>
                    handleQuestionInfoChange("grade", e.target.value)
                  }
                >
                  {gradeList.map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      Lớp {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* MÔN HỌC */}
              <FormControl
                size="small"
                sx={{
                  width: 205,
                  flexShrink: 0,
                }}
              >
                <InputLabel>Môn học</InputLabel>

                <Select
                  value={questionInfo.subject}
                  label="Môn học"
                  onChange={(e) =>
                    handleQuestionInfoChange("subject", e.target.value)
                  }
                >
                  {SUBJECTS.map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* TUẦN */}
              <FormControl
                size="small"
                sx={{
                  width: 110,
                  flexShrink: 0,
                }}
              >
                <InputLabel>Tuần</InputLabel>

                <Select
                  value={questionInfo.week}
                  label="Tuần"
                  onChange={(e) =>
                    handleQuestionInfoChange("week", e.target.value)
                  }
                >
                  {Array.from({ length: 35 }, (_, i) => i + 1).map((week) => (
                    <MenuItem key={week} value={String(week)}>
                      Tuần {week}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* TÊN BÀI */}
              <TextField
                fullWidth
                size="small"
                label="Tên bài"
                placeholder="Nhập tên bài học..."
                value={questionInfo.lesson}
                onChange={(e) =>
                  handleQuestionInfoChange("lesson", e.target.value)
                }
                sx={{
                  flex: 1,
                  minWidth: 0,
                }}
              />
            </Stack>
          </Paper>

          {/* DANH SÁCH CÂU HỎI */}
          <Paper
            elevation={0}
            sx={{
              mt: 1.8,
              p: 2,
              borderRadius: 3,
              border: "1px solid #dbeafe",
              bgcolor: "#fff",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              mb={1}
            >
              <Typography
                fontSize={13}
                fontWeight={900}
                color="#172554"
              >
                DANH SÁCH CÂU HỎI
              </Typography>

              <Chip
                size="small"
                label={`${questionCount} câu`}
                sx={{
                  fontWeight: 800,
                  color: "#1d4ed8",
                  bgcolor: "#dbeafe",
                }}
              />
            </Stack>

            <Typography
              fontSize={12}
              color="#64748b"
              mb={1}
            >
              Nhập mỗi câu hỏi trên một dòng riêng biệt.
            </Typography>

            {/* TRẠNG THÁI TẢI */}
            {loadingQuestions && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                  p: 1,
                  borderRadius: 2,
                  bgcolor: "#eff6ff",
                }}
              >
                <CircularProgress size={16} />

                <Typography
                  fontSize={12}
                  color="#2563eb"
                  fontWeight={700}
                >
                  Đang tải danh sách câu hỏi...
                </Typography>
              </Box>
            )}

            {/* BẢNG CÂU HỎI */}
            <Box
              data-question-table
              sx={{
                width: "100%",
                border: "1px solid #cbd5e1",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              {/* TIÊU ĐỀ CỘT */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "55px minmax(0, 1fr)",
                  bgcolor: "#e8f0fe",
                  borderBottom: "1px solid #cbd5e1",
                }}
              >
                <Box
                  sx={{
                    py: 1,
                    textAlign: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    color: "#334155",
                    borderRight: "1px solid #cbd5e1",
                  }}
                >
                  STT
                </Box>

                <Box
                  sx={{
                    py: 1,
                    px: 1.5,
                    fontWeight: 800,
                    fontSize: 13,
                    color: "#334155",
                  }}
                >
                  NỘI DUNG
                </Box>
              </Box>

              {/* CÁC DÒNG CÂU HỎI */}
              {questionInfo.content
                .split("\n")
                .map((line, index, lines) => (
                  <Box
                    key={index}
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "55px minmax(0, 1fr)",
                      minHeight: 46,
                      borderBottom:
                        index < lines.length - 1
                          ? "1px solid #e2e8f0"
                          : "none",
                      bgcolor:
                        index % 2 === 0
                          ? "#fff"
                          : "#f8fafc",
                      "&:focus-within": {
                        bgcolor: "#eff6ff",
                      },
                    }}
                  >
                    {/* SỐ THỨ TỰ */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRight: "1px solid #e2e8f0",
                        color: "#64748b",
                        fontSize: 14,
                        fontWeight: 700,
                        userSelect: "none",
                      }}
                    >
                      {index + 1}
                    </Box>

                    {/* NỘI DUNG CÂU HỎI */}
                    <Box
                      component="textarea"
                      value={line}
                      disabled={loadingQuestions || saving}
                      onChange={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;

                        const updatedLines = lines.slice();
                        updatedLines[index] = e.target.value;

                        handleQuestionInfoChange(
                          "content",
                          updatedLines.join("\n")
                        );
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey
                        ) {
                          e.preventDefault();

                          const updatedLines = lines.slice();
                          updatedLines.splice(index + 1, 0, "");

                          handleQuestionInfoChange(
                            "content",
                            updatedLines.join("\n")
                          );

                          const table = e.currentTarget.closest(
                            "[data-question-table]"
                          );

                          requestAnimationFrame(() => {
                            const inputs =
                              table?.querySelectorAll("textarea");

                            inputs?.[index + 1]?.focus();
                          });
                        }

                        if (
                          e.key === "Backspace" &&
                          line === "" &&
                          lines.length > 1
                        ) {
                          e.preventDefault();

                          const updatedLines = lines.slice();
                          updatedLines.splice(index, 1);

                          handleQuestionInfoChange(
                            "content",
                            updatedLines.join("\n")
                          );

                          const table = e.currentTarget.closest(
                            "[data-question-table]"
                          );

                          requestAnimationFrame(() => {
                            const inputs =
                              table?.querySelectorAll("textarea");

                            inputs?.[
                              Math.max(0, index - 1)
                            ]?.focus();
                          });
                        }
                      }}
                      ref={(el) => {
                        if (el) {
                          el.style.height = "auto";
                          el.style.height = `${el.scrollHeight}px`;
                        }
                      }}
                      rows={1}
                      style={{
                        width: "100%",
                        minHeight: 58,
                        padding: "10px 12px",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        overflow: "hidden",
                        background: "transparent",
                        fontFamily: "inherit",
                        fontSize: 16,
                        lineHeight: 1.6,
                        boxSizing: "border-box",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "break-word",
                        display: "block",
                      }}
                    />
                  </Box>
                ))}
            </Box>
          </Paper>

          {/* NÚT LƯU */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Button
              variant="contained"
              startIcon={
                saving ? (
                  <CircularProgress
                    size={17}
                    color="inherit"
                  />
                ) : (
                  <SaveRoundedIcon />
                )
              }
              onClick={handleSave}
              disabled={!canSave}
              sx={{
                mt: 2,
                width: { xs: "100%", sm: "25%" },
                py: 1.35,
                borderRadius: 2.5,
                fontWeight: 900,
                fontSize: 13,
                background:
                  "linear-gradient(90deg,#2563eb,#0284c7)",
                boxShadow:
                  "0 6px 16px rgba(37,99,235,.22)",
                "&:hover": {
                  background:
                    "linear-gradient(90deg,#1d4ed8,#0369a1)",
                },
              }}
            >
              {saving ? "ĐANG LƯU..." : "LƯU CÂU HỎI"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* THÔNG BÁO */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() =>
          setNotification((prev) => ({
            ...prev,
            open: false,
          }))
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={notification.severity}
          variant="filled"
          onClose={() =>
            setNotification((prev) => ({
              ...prev,
              open: false,
            }))
          }
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}