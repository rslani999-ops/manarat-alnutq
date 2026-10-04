/* ========================================
   منارة النطق - ميزات الذكاء الاصطناعي
   Manarat Al-Nutq - AI Features
   v11.1 — كامل مع كل الميزات + نماذج رسائل موحدة
   ======================================== */

console.log('🚀 Starting ai-features.js v11.1...');

/* ========================================
   🔑 ثوابت
   ======================================== */
const WORKER_BASE = 'https://manarat-api-v3.rslani999.workers.dev';
const VERCEL_API_BASE = 'https://manarat-alnutq.vercel.app';
const R2_PUBLIC_URL = 'https://pub-8f83fb6338db4c5aac3fd512bef2610f.r2.dev';

/* ========================================
   🛠️ دوال مساعدة
   ======================================== */

function safeToast(msg) {
  if (typeof window.showToast === 'function') window.showToast(msg);
  else console.log('TOAST:', msg);
}

function safeRender() {
  if (typeof window.render === 'function') window.render();
}

function getTeacherInfo() {
  const user = window.state?.user || {};
  const role = window.state?.role || 'teacher';
  const fullName = user.displayName || user.fullName || user.email || 'المعلم';
  const schoolName = user.schoolName || '';
  const roleLabel = role === 'admin' ? 'مدير المدرسة' : 'معلم تدريبات النطق';
  return { fullName, schoolName, roleLabel };
}

function getStudentInfo() {
  const st = window.state?.currentStudent || {};
  return {
    fullName: st.fullName || 'الطالب',
    parentName: st.parentName || 'ولي الأمر',
    parentEmail: st.parentEmail || '',
    parentPhone: st.parentPhone || ''
  };
}

function getSessionDetails(sessionData) {
  const sessionTypes = window.SESSION_TYPES || [
    { id: 1, name: 'الحرف مجرداً' },
    { id: 2, name: 'الحرف مع الحركات' },
    { id: 3, name: 'الحرف في كلمات' },
    { id: 4, name: 'الحرف في جمل' }
  ];
  const typeInfo = sessionTypes.find(t => t.id === sessionData.sessionType) || sessionTypes[0];
  const evalLabels = {
    'passed': '✅ اجتاز',
    'trained': '🔄 اجتاز بعد تدريب',
    'need': '⚠️ يحتاج تدريب',
    'unclear': '❌ غير واضح',
    'none': '⏳ قيد التقييم'
  };
  const evalText = evalLabels[sessionData.evaluation] || '⏳ قيد التقييم';

  return {
    student: sessionData.studentName || 'الطالب',
    letter: sessionData.letter || '',
    typeName: typeInfo.name,
    date: sessionData.date || new Date().toISOString().split('T')[0],
    duration: sessionData.duration || '15 دقيقة',
    goal: sessionData.goal || 'تدريب نطق الحرف',
    evaluation: evalText,
    successRate: sessionData.successRate || 0
  };
}

/* ========================================
   📄 بناء الرسالة الموحدة لولي الأمر
   ======================================== */

function buildParentMessage(sessionData, content, contentType) {
  const student = getStudentInfo();
  const teacher = getTeacherInfo();
  const details = getSessionDetails(sessionData);

  const header = `السلام عليكم ولي أمر ${student.fullName}

📋 تقرير جلسة نطق
━━━━━━━━━━━━━━━━━━━━
👤 الطالب: ${details.student}
🔤 الحرف المستهدف: (${details.letter})
📚 نوع الجلسة: ${details.typeName}
📅 التاريخ: ${details.date}
⏱️ المدة: ${details.duration}

🎯 الهدف:
${details.goal}

📊 التقييم: ${details.evaluation}
📈 نسبة النجاح: ${details.successRate}%
`;

  const body = `\n${content}\n`;

  const schoolLine = teacher.schoolName
    ? ` - ${teacher.schoolName}`
    : '';

  const footer = `━━━━━━━━━━━━━━━━━━━━
🌹 نرجو متابعة التدريب المنزلي بانتظام
أ/ ${teacher.fullName} - ${teacher.roleLabel}${schoolLine}`;

  return `${header}${body}${footer}`;
}

/* ========================================
   📖 جلب بيانات الحرف من Firebase
   ======================================== */

async function getLetterData(letter) {
  try {
    const fbDb = window.db;
    const fbDoc = window.doc;
    const fbGetDoc = window.getDoc;

    if (!fbDb || !fbDoc || !fbGetDoc) {
      console.warn('Firebase غير جاهز');
      return null;
    }

    const ref = fbDoc(fbDb, "letters_data", letter);
    const snap = await fbGetDoc(ref);

    if (snap.exists()) {
      console.log(`✅ تم جلب بيانات حرف (${letter})`);
      return snap.data();
    }

    return null;
  } catch (e) {
    console.warn('خطأ في جلب بيانات الحرف:', e);
    return null;
  }
}

