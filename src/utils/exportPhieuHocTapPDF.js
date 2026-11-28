import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

import "../fonts/DejaVuSans-normal.js";
import "../fonts/DejaVuSans-Bold-normal.js";

// ================== TIỆN ÍCH ==================

const PAGE_MARGIN = 12;
const FONT_FAMILY = "DejaVuSans";

const COLORS = {
  orangeBanner: [249, 115, 22], // #f97316
  blueTitle: [29, 78, 216], // #1d4ed8
  textDark: [15, 23, 42], // #0f172a
  textMuted: [71, 85, 105], // #475569
  borderOuter: [203, 213, 225], // #cbd5e1
  borderOption: [209, 213, 219], // #d1d5db
  iconStroke: [148, 163, 184], // #94a3b8
  white: [255, 255, 255],
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const getLineHeightMm = (fontSize) => fontSize * 0.45;

const sanitizeFileName = (str = "") =>
  String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");

const cleanText = (value) => {
  if (value == null) return "";

  let raw =
    typeof value === "string"
      ? value
      : value.text ??
        value.question ??
        value.label ??
        value.title ??
        value.content ??
        value.word ??
        "";

  return String(raw)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .trim();
};

const normalizeQuestionType = (rawType) => {
  const t = String(rawType || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (["single", "radio", "mcq", "choice", "one"].includes(t)) return "single";
  if (["multiple", "multi", "checkbox", "check"].includes(t)) return "multiple";
  if (["sort", "order", "ordering", "arrange", "sequence"].includes(t)) return "sort";
  if (["image", "images", "choose_image", "select_image"].includes(t)) return "image";
  if (["truefalse", "true_false", "tf", "boolean", "yes_no"].includes(t)) return "truefalse";
  if (
    [
      "fillblank",
      "fill_blank",
      "fill_in_blank",
      "cloze",
      "blank",
      "short_answer",
      "text",
      "essay",
    ].includes(t)
  ) {
    return "fillblank";
  }
  if (["matching", "match", "connect", "pair", "pairs"].includes(t)) return "matching";

  return t;
};

const getOptionImage = (option) => {
  if (!option || typeof option === "string") return null;

  if (option.formats?.image?.url) {
    return option.formats.image.url;
  }

  if (typeof option.formats?.image === "string") {
    return option.formats.image;
  }

  return option.image || option.url || null;
};

const loadImageBase64 = async (url) => {
  if (!url) return null;
  if (url.startsWith("data:image/")) return url;

  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) {
    throw new Error(`Không tải được hình ảnh (${response.status})`);
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const getImageDimensions = (base64) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
    image.onerror = reject;
    image.src = base64;
  });

const addImage = async (pdf, url, x, y, maxWidth, maxHeight = 75) => {
  try {
    const base64 = await loadImageBase64(url);
    if (!base64) return 0;

    const dimensions = await getImageDimensions(base64);
    if (!dimensions.width || !dimensions.height) return 0;

    const ratio = Math.min(
      maxWidth / dimensions.width,
      maxHeight / dimensions.height
    );

    const width = dimensions.width * ratio;
    const height = dimensions.height * ratio;

    let imageData = base64;
    let imageType = "JPEG";

    if (base64.startsWith("data:image/png")) {
      imageType = "PNG";
    } else if (base64.startsWith("data:image/webp")) {
      const image = new Image();
      image.src = base64;

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      canvas.getContext("2d").drawImage(image, 0, 0);

      imageData = canvas.toDataURL("image/png");
      imageType = "PNG";
    }

    pdf.addImage(imageData, imageType, x, y, width, height);
    return height;
  } catch (error) {
    console.warn("Không thể xuất hình:", url, error);
    return 0;
  }
};

const isControlElementOnHeader = (el) => {
  if (!el || el.nodeType !== 1) return false;
  if (el.classList?.contains("no-export")) return true;

  const tag = el.tagName?.toLowerCase();
  if (tag === "button") return true;

  const text = (el.textContent || "").trim().toLowerCase();
  const controlLabels = [
    "cấu hình",
    "soạn đề",
    "xuất pdf",
    "x",
    "×",
    "✕",
  ];

  const isSmallBox =
    el.getBoundingClientRect &&
    el.getBoundingClientRect().width < 160 &&
    el.getBoundingClientRect().height < 60;

  if (
    isSmallBox &&
    (controlLabels.includes(text) || /^\d+\s*(phút|giây|min|sec)$/i.test(text))
  ) {
    return true;
  }

  return false;
};

// Icon người dùng cho "Họ và tên" tại (x, centerY)
const drawNameUserIcon = (pdf, x, centerY, size = 4.6) => {
  pdf.saveGraphicsState();
  pdf.setDrawColor(...COLORS.blueTitle);
  pdf.setLineWidth(0.38);

  const headR = size * 0.21;
  const headY = centerY - size * 0.22;
  const cx = x + size * 0.5;

  pdf.circle(cx, headY, headR, "S");

  const bodyBottomY = centerY + size * 0.36;
  const halfSpan = size * 0.36;

  pdf.lines(
    [
      [halfSpan * 0.45, -size * 0.14],
      [halfSpan * 1.1, 0],
      [halfSpan * 0.45, size * 0.14],
    ],
    cx - halfSpan,
    bodyBottomY,
    [1, 1],
    "S",
    false
  );

  pdf.restoreGraphicsState();
};

// Icon phòng học / ngôi nhà cho "Lớp" tại (x, centerY)
const drawClassRoomIcon = (pdf, x, centerY, size = 4.6) => {
  pdf.saveGraphicsState();
  pdf.setDrawColor(...COLORS.orangeBanner);
  pdf.setLineWidth(0.36);

  const cx = x + size * 0.5;
  const roofPeakY = centerY - size * 0.36;
  const wallTopY = centerY - size * 0.04;
  const wallBottomY = centerY + size * 0.34;
  const halfWall = size * 0.36;
  const halfRoof = size * 0.48;

  pdf.lines(
    [
      [halfRoof, roofPeakY - wallTopY],
      [halfRoof, wallTopY - roofPeakY],
    ],
    cx - halfRoof,
    wallTopY,
    [1, 1],
    "S",
    false
  );

  pdf.rect(cx - halfWall, wallTopY, halfWall * 2, wallBottomY - wallTopY, "S");

  const doorW = size * 0.22;
  const doorH = (wallBottomY - wallTopY) * 0.52;
  pdf.rect(cx - doorW / 2, wallBottomY - doorH, doorW, doorH, "S");

  pdf.restoreGraphicsState();
};

// ================== HÀM XUẤT PDF ==================

export const exportPhieuHocTapPDF = async ({
  headerElement,
  questions = [],
  worksheetInfo,
  selectedWeek,
}) => {
  try {
    if (!Array.isArray(questions) || questions.length === 0) {
      alert("Không có câu hỏi để xuất PDF!");
      return;
    }

    const pdf = new jsPDF("p", "mm", "a4");
    const fontList = pdf.getFontList();

    if (!fontList?.[FONT_FAMILY]) {
      console.warn(
        `Font "${FONT_FAMILY}" chưa có trong danh sách font của jsPDF:`,
        fontList
      );
    }

    const hasBoldStyleOnBaseFont = Boolean(
      fontList?.[FONT_FAMILY]?.includes("bold")
    );
    const boldFontAlias = Object.keys(fontList || {}).find((name) =>
      /bold/i.test(name)
    );

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const frameX = PAGE_MARGIN;
    const frameY = PAGE_MARGIN;
    const frameWidth = pageWidth - PAGE_MARGIN * 2;
    const frameBottomLimit = pageHeight - PAGE_MARGIN;

    const innerPadX = 6;
    const contentX = frameX + innerPadX;
    const contentWidth = frameWidth - innerPadX * 2;

    const rawTitle = cleanText(worksheetInfo?.title);
    const bannerTitle =
      !rawTitle || rawTitle.toUpperCase() === "PHIẾU HỌC TẬP"
        ? "BÀI TẬP TRẮC NGHIỆM"
        : rawTitle;
    const weekText = selectedWeek ? `Tuần ${cleanText(selectedWeek)}` : "";

    let frameStartY = frameY;
    let y = frameY;

    const setFontStyle = (
      fontSize = 11,
      bold = false,
      color = COLORS.textDark
    ) => {
      if (bold) {
        if (hasBoldStyleOnBaseFont) {
          pdf.setFont(FONT_FAMILY, "bold");
        } else if (boldFontAlias) {
          pdf.setFont(boldFontAlias, "normal");
        } else {
          pdf.setFont(FONT_FAMILY, "bold");
        }
      } else {
        pdf.setFont(FONT_FAMILY, "normal");
      }

      pdf.setFontSize(fontSize);
      pdf.setTextColor(color[0], color[1], color[2]);
    };

    const drawOuterFrame = (topY, bottomY) => {
      if (bottomY <= topY + 2) return;
      pdf.setDrawColor(...COLORS.borderOuter);
      pdf.setLineWidth(0.35);
      pdf.roundedRect(frameX, topY, frameWidth, bottomY - topY, 3, 3, "S");
    };

    const drawOrangeBanner = (bannerTopY, titleText, weekLabel = "") => {
      const bannerHeight = 13;
      pdf.setFillColor(...COLORS.orangeBanner);
      pdf.roundedRect(frameX, bannerTopY, frameWidth, bannerHeight, 3, 3, "F");
      pdf.rect(frameX, bannerTopY + bannerHeight - 3, frameWidth, 3, "F");

      setFontStyle(12, true, COLORS.white);
      pdf.text(titleText.toUpperCase(), frameX + 6, bannerTopY + 4.2, {
        baseline: "top",
      });

      if (weekLabel) {
        setFontStyle(9.5, true, COLORS.white);
        pdf.text(weekLabel, frameX + frameWidth - 6, bannerTopY + 4.8, {
          align: "right",
          baseline: "top",
        });
      }

      return bannerTopY + bannerHeight + 6;
    };

    const startContinuationPage = () => {
      drawOuterFrame(frameStartY, y + 2);
      pdf.addPage();
      frameStartY = frameY;
      y = drawOrangeBanner(frameStartY, bannerTitle, weekText);
    };

    const checkPage = (neededHeight) => {
      if (y + neededHeight > frameBottomLimit - 3) {
        startContinuationPage();
      }
    };

    const writeText = (value, options = {}) => {
      const {
        x = contentX,
        width = contentWidth,
        fontSize = 11,
        bold = false,
        color = COLORS.textDark,
        gapAfter = 2,
      } = options;

      const text = cleanText(value);
      if (!text) return;

      setFontStyle(fontSize, bold, color);
      const lineHeight = getLineHeightMm(fontSize);
      const lines = pdf.splitTextToSize(text, width);
      const blockHeight = lines.length * lineHeight;

      checkPage(blockHeight + gapAfter);
      setFontStyle(fontSize, bold, color);

      pdf.text(lines, x, y, { baseline: "top" });
      y += blockHeight + gapAfter;
    };

    // ================== TRANG ĐẦU: HÌNH TIÊU ĐỀ -> THÔNG TIN HỌC SINH (NGOÀI KHUNG) -> THANH CAM MỞ KHUNG ==================

    y = frameY;

    if (headerElement) {
      try {
        const canvas = await html2canvas(headerElement, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          ignoreElements: (el) => isControlElementOnHeader(el),
        });

        if (canvas.width > 0 && canvas.height > 20) {
          const headerImage = canvas.toDataURL("image/png");
          const headerWidth = frameWidth;
          const headerHeight = Math.min(
            headerWidth * (canvas.height / canvas.width),
            48
          );

          pdf.addImage(
            headerImage,
            "PNG",
            frameX,
            y,
            headerWidth,
            headerHeight
          );
          y += headerHeight;
        }
      } catch (error) {
        console.warn("Không chụp được hình header:", error);
      }
    }

    // Dòng thông tin học sinh cùng hàng, nằm dưới nhóm tiêu đề nhưng bên ngoài khung bao
    const studentMt = 5.5;
    const studentMb = 7.5;
    const studentFontSize = 13.5;
    const studentLineHeight = getLineHeightMm(studentFontSize);
    const iconSize = 4.6;
    const iconGap = 1.8;

    y += studentMt;

    setFontStyle(studentFontSize, false, COLORS.textDark);

    const nameLabel = `Họ và tên: ${"_".repeat(29)}`;
    const classLabel = `Lớp:${"_".repeat(7)}`;
    const classTextWidth = pdf.getTextWidth(classLabel);
    const rowCenterY = y + studentLineHeight / 2;

    const nameIconX = frameX + 2;
    const nameTextX = nameIconX + iconSize + iconGap;

    const classIconX = frameX + frameWidth - classTextWidth - iconSize - iconGap - 2;
    const classTextX = classIconX + iconSize + iconGap;

    drawNameUserIcon(pdf, nameIconX, rowCenterY, iconSize);
    pdf.text(nameLabel, nameTextX, y, { baseline: "top" });

    drawClassRoomIcon(pdf, classIconX, rowCenterY, iconSize);
    pdf.text(classLabel, classTextX, y, { baseline: "top" });

    y += studentLineHeight + studentMb;

    frameStartY = y;
    y = drawOrangeBanner(frameStartY, bannerTitle, weekText);

    // ================== XUẤT TỪNG CÂU HỎI ==================

    for (let index = 0; index < questions.length; index++) {
      const q = questions[index] || {};
      const qType = normalizeQuestionType(q.type);
      const rawQuestionBody = cleanText(q.question);

      writeText(`Câu ${index + 1}.`, {
        fontSize: 11.5,
        bold: true,
        color: COLORS.blueTitle,
        gapAfter: 1.5,
      });

      if (qType !== "fillblank" && rawQuestionBody) {
        writeText(rawQuestionBody, {
          fontSize: 11,
          bold: true,
          color: COLORS.textDark,
          gapAfter: 3,
        });
      }

      if (q.questionImage) {
        checkPage(35);
        const imageHeight = await addImage(
          pdf,
          q.questionImage,
          contentX + 2,
          y,
          contentWidth - 4,
          75
        );

        if (imageHeight > 0) {
          y += imageHeight + 4;
        }
      }

      const rawOptions = Array.isArray(q.options)
        ? q.options
        : Array.isArray(q.items)
        ? q.items
        : [];

      const order =
        Array.isArray(q.displayOrder) && q.displayOrder.length
          ? q.displayOrder
          : rawOptions.map((_, i) => i);

      // ================== CHỌN MỘT / CHỌN NHIỀU ==================

      if (qType === "single" || qType === "multiple") {
        const isSingle = qType === "single";
        const optFontSize = 10.5;
        const optLineHeight = getLineHeightMm(optFontSize);
        const boxPadX = 3.5;
        const boxPadY = 2.8;
        const boxIconSize = 3.4;
        const boxIconGap = 2.5;
        const textStartX = contentX + boxPadX + boxIconSize + boxIconGap;
        const textMaxWidth =
          contentWidth - (boxPadX + boxIconSize + boxIconGap + boxPadX);

        let letterIdx = 0;

        for (const optionIndex of order) {
          const option = rawOptions[optionIndex];
          if (option == null) continue;

          const text = cleanText(option);
          const imageUrl = getOptionImage(option);
          if (!text && !imageUrl) continue;

          const prefix = `${LETTERS[letterIdx] ?? letterIdx + 1}.`;
          letterIdx += 1;

          const displayLine = text ? `${prefix} ${text}` : prefix;
          setFontStyle(optFontSize, false, COLORS.textDark);
          const lines = pdf.splitTextToSize(displayLine, textMaxWidth);
          const textBlockHeight = lines.length * optLineHeight;
          const boxHeight = Math.max(textBlockHeight + boxPadY * 2, 8.5);

          checkPage(boxHeight + 2.5);

          pdf.setDrawColor(...COLORS.borderOption);
          pdf.setLineWidth(0.3);
          pdf.setFillColor(...COLORS.white);
          pdf.roundedRect(contentX, y, contentWidth, boxHeight, 2.2, 2.2, "FD");

          const iconCenterY = y + boxHeight / 2;
          pdf.setDrawColor(...COLORS.iconStroke);
          pdf.setLineWidth(0.35);

          if (isSingle) {
            pdf.circle(
              contentX + boxPadX + boxIconSize / 2,
              iconCenterY,
              boxIconSize / 2,
              "S"
            );
          } else {
            pdf.rect(
              contentX + boxPadX,
              iconCenterY - boxIconSize / 2,
              boxIconSize,
              boxIconSize,
              "S"
            );
          }

          setFontStyle(optFontSize, false, COLORS.textDark);
          const textTopY =
            lines.length === 1
              ? y + (boxHeight - optLineHeight) / 2
              : y + boxPadY;
          pdf.text(lines, textStartX, textTopY, { baseline: "top" });

          y += boxHeight + 2.2;

          if (imageUrl) {
            checkPage(25);
            const imageHeight = await addImage(
              pdf,
              imageUrl,
              contentX + 8,
              y,
              contentWidth - 16,
              65
            );

            if (imageHeight > 0) {
              y += imageHeight + 3;
            }
          }
        }
      }

      // ================== SẮP XẾP (CÓ Ô NHẬP SỐ BÊN PHẢI, LÙI VÀO TRONG) ==================

      else if (qType === "sort") {
        const sortFontSize = 10.5;
        const sortLineHeight = getLineHeightMm(sortFontSize);
        const inputBoxWidth = 13;
        const inputBoxHeight = 7.5;
        const inputBoxGap = 5;
        const rightIndent = 8;
        const textX = contentX + 3;
        const textWidth =
          contentWidth - 3 - rightIndent - inputBoxWidth - inputBoxGap;
        const inputBoxX =
          contentX + contentWidth - rightIndent - inputBoxWidth;

        let stepNum = 0;
        for (let i = 0; i < order.length; i++) {
          const option = rawOptions[order[i]];
          if (option == null) continue;

          const text = cleanText(option);
          const imageUrl = getOptionImage(option);
          if (!text && !imageUrl) continue;

          stepNum += 1;
          const lineLabel = `${stepNum}.${text ? ` ${text}` : ""}`;
          setFontStyle(sortFontSize, false, COLORS.textDark);
          const lines = pdf.splitTextToSize(lineLabel, textWidth);
          const textHeight = Math.max(lines.length * sortLineHeight, inputBoxHeight);

          checkPage(textHeight + 3);

          setFontStyle(sortFontSize, false, COLORS.textDark);
          const textTopY =
            lines.length === 1
              ? y + (inputBoxHeight - sortLineHeight) / 2
              : y + 1;
          pdf.text(lines, textX, textTopY, { baseline: "top" });

          pdf.setDrawColor(...COLORS.borderOption);
          pdf.setLineWidth(0.35);
          pdf.setFillColor(...COLORS.white);
          pdf.roundedRect(
            inputBoxX,
            y,
            inputBoxWidth,
            inputBoxHeight,
            1.5,
            1.5,
            "FD"
          );

          y += textHeight + 2.8;

          if (imageUrl) {
            checkPage(25);
            const imageHeight = await addImage(
              pdf,
              imageUrl,
              contentX + 8,
              y,
              contentWidth - 16,
              65
            );

            if (imageHeight > 0) {
              y += imageHeight + 3;
            }
          }
        }
      }

      // ================== CHỌN HÌNH ==================

      else if (qType === "image") {
        const validOrder = order.filter((idx) => {
          const opt = rawOptions[idx];
          return opt != null && (cleanText(opt) || getOptionImage(opt));
        });

        const maxPerRow = 3;
        const gap = 4;
        const cellWidth =
          (contentWidth - gap * (maxPerRow - 1)) / maxPerRow;
        const maxCellImgHeight = 35;
        const textFontSize = 9;
        const textLineHeight = getLineHeightMm(textFontSize);

        for (let i = 0; i < validOrder.length; i += maxPerRow) {
          const row = validOrder.slice(i, i + maxPerRow);

          const preparedCells = [];
          let maxTextHeight = 0;

          for (let j = 0; j < row.length; j++) {
            const option = rawOptions[row[j]];
            const optionText = option ? cleanText(option) : "";
            const imageUrl = option ? getOptionImage(option) : null;

            setFontStyle(textFontSize, false, COLORS.textDark);
            const lines = optionText
              ? pdf.splitTextToSize(optionText, cellWidth - 4)
              : [];
            const textHeight = lines.length * textLineHeight;
            maxTextHeight = Math.max(maxTextHeight, textHeight);

            preparedCells.push({
              colIndex: j,
              imageUrl,
              lines,
              textHeight,
            });
          }

          const estimatedRowHeight =
            (preparedCells.some((c) => c.imageUrl) ? maxCellImgHeight + 3 : 0) +
            maxTextHeight;

          checkPage(estimatedRowHeight + 6);

          let actualRowHeight = 0;

          for (const cell of preparedCells) {
            const x = contentX + cell.colIndex * (cellWidth + gap);
            let currentY = y;

            if (cell.imageUrl) {
              const imgH = await addImage(
                pdf,
                cell.imageUrl,
                x + 2,
                currentY,
                cellWidth - 4,
                maxCellImgHeight
              );
              currentY += imgH + 3;
            }

            if (cell.lines.length > 0) {
              setFontStyle(textFontSize, false, COLORS.textDark);
              pdf.text(cell.lines, x + 2, currentY, { baseline: "top" });
              currentY += cell.textHeight;
            }

            actualRowHeight = Math.max(actualRowHeight, currentY - y);
          }

          y += actualRowHeight + 6;
        }
      }

      // ================== ĐÚNG / SAI ==================

      else if (qType === "truefalse") {
        const nonChoiceOptions = rawOptions.filter((opt) => {
          const t = cleanText(opt).toLowerCase();
          return (
            t &&
            t !== "đúng" &&
            t !== "sai" &&
            t !== "true" &&
            t !== "false"
          );
        });

        const statements =
          nonChoiceOptions.length > 0 ? nonChoiceOptions : [null];

        for (const item of statements) {
          const text = item != null ? cleanText(item) : "";
          const imageUrl = item != null ? getOptionImage(item) : null;

          writeText(
            text ? `[ ] Đúng    [ ] Sai    ${text}` : "[ ] Đúng    [ ] Sai",
            {
              x: contentX + 3,
              width: contentWidth - 6,
              fontSize: 10.5,
              gapAfter: imageUrl ? 1.5 : 2,
            }
          );

          if (imageUrl) {
            checkPage(25);
            const imageHeight = await addImage(
              pdf,
              imageUrl,
              contentX + 8,
              y,
              contentWidth - 16,
              65
            );

            if (imageHeight > 0) {
              y += imageHeight + 3;
            }
          }
        }
      }

      // ================== ĐIỀN KHUYẾT (KHỚP FILLBLANKQUESTIONPLAYER) ==================

      else if (qType === "fillblank") {
        const rawQuestionText = String(q.question ?? "");
        const hasTripleBracket = /\[\.\.\.\]/.test(rawQuestionText);
        const parts = hasTripleBracket
          ? rawQuestionText.split(/\[\.\.\.\]/)
          : rawQuestionText.split(/(\[\s*\.{0,4}\s*\]|\(\s*\.{0,4}\s*\)|_{2,})/);

        const blankCount = hasTripleBracket
          ? Math.max(parts.length - 1, 0)
          : parts.filter((p) =>
              /^(\[\s*\.{0,4}\s*\]|\(\s*\.{0,4}\s*\)|_{2,})$/.test(p)
            ).length;

        const blankAnswerSets = [
          Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : [],
          ...(Array.isArray(q.blanks)
            ? q.blanks.map((blank) =>
                Array.isArray(blank?.acceptedAnswers)
                  ? blank.acceptedAnswers
                  : Array.isArray(blank?.answers)
                  ? blank.answers
                  : []
              )
            : []),
        ];

        const targetBlankLen =
          blankCount > 0 ? blankCount : blankAnswerSets.length;

        const correctWords = blankAnswerSets
          .slice(0, targetBlankLen)
          .map((answers) =>
            String(
              (Array.isArray(answers) ? answers : []).find(
                (item) => String(item ?? "").trim() !== ""
              ) || ""
            ).trim()
          )
          .filter(Boolean);

        const distractorWords = (
          Array.isArray(q.distractorWords) ? q.distractorWords : []
        )
          .map((word) => String(word ?? "").trim())
          .filter(Boolean);

        const candidateWords = [...correctWords];
        for (const w of distractorWords) {
          if (!candidateWords.includes(w)) {
            candidateWords.push(w);
          }
        }

        const tokens = [];
        if (hasTripleBracket) {
          parts.forEach((part, idx) => {
            if (part !== "") {
              tokens.push({ kind: "text", text: part });
            }
            if (idx < blankCount) {
              tokens.push({ kind: "blank" });
            }
          });
        } else {
          for (const fp of parts) {
            if (!fp) continue;
            if (/^(\[\s*\.{0,4}\s*\]|\(\s*\.{0,4}\s*\)|_{2,})$/.test(fp)) {
              tokens.push({ kind: "blank" });
            } else {
              tokens.push({ kind: "text", text: fp });
            }
          }
        }

        const fbFontSize = 11;
        const fbLineHeight = getLineHeightMm(fbFontSize);
        const slotWidth = 34;
        const slotHeight = 7.2;
        const rowAdvance = Math.max(fbLineHeight + 2.5, slotHeight + 2.5);

        const builtLines = [];
        let curLine = [];
        let curW = 0;

        for (const tok of tokens) {
          if (tok.kind === "blank") {
            const needed = slotWidth + 1.5;
            if (curLine.length > 0 && curW + needed > contentWidth) {
              builtLines.push(curLine);
              curLine = [{ kind: "blank", width: slotWidth }];
              curW = needed;
            } else {
              curLine.push({ kind: "blank", width: slotWidth });
              curW += needed;
            }
          } else {
            const partsText = tok.text.split(/(\s+)/).filter(Boolean);
            for (const p of partsText) {
              setFontStyle(fbFontSize, true, COLORS.textDark);
              const pw = pdf.getTextWidth(p);
              if (
                curLine.length > 0 &&
                curW + pw > contentWidth &&
                p.trim() !== ""
              ) {
                builtLines.push(curLine);
                const trimmed = p.trimStart();
                curLine = [
                  {
                    kind: "text",
                    text: trimmed,
                    width: pdf.getTextWidth(trimmed),
                  },
                ];
                curW = curLine[0].width;
              } else {
                curLine.push({ kind: "text", text: p, width: pw });
                curW += pw;
              }
            }
          }
        }
        if (curLine.length > 0) builtLines.push(curLine);

        for (const lineTokens of builtLines) {
          checkPage(rowAdvance + 1);
          let cursorX = contentX;
          const slotTopY = y;
          const textBaselineY = y + (slotHeight - fbLineHeight) / 2;

          for (const item of lineTokens) {
            if (item.kind === "blank") {
              pdf.setDrawColor(148, 163, 184);
              pdf.setLineWidth(0.3);
              pdf.setLineDashPattern([1.2, 1.2], 0);
              pdf.setFillColor(...COLORS.white);
              pdf.roundedRect(
                cursorX,
                slotTopY,
                item.width,
                slotHeight,
                1.5,
                1.5,
                "FD"
              );
              pdf.setLineDashPattern([], 0);

              cursorX += item.width + 1.5;
            } else {
              setFontStyle(fbFontSize, true, COLORS.textDark);
              pdf.text(item.text, cursorX, textBaselineY, { baseline: "top" });
              cursorX += item.width;
            }
          }

          y += rowAdvance;
        }

        y += 2;

        if (candidateWords.length > 0) {
          const chipFontSize = 9.5;
          const chipHeight = 7;
          const chipPadX = 3.5;
          const chipGapX = 2.5;
          const chipGapY = 2.5;
          const boxPad = 3.5;
          const headerLabelH = 5.5;
          const chipInnerWidth = contentWidth - boxPad * 2;

          const chipRows = [];
          let cRow = [];
          let cX = 0;

          for (const word of candidateWords) {
            setFontStyle(chipFontSize, true, COLORS.blueTitle);
            const w = Math.max(pdf.getTextWidth(word) + chipPadX * 2, 16);
            if (cRow.length > 0 && cX + w > chipInnerWidth) {
              chipRows.push(cRow);
              cRow = [{ word, w }];
              cX = w + chipGapX;
            } else {
              cRow.push({ word, w });
              cX += w + chipGapX;
            }
          }
          if (cRow.length > 0) chipRows.push(cRow);

          const totalBankHeight =
            boxPad * 2 +
            headerLabelH +
            chipRows.length * (chipHeight + chipGapY) -
            chipGapY;

          checkPage(totalBankHeight + 3);

          pdf.setDrawColor(...COLORS.borderOuter);
          pdf.setLineWidth(0.3);
          pdf.setFillColor(248, 250, 252);
          pdf.roundedRect(
            contentX,
            y,
            contentWidth,
            totalBankHeight,
            2.5,
            2.5,
            "FD"
          );

          setFontStyle(8, true, COLORS.textMuted);
          pdf.text(
            "KÉO THẺ TỪ VÀO CHỖ TRỐNG",
            contentX + boxPad,
            y + boxPad,
            { baseline: "top" }
          );

          let chipY = y + boxPad + headerLabelH;
          for (const row of chipRows) {
            let chipX = contentX + boxPad;
            for (const ch of row) {
              pdf.setDrawColor(147, 197, 253);
              pdf.setLineWidth(0.3);
              pdf.setFillColor(255, 255, 255);
              pdf.roundedRect(
                chipX,
                chipY,
                ch.w,
                chipHeight,
                1.8,
                1.8,
                "FD"
              );

              setFontStyle(chipFontSize, true, COLORS.blueTitle);
              pdf.text(
                ch.word,
                chipX + ch.w / 2,
                chipY + (chipHeight - getLineHeightMm(chipFontSize)) / 2,
                { align: "center", baseline: "top" }
              );

              chipX += ch.w + chipGapX;
            }
            chipY += chipHeight + chipGapY;
          }

          y += totalBankHeight + 3;
        }
      }

      // ================== NỐI / GHÉP ==================

      else if (qType === "matching") {
        const pairs = Array.isArray(q.pairs) ? q.pairs : [];
        const rightOptions = Array.isArray(q.rightOptions)
          ? q.rightOptions
          : Array.isArray(q.rightItems)
          ? q.rightItems
          : [];

        const leftWidth = contentWidth * 0.5;
        const rightWidth = contentWidth - leftWidth;
        const matchFontSize = 10.5;
        const matchLineHeight = getLineHeightMm(matchFontSize);
        const cellPaddingY = 3;

        const rows = Math.max(pairs.length, rightOptions.length);

        for (let i = 0; i < rows; i++) {
          const pair = pairs[i] || {};
          const leftText = cleanText(
            pair.left ?? pair.a ?? pair.colA ?? pair.prompt ?? pair
          );
          const rightText = cleanText(
            rightOptions[i] ??
              pair.right ??
              pair.b ??
              pair.colB ??
              pair.match ??
              pair.answer
          );

          if (!leftText && !rightText) continue;

          setFontStyle(matchFontSize, false, COLORS.textDark);
          const leftLines = pdf.splitTextToSize(
            leftText || " ",
            leftWidth - 6
          );
          const rightLines = pdf.splitTextToSize(
            rightText || " ",
            rightWidth - 6
          );

          const maxLines = Math.max(leftLines.length, rightLines.length, 1);
          const rowHeight = maxLines * matchLineHeight + cellPaddingY * 2;

          checkPage(rowHeight);
          setFontStyle(matchFontSize, false, COLORS.textDark);

          pdf.setDrawColor(...COLORS.borderOption);
          pdf.setLineWidth(0.3);
          pdf.rect(contentX, y, leftWidth, rowHeight);
          pdf.rect(contentX + leftWidth, y, rightWidth, rowHeight);

          pdf.text(leftLines, contentX + 3, y + cellPaddingY, {
            baseline: "top",
          });
          pdf.text(
            rightLines,
            contentX + leftWidth + 3,
            y + cellPaddingY,
            { baseline: "top" }
          );

          y += rowHeight;
        }

        y += 4;
      }

      // ================== DỰ PHÒNG LOẠI KHÁC ==================

      else if (rawOptions.length > 0) {
        for (let i = 0; i < order.length; i++) {
          const option = rawOptions[order[i]];
          if (option == null) continue;
          const text = cleanText(option);
          if (!text) continue;
          writeText(`- ${text}`, {
            x: contentX + 3,
            width: contentWidth - 6,
            fontSize: 10.5,
            gapAfter: 2,
          });
        }
      } else {
        writeText("(Vui lòng xem lại nội dung câu hỏi)", {
          x: contentX + 3,
          fontSize: 10,
          color: COLORS.textMuted,
        });
      }

      y += 4;
    }

    drawOuterFrame(frameStartY, y + 2);

    // ================== LƯU FILE ==================

    const safeWeek = sanitizeFileName(selectedWeek) || "hoc-tap";
    const fileName = `Phieu-hoc-tap-tuan-${safeWeek}.pdf`;

    pdf.save(fileName);
  } catch (error) {
    console.error("Lỗi xuất PDF:", error);
    alert(
      "Không thể xuất PDF. Vui lòng kiểm tra lại dữ liệu câu hỏi và hình ảnh."
    );
  }
};