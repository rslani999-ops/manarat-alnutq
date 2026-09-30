/* ========================================
   Manarat Al-Nutq - Cloudflare Worker API
   v5.2 — R2 + AI + Letter Generator
   ======================================== */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /* ============ CORS ============ */
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    const json = (data, status = 200) => new Response(JSON.stringify(data), {
      status: status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });

    try {
      /* ============ /api/health ============ */
      if (url.pathname === "/api/health") {
        return json({
          ok: true,
          app: "منارة النطق",
          version: "5.2",
          role: "R2 Uploader + AI",
          model: "glm-4.7-flash",
          bindings: {
            IMAGES_BUCKET: !!env.IMAGES_BUCKET,
            AI: !!env.AI
          }
        });
      }

      /* ============ /api/ai (POST) ============ */
      if (url.pathname === "/api/ai" && request.method === "POST") {
        if (!env.AI) return json({ error: "Workers AI غير مفعّل" }, 503);
        const body = await request.json();
        const role = body.role === "student" ? "طفل من 4 إلى 12 سنة" : "معلم تدريبات نطق";

        const prompt = `أنت مساعد تعليمي للنطق العربي للأطفال 4-12 سنة.
الجمهور: ${role}
الطالب: ${body.studentName || "الطالب"}
الحرف: ${body.letter || ""}
المرحلة: ${body.stage || ""}
النتائج: ${JSON.stringify(body.results || {})}
أعط: ملاحظة أداء، تمريناً قصيراً، ونصيحة. بالعربية.`;

        const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
          prompt: prompt,
          max_tokens: 500
        });

        return json({ ok: true, recommendation: result?.response || result });
      }

      /* ============ /api/ai-letter (POST) ============ */
      if (url.pathname === "/api/ai-letter" && request.method === "POST") {
        if (!env.AI) return json({ success: false, message: "Workers AI غير مفعّل" }, 503);

        const body = await request.json();
        const letter = body.letter;
        const letterTitle = body.letterTitle || "";

        if (!letter) {
          return json({ success: false, message: "الحرف مطلوب" }, 400);
        }

        const prompt = `أنت خبير في اللغة العربية وتعليم النطق للأطفال.
ولّد بيانات حرف "${letter}" (مثال: ${letterTitle}).

أعد الإجابة بصيغة JSON فقط، بدون أي شرح أو علامات:

{
  "place": "وصف مختصر لمخرج الحرف",
  "vowels": {"fatha": "${letter}َ", "damma": "${letter}ُ", "kasra": "${letter}ِ", "sukoon": "${letter}ْ"},
  "words": {"start": ["كلمة1", "كلمة2", "كلمة3"], "middle": ["كلمة1", "كلمة2", "كلمة3"], "end": ["كلمة1", "كلمة2", "كلمة3"]},
  "sentences": ["جملة 1", "جملة 2", "جملة 3"]
}

الشروط:
- الكلمات بسيطة ومألوفة للأطفال (4-12 سنة)
- كل كلمة تحتوي على الحرف "${letter}" في الموضع الصحيح
- الجمل بسيطة وتحتوي على الحرف "${letter}"
- الإجابة JSON صحيح 100%`;

        const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
          prompt: prompt,
          max_tokens: 800
        });

        let text = result?.response || "";

        text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          text = text.substring(firstBrace, lastBrace + 1);
        }

        try {
          const data = JSON.parse(text);
          return json({ success: true, data: data });
        } catch (e) {
          return json({
            success: false,
            message: "فشل تحليل JSON",
            raw: text.substring(0, 500)
          }, 500);
        }
      }

      /* ============ /api/r2-upload (POST) ============ */
      if (url.pathname === "/api/r2-upload" && request.method === "POST") {
        try {
          const body = await request.json();
          const fileName = body.fileName;
          const base64 = body.base64;

          if (!fileName || !base64) {
            return json({ success: false, message: "بيانات ناقصة" }, 400);
          }
          if (!env.IMAGES_BUCKET) {
            return json({ success: false, message: "R2 غير مربوط" }, 503);
          }

          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          await env.IMAGES_BUCKET.put(fileName, bytes, {
            httpMetadata: { contentType: "image/png" }
          });

          return json({ success: true, fileName: fileName });
        } catch (error) {
          return json({ success: false, message: error.message }, 500);
        }
      }

      /* ============ /api/r2-check (GET) ============ */
      if (url.pathname === "/api/r2-check" && request.method === "GET") {
        const fileName = url.searchParams.get("fileName");
        if (!fileName) return json({ success: false, message: "fileName مطلوب" }, 400);
        if (!env.IMAGES_BUCKET) return json({ success: false, message: "R2 غير مربوط" }, 503);

        try {
          const object = await env.IMAGES_BUCKET.head(fileName);
          if (object) {
            return json({ success: true, exists: true, fileName: fileName, size: object.size });
          }
          return json({ success: true, exists: false, fileName: fileName });
        } catch (error) {
          return json({ success: false, message: error.message }, 500);
        }
      }

      return json({
        status: "منارة النطق - API Worker",
        version: "5.2",
        model: "glm-4.7-flash",
        endpoints: ["/api/health", "/api/ai", "/api/ai-letter", "/api/r2-upload", "/api/r2-check"]
      });

    } catch (error) {
      return json({ error: "خطأ عام", detail: String(error?.message || error) }, 500);
    }
  }
};
