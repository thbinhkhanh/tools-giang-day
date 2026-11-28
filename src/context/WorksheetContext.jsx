
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

// ======================================================
// WORKSHEET CONTEXT
// LƯU ĐỀ LÂU DÀI TRÊN TRÌNH DUYỆT
// ======================================================

export const WorksheetContext = createContext(null);

const STORAGE_KEY = "worksheet_cache_v1";

// ======================================================
// CHUẨN HÓA THÔNG TIN
// ======================================================

const normalizeValue = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const normalizeType = (value) => {
  const type = normalizeValue(value);

  if (
    type === "phiếu học tập" ||
    type === "phieu hoc tap" ||
    type === "phieuhoc"
  ) {
    return "phiếu học tập";
  }

  return type;
};

const createWorksheetKey = ({
  selectedClass,
  subject,
  selectedWeek,
  type,
}) =>
  JSON.stringify([
    normalizeValue(selectedClass),
    normalizeValue(subject),
    normalizeValue(selectedWeek),
    normalizeType(type),
  ]);

// ======================================================
// ĐỌC LOCAL STORAGE
// ======================================================

const loadWorksheets = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      console.log("[WORKSHEET CACHE] Chưa có dữ liệu lưu");
      return {};
    }

    const parsed = JSON.parse(saved);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    console.log(
      "[WORKSHEET CACHE] Khôi phục thành công:",
      Object.keys(parsed).length,
      "đề"
    );

    return parsed;
  } catch (error) {
    console.error("[WORKSHEET CACHE] Lỗi đọc:", error);
    return {};
  }
};

// ======================================================
// LƯU LOCAL STORAGE NGAY LẬP TỨC
// ======================================================

const persistWorksheets = (data) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

    console.log(
      "[WORKSHEET CACHE] Đã lưu:",
      Object.keys(data).length,
      "đề"
    );

    return true;
  } catch (error) {
    console.error(
      "[WORKSHEET CACHE] Không thể lưu:",
      error
    );

    return false;
  }
};

// ======================================================
// PROVIDER
// ======================================================

export function WorksheetProvider({ children }) {
  // Chỉ đọc localStorage một lần khi khởi tạo
  const [worksheets, setWorksheets] = useState(
    () => loadWorksheets()
  );

  // Ref luôn chứa dữ liệu mới nhất
  const worksheetsRef = useRef(worksheets);

  // ----------------------------------------------------
  // LẤY ĐỀ TỪ CACHE
  // ----------------------------------------------------

  const getWorksheet = useCallback(
    ({
      selectedClass,
      subject,
      selectedWeek,
      type = "phiếu học tập",
    }) => {
      const key = createWorksheetKey({
        selectedClass,
        subject,
        selectedWeek,
        type,
      });

      const worksheet = worksheetsRef.current[key] || null;

      console.log(
        worksheet
          ? "[WORKSHEET CACHE] Tìm thấy đề"
          : "[WORKSHEET CACHE] Không tìm thấy đề",
        {
          selectedClass,
          subject,
          selectedWeek,
          type,
        }
      );

      return worksheet;
    },
    []
  );

  // ----------------------------------------------------
  // LƯU ĐỀ
  // ----------------------------------------------------

  const setWorksheet = useCallback(
    ({
      selectedClass,
      subject,
      selectedWeek,
      type = "phiếu học tập",
      worksheetId = "",
      data,
    }) => {
      if (
        !selectedClass ||
        !subject ||
        selectedWeek === undefined ||
        selectedWeek === null ||
        !data
      ) {
        console.warn(
          "[WORKSHEET CACHE] Thiếu thông tin, không thể lưu"
        );
        return false;
      }

      const key = createWorksheetKey({
        selectedClass,
        subject,
        selectedWeek,
        type,
      });

      const worksheet = {
        selectedClass: String(selectedClass).trim(),
        subject: String(subject).trim(),
        selectedWeek: String(selectedWeek).trim(),
        type: normalizeType(type),
        worksheetId,
        data,
        cachedAt: Date.now(),
      };

      const next = {
        ...worksheetsRef.current,
        [key]: worksheet,
      };

      // Cập nhật ref và state
      worksheetsRef.current = next;
      setWorksheets(next);

      // Lưu ngay vào localStorage
      persistWorksheets(next);

      console.log(
        "[WORKSHEET CACHE] Đã lưu đề:",
        worksheet
      );

      return true;
    },
    []
  );

  // ----------------------------------------------------
  // XÓA MỘT ĐỀ
  // ----------------------------------------------------

  const removeWorksheet = useCallback(
    ({
      selectedClass,
      subject,
      selectedWeek,
      type = "phiếu học tập",
    }) => {
      const key = createWorksheetKey({
        selectedClass,
        subject,
        selectedWeek,
        type,
      });

      const next = {
        ...worksheetsRef.current,
      };

      delete next[key];

      worksheetsRef.current = next;
      setWorksheets(next);

      persistWorksheets(next);

      console.log(
        "[WORKSHEET CACHE] Đã xóa đề:",
        key
      );
    },
    []
  );

  // ----------------------------------------------------
  // XÓA TOÀN BỘ CACHE
  // ----------------------------------------------------

  const clearWorksheets = useCallback(() => {
    worksheetsRef.current = {};
    setWorksheets({});

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error(
        "[WORKSHEET CACHE] Lỗi xóa:",
        error
      );
    }

    console.log(
      "[WORKSHEET CACHE] Đã xóa toàn bộ cache"
    );
  }, []);

  // ----------------------------------------------------
  // CONTEXT VALUE
  // ----------------------------------------------------

  const value = useMemo(
    () => ({
      worksheets,
      getWorksheet,
      setWorksheet,
      removeWorksheet,
      clearWorksheets,
    }),
    [
      worksheets,
      getWorksheet,
      setWorksheet,
      removeWorksheet,
      clearWorksheets,
    ]
  );

  return (
    <WorksheetContext.Provider value={value}>
      {children}
    </WorksheetContext.Provider>
  );
}

// ======================================================
// CUSTOM HOOK
// ======================================================

export function useWorksheetContext() {
  const context = useContext(WorksheetContext);

  if (!context) {
    throw new Error(
      "useWorksheetContext phải được sử dụng bên trong WorksheetProvider."
    );
  }

  return context;
}
