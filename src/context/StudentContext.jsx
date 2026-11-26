
import React, { createContext, useState, useEffect } from "react";

export const StudentContext = createContext();

// Tạo khóa riêng theo tài khoản và lớp
const makeClassKey = (username, className) => {
  const user = String(username || "").trim().toLowerCase();
  const classKey = String(className || "")
    .trim()
    .replace(/\./g, "_");

  return `${user}_${classKey}`;
};

// Đọc dữ liệu an toàn từ localStorage
const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Lỗi đọc ${key}:`, error);
    return fallback;
  }
};

export const StudentProvider = ({ children }) => {
  const [studentData, setStudentData] = useState(() =>
    readStorage("tools_studentData_v1", {})
  );

  const [classData, setClassData] = useState(() =>
    readStorage("tools_classData_v1", {})
  );

  const [uploadedStudents, setUploadedStudents] = useState(() =>
    readStorage("tools_uploadedStudents_v1", {})
  );

  // Lưu dữ liệu sau khi thay đổi
  useEffect(() => {
    localStorage.setItem(
      "tools_studentData_v1",
      JSON.stringify(studentData)
    );
  }, [studentData]);

  useEffect(() => {
    localStorage.setItem(
      "tools_classData_v1",
      JSON.stringify(classData)
    );
  }, [classData]);

  useEffect(() => {
    localStorage.setItem(
      "tools_uploadedStudents_v1",
      JSON.stringify(uploadedStudents)
    );
  }, [uploadedStudents]);

  // Dữ liệu học sinh theo học kỳ, tài khoản và lớp
  const getStudentsForClass = (username, termDoc, className) => {
    const key = makeClassKey(username, className);
    return studentData?.[key]?.[termDoc] || null;
  };

  const setStudentsForClass = (
    username,
    termDoc,
    className,
    students
  ) => {
    const key = makeClassKey(username, className);

    setStudentData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [termDoc]: students,
      },
    }));
  };

  // Lưu danh sách Excel theo tài khoản và lớp
  const setUploadedStudentsForClass = (
    username,
    className,
    students
  ) => {
    const key = makeClassKey(username, className);

    setUploadedStudents((prev) => ({
      ...prev,
      [key]: students,
    }));
  };

  // Lấy danh sách Excel đúng tài khoản và lớp
  const getUploadedStudents = (username, className) => {
    const key = makeClassKey(username, className);
    return uploadedStudents?.[key] || null;
  };

  // Lưu danh sách lớp theo tài khoản
  const setClassesForUser = (username, classes) => {
    const user = String(username || "").trim().toLowerCase();

    setClassData((prev) => ({
      ...prev,
      [user]: classes,
    }));
  };

  const getClassesForUser = (username) => {
    const user = String(username || "").trim().toLowerCase();
    return classData?.[user] || [];
  };

  return (
    <StudentContext.Provider
      value={{
        studentData,
        setStudentData,
        classData,
        setClassData,
        getStudentsForClass,
        setStudentsForClass,
        uploadedStudents,
        setUploadedStudentsForClass,
        getUploadedStudents,
        setClassesForUser,
        getClassesForUser,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};
