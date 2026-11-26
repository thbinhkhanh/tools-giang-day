
import * as XLSX from "xlsx";
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

// Chuẩn hóa tên cột để dễ đối chiếu
const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// Chuẩn hóa họ tên
const normalizeName = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleUpperCase("vi-VN");

// Nhận diện cột STT
const isSttHeader = (value) => {
  const header = normalizeHeader(value);

  return [
    "stt",
    "sott",
    "sothutu",
    "thutu",
    "thu tu",
    "no",
    "number",
    "ordinal",
    "index",
    "so",
  ].includes(header);
};

// Nhận diện cột Họ và tên
const isNameHeader = (value) => {
  const header = normalizeHeader(value);

  return [
    "hovaten",
    "hoten",
    "tenhocsinh",
    "hotenhocsinh",
    "hovatenhocsinh",
    "hotenhs",
    "tenhs",
    "fullname",
    "studentname",
    "name",
    "ten",
  ].includes(header);
};

// Kiểm tra một dòng có phải dòng tiêu đề không
const findHeaderRow = (matrix) => {
  const maxRows = Math.min(matrix.length, 20);

  for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
    const row = matrix[rowIndex] || [];

    const sttColumn = row.findIndex(isSttHeader);
    const nameColumn = row.findIndex(isNameHeader);

    // Chỉ cần tìm thấy cột Họ tên
    if (nameColumn !== -1) {
      return {
        headerRow: rowIndex,
        sttColumn,
        nameColumn,
      };
    }
  }

  return null;
};

export const uploadStudentExcelToUser = async ({
  file,
  username,
  className,
}) => {
  if (!file) throw new Error("Vui lòng chọn file Excel.");
  if (!username) throw new Error("Không xác định được tài khoản đăng nhập.");
  if (!className) throw new Error("Vui lòng chọn lớp học.");

  const extension = file.name.split(".").pop().toLowerCase();

  if (!["xlsx", "xls"].includes(extension)) {
    throw new Error("Chỉ hỗ trợ file Excel .xlsx hoặc .xls.");
  }

  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, { type: "array" });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("File Excel không có trang tính.");
  }

  const worksheet = workbook.Sheets[sheetName];

  const matrix = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const detected = findHeaderRow(matrix);

  if (!detected) {
    throw new Error(
      "Không tìm thấy cột Họ và tên. Vui lòng kiểm tra tiêu đề Excel."
    );
  }

  const { headerRow, sttColumn, nameColumn } = detected;

  const students = [];

  for (let i = headerRow + 1; i < matrix.length; i++) {
    const row = matrix[i] || [];

    const hoVaTen = normalizeName(row[nameColumn]);

    // Bỏ qua dòng trống
    if (!hoVaTen) continue;

    const rawStt =
      sttColumn !== -1 ? String(row[sttColumn] || "").trim() : "";

    const parsedStt = Number(rawStt);

    students.push({
      maDinhDanh: "",
      hoVaTen,
      stt:
        rawStt !== "" && Number.isFinite(parsedStt) && parsedStt > 0
          ? parsedStt
          : students.length + 1,
    });
  }

  if (!students.length) {
    throw new Error("Không tìm thấy học sinh trong file Excel.");
  }

  // Chuẩn hóa lại STT và tạo mã học sinh duy nhất trong lớp
  students.forEach((student, index) => {
    student.stt = index + 1;
    student.maDinhDanh = `HS_${String(index + 1).padStart(3, "0")}`;
  });

  const classKey = String(className).replace(/\./g, "_");

  const studentsRef = collection(
    db,
    "USERS",
    username,
    "DANHSACH_HOCSINH",
    classKey,
    "HOCSINH"
  );

  const batchSize = 450;

  for (let i = 0; i < students.length; i += batchSize) {
    const batch = writeBatch(db);

    students.slice(i, i + batchSize).forEach((student) => {
      const studentRef = doc(studentsRef, student.maDinhDanh);

      batch.set(
        studentRef,
        {
          ...student,
          lop: className,
          username,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    await batch.commit();
  }

  return {
    username,
    className,
    total: students.length,
    students: students.map((student) => ({
        ...student,
        lop: className,
        username,
    })),
    };
};
