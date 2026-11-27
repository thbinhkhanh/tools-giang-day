
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";

import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";

import SendIcon from "@mui/icons-material/Send";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CloseIcon from "@mui/icons-material/Close";

import { StudentContext } from "../context/StudentContext";
import ThongTinPhieuHocTap from "../components/ThongTinPhieuHocTap";

import {
  doc,
  getDoc,
  getDocs,
  collection,
} from "firebase/firestore";

import { db } from "../firebase";
import { useLocation } from "react-router-dom";

import ImageZoomDialog from "../dialog/ImageZoomDialog";
import SoanPhieuHocTapDialog from "../dialog/SoanPhieuHocTapDialog";

import {
  normalizeQuestion,
  createEmptyAnswer,
  checkAnswer,
  QuestionPlayer,
} from "../components/QuestionEngine/index.js";

// ======================================================
// HÀM TIỆN ÍCH
// ======================================================

const getQuestionId = (question, index) =>
  question?.id || question?.questionId || `question_${index}`;

const formatTime = (seconds = 0) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

const getStudentName = (student) =>
  student?.hoTen ||
  student?.hoVaTen ||
  student?.hoten ||
  student?.ten ||
  student?.ho_ten ||
  student?.ho_va_ten ||
  student?.fullName ||
  student?.name ||
  "";

// ======================================================
// COMPONENT
// ======================================================

