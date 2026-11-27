
import React, { useEffect, useState, useContext } from "react";

import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  TextField,
  MenuItem,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";

import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";

import { StudentContext } from "../context/StudentContext";

import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import RotateRightRoundedIcon from "@mui/icons-material/RotateRightRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";

import { uploadStudentExcelToUser } from "../utils/uploadStudentExcel";

// Các Dialog công cụ
import CountdownTimerDialog from "../dialog/CountdownTimerDialog";
import RandomStudentDialog from "../dialog/RandomStudentDialog";
import LuckyWheelDialog from "../dialog/LuckyWheelDialog";
import StopwatchDialog from "../dialog/StopwatchDialog";
import GroupStudentsDialog from "../dialog/GroupStudentsDialog";
import DiceDialog from "../dialog/DiceDialog";
import NoiseMeterDialog from "../dialog/NoiseMeterDialog";
import QuestionDrawDialog from "../dialog/QuestionDrawDialog";
import TreasureMapGame from "../dialog/TreasureMapGame";
import QuickQuestionDialog from "../dialog/QuickQuestionDialog";
import LearningLeaderboardDialog from "../dialog/LearningLeaderboardDialog";
import KnowledgeArenaDialog from "../dialog/KnowledgeArenaDialog";
import AccountsDialog from "../dialog/AccountsDialog";

import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import PhieuHocTap from "./PhieuHocTap";

export default function Tools() {
  const {
    setUploadedStudentsForClass,
    getUploadedStudents,
  } = useContext(StudentContext);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("tools_user") || "{}");
    } catch {
      return {};
    }
  })();

    const accountStatusKey = `tools_account_status_${currentUser.username}`;

  const [accountStatus, setAccountStatus] = useState(() => {
    return localStorage.getItem(accountStatusKey) || "checking";
  });

  const {
    studentData: contextStudentData,
    uploadedStudents: contextUploadedStudents,
  } = useContext(StudentContext);

  useEffect(() => {
    let isMounted = true;

    const checkAccountStatus = async () => {
      // Dùng kết quả đã kiểm tra trước đó nếu có
      const cachedStatus = localStorage.getItem(accountStatusKey);

      if (cachedStatus) {
        if (isMounted) setAccountStatus(cachedStatus);
        return;
      }

      if (!currentUser.username) {
        if (isMounted) setAccountStatus("inactive");
        return;
      }

      try {
        const userRef = doc(db, "USERS", currentUser.username);
        const userSnap = await getDoc(userRef);

        const status =
          userSnap.exists() && userSnap.data().status === "active"
            ? "active"
            : "inactive";

        localStorage.setItem(accountStatusKey, status);

        if (isMounted) {
          setAccountStatus(status);
        }
      } catch (error) {
        console.error("Lỗi kiểm tra trạng thái tài khoản:", error);

        localStorage.setItem(accountStatusKey, "error");

        if (isMounted) {
          setAccountStatus("error");
        }
      }
    };

    checkAccountStatus();

    return () => {
      isMounted = false;
    };
  }, [accountStatusKey]);

  const [openAccountsDialog, setOpenAccountsDialog] = useState(false);

  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({
    open: false,
    type: "success",
    text: "",
  });

  // Danh sách tất cả môn học
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

// Môn học được chọn
const [selectedSubject, setSelectedSubject] = useState("");
const [loadingSubject, setLoadingSubject] = useState(true);

// Đọc môn học đã lưu từ Firestore
useEffect(() => {
  const loadSavedSubject = async () => {
    const username = currentUser?.username?.trim().toLowerCase();
    if (!username) {
      setLoadingSubject(false);
      return;
    }

    try {
      const userRef = doc(db, "USERS", username);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const savedSubject = userSnap.data().monHoc || "";

        setSelectedSubject(
          SUBJECT_OPTIONS.includes(savedSubject) ? savedSubject : ""
        );
      }
    } catch (error) {
      console.error("Lỗi tải môn học:", error);
    } finally {
      setLoadingSubject(false);
    }
  };

  loadSavedSubject();
}, [currentUser?.username]);

