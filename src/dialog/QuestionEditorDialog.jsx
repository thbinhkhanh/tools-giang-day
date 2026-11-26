
import React, { useEffect, useState } from "react";

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
} from "@mui/material";

import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";
import DialogHeader from "./DialogHeader";

import {
  QuestionEditor,
  createEmptyQuestion,
  normalizeQuestions,
  validateQuestion,
} from "../components/QuestionEngine";

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

// =========================
// TẠO CÂU HỎI MỚI
// =========================

const createQuestion = () => ({
  ...createEmptyQuestion(),
  id: Date.now() + Math.random(),
});

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

// =========================
// COMPONENT
// =========================

export default function QuestionEditorDialog({
  open,
  onClose,
  onApply,
  questions = [],
  setQuestions,
  selectedSubject = "Tin học",
  selectedGrade = "",
}) {
  const safeQuestions = Array.isArray(questions)
    ? questions
    : [];

  const [draftSubject, setDraftSubject] = useState(
    selectedSubject
  );

  const [draftGrade, setDraftGrade] = useState(
    selectedGrade
  );

  const [draftWeek, setDraftWeek] = useState("");
  const [draftTitle, setDraftTitle] = useState("");

  const [gradeList, setGradeList] = useState([]);

  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingExam, setLoadingExam] = useState(false);
  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // =========================
  // THÔNG BÁO
  // =========================

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

  // =========================
  // ĐẾM CÂU HỎI HỢP LỆ
  // =========================

  const validCount = safeQuestions.filter((item) => {
    try {
      return validateQuestion(item).valid;
    } catch (error) {
      return false;
    }
  }).length;

  // =========================
  // ĐỒNG BỘ THÔNG TIN KHI MỞ
  // =========================

  useEffect(() => {
    if (!open) return;

    setDraftSubject(selectedSubject || "Tin học");
    setDraftGrade("");
    setDraftWeek("");
    setDraftTitle("");
    setQuestions?.([createQuestion()]);
  }, [open, selectedSubject]);

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

        // Danh sách lớp được phân công
        const lopDay = userData?.lopDay;

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

        // Lấy khối từ lớp đang chọn: lopDangChon
        // Ví dụ: "4.1", "Lớp 4.1" -> "4"
        const lopDangChon = String(
          userData?.lopDangChon || ""
        ).trim();

        const gradeMatch = lopDangChon.match(/(\d+)/);
        const currentGrade = gradeMatch
          ? gradeMatch[1]
          : "";

        // Lấy tuần từ trường tuan
        // Chấp nhận cả số 10 và chuỗi "Tuần 10"
        const tuanValue = String(
          userData?.tuan ?? ""
        ).trim();

        const weekMatch = tuanValue.match(/\d+/);
        const currentWeek = weekMatch
          ? weekMatch[0]
          : "";

        if (!cancelled) {
          setGradeList(grades);

          // Ưu tiên lớp đang chọn trong Firestore
          setDraftGrade(
            grades.includes(currentGrade)
              ? currentGrade
              : ""
          );

          // Tuần đang chọn trong Firestore
          setDraftWeek(currentWeek);
        }
      } catch (error) {
        console.error("Lỗi tải thông tin lớp và tuần:", error);

        if (!cancelled) {
          setGradeList([]);
          setDraftGrade("");
          setDraftWeek("");

          showMessage(
            error.message ||
              "Không tải được thông tin lớp và tuần.",
            "error"
          );
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

  // =========================
  // ĐỒNG BỘ LỚP VÀ MÔN TỪ COMPONENT CHA
  // =========================

  useEffect(() => {
    if (!open) return;

    setDraftSubject(selectedSubject || "Tin học");
  }, [open, selectedSubject]);

  // =========================
  // TẢI ĐỀ TỪ FIRESTORE
  // =========================

  useEffect(() => {
    if (
      !open ||
      !draftGrade ||
      !draftSubject ||
      !draftWeek
    ) {
      return;
    }

    let cancelled = false;

    const fetchExam = async () => {
      setLoadingExam(true);

      try {
        const username = getCurrentUsername();

        if (!username) {
          throw new Error(
            "Không xác định được tài khoản đăng nhập."
          );
        }

        const documentId =
          `quiz_Lớp ${draftGrade}_${draftWeek}`;

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

          setDraftTitle(data.tenBai || "");

          // Chuẩn hóa đề cũ và đề mới
          const loadedQuestions = normalizeQuestions(
            Array.isArray(data.questions)
              ? data.questions
              : []
          );

          setQuestions?.(
            loadedQuestions.length
              ? loadedQuestions
              : [createQuestion()]
          );
        } else {
          setDraftTitle("");
          setQuestions?.([createQuestion()]);
        }
      } catch (error) {
        console.error("Lỗi tải đề thi:", error);

        if (!cancelled) {
          setDraftTitle("");
          setQuestions?.([createQuestion()]);

          showMessage(
            error.message ||
              "Không tải được đề thi từ Firestore.",
            "error"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingExam(false);
        }
      }
    };

    fetchExam();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    draftGrade,
    draftSubject,
    draftWeek,
    setQuestions,
  ]);

  // =========================
  // LƯU FIRESTORE
  // =========================

  const handleApply = async () => {
    if (saving) return;

    const username = getCurrentUsername();

    if (!username) {
      showMessage(
        "Không xác định được tài khoản đăng nhập.",
        "error"
      );
      return;
    }

    if (!draftGrade || !draftSubject || !draftWeek) {
      showMessage(
        "Vui lòng chọn lớp, môn học và tuần.",
        "warning"
      );
      return;
    }

    if (!draftTitle.trim()) {
      showMessage(
        "Vui lòng nhập tên bài.",
        "warning"
      );
      return;
    }

    // Chuẩn hóa cấu trúc 6 dạng câu hỏi
    const normalizedQuestions = normalizeQuestions(
      safeQuestions
    );

    // Kiểm tra từng câu hỏi
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

    if (!normalizedQuestions.length) {
      showMessage(
        "Vui lòng nhập ít nhất một câu hỏi.",
        "warning"
      );
      return;
    }

    const documentId =
      `quiz_Lớp ${draftGrade}_${draftWeek}`;

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

          // Lưu đầy đủ dữ liệu của 6 dạng câu hỏi
          questions: normalizedQuestions,

          soLuongCauHoi: normalizedQuestions.length,
          updatedAt: serverTimestamp(),
          updatedBy: username,
        },
        { merge: true }
      );

      setQuestions?.(normalizedQuestions);

      onApply?.({
        grade: draftGrade,
        subject: draftSubject,
        week: String(draftWeek),
        title: draftTitle.trim(),
        documentId,
        questions: normalizedQuestions,
      });

      showMessage(
        `Đã lưu đề thi "${draftTitle.trim()}" - Tuần ${draftWeek}.`,
        "success"
      );

      onClose?.();
    } catch (error) {
      console.error("Lỗi lưu câu hỏi:", error);

      showMessage(
        error.message ||
          "Không thể lưu đề thi lên Firestore.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // GIAO DIỆN
  // =========================

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
            {/* THÔNG TIN ĐỀ THI */}

            <Paper
              sx={{
                ...paperSx,
                p: 2,
              }}
            >
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
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                {/* LỚP */}

                <FormControl
                  size="small"
                  sx={{
                    width: { xs: "100%", sm: 105 },
                    flexShrink: 0,
                  }}
                >
                  <InputLabel>Lớp</InputLabel>

                  <Select
                    value={draftGrade}
                    label="Lớp"
                    disabled={
                      loadingGrades ||
                      gradeList.length === 0
                    }
                    onChange={(e) =>
                      setDraftGrade(e.target.value)
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
                    width: { xs: "100%", sm: 190 },
                    flexShrink: 0,
                  }}
                >
                  <InputLabel>Môn học</InputLabel>

                  <Select
                    value={draftSubject}
                    label="Môn học"
                    onChange={(e) =>
                      setDraftSubject(e.target.value)
                    }
                  >
                    {SUBJECTS.map((subject) => (
                      <MenuItem
                        key={subject}
                        value={subject}
                      >
                        {subject}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* TUẦN */}

                <FormControl
                  size="small"
                  sx={{
                    width: { xs: "100%", sm: 115 },
                    flexShrink: 0,
                  }}
                >
                  <InputLabel>Tuần</InputLabel>

                  <Select
                    value={draftWeek}
                    label="Tuần"
                    onChange={(e) =>
                      setDraftWeek(e.target.value)
                    }
                  >
                    {Array.from(
                      { length: 35 },
                      (_, index) => {
                        const week = String(index + 1);

                        return (
                          <MenuItem key={week} value={week}>
                            Tuần {week}
                          </MenuItem>
                        );
                      }
                    )}
                  </Select>
                </FormControl>

                {/* TÊN BÀI */}

                <TextField
                  fullWidth
                  size="small"
                  label="Tên bài"
                  placeholder="Nhập tên bài thi..."
                  value={draftTitle}
                  onChange={(e) =>
                    setDraftTitle(e.target.value)
                  }
                  sx={{ minWidth: 0 }}
                />

                {loadingGrades && (
                  <CircularProgress size={20} />
                )}
              </Stack>
            </Paper>

            {/* TRÌNH SOẠN CÂU HỎI */}

            <Paper
              elevation={0}
              sx={{
                ...paperSx,
                p: { xs: 1.5, sm: 2 },
              }}
            >
              {loadingExam ? (
                <Box
                  sx={{
                    py: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  <CircularProgress size={20} />

                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "#64748b",
                    }}
                  >
                    Đang tải đề thi...
                  </Typography>
                </Box>
              ) : (
                <QuestionEditor
                  questions={safeQuestions}
                  onChange={setQuestions}
                />
              )}
            </Paper>

            {/* THÔNG TIN HỢP LỆ */}

            <Paper
              elevation={0}
              sx={{
                ...paperSx,
                p: 1.5,
                bgcolor: "#eff6ff",
                borderColor: "#bfdbfe",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
              >
                <EditNoteRoundedIcon
                  sx={{
                    color: "#2563eb",
                    fontSize: 20,
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#1e40af",
                  }}
                >
                  {validCount}/{safeQuestions.length} câu hỏi hợp lệ
                </Typography>
              </Stack>
            </Paper>
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
              loadingExam ||
              saving ||
              validCount !== safeQuestions.length ||
              safeQuestions.length === 0
            }
            variant="contained"
            startIcon={
              saving ? (
                <CircularProgress
                  size={17}
                  color="inherit"
                />
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
