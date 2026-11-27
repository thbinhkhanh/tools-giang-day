
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

export default function FillBlankQuestionPlayer({
  question,
  answer = [],
  onChange,
  disabled = false,
}) {
  // Danh sách đáp án của từng chỗ trống
  const blankAnswerSets = [
    question.acceptedAnswers || [],
    ...(question.blanks || []).map(
      (blank) => blank.acceptedAnswers || []
    ),
  ];

  // Tách câu hỏi theo dấu [...]
  const parts = String(question.question || "").split(/\[\.\.\.\]/);

  const blankCount = parts.length - 1;

  // Tạo thẻ từ đáp án đúng
  const correctCards = blankAnswerSets
    .slice(0, blankCount)
    .map((answers, index) => ({
      id: `correct-${index}`,
      text: String(
        answers.find((item) => String(item ?? "").trim()) || ""
      ).trim(),
      isCorrect: true,
    }))
    .filter((card) => card.text);

  // Tạo thẻ từ phương án nhiễu
  const distractorCards = (question.distractorWords || [])
    .map((word, index) => ({
      id: `distractor-${index}`,
      text: String(word ?? "").trim(),
      isCorrect: false,
    }))
    .filter((card) => card.text);

  // Gộp thẻ đúng và thẻ nhiễu
  const cards = [...correctCards, ...distractorCards];

  const [placedCards, setPlacedCards] = useState(
    Array(blankCount).fill(null)
  );

  const [selectedCard, setSelectedCard] = useState(null);
  const [draggingCard, setDraggingCard] = useState(null);

  // Khôi phục trạng thái khi nhận câu trả lời từ bên ngoài
  const answerKey = JSON.stringify(answer);
  const cardsKey = JSON.stringify(cards);

  useEffect(() => {
    const userAnswers = Array.isArray(answer)
      ? answer
      : [answer];

    const usedCards = new Set();

    const restored = Array.from(
      { length: blankCount },
      (_, index) => {
        const value = String(userAnswers[index] ?? "").trim();

        if (!value) return null;

        const card = correctCards.find(
          (item) =>
            !usedCards.has(item.id) &&
            item.text.toLowerCase() === value.toLowerCase()
        );

        if (!card) return null;

        usedCards.add(card.id);
        return card.id;
      }
    );

    setPlacedCards(restored);
    setSelectedCard(null);
  }, [answerKey, cardsKey]);

  // Cập nhật câu trả lời cho hệ thống chấm điểm
  const updateAnswer = (nextPlacedCards) => {
    const nextAnswers = Array.from(
      { length: blankAnswerSets.length },
      (_, index) => {
        const cardId = nextPlacedCards[index];

        if (!cardId) return "";

        const card = correctCards.find(
          (item) => item.id === cardId
        );

        return card?.text || "";
      }
    );

    onChange(nextAnswers);
  };

  // Đưa một thẻ vào chỗ trống
  const placeCard = (cardId, blankIndex) => {
    if (disabled) return;

    const next = [...placedCards];

    // Nếu thẻ đang nằm ở chỗ khác thì lấy thẻ ra trước
    const oldIndex = next.indexOf(cardId);

    if (oldIndex !== -1) {
      next[oldIndex] = null;
    }

    // Thay thẻ đang có trong ô đích
    next[blankIndex] = cardId;

    setPlacedCards(next);
    setSelectedCard(null);
    updateAnswer(next);
  };

  // Lấy thẻ ra khỏi chỗ trống
  const removeCard = (blankIndex) => {
    if (disabled) return;

    const next = [...placedCards];
    next[blankIndex] = null;

    setPlacedCards(next);
    setSelectedCard(null);
    updateAnswer(next);
  };

  // Chọn thẻ bằng cách nhấn chuột hoặc chạm
  const handleSelectCard = (cardId) => {
    if (disabled) return;

    setSelectedCard(
      selectedCard === cardId ? null : cardId
    );
  };

  // Nhấn vào ô trống để đặt thẻ đã chọn
  const handleBlankClick = (blankIndex) => {
    if (disabled) return;

    if (selectedCard !== null) {
      placeCard(selectedCard, blankIndex);
      return;
    }

    if (placedCards[blankIndex] !== null) {
      removeCard(blankIndex);
    }
  };

  // Kéo thả bằng chuột
  const handleDragStart = (event, cardId) => {
    if (disabled) return;

    setDraggingCard(cardId);
    event.dataTransfer.setData("text/plain", cardId);
    event.dataTransfer.effectAllowed = "move";
  };

  // Thả thẻ vào chỗ trống
  const handleDropOnBlank = (event, blankIndex) => {
    event.preventDefault();

    if (disabled) return;

    const cardId = event.dataTransfer.getData("text/plain");

    if (cardId) {
      placeCard(cardId, blankIndex);
    }

    setDraggingCard(null);
  };

  // Kéo thẻ trở lại danh sách
  const handleDropOnBank = (event) => {
    event.preventDefault();

    if (disabled) return;

    const cardId = event.dataTransfer.getData("text/plain");

    if (!cardId) return;

    const index = placedCards.indexOf(cardId);

    if (index !== -1) {
      removeCard(index);
    }

    setDraggingCard(null);
  };

  // Làm lại toàn bộ câu hỏi
  const handleReset = () => {
    if (disabled) return;

    const next = Array(blankCount).fill(null);

    setPlacedCards(next);
    setSelectedCard(null);
    setDraggingCard(null);

    onChange(Array(blankAnswerSets.length).fill(""));
  };

  // Những thẻ chưa được sử dụng
  const availableCards = cards.filter(
    (card) => !placedCards.includes(card.id)
  );

  
return (
  <Box sx={{ mt: 2 }}>
    {/* Nội dung câu hỏi và các ô thả */}
    <Typography
      component="div"
      fontWeight={600}
      lineHeight={2.8}
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 0.5,
        fontSize: 16,
        color: "#1e293b",
      }}
    >
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          <Box
            component="span"
            sx={{ whiteSpace: "pre-wrap" }}
          >
            {part}
          </Box>

          {index < blankCount && (
            <Box
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) =>
                handleDropOnBlank(event, index)
              }
              onClick={() => handleBlankClick(index)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 125,
                minHeight: 38,
                px: 1.5,
                mx: 0.5,
                border: "2px dashed",
                borderColor:
                  placedCards[index] !== null
                    ? "#16a34a"
                    : selectedCard !== null
                      ? "#2563eb"
                      : "#94a3b8",
                borderRadius: 2,
                bgcolor:
                  placedCards[index] !== null
                    ? "#f0fdf4"
                    : selectedCard !== null
                      ? "#eff6ff"
                      : "#f8fafc",
                color:
                  placedCards[index] !== null
                    ? "#15803d"
                    : "#94a3b8",
                fontWeight: 700,
                fontSize: 14,
                cursor: disabled ? "default" : "pointer",
                userSelect: "none",
                transition: "all 0.2s",
              }}
            >
              {placedCards[index] !== null
                ? cards.find(
                    (card) => card.id === placedCards[index]
                  )?.text
                : "Thả từ vào đây"}
            </Box>
          )}
        </React.Fragment>
      ))}
    </Typography>

    {/* Khu vực thẻ từ */}
    <Paper
      variant="outlined"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDropOnBank}
      sx={{
        mt: 1,
        mb: 1,
        p: 1,
        borderRadius: 2,
        bgcolor: "#f8fafc",
        borderColor: "#cbd5e1",
      }}
    >
      {/* Tiêu đề và nút làm lại cùng hàng */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 0.75,
        }}
      >
        <Typography
          fontWeight={800}
          fontSize={12}
          color="text.secondary"
        >
          KÉO THẺ TỪ VÀO CHỖ TRỐNG
        </Typography>

        <Button
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<RestartAltIcon />}
          onClick={handleReset}
          disabled={
            disabled ||
            placedCards.every((item) => item === null)
          }
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            py: 0.3,
            flexShrink: 0,
          }}
        >
          Làm lại
        </Button>
      </Box>

      {/* Danh sách thẻ từ */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.75,
          minHeight: 30,
          alignItems: "center",
        }}
      >
        {availableCards.length > 0 ? (
          availableCards.map((card) => (
            <Paper
              key={card.id}
              elevation={0}
              draggable={!disabled}
              onDragStart={(event) =>
                handleDragStart(event, card.id)
              }
              onDragEnd={() => setDraggingCard(null)}
              onClick={() => handleSelectCard(card.id)}
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor:
                  selectedCard === card.id
                    ? "#1565c0"
                    : "#90caf9",
                bgcolor:
                  selectedCard === card.id
                    ? "#dbeafe"
                    : "#fff",
                color: "#1565c0",
                fontWeight: 700,
                fontSize: 13,
                cursor: disabled ? "default" : "grab",
                userSelect: "none",
                opacity: draggingCard === card.id ? 0.4 : 1,
                "&:active": {
                  cursor: "grabbing",
                },
              }}
            >
              {card.text}
            </Paper>
          ))
        ) : (
          <Typography
            color="text.secondary"
            fontSize={12}
            fontStyle="italic"
          >
            Đã sử dụng hết thẻ từ
          </Typography>
        )}
      </Box>
    </Paper>
  </Box>
);

}
