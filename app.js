const WORKER_URL = "https://MorLaiMeu.oyaai.workers.dev/api/analyze";

const form = document.getElementById("palmForm");
const output = document.getElementById("output");
const btn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  output.textContent = "กำลังส่งข้อมูลไปวิเคราะห์...";
  btn.disabled = true;
  btn.textContent = "กำลังวิเคราะห์...";

  try {
    const fd = new FormData(form);

    //const res = await fetch("http://localhost:3001/api/analyze", {
    const res = await fetch(WORKER_URL, { method: "POST", body: fd });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        data?.error
          ? `${data.error}${data.detail ? " : " + data.detail : ""}`
          : "Request failed",
      );
    }

    output.textContent = data.result || "(ไม่มีข้อความตอบกลับ)";
  } catch (err) {
    output.textContent = `เกิดข้อผิดพลาด: ${err.message}`;
  } finally {
    btn.disabled = false;
    btn.textContent = "วิเคราะห์";
  }
});
