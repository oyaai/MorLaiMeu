async function fileToDataURL(file) {
  // จำกัดขนาดไฟล์กันพัง (ปรับได้)
  const MAX_MB = 6;
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`ไฟล์ ${file.name} ใหญ่เกิน ${MAX_MB}MB`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.onload = () => resolve(reader.result); // data:image/...;base64,...
    reader.readAsDataURL(file);
  });
}

function buildPrompt({ gender, birthMonth, birthYear, topic }) {
  // ใช้พรอมป์ “ตามที่คุณให้มา” + เติมค่าตัวแปร
  return `วิเคราะห์เส้นลายมือ โดยใช้ศาสตร์การดูดวง ${gender} ${birthMonth} ${birthYear} ดูพื้นดวง ${topic} ไม่ใช้จิตวิทยา หรือ วิเคราะห์เรื่องทั่วไป เริ่มจากปีปัจจุบัน นับต่อไปอีก 1 ปี ดูจากเส้น อ้างอิง ตามตำราดูดวงเท่านั้น`;
}

const form = document.getElementById("palmForm");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "";
  resultEl.textContent = "";
  submitBtn.disabled = true;

  try {
    const leftFile = document.getElementById("leftPalm").files[0];
    const rightFile = document.getElementById("rightPalm").files[0];

    const gender = document.getElementById("gender").value.trim();
    const birthMonth = document.getElementById("birthMonth").value.trim();
    const birthYear = document.getElementById("birthYear").value.trim();
    const topic = document.getElementById("topic").value.trim();

    const prompt = buildPrompt({ gender, birthMonth, birthYear, topic });

    statusEl.textContent = "กำลังอัปโหลดรูปและขอให้โมเดลวิเคราะห์...";

    const [leftDataUrl, rightDataUrl] = await Promise.all([
      fileToDataURL(leftFile),
      fileToDataURL(rightFile),
    ]);

    const resp = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        images: [
          { name: "left", dataUrl: leftDataUrl },
          { name: "right", dataUrl: rightDataUrl },
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`เรียก API ไม่สำเร็จ (${resp.status}): ${text}`);
    }

    const data = await resp.json();
    statusEl.textContent = "เสร็จแล้ว";
    resultEl.textContent = data.output_text || JSON.stringify(data, null, 2);
  } catch (err) {
    statusEl.textContent = "เกิดข้อผิดพลาด";
    resultEl.textContent = err?.message || String(err);
  } finally {
    submitBtn.disabled = false;
  }
});
