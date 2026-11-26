
import React, { useEffect, useState } from "react";

import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

import { CSS } from "@dnd-kit/utilities";
import {
  DragIndicator,
  Close,
} from "@mui/icons-material";

// Màu sắc cho từng cặp
const PAIR_COLORS = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#9333ea",
  "#0891b2",
  "#db2777",
];

// Xáo trộn danh sách
const shuffleArray = (array) => {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

// Thẻ cột A - vùng nhận kéo thả
function MatchingLeftCard({
  id,
  index,
  content,
  connected,
  selected,
  color,
  onClick,
  onRemove,
  disabled,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled,
    data: { leftIndex: index },
  });

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      onClick={() => !disabled && onClick(index)}
      sx={{
        minHeight: 42,
        px: 1.5,
        py: 0.35,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        gap: 1,
        border: "1.5px solid",
        borderColor:
          isOver || selected
            ? "#2563eb"
            : connected
            ? color
            : "#dbe3ee",
        bgcolor:
          isOver || selected
            ? "#eff6ff"
            : connected
            ? `${color}12`
            : "#fff",
        cursor: disabled ? "default" : "pointer",
        transition: "all .2s",
        boxShadow: selected
          ? "0 0 0 2px rgba(37,99,235,.12)"
          : "none",
      }}
    >
      <Box
        sx={{
          width: 25,
          height: 25,
          borderRadius: 1.2,
          bgcolor: connected ? color : "#eaf2ff",
          color: connected ? "#fff" : "#2563eb",
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

      <Typography
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.5,
          color: "#1e293b",
          overflowWrap: "anywhere",
        }}
      >
        {content}
      </Typography>

      {connected && (
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 800,
            color,
            flexShrink: 0,
          }}
        >
          Đã nối
        </Typography>
      )}

      {connected && !disabled && (
        <Tooltip title="Hủy nối">
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(index);
            }}
            sx={{
              width: 25,
              height: 25,
              flexShrink: 0,
              color: "#dc2626",
              bgcolor: "#fee2e2",
              "&:hover": {
                bgcolor: "#fecaca",
              },
            }}
          >
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}
    </Paper>
  );
}

// Thẻ cột B - có thể kéo thả
function MatchingRightCard({
  id,
  index,
  content,
  connected,
  selected,
  color,
  onClick,
  disabled,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useDraggable({
    id,
    disabled,
    data: { rightIndex: index },
  });

  return (
    <Paper
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      variant="outlined"
      onClick={() => !disabled && onClick(index)}
      sx={{
        minHeight: 42,
        px: 1.5,
        py: 0.35,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        gap: 1,
        border: "1.5px solid",
        borderColor:
          selected
            ? "#2563eb"
            : connected
            ? color
            : "#dbe3ee",
        bgcolor:
          selected
            ? "#eff6ff"
            : connected
            ? `${color}12`
            : "#fff",
        cursor: disabled ? "default" : "grab",
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: "none",
        userSelect: "none",
        opacity: isDragging ? 0.45 : 1,
        boxShadow: isDragging
          ? "0 8px 20px rgba(37,99,235,.18)"
          : "none",
      }}
    >
      <Typography
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.5,
          color: "#1e293b",
          overflowWrap: "anywhere",
        }}
      >
        {content}
      </Typography>

      {!disabled && (
        <DragIndicator
          sx={{
            color: isDragging ? "#2563eb" : "#94a3b8",
            fontSize: 20,
            flexShrink: 0,
          }}
        />
      )}

      {connected && (
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 800,
            color,
            flexShrink: 0,
          }}
        >
          ✓
        </Typography>
      )}
    </Paper>
  );
}

