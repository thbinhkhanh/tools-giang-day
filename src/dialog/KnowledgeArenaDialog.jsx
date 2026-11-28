
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
  LinearProgress,
  Divider,
  CircularProgress,
} from "@mui/material";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";

import DialogHeader from "../dialog/DialogHeader";
import ArenaConfigDialog from "../dialog/ArenaConfigDialog";
import QuestionEditorDialog from "../dialog/QuestionEditorDialog";

import {
  QuestionPlayer,
  normalizeQuestions,
  validateQuestion,
  createEmptyAnswer,
  checkAnswer,
  getQuestionTypeLabel,
} from "../components/QuestionEngine";

// =====================================================
// CẤU HÌNH
// =====================================================

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

// =====================================================
// TẠO NỘI DUNG ĐÁP ÁN ĐÚNG CHO 6 DẠNG CÂU HỎI
// =====================================================

const getCorrectAnswerText = (question) => {
  if (!question) return "";

  const type = question.type || "single";
  const options = Array.isArray(question.options)
    ? question.options
    : [];

  switch (type) {
    case "single":
      return options[Number(question.correctIndex)]
        ?? "Chưa thiết lập đáp án";

    case "multiple":
      return (question.correctIndexes || [])
        .map((index) => options[Number(index)])
        .filter(Boolean)
        .join(", ") || "Chưa thiết lập đáp án";

    case "true_false":
      return question.correctAnswer === true
        ? "Đúng"
        : question.correctAnswer === false
        ? "Sai"
        : "Chưa thiết lập đáp án";

    case "ordering":
      return (question.correctOrder || [])
        .map((index) => options[Number(index)])
        .filter(Boolean)
        .join(" → ") || "Chưa thiết lập đáp án";

    case "fill_blank":
      return (question.acceptedAnswers || [])
        .filter(Boolean)
        .join(" / ") || "Chưa thiết lập đáp án";

    case "matching":
      return (question.pairs || [])
        .map((pair) => `${pair.left} → ${pair.right}`)
        .join("\n") || "Chưa thiết lập đáp án";

    default:
      return "Chưa thiết lập đáp án";
  }
};

// =====================================================
// COMPONENT
// =====================================================

