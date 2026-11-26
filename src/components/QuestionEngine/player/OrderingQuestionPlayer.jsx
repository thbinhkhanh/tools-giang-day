
import React, { useEffect, useState } from "react";

import {
  Box,
  Paper,
  Typography,
} from "@mui/material";

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
import { DragIndicator } from "@mui/icons-material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// Thẻ phương án có thể kéo thả
function SortableOption({
  id,
  index,
  content,
  disabled,
  showCorrect,
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
    disabled,
  });

  return (
    <Paper
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      elevation={isDragging ? 5 : 0}
      sx={{
        minHeight: 42,
        px: 1.5,
        py: 0.35,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        gap: 1,

        border: "1.5px solid",
        borderColor: showCorrect
          ? "#16A34A"
          : isDragging
          ? "#2563eb"
          : "#dbe3ee",

        bgcolor: showCorrect
          ? "#F0FDF4"
          : isDragging
          ? "#eff6ff"
          : "#fff",

        boxShadow: isDragging
          ? "0 8px 18px rgba(37,99,235,.16)"
          : "0 1px 3px rgba(15,23,42,.05)",

        cursor: disabled ? "default" : "grab",

        transform: CSS.Transform.toString(transform),
        transition,

        touchAction: "none",
        userSelect: "none",
        opacity: isDragging ? 0.85 : 1,
        zIndex: isDragging ? 10 : 1,
      }}
    >
      {/* Số thứ tự */}
      <Box
        sx={{
          width: 27,
          height: 27,
          borderRadius: 1.5,
          bgcolor: isDragging ? "#2563eb" : "#eaf2ff",
          color: isDragging ? "#fff" : "#2563eb",
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

      {/* Nội dung phương án */}
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
      {!disabled && (
        <DragIndicator
          sx={{
            color: isDragging ? "#2563eb" : "#94a3b8",
            fontSize: 20,
            flexShrink: 0,
          }}
        />
      )}

      {/* Dấu tick khi trả lời đúng */}
      {showCorrect && (
        <CheckCircleIcon
          sx={{
            color: "#16A34A",
            fontSize: 21,
            flexShrink: 0,
            mr: 2,
          }}
        />
      )}
    </Paper>
  );
}

// Component sắp xếp thứ tự
export default function OrderingQuestionPlayer({
  question,
  answer = [],
  onChange,
  disabled = false,
  result = null,
}) {
  const options = question?.options || [];

  // Tạo thứ tự mặc định
  const createDefaultOrder = () =>
    options.map((_, index) => index);

  // Kiểm tra mảng thứ tự hợp lệ
  const isValidOrder = (value) =>
    Array.isArray(value) &&
    value.length === options.length &&
    new Set(value).size === options.length &&
    value.every(
      (item) =>
        Number.isInteger(item) &&
        item >= 0 &&
        item < options.length
    );

  const [order, setOrder] = useState(() =>
    isValidOrder(answer)
      ? answer
      : createDefaultOrder()
  );

  // Đồng bộ thứ tự khi câu hỏi hoặc đáp án thay đổi
  useEffect(() => {
    setOrder(
      isValidOrder(answer)
        ? answer
        : createDefaultOrder()
    );
  }, [question, answer, options.length]);

  // Cấu hình cảm ứng và kéo thả
  const sensors = useSensors(
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

  // Xử lý khi kéo thả hoàn tất
  const handleDragEnd = ({ active, over }) => {
    if (disabled || !over || active.id === over.id) {
      return;
    }

    const oldIndex = order.indexOf(Number(active.id));
    const newIndex = order.indexOf(Number(over.id));

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const nextOrder = arrayMove(
      order,
      oldIndex,
      newIndex
    );

    setOrder(nextOrder);

    if (typeof onChange === "function") {
      onChange(nextOrder);
    }
  };

  if (!question) return null;

  return (
    <Box>
      {/* Nội dung câu hỏi */}
      <Typography
        fontWeight={700}
        mb={1.2}
        mt={1.2}
        fontSize={15}
        lineHeight={1.6}
        color="#1e293b"
      >
        {question.question}
      </Typography>

      {/* Danh sách phương án kéo thả */}
      <DndContext
        sensors={sensors}
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
              <SortableOption
                key={optionIndex}
                id={String(optionIndex)}
                index={index}
                content={options[optionIndex]}
                disabled={disabled}
                showCorrect={result === true}
              />
            ))}
          </Box>
        </SortableContext>
      </DndContext>

      {/* Hướng dẫn kéo thả */}
      <Box
        sx={{
          mb: 1,
          mt: 1,
          px: 1.2,
          py: 0.6,
          borderRadius: 2,
          bgcolor: "#eff6ff",
          border: "1px solid #bfdbfe",
        }}
      >
        <Typography
          fontSize={12}
          fontWeight={600}
          color="#1d4ed8"
        >
          <DragIndicator
            sx={{
              fontSize: 16,
              verticalAlign: "middle",
              mr: 0.5,
            }}
          />
          Nhấn giữ và kéo thẻ để thay đổi thứ tự.
        </Typography>
      </Box>
    </Box>
  );
}