async function saveLetterData(letter, data) {
  try {
    const fbDb = window.db;
    const fbDoc = window.doc;
    const fbSetDoc = window.setDoc;

    if (!fbDb || !fbDoc || !fbSetDoc) throw new Error('Firebase غير جاهز');

    await fbSetDoc(fbDoc(fbDb, "letters_data", letter), data);
    return true;
  } catch (e) {
    console.error('خطأ في حفظ بيانات الحرف:', e);
    throw e;
  }
}

/* ========================================
   🖼️ توليد الصور
   ======================================== */

async function generateWordImage(word) {
  if (!word) throw new Error('الكلمة مطلوبة');
  try {
    const response = await fetch(`${VERCEL_API_BASE}/api/ai-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: word })
    });
    if (!response.ok) throw new Error(`فشل الاتصال: ${response.status}`);
    const data = await response.json();
    if (!data.success || !data.image) throw new Error(data.message || 'لم يتم توليد صورة');
    return data.image;
  } catch (error) {
    console.error('❌ خطأ:', error);
    throw error;
  }
}

async function getOrGenerateImage(word) {
  const imageUrl = await generateWordImage(word);
  return { image: imageUrl, fromCache: false };
}

function showImageModal(imageUrl, word) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;';
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:600px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;color:#7C3AED;">🖼️ صورة كلمة: ${word}</h3>
        <button id="closeImageModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>
      <div style="background:#F8FAFC;border-radius:16px;padding:16px;margin-bottom:16px;min-height:300px;display:flex;align-items:center;justify-content:center;">
        <img src="${imageUrl}" alt="${word}" style="max-width:100%;max-height:400px;border-radius:12px;">
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <button id="downloadImageBtn" style="border-radius:50px;padding:10px 24px;background:#7C3AED;color:white;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">💾 تنزيل</button>
        <button id="closeImageModalBtn" style="border-radius:50px;padding:10px 24px;background:#F0F0F0;color:#333;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const closeModal = () => modal.remove();
  modal.querySelector('#closeImageModal').onclick = closeModal;
  modal.querySelector('#closeImageModalBtn').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  modal.querySelector('#downloadImageBtn').onclick = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `image_${word}.png`;
    link.click();
  };
}

function createImageButton(word) {
  const btn = document.createElement('button');
  btn.style.cssText = 'background:linear-gradient(135deg, #7C3AED, #A855F7);color:white;border:none;border-radius:20px;padding:6px 14px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:12px;margin-right:6px;';
  btn.innerHTML = `🖼️ صورة`;
  btn.onclick = async (e) => {
    e.stopPropagation();
    btn.disabled = true;
    btn.style.opacity = '0.6';
    const orig = btn.innerHTML;
    btn.innerHTML = '⏳ جاري التوليد...';
    try {
      const result = await getOrGenerateImage(word);
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = orig;
      showImageModal(result.image, word);
      safeToast(`✅ تم توليد صورة "${word}"`);
    } catch (error) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = orig;
      safeToast(`❌ فشل: ${error.message}`);
    }
  };
  return btn;
}

/* ========================================
   📚 توليد محتوى الحرف
   ======================================== */

async function generateLetterContent(letter, letterTitle) {
  const response = await fetch(`${WORKER_BASE}/api/ai-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ letter: letter, letterTitle: letterTitle })
  });
  if (!response.ok) throw new Error(`فشل الاتصال: ${response.status}`);
  const data = await response.json();
  if (!data.success || !data.data) throw new Error(data.message || 'لم يتم توليد محتوى');
  return data.data;
}

function createGenerateLetterButton(letter, onSuccess) {
  const btn = document.createElement('button');
  btn.id = `generateLetterBtn_${letter}`;
  btn.style.cssText = 'background:linear-gradient(135deg, #A855F7, #7C3AED);color:white;border:none;border-radius:50px;padding:12px 28px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:14px;';
  btn.innerHTML = `📚 توليد محتوى حرف (${letter}) بالذكاء الاصطناعي`;

  btn.onclick = async () => {
    try {
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.innerHTML = '⏳ جاري التوليد (5-10 ثواني)...';

      const letterTitle = window.letterTitleMap?.[letter] || '';
      const data = await generateLetterContent(letter, letterTitle);

      btn.innerHTML = '⏳ جاري الحفظ...';
      await saveLetterData(letter, data);

      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = `✅ تم التوليد — إعادة المحاولة`;
      safeToast(`✅ تم توليد وحفظ محتوى حرف (${letter})`);

      if (typeof onSuccess === 'function') onSuccess(data);
    } catch (error) {
      console.error('❌ فشل:', error);
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = `📚 إعادة محاولة توليد حرف (${letter})`;
      safeToast('❌ فشل: ' + error.message);
    }
  };

  return btn;
}

/* ========================================
   🤖 استدعاء Worker /api/ai
   ======================================== */

