const WORKER_URL = "https://MorLaiMeu.oyaai.workers.dev/api/analyze";
const res = await fetch(WORKER_URL, { method: "POST", body: fd });