// Khi chọn môn: lưu vào Firestore
const handleSubjectChange = async (event) => {
  const value = event.target.value;

  setSelectedSubject(value);

  const username = currentUser?.username?.trim().toLowerCase();
  if (!username || !value) return;

  try {
    const userRef = doc(db, "USERS", username);

    await updateDoc(userRef, {
      monHoc: value,
    });
  } catch (error) {
    console.error("Lỗi lưu môn học:", error);
    setUploadMessage({
      open: true,
      type: "error",
      text: "Không thể lưu môn học đã chọn.",
    });
  }
};
  
  const handleUploadStudentExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (accountStatus !== "active") return;

    if (!selectedClass) {
      setUploadMessage({
        open: true,
        type: "warning",
        text: "Vui lòng chọn lớp trước khi tải danh sách.",
      });
      return;
    }

    try {
      setUploadingExcel(true);

      const result = await uploadStudentExcelToUser({
        file,
        username: currentUser.username,
        className: selectedClass,
      });

      // Lưu danh sách học sinh vào StudentContext
      setUploadedStudentsForClass(
        currentUser.username,
        selectedClass,
        result.students.map((student) => ({
          ...student,
          lop: selectedClass,
          username: currentUser.username,
        }))
      );

      // Xóa cache danh sách cũ
      setStudentData((prev) => ({
        ...prev,
        [selectedClass]: undefined,
      }));

      setUploadMessage({
        open: true,
        type: "success",
        text: `Đã tải lên ${result.total} học sinh lớp ${selectedClass}.`,
      });
    } catch (error) {
      console.error("Lỗi tải Excel:", error);

      setUploadMessage({
        open: true,
        type: "error",
        text: error.message || "Không thể tải danh sách học sinh.",
      });
    } finally {
      setUploadingExcel(false);
    }
  };

  

  const [registeredClasses, setRegisteredClasses] = useState([]);

  useEffect(() => {
    const loadRegisteredClasses = async () => {
      const username = currentUser?.username?.trim().toLowerCase();
      if (!username) return;

      try {
        const userRef = doc(db, "USERS", username);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setRegisteredClasses([]);
          return;
        }

        const lopDay = userSnap.data().lopDay;

        const classes = [
          ...new Set(
            (Array.isArray(lopDay)
              ? lopDay
              : String(lopDay || "").split(",")
            )
              .map((item) => String(item).trim())
              .filter(Boolean)
          ),
        ].sort((a, b) =>
          a.localeCompare(b, "vi", { numeric: true })
        );

        setRegisteredClasses(classes);
      } catch (error) {
        console.error("Lỗi tải danh sách lớp:", error);
        setRegisteredClasses([]);
      }
    };

    loadRegisteredClasses();
  }, [currentUser?.username]);

  const [selectedClass, setSelectedClassState] = useState(
    () => localStorage.getItem("tools_selected_class") || ""
  );

  useEffect(() => {
    if (registeredClasses.length === 0) {
      setSelectedClassState("");
      localStorage.removeItem("tools_selected_class");
      return;
    }

    setSelectedClassState((prev) => {
      const savedClass = localStorage.getItem("tools_selected_class");

      const nextClass = registeredClasses.includes(prev)
        ? prev
        : registeredClasses.includes(savedClass)
          ? savedClass
          : registeredClasses[0];

      localStorage.setItem("tools_selected_class", nextClass);
      return nextClass;
    });
  }, [registeredClasses]);

  const [students, setStudents] = useState([]);
  // Ưu tiên danh sách đã tải Excel trong StudentContext
  const uploadedStudents = getUploadedStudents(
    currentUser.username,
    selectedClass
  );

  const activeStudents = uploadedStudents ?? students;

  const [studentData, setStudentData] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Năm học mặc định
  const namHocKey = (
    localStorage.getItem("tools_nam_hoc") || "2025-2026"
  ).replace(/-/g, "_");

  // Tuần được chọn – không tự mặc định tuần
 
// Tuần học: đọc từ tài khoản Firestore khi mở trang
const [week, setWeek] = useState("");

useEffect(() => {
  const loadSavedWeek = async () => {
    const username = currentUser?.username?.trim().toLowerCase();
    if (!username) return;

    try {
      const userRef = doc(db, "USERS", username);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const savedWeek = Number(userSnap.data().tuan);

        if (Number.isInteger(savedWeek) && savedWeek >= 1 && savedWeek <= 35) {
          setWeek(savedWeek);
        } else {
          setWeek("");
        }
      }
    } catch (error) {
      console.error("Lỗi tải tuần học:", error);
    }
  };

  loadSavedWeek();
}, [currentUser?.username]);