async function callAI(prompt, role = 'teacher') {
  try {
    const response = await fetch(`${WORKER_BASE}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt, role: role })
    });
    if (!response.ok) throw new Error(`فشل الاتصال: ${response.status}`);
    const data = await response.json();
    if (!data.ok || !data.recommendation) {
      if (typeof data.recommendation === 'string') return data.recommendation;
      throw new Error('لم يتم استلام رد');
    }
    if (typeof data.recommendation === 'string') return data.recommendation;
    return data.recommendation?.response || data.recommendation?.text || JSON.stringify(data.recommendation);
  } catch (error) {
    console.error('AI Error:', error);
    throw error;
  }
}

/* ========================================
   🤖 التوصيات الذكية
   ======================================== */

async function generateSessionRecommendations(sessionData, studentData) {
  const sessionTypes = window.SESSION_TYPES || [
    { id: 1, name: 'الحرف مجرداً' },
    { id: 2, name: 'الحرف مع الحركات' },
    { id: 3, name: 'الحرف في كلمات' },
    { id: 4, name: 'الحرف في جمل' }
  ];
  const typeInfo = sessionTypes.find(t => t.id === sessionData.sessionType) || sessionTypes[0];

  const prompt = `أنت مساعد تعليمي متخصص في تدريب النطق للأطفال (4-12 سنة).
لا تقدم تشخيصاً طبياً، فقط توصيات تعليمية عملية.

📋 بيانات الجلسة:
- الطالب: ${studentData.fullName || 'الطالب'}
- الحرف المستهدف: ${sessionData.letter}
- نوع الجلسة: ${typeInfo.name}
- الهدف: ${sessionData.goal || 'غير محدد'}
- نسبة النجاح: ${sessionData.successRate || 0}%
- التقييم: ${sessionData.evaluation || 'غير مقيم'}

المطلوب منك بالضبط (بالعربية الفصحى المبسطة، بأسلوب عملي ومشجع):

📊 **تحليل موجز لأداء الطالب** (3 أسطر متصلة)

🎯 **توصيتان لجلسات قادمة**
- التوصية 1: [عنوان]
  [شرح مختصر]
- التوصية 2: [عنوان]
  [شرح مختصر]

🏠 **تمرين منزلي بسيط لولي الأمر**
[خطوات محددة ومختصرة]

⚠️ **تنبيه** (إذا لزم الأمر فقط)

اكتب بأسلوب واضح ومباشر، عملي، مشجع.`;

  return await callAI(prompt, 'teacher');
}

function showAIRecommendationsModal(recommendations, sessionData) {
  const student = getStudentInfo();
  const parentName = student.parentName;
  const parentEmail = student.parentEmail;
  const parentPhone = student.parentPhone;
  const fullMessage = buildParentMessage(sessionData, recommendations, 'recommendations');

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:650px;width:100%;max-height:85vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;color:#7C3AED;">🤖 توصيات الذكاء الاصطناعي</h3>
        <button id="closeAIModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>
      <div style="background:#F3E8FF;padding:16px;border-radius:12px;margin-bottom:16px;border-right:4px solid #7C3AED;">
        <div style="font-size:13px;color:#555;"><strong>📋 جلسة:</strong> حرف (${sessionData.letter})</div>
      </div>
      <div style="font-size:15px;line-height:2;white-space:pre-wrap;background:#FAF5FF;padding:18px;border-radius:12px;max-height:400px;overflow-y:auto;">${fullMessage}</div>

      <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;justify-content:center;">
        <button id="copyAIBtn" style="border-radius:50px;padding:10px 20px;background:#7C3AED;color:white;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">📋 نسخ</button>
        ${parentPhone ? `<button id="sendWhatsappAiBtn" style="border-radius:50px;padding:10px 20px;background:#25D366;color:white;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">📱 واتساب</button>` : ''}
        ${parentEmail ? `<button id="sendEmailAiBtn" style="border-radius:50px;padding:10px 20px;background:#0891B2;color:white;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">📧 إيميل</button>` : ''}
        <button id="closeAIModalBtn" style="border-radius:50px;padding:10px 20px;background:#F0F0F0;color:#333;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const closeModal = () => modal.remove();
  modal.querySelector('#closeAIModal').onclick = closeModal;
  modal.querySelector('#closeAIModalBtn').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };

  modal.querySelector('#copyAIBtn').onclick = () => {
    navigator.clipboard.writeText(fullMessage).then(() => safeToast('✅ تم نسخ التوصيات'));
  };

  const waBtn = modal.querySelector('#sendWhatsappAiBtn');
  if (waBtn) {
    waBtn.onclick = () => {
      let phone = parentPhone.replace(/\D/g, '');
      if (phone.startsWith('0')) phone = '966' + phone.substring(1);
      if (!phone.startsWith('966') && phone.length === 9) phone = '966' + phone;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(fullMessage)}`, '_blank');
    };
  }

  const emailBtn = modal.querySelector('#sendEmailAiBtn');
  if (emailBtn) {
    emailBtn.onclick = () => {
      const subject = encodeURIComponent(`توصيات جلسة - ${student.fullName} - حرف ${sessionData.letter}`);
      window.location.href = `mailto:${parentEmail}?subject=${subject}&body=${encodeURIComponent(fullMessage)}`;
    };
  }
}

