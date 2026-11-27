
import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Radio,
  RadioGroup,
  Checkbox,
  FormControlLabel,
  TextField,
  MenuItem,
  Alert,
  Paper,
  Divider,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { createEmptyAnswer } from "../core/questionUtils";

// ====================================================
// THẺ PHƯƠNG ÁN CÓ THỂ KÉO THẢ
// ====================================================

function PreviewSortableOption({
  id,
  index,
  content,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
  });

  return (
    <Paper
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      elevation={isDragging ? 5 : 0}
      sx={{
        minHeight: 48,
        px: 1.5,
        py: 0.8,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.2,

        border: "1.5px solid",
        borderColor: isDragging
          ? "#2563eb"
          : "#dbe3ee",

        bgcolor: isDragging
          ? "#eff6ff"
          : "#fff",

        boxShadow: isDragging
          ? "0 8px 18px rgba(37,99,235,.16)"
          : "0 1px 3px rgba(15,23,42,.05)",

        cursor: "grab",

        transform: CSS.Transform.toString(transform),
        transition,

        touchAction: "none",
        userSelect: "none",

        opacity: isDragging ? 0.85 : 1,
        zIndex: isDragging ? 10 : 1,

        "&:active": {
          cursor: "grabbing",
        },
      }}
    >
      {/* Số thứ tự */}
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.5,
          bgcolor: isDragging
            ? "#2563eb"
            : "#eaf2ff",
          color: isDragging
            ? "#fff"
            : "#2563eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 900,
          flexShrink: 0,
        }}
      >
        {index + 1}
      </Box>

      {/* Nội dung */}
      <Typography
        sx={{
          flex: 1,
          fontSize: 14,
          fontWeight: 600,
          color: "#1e293b",
          lineHeight: 1.5,
          overflowWrap: "anywhere",
        }}
      >
        {content}
      </Typography>

      {/* Biểu tượng kéo thả */}
      <DragIndicatorIcon
        sx={{
          color: isDragging
            ? "#2563eb"
            : "#94a3b8",
          fontSize: 21,
          flexShrink: 0,
        }}
      />
    </Paper>
  );
}

// ====================================================
// QUESTION PREVIEW
// ====================================================

