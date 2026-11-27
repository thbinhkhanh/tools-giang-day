
import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  TextField,
  MenuItem,
  CircularProgress,
  Stack,
  Divider,
  Alert,
  Snackbar,
  Tooltip,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import {
  QuestionEditor,
  createEmptyQuestion,
  normalizeQuestion,
  normalizeQuestions,
  validateQuestions,
} from "../components/QuestionEngine";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

// ======================================================
// DANH SÁCH LỚP
// ======================================================

const GRADE_OPTIONS = [
  "Lớp 1",
  "Lớp 2",
  "Lớp 3",
  "Lớp 4",
  "Lớp 5",
];

// ======================================================
// DANH SÁCH MÔN HỌC
// ======================================================

const SUBJECT_OPTIONS = [
  "Âm nhạc",
  "Công nghệ",
  "Đạo đức",
  "Giáo dục thể chất",
  "Hoạt động trải nghiệm",
  "Khoa học",
  "Lịch sử và Địa lí",
  "Mĩ thuật",
  "Tiếng Anh",
  "Tiếng dân tộc",
  "Tiếng Việt",
  "Tin học",
  "Toán",
  "Tự nhiên và Xã hội",
];

// ======================================================
// DANH SÁCH TUẦN
// ======================================================

const WEEK_OPTIONS = Array.from(
  { length: 35 },
  (_, index) => index + 1
);

// ======================================================
// TẠO DANH SÁCH CÂU HỎI
// ======================================================

const createEmptyQuestions = (count, source = []) => {
  return Array.from({ length: count }, (_, index) =>
    normalizeQuestion(
      source[index] || createEmptyQuestion()
    )
  );
};

// ======================================================
// LẤY TÀI KHOẢN ĐĂNG NHẬP
// ======================================================

const getCurrentUsername = () => {
  try {
    const user = JSON.parse(
      localStorage.getItem("tools_user") || "null"
    );

    return String(user?.username || "")
      .trim()
      .toLowerCase();
  } catch {
    return "";
  }
};

// ======================================================
// LẤY TUẦN HỌC TỪ USERS/{username}
// ======================================================

const getCurrentUserWeek = async () => {
  try {
    const username = getCurrentUsername();

    if (!username) {
      throw new Error(
        "Không xác định được tài khoản đăng nhập."
      );
    }

    const userRef = doc(db, "USERS", username);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      throw new Error(
        `Không tìm thấy tài khoản ${username}.`
      );
    }

    const userData = userSnapshot.data();
    const week = Number(userData.tuan);

    if (
      !Number.isInteger(week) ||
      week < 1 ||
      week > 35
    ) {
      throw new Error(
        "Tài khoản chưa có cấu hình tuần học hợp lệ."
      );
    }

    return week;
  } catch (error) {
    console.error("Lỗi lấy tuần tài khoản:", error);
    return "";
  }
};

// ======================================================
// FIRESTORE
// Collection: USERS/{username}/GAME
// Document: quiz_Lớp 4_Tin học_10
// ======================================================

const createQuizDocId = (lop, mon, tuan) => {
  return `quiz_${lop}_${mon}_${tuan}`;
};

// ======================================================
// TẢI CÂU HỎI TỪ FIRESTORE
// ======================================================

const loadQuizFromFirestore = async ({
  lop,
  mon,
  tuan,
}) => {
  const username = getCurrentUsername();

  if (!username) {
    throw new Error(
      "Không xác định được tài khoản đăng nhập."
    );
  }

  const docId = createQuizDocId(lop, mon, tuan);

  const docRef = doc(
    db,
    "USERS",
    username,
    "GAME",
    docId
  );

  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return {
      exists: false,
      docId,
      questions: [],
      questionCount: 0,
    };
  }

  const data = snapshot.data();

  const questions = Array.isArray(data.questions)
    ? normalizeQuestions(data.questions)
    : [];

  return {
    exists: true,
    docId,
    questions,
    // Đề cũ chưa có questionCount thì lấy số phần tử thực tế
    questionCount:
      Number(data.questionCount) > 0
        ? Number(data.questionCount)
        : questions.length,
    data,
  };
};

// ======================================================
// LƯU CÂU HỎI VÀO FIRESTORE
// ======================================================