function createAIButton(sessionData, studentData) {
  const btn = document.createElement('button');
  btn.style.cssText = 'background:linear-gradient(135deg, #7C3AED, #4F46E5);color:white;border:none;border-radius:50px;padding:10px 24px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:14px;';
  btn.innerHTML = '🤖 توصيات ذكية (AI)';
  btn.onclick = async () => {
    btn.disabled = true;
    btn.innerHTML = '⏳ جاري التحليل...';
    try {
      const recommendations = await generateSessionRecommendations(sessionData, studentData);
      showAIRecommendationsModal(recommendations, sessionData);
      btn.disabled = false;
      btn.innerHTML = '🤖 توصيات ذكية (AI)';
    } catch (error) {
      btn.disabled = false;
      btn.innerHTML = '🤖 توصيات ذكية (AI)';
      safeToast('❌ ' + error.message);
    }
  };
  return btn;
}

/* ========================================
   📝 التمارين المنزلية
   ======================================== */

async function generateHomeworkExercises(sessionData, studentData) {
  const sessionTypes = window.SESSION_TYPES || [
    { id: 1, name: 'الحرف مجرداً' },
    { id: 2, name: 'الحرف مع الحركات' },
    { id: 3, name: 'الحرف في كلمات' },
    { id: 4, name: 'الحرف في جمل' }
  ];
  const typeInfo = sessionTypes.find(t => t.id === sessionData.sessionType) || sessionTypes[0];

  const prompt = `أنت أخصائي نطق تعليمي متخصص في تمارين الأطفال (4-12 سنة).
المطلوب: توليد تمارين منزلية بسيطة وممتعة لولي الأمر.

📋 معلومات:
- الطالب: ${studentData.fullName || 'الطالب'}
- الحرف المستهدف: ${sessionData.letter}
- نوع الجلسة: ${typeInfo.name}
- نسبة النجاح: ${sessionData.successRate || 0}%

اكتب بالضبط بهذا التنسيق:

أهلاً بك يا ولي أمر البطل *${studentData.fullName || 'الطالب'}*. بصفتي أخصائي النطق الخاص به، يسعدني أن أقدم لك هذه التمارين المنزلية البسيطة والمصممة خصيصاً لمساعدته في التدرب على نطق حرف (${sessionData.letter}).

🎯 *تمارين منزلية لحرف (${sessionData.letter})*

⏱️ *المدة اليومية*: 10-15 دقيقة
📅 *التكرار*: 5 أيام في الأسبوع

🔥 *التمرين 1: [اسم جذاب]*
- الهدف: [هدف محدد]
- الطريقة: [خطوات واضحة]
- المدة: [عدد الدقائق]

🔥 *التمرين 2: [اسم جذاب]*
- الهدف: [هدف محدد]
- الطريقة: [خطوات واضحة]
- المدة: [عدد الدقائق]

🔥 *التمرين 3: [اسم جذاب]*
- الهدف: [هدف محدد]
- الطريقة: [خطوات واضحة]
- المدة: [عدد الدقائق]

🎮 *نشاط ممتع:*
[نشاط بسيط وممتع]

⭐ *نصائح لولي الأمر:*
- نصيحة 1
- نصيحة 2
- نصيحة 3

⚠️ *تجنب:*
- ما يجب تجنبه

الشروط:
- تمارين سهلة بدون أدوات خاصة
- مناسبة لعمر 4-12 سنة
- بالعربية الفصحى المبسطة`;

  return await callAI(prompt, 'teacher');
}

