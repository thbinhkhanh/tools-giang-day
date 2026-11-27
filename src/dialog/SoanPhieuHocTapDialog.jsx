
import React, { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Chip,
  Fade,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";

import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import DialogHeader from "./DialogHeader";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

import {
  QuestionEditor,
  createEmptyQuestion,
  normalizeQuestions,
  validateQuestion,
} from "../components/QuestionEngine";

// =====================================================
// CẤU HÌNH
// =====================================================

const COLLECTION_NAME = "PHIEU_HOC_TAP";

const SUBJECT_OPTIONS = [
  "Tiếng Việt",
  "Toán",
  "Đạo đức",
  "Tự nhiên và Xã hội",
  "Khoa học",
  "Lịch sử và Địa lí",
  "Tin học",
  "Công nghệ",
  "Tiếng Anh",
  "Âm nhạc",
  "Mĩ thuật",
  "Giáo dục thể chất",
  "Hoạt động trải nghiệm",
  "Tiếng dân tộc",
];

const WEEK_OPTIONS = Array.from(
  { length: 35 },
  (_, index) => index + 1
);

const paperSx = {
  borderRadius: 3,
  border: "1px solid #dbeafe",
  bgcolor: "#fff",
  boxShadow: "none",
};

const compactFieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 44,
    borderRadius: 2.5,
    bgcolor: "#fff",
    fontSize: 13,
  },

  "& .MuiInputLabel-root": {
    fontSize: 13,
  },

  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    minHeight: "unset",
    py: 1,
    fontWeight: 700,
  },

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#dbeafe",
  },

  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#60a5fa",
  },
};

const primaryButtonSx = {
  borderRadius: 2.5,
  fontWeight: 900,
  textTransform: "none",
  background: "linear-gradient(90deg,#2563eb,#0ea5e9)",
  boxShadow: "0 5px 14px rgba(37,99,235,.18)",
  px: 2.5,
  minHeight: 42,

  "&:hover": {
    background: "linear-gradient(90deg,#1d4ed8,#0284c7)",
  },

  "&.Mui-disabled": {
    color: "#fff",
    opacity: 0.45,
  },
};

// =====================================================
// TẠO CÂU HỎI MỚI
// =====================================================

const createQuestion = () => ({
  ...createEmptyQuestion("single"),
  id: Date.now() + Math.random(),
});

// =====================================================
// FORM MẶC ĐỊNH
// =====================================================

const createEmptyForm = () => ({
  title: "",
  lessonTitle: "",
  subtitle: "",
  sectionTitle: "BÀI TẬP TRẮC NGHIỆM",
  questions: [],
});

// =====================================================
// LẤY TÊN TÀI KHOẢN ĐĂNG NHẬP
// =====================================================

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

// =====================================================
// CHUYỂN DANH SÁCH LỚP THÀNH DANH SÁCH KHỐI
// Ví dụ: 4.3, 4.5, 5.2 => 4, 5
// =====================================================

const getGradeOptions = (lopDay = "") => {
  const grades = String(lopDay)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((className) => {
      const match = className.match(/^(\d+)/);
      return match ? match[1] : "";
    })
    .filter(Boolean);

  return [...new Set(grades)].sort(
    (a, b) => Number(a) - Number(b)
  );
};

// =====================================================
// COMPONENT
// =====================================================

