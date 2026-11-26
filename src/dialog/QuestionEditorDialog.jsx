
import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Paper,
  Stack,
  Chip,
  Fade,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import PlaylistAddRoundedIcon from "@mui/icons-material/PlaylistAddRounded";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";
import DialogHeader from "./DialogHeader";

// =========================
// CẤU HÌNH
// =========================
const COLLECTION_NAME = "DAU_TRUONG_KIEN_THUC";

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

const OPTION_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const getOptionLabel = (index) => {
  return index < OPTION_LABELS.length
    ? OPTION_LABELS[index]
    : `PA${index + 1}`;
};

const paperSx = {
  borderRadius: 3,
  border: "1px solid #e2e8f0",
  bgcolor: "#fff",
  boxShadow: "none",
};

const primaryButtonSx = {
  borderRadius: 2.5,
  fontWeight: 900,
  textTransform: "none",
  background: "linear-gradient(90deg,#2563eb,#0ea5e9)",
  boxShadow: "0 5px 14px rgba(37,99,235,.18)",
  "&:hover": {
    background: "linear-gradient(90deg,#1d4ed8,#0284c7)",
  },
  "&.Mui-disabled": {
    color: "#fff",
    opacity: 0.45,
  },
};

const createQuestion = () => ({
  id: Date.now() + Math.random(),
  question: "",
  options: ["", "", "", ""],
  answerIndex: 0,
});

