/* ========================================
   منارة النطق - ميزات الذكاء الاصطناعي
   Manarat Al-Nutq - AI Features
   v12.0 — النسخة النهائية الكاملة
   ========================================
   
   📋 الميزات:
   ✅ توليد الصور (Fanar + R2)
   ✅ توليد محتوى الحرف (Worker v5.7)
   ✅ التوصيات الذكية (برومبت v9.1)
   ✅ التمارين المنزلية (برومبت v9.1)
   ✅ القصة القصيرة (برومبت v9.1)
   ✅ تحليل التقدم
   ✅ الخطة المخصصة
   ✅ ترويسة موحدة + أزرار واتساب/إيميل
   ======================================== */

console.log('🚀 Starting ai-features.js v12.0...');

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

function safeNotify(msg, type = 'info') {
  if (typeof window.showNotification === 'function') window.showNotification(msg, type);
}

function getSessionTypes() {
  return window.SESSION_TYPES || [
    { id: 1, name: 'الحرف مجرداً', icon: '🔊' },
    { id: 2, name: 'الحرف مع الحركات', icon: '📖' },
    { id: 3, name: 'الحرف في كلمات', icon: '📝' },
    { id: 4, name: 'الحرف في جمل', icon: '✍️' }
  ];
}

function getAllLetters() {
  return window.ALL_LETTERS || [
    'ب','م','و','ف','ت','ث','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ل','ن',
    'ج','ك','ق','ي','أ','هـ','ع','ح','خ','غ'
  ];
}

function getLetterTitle(letter) {
  return window.letterTitleMap?.[letter] || '';
}

async function getTeacherInfo() {
  const role = window.state?.role || 'teacher';
  const roleLabel = role === 'admin' ? 'مدير المدرسة' : 'معلم تدريبات النطق';
  const user = window.state?.user || {};
  const email = user.email || '';

  let fullName = 'المعلم';

  try {
    const fbDb = window.db;
    const fbDoc = window.doc;
    const fbGetDoc = window.getDoc;

    if (fbDb && fbDoc && fbGetDoc && user.uid) {
      const ref = fbDoc(fbDb, "users", user.uid);
      const snap = await fbGetDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        fullName = data.fullName || email || 'المعلم';
      }
    }
  } catch (e) {
    console.warn('تعذر جلب بيانات المعلم:', e);
    fullName = user.displayName || email || 'المعلم';
  }

  return { fullName, roleLabel };
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
  const sessionTypes = getSessionTypes();
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

async function buildParentMessage(sessionData, content, contentType) {
  const student = getStudentInfo();
  const teacher = await getTeacherInfo();
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

  const footer = `━━━━━━━━━━━━━━━━━━━━
🌹 نرجو متابعة التدريب المنزلي بانتظام
أ/ ${teacher.fullName} - ${teacher.roleLabel}`;

  return `${header}${body}${footer}`;
}

/* ========================================
   🤖 الاتصال بـ Worker v5.7
   ======================================== */

async function callAI(prompt, type = 'general') {
  try {
    const response = await fetch(`${WORKER_BASE}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt, type: type, role: 'teacher' })
    });

    if (!response.ok) {
      throw new Error(`فشل الاتصال: ${response.status}`);
    }

    const data = await response.json();

    if (!data.ok || !data.recommendation) {
      throw new Error('لم يتم استلام رد من الذكاء الاصطناعي');
    }

    const rec = data.recommendation;
    if (typeof rec === 'string') return rec;
    if (rec && typeof rec === 'object') {
      if (rec.response) return rec.response;
      if (rec.text) return rec.text;
      if (rec.choices && rec.choices[0] && rec.choices[0].text) return rec.choices[0].text;
      return JSON.stringify(rec);
    }

    return String(rec);
  } catch (error) {
    console.error('AI Error:', error);
    throw error;
  }
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
      return window.LETTER_DATABASE?.[letter] || null;
    }

    const ref = fbDoc(fbDb, "letters_data", letter);
    const snap = await fbGetDoc(ref);

    if (snap.exists()) return snap.data();
    return window.LETTER_DATABASE?.[letter] || null;
  } catch (e) {
    console.warn('خطأ في جلب بيانات الحرف:', e);
    return window.LETTER_DATABASE?.[letter] || null;
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
   🖼️ توليد الصور (كما هو من v11.1)
   ======================================== */

async function generateWordImage(word) {
  if (!word) throw new Error('الكلمة مطلوبة');
  try {
    console.log(`🎨 جاري توليد صورة: ${word}`);
    const response = await fetch(`${VERCEL_API_BASE}/api/ai-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: word })
    });
    if (!response.ok) throw new Error(`فشل الاتصال: ${response.status}`);
    const data = await response.json();
    if (!data.success || !data.image) throw new Error(data.message || 'لم يتم توليد صورة');
    console.log(`✅ تم توليد: ${word}`);
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
   📚 توليد محتوى الحرف (كما هو من v11.1)
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