export default function SoanPhieuHocTapDialog({
  open,
  onClose,
  selectedWeek: initialWeek,
  selectedClass: initialClass,
  subject: initialSubject,
  academicYear,
  semester,
  documentId,
  onSaved,
}) {
  const [form, setForm] = useState(createEmptyForm);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showExtraInfo, setShowExtraInfo] = useState(false);

  // Thông tin giáo viên
  const [teacherLoaded, setTeacherLoaded] = useState(false);
  const [classOptions, setClassOptions] = useState([]);

  // Lớp, môn, tuần
  const [selectedClass, setSelectedClass] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ===================================================
  // THÔNG BÁO
  // ===================================================

  const showMessage = (message, severity = "success") => {
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

  // ===================================================
  // TẢI THÔNG TIN GIÁO VIÊN
  // ===================================================

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadTeacherInfo = async () => {
      setTeacherLoaded(false);

      try {
        const savedUser = JSON.parse(
          localStorage.getItem("tools_user") || "{}"
        );

        const username = String(
          savedUser?.username || ""
        )
          .trim()
          .toLowerCase();

        if (!username) {
          throw new Error(
            "Không tìm thấy tài khoản giáo viên."
          );
        }

        const userRef = doc(db, "USERS", username);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          throw new Error(
            `Không tìm thấy tài khoản USERS/${username}.`
          );
        }

        const userData = userSnap.data();

        // Lấy danh sách khối từ lopDay
        const grades = getGradeOptions(
          userData.lopDay || ""
        );

        // Lấy tuần từ trường tuan
        const firestoreWeek = Number(userData.tuan);

        const defaultWeek =
          Number.isInteger(firestoreWeek) &&
          firestoreWeek >= 1 &&
          firestoreWeek <= 35
            ? String(firestoreWeek)
            : "";

        // Lấy khối đang chọn từ lopDangChon
        const currentClassMatch = String(
          userData.lopDangChon || ""
        ).match(/^(\d+)/);

        const currentGrade = currentClassMatch
          ? currentClassMatch[1]
          : "";

        const defaultClass = grades.includes(currentGrade)
          ? currentGrade
          : grades[0] || "";

        const savedSubject =
          localStorage.getItem("tools_mon") ||
          initialSubject ||
          "Tin học";

        if (cancelled) return;

        setClassOptions(grades);

        setSelectedClass(
          grades.includes(String(initialClass))
            ? String(initialClass)
            : defaultClass
        );

        setSelectedWeek(
          defaultWeek ||
            (WEEK_OPTIONS.includes(Number(initialWeek))
              ? String(initialWeek)
              : "")
        );

        setSubject(
          SUBJECT_OPTIONS.includes(savedSubject)
            ? savedSubject
            : "Tin học"
        );
      } catch (error) {
        console.error(
          "Lỗi tải thông tin giáo viên:",
          error
        );

        if (!cancelled) {
          showMessage(
            error.message ||
              "Không tải được thông tin giáo viên.",
            "error"
          );
        }
      } finally {
        if (!cancelled) {
          setTeacherLoaded(true);
        }
      }
    };

    loadTeacherInfo();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // ===================================================
  // MÃ TÀI LIỆU
  // ===================================================

  const currentDocumentId = useMemo(() => {
    if (documentId) return documentId;

    const grade = String(selectedClass || "").trim();
    const week = String(selectedWeek || "").trim();

    if (!grade || !week) return "";

    return `phieuhoc_Lớp ${grade}_${week}`;
  }, [documentId, selectedClass, selectedWeek]);

  // ===================================================
  // ĐẾM CÂU HỎI HỢP LỆ
  // ===================================================

  const validCount = form.questions.filter((item) => {
    try {
      return validateQuestion(item).valid;
    } catch (error) {
      return false;
    }
  }).length;

  // ===================================================
  // TẢI PHIẾU HỌC TẬP
  // ===================================================

  useEffect(() => {
    if (!open || !teacherLoaded) return;

    let cancelled = false;

    const loadWorksheet = async () => {
      setLoading(true);

      try {
        if (!currentDocumentId) {
          if (!cancelled) {
            setForm(createEmptyForm());
          }
          return;
        }

        const username = getCurrentUsername();

        if (!username) {
          throw new Error("Không xác định được tài khoản đăng nhập.");
        }

        const worksheetRef = doc(
          db,
          "USERS",
          username,
          COLLECTION_NAME,
          subject,
          "DANHSACH",
          `phieuhoc_Lớp ${selectedClass}_${selectedWeek}`
        );

        const snapshot = await getDoc(worksheetRef);

        if (cancelled) return;

        if (snapshot.exists()) {
          const data = snapshot.data();

          const loadedQuestions = normalizeQuestions(
            Array.isArray(data.questions)
              ? data.questions
              : []
          );

          setForm({
            title: data.title || "",
            lessonTitle: data.lessonTitle || "",
            subtitle: data.subtitle || "",
            sectionTitle:
              data.sectionTitle || "BÀI TẬP TRẮC NGHIỆM",
            questions: loadedQuestions,
          });
        } else {
          setForm({
            ...createEmptyForm(),
            questions: [createQuestion()],
          });
        }

        setShowExtraInfo(false);
      } catch (error) {
        console.error(
          "Lỗi tải phiếu học tập:",
          error
        );

        if (!cancelled) {
          showMessage(
            "Không tải được nội dung phiếu học tập.",
            "error"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadWorksheet();

    return () => {
      cancelled = true;
    };
  }, [open, teacherLoaded, currentDocumentId]);

  // ===================================================
  // CẬP NHẬT THÔNG TIN
  // ===================================================

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ===================================================
  // CẬP NHẬT DANH SÁCH CÂU HỎI
  // ===================================================

  const handleQuestionsChange = (nextQuestions) => {
    setForm((prev) => ({
      ...prev,
      questions: Array.isArray(nextQuestions)
        ? nextQuestions
        : [],
    }));
  };

  // ===================================================
  // LƯU PHIẾU HỌC TẬP
  // ===================================================

  // ===================================================
// LƯU PHIẾU HỌC TẬP VÀO FIRESTORE
// ===================================================

const handleSave = async () => {
  if (saving) return;

  // 1. Lấy username đăng nhập
  let username = "";

  try {
    const savedUser = JSON.parse(
      localStorage.getItem("tools_user") || "null"
    );

    username = String(savedUser?.username || "").trim();
  } catch (error) {
    console.error("Lỗi đọc tài khoản:", error);
  }

  if (!username) {
    showMessage(
      "Không xác định được tài khoản đăng nhập.",
      "error"
    );
    return;
  }

  // 2. Kiểm tra thông tin
  if (!teacherLoaded) {
    showMessage("Đang tải thông tin giáo viên.", "warning");
    return;
  }

  if (!selectedClass || !subject || !selectedWeek) {
    showMessage(
      "Vui lòng chọn lớp, môn học và tuần.",
      "warning"
    );
    return;
  }

  if (!form.title.trim()) {
    showMessage(
      "Vui lòng nhập tiêu đề phiếu học tập.",
      "warning"
    );
    return;
  }

  if (!currentDocumentId) {
    showMessage("Chưa xác định được mã phiếu.", "warning");
    return;
  }

  // 3. Chuẩn hóa câu hỏi
  const normalizedQuestions = normalizeQuestions(
    form.questions
  );

  if (!normalizedQuestions.length) {
    showMessage(
      "Vui lòng thêm ít nhất một câu hỏi.",
      "warning"
    );
    return;
  }

  const invalidIndex = normalizedQuestions.findIndex(
    (item) => {
      try {
        return !validateQuestion(item).valid;
      } catch (error) {
        return true;
      }
    }
  );

  if (invalidIndex !== -1) {
    showMessage(
      `Câu hỏi ${invalidIndex + 1} chưa hợp lệ. Vui lòng kiểm tra lại.`,
      "warning"
    );
    return;
  }

  try {
    setSaving(true);

    // 4. Đường dẫn Firestore theo username
    const worksheetRef = doc(
      db,
      "USERS",
      username,
      "PHIEU_HOC_TAP",
      subject,
      "DANHSACH",
      currentDocumentId
    );

    // 5. Dữ liệu lưu
    const payload = {
      lop: `Lớp ${selectedClass}`,
      khoi: String(selectedClass),
      monHoc: subject,
      tuan: String(selectedWeek),

      tenBai: form.title.trim(),
      title: form.title.trim(),
      lessonTitle: form.lessonTitle.trim(),
      subtitle: form.subtitle.trim(),
      sectionTitle: form.sectionTitle.trim(),

      questions: normalizedQuestions,
      soLuongCauHoi: normalizedQuestions.length,

      namHoc: academicYear || "",
      hocKy: semester || "",

      updatedAt: serverTimestamp(),
      updatedBy: username,
    };

    // 6. Ghi Firestore
    await setDoc(
      worksheetRef,
      payload,
      { merge: true }
    );

    // 7. Cập nhật giao diện
    setForm((prev) => ({
      ...prev,
      questions: normalizedQuestions,
    }));

    showMessage(
      `Đã lưu phiếu học tập lớp ${selectedClass} - Tuần ${selectedWeek}.`,
      "success"
    );

    onSaved?.({
      ...payload,
      documentId: currentDocumentId,
    });

  } catch (error) {
    console.error("Lỗi lưu phiếu học tập:", error);

    showMessage(
      error.message || "Không lưu được phiếu học tập.",
      "error"
    );
  } finally {
    setSaving(false);
  }
};

  // ===================================================
  // GIAO DIỆN
  // ===================================================

  
return (
  <>
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth={false}
      TransitionComponent={Fade}
      sx={{
        "& .MuiDialog-container": {
          alignItems: "center",
        },
        "& .MuiDialog-paper": {
          margin: { xs: "8px", sm: "32px" },
        },
      }}
      PaperProps={{
        sx: {
          width: {
            xs: "calc(100vw - 16px)",
            sm: "calc(100% - 64px)",
          },
          maxWidth: "1000px",
          height: { xs: "96%", sm: "94dvh" },
          maxHeight: { xs: "96%", sm: "94dvh" },
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 4,
          bgcolor: "#fff",
          boxShadow: "0 25px 80px rgba(15,23,42,.25)",
        },
      }}
    >
      {/* HEADER */}

      <DialogHeader
        title="SOẠN PHIẾU HỌC TẬP"
        subtitle="Biên soạn câu hỏi và đáp án"
        icon={<EditNoteRoundedIcon />}
        onClose={onClose}
      >
        <Chip
          size="medium"
          label={`${validCount}/${form.questions.length} câu hợp lệ`}
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
        {loading || !teacherLoaded ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            <CircularProgress size={22} />
            <Typography fontSize={13} color="#64748b">
              {!teacherLoaded
                ? "Đang tải thông tin giáo viên..."
                : "Đang tải phiếu học tập..."}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {/* THÔNG TIN PHIẾU */}

            <Paper
              elevation={0}
              sx={{
                ...paperSx,
                p: 2,
              }}
            >
              <Typography
                fontWeight={800}
                fontSize={14}
                color="#075985"
                mb={1.5}
              >
                THÔNG TIN PHIẾU
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                {/* LỚP */}

                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Lớp"
                  value={selectedClass}
                  onChange={(e) =>
                    setSelectedClass(e.target.value)
                  }
                  disabled={!classOptions.length}
                  sx={{
                    ...compactFieldSx,
                    width: { xs: "100%", sm: 110 },
                    flexShrink: 0,
                  }}
                >
                  {classOptions.map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      Lớp {grade}
                    </MenuItem>
                  ))}
                </TextField>

                {/* MÔN HỌC */}

                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Môn học"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    localStorage.setItem(
                      "tools_mon",
                      e.target.value
                    );
                  }}
                  sx={{
                    ...compactFieldSx,
                    width: { xs: "100%", sm: 190 },
                    flexShrink: 0,
                  }}
                >
                  {SUBJECT_OPTIONS.map((mon) => (
                    <MenuItem key={mon} value={mon}>
                      {mon}
                    </MenuItem>
                  ))}
                </TextField>

                {/* TUẦN */}

                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Tuần"
                  value={selectedWeek}
                  onChange={(e) =>
                    setSelectedWeek(e.target.value)
                  }
                  sx={{
                    ...compactFieldSx,
                    width: { xs: "100%", sm: 115 },
                    flexShrink: 0,
                  }}
                >
                  {WEEK_OPTIONS.map((week) => (
                    <MenuItem
                      key={week}
                      value={String(week)}
                    >
                      Tuần {week}
                    </MenuItem>
                  ))}
                </TextField>

                {/* TIÊU ĐỀ */}

                <TextField
                  fullWidth
                  size="small"
                  label="Tiêu đề phiếu"
                  placeholder="Nhập tiêu đề phiếu học tập..."
                  value={form.title}
                  onChange={(e) =>
                    updateField("title", e.target.value)
                  }
                  sx={{
                    ...compactFieldSx,
                    minWidth: 0,
                  }}
                />
              </Stack>

              {/* THÔNG TIN BỔ SUNG */}

              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  onClick={() =>
                    setShowExtraInfo((prev) => !prev)
                  }
                  sx={{
                    textTransform: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#2563eb",
                    px: 0.5,
                    minHeight: 30,
                  }}
                >
                  {showExtraInfo
                    ? "Ẩn thông tin bổ sung ▲"
                    : "Thông tin bổ sung ▼"}
                </Button>

                {showExtraInfo && (
                  <Box
                    sx={{
                      mt: 1,
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(3,minmax(0,1fr))",
                      },
                      gap: 1.5,
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      label="Tên bài học"
                      value={form.lessonTitle}
                      onChange={(e) =>
                        updateField(
                          "lessonTitle",
                          e.target.value
                        )
                      }
                      sx={compactFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Tiêu đề phụ"
                      value={form.subtitle}
                      onChange={(e) =>
                        updateField("subtitle", e.target.value)
                      }
                      sx={compactFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Tên phần bài tập"
                      value={form.sectionTitle}
                      onChange={(e) =>
                        updateField(
                          "sectionTitle",
                          e.target.value
                        )
                      }
                      sx={compactFieldSx}
                    />
                  </Box>
                )}
              </Box>
            </Paper>

            {/* TRÌNH SOẠN CÂU HỎI */}

            <Paper
              elevation={0}
              sx={{
                ...paperSx,
                p: { xs: 1.5, sm: 2 },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={1}
                sx={{
                  mb: 1.5,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 2.5,
                  background:
                    "linear-gradient(90deg,#eff6ff,#e0f2fe)",
                  border: "1px solid #dbeafe",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#0369a1",
                      bgcolor: "#dbeafe",
                    }}
                  >
                    <EditNoteRoundedIcon />
                  </Box>

                  <Box>
                    <Typography
                      fontWeight={900}
                      color="#164e8a"
                      fontSize={15}
                    >
                      DANH SÁCH CÂU HỎI
                    </Typography>
                    <Typography
                      fontSize={11}
                      color="#64748b"
                    >
                      Soạn và quản lý các dạng câu hỏi
                    </Typography>
                  </Box>
                </Stack>

                <Chip
                  label={`${form.questions.length} câu hỏi`}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 800 }}
                />
              </Stack>

              <QuestionEditor
                questions={form.questions}
                onChange={handleQuestionsChange}
              />
            </Paper>
          </Stack>
        )}
      </DialogContent>

      {/* FOOTER */}

      <DialogActions
        sx={{
          px: 2,
          py: 1,
          borderTop: "1px solid #e2e8f0",
          minHeight: "unset",
          flexShrink: 0,
          justifyContent: "center",
          bgcolor: "#fff",
        }}
      >
        <Button
          onClick={handleSave}
          disabled={
            !teacherLoaded ||
            loading ||
            saving ||
            !selectedClass ||
            !subject ||
            !selectedWeek ||
            !form.title.trim() ||
            form.questions.length === 0 ||
            validCount !== form.questions.length
          }
          variant="contained"
          startIcon={
            saving ? (
              <CircularProgress size={17} color="inherit" />
            ) : (
              <SaveRoundedIcon />
            )
          }
          sx={{
            ...primaryButtonSx,
            minHeight: 42,
            px: 2.5,
            fontSize: 14,
          }}
        >
          {saving ? "Đang lưu..." : "Lưu phiếu học tập"}
        </Button>
      </DialogActions>
    </Dialog>

    {/* THÔNG BÁO */}

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