const saveQuizToFirestore = async ({
  lop,
  mon,
  tuan,
  questions,
}) => {
  const username = getCurrentUsername();

  if (!username) {
    throw new Error(
      "Không xác định được tài khoản đăng nhập."
    );
  }

  const normalizedQuestions = normalizeQuestions(questions);
  const questionCount = normalizedQuestions.length;

  const docId = createQuizDocId(lop, mon, tuan);

  const docRef = doc(
    db,
    "USERS",
    username,
    "GAME",
    docId
  );

  await setDoc(
    docRef,
    {
      lop,
      mon,
      tuan: Number(tuan),
      questionCount,
      questions: normalizedQuestions,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return docId;
};

// ======================================================
// COMPONENT
// ======================================================

export default function TreasureMapQuestionDialog({
  open,
  onClose,
  stageCount = 4,
}) {
  // --------------------------------------------------
  // STATE CHỌN LỚP / MÔN / TUẦN
  // --------------------------------------------------

  const [draftGrade, setDraftGrade] = useState("Lớp 4");
  const [draftSubject, setDraftSubject] = useState("Tin học");
  const [draftWeek, setDraftWeek] = useState("");

  // --------------------------------------------------
  // STATE CÂU HỎI
  // --------------------------------------------------

  const [draftQuestions, setDraftQuestions] = useState(
    createEmptyQuestions(stageCount)
  );

  // --------------------------------------------------
  // STATE FIRESTORE
  // --------------------------------------------------

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);

  const [hasExistingQuestions, setHasExistingQuestions] =
    useState(false);

  const [loadedDocId, setLoadedDocId] = useState("");

  const [initialized, setInitialized] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Tránh kết quả tải cũ ghi đè dữ liệu mới
  const requestIdRef = useRef(0);

  // ====================================================
  // DỮ LIỆU HIỂN THỊ
  // ====================================================

  const currentDocId = useMemo(
    () =>
      draftWeek
        ? createQuizDocId(
            draftGrade,
            draftSubject,
            draftWeek
          )
        : "",
    [draftGrade, draftSubject, draftWeek]
  );

  const questionBankName = draftWeek
    ? `Câu hỏi ${draftGrade} - ${draftSubject} - Tuần ${draftWeek}`
    : `Câu hỏi ${draftGrade} - ${draftSubject}`;

  const hasDraftQuestionContent = draftQuestions.some(
    (item) => {
      const hasQuestion = Boolean(
        item.question?.trim()
      );

      const hasOptions = item.options?.some((option) =>
        option?.trim()
      );

      return hasQuestion || hasOptions;
    }
  );

  // ====================================================
  // THÔNG BÁO
  // ====================================================

  const showMessage = (
    message,
    severity = "success"
  ) => {
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

  // ====================================================
  // KHỞI TẠO KHI MỞ TRANG SOẠN ĐỀ
  // ====================================================

  useEffect(() => {
    if (!open) {
      setInitialized(false);
      return;
    }

    let active = true;

    setInitialized(false);
    setDraftWeek("");

    setDraftQuestions(
      createEmptyQuestions(stageCount)
    );

    setHasExistingQuestions(false);
    setLoadedDocId("");

    const initialize = async () => {
      const week = await getCurrentUserWeek();

      if (!active) return;

      if (!week) {
        showMessage(
          "Không lấy được tuần học từ tài khoản đăng nhập.",
          "error"
        );
        return;
      }

      setDraftWeek(String(week));
      setInitialized(true);
    };

    initialize();

    return () => {
      active = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ====================================================
  // ĐỒNG BỘ SỐ CHẶNG TỪ TRANG CẤU HÌNH
  // ====================================================

  useEffect(() => {
    if (!open) return;

    const count = Math.min(
        20,
        Math.max(3, Number(stageCount) || 4)
    );

    setDraftQuestions((prev) => {
        // Không làm mất những câu hỏi đã có.
        if (prev.length >= count) return prev;

        return createEmptyQuestions(count, prev);
    });
    }, [open, stageCount]);

  // ====================================================
  // TẢI CÂU HỎI KHI ĐỔI LỚP / MÔN / TUẦN
  // ====================================================

  useEffect(() => {
    if (
      !open ||
      !initialized ||
      !draftWeek
    ) {
      return;
    }

    let active = true;
    const requestId = ++requestIdRef.current;

    const loadQuestions = async () => {
      setLoadingQuestions(true);

      try {
        const result = await loadQuizFromFirestore({
          lop: draftGrade,
          mon: draftSubject,
          tuan: draftWeek,
        });

        if (
          !active ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        if (result.exists) {
          const savedCount = Math.min(
            20,
            Math.max(
                stageCount,
                Number(result.questionCount) ||
                result.questions.length
            )
          );

            const loadedQuestions = createEmptyQuestions(
            savedCount,
            result.questions
            );

          setDraftQuestions(loadedQuestions);
          setHasExistingQuestions(true);
          setLoadedDocId(result.docId);

          /*showMessage(
            "Đã tải bộ câu hỏi từ Firestore.",
            "success"
          );*/
        } else {
          setDraftQuestions(
            createEmptyQuestions(stageCount)
          );

          setHasExistingQuestions(false);
          setLoadedDocId("");

          showMessage(
            `Chưa có câu hỏi cho ${draftGrade} - ${draftSubject} - Tuần ${draftWeek}. Bạn có thể tạo mới.`,
            "info"
          );
        }
      } catch (error) {
        console.error("Lỗi tải câu hỏi:", error);

        if (
          active &&
          requestId === requestIdRef.current
        ) {
          setDraftQuestions(
            createEmptyQuestions(stageCount)
          );

          setHasExistingQuestions(false);
          setLoadedDocId("");

          showMessage(
            "Không thể tải câu hỏi từ Firestore.",
            "error"
          );
        }
      } finally {
        if (
          active &&
          requestId === requestIdRef.current
        ) {
          setLoadingQuestions(false);
        }
      }
    };

    loadQuestions();

    return () => {
      active = false;
    };
  }, [
    open,
    initialized,
    draftGrade,
    draftSubject,
    draftWeek,
    stageCount,
  ]);

  // ====================================================
  // LƯU CÂU HỎI
  // ====================================================

  const handleSaveQuestions = async () => {
    if (loadingQuestions || savingQuestions) return;

    if (
      !draftGrade ||
      !draftSubject ||
      !draftWeek
    ) {
      showMessage(
        "Vui lòng chọn đầy đủ Lớp, Môn và Tuần.",
        "warning"
      );
      return;
    }

    const normalizedQuestions = normalizeQuestions(
        createEmptyQuestions(
            draftQuestions.length,
            draftQuestions
        )
    );

    if (normalizedQuestions.length < stageCount) {
        showMessage(
            `Cần có ít nhất ${stageCount} câu hỏi tương ứng với số chặng.`,
            "warning"
        );
        return;
    }

    const validation = validateQuestions(
      normalizedQuestions
    );

    if (!validation.valid) {
      showMessage(
        validation.message,
        "warning"
      );
      return;
    }

    setSavingQuestions(true);

    try {
      const docId = await saveQuizToFirestore({
        lop: draftGrade,
        mon: draftSubject,
        tuan: draftWeek,
        questions: normalizedQuestions,
      });

      setDraftQuestions(normalizedQuestions);

      setHasExistingQuestions(true);
      setLoadedDocId(docId);

      showMessage(
        `Đã lưu thành công: ${docId}`,
        "success"
      );
    } catch (error) {
      console.error("Lỗi lưu câu hỏi:", error);

      showMessage(
        "Lưu câu hỏi thất bại. Vui lòng kiểm tra kết nối Firestore.",
        "error"
      );
    } finally {
      setSavingQuestions(false);
    }
  };

  // ====================================================
  // TẢI LẠI CÂU HỎI HIỆN TẠI
  // ====================================================

  const handleReloadQuestions = async () => {
    if (
        loadingQuestions ||
        savingQuestions ||
        !draftWeek
    ) {
        return;
    }

    const requestId = ++requestIdRef.current;

    setLoadingQuestions(true);

    try {
        const result = await loadQuizFromFirestore({
        lop: draftGrade,
        mon: draftSubject,
        tuan: draftWeek,
        });

        if (requestId !== requestIdRef.current) {
        return;
        }

        if (result.exists) {
        // Lấy số câu đã lưu, tối thiểu bằng số chặng
        const savedCount = Math.min(
            20,
            Math.max(
            Number(stageCount) || 4,
            Number(result.questionCount) ||
                result.questions.length
            )
        );

        const loadedQuestions = createEmptyQuestions(
            savedCount,
            result.questions
        );

        setDraftQuestions(loadedQuestions);
        setHasExistingQuestions(true);
        setLoadedDocId(result.docId);

        showMessage(
            `Đã tải lại ${loadedQuestions.length} câu hỏi.`,
            "success"
        );
        } else {
        const defaultCount = Math.min(
            20,
            Math.max(3, Number(stageCount) || 4)
        );

        setDraftQuestions(
            createEmptyQuestions(defaultCount)
        );

        setHasExistingQuestions(false);
        setLoadedDocId("");

        showMessage(
            "Bộ câu hỏi này chưa được lưu.",
            "info"
        );
        }
    } catch (error) {
        console.error("Lỗi tải lại câu hỏi:", error);

        showMessage(
        "Không thể tải câu hỏi.",
        "error"
        );
    } finally {
        if (requestId === requestIdRef.current) {
        setLoadingQuestions(false);
        }
    }
    };

  // ====================================================
  // STYLE
  // ====================================================

  const fieldSx = {
    "& .MuiInputBase-root": {
      minHeight: 44,
      borderRadius: 2,
      fontSize: 14,
      backgroundColor: "#fff",
    },
    "& .MuiInputBase-input": {
      fontSize: 14,
      py: 1.1,
    },
    "& .MuiInputLabel-root": {
      fontSize: 13,
    },
    "& .MuiSelect-select": {
      fontSize: 14,
      display: "flex",
      alignItems: "center",
    },
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: {
              xs: "calc(100vw - 16px)",
              sm: "900px",
            },
            maxWidth: "900px",
            borderRadius: { xs: 3, sm: 3 },
            overflow: "hidden",
            maxHeight: "94vh",
          },
        }}
      >
        {/* HEADER */}

        <DialogTitle
          sx={{
            p: 2,
            color: "#fff",
            background:
              "linear-gradient(120deg, #075985, #2563eb)",
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
          >
            <Box
              display="flex"
              alignItems="center"
              gap={1.2}
            >
              <MenuBookRoundedIcon
                sx={{ fontSize: 27 }}
              />

              <Box>
                <Typography
                  fontWeight={800}
                  fontSize={18}
                  lineHeight={1.3}
                >
                  SOẠN ĐỀ - ĐI TÌM KHO BÁU
                </Typography>

                <Typography
                  fontSize={12}
                  sx={{ opacity: 0.9 }}
                >
                  Quản lý câu hỏi theo lớp, môn và tuần học
                </Typography>
              </Box>
            </Box>

            <IconButton
              onClick={onClose}
              sx={{ color: "#fff" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* CONTENT */}

        <DialogContent
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            backgroundColor: "#f8fafc",
          }}
        >
          {/* CHỌN LỚP / MÔN / TUẦN */}

          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid #dbeafe",
              backgroundColor: "#fff",
              mb: 2,
              mt: 2,
            }}
          >
            <Typography
              fontWeight={800}
              fontSize={14}
              color="#075985"
              mb={1.3}
            >
              THÔNG TIN ĐỀ
            </Typography>

            <Box
              display="grid"
              gridTemplateColumns={{
                xs: "1fr",
                sm: "repeat(3, minmax(0, 1fr))",
              }}
              gap={1.2}
            >
              <TextField
                select
                fullWidth
                size="small"
                label="Lớp"
                value={draftGrade}
                onChange={(event) =>
                  setDraftGrade(event.target.value)
                }
                sx={fieldSx}
                disabled={loadingQuestions || savingQuestions}
              >
                {GRADE_OPTIONS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                size="small"
                label="Môn học"
                value={draftSubject}
                onChange={(event) =>
                  setDraftSubject(event.target.value)
                }
                sx={fieldSx}
                disabled={loadingQuestions || savingQuestions}
              >
                {SUBJECT_OPTIONS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                size="small"
                label="Tuần học"
                value={draftWeek}
                onChange={(event) =>
                  setDraftWeek(event.target.value)
                }
                sx={fieldSx}
                disabled={
                  loadingQuestions ||
                  savingQuestions ||
                  !initialized
                }
              >
                {WEEK_OPTIONS.map((item) => (
                  <MenuItem
                    key={item}
                    value={String(item)}
                  >
                    Tuần {item}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Divider sx={{ my: 1.3 }} />

            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1}
            >
              <Box minWidth={0}>
                <Typography
                    fontSize={13}
                    fontWeight={800}
                    color="#334155"
                >
                    {questionBankName}
                </Typography>
              </Box>

              <Tooltip title="Tải lại bộ câu hỏi từ Firestore">
                <span>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={
                      loadingQuestions ? (
                        <CircularProgress size={15} />
                      ) : (
                        <RefreshRoundedIcon />
                      )
                    }
                    onClick={handleReloadQuestions}
                    disabled={
                      loadingQuestions ||
                      savingQuestions ||
                      !draftWeek
                    }
                    sx={{
                      borderRadius: 2,
                      fontWeight: 700,
                      textTransform: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Tải lại
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Paper>

          {/* TRẠNG THÁI TẢI */}

          {loadingQuestions && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                border: "1px solid #bfdbfe",
                backgroundColor: "#eff6ff",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.2}
              >
                <CircularProgress size={20} />

                <Typography
                  fontSize={13}
                  fontWeight={600}
                  color="#1d4ed8"
                >
                  Đang tải ngân hàng câu hỏi...
                </Typography>
              </Stack>
            </Paper>
          )}

          {!loadingQuestions &&
            initialized &&
            !hasExistingQuestions && (
                <Alert
                severity="info"
                sx={{
                    mb: 2,
                    borderRadius: 2,
                    fontSize: 13,
                }}
                >
                Chưa có bộ câu hỏi được lưu. Bạn có thể soạn đề mới.
                </Alert>
            )}

          {/* NGÂN HÀNG CÂU HỎI */}

          <QuestionEditor
            questions={draftQuestions}
            onChange={setDraftQuestions}
            title="BỘ CÂU HỎI"
            minQuestions={stageCount}
            maxQuestions={20}
          />

          {/* THÔNG TIN SỐ CÂU HỎI */}

          <Paper
            elevation={0}
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              border: "1px solid #bae6fd",
              backgroundColor: "#f0f9ff",
            }}
          >
            <Typography
              fontSize={13}
              fontWeight={800}
              color="#075985"
            >
              THÔNG TIN SOẠN ĐỀ
            </Typography>

            <Box
              display="flex"
              flexWrap="wrap"
              gap={2}
              mt={0.8}
            >
              <Typography fontSize={13} color="#334155">
                <strong>Số chặng:</strong> {stageCount}
              </Typography>

              <Typography fontSize={13} color="#334155">
                <strong>Số câu hỏi:</strong>{" "}
                {draftQuestions.length}
              </Typography>

              <Typography fontSize={13} color="#334155">
                <strong>Trạng thái:</strong>{" "}
                {hasExistingQuestions
                  ? "Đã có dữ liệu"
                  : "Chưa lưu"}
              </Typography>
            </Box>
          </Paper>
        </DialogContent>

        {/* FOOTER */}

        <DialogActions
          sx={{
            p: 1.5,
            px: { xs: 1.5, sm: 2.5 },
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#fff",
            display: "flex",
            justifyContent: "center",
            gap: 1.5,
          }}
        >
          <Button
            variant="contained"
            size="large"
            startIcon={
              savingQuestions ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <SaveRoundedIcon />
              )
            }
            disabled={
              savingQuestions ||
              loadingQuestions ||
              !initialized ||
              !draftWeek ||
              !hasDraftQuestionContent
            }
            onClick={handleSaveQuestions}
            sx={{
              minWidth: { xs: 150, sm: 175 },
              height: 44,
              borderRadius: 3,
              fontWeight: 800,
              fontSize: 14,
              textTransform: "none",
              background:
                "linear-gradient(90deg, #16a34a, #059669)",
              boxShadow:
                "0 4px 12px rgba(22,163,74,0.25)",
              "&:hover": {
                background:
                  "linear-gradient(90deg, #15803d, #047857)",
              },
              "&.Mui-disabled": {
                color: "#fff",
                background: "#94a3b8",
              },
            }}
          >
            {savingQuestions
              ? "Đang lưu..."
              : "Lưu câu hỏi"}
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<CloseIcon />}
            onClick={onClose}
            sx={{
              minWidth: 110,
              height: 44,
              borderRadius: 3,
              fontWeight: 800,
              fontSize: 14,
              textTransform: "none",
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={closeSnackbar}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