function showHomeworkModal(homeworkText, sessionData) {
  const student = getStudentInfo();
  const parentName = student.parentName;
  const parentEmail = student.parentEmail;
  const parentPhone = student.parentPhone;
  const fullMessage = buildParentMessage(sessionData, homeworkText, 'homework');

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:700px;width:100%;max-height:85vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;color:#EA580C;">📝 التمارين المنزلية</h3>
        <button id="closeHWModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>
      <div style="background:#FFF7ED;padding:16px;border-radius:12px;margin-bottom:16px;border-right:4px solid #EA580C;">
        <div style="font-size:13px;color:#555;"><strong>📋 جلسة:</strong> حرف (${sessionData.letter})</div>
      </div>
      <div style="font-size:15px;line-height:2;white-space:pre-wrap;background:#FFFBF5;padding:18px;border-radius:12px;max-height:400px;overflow-y:auto;">${fullMessage}</div>

      <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;justify-content:center;">
        <button id="copyHWBtn" style="border-radius:50px;padding:10px 20px;background:#EA580C;color:white;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">📋 نسخ</button>
        ${parentPhone ? `<button id="sendWhatsappHwBtn" style="border-radius:50px;padding:10px 20px;background:#25D366;color:white;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">📱 واتساب</button>` : ''}
        ${parentEmail ? `<button id="sendEmailHwBtn" style="border-radius:50px;padding:10px 20px;background:#0891B2;color:white;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">📧 إيميل</button>` : ''}
        <button id="closeHWModalBtn" style="border-radius:50px;padding:10px 20px;background:#F0F0F0;color:#333;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const closeModal = () => modal.remove();
  modal.querySelector('#closeHWModal').onclick = closeModal;
  modal.querySelector('#closeHWModalBtn').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };

  modal.querySelector('#copyHWBtn').onclick = () => {
    navigator.clipboard.writeText(fullMessage).then(() => safeToast('✅ تم نسخ التمارين'));
  };

  const waBtn = modal.querySelector('#sendWhatsappHwBtn');
  if (waBtn) {
    waBtn.onclick = () => {
      let phone = parentPhone.replace(/\D/g, '');
      if (phone.startsWith('0')) phone = '966' + phone.substring(1);
      if (!phone.startsWith('966') && phone.length === 9) phone = '966' + phone;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(fullMessage)}`, '_blank');
    };
  }

  const emailBtn = modal.querySelector('#sendEmailHwBtn');
  if (emailBtn) {
    emailBtn.onclick = () => {
      const subject = encodeURIComponent(`تمارين منزلية - ${student.fullName} - حرف ${sessionData.letter}`);
      window.location.href = `mailto:${parentEmail}?subject=${subject}&body=${encodeURIComponent(fullMessage)}`;
    };
  }
}

function createHomeworkButton(sessionData, studentData) {
  const btn = document.createElement('button');
  btn.style.cssText = 'background:linear-gradient(135deg, #F97316, #EA580C);color:white;border:none;border-radius:50px;padding:10px 24px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:14px;';
  btn.innerHTML = '📝 تمارين منزلية (AI)';
  btn.onclick = async () => {
    btn.disabled = true;
    btn.innerHTML = '⏳ جاري التوليد...';
    try {
      const homework = await generateHomeworkExercises(sessionData, studentData);
      showHomeworkModal(homework, sessionData);
      btn.disabled = false;
      btn.innerHTML = '📝 تمارين منزلية (AI)';
    } catch (error) {
      btn.disabled = false;
      btn.innerHTML = '📝 تمارين منزلية (AI)';
      safeToast('❌ ' + error.message);
    }
  };
  return btn;
}
/* ========================================
   📖 القصة القصيرة
   ======================================== */

async function generateShortStory(sessionData, studentData) {
  const sessionTypes = window.SESSION_TYPES || [
    { id: 1, name: 'الحرف مجرداً' },
    { id: 2, name: 'الحرف مع الحركات' },
    { id: 3, name: 'الحرف في كلمات' },
    { id: 4, name: 'الحرف في جمل' }
  ];
  const typeInfo = sessionTypes.find(t => t.id === sessionData.sessionType) || sessionTypes[0];
  const letterTitle = window.letterTitleMap?.[sessionData.letter] || '';

  const prompt = `أنت كاتب قصص أطفال تعليمية متخصص في تدريب النطق.
المطلوب: قصة **جديدة ومبتكرة** تحتوي على تكرار الحرف المستهدف.

⚠️ مهم جداً: اكتب **قصة فعلية** — وليس توصيات أو تمارين.

📋 معلومات:
- الطالب: ${studentData.fullName || 'الطالب'}
- الفئة العمرية: ${studentData.ageGroup || '4-12 سنة'}
- الحرف المستهدف: ${sessionData.letter}
- كلمة الحرف: ${letterTitle}

**اكتب بالضبط بهذا التنسيق:**

📖 *قصة: [عنوان جذاب]*

[القصة نفسها — 6-8 جمل قصيرة، تحتوي على الحرف (${sessionData.letter}) مكرراً 5-7 مرات]

📝 *كلمات القصة التي تبدأ بالحرف (${sessionData.letter}):*
- كلمة 1
- كلمة 2
- كلمة 3
- كلمة 4

🎯 *نشاط بعد القراءة:*
- نشاط 1
- نشاط 2

⭐ *نصيحة لولي الأمر:*
[اقتراح عملي للقراءة مع الطفل]

الشروط:
- مناسبة لعمر 4-12 سنة
- كلمات بسيطة ومألوفة
- قيمة تربوية
- بالعربية الفصحى المبسطة`;

  return await callAI(prompt, 'teacher');
}

function showShortStoryModal(storyText, sessionData) {
  const student = getStudentInfo();
  const parentName = student.parentName;
  const parentEmail = student.parentEmail;
  const parentPhone = student.parentPhone;
  const fullMessage = buildParentMessage(sessionData, storyText, 'story');

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:750px;width:100%;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;color:#DB2777;">📖 قصة قصيرة</h3>
        <button id="closeStoryModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>
      <div style="background:#FCE7F3;padding:16px;border-radius:12px;margin-bottom:16px;border-right:4px solid #DB2777;">
        <div style="font-size:13px;color:#9D174D;"><strong>📋 جلسة:</strong> حرف (${sessionData.letter})</div>
      </div>
      <div style="font-size:15px;line-height:2;white-space:pre-wrap;background:#FFF5F7;padding:18px;border-radius:12px;max-height:450px;overflow-y:auto;">${fullMessage}</div>

      <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;justify-content:center;">
        <button id="copyStoryBtn" style="border-radius:50px;padding:10px 20px;background:#DB2777;color:white;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">📋 نسخ</button>
        ${parentPhone ? `<button id="sendWhatsappStoryBtn" style="border-radius:50px;padding:10px 20px;background:#25D366;color:white;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">📱 واتساب</button>` : ''}
        ${parentEmail ? `<button id="sendEmailStoryBtn" style="border-radius:50px;padding:10px 20px;background:#0891B2;color:white;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">📧 إيميل</button>` : ''}
        <button id="closeStoryModalBtn" style="border-radius:50px;padding:10px 20px;background:#F0F0F0;color:#333;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const closeModal = () => modal.remove();
  modal.querySelector('#closeStoryModal').onclick = closeModal;
  modal.querySelector('#closeStoryModalBtn').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };

  modal.querySelector('#copyStoryBtn').onclick = () => {
    navigator.clipboard.writeText(fullMessage).then(() => safeToast('✅ تم نسخ القصة'));
  };

  const waBtn = modal.querySelector('#sendWhatsappStoryBtn');
  if (waBtn) {
    waBtn.onclick = () => {
      let phone = parentPhone.replace(/\D/g, '');
      if (phone.startsWith('0')) phone = '966' + phone.substring(1);
      if (!phone.startsWith('966') && phone.length === 9) phone = '966' + phone;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(fullMessage)}`, '_blank');
    };
  }

  const emailBtn = modal.querySelector('#sendEmailStoryBtn');
  if (emailBtn) {
    emailBtn.onclick = () => {
      const subject = encodeURIComponent(`قصة قصيرة - ${student.fullName} - حرف ${sessionData.letter}`);
      window.location.href = `mailto:${parentEmail}?subject=${subject}&body=${encodeURIComponent(fullMessage)}`;
    };
  }
}