export default function KnowledgeArenaDialog({ open, onClose }) {
  const [questions, setQuestions] = useState([]);
  // Danh sách câu hỏi thực tế được chọn cho cuộc chơi
  const [gameQuestions, setGameQuestions] = useState([]);

  const [duration, setDuration] = useState(20);

  const [phase, setPhase] = useState("setup");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [seconds, setSeconds] = useState(20);

  // Đáp án dùng chung cho cả 6 dạng câu hỏi
  const [answer, setAnswer] = useState(null);

  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeOut, setTimeOut] = useState(false);

  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const [configOpen, setConfigOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");

  const [questionLimit, setQuestionLimit] = useState("all");
  const [pointsPerQuestion, setPointsPerQuestion] = useState(10);

  const [selectedSubject] = useState(
    localStorage.getItem("tools_mon") || "Tin học"
  );

  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Câu hỏi hiện tại trong cuộc chơi
  const current = gameQuestions[currentIndex];

  // =====================================================
  // ĐẾM CÂU HỎI HỢP LỆ
  // =====================================================

  const validQuestionCount = questions.filter((item) => {
    try {
      return validateQuestion(item).valid;
    } catch (error) {
      return false;
    }
  }).length;

  // Số câu hỏi theo cấu hình
  const playableQuestionCount =
    questionLimit === "" || questionLimit === "all"
      ? validQuestionCount
      : Math.min(
          validQuestionCount,
          Math.max(1, Math.floor(Number(questionLimit) || 1))
        );

  // =====================================================
  // TIẾN TRÌNH
  // =====================================================

  const progress = gameQuestions.length
    ? ((currentIndex + 1) / gameQuestions.length) * 100
    : 0;

  const correctAnswerText = getCorrectAnswerText(current);

    

  // =====================================================
  // LẤY LỚP VÀ TUẦN TỪ USERS/{username}
  // =====================================================

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadQuizInfo = async () => {
      setLoadingQuestions(true);

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
          setSelectedClass("");
          setSelectedWeek("");
          setQuestions([]);
          return;
        }

        const userRef = doc(db, "USERS", username);
        const userSnap = await getDoc(userRef);

        if (cancelled) return;

        if (!userSnap.exists()) {
          setSelectedClass("");
          setSelectedWeek("");
          setQuestions([]);
          return;
        }

        const userData = userSnap.data();
        // Đọc cấu hình Đấu trường kiến thức
        const arenaConfig = userData.knowledgeArenaConfig || {};

        if (arenaConfig.duration != null) {
          const savedDuration = Number(arenaConfig.duration);

          if (Number.isFinite(savedDuration) && savedDuration > 0) {
            setDuration(savedDuration);
            setSeconds(savedDuration);
          }
        }

        if (arenaConfig.questionLimit != null) {
          setQuestionLimit(arenaConfig.questionLimit);
        }

        if (arenaConfig.pointsPerQuestion != null) {
          const savedPoints = Number(arenaConfig.pointsPerQuestion);

          if (Number.isFinite(savedPoints) && savedPoints > 0) {
            setPointsPerQuestion(savedPoints);
          }
        }

        const className = String(
          userData.lopDangChon || userData.lopDay || ""
        ).trim();

        const weekValue =
          String(userData.tuan ?? "").match(/\d+/)?.[0] || "";

        setSelectedClass(className);
        setSelectedWeek(weekValue);

        if (!className || !weekValue) {
          setQuestions([]);
          return;
        }

        const grade = className.match(/\d+/)?.[0] || "";

        if (!grade) {
          setQuestions([]);
          return;
        }

        // Giữ nguyên ID tài liệu hiện tại
        const documentId = `quiz_Lớp ${grade}_${weekValue}`;

        const quizRef = doc(
          db,
          "USERS",
          username,
          "DAU_TRUONG_KIEN_THUC",
          selectedSubject,
          "DANHSACH",
          documentId
        );

        const quizSnap = await getDoc(quizRef);

        if (cancelled) return;

        if (quizSnap.exists()) {
          const data = quizSnap.data();

          const loadedQuestions = normalizeQuestions(
            data.questions || []
          );

          setQuestions(loadedQuestions);
        } else {
          setQuestions([]);

          console.warn(
            `Không tìm thấy đề lớp ${className}, tuần ${weekValue}`
          );
        }
      } catch (error) {
        console.error(
          "Lỗi tải đề Đấu trường kiến thức:",
          error
        );

        if (!cancelled) {
          setQuestions([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingQuestions(false);
        }
      }
    };

    loadQuizInfo();

    return () => {
      cancelled = true;
    };
  }, [open, selectedSubject]);

  // =====================================================
  // ĐẾM NGƯỢC
  // =====================================================

  useEffect(() => {
    if (!open || phase !== "playing" || answered) {
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          setAnswered(true);
          setIsCorrect(false);
          setTimeOut(true);

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, phase, currentIndex, answered]);

  // =====================================================
  // RESET TRẠNG THÁI CÂU HỎI
  // =====================================================

  const resetCurrentAnswer = (question) => {
    setAnswer(
      createEmptyAnswer(question?.type)
    );

    setAnswered(false);
    setIsCorrect(false);
    setTimeOut(false);
  };

  // =====================================================
  // BẮT ĐẦU
  // =====================================================

  const startGame = () => {
  // Lọc những câu hỏi hợp lệ
  const validQuestions = questions.filter((item) => {
    try {
      return validateQuestion(item).valid;
    } catch (error) {
      return false;
    }
  });

  if (!validQuestions.length) {
    setEditorOpen(true);
    return;
  }

  // Áp dụng số lượng câu hỏi đã cấu hình
  const limit =
    questionLimit === "" || questionLimit === "all"
      ? validQuestions.length
      : Math.max(
          1,
          Math.floor(Number(questionLimit) || 1)
        );

  // Chỉ lấy số câu theo cấu hình
  const selectedQuestions = validQuestions.slice(0, limit);

  if (!selectedQuestions.length) {
    setEditorOpen(true);
    return;
  }

  // Lưu riêng danh sách câu hỏi của cuộc chơi
  // Không làm mất danh sách câu hỏi gốc
  setGameQuestions(selectedQuestions);

  setCurrentIndex(0);
  setSeconds(duration);

  setAnswer(
    createEmptyAnswer(selectedQuestions[0]?.type)
  );

  setAnswered(false);
  setIsCorrect(false);
  setTimeOut(false);

  setScore(0);
  setCorrectCount(0);

  setPhase("playing");
};

  // =====================================================
  // KIỂM TRA ĐÁP ÁN
  // ĐƯỢC GỌI TỪ QUESTIONPLAYER
  // =====================================================

  const handleQuestionCheck = (result) => {
    if (answered || !current) return;

    const correct = Boolean(result?.isCorrect);

    setAnswered(true);
    setIsCorrect(correct);
    setTimeOut(false);

    if (correct) {
      setScore((prev) => prev + Number(pointsPerQuestion));
      setCorrectCount((prev) => prev + 1);
    }
  };

  // =====================================================
  // CÂU TIẾP THEO
  // =====================================================

  const nextQuestion = () => {
    if (!answered) return;

    if (currentIndex >= gameQuestions.length - 1) {
      setPhase("result");
      return;
    }

    const nextIndex = currentIndex + 1;
    const next = gameQuestions[nextIndex];

    setCurrentIndex(nextIndex);
    setSeconds(duration);

    resetCurrentAnswer(next);
  };

  // =====================================================
  // CHƠI LẠI
  // =====================================================

  const restartGame = () => {
    setPhase("setup");

    setCurrentIndex(0);
    setSeconds(duration);

    setAnswer(null);

    setAnswered(false);
    setIsCorrect(false);
    setTimeOut(false);

    setScore(0);
    setCorrectCount(0);
  };

  // =====================================================
  // ĐÓNG
  // =====================================================

  const handleClose = () => {
    setPhase("setup");

    setCurrentIndex(0);
    setSeconds(duration);

    setAnswer(null);

    setAnswered(false);
    setIsCorrect(false);
    setTimeOut(false);

    setScore(0);
    setCorrectCount(0);

    setConfigOpen(false);
    setEditorOpen(false);

    onClose?.();
  };

  // =====================================================
  // GIAO DIỆN
  // =====================================================

  
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

        handleClose();
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
          overflow: "hidden",
          borderRadius: { xs: 4, sm: 3 },
          bgcolor: "#fff",
          boxShadow: "0 25px 80px rgba(15,23,42,.25)",
        },
      }}
    >
      {/* HEADER */}
      <DialogHeader
        title="ĐẤU TRƯỜNG KIẾN THỨC"
        subtitle={`Lớp ${selectedClass || "Chưa chọn"} · Tuần ${
          selectedWeek || "Chưa chọn"
        } · Thử thách kiến thức`}
        icon={<EmojiEventsRoundedIcon sx={{ fontSize: 27 }} />}
        onClose={handleClose}
      >
        {phase === "setup" && (
          <Stack
            direction="row"
            spacing={0.7}
            sx={{
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <Chip
              icon={<SettingsRoundedIcon />}
              label="Cấu hình"
              size="small"
              onClick={() => setConfigOpen(true)}
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,.13)",
                border: "1px solid rgba(255,255,255,.2)",
                fontWeight: 700,
                "& .MuiChip-icon": {
                  color: "#bfdbfe",
                },
              }}
            />

            <Chip
              icon={<EditNoteRoundedIcon />}
              label="Soạn đề"
              size="small"
              onClick={() => setEditorOpen(true)}
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,.13)",
                border: "1px solid rgba(255,255,255,.2)",
                fontWeight: 700,
                "& .MuiChip-icon": {
                  color: "#bfdbfe",
                },
              }}
            />
          </Stack>
        )}
      </DialogHeader>

      {/* VÙNG NỘI DUNG */}
      <DialogContent
        sx={{
          p: { xs: 1.5, sm: 2 },
          flex: "1 1 0",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          backgroundImage: `
            linear-gradient(
              rgba(239, 246, 255, 0.88),
              rgba(248, 250, 255, 0.92)
            ),
            url("/knowledge-arena-bg.jpg")
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "local",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* =========================================
            MÀN HÌNH CHỜ - THIẾT KẾ MỚI
        ========================================= */}
        {phase === "setup" && (
          <Stack
            spacing={2}
            sx={{
              minHeight: "100%",
              justifyContent: "center",
              maxWidth: 760,
              width: "100%",
              mx: "auto",
              py: { xs: 0.5, sm: 1 },
            }}
          >
            {/* HERO */}
            <Box
              sx={{
                position: "relative",
                overflow: "hidden",
                borderRadius: { xs: 3, sm: 4 },
                p: { xs: 2.2, sm: 3.5 },
                color: "#fff",
                background:
                  "linear-gradient(125deg,#172554 0%,#1e40af 48%,#6d28d9 100%)",
                boxShadow: "0 12px 30px rgba(30,64,175,.22)",
                isolation: "isolate",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  width: 190,
                  height: 190,
                  borderRadius: "50%",
                  bgcolor: "rgba(255,255,255,.07)",
                  top: -100,
                  right: -45,
                  zIndex: -1,
                }}
              />

              <Box
                sx={{
                  position: "absolute",
                  width: 125,
                  height: 125,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,.12)",
                  bottom: -75,
                  left: "35%",
                  zIndex: -1,
                }}
              />

              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
              >
                <Chip
                  icon={<AutoAwesomeRoundedIcon />}
                  label="SÂN CHƠI TRI THỨC"
                  size="small"
                  sx={{
                    height: 27,
                    color: "#fff",
                    bgcolor: "rgba(255,255,255,.14)",
                    border: "1px solid rgba(255,255,255,.2)",
                    fontWeight: 900,
                    letterSpacing: 0.5,
                    "& .MuiChip-icon": {
                      color: "#fde68a",
                    },
                  }}
                />

                <Box
                  sx={{
                    position: "relative",
                    width: { xs: 68, sm: 88 },
                    height: { xs: 68, sm: 88 },
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(145deg, rgba(255,255,255,.28), rgba(255,255,255,.06))",
                    border: "2px solid rgba(253,224,71,.75)",
                    boxShadow: `
                      0 0 0 5px rgba(253,224,71,.10),
                      0 8px 22px rgba(0,0,0,.22),
                      inset 0 2px 8px rgba(255,255,255,.3)
                    `,
                    animation: "trophy3D 3s ease-in-out infinite",
                    "@keyframes trophy3D": {
                      "0%, 100%": {
                        transform: "perspective(400px) rotateY(-8deg) rotateZ(-3deg)",
                      },
                      "50%": {
                        transform: "perspective(400px) rotateY(8deg) rotateZ(3deg)",
                      },
                    },
                    "&::before": {
                      content: '"★"',
                      position: "absolute",
                      top: -5,
                      right: -3,
                      fontSize: 19,
                      color: "#fde68a",
                      textShadow: "0 0 10px #facc15",
                    },
                    "& svg": {
                      fontSize: { xs: 47, sm: 62 },
                      color: "#fbbf24",
                      filter:
                        "drop-shadow(0 3px 2px rgba(120,53,15,.55)) drop-shadow(0 0 9px rgba(250,204,21,.65))",
                    },
                  }}
                >
                  <EmojiEventsRoundedIcon />
                </Box>
              </Stack>

              <Box sx={{ mt: { xs: 2, sm: 2.5 } }}>
                <Typography
                  sx={{
                    fontSize: { xs: 23, sm: 32 },
                    lineHeight: 1.2,
                    fontWeight: 1000,
                    letterSpacing: { xs: -0.5, sm: -1 },
                    textShadow: "0 3px 12px rgba(0,0,0,.18)",
                  }}
                >
                  BẠN ĐÃ SẴN SÀNG?
                </Typography>

                <Typography
                  sx={{
                    mt: 1,
                    fontSize: { xs: 10, sm: 14 },
                    lineHeight: 1.5,
                    color: "#dbeafe",
                    whiteSpace: "nowrap",
                  }}
                >
                  Vượt qua thử thách, khám phá kiến thức và chinh phục những điểm số thật ấn tượng!
                </Typography>
              </Box>
            </Box>

            {/* THỐNG KÊ THỬ THÁCH */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                gap: { xs: 0.8, sm: 1.2 },
              }}
            >
              {[
                {
                  label: "SỐ CÂU HỎI",
                  value: playableQuestionCount,
                  unit: "câu",
                  icon: <QuizRoundedIcon />,
                  color: "#2563eb",
                  bg: "#eff6ff",
                },
                {
                  label: "THỜI GIAN",
                  value: duration,
                  unit: "giây/câu",
                  icon: <TimerRoundedIcon />,
                  color: "#d97706",
                  bg: "#fffbeb",
                },
                {
                  label: "ĐIỂM THƯỞNG",
                  value: `+${pointsPerQuestion}`,
                  unit: "điểm/câu đúng",
                  icon: <EmojiEventsRoundedIcon />,
                  color: "#059669",
                  bg: "#ecfdf5",
                },
              ].map((item) => (
                <Paper
                  key={item.label}
                  elevation={0}
                  sx={{
                    p: { xs: 1.2, sm: 1.8 },
                    borderRadius: 3,
                    border: "1px solid #e2e8f0",
                    bgcolor: "#fff",
                    textAlign: "center",
                    minWidth: 0,
                    transition: "transform .2s, box-shadow .2s",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: "0 8px 18px rgba(15,23,42,.08)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 34, sm: 40 },
                      height: { xs: 34, sm: 40 },
                      mx: "auto",
                      mb: 0.8,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 2.5,
                      bgcolor: item.bg,
                      color: item.color,
                      "& svg": {
                        fontSize: { xs: 21, sm: 24 },
                      },
                    }}
                  >
                    {item.icon}
                  </Box>

                  <Typography
                    sx={{
                      fontSize: { xs: 20, sm: 25 },
                      fontWeight: 1000,
                      color: item.color,
                      lineHeight: 1.2,
                    }}
                  >
                    {item.value}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.4,
                      fontSize: { xs: 8, sm: 9 },
                      fontWeight: 900,
                      color: "#64748b",
                    }}
                  >
                    {item.label}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.3,
                      fontSize: { xs: 8, sm: 9 },
                      color: "#94a3b8",
                    }}
                  >
                    {item.unit}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* HƯỚNG DẪN */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 3,
                border: "1px solid #dbeafe",
                bgcolor: "rgba(255,255,255,.96)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1.5 }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 2,
                    bgcolor: "#eff6ff",
                    color: "#2563eb",
                  }}
                >
                  <AutoAwesomeRoundedIcon />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 1000,
                      color: "#172554",
                    }}
                  >
                    LUẬT CHƠI THỬ THÁCH
                  </Typography>

                  <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>
                    Hãy ghi nhớ trước khi bắt đầu nhé!
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={1.2}>
                {[
                  {
                    number: "01",
                    title: "Đọc kỹ câu hỏi",
                    description:
                      "Quan sát và suy nghĩ trước khi chọn đáp án.",
                    color: "#2563eb",
                    bg: "#eff6ff",
                  },
                  {
                    number: "02",
                    title: "Hoàn thành đúng thời gian",
                    description:
                      "Mỗi câu hỏi có thời gian trả lời quy định.",
                    color: "#d97706",
                    bg: "#fffbeb",
                  },
                  {
                    number: "03",
                    title: "Tích lũy điểm thưởng",
                    description: `Trả lời đúng nhận ngay ${pointsPerQuestion} điểm.`,
                    color: "#059669",
                    bg: "#ecfdf5",
                  },
                ].map((item) => (
                  <Stack
                    key={item.number}
                    direction="row"
                    alignItems="center"
                    spacing={1.2}
                  >
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 2,
                        bgcolor: item.bg,
                        color: item.color,
                        fontSize: 11,
                        fontWeight: 1000,
                      }}
                    >
                      {item.number}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 900,
                          color: "#334155",
                        }}
                      >
                        {item.title}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 10,
                          color: "#94a3b8",
                          lineHeight: 1.5,
                        }}
                      >
                        {item.description}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Paper>

            {/* TRẠNG THÁI CÂU HỎI */}
            {loadingQuestions ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  py: 1,
                }}
              >
                <CircularProgress size={18} />
                <Typography sx={{ fontSize: 12, color: "#2563eb" }}>
                  Đang tải câu hỏi tuần {selectedWeek}...
                </Typography>
              </Box>
            ) : validQuestionCount === 0 ? (
              <Box
                sx={{
                  p: 1.3,
                  borderRadius: 2.5,
                  bgcolor: "#fff7ed",
                  border: "1px solid #fed7aa",
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#c2410c",
                  }}
                >
                  Chưa có câu hỏi hợp lệ
                </Typography>

                <Typography
                  sx={{ mt: 0.3, fontSize: 10, color: "#9a3412" }}
                >
                  Hãy chọn Soạn đề để nhập câu hỏi cho thử thách.
                </Typography>
              </Box>
            ) : (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={0.7}
                sx={{ py: 0.3 }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    bgcolor: "#10b981",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#059669",
                  }}
                >
                  ĐÃ SẴN SÀNG {playableQuestionCount}/{validQuestionCount} CÂU HỎI
                </Typography>
              </Stack>
            )}
          </Stack>
        )}

        {/* =========================================
            MÀN HÌNH LÀM BÀI
        ========================================= */}
        {phase === "playing" && current && (
          <Stack spacing={{ xs: 1.5, sm: 2 }}>
            {/* THỐNG KÊ */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                gap: 1,
              }}
            >
              {[
                {
                  label: "CÂU HỎI",
                  value: `${currentIndex + 1}/${gameQuestions.length}`,
                  color: "#2563eb",
                  bg: "#eff6ff",
                  icon: <QuizRoundedIcon />,
                },
                {
                  label: "THỜI GIAN",
                  value: `${seconds}s`,
                  color: seconds <= 5 ? "#dc2626" : "#d97706",
                  bg: seconds <= 5 ? "#fef2f2" : "#fffbeb",
                  icon: <TimerRoundedIcon />,
                },
                {
                  label: "ĐIỂM SỐ",
                  value: score,
                  color: "#059669",
                  bg: "#ecfdf5",
                  icon: <EmojiEventsRoundedIcon />,
                },
              ].map((item) => (
                <Paper
                  key={item.label}
                  elevation={0}
                  sx={{
                    ...paperSx,
                    p: { xs: 1, sm: 1.3 },
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    spacing={0.8}
                  >
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 2,
                        bgcolor: item.bg,
                        color: item.color,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 8,
                          fontWeight: 800,
                          color: "#94a3b8",
                        }}
                      >
                        {item.label}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: { xs: 15, sm: 18 },
                          fontWeight: 900,
                          color: item.color,
                          lineHeight: 1.3,
                        }}
                      >
                        {item.value}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Box>

            {/* TIẾN TRÌNH */}
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ mb: 0.6 }}
              >
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#64748b",
                  }}
                >
                  TIẾN TRÌNH
                </Typography>

                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: "#2563eb",
                  }}
                >
                  {Math.round(progress)}%
                </Typography>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 7,
                  borderRadius: 5,
                  bgcolor: "#dbeafe",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 5,
                    background:
                      "linear-gradient(90deg,#2563eb,#0ea5e9)",
                  },
                }}
              />
            </Box>

            {/* LOẠI CÂU HỎI */}
            <Box>
              <Chip
                size="small"
                label={getQuestionTypeLabel(current.type)}
                sx={{
                  fontWeight: 800,
                  fontSize: 11,
                  color: "#1d4ed8",
                  bgcolor: "#dbeafe",
                }}
              />
            </Box>

            {/* NỘI DUNG VÀ GIAO DIỆN TRẢ LỜI */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 3,
                border: "1px solid #dbeafe",
                bgcolor: "#fff",
                minWidth: 0,
              }}
            >
              <QuestionPlayer
                key={`${currentIndex}-${phase}`}
                question={current}
                answer={answer}
                onChange={setAnswer}
                onCheck={handleQuestionCheck}
                disabled={answered}
                showCheckButton={!answered}
              />
            </Paper>

            {/* KẾT QUẢ CÂU TRẢ LỜI

            {answered && (
              <Fade in>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2.5,
                    bgcolor: isCorrect ? "#ecfdf5" : "#fff7ed",
                    border: "1px solid",
                    borderColor: isCorrect ? "#86efac" : "#fdba74",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    {isCorrect ? (
                      <CheckCircleRoundedIcon sx={{ color: "#059669" }} />
                    ) : (
                      <CancelRoundedIcon sx={{ color: "#ea580c" }} />
                    )}

                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: isCorrect ? "#047857" : "#c2410c",
                      }}
                    >
                      {isCorrect
                        ? "CHÍNH XÁC! +10 ĐIỂM"
                        : timeOut
                        ? "HẾT THỜI GIAN!"
                        : "CHƯA CHÍNH XÁC!"}
                    </Typography>
                  </Stack>

                  <Divider sx={{ my: 1 }} />

                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "#475569",
                      lineHeight: 1.7,
                      overflowWrap: "anywhere",
                    }}
                  >
                    <strong>Đáp án đúng:</strong>{" "}
                    {correctAnswerText || "Vui lòng xem lại câu hỏi."}
                  </Typography>

                  {current.explanation && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1.2,
                        borderRadius: 2,
                        bgcolor: "rgba(255,255,255,.7)",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 900,
                          color: "#1e40af",
                          mb: 0.4,
                        }}
                      >
                        GIẢI THÍCH
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "#475569",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {current.explanation}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Fade>
            )} */}
          </Stack>
        )}

        {/* =========================================
            MÀN HÌNH KẾT QUẢ
        ========================================= */}        
        {phase === "result" && (
          <Stack
            spacing={2}
            alignItems="center"
            sx={{ py: 1 }}
          >
            {/*
              Số câu thực tế được sử dụng trong cuộc thi,
              không lấy tổng số câu của đề gốc.
            */}
            {(() => {
              const totalQuestions = gameQuestions.length;
              const wrongCount = Math.max(0, totalQuestions - correctCount);
              const correctRate =
                totalQuestions > 0
                  ? Math.round((correctCount / totalQuestions) * 100)
                  : 0;

              return (
                <>
                  {/* BIỂU TƯỢNG CHÚC MỪNG */}
                  <Box
                    sx={{
                      width: 76,
                      height: 76,
                      borderRadius: "50%",
                      bgcolor: "#fef3c7",
                      color: "#d97706",
                      display: "grid",
                      placeItems: "center",
                      border: "5px solid #fffbeb",
                    }}
                  >
                    <EmojiEventsRoundedIcon sx={{ fontSize: 45 }} />
                  </Box>

                  {/* TIÊU ĐỀ */}
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      sx={{
                        fontSize: { xs: 19, sm: 23 },
                        fontWeight: 900,
                        color: "#172554",
                      }}
                    >
                      HOÀN THÀNH CUỘC THI!
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.5,
                        fontSize: 11,
                        color: "#64748b",
                      }}
                    >
                      Bạn đã chinh phục toàn bộ thử thách kiến thức.
                    </Typography>
                  </Box>

                  {/* TỔNG ĐIỂM */}
                  <Paper
                    elevation={0}
                    sx={{
                      ...paperSx,
                      width: "100%",
                      p: 2.5,
                      textAlign: "center",
                      borderColor: "#ddd6fe",
                      background:
                        "linear-gradient(135deg,#f5f3ff,#eff6ff)",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: 1.2,
                        color: "#64748b",
                      }}
                    >
                      TỔNG ĐIỂM ĐẠT ĐƯỢC
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: { xs: 52, sm: 64 },
                        fontWeight: 900,
                        color: "#6d28d9",
                        lineHeight: 1.25,
                      }}
                    >
                      {score}
                    </Typography>

                    {/* SỐ CÂU ĐÚNG */}
                    <Chip
                      icon={<EmojiEventsRoundedIcon />}
                      label={`${correctCount}/${totalQuestions} câu trả lời đúng`}
                      sx={{
                        mt: 0.5,
                        bgcolor: "#ede9fe",
                        color: "#5b21b6",
                        fontWeight: 800,
                      }}
                    />

                    <Divider sx={{ my: 2 }} />

                    {/* THỐNG KÊ CÂU ĐÚNG / CHƯA ĐÚNG */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                        gap: 1,
                      }}
                    >
                      {/* CÂU ĐÚNG */}
                      <Box
                        sx={{
                          p: 1.3,
                          borderRadius: 2,
                          bgcolor: "#ecfdf5",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 25,
                            fontWeight: 900,
                            color: "#059669",
                          }}
                        >
                          {correctCount}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "#047857",
                          }}
                        >
                          CÂU ĐÚNG
                        </Typography>
                      </Box>

                      {/* CÂU CHƯA ĐÚNG */}
                      <Box
                        sx={{
                          p: 1.3,
                          borderRadius: 2,
                          bgcolor: "#fef2f2",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 25,
                            fontWeight: 900,
                            color: "#dc2626",
                          }}
                        >
                          {wrongCount}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "#b91c1c",
                          }}
                        >
                          CÂU CHƯA ĐÚNG
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  {/* TỈ LỆ TRẢ LỜI ĐÚNG */}
                  <Box sx={{ width: "100%" }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mb: 0.7 }}
                    >
                      <Typography
                        sx={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#64748b",
                        }}
                      >
                        TỈ LỆ TRẢ LỜI ĐÚNG
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 900,
                          color: "#059669",
                        }}
                      >
                        {correctRate}%
                      </Typography>
                    </Stack>

                    <LinearProgress
                      variant="determinate"
                      value={correctRate}
                      sx={{
                        height: 9,
                        borderRadius: 5,
                        bgcolor: "#dcfce7",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 5,
                          bgcolor: "#10b981",
                        },
                      }}
                    />
                  </Box>
                </>
              );
            })()}
          </Stack>
        )}

      </DialogContent>

      {/* =========================================
          FOOTER CỐ ĐỊNH
      ========================================= */}
      <DialogActions
        sx={{
          px: { xs: 1.5, sm: 2.5 },
          py: 1.2,
          borderTop: "1px solid #e2e8f0",
          bgcolor: "#fff",
          flexShrink: 0,
          justifyContent: "center",
        }}
      >
        {/* FOOTER MÀN HÌNH CHỜ */}
        {phase === "setup" && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                minWidth: 100,
                borderRadius: 2.5,
                fontWeight: 800,
                textTransform: "none",
                borderColor: "#cbd5e1",
                color: "#475569",
              }}
            >
              Đóng
            </Button>

            <Button
              variant="contained"
              startIcon={<PlayArrowRoundedIcon />}
              onClick={startGame}
              disabled={
                validQuestionCount === 0 ||
                loadingQuestions
              }
              sx={{
                ...primaryButtonSx,
                minWidth: 150,
                py: 1,
              }}
            >
              BẮT ĐẦU
            </Button>
          </Stack>
        )}

        {/* FOOTER ĐANG LÀM BÀI */}
        {phase === "playing" && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                minWidth: 100,
                borderRadius: 2.5,
                fontWeight: 800,
                textTransform: "none",
                borderColor: "#cbd5e1",
                color: "#475569",
              }}
            >
              Thoát
            </Button>

            <Button
              fullWidth
              variant="contained"
              disabled={!answered}
              onClick={nextQuestion}
              sx={{
                ...primaryButtonSx,
                maxWidth: 320,
                py: 1,
              }}
            >
              {currentIndex === gameQuestions.length - 1
                ? "HOÀN THÀNH CUỘC THI"
                : "CÂU TIẾP THEO"}
            </Button>
          </Stack>
        )}

        {/* FOOTER KẾT QUẢ */}
        {phase === "result" && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                minWidth: 100,
                borderRadius: 2.5,
                fontWeight: 800,
                textTransform: "none",
                borderColor: "#cbd5e1",
                color: "#475569",
              }}
            >
              Đóng
            </Button>

            <Button
              variant="contained"
              startIcon={<RestartAltRoundedIcon />}
              onClick={restartGame}
              sx={{
                ...primaryButtonSx,
                minWidth: 180,
                py: 1,
              }}
            >
              CHƠI LẠI
            </Button>
          </Stack>
        )}
      </DialogActions>
    </Dialog>

    {/* DIALOG CẤU HÌNH */}
    <ArenaConfigDialog
      open={configOpen}
      onClose={() => setConfigOpen(false)}
      duration={duration}
      setDuration={setDuration}
      questionLimit={questionLimit}
      setQuestionLimit={setQuestionLimit}
      pointsPerQuestion={pointsPerQuestion}
      setPointsPerQuestion={setPointsPerQuestion}
      totalQuestions={validQuestionCount}
    />

    {/* DIALOG SOẠN ĐỀ */}
    <QuestionEditorDialog
      open={editorOpen}
      onClose={() => setEditorOpen(false)}
      questions={questions}
      setQuestions={setQuestions}
    />
  </>
);

}
