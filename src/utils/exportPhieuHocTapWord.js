import html2canvas from "html2canvas";
import { saveAs } from "file-saver";

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  HeadingLevel,
} from "docx";

export const exportPhieuHocTapWord = async ({
  headerElement,
  questions,
  worksheetInfo,
  selectedWeek,
}) => {
  try {
    if (!questions || questions.length === 0) {
      alert("Không có câu hỏi để xuất!");
      return;
    }

    // ==========================================
    // 1. CHỤP PHẦN HEADER KÈM HÌNH NỀN
    // ==========================================
    let headerImage = null;
    let headerWidth = 500;
    let headerHeight = 120;

    if (headerElement) {
      const canvas = await html2canvas(headerElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
      });

      const base64 = canvas.toDataURL("image/png").split(",")[1];

      headerImage = Uint8Array.from(
        atob(base64),
        (char) => char.charCodeAt(0)
      );

      // Giữ đúng tỷ lệ hình ảnh, tránh méo hình
      headerHeight = headerWidth * (canvas.height / canvas.width);
    }

    const children = [];

    // ==========================================
    // 2. THÊM HÌNH HEADER VÀO WORD
    // ==========================================
    if (headerImage) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new ImageRun({
              data: headerImage,
              transformation: {
                width: headerWidth,
                height: headerHeight,
              },
            }),
          ],
        })
      );
    }

    // ==========================================
    // 3. TIÊU ĐỀ PHIẾU HỌC TẬP
    // ==========================================
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: worksheetInfo?.title || "PHIẾU HỌC TẬP",
            bold: true,
            size: 28,
          }),
        ],
      })
    );

    // ==========================================
    // 4. DANH SÁCH CÂU HỎI
    // ==========================================
    questions.forEach((question, index) => {
      children.push(
        new Paragraph({
          spacing: {
            before: 200,
            after: 100,
          },
          children: [
            new TextRun({
              text: `Câu ${index + 1}. `,
              bold: true,
              size: 24,
            }),
          ],
        })
      );
    });

    // ==========================================
    // 5. TẠO FILE WORD KHỔ A4
    // ==========================================
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                width: 11906,
                height: 16838,
              },
              margin: {
                top: 700,
                bottom: 700,
                left: 850,
                right: 850,
              },
            },
          },
          children,
        },
      ],
    });

    // ==========================================
    // 6. TẢI FILE WORD
    // ==========================================
    const blob = await Packer.toBlob(doc);

    saveAs(
      blob,
      `Phieu-hoc-tap-${selectedWeek || "worksheet"}.docx`
    );

  } catch (error) {
    console.error("Lỗi xuất Word:", error);
    alert("Không thể xuất file Word. Vui lòng thử lại!");
  }
};