export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.OPENAI_API_KEY) {
      return new Response("Missing OPENAI_API_KEY", { status: 500 });
    }

    const body = await request.json();
    const prompt = String(body?.prompt || "").trim();
    const images = Array.isArray(body?.images) ? body.images : [];

    if (!prompt) return new Response("prompt is required", { status: 400 });
    if (images.length !== 2)
      return new Response("images must be 2 (left/right)", { status: 400 });

    // dataUrl รูป: "data:image/jpeg;base64,...."
    const left = images.find((x) => x?.name === "left")?.dataUrl;
    const right = images.find((x) => x?.name === "right")?.dataUrl;
    if (!left || !right)
      return new Response("left/right dataUrl missing", { status: 400 });

    // เลือกโมเดลที่รองรับ vision (ตัวอย่าง: gpt-4.1-mini)
    // คุณสามารถเปลี่ยนเป็นโมเดลอื่นที่รองรับภาพได้ตามบัญชี/สิทธิ์ของคุณ
    const payload = {
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: left },
            { type: "input_image", image_url: right },
          ],
        },
      ],
    };

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    if (!r.ok) {
      return new Response(JSON.stringify(data), {
        status: r.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Responses API มักมี output_text ให้หยิบง่าย (แต่กันพลาดด้วย fallback)
    const output_text =
      data?.output_text ??
      data?.output?.[0]?.content
        ?.map((c) => c?.text)
        .filter(Boolean)
        .join("\n") ??
      "";

    return new Response(JSON.stringify({ output_text, raw: data }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(e?.stack || String(e), { status: 500 });
  }
}