// Component ghép đôi
export default function MatchingQuestionPlayer({
  question,
  answer = [],
  onChange,
  disabled = false,
}) {
  // Lọc các cặp hợp lệ nhưng giữ nguyên chỉ số Firestore
  const pairs = Array.isArray(question?.pairs)
    ? question.pairs
        .map((pair, index) => ({
          ...pair,
          originalIndex: index,
        }))
        .filter(
          (pair) =>
            pair &&
            String(pair.left ?? "").trim() !== "" &&
            String(pair.right ?? "").trim() !== ""
        )
    : [];

  // Đáp án luôn là mảng
  const selectedAnswers = Array.isArray(answer)
    ? answer
    : [];

  // Xáo trộn cột B
  const [rightOrder, setRightOrder] = useState(() =>
    shuffleArray(pairs.map((pair) => pair.originalIndex))
  );

  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);

  // Khi chuyển câu hỏi, xáo trộn lại và bỏ lựa chọn tạm
  useEffect(() => {
    setRightOrder(
      shuffleArray(pairs.map((pair) => pair.originalIndex))
    );

    setSelectedLeft(null);
    setSelectedRight(null);
  }, [question]);

  // Cấu hình kéo thả
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
    })
  );

  // Tạo đáp án mới
  const connectPair = (leftIndex, rightIndex) => {
    if (disabled) return;

    const next = Array.from(
      { length: question.pairs.length },
      (_, index) => selectedAnswers[index] ?? null
    );

    // Xóa kết nối cũ nếu nội dung bên phải đã được sử dụng
    next.forEach((value, index) => {
      if (value === rightIndex && index !== leftIndex) {
        next[index] = null;
      }
    });

    // Gán kết nối mới
    next[leftIndex] = rightIndex;

    onChange?.(next);

    setSelectedLeft(null);
    setSelectedRight(null);
  };

  // Chọn thẻ cột A
  const handleLeftClick = (leftIndex) => {
    if (disabled) return;

    if (selectedRight !== null) {
      connectPair(leftIndex, selectedRight);
      return;
    }

    setSelectedLeft((prev) =>
      prev === leftIndex ? null : leftIndex
    );
  };

  // Chọn thẻ cột B
  const handleRightClick = (rightIndex) => {
    if (disabled) return;

    if (selectedLeft !== null) {
      connectPair(selectedLeft, rightIndex);
      return;
    }

    setSelectedRight((prev) =>
      prev === rightIndex ? null : rightIndex
    );
  };

  // Xử lý kéo thả
  const handleDragEnd = ({ active, over }) => {
    if (!over || disabled) return;

    const rightIndex =
      active.data.current?.rightIndex;

    const leftIndex =
      over.data.current?.leftIndex;

    if (
      Number.isInteger(leftIndex) &&
      Number.isInteger(rightIndex)
    ) {
      connectPair(leftIndex, rightIndex);
    }
  };

  // Hủy kết nối
  const handleRemove = (leftIndex) => {
    if (disabled) return;

    const next = [...selectedAnswers];

    next[leftIndex] = null;

    onChange?.(next);

    setSelectedLeft(null);
    setSelectedRight(null);
  };

  // Đếm số cặp đã ghép
  const connectedCount = pairs.filter(
    (pair) =>
      Number.isInteger(selectedAnswers[pair.originalIndex])
  ).length;

  if (!question) return null;

  return (
    <Box>
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

      {pairs.length > 0 ? (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1,
                alignItems: "start",
              }}
            >
              {/* CỘT A */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  minWidth: 0,
                }}
              >
                <Typography
                  fontSize={14}
                  fontWeight={800}
                  color="#2563eb"
                  textAlign="center"
                  mb={0.3}
                >
                  CỘT A
                </Typography>

                {pairs.map((pair) => {
                  const index = pair.originalIndex;
                  const isConnected =
                    Number.isInteger(selectedAnswers[index]);

                  const color =
                    PAIR_COLORS[
                      pairs.findIndex(
                        (item) => item.originalIndex === index
                      ) % PAIR_COLORS.length
                    ];

                  return (
                    <MatchingLeftCard
                      key={index}
                      id={`left-${index}`}
                      index={index}
                      content={pair.left}
                      connected={isConnected}
                      selected={selectedLeft === index}
                      color={color}
                      onClick={handleLeftClick}
                      onRemove={handleRemove}
                      disabled={disabled}
                    />
                  );
                })}
              </Box>

              {/* CỘT B */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  minWidth: 0,
                }}
              >
                <Typography
                  fontSize={14}
                  fontWeight={800}
                  color="#16a34a"
                  textAlign="center"
                  mb={0.3}
                >
                  CỘT B
                </Typography>

                {rightOrder.map((rightIndex) => {
                  const pair = pairs.find(
                    (item) =>
                      item.originalIndex === rightIndex
                  );

                  if (!pair) return null;

                  const connectedLeft =
                    selectedAnswers.findIndex(
                      (value) => value === rightIndex
                    );

                  const isConnected = connectedLeft !== -1;

                  const color =
                    PAIR_COLORS[
                      pairs.findIndex(
                        (item) =>
                          item.originalIndex === rightIndex
                      ) % PAIR_COLORS.length
                    ];

                  return (
                    <MatchingRightCard
                      key={rightIndex}
                      id={`right-${rightIndex}`}
                      index={rightIndex}
                      content={pair.right}
                      connected={isConnected}
                      selected={selectedRight === rightIndex}
                      color={color}
                      onClick={handleRightClick}
                      disabled={disabled}
                    />
                  );
                })}
              </Box>
            </Box>
          </DndContext>

          {/* Hướng dẫn */}
        <Box
            sx={{
            mb: 1.5,
            mt: 1,
            px: 1.2,
            py: 0.8,
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
            Chọn một thẻ ở cột A rồi chọn thẻ tương ứng ở cột B.
            Có thể kéo thả thẻ ở cột B trên máy tính.
            </Typography>
        </Box>

          {/* Trạng thái ghép đôi */}
          <Box
            sx={{
              mt: 1.5,
              px: 1.2,
              py: 0.8,
              borderRadius: 2,
              bgcolor: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              fontSize={12}
              fontWeight={700}
              color="#475569"
            >
              Đã ghép: {connectedCount}/{pairs.length} cặp
            </Typography>

            <Typography
              fontSize={12}
              fontWeight={700}
              color={
                connectedCount === pairs.length
                  ? "#16a34a"
                  : "#64748b"
              }
            >
              {connectedCount === pairs.length
                ? "Đã hoàn thành"
                : "Tiếp tục ghép"}
            </Typography>
          </Box>
        </>
      ) : (
        <Typography
          color="text.secondary"
          fontSize={13}
          textAlign="center"
          py={2}
        >
          Chưa có nội dung ghép đôi.
        </Typography>
      )}
    </Box>
  );
}