async function generateSingleLetterData(letter) {
  return await generateLetterContent(letter, getLetterTitle(letter));
}

function showGenerateLetterConfirmModal(letter) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;';
    modal.innerHTML = `
      <div style="background:white;padding:30px;border-radius:20px;max-width:500px;width:100%;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:60px;margin-bottom:10px;">📚</div>
          <h2 style="margin:0;color:#7C3AED;">توليد محتوى حرف (${letter})</h2>
        </div>
        <div style="background:#F3E8FF;padding:18px;border-radius:12px;margin-bottom:20px;border-right:4px solid #7C3AED;">
          <p style="margin:0;font-size:13px;color:#5B21B6;">سيتم توليد: مخرج الحرف + 4 حركات + 9 كلمات + 3 جمل</p>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button id="confirmGenBtn" style="background:linear-gradient(135deg, #A855F7, #7C3AED);color:white;border:none;border-radius:50px;padding:12px 30px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:15px;">🚀 توليد الآن</button>
          <button id="cancelGenBtn" style="background:#F0F0F0;color:#333;border:none;border-radius:50px;padding:12px 30px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:15px;">إلغاء</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const closeModal = (result) => { modal.remove(); resolve(result); };
    modal.querySelector('#confirmGenBtn').onclick = () => closeModal(true);
    modal.querySelector('#cancelGenBtn').onclick = () => closeModal(false);
    modal.onclick = (e) => { if (e.target === modal) closeModal(false); };
  });
}

function showLetterSuccessModal(letter) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;';
  modal.innerHTML = `
    <div style="background:white;padding:30px;border-radius:20px;max-width:450px;width:100%;text-align:center;">
      <div style="font-size:80px;margin-bottom:15px;">🎉</div>
      <h2 style="margin:0 0 10px 0;color:#16A34A;">تم بنجاح!</h2>
      <p style="margin:0 0 20px 0;color:#555;">تم توليد وحفظ بيانات حرف (${letter})</p>
      <button id="reloadPageBtn" style="background:linear-gradient(135deg, #16A34A, #22C55E);color:white;border:none;border-radius:50px;padding:12px 30px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:15px;">🔄 تحديث الجلسة</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#reloadPageBtn').onclick = () => {
    modal.remove();
    safeRender();
  };
}