export default function QuestionPreview({
  open,
  question,
  onClose,
}) {
  const [answer, setAnswer] = useState(null);
  const [selectedLeft, setSelectedLeft] = useState(null);

  // ====================================================
  // CẤU HÌNH KÉO THẢ
  // ====================================================

  const previewSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),

    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),

    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ====================================================
  // KHỞI TẠO CÂU TRẢ LỜI
  // ====================================================

  useEffect(() => {
    if (open && question) {
      setAnswer(
        createEmptyAnswer(question.type || "single")
      );

      setSelectedLeft(null);
    }
  }, [open, question]);

  if (!question) return null;

  const options = question.options || [];

  // ====================================================
  // XỬ LÝ KÉO THẢ SẮP XẾP
  // ====================================================

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const currentOrder =
      Array.isArray(answer) &&
      answer.length === options.length &&
      new Set(answer).size === options.length
        ? [...answer]
        : options.map((_, index) => index);

    const oldIndex = currentOrder.indexOf(
      Number(active.id)
    );

    const newIndex = currentOrder.indexOf(
      Number(over.id)
    );

    if (oldIndex < 0 || newIndex < 0) return;

    const nextOrder = arrayMove(
      currentOrder,
      oldIndex,
      newIndex
    );

    setAnswer(nextOrder);
  };

  // ====================================================
  // GHÉP NỐI: CHỌN CỘT TRÁI -> CỘT PHẢI
  // ====================================================

  const handleSelectLeft = (index) => {
    setSelectedLeft((prev) =>
      prev === index ? null : index
    );
  };

  const handleSelectRight = (rightIndex) => {
    if (selectedLeft === null) return;

    const nextAnswer = [...(answer || [])];

    // Bỏ kết nối cũ nếu nội dung bên phải
    // đã được ghép với mục khác.
    nextAnswer.forEach((value, index) => {
      if (value === rightIndex) {
        nextAnswer[index] = null;
      }
    });

    // Ghép nội dung trái với nội dung phải.
    nextAnswer[selectedLeft] = rightIndex;

    setAnswer(nextAnswer);
    setSelectedLeft(null);
  };

  // ====================================================
  // HIỂN THỊ CÂU HỎI
  // ====================================================

  const renderQuestion = () => {
    switch (question.type || "single") {

      // ==================================================
      // TRẮC NGHIỆM MỘT ĐÁP ÁN
      // ==================================================

      case "single":
        return (
          <RadioGroup
            value={
              answer === null
                ? ""
                : String(answer)
            }
            onChange={(e) =>
              setAnswer(Number(e.target.value))
            }
          >
            {options.map((option, index) => (
              <Paper
                key={index}
                variant="outlined"
                sx={{
                  mb: 1,
                  borderRadius: 2,
                }}
              >
                <FormControlLabel
                  value={String(index)}
                  control={<Radio />}
                  label={`${String.fromCharCode(65 + index)}. ${option}`}
                  sx={{
                    mx: 0.5,
                    width: "100%",
                    py: 0.5,
                  }}
                />
              </Paper>
            ))}
          </RadioGroup>
        );

      // ==================================================
      // TRẮC NGHIỆM NHIỀU ĐÁP ÁN
      // ==================================================

      case "multiple":
        return options.map((option, index) => {
          const selected = (answer || []).includes(index);

          return (
            <Paper
              key={index}
              variant="outlined"
              sx={{
                mb: 1,
                borderRadius: 2,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selected}
                    onChange={() =>
                      setAnswer((prev) =>
                        (prev || []).includes(index)
                          ? prev.filter(
                              (i) => i !== index
                            )
                          : [...(prev || []), index]
                      )
                    }
                  />
                }
                label={`${String.fromCharCode(65 + index)}. ${option}`}
                sx={{
                  mx: 0.5,
                  width: "100%",
                  py: 0.5,
                }}
              />
            </Paper>
          );
        });

      // ==================================================
      // ĐÚNG / SAI
      // ==================================================

      case "true_false":
        return (
          <RadioGroup
            value={
              answer === null
                ? ""
                : String(answer)
            }
            onChange={(e) =>
              setAnswer(e.target.value === "true")
            }
          >
            <Paper
              variant="outlined"
              sx={{
                mb: 1,
                borderRadius: 2,
              }}
            >
              <FormControlLabel
                value="true"
                control={<Radio color="success" />}
                label="ĐÚNG"
                sx={{
                  mx: 1,
                  width: "100%",
                }}
              />
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                borderRadius: 2,
              }}
            >
              <FormControlLabel
                value="false"
                control={<Radio color="error" />}
                label="SAI"
                sx={{
                  mx: 1,
                  width: "100%",
                }}
              />
            </Paper>
          </RadioGroup>
        );

      // ==================================================
      // SẮP XẾP KÉO THẢ
      // ==================================================

      case "ordering": {
        const order =
          Array.isArray(answer) &&
          answer.length === options.length &&
          new Set(answer).size === options.length
            ? answer
            : options.map((_, index) => index);

        return (
          <Box>
            <Alert
              severity="info"
              sx={{ mb: 1.5 }}
            >
              Nhấn giữ và kéo thẻ để thay đổi thứ tự.
            </Alert>

            <DndContext
              sensors={previewSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={order.map(String)}
                strategy={verticalListSortingStrategy}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  {order.map((optionIndex, index) => (
                    <PreviewSortableOption
                      key={optionIndex}
                      id={String(optionIndex)}
                      index={index}
                      content={options[optionIndex]}
                    />
                  ))}
                </Box>
              </SortableContext>
            </DndContext>
          </Box>
        );
      }

      // ==================================================
      // ĐIỀN KHUYẾT
      // ==================================================

      case "fill_blank":
        return (
          <TextField
            fullWidth
            label="Câu trả lời của em"
            placeholder="Nhập câu trả lời..."
            value={answer || ""}
            onChange={(e) =>
              setAnswer(e.target.value)
            }
          />
        );

      // ==================================================
      // GHÉP NỐI
      // ==================================================

      case "matching": {
        const pairs = question.pairs || [];

        return (
          <Box>
            <Alert
              severity="info"
              sx={{ mb: 1.5 }}
            >
              Nhấp vào một nội dung ở cột trái, sau đó
              nhấp nội dung tương ứng ở cột phải để ghép nối.
            </Alert>

            <Box
              display="grid"
              gridTemplateColumns="1fr 1fr"
              gap={1.5}
            >
              {/* CỘT TRÁI */}
              <Box>
                <Typography
                  fontSize={13}
                  fontWeight={800}
                  color="#1e40af"
                  textAlign="center"
                  mb={1}
                >
                  CỘT TRÁI
                </Typography>

                {pairs.map((pair, index) => {
                  const selected = selectedLeft === index;
                  const matched = answer?.[index] != null;

                  return (
                    <Paper
                      key={index}
                      variant="outlined"
                      onClick={() =>
                        handleSelectLeft(index)
                      }
                      sx={{
                        p: 0.8,
                        mb: 0.8,
                        minHeight: 42,
                        borderRadius: 2,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",

                        borderColor: selected
                          ? "#2563eb"
                          : matched
                            ? "#16a34a"
                            : "#d1d5db",

                        bgcolor: selected
                          ? "#dbeafe"
                          : matched
                            ? "#f0fdf4"
                            : "#fff",

                        borderWidth: selected ? 2 : 1,
                      }}
                    >
                      <Typography
                        fontSize={13}
                        fontWeight={
                          selected || matched ? 700 : 500
                        }
                      >
                        {String.fromCharCode(65 + index)}.{" "}
                        {pair.left}
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>

              {/* CỘT PHẢI */}
              <Box>
                <Typography
                  fontSize={13}
                  fontWeight={800}
                  color="#1e40af"
                  textAlign="center"
                  mb={1}
                >
                  CỘT PHẢI
                </Typography>

                {pairs.map((pair, index) => {
                  const matchedLeft = (answer || []).findIndex(
                    (value) => value === index
                  );

                  const matched = matchedLeft >= 0;

                  return (
                    <Paper
                      key={index}
                      variant="outlined"
                      onClick={() =>
                        handleSelectRight(index)
                      }
                      sx={{
                        p: 0.8,
                        mb: 0.8,
                        minHeight: 42,
                        borderRadius: 2,

                        cursor:
                          selectedLeft !== null
                            ? "pointer"
                            : "default",

                        display: "flex",
                        alignItems: "center",

                        borderColor: matched
                          ? "#16a34a"
                          : "#d1d5db",

                        bgcolor: matched
                          ? "#f0fdf4"
                          : "#fff",

                        "&:hover": {
                          borderColor:
                            selectedLeft !== null
                              ? "#2563eb"
                              : "#d1d5db",

                          bgcolor:
                            selectedLeft !== null
                              ? "#eff6ff"
                              : "#fff",
                        },
                      }}
                    >
                      <Typography fontSize={13}>
                        {String.fromCharCode(65 + index)}.{" "}
                        {pair.right}
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>
            </Box>

            {selectedLeft !== null && (
              <Typography
                fontSize={12}
                color="primary"
                fontWeight={700}
                textAlign="center"
                mt={1}
              >
                Đang chọn: {pairs[selectedLeft]?.left} –
                Hãy chọn nội dung tương ứng bên phải.
              </Typography>
            )}

            <Typography
              fontSize={12}
              color="text.secondary"
              textAlign="center"
              mt={1}
            >
              Đã ghép:{" "}
              {(answer || []).filter((v) => v != null).length}
              / {pairs.length} cặp
            </Typography>
          </Box>
        );
      }

      default:
        return (
          <Alert severity="warning">
            Dạng câu hỏi chưa được hỗ trợ.
          </Alert>
        );
    }
  };

  // ====================================================
  // GIAO DIỆN CỬA SỔ XEM TRƯỚC
  // ====================================================

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: "#eff6ff",
          color: "#1e40af",
          fontWeight: 900,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        XEM TRƯỚC GIAO DIỆN HỌC SINH

        <Button
          onClick={onClose}
          color="inherit"
          sx={{ minWidth: 36 }}
        >
          <CloseRoundedIcon />
        </Button>
      </DialogTitle>

      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1.5}
        >
          <Typography
            fontWeight={800}
            color="#64748b"
            fontSize={13}
          >
            CÂU HỎI
          </Typography>

          <Typography
            fontSize={12}
            color="primary"
            fontWeight={800}
          >
            BẢN XEM TRƯỚC
          </Typography>
        </Box>

        <Typography
          fontSize={18}
          fontWeight={900}
          color="#172554"
          mb={2.5}
        >
          {question.question || "Chưa nhập nội dung câu hỏi"}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {renderQuestion()}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="outlined"
          onClick={() => {
            setAnswer(
              createEmptyAnswer(question.type)
            );
            setSelectedLeft(null);
          }}
        >
          Làm lại
        </Button>

        <Button
          variant="contained"
          onClick={onClose}
        >
          Đóng xem trước
        </Button>
      </DialogActions>
    </Dialog>
  );
}