function createShortStoryButton(sessionData, studentData) {
  const btn = document.createElement('button');
  btn.style.cssText = 'background:linear-gradient(135deg, #EC4899, #DB2777);color:white;border:none;border-radius:50px;padding:10px 24px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:14px;';
  btn.innerHTML = '📖 قصة قصيرة (AI)';
  btn.onclick = async () => {
    btn.disabled = true;
    btn.innerHTML = '⏳ جاري التوليد...';
    try {
      const story = await generateShortStory(sessionData, studentData);
      showShortStoryModal(story, sessionData);
      btn.disabled = false;
      btn.innerHTML = '📖 قصة قصيرة (AI)';
    } catch (error) {
      btn.disabled = false;
      btn.innerHTML = '📖 قصة قصيرة (AI)';
      safeToast('❌ ' + error.message);
    }
  };
  return btn;
}

/* ========================================
   📊 تحليل التقدم
   ======================================== */

async function generateProgressAnalysis(studentData, sessionsData) {
  if (!sessionsData || sessionsData.length === 0) throw new Error('لا توجد جلسات');

  const total = sessionsData.length;
  const evaluated = sessionsData.filter(s => s.evaluation && s.evaluation !== 'none');
  const passed = sessionsData.filter(s => s.evaluation === 'passed').length;
  const need = sessionsData.filter(s => s.evaluation === 'need').length;
  const avg = evaluated.length > 0
    ? Math.round(evaluated.reduce((sum, s) => sum + (s.successRate || 0), 0) / evaluated.length)
    : 0;

  const prompt = `أنت محلل تعليمي متخصص في تدريب النطق للأطفال.

📊 بيانات الطالب:
- الاسم: ${studentData.fullName || 'الطالب'}
- إجمالي الجلسات: ${total}
- اجتاز: ${passed}
- يحتاج تدريب: ${need}
- متوسط النجاح: ${avg}%

المطلوب:

🎯 الملخص التنفيذي (3-4 أسطر)
📊 نقاط القوة (3 نقاط)
⚠️ نقاط تحتاج تحسين (3 نقاط)
📈 الاتجاه العام (تحسن / ثبات / تراجع)
🎯 التوصيات الاستراتيجية (3-4 توصيات)
⏱️ التوقع الزمني

اكتب بأسلوب احترافي ومشجع، بالعربية الفصحى.`;

  return await callAI(prompt, 'teacher');
}

