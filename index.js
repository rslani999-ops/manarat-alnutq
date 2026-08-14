import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// تهيئة خدمة الفايرستور (مرة واحدة)
const db = getFirestore();

// دالة مساعدة لتنسيق استجابة JSON (مرة واحدة)
const json = (d, s = 200) => new Response(JSON.stringify(d), { 
  status: s, 
  headers: { "content-type": "application/json; charset=utf-8" } 
});

export default {
  async fetch(r, e) {
    const u = new URL(r.url);

    try {
      // 1. مسار فحص حالة الخدمة
      if (u.pathname === "/api/health") {
        return json({ ok: true, app: "منارة النطق", version: "1.1" });
      }

      // 2. مسار جلب قائمة الطلاب
      if (u.pathname === "/api/students" && r.method === "GET") {
        const querySnapshot = await getDocs(collection(db, "students"));
        const students = [];
        querySnapshot.forEach((doc) => {
          students.push({ id: doc.id, ...doc.data() });
        });
        return json({ success: true, students });
      }

      // 3. مسار إضافة طالب جديد أو تقييم
      if (u.pathname === "/api/students" && r.method === "POST") {
        const body = await r.json();
        const docRef = await addDoc(collection(db, "students"), {
          name: body.name,
          createdAt: new Date().toISOString()
        });
        return json({ success: true, id: docRef.id });
      }

      // 4. مسار الذكاء الاصطناعي
      if (u.pathname === "/api/ai") {
        if (r.method !== "POST") return json({ error: "استخدم POST" }, 405);
        if (!e.AI) return json({ error: "Workers AI غير مفعّل بعد" }, 503);

        const b = await r.json();
        const role = b.role === "student" ? "طفل من 4 إلى 12 سنة" : "معلم تدريبات نطق";
        const p = `أنت مساعد تعليمي للنطق العربي للأطفال 4-12 سنة. لا تقدم تشخيصا طبيا.
الجمهور: ${role}
الطالب: ${b.studentName || "الطالب"}
الحرف: ${b.letter || ""}
المرحلة: ${b.stage || ""}
النتائج: ${JSON.stringify(b.results || {})}
أعط: ملاحظة أداء، تمرينا قصيرا، ونصيحة مناسبة للجمهور. بالعربية وبأسلوب عملي وآمن.`;

        const x = await e.AI.run("@cf/meta/llama-3.1-8b-instruct", { prompt: p, max_tokens: 500 });
        return json({ ok: true, recommendation: x?.response || x });
      }

      // 5. جلب الملفات الثابتة الخاصة بالموقع
      if (e.ASSETS) {
        return await e.ASSETS.fetch(r);
      }

      return json({ status: "منارة النطق - الخدمة تعمل بنجاح" });

    } catch (error) {
      return json({ error: "تعذر معالجة الطلب", detail: String(error?.message || error) }, 500);
    }
  }
};
