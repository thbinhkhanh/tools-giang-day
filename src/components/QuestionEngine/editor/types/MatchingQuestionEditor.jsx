
import React from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Alert,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

export default function MatchingQuestionEditor({ question, onChange }) {
  const pairs = question.pairs || [];

  const updatePair = (index, field, value) => {
    const nextPairs = pairs.map((pair, i) =>
      i === index ? { ...pair, [field]: value } : pair
    );

    onChange({ ...question, pairs: nextPairs });
  };

  const addPair = () => {
    onChange({
      ...question,
      pairs: [...pairs, { left: "", right: "" }],
    });
  };

  const removePair = (index) => {
    if (pairs.length <= 2) return;

    onChange({
      ...question,
      pairs: pairs.filter((_, i) => i !== index),
    });
  };

  return (
    <Box>
      <Typography fontWeight={900} fontSize={14} mb={1}>
        CÁC CẶP NỘI DUNG CẦN NỐI
      </Typography>

      <Typography fontSize={12} color="text.secondary" mb={1.5}>
        Nhập hai nội dung tương ứng. Học sinh sẽ nối vế trái với vế phải.
      </Typography>

      {pairs.map((pair, index) => (
        <Box
          key={index}
          display="grid"
          gridTemplateColumns={{
            xs: "1fr 1fr 38px",
            sm: "1fr 1fr 42px",
          }}
          gap={1}
          alignItems="center"
          mb={1.2}
        >
          <TextField
            size="small"
            label={`Vế trái ${index + 1}`}
            value={pair.left}
            onChange={(e) =>
              updatePair(index, "left", e.target.value)
            }
          />

          <TextField
            size="small"
            label={`Vế phải ${index + 1}`}
            value={pair.right}
            onChange={(e) =>
              updatePair(index, "right", e.target.value)
            }
          />

          <Button
            color="error"
            disabled={pairs.length <= 2}
            onClick={() => removePair(index)}
            sx={{ minWidth: 36, px: 0 }}
          >
            <DeleteOutlineRoundedIcon />
          </Button>
        </Box>
      ))}

      <Button
        variant="outlined"
        startIcon={<AddRoundedIcon />}
        onClick={addPair}
        sx={{ mt: 0.5, borderRadius: 2, fontWeight: 800 }}
      >
        Thêm cặp
      </Button>

      <Alert severity="info" sx={{ mt: 1.5 }}>
        Các cặp được nhập ở đây là đáp án đúng. Khi làm bài, thứ tự vế phải
        sẽ được xáo trộn.
      </Alert>
    </Box>
  );
}