function showProgressAnalysisModal(analysisText, studentData, stats) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:750px;width:100%;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;color:#0891B2;">📊 تحليل التقدم</h3>
        <button id="closeProgModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>
      <div style="background:#ECFEFF;padding:16px;border-radius:12px;margin-bottom:16px;border-right:4px solid #0891B2;">
        <div style="font-size:14px;color:#155E75;font-weight:bold;">👤 ${studentData.fullName || 'الطالب'}</div>
        <div style="font-size:12px;color:#155E75;">📊 ${stats.totalSessions} جلسة | ✅ ${stats.passedCount} اجتاز | 📈 ${stats.avgSuccess}%</div>
      </div>
      <div style="font-size:15px;line-height:2;white-space:pre-wrap;background:#F0F9FF;padding:18px;border-radius:12px;max-height:450px;overflow-y:auto;">${analysisText}</div>
      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button id="copyProgBtn" style="border-radius:50px;padding:10px 24px;background:#0891B2;color:white;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">📋 نسخ</button>
        <button id="closeProgModalBtn" style="border-radius:50px;padding:10px 24px;background:#F0F0F0;color:#333;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const closeModal = () => modal.remove();
  modal.querySelector('#closeProgModal').onclick = closeModal;
  modal.querySelector('#closeProgModalBtn').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  modal.querySelector('#copyProgBtn').onclick = () => {
    navigator.clipboard.writeText(analysisText).then(() => safeToast('✅ تم نسخ التحليل'));
  };
}

function createProgressAnalysisButton(studentData) {
  const btn = document.createElement('button');
  btn.style.cssText = 'background:linear-gradient(135deg, #06B6D4, #0891B2);color:white;border:none;border-radius:50px;padding:10px 24px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:14px;';
  btn.innerHTML = '📊 تحليل التقدم (AI)';
  btn.onclick = async () => {
    btn.disabled = true;
    btn.innerHTML = '⏳ جاري التحليل...';
    try {
      const fbDb = window.db;
      const fbCollection = window.collection;
      const fbQuery = window.query;
      const fbWhere = window.where;
      const fbGetDocs = window.getDocs;

      let sessionsData = [];
      if (fbDb && fbCollection && fbQuery && fbWhere && fbGetDocs) {
        const q = fbQuery(fbCollection(fbDb, "sessions"), fbWhere("studentId", "==", studentData.id));
        const snap = await fbGetDocs(q);
        snap.forEach(d => sessionsData.push({ id: d.id, ...d.data() }));
      }

      if (sessionsData.length === 0) throw new Error('لا توجد جلسات لهذا الطالب');

      const stats = {
        totalSessions: sessionsData.length,
        passedCount: sessionsData.filter(s => s.evaluation === 'passed').length,
        avgSuccess: (() => {
          const ev = sessionsData.filter(s => s.evaluation && s.evaluation !== 'none');
          return ev.length > 0 ? Math.round(ev.reduce((sum, s) => sum + (s.successRate || 0), 0) / ev.length) : 0;
        })()
      };

      const analysis = await generateProgressAnalysis(studentData, sessionsData);
      showProgressAnalysisModal(analysis, studentData, stats);
      btn.disabled = false;
      btn.innerHTML = '📊 تحليل التقدم (AI)';
    } catch (error) {
      btn.disabled = false;
      btn.innerHTML = '📊 تحليل التقدم (AI)';
      safeToast('❌ ' + error.message);
    }
  };
  return btn;
}

/* ========================================
   🎯 الخطة المخصصة
   ======================================== */

async function generateCustomPlan(studentData, sessionsData) {
  const diag = studentData.diagnostic || {};
  const needLetters = (window.ALL_LETTERS || []).filter(l => diag[l]?.status === 'need' || diag[l]?.status === 'unclear');

  const prompt = `أنت أخصائي نطق تعليمي متخصص في تصميم خطط تدريب فردية للأطفال (4-12 سنة).

👤 بيانات الطالب:
- الاسم: ${studentData.fullName || 'الطالب'}
- الفئة العمرية: ${studentData.ageGroup || 'غير محددة'}

📋 التشخيص:
- حروف تحتاج تدريب (${needLetters.length}): ${needLetters.join('، ') || 'لا يوجد'}

📊 إحصائيات:
- إجمالي الجلسات: ${sessionsData?.length || 0}

المطلوب: خطة تدريب شاملة لأربعة أسابيع تتضمن:

🎯 الهدف الرئيسي
📅 خطة 4 أسابيع (كل أسبوع: أهداف + حروف + أنشطة)
🎯 أولويات التدريب
📝 أنشطة مخصصة لكل حرف
🏠 التمارين المنزلية الأسبوعية
📊 مؤشرات قياس التقدم
⚠️ تحذيرات وتنبيهات
🎉 المكافآت والتحفيز

اكتب بأسلوب عملي ومبني على البيانات، بالعربية الفصحى.`;

  return await callAI(prompt, 'teacher');
}