export default function PhieuHocTap() {
  const studentContext = useContext(StudentContext);
  const getUploadedStudents = studentContext?.getUploadedStudents;

  const location = useLocation();

  const resultRef = useRef(null);
  const timerRef = useRef(null);
  const submittingRef = useRef(false);
  const timeLoadedRef = useRef(false);

  // ----------------------------------------------------
  // DỮ LIỆU CÂU HỎI
  // ----------------------------------------------------

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  // ----------------------------------------------------
  // TRẠNG THÁI BÀI LÀM
  // ----------------------------------------------------

  const [submitted, setSubmitted] = useState(false);
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);

  const [timeLeft, setTimeLeft] = useState(600);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(10);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (started && !startTime) {
      setStartTime(Date.now());
    }
  }, [started, startTime]);


  // ----------------------------------------------------
  // HỌC SINH
  // ----------------------------------------------------

  const [studentList, setStudentList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [fullname, setFullname] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentId, setStudentId] = useState("");

  // ----------------------------------------------------
  // THÔNG TIN PHIẾU HỌC TẬP
  // ----------------------------------------------------

  const [selectedWeek, setSelectedWeek] = useState("");
  const [subject, setSubject] = useState("");
  const [worksheetId, setWorksheetId] = useState("");

  const [worksheetInfo, setWorksheetInfo] = useState({
    title: "PHIẾU HỌC TẬP",
    lessonTitle: "",
    subtitle: "",
    sectionTitle: "BÀI TẬP TRẮC NGHIỆM",
  });

  // ----------------------------------------------------
  // GIAO DIỆN
  // ----------------------------------------------------

  const [loading, setLoading] = useState(true);
  const [openSoanDialog, setOpenSoanDialog] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const date = new Date().toLocaleDateString("vi-VN");

  // ======================================================
  // THÔNG TIN ĐƯỢC TRUYỀN TỪ TRANG TRƯỚC
  // ======================================================

  const classFromState =
    location.state?.lop ||
    location.state?.selectedClass ||
    location.state?.className ||
    "";

  const subjectFromState =
    location.state?.mon ||
    location.state?.selectedSubject ||
    location.state?.subject ||
    "";

  const weekFromState =
    location.state?.selectedWeek ||
    location.state?.week ||
    location.state?.weekValue ||
    location.state?.tuan ||
    location.state?.deTuan ||
    "";

  const documentIdFromState =
    location.state?.documentId ||
    location.state?.docId ||
    location.state?.phieuId ||
    location.state?.selectedDocumentId ||
    "";

  // ======================================================
  // SNACKBAR
  // ======================================================

  const showMessage = useCallback((message, severity = "info") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  }, []);

  // ======================================================
  // KHỞI TẠO ĐÁP ÁN
  // ======================================================

  const createInitialAnswers = useCallback((questionList) => {
    const result = {};

    questionList.forEach((question, index) => {
      const id = getQuestionId(question, index);
      result[id] = createEmptyAnswer(question.type);
    });

    return result;
  }, []);

  // ======================================================
  // TẢI DỮ LIỆU PHIẾU HỌC TẬP
  // ======================================================

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);

      try {
        // 1. LẤY USERNAME ĐĂNG NHẬP

        let currentUser = {};

        try {
          currentUser = JSON.parse(
            localStorage.getItem("tools_user") || "{}"
          );
        } catch (error) {
          console.error("Lỗi đọc tools_user:", error);
        }

        const username = String(
          currentUser?.username || ""
        )
          .trim()
          .toLowerCase();

        if (!username) {
          showMessage(
            "Không xác định được tài khoản giáo viên.",
            "error"
          );
          return;
        }

        // 2. ĐỌC THÔNG TIN GIÁO VIÊN
        // THỜI GIAN LẤY TỪ USERS/{username}/timeLimitMinutes

        const userSnapshot = await getDoc(
          doc(db, "USERS", username)
        );

        if (!active) return;

        if (!userSnapshot.exists()) {
          showMessage(
            "Không tìm thấy thông tin giáo viên.",
            "error"
          );
          return;
        }

        const userData = userSnapshot.data();

        const loadedTimeLimit = Number(
          userData.timeLimitMinutes
        );

        const safeTimeLimit =
          Number.isFinite(loadedTimeLimit) &&
          loadedTimeLimit > 0
            ? loadedTimeLimit
            : 10;

        setTimeLimitMinutes(safeTimeLimit);

        // Chỉ khởi tạo thời gian một lần khi tải phiếu
        if (!timeLoadedRef.current) {
          setTimeLeft(safeTimeLimit * 60);
          timeLoadedRef.current = true;
        }


        console.log("Tài khoản:", username);
        console.log(
          "Thời gian làm bài:",
          safeTimeLimit,
          "phút"
        );

        // 3. LẤY TUẦN - LỚP - MÔN ĐANG CHỌN

        const classToUse = String(
          userData.lopDangChon ||
            classFromState ||
            location.state?.studentClass ||
            ""
        ).trim();

        const subjectToUse = String(
          userData.monHoc ||
            subjectFromState ||
            ""
        ).trim();

        const weekToUse = String(
          userData.tuan ?? weekFromState ?? ""
        ).trim();

        setStudentClass(classToUse);
        setSubject(subjectToUse);
        setSelectedWeek(weekToUse);

        // =====================================================
        // 4. TẢI DANH SÁCH HỌC SINH
        // =====================================================

        let students = [];

        if (classToUse) {
          let contextStudents = null;

          try {
            if (typeof getUploadedStudents === "function") {
              contextStudents = getUploadedStudents(
                username,
                classToUse
              );
            }
          } catch (error) {
            console.error(
              "Lỗi lấy danh sách học sinh từ StudentContext:",
              error
            );
          }

          if (
            Array.isArray(contextStudents) &&
            contextStudents.length > 0
          ) {
            students = contextStudents.map(
              (student, index) => {
                const studentCode = String(
                  student.maDinhDanh ||
                    student.maHS ||
                    student.stt ||
                    student.id ||
                    index
                );

                return {
                  ...student,
                  id: studentCode,
                  maDinhDanh: studentCode,
                  hoTen: getStudentName(student),
                };
              }
            );

            console.log(
              "Danh sách học sinh từ StudentContext:",
              students
            );
          } else {
            // LẤY DANH SÁCH HỌC SINH TỪ FIRESTORE

            try {
              const firestoreClass = classToUse.replace(
                /\./g,
                "_"
              );

              const studentsRef = collection(
                db,
                "USERS",
                username,
                "DANHSACH_HOCSINH",
                firestoreClass,
                "HOCSINH"
              );

              const studentsSnapshot = await getDocs(
                studentsRef
              );

              students = studentsSnapshot.docs.map(
                (studentDoc) => {
                  const data = studentDoc.data();

                  return {
                    ...data,
                    id: studentDoc.id,
                    maDinhDanh:
                      data.maDinhDanh ||
                      data.maHS ||
                      studentDoc.id,
                    hoTen: getStudentName(data),
                  };
                }
              );

              console.log(
                "Danh sách học sinh từ Firestore:",
                students
              );
            } catch (error) {
              console.error(
                "Lỗi lấy danh sách học sinh từ Firestore:",
                error
              );

              students = [];
            }
          }
        }

        if (!active) return;

        setStudentList(students);

        console.log(
          "Lớp:",
          classToUse,
          "| Tổng số học sinh:",
          students.length
        );

        // =====================================================
        // 5. KIỂM TRA ĐỦ THÔNG TIN
        // =====================================================

        if (!classToUse || !subjectToUse || !weekToUse) {
          setQuestions([]);
          setWorksheetId("");

          showMessage(
            "Vui lòng chọn đầy đủ tuần học, lớp và môn học trước khi mở phiếu.",
            "warning"
          );

          return;
        }

        // =====================================================
        // 6. TÌM PHIẾU TRONG FIRESTORE
        // =====================================================

        let worksheetSnapshot = null;
        let foundWorksheetId = "";

        const getGradeLabel = (className) => {
          const value = String(className || "").trim();

          if (!value) return "";

          if (/^lớp\s*/i.test(value)) {
            return value.replace(/\s+/g, " ").trim();
          }

          const grade = value.match(/^\d+/)?.[0];

          return grade ? `Lớp ${grade}` : value;
        };

        const selectedGrade = getGradeLabel(classToUse);
        const subjectCollection = subjectToUse;

        const worksheetCollection = collection(
          db,
          "USERS",
          username,
          "PHIEU_HOC_TAP",
          subjectCollection,
          "DANHSACH"
        );

        // 6.1. CÁC ID CÓ THỂ CÓ CỦA PHIẾU

        const possibleIds = [
          documentIdFromState,
          `phieuhoc_${selectedGrade}_${weekToUse}`,
          `phieuhoc_${classToUse}_${weekToUse}`,
        ].filter(Boolean);

        const uniqueIds = [...new Set(possibleIds)];

        // 6.2. ƯU TIÊN TÌM TRỰC TIẾP THEO ID

        for (const candidateId of uniqueIds) {
          const directSnapshot = await getDoc(
            doc(worksheetCollection, candidateId)
          );

          if (!active) return;

          if (directSnapshot.exists()) {
            const data = directSnapshot.data();

            const documentWeek = String(
              data.tuan ?? data.selectedWeek ?? ""
            ).trim();

            const documentSubject = String(
              data.monHoc ??
                data.mon ??
                data.subject ??
                subjectToUse
            ).trim();

            const documentGrade = getGradeLabel(
              data.lop || data.khoi || ""
            );

            const sameWeek = documentWeek === weekToUse;

            const sameSubject =
              documentSubject.toLowerCase() ===
              subjectToUse.toLowerCase();

            const sameGrade =
              !documentGrade ||
              documentGrade.toLowerCase() ===
                selectedGrade.toLowerCase();

            if (sameWeek && sameSubject && sameGrade) {
              worksheetSnapshot = directSnapshot;
              foundWorksheetId = directSnapshot.id;
              break;
            }
          }
        }

        // 6.3. NẾU KHÔNG TÌM THẤY ID TRỰC TIẾP

        if (!worksheetSnapshot) {
          const allWorksheets = await getDocs(
            worksheetCollection
          );

          if (!active) return;

          const matchedWorksheet = allWorksheets.docs.find(
            (item) => {
              const data = item.data();

              const documentWeek = String(
                data.tuan ?? data.selectedWeek ?? ""
              ).trim();

              const documentSubject = String(
                data.monHoc ??
                  data.mon ??
                  data.subject ??
                  subjectToUse
              ).trim();

              const documentGrade = getGradeLabel(
                data.lop || data.khoi || ""
              );

              const sameWeek = documentWeek === weekToUse;

              const sameSubject =
                documentSubject.toLowerCase() ===
                subjectToUse.toLowerCase();

              const sameGrade =
                !documentGrade ||
                documentGrade.toLowerCase() ===
                  selectedGrade.toLowerCase();

              return sameWeek && sameSubject && sameGrade;
            }
          );

          if (matchedWorksheet) {
            worksheetSnapshot = matchedWorksheet;
            foundWorksheetId = matchedWorksheet.id;
          }
        }

        if (!active) return;

        // =====================================================
        // 7. KHÔNG TÌM THẤY PHIẾU
        // =====================================================

        if (!worksheetSnapshot) {
          setQuestions([]);
          setWorksheetId("");

          console.error("Không tìm thấy phiếu học tập:", {
            username,
            subjectCollection,
            selectedGrade,
            weekToUse,
            possibleIds,
          });

          showMessage(
            `Không tìm thấy phiếu ${subjectToUse}, ${selectedGrade}, tuần ${weekToUse}.`,
            "warning"
          );

          return;
        }

        // =====================================================
        // 8. LẤY DỮ LIỆU PHIẾU
        // =====================================================

        const worksheetData = worksheetSnapshot.data();

        console.log("ĐÃ TÌM THẤY PHIẾU:", {
          id: foundWorksheetId,
          data: worksheetData,
        });

        setWorksheetId(foundWorksheetId);

        setWorksheetInfo({
          title: "PHIẾU HỌC TẬP",
          lessonTitle: worksheetData.lessonTitle || "",
          subtitle: worksheetData.subtitle || "",
          sectionTitle:
            worksheetData.sectionTitle ||
            "BÀI TẬP TRẮC NGHIỆM",
        });

        // =====================================================
        // 9. LẤY VÀ CHUẨN HÓA CÂU HỎI
        // =====================================================

        const rawQuestions = Array.isArray(
          worksheetData.questions
        )
          ? worksheetData.questions
          : [];

        console.log(
          "SỐ CÂU HỎI TRONG FIRESTORE:",
          rawQuestions.length
        );

        const normalizedQuestions = rawQuestions
          .filter(
            (question) =>
              question &&
              typeof question === "object" &&
              String(question.question || "").trim()
          )
          .map((question) => normalizeQuestion(question));

        console.log(
          "SỐ CÂU HỎI SAU KHI CHUẨN HÓA:",
          normalizedQuestions.length
        );

        setQuestions(normalizedQuestions);

        setAnswers(
          createInitialAnswers(normalizedQuestions)
        );

        if (normalizedQuestions.length === 0) {
          showMessage(
            "Đã tìm thấy phiếu nhưng phiếu chưa có câu hỏi hợp lệ.",
            "warning"
          );
        }

        // =====================================================
        // 10. KHÔI PHỤC HỌC SINH ĐƯỢC TRUYỀN TỪ TRANG TRƯỚC
        // =====================================================

        const suppliedStudentName =
          location.state?.studentName ||
          location.state?.fullname ||
          location.state?.hoTen ||
          "";

        const suppliedStudentId = String(
          location.state?.studentId ||
            location.state?.maDinhDanh ||
            ""
        );

        if (suppliedStudentId) {
          const foundStudent = students.find(
            (student) =>
              String(student.id) === suppliedStudentId ||
              String(student.maDinhDanh || "") ===
                suppliedStudentId
          );

          if (foundStudent) {
            setSelectedStudent(foundStudent.id);

            setFullname(
              getStudentName(foundStudent) ||
                suppliedStudentName
            );

            setStudentId(
              foundStudent.maDinhDanh ||
                foundStudent.id
            );
          } else {
            setFullname(suppliedStudentName);
            setStudentId(suppliedStudentId);
          }
        } else if (suppliedStudentName) {
          const foundStudent = students.find(
            (student) =>
              getStudentName(student)
                .trim()
                .toLowerCase() ===
              String(suppliedStudentName)
                .trim()
                .toLowerCase()
          );

          if (foundStudent) {
            setSelectedStudent(foundStudent.id);

            setFullname(
              getStudentName(foundStudent) ||
                suppliedStudentName
            );

            setStudentId(
              foundStudent.maDinhDanh ||
                foundStudent.id
            );
          } else {
            setFullname(suppliedStudentName);
          }
        }
      } catch (error) {
        console.error("Lỗi tải phiếu học tập:", error);

        if (active) {
          showMessage(
            "Có lỗi khi tải dữ liệu phiếu học tập.",
            "error"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [
    classFromState,
    subjectFromState,
    weekFromState,
    documentIdFromState,
    location.state,
    createInitialAnswers,
    showMessage,
    getUploadedStudents,
  ]);

  // ======================================================
  // ĐỒNG HỒ ĐẾM NGƯỢC
  // ======================================================

  useEffect(() => {
    if (!started || submitted || !startTime) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [started, submitted, startTime]);

  // ======================================================
  // CHỌN HỌC SINH
  // ======================================================

  const handleSelectStudent = (event) => {
    const selectedId = event.target.value;

    const student = studentList.find(
      (item) => String(item.id) === String(selectedId)
    );

    if (!student) {
      setSelectedStudent("");
      setFullname("");
      setStudentId("");
      return;
    }

    setSelectedStudent(student.id);
    setFullname(getStudentName(student));

    setStudentId(
      student.maDinhDanh || student.id
    );
  };

  // ======================================================
  // THAY ĐỔI CÂU TRẢ LỜI
  // ======================================================

  const handleAnswerChange = (question, index, answer) => {
    const id = getQuestionId(question, index);

    setAnswers((previous) => ({
      ...previous,
      [id]: answer,
    }));
  };

  // ======================================================
  // ĐẾM SỐ CÂU ĐÃ TRẢ LỜI
  // ======================================================

  const isAnswered = (answer) => {
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }

    if (answer === null || answer === undefined) {
      return false;
    }

    if (typeof answer === "boolean") {
      return true;
    }

    return String(answer).trim() !== "";
  };

  const answeredCount = questions.filter(
    (question, index) => {
      const id = getQuestionId(question, index);
      return isAnswered(answers[id]);
    }
  ).length;

  const getTotalScore = () => {
    return questions.reduce(
      (total, question) =>
        total + getQuestionMax(question),
      0
    );
  };

  const getEarnedScore = () => {
    return questions.reduce((total, question, index) => {
      const id = getQuestionId(question, index);

      const correct = checkAnswer(
        question,
        answers[id]
      );

      return total + (
        correct ? getQuestionMax(question) : 0
      );
    }, 0);
  };

  const getQuestionMax = (question) => {
    const scoreTotal = Number(question?.scoreTotal);

    if (Number.isFinite(scoreTotal) && scoreTotal > 0) {
      return scoreTotal;
    }

    const points = Number(
      question?.points ?? question?.score ?? question?.diem
    );

    return Number.isFinite(points) && points > 0 ? points : 1;
  };

  // ======================================================
  // NỘP BÀI
  // DỪNG ĐỒNG HỒ VÀ GIỮ NGUYÊN THỜI GIAN CÒN LẠI
  // KHÔNG TÍNH ĐIỂM, KHÔNG XEM ĐÁP ÁN, KHÔNG LƯU KẾT QUẢ
  // ======================================================

  const handleSubmit = useCallback(
    (autoSubmit = false) => {
      if (submittingRef.current || submitted) return;

      if (!fullname.trim()) {
        showMessage(
          "Vui lòng chọn học sinh trước khi nộp bài.",
          "warning"
        );
        return;
      }

      if (!questions.length) {
        showMessage(
          "Phiếu học tập chưa có câu hỏi.",
          "warning"
        );
        return;
      }

      submittingRef.current = true;

      // Dừng đồng hồ, giữ nguyên thời gian còn lại
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // TÍNH ĐIỂM
      const earnedScore = questions.reduce(
        (total, question, index) => {
          const id = getQuestionId(question, index);

          return total + (
            checkAnswer(question, answers[id])
              ? getQuestionMax(question)
              : 0
          );
        },
        0
      );

      const maxTotalScore = questions.reduce(
        (total, question) =>
          total + getQuestionMax(question),
        0
      );

      const totalScore =
        maxTotalScore > 0
          ? Math.round(
              (earnedScore / maxTotalScore) * 10 * 2
            ) / 2
          : 0;

      setScore(totalScore);

      // KẾT THÚC BÀI LÀM
      setSubmitted(true);
      setStarted(false);

      submittingRef.current = false;

      showMessage(
        autoSubmit
          ? "Đã hết thời gian. Bài làm đã tự động nộp."
          : "Đã nộp bài thành công.",
        autoSubmit ? "info" : "success"
      );
    },
    [
      submitted,
      fullname,
      questions,
      answers,
      showMessage,
    ]
  );

  // ======================================================
  // TỰ ĐỘNG NỘP KHI HẾT GIỜ
  // ======================================================

  useEffect(() => {
    if (!started || submitted || timeLeft !== 0) {
      return;
    }

    handleSubmit(true);
  }, [timeLeft, started, submitted, handleSubmit]);

  // ======================================================
  // BẮT ĐẦU LÀM BÀI
  // ======================================================

  const handleStart = () => {
    if (!fullname.trim()) {
      showMessage(
        "Vui lòng chọn học sinh trước khi làm bài.",
        "warning"
      );
      return;
    }

    if (!questions.length) {
      showMessage(
        "Phiếu học tập chưa có câu hỏi.",
        "warning"
      );
      return;
    }

    setTimeLeft(timeLimitMinutes * 60);
    setStartTime(null);
    setSubmitted(false);
    submittingRef.current = false;
    setStarted(true);
  };

  // ======================================================
  // LÀM LẠI
  // CHỈ LÚC NÀY MỚI RESET ĐỒNG HỒ
  // ======================================================

  const handleRetry = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setAnswers(createInitialAnswers(questions));

    submittingRef.current = false;

    setTimeLeft(timeLimitMinutes * 60);
    setStartTime(null);
    setSubmitted(false);
    setStarted(true);
  };

  // ======================================================
  // CUỘN ĐẾN THÔNG BÁO SAU KHI NỘP BÀI
  // ======================================================

  useEffect(() => {
    if (submitted && resultRef.current) {
      resultRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [submitted]);

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress size={42} />

        <Typography color="text.secondary" fontWeight={600}>
          Đang tải phiếu học tập...
        </Typography>
      </Box>
    );
  }

  // ======================================================
  // GIAO DIỆN CHÍNH
  // ======================================================

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1000,
        mx: "auto",
        p: { xs: 1.5, md: 3 },
        pb: { xs: 12, md: 11 },
        boxSizing: "border-box",
        overflow: "visible",
        position: "relative",
      }}
    >
      {/* TIÊU ĐỀ PHIẾU */}

      <Paper
        elevation={0}
        sx={{
          width: "100%",
          backgroundColor: "#fff",
          borderRadius: "24px",
          overflow: "visible",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 25px rgba(0,0,0,0.10)",
          mb: 2,
        }}
      >
        {/* HEADER */}

        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            isolation: "isolate",

            // HÌNH NỀN PHIẾU HỌC TẬP
            backgroundColor: "#0288cc",
            backgroundImage: `
              linear-gradient(
                rgba(0, 55, 100, 0.30),
                rgba(0, 55, 100, 0.30)
              ),
              url("/Phieu-hoc-tap.png")
            `,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",

            color: "#fff",
            textAlign: "center",
            px: { xs: 2, sm: 4 },
            py: { xs: 3.5, sm: 4.5 },
            borderRadius: "14px",
            boxShadow: "0 5px 16px rgba(2, 136, 204, 0.2)",

            "@keyframes headerTitleIn": {
              "0%": {
                opacity: 0,
                transform: "translateY(15px)",
              },
              "100%": {
                opacity: 1,
                transform: "translateY(0)",
              },
            },

            "@keyframes headerLineIn": {
              "0%": {
                opacity: 0,
                transform: "scaleX(0)",
              },
              "100%": {
                opacity: 1,
                transform: "scaleX(1)",
              },
            },

            "@keyframes headerDecorationFloat": {
              "0%, 100%": {
                transform: "translateY(0) rotate(0deg)",
              },
              "50%": {
                transform: "translateY(9px) rotate(5deg)",
              },
            },

            "@keyframes headerDiamond": {
              "0%, 100%": {
                transform: "rotate(45deg) scale(1)",
              },
              "50%": {
                transform: "rotate(135deg) scale(1.15)",
              },
            },

            "@media (prefers-reduced-motion: reduce)": {
              "& *": {
                animation: "none !important",
              },
            },
          }}
        >
          {/* HOA VĂN GÓC TRÁI */}

          <Box
            sx={{
              position: "absolute",
              zIndex: -1,
              top: -65,
              left: -45,
              width: 190,
              height: 190,
              border: "2px solid rgba(255,255,255,0.20)",
              borderRadius: "50%",
              boxShadow:
                "0 0 0 18px rgba(255,255,255,0.07), 0 0 0 38px rgba(255,255,255,0.05)",
              animation:
                "headerDecorationFloat 7s ease-in-out infinite",
            }}
          />

          {/* HOA VĂN GÓC PHẢI */}

          <Box
            sx={{
              position: "absolute",
              zIndex: -1,
              top: -35,
              right: -25,
              width: 150,
              height: 150,
              transform: "rotate(35deg)",
              border: "2px solid rgba(255,255,255,0.20)",
              borderRadius: "28px",
              boxShadow: "0 0 0 16px rgba(255,255,255,0.06)",
              animation:
                "headerDecorationFloat 8s ease-in-out infinite",
              animationDelay: "0.5s",
            }}
          />

          {/* CÁC CHẤM TRANG TRÍ */}

          <Box
            sx={{
              position: "absolute",
              zIndex: -1,
              bottom: 18,
              left: { xs: 22, sm: 65 },
              width: 9,
              height: 9,
              borderRadius: "50%",
              backgroundColor: "#fef08a",
              boxShadow:
                "22px -14px 0 rgba(255,255,255,0.55), 44px 0 0 rgba(255,255,255,0.35)",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              zIndex: -1,
              top: 25,
              right: { xs: 35, sm: 100 },
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "#fde68a",
              boxShadow:
                "18px 15px 0 rgba(255,255,255,0.5), 35px -5px 0 rgba(255,255,255,0.3)",
            }}
          />

          {/* NỘI DUNG TIÊU ĐỀ */}

          <Box
            sx={{
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* NÚT THOÁT */}

            <IconButton
              onClick={() => window.close()}
              aria-label="Đóng phiếu học tập"
              sx={{
                position: "absolute",
                top: { xs: -18, sm: -22 },
                right: { xs: -12, sm: -22 },
                width: 34,
                height: 34,
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.55)",
                borderRadius: "50%",
                zIndex: 5,
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.32)",
                },
              }}
            >
              <CloseIcon sx={{ fontSize: 21 }} />
            </IconButton>

            <Typography
              sx={{
                fontSize: { xs: 19, sm: 27 },
                fontWeight: 900,
                letterSpacing: { xs: 0.3, sm: 0.8 },
                textTransform: "uppercase",
                lineHeight: 1.4,
                color: "#ffffff",
                textShadow: "0 2px 3px rgba(0,60,100,0.15)",
                animation: "headerTitleIn 800ms ease both",
              }}
            >
              {worksheetInfo.title}
            </Typography>

            {/* DẢI TRANG TRÍ */}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                my: 1.8,
                animation: "headerLineIn 900ms ease both",
                animationDelay: "200ms",
              }}
            >
              <Box
                sx={{
                  width: 35,
                  height: 2,
                  backgroundColor: "rgba(255,255,255,0.65)",
                  borderRadius: 2,
                }}
              />

              <Box
                sx={{
                  width: 9,
                  height: 9,
                  backgroundColor: "#fde68a",
                  transform: "rotate(45deg)",
                  borderRadius: "2px",
                  animation: "headerDiamond 3s ease-in-out infinite",
                }}
              />

              <Box
                sx={{
                  width: 35,
                  height: 2,
                  backgroundColor: "rgba(255,255,255,0.65)",
                  borderRadius: 2,
                }}
              />
            </Box>

            {/* TÊN BÀI HỌC */}

            {worksheetInfo.lessonTitle && (
              <Typography
                sx={{
                  fontSize: { xs: 18, sm: 24 },
                  fontWeight: 900,
                  color: "#fff3b0",
                  textTransform: "uppercase",
                  lineHeight: 1.45,
                  textShadow: "0 2px 3px rgba(0,60,100,0.18)",
                  overflowWrap: "anywhere",
                  animation: "headerTitleIn 900ms ease both",
                  animationDelay: "300ms",
                }}
              >
                {worksheetInfo.lessonTitle}
              </Typography>
            )}
          </Box>
        </Box>

        <ThongTinPhieuHocTap
          submitted={submitted}
          fullname={fullname}
          selectedStudent={selectedStudent}
          handleSelectStudent={handleSelectStudent}
          started={started}
          studentList={studentList}
          studentClass={studentClass}
          subject={subject}
          selectedWeek={selectedWeek}
          date={date}
          timeLeft={timeLeft}
          formatTime={formatTime}
          answeredCount={answeredCount}
          questions={questions}
          setOpenSoanDialog={setOpenSoanDialog}
          getStudentName={getStudentName}
          timeLimitMinutes={timeLimitMinutes}
        />
      </Paper>

      {/* DANH SÁCH CÂU HỎI */}

      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            background:
              "linear-gradient(135deg, #ed6c02, #ff9800)",
            color: "#fff",
            px: 2,
            py: 1.5,
          }}
        >
          <Typography fontWeight={900} fontSize={18}>
            {worksheetInfo.sectionTitle}
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 1.5, md: 3 } }}>
          {!questions.length ? (
            <Typography
              textAlign="center"
              color="text.secondary"
              py={5}
            >
              Chưa có câu hỏi trong phiếu học tập.
            </Typography>
          ) : (
            questions.map((question, index) => {
              const id = getQuestionId(question, index);

              return (
                <Box key={id} mb={3}>
                  <Typography
                    fontWeight={800}
                    color="primary.dark"
                    mb={1.5}
                  >
                    Câu {index + 1}.
                  </Typography>

                  <QuestionPlayer
                    question={question}
                    answer={answers[id]}
                    onChange={(answer) =>
                      handleAnswerChange(
                        question,
                        index,
                        answer
                      )
                    }
                    disabled={!started || submitted}
                    showCheckButton={false}
                  />
                </Box>
              );
            })
          )}
        </Box>
      </Paper>

      {/* THANH ĐIỀU KHIỂN CỐ ĐỊNH CUỐI MÀN HÌNH */}

      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: 1.5,
          py: 0.7,
          backgroundColor: "rgba(255,255,255,0.97)",
          borderTop: "1px solid #e2e8f0",
          boxShadow: "0 -2px 10px rgba(15,23,42,0.08)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 1100,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 1,
          }}
        >
          {!started && !submitted && (
            <Button
              variant="contained"
              onClick={handleStart}
              disabled={!questions.length}
              sx={{
                minWidth: { xs: "100%", sm: 210 },
                py: 0.75,
                borderRadius: 2,
                fontWeight: 800,
                fontSize: 13,
                boxShadow: "none",
              }}
            >
              BẮT ĐẦU LÀM BÀI
            </Button>
          )}

          {started && !submitted && (
            <Button
              variant="contained"
              color="success"
              onClick={() => handleSubmit(false)}
              sx={{
                minWidth: { xs: "100%", sm: 120 },
                py: 0.75,
                borderRadius: 2,
                fontWeight: 800,
                fontSize: 13,
                boxShadow: "none",
              }}
            >
              NỘP BÀI
            </Button>
          )}

          {submitted && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RestartAltIcon sx={{ fontSize: 17 }} />}
              onClick={handleRetry}
              sx={{
                minWidth: { xs: "100%", sm: 190 },
                py: 0.7,
                borderRadius: 2,
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              LÀM LẠI
            </Button>
          )}
        </Box>
      </Box>

      {/* THÔNG BÁO SAU KHI NỘP BÀI */}

      {submitted && (
        <Paper
          ref={resultRef}
          elevation={3}
          sx={{
            mt: 3,
            p: 3,
            borderRadius: 3,
            textAlign: "center",
            border: "1px solid #bbdefb",
          }}
        >
          <Typography fontWeight={900} color="primary" fontSize={22}>
            KẾT QUẢ BÀI LÀM
          </Typography>

          <Typography
            fontWeight={900}
            fontSize={42}
            color="error.main"
            mt={1}
          >
            {Math.round(score)}/10
          </Typography>

          <Typography color="text.secondary" mt={1}>
            {answeredCount}/{questions.length} câu đã trả lời
          </Typography>
        </Paper>
      )}

      {/* DIALOG SOẠN PHIẾU */}

      <SoanPhieuHocTapDialog
        open={openSoanDialog}
        onClose={() => setOpenSoanDialog(false)}
        selectedWeek={selectedWeek}
        selectedClass={studentClass}
        subject={subject}
        documentId={worksheetId}
        onSaved={() => {
          setOpenSoanDialog(false);

          showMessage(
            "Đã lưu phiếu học tập.",
            "success"
          );
        }}
      />

      {/* DIALOG PHÓNG TO HÌNH ẢNH */}

      <ImageZoomDialog
        open={Boolean(zoomImage)}
        image={zoomImage}
        onClose={() => setZoomImage(null)}
      />

      {/* THÔNG BÁO */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() =>
          setSnackbar((previous) => ({
            ...previous,
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
            setSnackbar((previous) => ({
              ...previous,
              open: false,
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
