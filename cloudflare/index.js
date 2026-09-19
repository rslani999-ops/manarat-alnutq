/* ========================================
   منارة النطق - Cloudflare Worker
   v5.0 — R2 Uploader + AI
   ======================================== */

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

var json = __name((d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  }
}), "json");

var corsPreflight = new Response(null, {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  }
});

var index_default = {
  async fetch(r, e) {
    const u = new URL(r.url);
    if (r.method === "OPTIONS") return corsPreflight;

    try {
      /* ============ /api/health ============ */
      if (u.pathname === "/api/health") {
        return json({ ok: true, app: "منارة النطق", version: "5.0", role: "R2 Uploader" });
      }

      /* ============ /api/ai (POST) — النصوص ============ */
      if (u.pathname === "/api/ai" && r.method === "POST") {
        if (!e.AI) return json({ error: "Workers AI غير مفعّل" }, 503);
        const b = await r.json();
        const role = b.role === "student" ? "طفل من 4 إلى 12 سنة" : "معلم تدريبات نطق";
        const p = `أنت مساعد تعليمي للنطق العربي للأطفال 4-12 سنة. لا تقدم تشخيصاً طبياً.
الجمهور: ${role}
الطالب: ${b.studentName || "الطالب"}
الحرف: ${b.letter || ""}
المرحلة: ${b.stage || ""}
النتائج: ${JSON.stringify(b.results || {})}
أعط: ملاحظة أداء، تمريناً قصيراً، ونصيحة. بالعربية.`;
        const x = await e.AI.run("@cf/meta/llama-3.1-8b-instruct", { prompt: p, max_tokens: 500 });
        return json({ ok: true, recommendation: x?.response || x });
      }

      /* ============ /api/r2-upload (POST) — رفع إلى R2 ============ */
      if (u.pathname === "/api/r2-upload" && r.method === "POST") {
        try {
          const body = await r.json();
          const fileName = body.fileName;
          const base64 = body.base64;

          if (!fileName || !base64) {
            return json({ success: false, message: "بيانات ناقصة" }, 400);
          }

          if (!e.IMAGES_BUCKET) {
            return json({ success: false, message: "R2 غير مربوط" }, 503);
          }

          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          await e.IMAGES_BUCKET.put(fileName, bytes, {
            httpMetadata: { contentType: "image/png" }
          });

          return json({ success: true, fileName: fileName });
        } catch (error) {
          return json({ success: false, message: error.message }, 500);
        }
      }

      /* ============ /api/students (GET) — طلاب قديم ============ */
      if (u.pathname === "/api/students" && r.method === "GET") {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/manarat-alnutq/databases/(default)/documents/students`;
        const res = await fetch(firestoreUrl);
        const data = await res.json();
        const students = (data.documents || []).map((doc) => {
          const fields = doc.fields || {};
          const id = doc.name.split("/").pop();
          return {
            id,
            name: fields.name?.stringValue || "",
            createdAt: fields.createdAt?.stringValue || ""
          };
        });
        return json({ success: true, students });
      }

      /* ============ الملفات الثابتة ============ */
      if (e.ASSETS) {
        return await e.ASSETS.fetch(r);
      }

      return json({ status: "منارة النطق - R2 Uploader", version: "5.0" });

    } catch (error) {
      return json({ error: "خطأ عام", detail: String(error?.message || error) }, 500);
    }
  }
};

export { index_default as default };