// =========================
// LẤY TUẦN ĐANG CHỌN
// =========================
const getCurrentWeek = () => {
  try {
    const value = localStorage.getItem("tools_tuan");

    if (!value) return "";

    return String(value)
      .trim()
      .replace(/^["']|["']$/g, "");
  } catch (error) {
    console.error("Lỗi đọc tuần:", error);
    return "";
  }
};

// =========================
// LẤY TÀI KHOẢN ĐĂNG NHẬP
// =========================
const getCurrentUsername = () => {
  try {
    const currentUser = JSON.parse(
      localStorage.getItem("tools_user") || "null"
    );

    return String(currentUser?.username || "").trim();
  } catch (error) {
    console.error("Lỗi đọc tài khoản:", error);
    return "";
  }
};

export default function QuestionEditorDialog({
  open,
  onClose,
  onApply,
  questions = [],
  setQuestions,
  selectedSubject = "Tin học",
  selectedGrade = "",
}) {
  const safeQuestions = Array.isArray(questions) ? questions : [];

  const [draftSubject, setDraftSubject] = useState(selectedSubject);
  const [draftGrade, setDraftGrade] = useState(selectedGrade);

  const [draftWeek, setDraftWeek] = useState("");
  const [draftTitle, setDraftTitle] = useState("");

  const [gradeList, setGradeList] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [saving, setSaving] = useState(false);

  const getCurrentWeek = () => {
    try {
      const value =
        localStorage.getItem("tuan") ||
        localStorage.getItem("tools_tuan") ||
        "";

      const parsed = String(value)
        .trim()
        .replace(/^["']|["']$/g, "");

      const match = parsed.match(/\d+/);

      return match ? match[0] : "";
    } catch (error) {
      console.error("Lỗi đọc tuần:", error);
      return "";
    }
  };

  // =========================
// ĐỒNG BỘ THÔNG TIN KHI MỞ HỘP THOẠI
// =========================
useEffect(() => {
  if (!open) return;

  setDraftSubject(selectedSubject || "Tin học");
  setDraftGrade(String(selectedGrade || ""));
  setDraftWeek(getCurrentWeek());

  // Xóa dữ liệu đề cũ trong lúc tải đề mới
  setDraftTitle("");
  setQuestions([createQuestion()]);
}, [open, selectedSubject, selectedGrade]);

// =========================
// TẢI TOÀN BỘ ĐỀ THI KHI THAY ĐỔI LỚP / MÔN / TUẦN
// =========================
useEffect(() => {
  if (!open || !draftGrade || !draftSubject || !draftWeek) {
    return;
  }

  let cancelled = false;

  const fetchExam = async () => {
    try {
      const username = getCurrentUsername();

      if (!username) {
        throw new Error("Không xác định được tài khoản đăng nhập.");
      }

      const documentId = `quiz_Lớp ${draftGrade}_${draftWeek}`;

      const questionRef = doc(
        db,
        "USERS",
        username,
        COLLECTION_NAME,
        draftSubject,
        "DANHSACH",
        documentId
      );

      const questionSnap = await getDoc(questionRef);

      if (cancelled) return;

      if (questionSnap.exists()) {
        const data = questionSnap.data();

        // Khôi phục tên bài
        setDraftTitle(data.tenBai || "");

        // Khôi phục toàn bộ câu hỏi và phương án
        const loadedQuestions = Array.isArray(data.questions)
          ? data.questions.map((item, index) => ({
              ...item,
              id: item.id || Date.now() + index,
              question: item.question || "",
              options: Array.isArray(item.options)
                ? item.options
                : ["", "", "", ""],
              answerIndex: Number(item.answerIndex ?? 0),
            }))
          : [];

        setQuestions(
          loadedQuestions.length
            ? loadedQuestions
            : [createQuestion()]
        );
      } else {
        // Chưa có đề thi tương ứng
        setDraftTitle("");
        setQuestions([createQuestion()]);
      }
    } catch (error) {
      console.error("Lỗi tải đề thi:", error);

      if (!cancelled) {
        setDraftTitle("");
        setQuestions([createQuestion()]);

        showMessage(
          error.message || "Không tải được đề thi từ Firestore.",
          "error"
        );
      }
    }
  };

  fetchExam();

  return () => {
    cancelled = true;
  };
}, [open, draftGrade, draftSubject, draftWeek]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showMessage = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // =========================
  // TẢI DANH SÁCH LỚP ĐƯỢC PHÂN CÔNG
  // USERS/{username}.lopDay
  // =========================
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

        const classValues = Array.isArray(lopDay)
          ? lopDay
          : String(lopDay || "").split(",");

        const grades = [
          ...new Set(
            classValues
              .map((item) => {
                const match = String(item)
                  .trim()
                  .match(/^(\d+)\s*\./);

                return match ? match[1] : "";
              })
              .filter(Boolean)
          ),
        ].sort((a, b) => Number(a) - Number(b));

        if (!cancelled) {
          setGradeList(grades);

          setDraftGrade((prev) => {
            const currentGrade = String(selectedGrade || "");

            if (grades.includes(currentGrade)) {
              return currentGrade;
            }

            return grades.includes(prev) ? prev : "";
          });
        }
      } catch (error) {
        console.error("Lỗi tải danh sách lớp:", error);

        if (!cancelled) {
          setGradeList([]);
          setDraftGrade("");

          showMessage(
            error.message || "Không tải được danh sách lớp.",
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
  // ĐỒNG BỘ LỚP VÀ MÔN TỪ COMPONENT CHA
  // =========================
  useEffect(() => {
    if (!open) return;

    setDraftSubject(selectedSubject || "Tin học");

    if (selectedGrade) {
      setDraftGrade(String(selectedGrade));
    }
  }, [open, selectedSubject, selectedGrade]);

  // =========================
  // ĐẾM CÂU HỎI HỢP LỆ
  // =========================
  const validCount = safeQuestions.filter(
    (item) =>
      item.question?.trim() &&
      Array.isArray(item.options) &&
      item.options.length >= 2 &&
      item.options.every((option) =>
        String(option ?? "").trim()
      ) &&
      Number.isInteger(Number(item.answerIndex)) &&
      item.answerIndex >= 0 &&
      item.answerIndex < item.options.length
  ).length;

  // =========================
  // CẬP NHẬT THÔNG TIN CÂU HỎI
  // =========================
  const updateQuestion = (id, field, value) => {
    setQuestions((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  // =========================
  // CẬP NHẬT NỘI DUNG PHƯƠNG ÁN
  // =========================
  const updateOption = (id, optionIndex, value) => {
    setQuestions((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              options: item.options.map((option, index) =>
                index === optionIndex ? value : option
              ),
            }
          : item
      )
    );
  };

  // =========================
  // THÊM CÂU HỎI
  // =========================
  const addQuestion = () => {
    setQuestions((prev) => [...prev, createQuestion()]);
  };

  // =========================
  // XÓA CÂU HỎI
  // =========================
  const deleteQuestion = (id) => {
    setQuestions((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next.length ? next : [createQuestion()];
    });
  };

  // =========================
  // THÊM PHƯƠNG ÁN
  // =========================
  const addOption = (id) => {
    setQuestions((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        return {
          ...item,
          options: [...item.options, ""],
        };
      })
    );
  };

  // =========================
  // XÓA PHƯƠNG ÁN
  // =========================
  const deleteOption = (id, optionIndex) => {
    setQuestions((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (item.options.length <= 2) return item;

        const nextOptions = item.options.filter(
          (_, index) => index !== optionIndex
        );

        let nextAnswerIndex = item.answerIndex;

        if (optionIndex === item.answerIndex) {
          nextAnswerIndex = 0;
        } else if (optionIndex < item.answerIndex) {
          nextAnswerIndex -= 1;
        }

        return {
          ...item,
          options: nextOptions,
          answerIndex: nextAnswerIndex,
        };
      })
    );
  };

  // =========================
  // LƯU FIRESTORE
  // USERS/{username}/DAU_TRUONG_KIEN_THUC/{subject}/DANHSACH/{documentId}
  // =========================
  const handleApply = async () => {
    if (saving) return;

    const username = getCurrentUsername();

    if (!username) {
      showMessage("Không xác định được tài khoản đăng nhập.", "error");
      return;
    }

    if (!draftGrade || !draftSubject || !draftWeek) {
      showMessage("Vui lòng chọn lớp, môn học và tuần.", "warning");
      return;
    }

    if (!draftTitle.trim()) {
      showMessage("Vui lòng nhập tên bài.", "warning");
      return;
    }

    if (validCount === 0) {
      showMessage("Vui lòng nhập ít nhất một câu hỏi hợp lệ.", "warning");
      return;
    }

    const validQuestions = safeQuestions
      .filter(
        (item) =>
          item.question?.trim() &&
          Array.isArray(item.options) &&
          item.options.length >= 2 &&
          item.options.every((option) =>
            String(option ?? "").trim()
          ) &&
          Number.isInteger(Number(item.answerIndex)) &&
          item.answerIndex >= 0 &&
          item.answerIndex < item.options.length
      )
      .map((item, index) => ({
        id: item.id || Date.now() + index,
        question: String(item.question).trim(),
        options: item.options.map((option) =>
          String(option).trim()
        ),
        answerIndex: Number(item.answerIndex),
      }));

    const documentId = `quiz_Lớp ${draftGrade}_${draftWeek}`;

    try {
      setSaving(true);

      const questionRef = doc(
        db,
        "USERS",
        username,
        COLLECTION_NAME,
        draftSubject,
        "DANHSACH",
        documentId
      );

      await setDoc(
        questionRef,
        {
          lop: `Lớp ${draftGrade}`,
          khoi: String(draftGrade),
          monHoc: draftSubject,
          tuan: String(draftWeek),
          tenBai: draftTitle.trim(),
          questions: validQuestions,
          soLuongCauHoi: validQuestions.length,
          updatedAt: serverTimestamp(),
          updatedBy: username,
        },
        { merge: true }
      );

      onApply?.({
        grade: draftGrade,
        subject: draftSubject,
        week: String(draftWeek),
        title: draftTitle.trim(),
        documentId,
        questions: validQuestions,
      });

      showMessage(
        `Đã lưu đề thi "${draftTitle.trim()}" - Tuần ${draftWeek}.`,
        "success"
      );

      onClose?.();
    } catch (error) {
      console.error("Lỗi lưu câu hỏi:", error);

      showMessage(
        error.message || "Không thể lưu đề thi lên Firestore.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={saving ? undefined : onClose}
        fullWidth
        maxWidth={false}
        sx={{
          "& .MuiDialog-container": {
            alignItems: "center",
          },
          "& .MuiDialog-paper": {
            margin: { xs: "8px", sm: "32px" },
          },
        }}
        TransitionComponent={Fade}
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
            height: { xs: "96%", sm: "94dvh" },
            maxHeight: { xs: "96%", sm: "94dvh" },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: { xs: 4, sm: 4 },
            bgcolor: "#fff",
            boxShadow: "0 25px 80px rgba(15,23,42,.25)",
          },
        }}
      >
        {/* HEADER */}
        <DialogHeader
          title="SOẠN ĐỀ THI"
          subtitle="Quản lý câu hỏi và đáp án"
          icon={<EditNoteRoundedIcon />}
          onClose={onClose}
        >
          <Chip
            size="medium"
            label={`${validCount}/${safeQuestions.length} câu hợp lệ`}
            sx={{
              color: "#fff",
              bgcolor: "rgba(255,255,255,.14)",
              border: "1px solid rgba(255,255,255,.2)",
              fontWeight: 800,
              fontSize: 13,
              height: 32,
              "& .MuiChip-label": {
                px: 1.5,
              },
            }}
          />
        </DialogHeader>

        {/* NỘI DUNG */}
        <DialogContent
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            overflowY: "auto",
            overflowX: "hidden",
            minHeight: 0,
            flex: "1 1 0",
            bgcolor: "#f8fbff",
          }}
        >
          <Stack spacing={2}>
            {/* THÔNG TIN LỚP VÀ MÔN */}
            <Paper sx={{ ...paperSx, p: 2 }}>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: "#172554",
                  mb: 1.5,
                }}
              >
                THÔNG TIN ĐỀ THI
              </Typography>

              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
              >
                {/* LỚP */}
                <FormControl
                  size="small"
                  sx={{ width: 105, flexShrink: 0 }}
                >
                  <InputLabel>Lớp</InputLabel>

                  <Select
                    value={draftGrade}
                    label="Lớp"
                    disabled={loadingGrades || gradeList.length === 0}
                    onChange={(e) => setDraftGrade(e.target.value)}
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
                  sx={{ width: 190, flexShrink: 0 }}
                >
                  <InputLabel>Môn học</InputLabel>

                  <Select
                    value={draftSubject}
                    label="Môn học"
                    onChange={(e) => setDraftSubject(e.target.value)}
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
                  sx={{ width: 115, flexShrink: 0 }}
                >
                  <InputLabel>Tuần</InputLabel>

                  <Select
                    value={draftWeek}
                    label="Tuần"
                    onChange={(e) => setDraftWeek(e.target.value)}
                  >
                    {Array.from({ length: 35 }, (_, index) => {
                      const week = String(index + 1);

                      return (
                        <MenuItem key={week} value={week}>
                          Tuần {week}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                {/* TÊN BÀI */}
                <TextField
                  fullWidth
                  size="small"
                  label="Tên bài"
                  placeholder="Nhập tên bài thi..."
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  sx={{ minWidth: 0 }}
                />

                {loadingGrades && <CircularProgress size={20} />}
              </Stack>
            </Paper>

            {/* TIÊU ĐỀ VÀ NÚT THÊM CÂU */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={1.5}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: "#172554",
                  }}
                >
                  CÂU HỎI ĐẤU TRƯỜNG KIẾN THỨC
                </Typography>

                <Typography
                  sx={{
                    fontSize: 13,
                    color: "#64748b",
                    mt: 0.3,
                  }}
                >
                  Chọn chữ cái để đặt đáp án đúng.
                </Typography>
              </Box>
            </Stack>

            {/* DANH SÁCH CÂU HỎI */}
            {safeQuestions.map((item, index) => {
              const options = Array.isArray(item.options)
                ? item.options
                : [];

              const isValid =
                item.question?.trim() &&
                options.length >= 2 &&
                options.every((option) =>
                  String(option ?? "").trim()
                ) &&
                Number.isInteger(Number(item.answerIndex)) &&
                item.answerIndex >= 0 &&
                item.answerIndex < options.length;

              return (
                <Paper
                  key={item.id}
                  sx={{
                    ...paperSx,
                    p: { xs: 1.5, sm: 2.5 },
                    borderColor: isValid
                      ? "#bfdbfe"
                      : "#e2e8f0",
                  }}
                >
                  {/* TIÊU ĐỀ CÂU HỎI */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{ mb: 2 }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                        borderRadius: 2.5,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "#eff6ff",
                        color: "#2563eb",
                        fontSize: 16,
                        fontWeight: 900,
                      }}
                    >
                      {index + 1}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 900,
                          color: "#172554",
                        }}
                      >
                        CÂU HỎI {index + 1}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 12,
                          color: isValid
                            ? "#059669"
                            : "#94a3b8",
                          mt: 0.3,
                        }}
                      >
                        {isValid
                          ? "Đã hoàn thành"
                          : "Chưa nhập đầy đủ"}
                      </Typography>
                    </Box>

                    <Tooltip title="Xóa câu hỏi">
                      <span>
                        <IconButton
                          size="medium"
                          color="error"
                          disabled={safeQuestions.length === 1}
                          onClick={() =>
                            deleteQuestion(item.id)
                          }
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2.5,
                            border: "1px solid #fee2e2",
                          }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="medium" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>

                  {/* NỘI DUNG CÂU HỎI */}
                  <TextField
                    fullWidth
                    size="medium"
                    label="Nội dung câu hỏi"
                    placeholder="Nhập nội dung câu hỏi..."
                    value={item.question || ""}
                    onChange={(e) =>
                      updateQuestion(
                        item.id,
                        "question",
                        e.target.value
                      )
                    }
                    multiline
                    minRows={2}
                    maxRows={4}
                    sx={{
                      "& .MuiInputLabel-root": {
                        fontSize: 15,
                        fontWeight: 600,
                      },
                      "& .MuiInputBase-root": {
                        fontSize: 15,
                        lineHeight: 1.6,
                        borderRadius: 2.5,
                        bgcolor: "#fff",
                      },
                      "& .MuiInputBase-input": {
                        p: 1.5,
                      },
                    }}
                  />

                  {/* TIÊU ĐỀ PHƯƠNG ÁN */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1}
                    sx={{ mt: 2, mb: 1.5 }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 900,
                          color: "#475569",
                        }}
                      >
                        CÁC PHƯƠNG ÁN
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "#94a3b8",
                          mt: 0.3,
                        }}
                      >
                        {options.length} phương án
                      </Typography>
                    </Box>

                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                    >
                      <Chip
                        size="medium"
                        color="success"
                        variant="outlined"
                        label={`Đáp án ${getOptionLabel(
                          item.answerIndex || 0
                        )}`}
                        sx={{
                          height: 34,
                          fontSize: 13,
                          fontWeight: 800,
                          "& .MuiChip-label": {
                            px: 1.3,
                          },
                        }}
                      />

                      <Button
                        size="medium"
                        variant="outlined"
                        startIcon={<AddRoundedIcon />}
                        onClick={() => addOption(item.id)}
                        sx={{
                          borderRadius: 2.5,
                          minHeight: 40,
                          px: 1.8,
                          fontSize: 13,
                          fontWeight: 800,
                          textTransform: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Thêm ô
                      </Button>
                    </Stack>
                  </Stack>

                  {/* DANH SÁCH PHƯƠNG ÁN */}
                  <Stack spacing={1.3}>
                    {options.map((option, optionIndex) => {
                      const isCorrect =
                        item.answerIndex === optionIndex;

                      return (
                        <Stack
                          key={optionIndex}
                          direction="row"
                          alignItems="center"
                          spacing={1.2}
                        >
                          <Tooltip
                            title={
                              isCorrect
                                ? "Đáp án đúng"
                                : "Chọn làm đáp án đúng"
                            }
                          >
                            <Button
                              onClick={() =>
                                updateQuestion(
                                  item.id,
                                  "answerIndex",
                                  optionIndex
                                )
                              }
                              sx={{
                                minWidth: 46,
                                width: 46,
                                height: 46,
                                p: 0,
                                flexShrink: 0,
                                borderRadius: 2.5,
                                fontSize: 16,
                                fontWeight: 900,
                                color: isCorrect
                                  ? "#fff"
                                  : "#64748b",
                                bgcolor: isCorrect
                                  ? "#059669"
                                  : "#f1f5f9",
                                "&:hover": {
                                  bgcolor: isCorrect
                                    ? "#047857"
                                    : "#e2e8f0",
                                },
                              }}
                            >
                              {getOptionLabel(optionIndex)}
                            </Button>
                          </Tooltip>

                          <TextField
                            fullWidth
                            size="medium"
                            placeholder={`Nhập phương án ${getOptionLabel(
                              optionIndex
                            )}...`}
                            value={option ?? ""}
                            onChange={(e) =>
                              updateOption(
                                item.id,
                                optionIndex,
                                e.target.value
                              )
                            }
                            sx={{
                              "& .MuiInputBase-root": {
                                minHeight: 48,
                                fontSize: 15,
                                borderRadius: 2.5,
                                bgcolor: isCorrect
                                  ? "#f0fdf4"
                                  : "#fff",
                              },
                              "& .MuiInputBase-input": {
                                px: 1.8,
                                py: 1.2,
                              },
                              "& .MuiInputBase-input::placeholder": {
                                fontSize: 14,
                                opacity: 0.7,
                              },
                            }}
                          />

                          <Tooltip
                            title={
                              options.length <= 2
                                ? "Cần ít nhất 2 phương án"
                                : "Xóa phương án này"
                            }
                          >
                            <span>
                              <IconButton
                                size="medium"
                                color="error"
                                disabled={options.length <= 2}
                                onClick={() =>
                                  deleteOption(
                                    item.id,
                                    optionIndex
                                  )
                                }
                                sx={{
                                  width: 42,
                                  height: 42,
                                  flexShrink: 0,
                                  border: "1px solid #fee2e2",
                                  borderRadius: 2.5,
                                }}
                              >
                                <DeleteOutlineRoundedIcon fontSize="medium" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Paper>
              );
            })}
            {/* NÚT THÊM CÂU HỎI */}
            <Box sx={{ display: "flex", justifyContent: "flex-start", py: 1 }}>
              <Tooltip title="Thêm câu hỏi mới">
                <IconButton
                  onClick={addQuestion}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2.5,
                    color: "#2563eb",
                    bgcolor: "#eff6ff",
                    border: "1px dashed #93c5fd",
                    "&:hover": {
                      bgcolor: "#dbeafe",
                      borderColor: "#2563eb",
                    },
                  }}
                >
                  <PlaylistAddRoundedIcon sx={{ fontSize: 30 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Stack>
        </DialogContent>

        {/* FOOTER */}
        <DialogActions
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderTop: "1px solid #e2e8f0",
            flexShrink: 0,
            justifyContent: "space-between",
            bgcolor: "#fff",
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: "#64748b",
            }}
          >
            {validCount} câu có thể đưa vào cuộc thi
          </Typography>

          <Button
            onClick={handleApply}
            disabled={
              !draftGrade ||
              !draftSubject ||
              !draftWeek ||
              !draftTitle.trim() ||
              loadingGrades ||
              saving
            }
            variant="contained"
            startIcon={
              saving ? (
                <CircularProgress size={17} color="inherit" />
              ) : null
            }
            sx={{
              ...primaryButtonSx,
              minHeight: 42,
              px: 2.5,
              fontSize: 14,
            }}
          >
            {saving ? "Đang lưu..." : "Lưu đề thi"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* THÔNG BÁO */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() =>
          setSnackbar((prev) => ({
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
          severity={snackbar.severity}
          variant="filled"
          onClose={() =>
            setSnackbar((prev) => ({
              ...prev,
              open: false,
            }))
          }
          sx={{
            width: "100%",
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