// Khi thay đổi tuần: cập nhật state và lưu vào tài khoản
const handleWeekChange = async (event) => {
  const value = Number(event.target.value);
  if (!Number.isInteger(value) || value < 1 || value > 35) return;

  setWeek(value);

  const username = currentUser?.username?.trim().toLowerCase();
  if (!username) return;

  try {
    const userRef = doc(db, "USERS", username);
    await updateDoc(userRef, {
      tuan: value,
    });
  } catch (error) {
    console.error("Lỗi lưu tuần học:", error);
  }
};


  // Lưu lớp được chọn
  // Lưu lớp được chọn vào State, LocalStorage và Firestore
  const setSelectedClass = async (className) => {
    setSelectedClassState(className);
    localStorage.setItem("tools_selected_class", className);

    const username = currentUser?.username?.trim().toLowerCase();
    if (!username || !className) return;

    try {
      const userRef = doc(db, "USERS", username);

      await updateDoc(userRef, {
        lopDangChon: className,
      });
    } catch (error) {
      console.error("Lỗi lưu lớp được chọn:", error);
    }
  };

  // Quay về danh sách công cụ
  const goBackToTools = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("tool");

    window.location.href =
      url.pathname + url.search + url.hash;
  };

  // =========================================
  // XÁC ĐỊNH CÔNG CỤ ĐANG MỞ
  // =========================================

  const searchParams = new URLSearchParams(window.location.search);
  const activeToolId = searchParams.get("tool");

  // =========================================
  // DANH SÁCH CÁC NHÓM CÔNG CỤ
  // =========================================

  const toolGroups = [
    {
      title: "TỔ CHỨC LỚP HỌC",
      color: "#1976d2",
      tools: [
        {
          id: "random-student",
          title: "Gọi tên ngẫu nhiên",
          description: "Chọn ngẫu nhiên một học sinh trong lớp",
          icon: <SchoolRoundedIcon />,
          iconColor: "#2563EB",
          iconBg: "#DBEAFE",
          needStudents: true,
        },
        {
          id: "lucky-wheel",
          title: "Vòng quay may mắn",
          description: "Quay vòng tròn để chọn học sinh",
          icon: <RotateRightRoundedIcon />,
          iconColor: "#D97706",
          iconBg: "#FEF3C7",
          needStudents: true,
        },
      ],
    },

    {
      title: "TRÒ CHƠI HỌC TẬP",
      color: "#7C3AED",
      tools: [
        {
          id: "treasure-map",
          title: "Đi tìm kho báu",
          description:
            "Tổ chức trò chơi khám phá và chinh phục kho báu kiến thức",
          icon: <AutoAwesomeIcon />,
          iconColor: "#7C3AED",
          iconBg: "#EDE9FE",
        },
        {
          id: "question-draw",
          title: "Bốc thăm câu hỏi",
          description: "Nhập câu hỏi và chọn ngẫu nhiên",
          icon: <QuizRoundedIcon />,
          iconColor: "#7C3AED",
          iconBg: "#EDE9FE",
        },
        {
          id: "phieu-hoc-tap",
          title: "Phiếu học tập",
          description: "Tổ chức làm bài, chấm điểm và lưu kết quả học tập",
          icon: <FactCheckRoundedIcon />,
          iconColor: "#0284C7",
          iconBg: "#E0F2FE",
        },
        {
          id: "leaderboard",
          title: "Bảng thi đua học tập",
          description: "Cộng điểm, trừ điểm và xếp hạng học sinh",
          icon: <EmojiEventsRoundedIcon />,
          iconColor: "#D97706",
          iconBg: "#FEF3C7",
        },
        {
          id: "knowledge-arena",
          title: "Đấu trường kiến thức",
          description: "Thi trắc nghiệm, tính điểm và công bố kết quả",
          icon: <SchoolRoundedIcon />,
          iconColor: "#7C3AED",
          iconBg: "#EDE9FE",
        },
      ],
    },

    {
      title: "QUẢN LÝ HOẠT ĐỘNG",
      color: "#00897b",
      tools: [
        {
          id: "countdown",
          title: "Đồng hồ đếm ngược",
          description: "Thiết lập thời gian cho hoạt động",
          icon: <HourglassEmptyRoundedIcon />,
          iconColor: "#EA580C",
          iconBg: "#FFEDD5",
        },
        {
          id: "stopwatch",
          title: "Bấm giờ hoạt động",
          description: "Theo dõi thời gian thực hiện nhiệm vụ",
          icon: <TimerRoundedIcon />,
          iconColor: "#0D9488",
          iconBg: "#CCFBF1",
        },
        {
          id: "dice",
          title: "Xúc xắc ngẫu nhiên",
          description: "Tung xúc xắc để chọn số ngẫu nhiên",
          icon: <CasinoRoundedIcon />,
          iconColor: "#4F46E5",
          iconBg: "#E0E7FF",
        },
        {
          id: "group-students",
          title: "Chia nhóm học sinh",
          description: "Tự động chia học sinh thành các nhóm",
          icon: <GroupsRoundedIcon />,
          iconColor: "#0891B2",
          iconBg: "#CFFAFE",
          needStudents: true,
        },
      ],
    },
  ];

  // =========================================
  // TÌM TÊN CÔNG CỤ
  // =========================================

  const allTools = toolGroups.flatMap((group) => group.tools);

  const activeTool = allTools.find(
    (tool) => tool.id === activeToolId
  );

  // =========================================
  // ĐẶT TÊN TAB TRÌNH DUYỆT
  // =========================================

  useEffect(() => {
    document.title = activeToolId
      ? activeTool?.title || "Công cụ giảng dạy"
      : "Công cụ hỗ trợ giảng dạy";
  }, [activeToolId, activeTool]);

  // =========================================
  // MỞ CÔNG CỤ TRONG TAB MỚI
  // =========================================

  const openToolInNewTab = (toolId) => {
    if (accountStatus !== "active") return;

    const url = new URL(window.location.href);
    url.searchParams.set("tool", toolId);

    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  // =========================================
  // ĐÓNG CÔNG CỤ
  // =========================================

  const handleToolClose = () => {
    window.close();

    setTimeout(() => {
      if (!window.closed) {
        goBackToTools();
      }
    }, 100);
  };

  // =========================================
  // LẤY DANH SÁCH HỌC SINH TỪ FIRESTORE
  // =========================================

  
useEffect(() => {
  let isMounted = true;

  const fetchStudents = async () => {
    const username = String(currentUser?.username || "")
      .trim()
      .toLowerCase();

    if (!username || !selectedClass) {
      setStudents([]);
      setLoadingStudents(false);
      return;
    }

    const classKey = selectedClass
      .trim()
      .replace(/\./g, "_");

    const contextKey = `${username}_${classKey}`;

    // 1. Ưu tiên danh sách đã tải Excel
    const uploaded = contextUploadedStudents?.[contextKey];

    // 2. Tìm danh sách đã lưu trong StudentContext
    const savedData = contextStudentData?.[contextKey];

    const savedStudents = savedData
      ? Object.values(savedData).find(
          (item) => Array.isArray(item) && item.length > 0
        )
      : null;

    const cachedStudents =
      Array.isArray(uploaded) && uploaded.length > 0
        ? uploaded
        : savedStudents;

    if (Array.isArray(cachedStudents) && cachedStudents.length > 0) {
      setStudents(cachedStudents);
      setLoadingStudents(false);
      return;
    }

    // 3. Không có dữ liệu Context: tải từ Firestore
    setLoadingStudents(true);
    setStudents([]);

    try {
      const studentsRef = collection(
        db,
        "USERS",
        username,
        "DANHSACH_HOCSINH",
        classKey,
        "HOCSINH"
      );

      const snapshot = await getDocs(studentsRef);

      const studentList = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        return {
          maDinhDanh: docSnap.id,
          hoVaTen: data.hoVaTen || "",
          ghiChu: data.ghiChu || "",
          stt: data.stt ?? 0,
        };
      });

      // Sắp xếp theo tên học sinh
      studentList.sort((a, b) => {
        const nameA =
          String(a.hoVaTen || "").trim().split(/\s+/).slice(-1)[0] || "";

        const nameB =
          String(b.hoVaTen || "").trim().split(/\s+/).slice(-1)[0] || "";

        return nameA.localeCompare(nameB, "vi");
      });

      // Đánh số thứ tự
      const formattedStudents = studentList.map(
        (student, index) => ({
          ...student,
          stt: student.stt || index + 1,
        })
      );

      if (isMounted) {
        setStudents(formattedStudents);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách học sinh:", error);

      if (isMounted) {
        setStudents([]);
      }
    } finally {
      if (isMounted) {
        setLoadingStudents(false);
      }
    }
  };

  fetchStudents();

  return () => {
    isMounted = false;
  };
}, [
  selectedClass,
  currentUser?.username,
  contextStudentData,
  contextUploadedStudents,
]);


  // =========================================
  // HIỂN THỊ CÔNG CỤ
  // =========================================

  const renderTool = (toolId) => {
    switch (toolId) {
      case "countdown":
        return (
          <CountdownTimerDialog
            open={true}
            onClose={handleToolClose}
          />
        );

      case "random-student":
        return (
          <RandomStudentDialog
            open={true}
            onClose={handleToolClose}
            username={currentUser.username}
            className={selectedClass}
            students={activeStudents}
          />
        );

      case "group-students":
        return (
          <GroupStudentsDialog
            open={true}
            onClose={handleToolClose}
            username={currentUser.username}
            className={selectedClass}
            students={students}
          />
        );

      case "dice":
        return (
          <DiceDialog
            open={true}
            onClose={handleToolClose}
          />
        );

      case "lucky-wheel":
        return (
          <LuckyWheelDialog
            open={true}
            onClose={handleToolClose}
            username={currentUser.username}
            students={students}
            className={selectedClass}
          />
        );

      case "noise":
        return (
          <NoiseMeterDialog
            open={true}
            onClose={handleToolClose}
          />
        );

      case "question-draw":
        return (
          <QuestionDrawDialog
            open={true}
            onClose={handleToolClose}
            selectedClass={selectedClass}
            week={week}
          />
        );

      case "stopwatch":
        return (
          <StopwatchDialog
            open={true}
            onClose={handleToolClose}
          />
        );

      case "treasure-map":
        return (
          <TreasureMapGame
            open={true}
            onClose={handleToolClose}
          />
        );

      case "quick-question":
        return (
          <QuickQuestionDialog
            open={true}
            onClose={handleToolClose}
          />
        );

      case "leaderboard":
        return (
          <LearningLeaderboardDialog
            open={true}
            onClose={handleToolClose}
            username={currentUser.username}
            className={selectedClass}
            students={activeStudents}
          />
        );

      case "knowledge-arena":
        return (
          <KnowledgeArenaDialog
            open={true}
            onClose={handleToolClose}
          />
        );
      
      case "phieu-hoc-tap":
        return (
          <PhieuHocTap
            selectedClass={selectedClass}
            week={week}
            students={activeStudents}
          />
        );

      default:
        return null;
    }
  };

  // =========================================
  // TAB CÔNG CỤ RIÊNG
  // =========================================

    // =========================================
  // TAB CÔNG CỤ RIÊNG
  // =========================================

  if (activeToolId && accountStatus !== "active") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          p: 3,
          textAlign: "center",
        }}
      >
        {accountStatus === "checking" ? (
          <CircularProgress />
        ) : (
          <CloseIcon sx={{ fontSize: 48, color: "#dc2626" }} />
        )}

        <Typography fontWeight={700} fontSize={17}>
          {accountStatus === "checking"
            ? "Đang kiểm tra tài khoản..."
            : accountStatus === "error"
              ? "Không thể xác minh tài khoản"
              : "Tài khoản đã bị vô hiệu hóa"}
        </Typography>

        <Typography color="text.secondary" fontSize={13}>
          {accountStatus === "checking"
            ? "Vui lòng chờ trong giây lát."
            : accountStatus === "error"
              ? "Vui lòng kiểm tra kết nối và tải lại trang."
              : "Tài khoản của bạn hiện không được phép sử dụng công cụ."}
        </Typography>

        {accountStatus !== "checking" && (
          <Button variant="contained" onClick={goBackToTools}>
            Quay lại
          </Button>
        )}
      </Box>
    );
  }

  if (activeToolId) {
    if (!activeTool) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography fontWeight={700}>
            Không tìm thấy công cụ
          </Typography>

          <Typography color="text.secondary">
            Công cụ này không tồn tại hoặc đã được thay đổi.
          </Typography>

          <Box
            component="button"
            onClick={handleToolClose}
            sx={{
              border: 0,
              borderRadius: 2,
              px: 2.5,
              py: 1,
              color: "#fff",
              background: "#1976d2",
              cursor: "pointer",
            }}
          >
            Quay lại
          </Box>
        </Box>
      );
    }
    
    return (
      <Box
        sx={{
          width: "100%",
          minHeight: "calc(100vh - 48px)",
          height: "auto",
          overflow: "visible",
          position: "relative",
          background: "#fff",
          boxSizing: "border-box",
        }}
      >
        {renderTool(activeToolId)}
      </Box>
    );

  }

  // =========================================
  // GIAO DIỆN DANH SÁCH CÔNG CỤ
  // =========================================

  const totalTools = toolGroups.reduce(
    (total, group) => total + group.tools.length,
    0
  );

  const availableTools =
    accountStatus !== "active"
      ? 0
      : allTools.filter(
          (tool) =>
            !tool.needStudents ||
            (selectedClass &&
              activeStudents.length > 0 &&
              (uploadedStudents || !loadingStudents))
        ).length;

  
