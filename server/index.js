import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());

// จำกัดขนาดไฟล์ (กันยิงไฟล์ใหญ่เกิน)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB ต่อไฟล์
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function toDataUrl(file) {
  // file.mimetype เช่น image/jpeg, image/png
  const base64 = file.buffer.toString("base64");
  return `data:${file.mimetype};base64,${base64}`;
}

app.post(
  "/api/analyze",
  upload.fields([
    { name: "leftPalm", maxCount: 1 },
    { name: "rightPalm", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { gender, birthMonth, birthYear, topicDetail } = req.body;

      if (!gender || !birthMonth || !birthYear || !topicDetail) {
        return res
          .status(400)
          .json({
            error: "กรอกข้อมูลให้ครบ (เพศ/เดือนปีเกิด/เรื่องที่ต้องการดู)",
          });
      }
      if (!req.files?.leftPalm?.[0] || !req.files?.rightPalm?.[0]) {
        return res
          .status(400)
          .json({ error: "กรุณาอัปโหลดรูปฝ่ามือซ้ายและขวา" });
      }

      const leftUrl = toDataUrl(req.files.leftPalm[0]);
      const rightUrl = toDataUrl(req.files.rightPalm[0]);

      const prompt = `วิเคราะห์เส้นลายมือ โดยใช้ศาสตร์การดูดวง ${gender} ${birthMonth} ${birthYear} ดูพื้นดวง ${topicDetail} ไม่ใช้จิตวิทยา หรือ วิเคราะห์เรื่องทั่วไป เริ่มจากปีปัจจุบัน นับต่อไปอีก 1 ปี ดูจากเส้น อ้างอิง ตามตำราดูดวงเท่านั้น`;

      // เรียก Responses API (ตัวอย่างตามแนวทางเอกสาร migrate/quickstart) :contentReference[oaicite:2]{index=2}
      const response = await openai.responses.create({
        model: "gpt-5", // เปลี่ยนได้ตามสิทธิ์โมเดลที่คุณมี
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: leftUrl },
              { type: "input_image", image_url: rightUrl },
            ],
          },
        ],
      });

      res.json({
        result: response.output_text ?? "(ไม่พบข้อความตอบกลับ)",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "เกิดข้อผิดพลาดตอนวิเคราะห์",
        detail: err?.message || String(err),
      });
    }
  },
);

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3001;
app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`),
);
