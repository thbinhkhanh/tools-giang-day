
import React, { useEffect, useRef, useState } from "react";

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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
} from "@mui/material";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

import CloseIcon from "@mui/icons-material/Close";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import ReplayIcon from "@mui/icons-material/Replay";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import LightbulbIcon from "@mui/icons-material/Lightbulb";

import QuestionFormDialog from "./QuestionFormDialog";

export default function QuestionDrawDialog({
  open,
  onClose,
  selectedClass: propSelectedClass,
  week,
}) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);

  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState("");

  const [showAnswer, setShowAnswer] = useState(false);
  const [drawing, setDrawing] = useState(false);

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [openQuestionForm, setOpenQuestionForm] = useState(false);

  const timeoutRef = useRef(null);
  const drawingRef = useRef(false);
  const spinAudioRef = useRef(null);

  // Lưu vị trí câu hỏi đã bốc gần nhất
  const lastDrawnIndexRef = useRef(-1);

  // Lớp đang chọn theo tài khoản Firestore
  const [selectedClass, setSelectedClass] = useState("");
  const [classResolved, setClassResolved] = useState(false);

  // Môn học
  const [selectedSubject, setSelectedSubject] = useState("Tin học");

  // Chế độ được đọc từ Firestore, không cho chỉnh sửa tại màn hình chơi
  const [cheDoChonCauHoi, setCheDoChonCauHoi] =
    useState("ngauNhien");

  // =====================================================
  // CHUẨN HÓA CHẾ ĐỘ CHỌN CÂU HỎI
  // =====================================================

  const normalizeCheDoChonCauHoi = (value) => {
    const mode = String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFC");

    if (
      [
        "theothutu",
        "theo_thu_tu",
        "theo thứ tự",
        "theo thu tu",
        "sequential",
        "order",
      ].includes(mode)
    ) {
      return "theoThuTu";
    }

    return "ngauNhien";
  };

  // =====================================================
  // ÂM THANH VÒNG QUAY
  // =====================================================

  const playSpinAudio = () => {
    const audio = spinAudioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0.75;

    audio.play().catch((error) => {
      console.warn("Không thể phát âm thanh vòng quay:", error);
    });
  };

  const stopSpinAudio = () => {
    const audio = spinAudioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
  };

  // =====================================================
  // ĐỌC LỚP ĐANG CHỌN TỪ USERS/{username}
  // =====================================================

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadSelectedClass = async () => {
      setClassResolved(false);

      try {
        const currentUser = JSON.parse(
          localStorage.getItem("tools_user") || "null"
        );

        const username = String(
          currentUser?.username || ""
        )
          .trim()
          .toLowerCase();

        if (!username) {
          if (!cancelled) {
            setSelectedClass(propSelectedClass || "");
          }
          return;
        }

        const userRef = doc(db, "USERS", username);
        const userSnap = await getDoc(userRef);

        if (cancelled) return;

        if (userSnap.exists()) {
          const savedClass = userSnap.data().lopDangChon;

          setSelectedClass(
            savedClass
              ? String(savedClass).trim()
              : propSelectedClass || ""
          );
        } else {
          setSelectedClass(propSelectedClass || "");
        }
      } catch (error) {
        console.error("Lỗi tải lớp đang chọn:", error);

        if (!cancelled) {
          setSelectedClass(propSelectedClass || "");
        }
      } finally {
        if (!cancelled) {
          setClassResolved(true);
        }
      }
    };

    loadSelectedClass();

    return () => {
      cancelled = true;
    };
  }, [open, propSelectedClass]);

  // =====================================================
  // XÁC ĐỊNH LỚP VÀ TUẦN
  // =====================================================

  const grade =
    String(selectedClass || "").match(/\d+/)?.[0] || "";

  const weekNumber =
    String(week ?? "").match(/\d+/)?.[0] || "";

  const documentId =
    grade && weekNumber
      ? `quiz_Lớp ${grade}_${weekNumber}`
      : "";

  const subjects = [
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

  // =====================================================
  // HÀM TẢI CÂU HỎI TỪ FIRESTORE
  // =====================================================

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    setLoadError("");

    setQuestions([]);
    setAnswers([]);

    setSelectedQuestion("");
    setSelectedAnswer("");
    setShowAnswer(false);

    setCheDoChonCauHoi("ngauNhien");
    lastDrawnIndexRef.current = -1;

    try {
      if (!grade) {
        throw new Error(
          "Vui lòng chọn lớp trước khi bốc thăm."
        );
      }

      if (!weekNumber) {
        throw new Error(
          "Không tìm thấy tuần học. Vui lòng kiểm tra thông tin tuần."
        );
      }

      const currentUser = JSON.parse(
        localStorage.getItem("tools_user") || "null"
      );

      const username = String(
        currentUser?.username || ""
      )
        .trim()
        .toLowerCase();

      if (!username) {
        throw new Error(
          "Không xác định được tài khoản đăng nhập."
        );
      }

      console.log("Đang tải câu hỏi Firestore:", {
        username,
        documentId,
        selectedClass,
        week,
        selectedSubject,
      });

      const questionRef = doc(
        db,
        "USERS",
        username,
        "CAUHOI_NGAUNHIEN",
        selectedSubject,
        "DANHSACH",
        documentId
      );

      const snapshot = await getDoc(questionRef);

      if (!snapshot.exists()) {
        throw new Error(
          `Không tìm thấy câu hỏi môn ${selectedSubject} ${grade}, tuần ${weekNumber}.`
        );
      }

      const data = snapshot.data();

      console.log("Dữ liệu document:", data);

      // ĐỌC CHẾ ĐỘ TỪ FIRESTORE
      const mode = normalizeCheDoChonCauHoi(
        data.cheDoChonCauHoi
      );

      setCheDoChonCauHoi(mode);

      console.log(
        "Chế độ chọn câu hỏi lấy từ Firestore:",
        data.cheDoChonCauHoi,
        "=>",
        mode
      );

      // Ghép câu hỏi và đáp án theo chỉ số gốc
      const questionList = Array.isArray(data.cauHoi)
        ? data.cauHoi
            .map((item, index) => ({
              question:
                typeof item === "string"
                  ? item.trim()
                  : "",
              answer: String(
                data.dapAn?.[index] || ""
              ).trim(),
            }))
            .filter((item) => Boolean(item.question))
        : [];

      const validQuestions = questionList.map(
        (item) => item.question
      );

      const validAnswers = questionList.map(
        (item) => item.answer
      );

      setQuestions(validQuestions);
      setAnswers(validAnswers);

      setSelectedQuestion("");
      setSelectedAnswer("");
      setShowAnswer(false);

      // Mỗi lần tải danh sách mới, bắt đầu lại từ câu đầu
      lastDrawnIndexRef.current = -1;

      if (validQuestions.length === 0) {
        setLoadError(
          "Document đã tồn tại nhưng chưa có câu hỏi hợp lệ."
        );
      } else {
        console.log(
          "Đã tải câu hỏi:",
          validQuestions.length
        );

        console.log(
          "Số câu có kiến thức tham khảo:",
          validAnswers.filter(Boolean).length
        );
      }
    } catch (error) {
      console.error(
        "Lỗi tải câu hỏi từ Firestore:",
        error
      );

      setQuestions([]);
      setAnswers([]);

      setSelectedQuestion("");
      setSelectedAnswer("");
      setShowAnswer(false);

      setCheDoChonCauHoi("ngauNhien");
      lastDrawnIndexRef.current = -1;

      setLoadError(
        error.message ||
          "Không thể tải câu hỏi từ Firestore. Vui lòng kiểm tra quyền truy cập."
      );
    } finally {
      setLoadingQuestions(false);
    }
  };

  // =====================================================
  // TẢI CÂU HỎI KHI MỞ DIALOG / ĐỔI MÔN / ĐỔI LỚP
  // =====================================================

  useEffect(() => {
    if (!open || !classResolved) return;

    let cancelled = false;

    const load = async () => {
      await fetchQuestions();
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    classResolved,
    selectedClass,
    grade,
    weekNumber,
    documentId,
    selectedSubject,
  ]);

  // =====================================================
  // NHẬN DANH SÁCH CÂU HỎI TỪ DIALOG SOẠN
  // =====================================================

  const handleSaveQuestionList = async (
    list,
    info,
    answerList = []
  ) => {
    if (drawingRef.current) return;

    setOpenQuestionForm(false);

    // Sau khi lưu ở QuestionFormDialog,
    // tải lại document để lấy cấu hình mới nhất từ Firestore.
    await fetchQuestions();
  };

  // =====================================================
  // BỐC THĂM CÂU HỎI THEO CẤU HÌNH FIRESTORE
  // =====================================================

  const drawQuestion = () => {
    if (
      !questions.length ||
      drawingRef.current ||
      loadingQuestions
    ) {
      return;
    }

    drawingRef.current = true;
    setDrawing(true);

    playSpinAudio();

    setSelectedQuestion("");
    setSelectedAnswer("");
    setShowAnswer(false);

    const totalQuestions = questions.length;

    // Chọn câu cuối cùng theo cấu hình lấy từ Firestore
    let finalIndex = 0;

    if (cheDoChonCauHoi === "theoThuTu") {
      // Lần đầu: câu 1 (index 0)
      // Những lần tiếp theo: câu kế tiếp
      finalIndex =
        (lastDrawnIndexRef.current + 1) % totalQuestions;
    } else {
      // Ngẫu nhiên
      finalIndex = Math.floor(
        Math.random() * totalQuestions
      );
    }

    let count = 0;

    // Vòng quay hiển thị hiệu ứng
    timeoutRef.current = setInterval(() => {
      let currentIndex;

      if (cheDoChonCauHoi === "theoThuTu") {
        // Hiệu ứng chạy tuần tự
        const startIndex =
          lastDrawnIndexRef.current + 1;

        currentIndex =
          (startIndex + count) % totalQuestions;
      } else {
        // Hiệu ứng chạy ngẫu nhiên
        currentIndex = Math.floor(
          Math.random() * totalQuestions
        );
      }

      setSelectedQuestion(questions[currentIndex]);

      count++;

      if (count >= 30) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;

        stopSpinAudio();

        // Lưu vị trí câu vừa bốc
        lastDrawnIndexRef.current = finalIndex;

        // Hiển thị câu hỏi và đáp án đúng vị trí
        setSelectedQuestion(questions[finalIndex]);

        setSelectedAnswer(
          String(answers[finalIndex] || "").trim()
        );

        setShowAnswer(false);

        drawingRef.current = false;
        setDrawing(false);
      }
    }, 100);
  };

  // =====================================================
  // HIỂN THỊ / ẨN KIẾN THỨC THAM KHẢO
  // =====================================================

  const toggleAnswer = () => {
    if (!selectedAnswer || drawingRef.current) return;

    setShowAnswer((prev) => !prev);
  };

  // =====================================================
  // KHỞI TẠO KHI MỞ DIALOG
  // =====================================================

  useEffect(() => {
    if (open) {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }

      stopSpinAudio();

      drawingRef.current = false;
      lastDrawnIndexRef.current = -1;

      setSelectedQuestion("");
      setSelectedAnswer("");
      setShowAnswer(false);

      setDrawing(false);
      setOpenQuestionForm(false);
    }
  }, [open]);

  // =====================================================
  // DỌN BỘ ĐẾM KHI UNMOUNT
  // =====================================================

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }

      stopSpinAudio();
      drawingRef.current = false;
    };
  }, []);

  // =====================================================
  // ĐÓNG DIALOG
  // =====================================================

  const handleClose = (event, reason) => {
    if (reason === "backdropClick") return;
    if (drawingRef.current) return;

    stopSpinAudio();

    setOpenQuestionForm(false);
    onClose?.();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (
            reason === "backdropClick" ||
            reason === "escapeKeyDown"
          ) {
            return;
          }

          handleClose(event, reason);
        }}
        disableEscapeKeyDown
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
            borderRadius: { xs: 4, sm: 4 },
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 25px 80px rgba(15,23,42,.25)",
            position: "relative",
            width: {
              xs: "calc(100vw - 16px)",
              sm: "calc(100% - 64px)",
            },
            maxWidth: {
              xs: "calc(100vw - 16px)",
              sm: "900px",
            },
            height: { xs: "96%", sm: "94%" },
            maxHeight: { xs: "96%", sm: "94%" },
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <audio
          ref={spinAudioRef}
          src="/sounds/chiec-non-ky-dieu.mp3"
          preload="auto"
          loop
        />

        {/* HEADER */}
        <Box
          sx={{
            position: "relative",
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            color: "#fff",
            background:
              "linear-gradient(115deg, #101b3c 0%, #173b82 55%, #087db5 100%)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: 240,
              height: 240,
              borderRadius: "50%",
              right: -100,
              top: -150,
              background:
                "radial-gradient(circle, rgba(56,189,248,.25), transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              width: 180,
              height: 180,
              borderRadius: "50%",
              left: "35%",
              bottom: -155,
              background:
                "radial-gradient(circle, rgba(99,102,241,.2), transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <IconButton
            onClick={handleClose}
            disabled={drawing}
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 14,
              zIndex: 3,
              color: "rgba(255,255,255,.9)",
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
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.8, sm: 1.5 },
              pr: { xs: 4, sm: 6 },
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: { xs: 36, sm: 44 },
                height: { xs: 36, sm: 44 },
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2.5,
                color: "#fff",
                background:
                  "linear-gradient(145deg, #fbbf24 0%, #f59e0b 45%, #ea580c 100%)",
                boxShadow:
                  "0 4px 14px rgba(245,158,11,.35), inset 0 1px 2px rgba(255,255,255,.4)",
                border: "1px solid rgba(255,255,255,.35)",
              }}
            >
              <AutoAwesomeIcon
                sx={{ fontSize: { xs: 22, sm: 27 } }}
              />
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontSize: { xs: 13, sm: 21 },
                  fontWeight: 900,
                  letterSpacing: { xs: 0, sm: 0.6 },
                  lineHeight: 1.25,
                  color: "#fff",
                  whiteSpace: "nowrap",
                }}
              >
                BỐC THĂM CÂU HỎI
              </Typography>

              <Typography
                sx={{
                  mt: 0.45,
                  fontSize: { xs: 9, sm: 12 },
                  fontWeight: 500,
                  color: "rgba(219,234,254,.85)",
                  lineHeight: 1.4,
                  whiteSpace: "nowrap",
                }}
              >
                Lớp {grade || "—"} · {selectedSubject} · Tuần{" "}
                {weekNumber || "—"}
              </Typography>
            </Box>

            <Button
              size="small"
              disabled={drawing}
              onClick={() => setOpenQuestionForm(true)}
              startIcon={<EditNoteRoundedIcon />}
              sx={{
                flexShrink: 0,
                minWidth: 0,
                px: { xs: 0.8, sm: 1.3 },
                py: { xs: 0.6, sm: 0.8 },
                borderRadius: 2,
                color: "#fff",
                fontSize: { xs: 9, sm: 11 },
                fontWeight: 800,
                whiteSpace: "nowrap",
                textTransform: "none",
                "& .MuiButton-startIcon": {
                  mr: { xs: 0.4, sm: 0.8 },
                  "& svg": {
                    fontSize: { xs: 15, sm: 20 },
                  },
                },
                bgcolor: "rgba(255,255,255,.12)",
                border: "1px solid rgba(255,255,255,.28)",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,.23)",
                },
              }}
            >
              SOẠN CÂU HỎI
            </Button>
          </Box>

          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "2px",
              background:
                "linear-gradient(90deg, transparent, #38bdf8, #818cf8, transparent)",
              opacity: 0.8,
            }}
          />
        </Box>

        {/* NỘI DUNG CHÍNH */}
        <DialogContent
          sx={{
            px: { xs: 1.5, sm: 3 },
            py: { xs: 1, sm: 1.5 },
            background:
              "linear-gradient(180deg,#f8fbff 0%,#ffffff 100%)",
            display: "flex",
            flexDirection: "column",
            gap: { xs: 1, sm: 1.5 },
            flex: "1 1 0",
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {/* CHỌN MÔN HỌC + SỐ CÂU HỎI */}
          <Box
            sx={{
              display: "flex",
              alignItems: "stretch",
              gap: 1.5,
              width: "100%",
              mt: 2,
            }}
          >
            <FormControl
              size="small"
              disabled={drawing || loadingQuestions}
              sx={{
                flex: 1,
                minWidth: 0,
                "& .MuiOutlinedInput-root": {
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: "#eff6ff",
                  fontWeight: 700,
                  "& fieldset": {
                    borderColor: "#bfdbfe",
                  },
                  "&:hover fieldset": {
                    borderColor: "#93c5fd",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                  },
                },
                "& .MuiInputLabel-root": {
                  fontWeight: 700,
                  color: "#1e40af",
                },
              }}
            >
              <InputLabel id="question-subject-label">
                Chọn môn học
              </InputLabel>

              <Select
                labelId="question-subject-label"
                value={selectedSubject}
                label="Chọn môn học"
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedQuestion("");
                  setSelectedAnswer("");
                  setShowAnswer(false);
                  setQuestions([]);
                  setAnswers([]);
                  setLoadError("");
                  lastDrawnIndexRef.current = -1;
                }}
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Paper
              elevation={0}
              sx={{
                flex: 1,
                minWidth: 0,
                height: 44,
                boxSizing: "border-box",
                px: 1.5,
                borderRadius: 2.5,
                bgcolor: "#eff6ff",
                border: "1px solid #bfdbfe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <QuizRoundedIcon
                sx={{ color: "#2563eb", fontSize: 21 }}
              />

              <Typography
                color="#1e40af"
                fontWeight={700}
                fontSize={13}
                sx={{ whiteSpace: "nowrap" }}
              >
                SỐ CÂU HỎI
              </Typography>

              <Chip
                label={
                  loadingQuestions ? "..." : questions.length
                }
                size="small"
                sx={{
                  height: 24,
                  fontWeight: 900,
                  color: "#1d4ed8",
                  bgcolor: "#dbeafe",
                  border: "1px solid #bfdbfe",
                }}
              />
            </Paper>
          </Box>

          {/* VÙNG BỐC THĂM - HỘP BÍ MẬT */}
          <Paper
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              mt: 2,
              minHeight: 250,
              boxSizing: "border-box",
              borderRadius: 4,
              border: drawing
                ? "2px solid #818cf8"
                : selectedQuestion
                ? "2px solid #60a5fa"
                : "1px solid #bfdbfe",
              background: drawing
                ? "linear-gradient(135deg,#172554 0%,#312e81 55%,#1e40af 100%)"
                : selectedQuestion
                ? "linear-gradient(135deg,#eff6ff 0%,#dbeafe 55%,#e0f2fe 100%)"
                : "linear-gradient(135deg,#eff6ff 0%,#dbeafe 50%,#f0f9ff 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              px: 2.5,
              py: 3,
              textAlign: "center",
              transition: "background .5s ease, border .5s ease",
              boxShadow: drawing
                ? "0 12px 35px rgba(49,46,129,.25)"
                : "0 8px 25px rgba(37,99,235,.10)",
            }}
          >
            {/* ÁNH SÁNG TRANG TRÍ */}
            <Box
              sx={{
                position: "absolute",
                width: 220,
                height: 220,
                borderRadius: "50%",
                top: -130,
                right: -80,
                background: drawing
                  ? "radial-gradient(circle,rgba(129,140,248,.35),transparent 70%)"
                  : "radial-gradient(circle,rgba(56,189,248,.22),transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <Box
              sx={{
                position: "absolute",
                width: 200,
                height: 200,
                borderRadius: "50%",
                bottom: -130,
                left: -80,
                background: drawing
                  ? "radial-gradient(circle,rgba(56,189,248,.25),transparent 70%)"
                  : "radial-gradient(circle,rgba(129,140,248,.2),transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* TIÊU ĐỀ TRẠNG THÁI */}
            <Typography
              sx={{
                position: "relative",
                zIndex: 2,
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 1.5,
                color: drawing ? "#c7d2fe" : "#2563eb",
                mb: 2,
              }}
            >
              {loadingQuestions
                ? "ĐANG CHUẨN BỊ..."
                : drawing
                ? "HỘP BÍ MẬT ĐANG MỞ..."
                : selectedQuestion
                ? "🎉 CÂU HỎI MAY MẮN"
                : "BẠN SẼ NHẬN ĐƯỢC CÂU HỎI NÀO?"}
            </Typography>

            {/* ĐANG TẢI */}
            {loadingQuestions ? (
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#dbeafe",
                  boxShadow: "0 8px 25px rgba(37,99,235,.15)",
                }}
              >
                <CircularProgress size={42} thickness={4} />
              </Box>
            ) : drawing ? (
              /* ĐANG QUAY */
              <Box
                sx={{
                  position: "relative",
                  width: 116,
                  height: 116,
                  perspective: 600,
                  animation:
                    "mysteryFloat 1s ease-in-out infinite",
                  "@keyframes mysteryFloat": {
                    "0%, 100%": {
                      transform: "translateY(0) rotate(-4deg)",
                    },
                    "50%": {
                      transform: "translateY(-9px) rotate(4deg)",
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: -12,
                    borderRadius: 5,
                    border: "2px dashed rgba(191,219,254,.65)",
                    animation:
                      "mysterySpin 5s linear infinite",
                    "@keyframes mysterySpin": {
                      to: { transform: "rotate(360deg)" },
                    },
                  }}
                />

                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    background:
                      "linear-gradient(145deg,#38bdf8 0%,#2563eb 48%,#4338ca 100%)",
                    border: "2px solid rgba(255,255,255,.75)",
                    boxShadow:
                      "0 12px 30px rgba(37,99,235,.45), inset 0 1px 8px rgba(255,255,255,.4)",
                    animation:
                      "cardFlip 0.65s ease-in-out infinite alternate",
                    "@keyframes cardFlip": {
                      from: {
                        transform: "rotateY(-18deg) scale(.94)",
                      },
                      to: {
                        transform: "rotateY(18deg) scale(1.04)",
                      },
                    },
                  }}
                >
                  <QuizRoundedIcon
                    sx={{
                      fontSize: 43,
                      mb: 0.5,
                      filter:
                        "drop-shadow(0 3px 5px rgba(0,0,0,.2))",
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: 27,
                      fontWeight: 1000,
                      lineHeight: 1,
                      color: "#fff",
                      textShadow:
                        "0 3px 8px rgba(0,0,0,.2)",
                    }}
                  >
                    ?
                  </Typography>
                </Box>
              </Box>
            ) : selectedQuestion ? (
              /* ĐÃ CHỌN CÂU HỎI */
              <Fade in timeout={700}>
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    animation:
                      "questionReveal .65s cubic-bezier(.2,.8,.2,1)",
                    "@keyframes questionReveal": {
                      "0%": {
                        opacity: 0,
                        transform: "translateY(25px) scale(.85)",
                      },
                      "70%": {
                        opacity: 1,
                        transform: "translateY(-4px) scale(1.02)",
                      },
                      "100%": {
                        opacity: 1,
                        transform: "translateY(0) scale(1)",
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      mx: "auto",
                      mb: 1.5,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      background:
                        "linear-gradient(145deg,#fbbf24,#f97316)",
                      boxShadow:
                        "0 6px 18px rgba(249,115,22,.3)",
                      animation: "trophyPop .7s ease-out",
                      "@keyframes trophyPop": {
                        "0%": {
                          transform: "scale(0) rotate(-45deg)",
                        },
                        "75%": {
                          transform: "scale(1.15) rotate(8deg)",
                        },
                        "100%": {
                          transform: "scale(1) rotate(0)",
                        },
                      },
                    }}
                  >
                    <AutoAwesomeIcon sx={{ fontSize: 30 }} />
                  </Box>

                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      borderRadius: 3,
                      background: "rgba(255,255,255,.88)",
                      border: "1px solid #bfdbfe",
                      boxShadow:
                        "0 8px 25px rgba(37,99,235,.10)",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: 1,
                        color: "#2563eb",
                        mb: 1,
                      }}
                    >
                      CÂU HỎI ĐƯỢC LỰA CHỌN
                    </Typography>

                    <Typography
                      sx={{
                        width: "100%",
                        fontSize: { xs: 16, sm: 19 },
                        fontWeight: 900,
                        color: "#172554",
                        lineHeight: 1.65,
                        overflowWrap: "anywhere",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {selectedQuestion}
                    </Typography>
                  </Paper>

                  {/* NÚT XEM KIẾN THỨC */}
                  <Box
                    sx={{
                      mt: 1,
                      display: "flex",
                      justifyContent: "flex-start",
                    }}
                  >
                    <Button
                      variant="contained"
                      disabled={!selectedAnswer || drawing}
                      onClick={toggleAnswer}
                      startIcon={<MenuBookRoundedIcon />}
                      sx={{
                        px: 1.8,
                        py: 0.6,
                        minHeight: 30,
                        borderRadius: 2,
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "none",
                        color: "#fff",
                        background: showAnswer
                          ? "linear-gradient(90deg,#059669,#10b981)"
                          : "linear-gradient(90deg,#2563eb,#0ea5e9)",
                        boxShadow: "0 3px 9px rgba(37,99,235,.15)",
                        "& .MuiButton-startIcon": {
                          mr: 0.6,
                          "& svg": {
                            fontSize: 16,
                          },
                        },
                        "&:hover": {
                          background: showAnswer
                            ? "linear-gradient(90deg,#047857,#059669)"
                            : "linear-gradient(90deg,#1d4ed8,#0284c7)",
                        },
                        "&.Mui-disabled": {
                          color: "#94a3b8",
                          bgcolor: "#e2e8f0",
                        },
                      }}
                    >
                      {showAnswer ? "Ẩn gợi ý" : "Gợi ý trả lời"}
                    </Button>
                  </Box>

                  {/* KIẾN THỨC THAM KHẢO */}
                  <Collapse
                    in={showAnswer}
                    timeout={400}
                    unmountOnExit
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        mt: 1.5,
                        p: { xs: 2, sm: 2.5 },
                        borderRadius: 3,
                        textAlign: "left",
                        background:
                          "linear-gradient(135deg,#ecfdf5 0%,#f0fdf4 100%)",
                        border: "1px solid #a7f3d0",
                        boxShadow:
                          "0 6px 18px rgba(16,185,129,.08)",
                      }}
                    >
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
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "#d1fae5",
                            color: "#059669",
                            flexShrink: 0,
                          }}
                        >
                          <LightbulbIcon />
                        </Box>

                        <Box>
                          <Typography
                            sx={{
                              fontSize: 12,
                              fontWeight: 900,
                              color: "#047857",
                              letterSpacing: 0.4,
                            }}
                          >
                            KIẾN THỨC CẦN GHI NHỚ
                          </Typography>
                        </Box>
                      </Stack>

                      <Typography
                        sx={{
                          fontSize: { xs: 14, sm: 15 },
                          lineHeight: 1.85,
                          color: "#064e3b",
                          fontWeight: 500,
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {selectedAnswer}
                      </Typography>
                    </Paper>
                  </Collapse>

                  {!selectedAnswer && (
                    <Typography
                      sx={{
                        mt: 1.5,
                        fontSize: 11,
                        color: "#64748b",
                        fontStyle: "italic",
                      }}
                    >
                      Câu hỏi này chưa có nội dung kiến thức tham khảo.
                    </Typography>
                  )}
                </Box>
              </Fade>
            ) : (
              /* CHƯA BỐC THĂM */
              <Box
                sx={{
                  width: 116,
                  height: 116,
                  borderRadius: 4,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  background:
                    "linear-gradient(145deg,#60a5fa 0%,#2563eb 55%,#4338ca 100%)",
                  border: "3px solid #fff",
                  boxShadow:
                    "0 10px 25px rgba(37,99,235,.25)",
                  animation:
                    "idleFloat 2.5s ease-in-out infinite",
                  "@keyframes idleFloat": {
                    "0%,100%": {
                      transform: "translateY(0)",
                    },
                    "50%": {
                      transform: "translateY(-7px)",
                    },
                  },
                }}
              >
                <QuizRoundedIcon
                  sx={{ fontSize: 43, mb: 0.5 }}
                />

                <Typography
                  sx={{
                    fontSize: 27,
                    fontWeight: 1000,
                    lineHeight: 1,
                  }}
                >
                  ?
                </Typography>
              </Box>
            )}

            {/* HƯỚNG DẪN / THÔNG BÁO */}
            {!selectedQuestion && (
              <Typography
                sx={{
                  position: "relative",
                  zIndex: 2,
                  mt: 2,
                  fontSize: 13,
                  fontWeight: 600,
                  color: drawing
                    ? "#dbeafe"
                    : loadError
                    ? "#dc2626"
                    : "#64748b",
                  lineHeight: 1.6,
                }}
              >
                {loadingQuestions
                  ? "Vui lòng chờ trong giây lát..."
                  : drawing
                  ? "Đang hồi hộp tìm ra câu hỏi bí mật..."
                  : loadError ||
                    (questions.length
                      ? "Nhấn nút bên dưới để mở hộp câu hỏi bí mật"
                      : "Chưa có câu hỏi để bốc thăm")}
              </Typography>
            )}
          </Paper>

          {/* THÔNG BÁO */}
          <Typography
            sx={{
              textAlign: "center",
              mt: 2,
              mb: 2.5,
              minHeight: 22,
              fontSize: 12,
              color: selectedQuestion
                ? "#2563eb"
                : "#64748b",
              fontWeight: 600,
            }}
          >
            {loadingQuestions
              ? "Hệ thống đang tải dữ liệu từ Firestore..."
              : drawing
              ? "Hệ thống đang chọn câu hỏi..."
              : selectedQuestion
              ? showAnswer
                ? "Hãy cùng học sinh đọc và ghi nhớ kiến thức!"
                : "Chúc các em trả lời thật tốt!"
              : loadError
              ? "Chưa thể bắt đầu bốc thăm."
              : "Nhấn nút bên dưới để bắt đầu bốc thăm câu hỏi."}
          </Typography>

          {/* NÚT BỐC THĂM */}
          <Button
            fullWidth
            disabled={
              drawing ||
              loadingQuestions ||
              questions.length === 0
            }
            onClick={drawQuestion}
            startIcon={
              drawing ? (
                <ShuffleIcon />
              ) : selectedQuestion ? (
                <ReplayIcon />
              ) : (
                <AutoAwesomeIcon />
              )
            }
            sx={{
              py: 1.8,
              borderRadius: 3,
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: 0.6,
              textTransform: "none",
              color: "#fff",
              background: drawing
                ? "linear-gradient(90deg,#64748b,#94a3b8)"
                : "linear-gradient(90deg,#2563eb,#0ea5e9)",
              boxShadow:
                "0 7px 18px rgba(37,99,235,.25)",
              "&:hover": {
                background:
                  "linear-gradient(90deg,#1d4ed8,#0284c7)",
                transform: "translateY(-2px)",
                boxShadow:
                  "0 10px 25px rgba(37,99,235,.3)",
              },
              "&.Mui-disabled": {
                color: "#fff",
                opacity: 0.7,
              },
              transition: "all .2s ease",
            }}
          >
            {loadingQuestions
              ? "ĐANG TẢI CÂU HỎI..."
              : drawing
              ? "ĐANG BỐC THĂM..."
              : selectedQuestion
              ? "BỐC THĂM CÂU HỎI TIẾP"
              : "BẮT ĐẦU BỐC THĂM"}
          </Button>

          {!questions.length && !loadingQuestions && (
            <Typography
              sx={{
                mt: 1.5,
                textAlign: "center",
                color: loadError ? "#dc2626" : "#64748b",
                fontSize: 11,
              }}
            >
              {loadError ||
                "Chưa có câu hỏi. Vui lòng soạn câu hỏi để bắt đầu."}
            </Typography>
          )}

          <Typography
            sx={{
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 11,
              mt: 2.5,
            }}
          >
            HỆ THỐNG HỖ TRỢ GIÁO VIÊN · BÌNH KHÁNH
          </Typography>
        </DialogContent>
      </Dialog>

      {/* DIALOG SOẠN CÂU HỎI */}
      <QuestionFormDialog
        open={openQuestionForm}
        onClose={() => setOpenQuestionForm(false)}
        onSave={handleSaveQuestionList}
        drawing={drawing}
        selectedSubject={selectedSubject}
      />
    </>
  );
}
