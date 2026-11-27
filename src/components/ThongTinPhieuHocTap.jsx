
import React, { useState } from "react";

import {
  Box,
  Stack,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SettingsIcon from "@mui/icons-material/Settings";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";

import TimeLimitDialog from "../dialog/TimeLimitDialog";

function ThongTinPhieuHocTap({
  submitted,
  fullname,
  selectedStudent,
  handleSelectStudent,
  started,
  studentList = [],
  studentClass,
  subject,
  selectedWeek,
  timeLeft,
  formatTime,
  timeLimitMinutes,
  onSaveTimeLimit,
  setOpenSoanDialog,
  getStudentName,
}) {
  const [openTimeDialog, setOpenTimeDialog] = useState(false);

  // KIỂM TRA THỜI GIAN ĐƯỢC TRUYỀN TỪ PHIEUHOCTAP
  const hasTimeLimit =
    timeLimitMinutes !== undefined &&
    timeLimitMinutes !== null &&
    timeLimitMinutes !== "";

  // THẺ THÔNG TIN GỌN
  const infoCardSx = {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 0.8,
    backgroundColor: "#fff",
    border: "1px solid",
    borderRadius: "9px",
    px: 0.9,
    py: 0.5,
    minHeight: 51,
    height: "100%",
  };

  // ICON
  const iconBoxSx = {
    width: 25,
    height: 25,
    borderRadius: "7px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  // NHÃN
  const labelSx = {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    lineHeight: 1.25,
  };

  // GIÁ TRỊ
  const valueSx = {
    fontWeight: 900,
    fontSize: 14,
    lineHeight: 1.3,
  };

  // CỤM NHÃN VÀ GIÁ TRỊ
  const InfoContent = ({ title, value, color }) => (
    <Box
      sx={{
        minWidth: 0,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 0.15,
      }}
    >
      <Typography sx={labelSx} noWrap>
        {title}
      </Typography>

      <Typography
        sx={{
          ...valueSx,
          color,
        }}
        noWrap
      >
        {value || "—"}
      </Typography>
    </Box>
  );

  // COMPONENT Ô THÔNG TIN
  const InfoCard = ({
    title,
    value,
    color,
    borderColor,
    iconBg,
    icon,
    minWidth = 75,
    onClick,
  }) => (
    <Box
      onClick={onClick}
      sx={{
        flex: "0 0 auto",
        minWidth,
        width: "fit-content",
        display: "flex",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <Box
        sx={{
          ...infoCardSx,
          borderColor: borderColor || "#e2e8f0",
          width: "100%",
          transition: "background-color 0.2s",
          ...(onClick && {
            "&:hover": {
              backgroundColor: "#f8fafc",
            },
          }),
        }}
      >
        <Box
          sx={{
            ...iconBoxSx,
            backgroundColor: iconBg,
            color,
          }}
        >
          {React.cloneElement(icon, {
            sx: { fontSize: 19 },
          })}
        </Box>

        <InfoContent
          title={title}
          value={value}
          color={color}
        />
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        backgroundColor: "#f8fafc",
        px: { xs: 1.2, sm: 2 },
        py: 0.8,
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      {/* THÔNG TIN HỌC SINH VÀ PHIẾU */}
      <Box
        sx={{
          width: "100%",
          overflowX: "auto",
          pb: 0.3,
          "&::-webkit-scrollbar": {
            height: 4,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#cbd5e1",
            borderRadius: 10,
          },
        }}
      >
        <Stack
          direction="row"
          spacing={0.7}
          alignItems="stretch"
          sx={{
            width: "max-content",
            minWidth: "100%",
            flexWrap: "nowrap",
          }}
        >
          {/* HỌC SINH */}
          <Box
            sx={{
              flex: "1 1 0%",
              minWidth: 145,
              display: "flex",
            }}
          >
            <Box
              sx={{
                ...infoCardSx,
                flex: 1,
                width: "100%",
                minWidth: 0,
                borderColor: "#bae6fd",
              }}
            >
              <Box
                sx={{
                  ...iconBoxSx,
                  backgroundColor: "#e0f2fe",
                  color: "#0284c7",
                }}
              >
                <PersonIcon sx={{ fontSize: 19 }} />
              </Box>

              <Box
                sx={{
                  minWidth: 0,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 0,
                }}
              >
                <Typography sx={labelSx} noWrap>
                  Học sinh
                </Typography>

                {submitted ? (
                  <Typography
                    sx={{
                      ...valueSx,
                      color: "#0369a1",
                    }}
                    noWrap
                  >
                    {fullname || "Chưa chọn học sinh"}
                  </Typography>
                ) : (
                  <FormControl
                    fullWidth
                    size="small"
                    sx={{ minWidth: 0 }}
                  >
                    <Select
                      value={selectedStudent ?? ""}
                      onChange={handleSelectStudent}
                      displayEmpty
                      disabled={started}
                      sx={{
                        height: 21,
                        minHeight: 21,
                        backgroundColor: "transparent",
                        borderRadius: "5px",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0369a1",
                        "& .MuiSelect-select": {
                          py: 0,
                          px: 0,
                          minHeight: "21px !important",
                          display: "flex",
                          alignItems: "center",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          border: "none",
                        },
                        "& .MuiSelect-icon": {
                          right: 0,
                          fontSize: 19,
                        },
                      }}
                    >
                      <MenuItem value="">
                        <Typography
                          color="text.secondary"
                          fontSize={13}
                        >
                          {studentList.length > 0
                            ? "Chọn học sinh"
                            : "Chưa có danh sách"}
                        </Typography>
                      </MenuItem>

                      {studentList.map((student) => (
                        <MenuItem
                          key={student.id}
                          value={student.id}
                          sx={{ fontSize: 14 }}
                        >
                          {getStudentName?.(student) || student.id}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            </Box>
          </Box>

          {/* LỚP */}
          <InfoCard
            title="Lớp"
            value={studentClass}
            color="#b45309"
            iconBg="#fef3c7"
            borderColor="#fde68a"
            icon={<SchoolIcon />}
            minWidth={125}
          />

          {/* MÔN HỌC */}
          <InfoCard
            title="Môn học"
            value={subject}
            color="#4338ca"
            iconBg="#e0e7ff"
            borderColor="#c7d2fe"
            icon={<MenuBookIcon />}
            minWidth={125}
          />

          {/* TUẦN HỌC */}
          <InfoCard
            title="Tuần học"
            value={selectedWeek ? `Tuần ${selectedWeek}` : "—"}
            color="#1d4ed8"
            iconBg="#dbeafe"
            borderColor="#bfdbfe"
            icon={<CalendarMonthIcon />}
            minWidth={125}
          />

          {/* THỜI GIAN */}
          <InfoCard
            title="Thời gian"
            value={
                started || submitted
                ? formatTime?.(timeLeft) ?? "—"
                : hasTimeLimit
                    ? `${timeLimitMinutes} phút`
                    : "Đang tải..."
            }
            color={
                started
                ? "#dc2626"
                : submitted
                    ? "#64748b"
                    : "#0284c7"
            }
            iconBg={
                started
                ? "#fee2e2"
                : "#e0f2fe"
            }
            borderColor={
                started
                ? "#fecaca"
                : "#bae6fd"
            }
            icon={
                started || submitted
                ? <AccessTimeIcon />
                : <SettingsIcon />
            }
            minWidth={125}
            onClick={
                !started 
                ? () => setOpenTimeDialog(true)
                : undefined
            }
           />

          {/* SOẠN ĐỀ */}
          <InfoCard
            title="Chức năng"
            value="Soạn đề"
            color="#b45309"
            iconBg="#fef3c7"
            borderColor="#fde68a"
            icon={<EditNoteRoundedIcon />}
            minWidth={125}
            onClick={() => setOpenSoanDialog(true)}
          />
        </Stack>
      </Box>

      {/* HỘP THIẾT LẬP THỜI GIAN */}
      <TimeLimitDialog
        open={openTimeDialog}
        onClose={() => setOpenTimeDialog(false)}
        timeLimitMinutes={timeLimitMinutes}
        onSave={onSaveTimeLimit}
      />
    </Box>
  );
}

export default ThongTinPhieuHocTap;