function createGenerateLetterButton(letter, onSuccess) {
  const btn = document.createElement('button');
  btn.id = `generateLetterBtn_${letter}`;
  btn.style.cssText = 'background:linear-gradient(135deg, #A855F7, #7C3AED);color:white;border:none;border-radius:50px;padding:12px 28px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:14px;';
  btn.innerHTML = `📚 توليد محتوى حرف (${letter}) بالذكاء الاصطناعي`;

  btn.onclick = async () => {
    try {
      const confirmed = await showGenerateLetterConfirmModal(letter);
      if (!confirmed) return;

      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.innerHTML = '⏳ جاري التوليد (5-10 ثواني)...';

      const data = await generateLetterContent(letter, getLetterTitle(letter));
      btn.innerHTML = '⏳ جاري الحفظ...';
      await saveLetterData(letter, data);

      showLetterSuccessModal(letter);
      safeToast(`✅ تم توليد وحفظ محتوى حرف (${letter})`);
      safeNotify(`تم توليد محتوى حرف (${letter})`, 'success');

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

const createGenerateLetterButtonForSession = createGenerateLetterButton;

/* ========================================
   🤖 التوصيات الذكية — البرومبت من v9.1
   ======================================== */

async function generateSessionRecommendations(sessionData, studentData) {
  const sessionTypes = getSessionTypes();
  const typeInfo = sessionTypes.find(t => t.id === sessionData.sessionType) || sessionTypes[0];

  const prompt = `
أنت مساعد تعليمي متخصص في تدريب النطق للأطفال (4-12 سنة).
لا تقدم تشخيصاً طبياً، فقط توصيات تعليمية عملية.

📋 بيانات الجلسة:
- الطالب: ${studentData.fullName || 'الطالب'}
- الحرف المستهدف: ${sessionData.letter}
- نوع الجلسة: ${typeInfo.name}
- الهدف: ${sessionData.goal}
- نسبة النجاح: ${sessionData.successRate || 0}%
- التقييم: ${sessionData.evaluation || 'غير مقيم'}
- ملاحظات المعلم: ${sessionData.recommendations || 'لا توجد'}

المطلوب منك:
1. 📊 تحليل موجز لأداء الطالب (سطران)
2. 🎯 توصيتان لجلسات قادمة
3. 🏠 تمرين منزلي بسيط لولي الأمر
4. ⚠️ تنبيه إذا لزم الأمر

اكتب بأسلوب واضح ومباشر، عملي، مشجع، بالعربية الفصحى المبسطة.
`;

  return await callAI(prompt, 'session-recommendations');
}

function showAIRecommendationsModal(recommendations, sessionData) {
  (async () => {
    const student = getStudentInfo();
    const parentEmail = student.parentEmail;
    const parentPhone = student.parentPhone;
    const fullMessage = await buildParentMessage(sessionData, recommendations, 'recommendations');

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
        <div style="font-size:14px;line-height:1.9;white-space:pre-wrap;background:#FAF5FF;padding:18px;border-radius:12px;max-height:400px;overflow-y:auto;">${fullMessage}</div>

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
  })();
}

function createAIButton(sessionData, studentData) {
  const btn = document.createElement('button');
  btn.id = 'generateAIBtn';
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
   📝 التمارين المنزلية — البرومبت من v9.1
   ======================================== */

async function generateHomeworkExercises(sessionData, studentData) {
  const sessionTypes = getSessionTypes();
  const typeInfo = sessionTypes.find(t => t.id === sessionData.sessionType) || sessionTypes[0];

  const prompt = `
أنت أخصائي نطق تعليمي متخصص في تمارين الأطفال (4-12 سنة).
المطلوب: توليد تمارين منزلية بسيطة وممتعة لولي الأمر.

📋 معلومات الجلسة:
- الطالب: ${studentData.fullName || 'الطالب'}
- الحرف المستهدف: ${sessionData.letter}
- نوع الجلسة: ${typeInfo.name}
- نسبة النجاح: ${sessionData.successRate || 0}%
- التقييم: ${sessionData.evaluation || 'غير مقيم'}
- ملاحظات: ${sessionData.recommendations || 'لا توجد'}

اكتب التمارين بهذا التنسيق:

🏠 **تمارين منزلية لحرف (${sessionData.letter})**

⏱️ **المدة اليومية**: 10-15 دقيقة
📅 **التكرار**: 5 أيام في الأسبوع

**🔥 التمرين 1: [اسم]**
- الهدف: ...
- الطريقة: ...
- المدة: ...

**🔥 التمرين 2: [اسم]**
- الهدف: ...
- الطريقة: ...
- المدة: ...

**🔥 التمرين 3: [اسم]**
- الهدف: ...
- الطريقة: ...
- المدة: ...

**🎮 لعبة ممتعة:**
[وصف]

**⭐ نصائح لولي الأمر:**
- نصيحة 1
- نصيحة 2
- نصيحة 3

**⚠️ تجنب:**
- ما يجب تجنبه

الشروط: تمارين سهلة، بدون أدوات خاصة، مناسبة للعمر، بالعربية الفصحى المبسطة.
`;

  return await callAI(prompt, 'homework');
}

function showHomeworkModal(homeworkText, sessionData) {
  (async () => {
    const student = getStudentInfo();
    const parentEmail = student.parentEmail;
    const parentPhone = student.parentPhone;
    const fullMessage = await buildParentMessage(sessionData, homeworkText, 'homework');

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
        <div style="font-size:14px;line-height:1.9;white-space:pre-wrap;background:#FFFBF5;padding:18px;border-radius:12px;max-height:400px;overflow-y:auto;">${fullMessage}</div>

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
  })();
}

function createHomeworkButton(sessionData, studentData) {
  const btn = document.createElement('button');
  btn.id = 'generateHWBtn';
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
   📖 القصة القصيرة — البرومبت من v9.1
   ======================================== */

async function generateShortStory(sessionData, studentData) {
  const sessionTypes = getSessionTypes();
  const typeInfo = sessionTypes.find(t => t.id === sessionData.sessionType) || sessionTypes[0];
  const letterTitle = getLetterTitle(sessionData.letter);

  const prompt = `
أنت كاتب قصص أطفال تعليمية متخصص في تدريب النطق.
المطلوب: قصة قصيرة ممتعة تحتوي على تكرار الحرف المستهدف.

📋 معلومات:
- الطالب: ${studentData.fullName || 'الطالب'}
- الفئة العمرية: ${studentData.ageGroup || '4-12 سنة'}
- الحرف المستهدف: ${sessionData.letter}
- كلمة الحرف: ${letterTitle}
- نوع الجلسة: ${typeInfo.name}

اكتب القصة بالتنسيق التالي:

📖 **قصة: [عنوان جذاب]**

[القصة - 5-7 جمل قصيرة، تحتوي على الحرف المستهدف مكرراً 4-6 مرات]

**📝 كلمات القصة التي تبدأ بالحرف (${sessionData.letter}):**
- [كلمة 1]
- [كلمة 2]
- [كلمة 3]
- [كلمة 4]

**🎯 نشاط بعد القراءة:**
- اطلب من الطفل نطق الكلمات
- اسأل: أين نرى هذا الحرف في القصة؟

**⭐ نصيحة لولي الأمر:**
اقرأ القصة بصوت واضح، واطلب من الطفل تكرار الكلمات.

الشروط: مناسبة لعمر 4-12 سنة، كلمات بسيطة، قيمة تربوية، بالعربية الفصحى.
`;

  return await callAI(prompt, 'short-story');
}

function showShortStoryModal(storyText, sessionData) {
  (async () => {
    const student = getStudentInfo();
    const parentEmail = student.parentEmail;
    const parentPhone = student.parentPhone;
    const fullMessage = await buildParentMessage(sessionData, storyText, 'story');

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
        <div style="font-size:14px;line-height:1.9;white-space:pre-wrap;background:#FFF5F7;padding:18px;border-radius:12px;max-height:450px;overflow-y:auto;">${fullMessage}</div>

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
  })();
}

function createShortStoryButton(sessionData, studentData) {
  const btn = document.createElement('button');
  btn.id = 'generateStoryBtn';
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
   📊 تحليل التقدم — البرومبت من v9.1
   ======================================== */

async function generateProgressAnalysis(studentData, sessionsData) {
  if (!sessionsData || sessionsData.length === 0) {
    throw new Error('لا توجد جلسات لتحليلها');
  }

  const totalSessions = sessionsData.length;
  const evaluatedSessions = sessionsData.filter(s => s.evaluation && s.evaluation !== 'none');
  const passedCount = sessionsData.filter(s => s.evaluation === 'passed').length;
  const trainedCount = sessionsData.filter(s => s.evaluation === 'trained').length;
  const needCount = sessionsData.filter(s => s.evaluation === 'need').length;
  const unclearCount = sessionsData.filter(s => s.evaluation === 'unclear').length;
  const avgSuccess = evaluatedSessions.length > 0
    ? Math.round(evaluatedSessions.reduce((sum, s) => sum + (s.successRate || 0), 0) / evaluatedSessions.length)
    : 0;

  const lettersSet = new Set(sessionsData.map(s => s.letter));
  const lettersList = Array.from(lettersSet);

  const letterStats = {};
  lettersList.forEach(letter => {
    const ls = sessionsData.filter(s => s.letter === letter);
    const successL = ls.filter(s => s.evaluation === 'passed' || s.evaluation === 'trained').length;
    const avgL = ls.length > 0 ? Math.round(ls.reduce((sum, s) => sum + (s.successRate || 0), 0) / ls.length) : 0;
    letterStats[letter] = { total: ls.length, success: successL, avg: avgL };
  });

  const lettersSummary = Object.entries(letterStats).map(([letter, stats]) => 
    `- حرف (${letter}): ${stats.total} جلسة، ${stats.success} ناجحة، متوسط ${stats.avg}%`
  ).join('\n');

  const prompt = `
أنت محلل تعليمي متخصص في تدريب النطق للأطفال.

📊 بيانات الطالب:
- الاسم: ${studentData.fullName || 'الطالب'}
- إجمالي الجلسات: ${totalSessions}
- جلسات مقيمة: ${evaluatedSessions.length}

📈 النتائج:
- ✅ اجتاز: ${passedCount}
- 🔄 اجتاز بعد تدريب: ${trainedCount}
- ⚠️ يحتاج تدريب: ${needCount}
- ❌ غير واضح: ${unclearCount}
- 📊 متوسط النجاح: ${avgSuccess}%

📌 الحروف المتدرب عليها (${lettersList.length}):
${lettersSummary}

المطلوب منك:

🎯 الملخص التنفيذي (3-4 أسطر)
📊 نقاط القوة (3 نقاط)
⚠️ نقاط تحتاج تحسين (3 نقاط)
📈 الاتجاه العام (تحسن / ثبات / تراجع)
🎯 التوصيات الاستراتيجية (3-4 توصيات)
⏱️ التوقع الزمني

اكتب بأسلوب احترافي ومشجع، بالعربية الفصحى.
`;

  return await callAI(prompt, 'progress-analysis');
}

function showProgressAnalysisModal(analysisText, studentData, stats) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:750px;width:100%;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;color:#0891B2;">📊 تحليل تقدم الطالب</h3>
        <button id="closeProgModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>
      
      <div style="background:#ECFEFF;padding:16px;border-radius:12px;margin-bottom:16px;border-right:4px solid #0891B2;">
        <div style="font-size:14px;color:#155E75;font-weight:bold;margin-bottom:6px;">👤 ${studentData.fullName || 'الطالب'}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-top:8px;">
          <div style="text-align:center;background:white;padding:8px;border-radius:8px;">
            <div style="font-size:20px;font-weight:bold;color:#0891B2;">${stats.totalSessions}</div>
            <div style="font-size:11px;color:#666;">إجمالي الجلسات</div>
          </div>
          <div style="text-align:center;background:white;padding:8px;border-radius:8px;">
            <div style="font-size:20px;font-weight:bold;color:#16A34A;">${stats.passedCount}</div>
            <div style="font-size:11px;color:#666;">اجتاز</div>
          </div>
          <div style="text-align:center;background:white;padding:8px;border-radius:8px;">
            <div style="font-size:20px;font-weight:bold;color:#F59E0B;">${stats.trainedCount}</div>
            <div style="font-size:11px;color:#666;">بعد تدريب</div>
          </div>
          <div style="text-align:center;background:white;padding:8px;border-radius:8px;">
            <div style="font-size:20px;font-weight:bold;color:#0891B2;">${stats.avgSuccess}%</div>
            <div style="font-size:11px;color:#666;">متوسط النجاح</div>
          </div>
        </div>
      </div>
      
      <div style="font-size:14px;line-height:1.9;white-space:pre-wrap;background:#F0F9FF;padding:18px;border-radius:12px;max-height:450px;overflow-y:auto;">${analysisText}</div>
      
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
  btn.id = 'generateProgBtn';
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
        trainedCount: sessionsData.filter(s => s.evaluation === 'trained').length,
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
   🎯 الخطة المخصصة — البرومبت من v9.1
   ======================================== */

async function generateCustomPlan(studentData, sessionsData) {
  const diag = studentData.diagnostic || {};
  const allLetters = getAllLetters();

  const passedLetters = allLetters.filter(l => diag[l]?.status === 'passed');
  const trainedLetters = allLetters.filter(l => diag[l]?.status === 'trained');
  const needLetters = allLetters.filter(l => diag[l]?.status === 'need');
  const unclearLetters = allLetters.filter(l => diag[l]?.status === 'unclear');

  const disorderSummary = {};
  needLetters.concat(unclearLetters).forEach(letter => {
    const disorderType = diag[letter]?.disorderType || 'غير محدد';
    if (!disorderSummary[disorderType]) disorderSummary[disorderType] = [];
    disorderSummary[disorderType].push(letter);
  });

  const disorderText = Object.entries(disorderSummary)
    .map(([type, letters]) => `- ${type}: ${letters.join('، ')}`)
    .join('\n');

  const totalSessions = sessionsData?.length || 0;
  const evaluated = sessionsData?.filter(s => s.successRate) || [];
  const avgSuccess = evaluated.length > 0 
    ? Math.round(evaluated.reduce((sum, s) => sum + (s.successRate || 0), 0) / evaluated.length)
    : 0;

  const prompt = `
أنت أخصائي نطق تعليمي متخصص في تصميم خطط تدريب فردية للأطفال (4-12 سنة).

👤 بيانات الطالب:
- الاسم: ${studentData.fullName || 'الطالب'}
- الفئة العمرية: ${studentData.ageGroup || 'غير محددة'}

📋 التشخيص الحالي:
- ✅ حروف متقنة (${passedLetters.length}): ${passedLetters.join('، ') || 'لا يوجد'}
- 🔄 حروف اجتازها بعد تدريب (${trainedLetters.length}): ${trainedLetters.join('، ') || 'لا يوجد'}
- ⚠️ حروف تحتاج تدريب (${needLetters.length}): ${needLetters.join('، ') || 'لا يوجد'}
- ❓ حروف غير واضحة (${unclearLetters.length}): ${unclearLetters.join('، ') || 'لا يوجد'}

🔍 أنواع العيوب:
${disorderText || 'لا توجد عيوب محددة'}

📊 إحصائيات الجلسات:
- إجمالي الجلسات: ${totalSessions}
- متوسط النجاح: ${avgSuccess}%

المطلوب: خطة تدريب شاملة تشمل:
🎯 الهدف الرئيسي
📅 خطة 4 أسابيع (كل أسبوع: أهداف + جلستان + حروف + أنشطة)
🎯 أولويات التدريب
📝 أنشطة مخصصة لكل حرف
🏠 التمارين المنزلية الأسبوعية
📊 مؤشرات قياس التقدم
⚠️ تحذيرات وتنبيهات
🎉 المكافآت والتحفيز

اكتب بأسلوب عملي ومبني على البيانات، بالعربية الفصحى.
`;

  return await callAI(prompt, 'custom-plan');
}

function showCustomPlanModal(planText, studentData) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:800px;width:100%;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;color:#7C3AED;">🎯 خطة التدريب المخصصة</h3>
        <button id="closePlanModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>
      
      <div style="background:#F3E8FF;padding:16px;border-radius:12px;margin-bottom:16px;border-right:4px solid #7C3AED;">
        <div style="font-size:14px;color:#6D28D9;font-weight:bold;">👤 ${studentData.fullName || 'الطالب'}</div>
        <div style="font-size:12px;color:#6D28D9;">📅 خطة 4 أسابيع</div>
      </div>
      
      <div style="font-size:14px;line-height:1.9;white-space:pre-wrap;background:#FAF5FF;padding:18px;border-radius:12px;max-height:500px;overflow-y:auto;">${planText}</div>
      
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
  btn.id = 'generatePlanBtn';
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
   💾 دوال الحفظ
   ======================================== */

async function saveAIToSession(sessionId, recommendations) {
  try {
    const fbDb = window.db, fbDoc = window.doc, fbUpdateDoc = window.updateDoc;
    if (!fbDb || !fbDoc || !fbUpdateDoc) return;
    await fbUpdateDoc(fbDoc(fbDb, "sessions", sessionId), {
      aiRecommendations: recommendations,
      aiGeneratedAt: new Date().toISOString()
    });
    safeToast('✅ تم حفظ التوصيات');
  } catch (e) {
    safeToast('❌ فشل الحفظ');
  }
}

async function saveHomeworkToSession(sessionId, homeworkText) {
  try {
    const fbDb = window.db, fbDoc = window.doc, fbUpdateDoc = window.updateDoc;
    if (!fbDb || !fbDoc || !fbUpdateDoc) return;
    await fbUpdateDoc(fbDoc(fbDb, "sessions", sessionId), {
      aiHomework: homeworkText,
      aiHomeworkGeneratedAt: new Date().toISOString()
    });
    safeToast('✅ تم حفظ التمارين');
  } catch (e) {
    safeToast('❌ فشل الحفظ');
  }
}

async function saveStoryToSession(sessionId, storyText) {
  try {
    const fbDb = window.db, fbDoc = window.doc, fbUpdateDoc = window.updateDoc;
    if (!fbDb || !fbDoc || !fbUpdateDoc) return;
    await fbUpdateDoc(fbDoc(fbDb, "sessions", sessionId), {
      aiStory: storyText,
      aiStoryGeneratedAt: new Date().toISOString()
    });
    safeToast('✅ تم حفظ القصة');
  } catch (e) {
    safeToast('❌ فشل الحفظ');
  }
}

/* ========================================
   📤 دالة إرسال التقرير لولي الأمر
   ======================================== */

async function sendSessionToParent(sessionData, studentData) {
  try {
    if (!studentData) {
      safeToast('⚠️ لا توجد بيانات طالب');
      return;
    }

    const parentEmail = studentData.parentEmail || '';
    const parentPhone = studentData.parentPhone || '';

    if (!parentEmail && !parentPhone) {
      safeToast('⚠️ لا توجد بيانات ولي الأمر — يرجى إضافتها في الملف الشخصي');
      safeNotify('لا توجد بيانات ولي أمر مسجلة', 'warning');
      return;
    }

    showSendToParentOptionsModal(sessionData, studentData);
  } catch (e) {
    console.error('❌ خطأ في إرسال التقرير:', e);
    safeToast('❌ خطأ: ' + e.message);
  }
}

async function showSendToParentOptionsModal(sessionData, studentData) {
  const parentEmail = studentData.parentEmail || '';
  const parentPhone = studentData.parentPhone || '';
  const parentName = studentData.parentName || 'ولي الأمر';
  const studentName = studentData.fullName || studentData.email || 'الطالب';

  const reportText = await generateParentReportText(sessionData, studentData);

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;color:var(--mint-deep);">📤 إرسال التقرير لولي الأمر</h3>
        <button id="closeSendModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>

      <div style="background:#F0FDFA;padding:16px;border-radius:12px;margin-bottom:16px;border-right:4px solid var(--mint-deep);">
        <div style="font-size:14px;color:#555;margin-bottom:6px;"><strong>👤 الطالب:</strong> ${studentName}</div>
        <div style="font-size:14px;color:#555;margin-bottom:6px;"><strong>👨‍👩‍👧 ولي الأمر:</strong> ${parentName}</div>
        ${parentEmail ? `<div style="font-size:14px;color:#555;margin-bottom:6px;"><strong>📧 البريد:</strong> ${parentEmail}</div>` : ''}
        ${parentPhone ? `<div style="font-size:14px;color:#555;margin-bottom:6px;"><strong>📱 الجوال:</strong> ${parentPhone}</div>` : ''}
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;">
        ${parentEmail ? `<button id="sendViaEmailBtn" style="background:linear-gradient(135deg, #0891B2, #06B6D4);color:white;border:none;border-radius:50px;padding:14px 24px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:15px;">📧 إرسال بالبريد الإلكتروني</button>` : ''}
        ${parentPhone ? `<button id="sendViaWhatsappBtn" style="background:linear-gradient(135deg, #25D366, #128C7E);color:white;border:none;border-radius:50px;padding:14px 24px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:15px;">💬 إرسال عبر واتساب</button>` : ''}
        <button id="copyReportBtn" style="background:linear-gradient(135deg, #7C3AED, #A855F7);color:white;border:none;border-radius:50px;padding:14px 24px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:15px;">📋 نسخ نص التقرير</button>
      </div>

      <div style="margin-top:20px;padding-top:20px;border-top:2px dashed var(--line);">
        <details>
          <summary style="cursor:pointer;font-weight:bold;color:var(--mint-deep);font-size:14px;">👁️ معاينة نص التقرير</summary>
          <div style="margin-top:12px;background:#FAFDFC;padding:14px;border-radius:12px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:300px;overflow-y:auto;">${reportText}</div>
        </details>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const closeModal = () => modal.remove();
  modal.querySelector('#closeSendModal').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };

  const emailBtn = modal.querySelector('#sendViaEmailBtn');
  if (emailBtn) {
    emailBtn.onclick = () => {
      const subject = encodeURIComponent(`تقرير جلسة نطق - ${studentName}`);
      const body = encodeURIComponent(reportText);
      window.location.href = `mailto:${parentEmail}?subject=${subject}&body=${body}`;
      safeToast('📧 جاري فتح البريد...');
      closeModal();
    };
  }

  const whatsappBtn = modal.querySelector('#sendViaWhatsappBtn');
  if (whatsappBtn) {
    whatsappBtn.onclick = () => {
      let phone = parentPhone.replace(/\D/g, '');
      if (phone.startsWith('0')) phone = '966' + phone.substring(1);
      if (!phone.startsWith('966') && phone.length === 9) phone = '966' + phone;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(reportText)}`, '_blank');
      safeToast('💬 جاري فتح واتساب...');
      closeModal();
    };
  }

  const copyBtn = modal.querySelector('#copyReportBtn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(reportText).then(() => safeToast('✅ تم نسخ التقرير'));
    };
  }
}

async function generateParentReportText(sessionData, studentData) {
  return await buildParentMessage(sessionData, sessionData.recommendations || '', 'report');
}

/* ========================================
   🌐 تصدير الدوال للنطاق العام
   ======================================== */

window.callAI = callAI;
window.callGeminiAI = callAI;
window.getLetterData = getLetterData;
window.saveLetterData = saveLetterData;
window.generateWordImage = generateWordImage;
window.getOrGenerateImage = getOrGenerateImage;
window.showImageModal = showImageModal;
window.createImageButton = createImageButton;
window.generateLetterContent = generateLetterContent;
window.generateSingleLetterData = generateSingleLetterData;
window.showGenerateLetterConfirmModal = showGenerateLetterConfirmModal;
window.showLetterSuccessModal = showLetterSuccessModal;
window.createGenerateLetterButton = createGenerateLetterButton;
window.createGenerateLetterButtonForSession = createGenerateLetterButtonForSession;
window.generateSessionRecommendations = generateSessionRecommendations;
window.showAIRecommendationsModal = showAIRecommendationsModal;
window.createAIButton = createAIButton;
window.generateHomeworkExercises = generateHomeworkExercises;
window.showHomeworkModal = showHomeworkModal;
window.createHomeworkButton = createHomeworkButton;
window.generateShortStory = generateShortStory;
window.showShortStoryModal = showShortStory
window.createShortStoryButton = createShortStoryButton;
window.generateProgressAnalysis = generateProgressAnalysis;
window.showProgressAnalysisModal = showProgressAnalysisModal;
window.createProgressAnalysisButton = createProgressAnalysisButton;
window.generateCustomPlan = generateCustomPlan;
window.showCustomPlanModal = showCustomPlanModal;
window.createCustomPlanButton = createCustomPlanButton;
window.buildParentMessage = buildParentMessage;