return (
  <Box
    sx={{
      minHeight: "100vh",
      width: "100%",
      boxSizing: "border-box",
      overflowX: "hidden",
      p: { xs: 1, sm: 2.5, md: 3 },
      background:
        "radial-gradient(circle at 5% 0%, #dbeafe 0, transparent 28%), radial-gradient(circle at 95% 15%, #ede9fe 0, transparent 25%), #f4f7fc",
    }}
  >
    <Box
      sx={{
        maxWidth: { xs: "100%", sm: 760, md: 820, lg: 860 },
        mx: "auto",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1, sm: 2.5, md: 3 },
          borderRadius: { xs: 3, sm: 4 },
          background: "#fff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 12px 35px rgba(30,64,110,0.08)",
          overflow: "hidden",
        }}
      >
        {/* ================= HEADER ================= */}
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 3,
            color: "#fff",
            background:
              "linear-gradient(120deg, #102b57 0%, #1555a5 52%, #287de0 100%)",
          }}
        >
          {/* HỌA TIẾT TRANG TRÍ */}
          <Box
            sx={{
              position: "absolute",
              width: 260,
              height: 260,
              borderRadius: "50%",
              right: -75,
              top: -145,
              background: "rgba(255,255,255,0.09)",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              width: 190,
              height: 190,
              borderRadius: "50%",
              right: 100,
              bottom: -145,
              background: "rgba(255,255,255,0.07)",
            }}
          />

          {/* TIÊU ĐỀ */}
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              px: { xs: 1.5, sm: 3.5, md: 4 },
              py: { xs: 1.5, sm: 3.5 },
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1.2, sm: 2.2 },
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  width: { xs: 42, sm: 62 },
                  height: { xs: 42, sm: 62 },
                  flexShrink: 0,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.16)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  boxShadow: "0 5px 18px rgba(0,0,0,0.12)",
                  "& svg": {
                    fontSize: { xs: 25, sm: 36 },
                  },
                }}
              >
                <AutoAwesomeIcon />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: { xs: 15, sm: 23, md: 26 },
                    fontWeight: 900,
                    letterSpacing: { xs: 0, sm: 0.4 },
                    lineHeight: 1.3,
                  }}
                >
                  CÔNG CỤ HỖ TRỢ GIẢNG DẠY
                </Typography>

                <Typography
                  sx={{
                    mt: { xs: 0.3, sm: 0.7 },
                    fontSize: { xs: 10.5, sm: 13 },
                    color: "rgba(255,255,255,0.82)",
                    lineHeight: 1.5,
                  }}
                >
                  Trợ thủ thông minh cho các hoạt động dạy và học
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* ================= ĐIỀU KHIỂN DESKTOP ================= */}
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              px: { xs: 2, sm: 3.5, md: 4 },
              pb: { xs: 2, sm: 3 },
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            {/* 1. CHỌN TUẦN */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                height: 56,
                boxSizing: "border-box",
                borderRadius: 2.5,
                background: "rgba(255,255,255,0.13)",
                border: "1px solid rgba(255,255,255,0.13)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#bfdbfe",
                  "& svg": { fontSize: 19 },
                }}
              >
                <TimerRoundedIcon />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <TextField
                  select
                  variant="standard"
                  value={week}
                  onChange={handleWeekChange}
                  SelectProps={{ displayEmpty: true }}
                  InputProps={{ disableUnderline: true }}
                  sx={{
                    minWidth: 85,
                    "& .MuiInputBase-root": {
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 900,
                      lineHeight: 1.2,
                    },
                    "& .MuiSelect-select": {
                      py: 0,
                      pr: "20px !important",
                    },
                    "& .MuiSelect-icon": {
                      color: "#bfdbfe",
                      fontSize: 18,
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Chọn tuần</em>
                  </MenuItem>

                  {Array.from({ length: 35 }, (_, index) => index + 1).map(
                    (item) => (
                      <MenuItem key={item} value={item}>
                        Tuần {item}
                      </MenuItem>
                    )
                  )}
                </TextField>

                <Typography
                  sx={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.72)",
                    lineHeight: 1.2,
                  }}
                >
                  Tuần học
                </Typography>
              </Box>
            </Box>

            {/* 2. CHỌN LỚP */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                height: 56,
                boxSizing: "border-box",
                borderRadius: 2.5,
                background: "rgba(255,255,255,0.13)",
                border: "1px solid rgba(255,255,255,0.13)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#bfdbfe",
                  "& svg": { fontSize: 19 },
                }}
              >
                <SchoolRoundedIcon />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <TextField
                  select
                  variant="standard"
                  value={selectedClass}
                  onChange={(event) => setSelectedClass(event.target.value)}
                  InputProps={{ disableUnderline: true }}
                  sx={{
                    minWidth: 75,
                    "& .MuiInputBase-root": {
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 900,
                      lineHeight: 1.2,
                    },
                    "& .MuiSelect-select": {
                      py: 0,
                      pr: "20px !important",
                    },
                    "& .MuiSelect-icon": {
                      color: "#bfdbfe",
                      fontSize: 18,
                    },
                  }}
                >
                  {registeredClasses.map((className) => (
                    <MenuItem key={className} value={className}>
                      Lớp {className}
                    </MenuItem>
                  ))}
                </TextField>

                <Typography
                  sx={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.72)",
                    lineHeight: 1.2,
                  }}
                >
                  Lớp học
                </Typography>
              </Box>
            </Box>

            {/* 3. CHỌN MÔN HỌC */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                px: 1,
                height: 56,
                boxSizing: "border-box",
                borderRadius: 2.5,
                background: "rgba(255,255,255,0.13)",
                border: "1px solid rgba(255,255,255,0.13)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#bfdbfe",
                  flexShrink: 0,
                  "& svg": { fontSize: 19 },
                }}
              >
                <SchoolRoundedIcon />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  minWidth: 0,
                }}
              >
                <TextField
                  select
                  variant="standard"
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  disabled={loadingSubject}
                  SelectProps={{ displayEmpty: true }}
                  InputProps={{ disableUnderline: true }}
                  sx={{
                    width: "max-content",
                    minWidth: 60,
                    maxWidth: 190,

                    "& .MuiInputBase-root": {
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 900,
                      lineHeight: 1.2,
                    },

                    "& .MuiSelect-select": {
                      py: 0,
                      pr: "24px !important",
                      whiteSpace: "nowrap",
                    },

                    "& .MuiSelect-icon": {
                      color: "#bfdbfe",
                      fontSize: 18,
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Chọn môn học</em>
                  </MenuItem>

                  {SUBJECT_OPTIONS.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>

                <Typography
                  sx={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.72)",
                    lineHeight: 1.2,
                  }}
                >
                  Môn học
                </Typography>
              </Box>
            </Box>

            {/* 4. TẢI DANH SÁCH */}
            <Button
              component="label"
              variant="contained"
              size="small"
              disabled={
                accountStatus !== "active" ||
                !selectedClass ||
                uploadingExcel
              }
              startIcon={
                uploadingExcel ? (
                  <CircularProgress size={19} color="inherit" />
                ) : (
                  <CloudUploadRoundedIcon />
                )
              }
              sx={{
                alignSelf: "center",
                height: 56,
                minHeight: 56,
                boxSizing: "border-box",
                px: 1.5,
                borderRadius: 2.5,
                fontSize: 14,
                fontWeight: 800,
                textTransform: "none",
                color: "#fff",
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.25)",
                boxShadow: "none",
                "& .MuiButton-startIcon": {
                  marginRight: 1,
                  "& svg": { fontSize: 19 },
                },
                "&:hover": {
                  background: "rgba(255,255,255,0.3)",
                  boxShadow: "none",
                },
              }}
            >
              {uploadingExcel ? "Đang tải..." : "Tải danh sách"}

              <input
                hidden
                type="file"
                accept=".xlsx,.xls"
                onChange={handleUploadStudentExcel}
              />
            </Button>

            {/* 5. TÀI KHOẢN */}
            {currentUser.username?.trim().toLowerCase() === "thaipv" && (
              <Button
                variant="contained"
                size="small"
                startIcon={<PeopleAltRoundedIcon />}
                onClick={() => setOpenAccountsDialog(true)}
                sx={{
                  alignSelf: "center",
                  height: 56,
                  minHeight: 56,
                  boxSizing: "border-box",
                  px: 1.5,
                  borderRadius: 2.5,
                  fontSize: 14,
                  fontWeight: 800,
                  textTransform: "none",
                  color: "#fff",
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  boxShadow: "none",
                  "& .MuiButton-startIcon": {
                    marginRight: 1,
                    "& svg": { fontSize: 19 },
                  },
                  "&:hover": {
                    background: "rgba(255,255,255,0.3)",
                    boxShadow: "none",
                  },
                }}
              >
                Tài khoản
              </Button>
            )}
          </Box>

          {/* ================= ĐIỀU KHIỂN MOBILE ================= */}
          <Box
            sx={{
              display: { xs: "flex", sm: "none" },
              position: "relative",
              zIndex: 1,
              alignItems: "center",
              gap: 0.7,
              px: 1.2,
              pb: 1.3,
            }}
          >
            {/* TUẦN */}
            <TextField
              select
              size="small"
              value={week}
              onChange={handleWeekChange}
              sx={{
                flex: 1,
                minWidth: 0,
                "& .MuiOutlinedInput-root": {
                  height: 36,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  bgcolor: "rgba(255,255,255,0.14)",
                  borderRadius: 2,
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                },
                "& .MuiSelect-icon": { color: "#fff" },
              }}
            >
              <MenuItem value="">Tuần</MenuItem>
              {Array.from({ length: 35 }, (_, i) => i + 1).map((item) => (
                <MenuItem key={item} value={item}>
                  Tuần {item}
                </MenuItem>
              ))}
            </TextField>

            {/* LỚP */}
            <TextField
              select
              size="small"
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
              sx={{
                flex: 1,
                minWidth: 0,
                "& .MuiOutlinedInput-root": {
                  height: 36,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  bgcolor: "rgba(255,255,255,0.14)",
                  borderRadius: 2,
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                },
                "& .MuiSelect-icon": { color: "#fff" },
              }}
            >
              {registeredClasses.map((className) => (
                <MenuItem key={className} value={className}>
                  Lớp {className}
                </MenuItem>
              ))}
            </TextField>

            {/* SĨ SỐ */}
            <Box
              sx={{
                height: 36,
                px: 0.8,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 0.4,
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.14)",
                color: "#fff",
              }}
            >
              <GroupsRoundedIcon sx={{ fontSize: 16 }} />
              <Typography fontSize={12} fontWeight={800}>
                {activeStudents.length}
              </Typography>
            </Box>

            {/* TẢI DANH SÁCH */}
            <Tooltip title="Tải danh sách học sinh">
              <span>
                <IconButton
                  component="label"
                  disabled={
                    accountStatus !== "active" ||
                    !selectedClass ||
                    uploadingExcel
                  }
                  sx={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    color: "#fff",
                    bgcolor: "rgba(255,255,255,0.2)",
                    borderRadius: 2,
                  }}
                >
                  {uploadingExcel ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <CloudUploadRoundedIcon fontSize="small" />
                  )}
                  <input
                    hidden
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleUploadStudentExcel}
                  />
                </IconButton>
              </span>
            </Tooltip>

            {/* TÀI KHOẢN */}
            {currentUser.username?.trim().toLowerCase() === "thaipv" && (
              <Tooltip title="Quản lý tài khoản">
                <IconButton
                  onClick={() => setOpenAccountsDialog(true)}
                  sx={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    color: "#fff",
                    bgcolor: "rgba(255,255,255,0.2)",
                    borderRadius: 2,
                  }}
                >
                  <PeopleAltRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* ================= TRẠNG THÁI DỮ LIỆU ================= */}
        {loadingStudents && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2.5,
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            <CircularProgress size={21} />
            <Typography
              sx={{
                fontSize: 13,
                color: "#2563eb",
                fontWeight: 700,
              }}
            >
              Đang tải danh sách học sinh...
            </Typography>
          </Box>
        )}

        {!selectedClass && !loadingStudents && (
          <Box
            sx={{
              mt: 2,
              p: 3,
              textAlign: "center",
              borderRadius: 2.5,
              border: "1px dashed #cbd5e1",
              background: "#f8fafc",
            }}
          >
            <SchoolRoundedIcon
              sx={{ fontSize: 42, color: "#94a3b8", mb: 0.7 }}
            />

            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 800,
                color: "#475569",
              }}
            >
              Chưa có lớp được chọn
            </Typography>

            <Typography
              sx={{ fontSize: 12, color: "#94a3b8", mt: 0.5 }}
            >
              Hãy nhập lớp để bắt đầu sử dụng các công cụ.
            </Typography>
          </Box>
        )}

        {/* ================= DANH SÁCH CÔNG CỤ ================= */}
        {!loadingStudents && (
          <Box sx={{ mt: 2.5 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
                mb: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 16, sm: 18 },
                    fontWeight: 900,
                    color: "#172b4d",
                  }}
                >
                  Khám phá công cụ
                </Typography>

                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#8492a6",
                    mt: 0.3,
                  }}
                >
                  Chọn tiện ích phù hợp với hoạt động trên lớp
                </Typography>
              </Box>

              <Box
                sx={{
                  px: 1.2,
                  py: 0.65,
                  borderRadius: 2,
                  background: "#eef2ff",
                  color: "#4f46e5",
                  fontSize: 11,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                {availableTools}/{totalTools} sẵn sàng
              </Box>
            </Box>

            {toolGroups.map((group, groupIndex) => (
              <Box key={group.title} sx={{ mb: 3.2 }}>
                {/* TIÊU ĐỀ NHÓM */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: group.color,
                      background: `${group.color}13`,
                      fontSize: 16,
                      fontWeight: 900,
                    }}
                  >
                    {String(groupIndex + 1).padStart(2, "0")}
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: "#334155",
                        letterSpacing: 0.35,
                      }}
                    >
                      {group.title}
                    </Typography>

                    <Box
                      sx={{
                        mt: 0.45,
                        height: 2,
                        width: 42,
                        borderRadius: 5,
                        background: group.color,
                      }}
                    />
                  </Box>

                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "#94a3b8",
                      fontWeight: 700,
                    }}
                  >
                    {group.tools.length} công cụ
                  </Typography>
                </Box>

                {/* CÁC THẺ CÔNG CỤ */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: { xs: 1.2, sm: 1.5 },
                    alignItems: "stretch",
                  }}
                >
                  {group.tools.map((tool) => {
                    const disabled =
                      accountStatus !== "active" ||
                      (tool.needStudents &&
                        (!selectedClass ||
                          !activeStudents.length ||
                          (loadingStudents && !uploadedStudents)));

                    return (
                      <Paper
                        key={tool.id}
                        elevation={0}
                        onClick={() => {
                          if (!disabled) {
                            openToolInNewTab(tool.id);
                          }
                        }}
                        sx={{
                          position: "relative",
                          minWidth: 0,
                          minHeight: 112,
                          boxSizing: "border-box",
                          p: { xs: 1.6, sm: 1.9 },
                          display: "flex",
                          alignItems: "center",
                          gap: 1.6,
                          overflow: "hidden",
                          borderRadius: 3,
                          border: "1px solid",
                          borderColor: disabled ? "#e2e8f0" : "#e5eaf2",
                          background: disabled ? "#f8fafc" : "#fff",
                          cursor: disabled ? "not-allowed" : "pointer",
                          opacity: disabled ? 0.55 : 1,
                          transition: "all .22s ease",
                          boxShadow: disabled
                            ? "none"
                            : "0 3px 12px rgba(30,64,110,0.045)",

                          "&::before": {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 3,
                            background: disabled ? "#cbd5e1" : group.color,
                            opacity: disabled ? 0.5 : 0.9,
                          },

                          "&:hover": disabled
                            ? {}
                            : {
                                transform: "translateY(-3px)",
                                borderColor: `${group.color}85`,
                                boxShadow: `0 9px 24px ${group.color}20`,
                                background: `linear-gradient(115deg, #fff, ${group.color}08)`,
                                "& .tool-icon": {
                                  transform: "scale(1.08) rotate(-4deg)",
                                },
                                "& .tool-arrow": {
                                  transform: "translateX(3px)",
                                  opacity: 1,
                                },
                              },

                          "&:active": disabled
                            ? {}
                            : { transform: "scale(0.985)" },
                        }}
                      >
                        {/* ICON */}
                        <Box
                          className="tool-icon"
                          sx={{
                            width: { xs: 50, sm: 56 },
                            height: { xs: 50, sm: 56 },
                            flexShrink: 0,
                            borderRadius: 2.7,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: tool.iconColor,
                            background: tool.iconBg,
                            border: `1px solid ${tool.iconColor}20`,
                            transition: "all .22s ease",
                            "& svg": {
                              fontSize: { xs: 27, sm: 30 },
                            },
                          }}
                        >
                          {tool.icon}
                        </Box>

                        {/* NỘI DUNG */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: { xs: 13.5, sm: 14 },
                              fontWeight: 900,
                              color: disabled ? "#94a3b8" : "#1e293b",
                              lineHeight: 1.4,
                            }}
                          >
                            {tool.title}
                          </Typography>

                          <Typography
                            sx={{
                              fontSize: 11.5,
                              color: disabled ? "#a8b1bf" : "#8492a6",
                              mt: 0.55,
                              lineHeight: 1.5,
                            }}
                          >
                            {tool.description}
                          </Typography>

                          {disabled && (
                            <Typography
                              sx={{
                                fontSize: 10,
                                fontWeight: 700,
                                color:
                                  accountStatus !== "active"
                                    ? "#dc2626"
                                    : "#b45309",
                                mt: 0.6,
                              }}
                            >
                              {accountStatus !== "active"
                                ? accountStatus === "checking"
                                  ? "Đang kiểm tra tài khoản..."
                                  : accountStatus === "error"
                                    ? "Không thể xác minh tài khoản"
                                    : "Tài khoản đã bị vô hiệu hóa"
                                : "Cần chọn lớp có danh sách học sinh"}
                            </Typography>
                          )}
                        </Box>

                        {/* MŨI TÊN */}
                        {!disabled && (
                          <Box
                            className="tool-arrow"
                            sx={{
                              width: 27,
                              height: 27,
                              flexShrink: 0,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: group.color,
                              background: `${group.color}12`,
                              fontSize: 21,
                              lineHeight: 1,
                              opacity: 0.75,
                              transition: "all .2s ease",
                            }}
                          >
                            ›
                          </Box>
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* FOOTER */}
        <Box
          sx={{
            mt: 1,
            pt: 2,
            textAlign: "center",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            CÔNG CỤ HỖ TRỢ GIẢNG DẠY · DẠY HỌC SÁNG TẠO VÀ HIỆU QUẢ
          </Typography>

          <Typography
            sx={{
              mt: 0.7,
              fontSize: 11,
              color: "#94a3b8",
            }}
          >
            © 2026 · Bản quyền thuộc về tác giả
          </Typography>

          <Typography
            component="a"
            href="mailto:thbinhkhanh@gmail.com"
            sx={{
              display: "inline-block",
              mt: 0.4,
              fontSize: 11,
              color: "#2563eb",
              textDecoration: "none",
              fontWeight: 600,
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Liên hệ: thbinhkhanh@gmail.com
          </Typography>
        </Box>
      </Paper>
    </Box>

    <AccountsDialog
      open={openAccountsDialog}
      onClose={() => setOpenAccountsDialog(false)}
    />

    {/* SNACKBAR THÔNG BÁO TẢI DANH SÁCH */}
    <Snackbar
      open={uploadMessage.open}
      autoHideDuration={4000}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      onClose={(event, reason) => {
        if (reason === "clickaway") return;

        setUploadMessage((prev) => ({
          ...prev,
          open: false,
        }));
      }}
    >
      <Alert
        onClose={() =>
          setUploadMessage((prev) => ({
            ...prev,
            open: false,
          }))
        }
        severity={uploadMessage.type}
        variant="filled"
        sx={{
          width: "100%",
          fontWeight: 600,
          borderRadius: 2,
        }}
      >
        {uploadMessage.text}
      </Alert>
    </Snackbar>
  </Box>
);

}