function showCustomPlanModal(planText, studentData) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:800px;width:100%;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;color:#7C3AED;">🎯 خطة مخصصة</h3>
        <button id="closePlanModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>
      <div style="background:#F3E8FF;padding:16px;border-radius:12px;margin-bottom:16px;border-right:4px solid #7C3AED;">
        <div style="font-size:14px;color:#6D28D9;font-weight:bold;">👤 ${studentData.fullName || 'الطالب'}</div>
        <div style="font-size:12px;color:#6D28D9;">📅 خطة 4 أسابيع</div>
      </div>
      <div style="font-size:15px;line-height:2;white-space:pre-wrap;background:#FAF5FF;padding:18px;border-radius:12px;max-height:450px;overflow-y:auto;">${planText}</div>
      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button id="copyPlanBtn" style="border-radius:50px;padding:10px 24px;background:#7C3AED;color:white;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">📋 نسخ</button>
        <button id="closePlanModalBtn" style="border-radius:50px;padding:10px 24px;background:#F0F0F0;color:#333;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const closeModal = () => modal.remove();
  modal.querySelector('#closePlanModal').onclick = closeModal;
  modal.querySelector('#closePlanModalBtn').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  modal.querySelector('#copyPlanBtn').onclick = () => {
    navigator.clipboard.writeText(planText).then(() => safeToast('✅ تم نسخ الخطة'));
  };
}

function createCustomPlanButton(studentData) {
  const btn = document.createElement('button');
  btn.style.cssText = 'background:linear-gradient(135deg, #A855F7, #7C3AED);color:white;border:none;border-radius:50px;padding:10px 24px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:14px;';
  btn.innerHTML = '🎯 خطة مخصصة (AI)';
  btn.onclick = async () => {
    btn.disabled = true;
    btn.innerHTML = '⏳ جاري التوليد...';
    try {
      const fbDb = window.db;
      const fbCollection = window.collection;
      const fbQuery = window.query;
      const fbWhere = window.where;
      const fbGetDocs = window.getDocs;

      let sessionsData = [];
      if (fbDb && fbCollection && fbQuery && fbWhere && fbGetDocs) {
        const q = fbQuery(fbCollection(fbDb, "sessions"), fbWhere("studentId", "==", studentData.id));
        const snap = await fbGetDocs(q);
        snap.forEach(d => sessionsData.push({ id: d.id, ...d.data() }));
      }

      const plan = await generateCustomPlan(studentData, sessionsData);
      showCustomPlanModal(plan, studentData);
      btn.disabled = false;
      btn.innerHTML = '🎯 خطة مخصصة (AI)';
    } catch (error) {
      btn.disabled = false;
      btn.innerHTML = '🎯 خطة مخصصة (AI)';
      safeToast('❌ ' + error.message);
    }
  };
  return btn;
}

/* ========================================
   🌐 تصدير الدوال
   ======================================== */

window.getLetterData = getLetterData;
window.saveLetterData = saveLetterData;
window.generateWordImage = generateWordImage;
window.getOrGenerateImage = getOrGenerateImage;
window.showImageModal = showImageModal;
window.createImageButton = createImageButton;
window.generateLetterContent = generateLetterContent;
window.createGenerateLetterButton = createGenerateLetterButton;
window.generateSessionRecommendations = generateSessionRecommendations;
window.showAIRecommendationsModal = showAIRecommendationsModal;
window.createAIButton = createAIButton;
window.generateHomeworkExercises = generateHomeworkExercises;
window.showHomeworkModal = showHomeworkModal;
window.createHomeworkButton = createHomeworkButton;
window.generateShortStory = generateShortStory;
window.showShortStoryModal = showShortStoryModal;
window.createShortStoryButton = createShortStoryButton;
window.generateProgressAnalysis = generateProgressAnalysis;
window.showProgressAnalysisModal = showProgressAnalysisModal;
window.createProgressAnalysisButton = createProgressAnalysisButton;
window.generateCustomPlan = generateCustomPlan;
window.showCustomPlanModal = showCustomPlanModal;
window.createCustomPlanButton = createCustomPlanButton;
window.buildParentMessage = buildParentMessage;

console.log('✅ AI Features loaded — v11.1');
console.log('🔍 getLetterData:', typeof window.getLetterData);
console.log('🔍 createAIButton:', typeof window.createAIButton);
console.log('🔍 createHomeworkButton:', typeof window.createHomeworkButton);
console.log('🔍 createShortStoryButton:', typeof window.createShortStoryButton);
console.log('🔍 buildParentMessage:', typeof window.buildParentMessage);
