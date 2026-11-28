
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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

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

const createEmptyRow = () => ({
  question: "",
  answer: "",
});

const normalizeWeek = (value) => {
  const week = Number(value);

  return Number.isInteger(week) && week >= 1 && week <= 35
    ? String(week)
    : "";
};

const getGrade = (value) => {
  const match = String(value || "").trim().match(/^(\d+)/);
  return match ? match[1] : "";
};

const normalizeSubject = (value) => {
  if (Array.isArray(value)) {
    return String(value[0] || "").trim();
  }

  return String(value || "").trim();
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
    week: "",
    lesson: "",
  });

  const [gradeList, setGradeList] = useState([]);

  const [questionRows, setQuestionRows] = useState([
    createEmptyRow(),
  ]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [saving, setSaving] = useState(false);

  const [drawMode, setDrawMode] = useState("sequential");

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotification = (message, severity = "success") => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const getCurrentUsername = () => {
    try {
      const currentUser = JSON.parse(
        localStorage.getItem("tools_user") || "null"
      );

      return String(currentUser?.username || "")
        .trim()
        .toLowerCase();
    } catch (error) {
      console.error("Lỗi đọc tài khoản:", error);
      return "";
    }
  };

  const getQuestionDocumentId = (grade, week) => {
    return `quiz_Lớp ${grade}_${week}`;
  };

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

  const handleQuestionInfoChange = (field, value) => {
    setQuestionInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRowChange = (index, field, value) => {
    setQuestionRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  // THÊM CÂU HỎI
  const handleAddRow = () => {
    setQuestionRows((prev) => {
      const nextRows = [...prev, createEmptyRow()];

      setSelectedIndex(nextRows.length - 1);

      return nextRows;
    });
  };

  // XÓA CÂU HỎI
  const handleRemoveRow = (index) => {
    setQuestionRows((prev) => {
      if (prev.length <= 1) {
        setSelectedIndex(0);
        return [createEmptyRow()];
      }

      const nextRows = prev.filter((_, i) => i !== index);

      if (index < selectedIndex) {
        setSelectedIndex((current) => current - 1);
      } else if (index === selectedIndex) {
        setSelectedIndex(
          Math.min(index, nextRows.length - 1)
        );
      }

      return nextRows;
    });
  };

  // TẢI THÔNG TIN TÀI KHOẢN
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const fetchUserInfo = async () => {
      setLoadingGrades(true);

      try {
        const username = getCurrentUsername();

        if (!username) {
          throw new Error(
            "Không xác định được tài khoản đăng nhập."
          );
        }

        const userRef = doc(db, "USERS", username);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          throw new Error(
            "Không tìm thấy thông tin tài khoản."
          );
        }

        const userData = userSnap.data();

        const classValues = Array.isArray(userData.lopDay)
          ? userData.lopDay
          : String(userData.lopDay || "").split(",");

        const grades = [
          ...new Set(
            classValues
              .map((item) => getGrade(item))
              .filter(Boolean)
          ),
        ].sort((a, b) => Number(a) - Number(b));

        const selectedGrade = getGrade(
          userData.lopDangChon
        );

        const selectedSubject = normalizeSubject(
          userData.monHoc
        );

        const selectedWeek = normalizeWeek(userData.tuan);

        if (cancelled) return;

        if (
          selectedGrade &&
          !grades.includes(selectedGrade)
        ) {
          grades.push(selectedGrade);
          grades.sort((a, b) => Number(a) - Number(b));
        }

        setGradeList(grades);

        setQuestionInfo({
          grade: selectedGrade || grades[0] || "",
          subject: selectedSubject || "Tin học",
          week: selectedWeek,
          lesson: "",
        });

        setQuestionRows([createEmptyRow()]);
        setSelectedIndex(0);
        setDrawMode("sequential");

      } catch (error) {
        console.error("Lỗi tải thông tin tài khoản:", error);

        if (!cancelled) {
          showNotification(
            error.message ||
              "Không thể tải thông tin tài khoản.",
            "error"
          );

          setGradeList([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingGrades(false);
        }
      }
    };

    fetchUserInfo();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // TẢI CÂU HỎI TỪ FIRESTORE
  useEffect(() => {
    if (!open || loadingGrades) return;

    const { grade, subject, week } = questionInfo;

    if (!grade || !subject || !week) {
      setLoadingQuestions(false);
      setQuestionRows([createEmptyRow()]);
      setSelectedIndex(0);
      setDrawMode("sequential");
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

          setDrawMode(
            data.cheDoChonCauHoi === "random"
              ? "random"
              : "sequential"
          );

          const questions = Array.isArray(data.cauHoi)
            ? data.cauHoi
            : [];

          const answers = Array.isArray(data.dapAn)
            ? data.dapAn
            : [];

          const rows = questions
            .map((question, index) => ({
              question: String(question || ""),
              answer: String(answers[index] || ""),
            }))
            .filter(
              (row) =>
                row.question.trim() || row.answer.trim()
            );

          setQuestionRows(
            rows.length ? rows : [createEmptyRow()]
          );

          setSelectedIndex(0);

          setQuestionInfo((prev) => ({
            ...prev,
            lesson: data.tenBai || "",
          }));

          console.log("Đã tải câu hỏi:", rows.length);
          console.log(
            "Chế độ chọn câu hỏi:",
            data.cheDoChonCauHoi || "sequential"
          );
        } else {
          setQuestionRows([createEmptyRow()]);
          setSelectedIndex(0);
          setDrawMode("sequential");

          setQuestionInfo((prev) => ({
            ...prev,
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
          setQuestionRows([createEmptyRow()]);
          setSelectedIndex(0);
          setDrawMode("sequential");

          showNotification(
            error.message ||
              "Không thể tải danh sách câu hỏi.",
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
    loadingGrades,
    questionInfo.grade,
    questionInfo.subject,
    questionInfo.week,
  ]);

  const questionCount = questionRows.filter(
    (row) => row.question.trim()
  ).length;

  const currentRow =
    questionRows[selectedIndex] || createEmptyRow();

  // LƯU CÂU HỎI
  const handleSave = async () => {
    if (drawing || saving || loadingQuestions) return;

    if (!questionInfo.grade) {
      showNotification("Vui lòng chọn lớp học.", "warning");
      return;
    }

    if (!questionInfo.subject) {
      showNotification("Vui lòng chọn môn học.", "warning");
      return;
    }

    if (!questionInfo.week) {
      showNotification("Vui lòng chọn tuần học.", "warning");
      return;
    }

    if (!questionInfo.lesson.trim()) {
      showNotification("Vui lòng nhập tên bài.", "warning");
      return;
    }

    const rows = questionRows.map((row) => ({
      question: String(row.question || "").trim(),
      answer: String(row.answer || "").trim(),
    }));

    if (!rows.length) {
      showNotification(
        "Vui lòng nhập ít nhất một câu hỏi.",
        "warning"
      );
      return;
    }

    const missingQuestion = rows.findIndex(
      (row) => !row.question
    );

    if (missingQuestion !== -1) {
      setSelectedIndex(missingQuestion);

      showNotification(
        `Vui lòng nhập nội dung Câu hỏi ${missingQuestion + 1}.`,
        "warning"
      );
      return;
    }

    const missingAnswer = rows.findIndex(
      (row) => !row.answer
    );

    if (missingAnswer !== -1) {
      setSelectedIndex(missingAnswer);

      showNotification(
        `Vui lòng nhập kiến thức cần ghi nhớ cho Câu hỏi ${missingAnswer + 1}.`,
        "warning"
      );
      return;
    }

    const questions = rows.map((row) => row.question);
    const answers = rows.map((row) => row.answer);

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

        cauHoi: questions,
        dapAn: answers,

        soLuong: questions.length,
        cheDoChonCauHoi: drawMode,

        namHoc: schoolYear,
        updatedAt: serverTimestamp(),
      };

      const documentRef = getQuestionDocumentRef(
        username,
        questionInfo.subject,
        documentId
      );

      console.log(
        "Đường dẫn lưu:",
        documentRef.path
      );

      console.log("Số câu hỏi:", questions.length);
      console.log("Chế độ:", drawMode);

      await setDoc(documentRef, documentData);

      showNotification(
        "Đã lưu câu hỏi và cấu hình thành công.",
        "success"
      );

      onSave?.(
        questions,
        questionInfo,
        answers,
        drawMode
      );

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

  const canSave =
    questionInfo.grade &&
    questionInfo.subject &&
    questionInfo.week &&
    questionInfo.lesson.trim() &&
    questionCount > 0 &&
    questionRows.every(
      (row) =>
        row.question.trim() &&
        row.answer.trim()
    ) &&
    !drawing &&
    !loadingQuestions &&
    !loadingGrades &&
    !saving;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth={false}
        TransitionComponent={Fade}
        sx={{
          "& .MuiDialog-container": {
            alignItems: "center",
          },
          "& .MuiDialog-paper": {
            margin: {
              xs: "8px",
              sm: "32px",
            },
          },
        }}
        PaperProps={{
          sx: {
            width: {
              xs: "calc(100vw - 16px)",
              sm: "calc(100% - 64px)",
            },
            maxWidth: {
              xs: "calc(100vw - 16px)",
              sm: "900px",
            },
            height: {
              xs: "96%",
              sm: "94dvh",
            },
            maxHeight: {
              xs: "96%",
              sm: "94dvh",
            },
            borderRadius: 4,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            bgcolor: "#F8FAFC",
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
              flexShrink: 0,
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
              Câu hỏi tự luận và nội dung củng cố kiến thức
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
            p: { xs: 1.5, sm: 2.5 },
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
              mb={1.5}
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
                flexWrap: "wrap",
                rowGap: 1.2,
              }}
            >
              <FormControl
                size="small"
                sx={{
                  flex: { xs: "1 1 calc(50% - 8px)", sm: "0 0 105px" },
                  minWidth: 0,
                }}
              >
                <InputLabel>Lớp</InputLabel>

                <Select
                  value={questionInfo.grade}
                  label="Lớp"
                  disabled={
                    loadingGrades ||
                    gradeList.length === 0 ||
                    saving ||
                    loadingQuestions
                  }
                  onChange={(e) =>
                    handleQuestionInfoChange(
                      "grade",
                      e.target.value
                    )
                  }
                >
                  {gradeList.map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      Lớp {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{
                  flex: { xs: "1 1 calc(50% - 8px)", sm: "0 0 190px" },
                  minWidth: 0,
                }}
              >
                <InputLabel>Môn học</InputLabel>

                <Select
                  value={questionInfo.subject}
                  label="Môn học"
                  disabled={saving || loadingQuestions}
                  onChange={(e) =>
                    handleQuestionInfoChange(
                      "subject",
                      e.target.value
                    )
                  }
                >
                  {SUBJECTS.map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}

                  {questionInfo.subject &&
                    !SUBJECTS.includes(questionInfo.subject) && (
                      <MenuItem value={questionInfo.subject}>
                        {questionInfo.subject}
                      </MenuItem>
                    )}
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{
                  flex: { xs: "1 1 calc(50% - 8px)", sm: "0 0 105px" },
                  minWidth: 0,
                }}
              >
                <InputLabel>Tuần</InputLabel>

                <Select
                  value={questionInfo.week}
                  label="Tuần"
                  disabled={saving || loadingQuestions}
                  onChange={(e) =>
                    handleQuestionInfoChange(
                      "week",
                      e.target.value
                    )
                  }
                >
                  {Array.from({ length: 35 }, (_, i) => i + 1).map(
                    (week) => (
                      <MenuItem
                        key={week}
                        value={String(week)}
                      >
                        Tuần {week}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Tên bài"
                placeholder="Nhập tên bài học..."
                value={questionInfo.lesson}
                disabled={saving || loadingQuestions}
                onChange={(e) =>
                  handleQuestionInfoChange(
                    "lesson",
                    e.target.value
                  )
                }
                sx={{
                  flex: { xs: "1 1 100%", sm: "1 1 180px" },
                  minWidth: 0,
                }}
              />
            </Stack>
          </Paper>

          {/* CẤU HÌNH CHỌN CÂU HỎI */}
          <Paper
            elevation={0}
            sx={{
              mt: 1.5,
              p: 1.7,
              borderRadius: 3,
              border: "1px solid #dbeafe",
              bgcolor: "#fff",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              spacing={1.5}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  fontSize={12}
                  fontWeight={900}
                  color="#172554"
                >
                  CÁCH CHỌN CÂU HỎI
                </Typography>

                <Typography fontSize={11} color="#64748b">
                  Thiết lập thứ tự xuất hiện khi bốc thăm
                </Typography>
              </Box>

              <FormControl
                size="small"
                sx={{
                  width: { xs: "100%", sm: 240 },
                }}
              >
                <Select
                  value={drawMode}
                  disabled={
                    loadingQuestions ||
                    saving ||
                    drawing
                  }
                  onChange={(e) =>
                    setDrawMode(e.target.value)
                  }
                >
                  <MenuItem value="sequential">
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                    >
                      <FormatListNumberedRoundedIcon
                        fontSize="small"
                        sx={{ color: "#2563eb" }}
                      />
                      <span>Lần lượt theo thứ tự</span>
                    </Stack>
                  </MenuItem>

                  <MenuItem value="random">
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                    >
                      <ShuffleRoundedIcon
                        fontSize="small"
                        sx={{ color: "#7c3aed" }}
                      />
                      <span>Chọn ngẫu nhiên</span>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>

          {/* DANH SÁCH CÂU HỎI */}
          <Paper
            elevation={0}
            sx={{
              mt: 1.5,
              p: { xs: 1.5, sm: 2 },
              borderRadius: 3,
              border: "1px solid #dbeafe",
              bgcolor: "#fff",
            }}
          >
            {/* TIÊU ĐỀ */}
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
              fontSize={11}
              color="#64748b"
              mb={1.5}
            >
              Chọn từng câu để nhập hoặc chỉnh sửa nội dung. Mỗi lần chỉ hiển thị một câu hỏi.
            </Typography>

            {/* TRẠNG THÁI TẢI */}
            {loadingQuestions && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1.5,
                  p: 1.2,
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

            {/* CHIP CÂU HỎI + NÚT THÊM CÙNG MỘT HÀNG */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                mb: 1.8,
                flexWrap: "wrap",
              }}
            >
              {/* CÁC CHIP CHỌN CÂU */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 0.8,
                  flex: "1 1 auto",
                  minWidth: 0,
                }}
              >
                {questionRows.map((row, index) => (
                  <Chip
                    key={index}
                    clickable
                    label={`Câu ${index + 1}`}
                    onClick={() => setSelectedIndex(index)}
                    color={
                      selectedIndex === index
                        ? "primary"
                        : "default"
                    }
                    variant={
                      selectedIndex === index
                        ? "filled"
                        : "outlined"
                    }
                    sx={{
                      height: 34,
                      borderRadius: 2,
                      fontWeight: 800,
                      fontSize: 12,
                      bgcolor:
                        selectedIndex === index
                          ? "#2563eb"
                          : "#fff",
                      color:
                        selectedIndex === index
                          ? "#fff"
                          : "#475569",
                      borderColor:
                        selectedIndex === index
                          ? "#2563eb"
                          : "#cbd5e1",
                      "&:hover": {
                        bgcolor:
                          selectedIndex === index
                            ? "#1d4ed8"
                            : "#eff6ff",
                      },
                    }}
                  />
                ))}
              </Box>

              {/* NÚT THÊM CÂU HỎI - CĂN PHẢI */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={handleAddRow}
                disabled={
                  loadingQuestions ||
                  saving ||
                  drawing
                }
                sx={{
                  flexShrink: 0,
                  ml: "auto",
                  minWidth: "auto",
                  px: 1.5,
                  height: 34,
                  borderRadius: 2,
                  borderStyle: "dashed",
                  borderWidth: 1.5,
                  borderColor: "#93c5fd",
                  color: "#2563eb",
                  fontSize: 11,
                  fontWeight: 900,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  bgcolor: "#f8fbff",
                  "&:hover": {
                    borderWidth: 1.5,
                    borderStyle: "dashed",
                    borderColor: "#2563eb",
                    bgcolor: "#eff6ff",
                  },
                }}
              >
                THÊM CÂU HỎI
              </Button>
            </Box>

            {/* CHỈ HIỂN THỊ CÂU ĐANG CHỌN */}
            {!loadingQuestions && (
              <Paper
                elevation={0}
                sx={{
                  position: "relative",
                  p: { xs: 1.3, sm: 1.8 },
                  borderRadius: 3,
                  border: "1px solid #dbeafe",
                  bgcolor: "#fff",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    bgcolor: "#2563eb",
                  },
                }}
              >
                {/* TIÊU ĐỀ CÂU */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  mb={1.5}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 2,
                      bgcolor: "#dbeafe",
                      color: "#1d4ed8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    {selectedIndex + 1}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      fontSize={12}
                      fontWeight={900}
                      color="#1e3a8a"
                    >
                      CÂU HỎI {selectedIndex + 1}
                    </Typography>

                    <Typography
                      fontSize={10}
                      color="#94a3b8"
                    >
                      Câu hỏi tự luận
                    </Typography>
                  </Box>

                  <IconButton
                    size="small"
                    disabled={
                      questionRows.length <= 1 ||
                      saving ||
                      drawing
                    }
                    onClick={() =>
                      handleRemoveRow(selectedIndex)
                    }
                    sx={{
                      width: 32,
                      height: 32,
                      color: "#ef4444",
                      bgcolor: "#fef2f2",
                      "&:hover": {
                        bgcolor: "#fee2e2",
                      },
                    }}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>

                {/* NỘI DUNG CÂU HỎI */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2.5,
                    bgcolor: "#eff6ff",
                    border: "1px solid #dbeafe",
                    mb: 1.3,
                  }}
                >
                  <Typography
                    fontSize={11}
                    fontWeight={900}
                    color="#1d4ed8"
                    mb={1}
                  >
                    NỘI DUNG CÂU HỎI
                  </Typography>

                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={10}
                    placeholder="Nhập nội dung câu hỏi tự luận..."
                    value={currentRow.question}
                    disabled={
                      loadingQuestions ||
                      saving ||
                      drawing
                    }
                    onChange={(e) =>
                      handleRowChange(
                        selectedIndex,
                        "question",
                        e.target.value
                      )
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#fff",
                        borderRadius: 2,
                        fontSize: 13,
                        lineHeight: 1.7,
                        alignItems: "flex-start",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#bfdbfe",
                      },
                      "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#60a5fa",
                      },
                    }}
                  />
                </Box>

                {/* KIẾN THỨC CẦN GHI NHỚ */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2.5,
                    bgcolor: "#ecfdf5",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.8}
                    mb={1}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 2,
                        bgcolor: "#d1fae5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <QuizRoundedIcon
                        sx={{
                          fontSize: 17,
                          color: "#059669",
                        }}
                      />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        fontSize={11}
                        fontWeight={900}
                        color="#047857"
                      >
                        KIẾN THỨC CẦN GHI NHỚ
                      </Typography>

                      <Typography
                        fontSize={10}
                        color="#64748b"
                      >
                        Nội dung giải thích và củng cố kiến thức
                      </Typography>
                    </Box>
                  </Stack>

                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={12}
                    placeholder="Nhập nội dung trả lời, lời giải thích, kiến thức trọng tâm hoặc ví dụ minh họa..."
                    value={currentRow.answer}
                    disabled={
                      loadingQuestions ||
                      saving ||
                      drawing
                    }
                    onChange={(e) =>
                      handleRowChange(
                        selectedIndex,
                        "answer",
                        e.target.value
                      )
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#fff",
                        borderRadius: 2,
                        fontSize: 13,
                        lineHeight: 1.7,
                        alignItems: "flex-start",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#a7f3d0",
                      },
                      "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#34d399",
                      },
                    }}
                  />

                  <Typography
                    fontSize={10}
                    color="#059669"
                    sx={{ mt: 0.8 }}
                  >
                    Nội dung này giúp học sinh hiểu bài và ghi nhớ kiến thức, không phải đáp án trắc nghiệm.
                  </Typography>
                </Box>
              </Paper>
            )}
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
                width: {
                  xs: "100%",
                  sm: "25%",
                },
                minWidth: {
                  sm: 180,
                },
                py: 1.35,
                borderRadius: 2.5,
                fontWeight: 900,
                fontSize: 13,
                textTransform: "none",
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
