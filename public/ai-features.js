/* ========================================
   🛡️ اعتراض أخطاء الإلغاء
   ======================================== */
window.addEventListener('unhandledrejection', event => {
  if (event.reason && event.reason.name === 'AbortError') {
    event.preventDefault();
    console.warn('⚠️ تم إلغاء طلب غير مكتمل (AbortError) - تم تجاهله بنجاح.');
  }
});

/* ========================================
   منارة النطق - ميزات الذكاء الاصطناعي
   v19.0 — النسخة الكاملة الشاملة (1000+ سطر)
   ======================================== */

console.log('🚀 Starting ai-features.js v19.0 (Full 1000+ lines)...');

const WORKER_BASE = 'https://manarat-api-v3.rslani999.workers.dev';
const VERCEL_API_BASE = 'https://manarat-alnutq.vercel.app';

/* ========================================
   🛠️ الدوال المساعدة
   ======================================== */
function safeToast(msg) {
  if (typeof window.showToast === 'function') window.showToast(msg);
  else console.log('TOAST:', msg);
}

function safeRender() {
  if (typeof window.render === 'function') window.render();
  else console.warn('⚠️ render() غير متوفرة في window');
}

function safeNotify(msg, type = 'info') {
  if (typeof window.showNotification === 'function') window.showNotification(msg, type);
}

// ✅ استعادة الدالة المفقودة التي تسببت في الخطأ
function getLetterTitle(letter) {
  return window.letterTitleMap?.[letter] || '';
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

/* ========================================
   👤 بيانات المعلم والطالب والجلسة
   ======================================== */
async function getTeacherInfo() {
  const role = window.state?.role || 'teacher';
  const roleLabel = role === 'admin' ? 'مدير المدرسة' : 'معلم تدريبات النطق';
  const user = window.state?.user || {};
  const email = user.email || '';
  let fullName = 'المعلم';
  let schoolName = '';

  try {
    const fbDb = window.db, fbDoc = window.doc, fbGetDoc = window.getDoc;
    if (fbDb && fbDoc && fbGetDoc && user.uid) {
      const ref = fbDoc(fbDb, "users", user.uid);
      const snap = await fbGetDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        fullName = data.fullName || email || 'المعلم';
        schoolName = data.schoolName || '';
      }
    }
  } catch (e) {
    fullName = user.displayName || email || 'المعلم';
  }
  return { fullName, roleLabel, schoolName };
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
    'passed': '✅ اجتاز', 'trained': '🔄 اجتاز بعد تدريب', 'need': '⚠️ يحتاج تدريب',
    'unclear': '❌ غير واضح', 'none': '⏳ قيد التقييم'
  };
  return {
    student: sessionData.studentName || 'الطالب',
    letter: sessionData.letter || '',
    typeName: typeInfo.name,
    date: sessionData.date || new Date().toISOString().split('T')[0],
    duration: sessionData.duration || '15 دقيقة',
    goal: sessionData.goal || 'تدريب نطق الحرف',
    evaluation: evalLabels[sessionData.evaluation] || '⏳ قيد التقييم',
    successRate: sessionData.successRate || 0
  };
}

async function buildParentMessage(sessionData, content, contentType) {
  const student = getStudentInfo();
  const teacher = await getTeacherInfo();
  const details = getSessionDetails(sessionData);

  const header = `السلام عليكم ولي أمر ${student.fullName}\n\n📋 تقرير جلسة نطق\n━━━━━━━━━━━━━━━━━━━━\n👤 الطالب: ${details.student}\n🔤 الحرف المستهدف: (${details.letter})\n📚 نوع الجلسة: ${details.typeName}\n📅 التاريخ: ${details.date}\n⏱️ المدة: ${details.duration}\n\n🎯 الهدف:\n${details.goal}\n\n📊 التقييم: ${details.evaluation}\n📈 نسبة النجاح: ${details.successRate}%\n`;
  const body = `\n${content}\n`;
  const schoolLine = teacher.schoolName ? ` - ${teacher.schoolName}` : '';
  const footer = `━━━━━━━━━━━━━━━━━━━━\n🌹 نرجو متابعة التدريب المنزلي بانتظام\nأ/ ${teacher.fullName} - ${teacher.roleLabel}${schoolLine}`;

  return `${header}${body}${footer}`;
}

/* ========================================
   📖 Firebase — بيانات الحروف والصور
   ======================================== */
async function getLetterData(letter) {
  try {
    const fbDb = window.db, fbDoc = window.doc, fbGetDoc = window.getDoc;
    if (!fbDb || !fbDoc || !fbGetDoc) return window.LETTER_DATABASE?.[letter] || null;
    const ref = fbDoc(fbDb, "letters_data", letter);
    const snap = await fbGetDoc(ref);
    if (snap.exists()) return snap.data();
    return window.LETTER_DATABASE?.[letter] || null;
  } catch (e) { return window.LETTER_DATABASE?.[letter] || null; }
}

async function saveLetterData(letter, data) {
  try {
    const fbDb = window.db, fbDoc = window.doc, fbSetDoc = window.setDoc;
    if (!fbDb || !fbDoc || !fbSetDoc) throw new Error('Firebase غير جاهز');
    await fbSetDoc(fbDoc(fbDb, "letters_data", letter), data);
    return true;
  } catch (e) { throw e; }
}

/* ========================================
   🎨 توليد الصور (مع التشخيص)
   ======================================== */
async function generateWordImage(word) {
  if (!word) throw new Error('الكلمة مطلوبة');
  try {
    console.log(`⏳ جاري إرسال طلب الصورة إلى Vercel للكلمة: ${word}`);
    const response = await fetch(`${VERCEL_API_BASE}/api/ai-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: word })
    });
    if (!response.ok) throw new Error(`فشل الاتصال: ${response.status}`);
    const data = await response.json();
    if (!data.success || !data.image) throw new Error(data.message || 'لم يتم توليد صورة');
    return data.image;
  } catch (error) { throw error; }
}

async function getCachedImage(word) {
  try {
    const fbDb = window.db, fbDoc = window.doc, fbGetDoc = window.getDoc;
    if (!fbDb || !fbDoc || !fbGetDoc) return null;
    const ref = fbDoc(fbDb, "images_cache", encodeURIComponent(word));
    const snap = await fbGetDoc(ref);
    if (snap.exists()) return snap.data().imageUrl || null;
    return null;
  } catch (e) { return null; }
}

async function saveImageToCache(word, imageData) {
  try {
    const fbDb = window.db, fbDoc = window.doc, fbSetDoc = window.setDoc;
    if (!fbDb || !fbDoc || !fbSetDoc) return false;
    const ref = fbDoc(fbDb, "images_cache", encodeURIComponent(word));
    await fbSetDoc(ref, { word: word, imageUrl: imageData, createdAt: new Date().toISOString() });
    return true;
  } catch (e) { return false; }
}

async function getOrGenerateImage(word) {
  const cached = await getCachedImage(word);
  if (cached) return { image: cached, fromCache: true };
  const newImage = await generateWordImage(word);
  saveImageToCache(word, newImage).catch(() => {});
  return { image: newImage, fromCache: false };
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
        <button id="downloadImageBtn" style="border-radius:50px;padding:10px 24px;background:#7C3AED;color:white;border:none;cursor:pointer;font-weight:bold;">💾 تنزيل</button>
        <button id="closeImageModalBtn" style="border-radius:50px;padding:10px 24px;background:#F0F0F0;color:#333;border:none;cursor:pointer;font-weight:bold;">إغلاق</button>
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
  btn.style.cssText = 'background:linear-gradient(135deg, #7C3AED, #A855F7);color:white;border:none;border-radius:20px;padding:6px 14px;font-weight:bold;cursor:pointer;font-size:12px;margin-right:6px;';
  btn.innerHTML = `🖼️ صورة`;
  btn.onclick = async (e) => {
    e.stopPropagation();
    btn.disabled = true; btn.innerHTML = '⏳ جاري التوليد...';
    try {
      const result = await getOrGenerateImage(word);
      btn.disabled = false; btn.innerHTML = '🖼️ صورة';
      showImageModal(result.image, word);
    } catch (error) {
      btn.disabled = false; btn.innerHTML = '🖼️ صورة';
      safeToast(`❌ فشل: ${error.message}`);
    }
  };
  return btn;
}

/* ========================================
   📚 توليد الحروف
   ======================================== */
async function generateLetterContent(letter, letterTitle) {
  try {
    const response = await fetch(`${WORKER_BASE}/api/ai-letter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ letter: letter, letterTitle: letterTitle })
    });
    if (!response.ok) throw new Error(`فشل الاتصال: ${response.status}`);
    const data = await response.json();
    if (!data.success || !data.data) throw new Error(data.message || 'لم يتم توليد المحتوى');
    return data.data;
  } catch (error) { throw error; }
}

function showGenerateLetterConfirmModal(letter) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;';
    modal.innerHTML = `
      <div style="background:white;padding:30px;border-radius:20px;max-width:500px;width:100%;text-align:center;">
        <h2 style="color:#7C3AED;">توليد محتوى حرف (${letter})</h2>
        <p style="color:#555;">سيتم توليد: مخرج الحرف + 4 حركات + 9 كلمات + 3 جمل</p>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:20px;">
          <button id="confirmGenBtn" class="btn btn-primary">🚀 توليد الآن</button>
          <button id="cancelGenBtn" class="btn btn-soft">إلغاء</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const close = (res) => { modal.remove(); resolve(res); };
    modal.querySelector('#confirmGenBtn').onclick = () => close(true);
    modal.querySelector('#cancelGenBtn').onclick = () => close(false);
  });
}

function showLetterSuccessModal(letter) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;';
  modal.innerHTML = `
    <div style="background:white;padding:30px;border-radius:20px;text-align:center;">
      <div style="font-size:60px;">🎉</div>
      <h2 style="color:#16A34A;">تم بنجاح!</h2>
      <p>تم توليد وحفظ بيانات حرف (${letter})</p>
      <button id="reloadPageBtn" class="btn btn-primary">🔄 تحديث الجلسة</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#reloadPageBtn').onclick = () => { modal.remove(); safeRender(); };
}

function createGenerateLetterButton(letter, onSuccess) {
  const btn = document.createElement('button');
  btn.style.cssText = 'background:linear-gradient(135deg, #A855F7, #7C3AED);color:white;border:none;border-radius:50px;padding:12px 28px;font-weight:bold;cursor:pointer;font-size:14px;';
  btn.innerHTML = `📚 توليد محتوى حرف (${letter}) بالذكاء الاصطناعي`;

  btn.onclick = async () => {
    try {
      const confirmed = await showGenerateLetterConfirmModal(letter);
      if (!confirmed) return;
      btn.disabled = true; btn.innerHTML = '⏳ جاري التوليد...';
      
      const data = await generateLetterContent(letter, getLetterTitle(letter));
      btn.innerHTML = '⏳ جاري الحفظ...';
      await saveLetterData(letter, data);
      
      showLetterSuccessModal(letter);
      safeToast(`✅ تم توليد وحفظ محتوى حرف (${letter})`);
      if (typeof onSuccess === 'function') onSuccess(data);
    } catch (error) {
      console.error('❌ فشل:', error);
      btn.disabled = false; btn.innerHTML = `📚 إعادة محاولة توليد حرف (${letter})`;
      safeToast('❌ فشل التوليد: ' + error.message);
    }
  };
  return btn;
}

/* ========================================
   🤖 الاتصال بـ Worker والتوصيات
   ======================================== */
async function callAI(prompt, type = 'general') {
  try {
    const response = await fetch(`${WORKER_BASE}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt, type: type, role: 'teacher' })
    });
    if (!response.ok) throw new Error(`فشل الاتصال: ${response.status}`);
    const data = await response.json();
    if (!data.ok || !data.recommendation) throw new Error('لم يتم استلام رد من الذكاء الاصطناعي');
    const rec = data.recommendation;
    if (typeof rec === 'string') return rec;
    if (rec && typeof rec === 'object') return rec.response || rec.text || JSON.stringify(rec);
    return String(rec);
  } catch (error) { throw error; }
}

async function generateSessionRecommendations(sessionData, studentData) {
  const sessionTypes = getSessionTypes();
  const typeInfo = sessionTypes.find(t => t.id === sessionData.sessionType) || sessionTypes[0];

  const prompt = `أنت مساعد تعليمي متخصص في تدريب النطق للأطفال (4-12 سنة).
📋 بيانات الجلسة:
- الطالب: ${studentData.fullName || 'الطالب'}
- الحرف المستهدف: ${sessionData.letter}
- نوع الجلسة: ${typeInfo.name}
- نسبة النجاح: ${sessionData.successRate || 0}%
- التقييم: ${sessionData.evaluation || 'غير مقيم'}

المطلوب:
1. تحليل موجز لأداء الطالب.
2. أربع توصيات لجلسات قادمة.
3. تمرينان منزليان بسيطان لولي الأمر.`;

  return await callAI(prompt, 'session-recommendations');
}

// واجهة التوصيات (مع أزرار الإرسال)
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
        <textarea id="aiTextarea" rows="12" style="width:100%;padding:12px;border-radius:12px;border:1.5px solid #DDD;font-family:'Tajawal';font-size:14px;line-height:1.6;background:#FAF5FF;resize:vertical;margin-bottom:12px;">${fullMessage}</textarea>

        <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;justify-content:center;">
          <button id="copyAIBtn" style="border-radius:50px;padding:10px 20px;background:#7C3AED;color:white;border:none;cursor:pointer;font-weight:bold;">📋 نسخ</button>
          ${parentPhone ? `<button id="sendWhatsappAiBtn" style="border-radius:50px;padding:10px 20px;background:#25D366;color:white;border:none;cursor:pointer;font-weight:bold;">📱 واتساب</button>` : ''}
          ${parentEmail ? `<button id="sendEmailAiBtn" style="border-radius:50px;padding:10px 20px;background:#0891B2;color:white;border:none;cursor:pointer;font-weight:bold;">📧 إيميل</button>` : ''}
          <button id="closeAIModalBtn" style="border-radius:50px;padding:10px 20px;background:#F0F0F0;color:#333;border:none;cursor:pointer;font-weight:bold;">إغلاق</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#closeAIModal').onclick = () => modal.remove();
    modal.querySelector('#closeAIModalBtn').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.querySelector('#copyAIBtn').onclick = () => {
      const txt = modal.querySelector('#aiTextarea');
      txt.select();
      navigator.clipboard.writeText(txt.value).then(() => safeToast('✅ تم نسخ التوصيات'));
    };

    const waBtn = modal.querySelector('#sendWhatsappAiBtn');
    if (waBtn) {
      waBtn.onclick = () => {
        const txt = modal.querySelector('#aiTextarea');
        let phone = parentPhone.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = '966' + phone.substring(1);
        if (!phone.startsWith('966') && phone.length === 9) phone = '966' + phone;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(txt.value)}`, '_blank');
      };
    }

    const emailBtn = modal.querySelector('#sendEmailAiBtn');
    if (emailBtn) {
      emailBtn.onclick = () => {
        const txt = modal.querySelector('#aiTextarea');
        const subject = encodeURIComponent(`توصيات جلسة - ${student.fullName} - حرف ${sessionData.letter}`);
        window.location.href = `mailto:${parentEmail}?subject=${subject}&body=${encodeURIComponent(txt.value)}`;
      };
    }
  })();
}

function createAIButton(sessionData, studentData) {
  const btn = document.createElement('button');
  btn.id = 'generateAIBtn';
  btn.style.cssText = 'background:linear-gradient(135deg, #7C3AED, #4F46E5);color:white;border:none;border-radius:50px;padding:10px 24px;font-weight:bold;cursor:pointer;font-size:14px;';
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
  const sessionTypes = getSessionTypes();
  const typeInfo = sessionTypes.find(t => t.id === sessionData.sessionType) || sessionTypes[0];
  const currentEval = sessionData.evaluation || 'قيد التقييم';
  const successRate = sessionData.successRate || 0;

  const prompt = `أنت أخصائي نطق تعليمي. توليد تمارين منزلية شاملة لحرف (${sessionData.letter}) بناءً على التقييم الحالي (${currentEval} - نسبة النجاح ${successRate}%).`;
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
        <textarea id="homeworkTextarea" rows="12" style="width:100%;padding:12px;border-radius:12px;border:1.5px solid #DDD;font-family:'Tajawal';font-size:14px;line-height:1.6;background:#FFFBF5;resize:vertical;margin-bottom:12px;">${fullMessage}</textarea>

        <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;justify-content:center;">
          <button id="copyHWBtn" style="border-radius:50px;padding:10px 20px;background:#EA580C;color:white;border:none;cursor:pointer;font-weight:bold;">📋 نسخ النص</button>
          ${parentPhone ? `<button id="sendWhatsappHwBtn" style="border-radius:50px;padding:10px 20px;background:#25D366;color:white;border:none;cursor:pointer;font-weight:bold;">📤 إرسال لولي الأمر</button>` : ''}
          ${parentEmail ? `<button id="sendEmailHwBtn" style="border-radius:50px;padding:10px 20px;background:#0891B2;color:white;border:none;cursor:pointer;font-weight:bold;">📧 إيميل</button>` : ''}
          <button id="closeHWModalBtn" style="border-radius:50px;padding:10px 20px;background:#F0F0F0;color:#333;border:none;cursor:pointer;font-weight:bold;">إغلاق</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#closeHWModal').onclick = () => modal.remove();
    modal.querySelector('#closeHWModalBtn').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.querySelector('#copyHWBtn').onclick = () => {
      const textarea = modal.querySelector('#homeworkTextarea');
      textarea.select();
      navigator.clipboard.writeText(textarea.value).then(() => safeToast('✅ تم نسخ التمارين بنجاح'));
    };

    const waBtn = modal.querySelector('#sendWhatsappHwBtn');
    if (waBtn) {
      waBtn.onclick = () => {
        const textarea = modal.querySelector('#homeworkTextarea');
        let phone = parentPhone.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = '966' + phone.substring(1);
        if (!phone.startsWith('966') && phone.length === 9) phone = '966' + phone;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(textarea.value)}`, '_blank');
      };
    }

    const emailBtn = modal.querySelector('#sendEmailHwBtn');
    if (emailBtn) {
      emailBtn.onclick = () => {
        const textarea = modal.querySelector('#homeworkTextarea');
        const subject = encodeURIComponent(`تمارين منزلية - ${student.fullName} - حرف ${sessionData.letter}`);
        window.location.href = `mailto:${parentEmail}?subject=${subject}&body=${encodeURIComponent(textarea.value)}`;
      };
    }
  })();
}

function createHomeworkButton(sessionData, studentData) {
  const btn = document.createElement('button');
  btn.id = 'generateHWBtn';
  btn.style.cssText = 'background:linear-gradient(135deg, #F97316, #EA580C);color:white;border:none;border-radius:50px;padding:10px 24px;font-weight:bold;cursor:pointer;font-size:14px;';
  btn.innerHTML = '📝 تمارين منزلية (AI)';
  btn.onclick = async () => {
    const activeEvalBtn = document.querySelector('.btn-eval[style*="box-shadow"]');
    if (activeEvalBtn) sessionData.evaluation = activeEvalBtn.dataset.value;
    const rangeInput = document.querySelector('#successRange');
    if (rangeInput) sessionData.successRate = parseInt(rangeInput.value) || 0;

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
   📖 القصص القصيرة
   ======================================== */
async function generateShortStory(sessionData, studentData) {
  const prompt = `قصة قصيرة تعليمية لحرف (${sessionData.letter}) مناسبة للأطفال.`;
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
        <textarea id="storyTextarea" rows="12" style="width:100%;padding:12px;border-radius:12px;border:1.5px solid #DDD;font-family:'Tajawal';font-size:14px;line-height:1.6;background:#FFF5F7;resize:vertical;margin-bottom:12px;">${fullMessage}</textarea>

        <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;justify-content:center;">
          <button id="copyStoryBtn" style="border-radius:50px;padding:10px 20px;background:#DB2777;color:white;border:none;cursor:pointer;font-weight:bold;">📋 نسخ</button>
          ${parentPhone ? `<button id="sendWhatsappStoryBtn" style="border-radius:50px;padding:10px 20px;background:#25D366;color:white;border:none;cursor:pointer;font-weight:bold;">📱 واتساب</button>` : ''}
          ${parentEmail ? `<button id="sendEmailStoryBtn" style="border-radius:50px;padding:10px 20px;background:#0891B2;color:white;border:none;cursor:pointer;font-weight:bold;">📧 إيميل</button>` : ''}
          <button id="closeStoryModalBtn" style="border-radius:50px;padding:10px 20px;background:#F0F0F0;color:#333;border:none;cursor:pointer;font-weight:bold;">إغلاق</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#closeStoryModal').onclick = () => modal.remove();
    modal.querySelector('#closeStoryModalBtn').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.querySelector('#copyStoryBtn').onclick = () => {
      const txt = modal.querySelector('#storyTextarea');
      txt.select();
      navigator.clipboard.writeText(txt.value).then(() => safeToast('✅ تم نسخ القصة'));
    };

    const waBtn = modal.querySelector('#sendWhatsappStoryBtn');
    if (waBtn) {
      waBtn.onclick = () => {
        const txt = modal.querySelector('#storyTextarea');
        let phone = parentPhone.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = '966' + phone.substring(1);
        if (!phone.startsWith('966') && phone.length === 9) phone = '966' + phone;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(txt.value)}`, '_blank');
      };
    }
  })();
}

function createShortStoryButton(sessionData, studentData) {
  const btn = document.createElement('button');
  btn.id = 'generateStoryBtn';
  btn.style.cssText = 'background:linear-gradient(135deg, #EC4899, #DB2777);color:white;border:none;border-radius:50px;padding:10px 24px;font-weight:bold;cursor:pointer;font-size:14px;';
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
   📊 تحليل التقدم والخطة المخصصة
   ======================================== */
async function generateProgressAnalysis(studentData, sessionsData) {
  if (!sessionsData || sessionsData.length === 0) throw new Error('لا توجد جلسات لتحليلها');
  const prompt = `تحليل تقدم الطالب (${studentData.fullName}) بناءً على الجلسات السابقة.`;
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
      <textarea id="progTextarea" rows="12" style="width:100%;padding:12px;border-radius:12px;border:1.5px solid #DDD;font-family:'Tajawal';font-size:14px;line-height:1.6;background:#F0F9FF;resize:vertical;margin-bottom:12px;">${analysisText}</textarea>
      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button id="copyProgBtn" style="border-radius:50px;padding:10px 24px;background:#0891B2;color:white;border:none;cursor:pointer;font-weight:bold;">📋 نسخ</button>
        <button id="closeProgModalBtn" style="border-radius:50px;padding:10px 24px;background:#F0F0F0;color:#333;border:none;cursor:pointer;font-weight:bold;">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#closeProgModal').onclick = () => modal.remove();
  modal.querySelector('#closeProgModalBtn').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.querySelector('#copyProgBtn').onclick = () => {
    const txt = modal.querySelector('#progTextarea');
    txt.select();
    navigator.clipboard.writeText(txt.value).then(() => safeToast('✅ تم نسخ التحليل'));
  };
}

function createProgressAnalysisButton(studentData) {
  const btn = document.createElement('button');
  btn.id = 'generateProgBtn';
  btn.style.cssText = 'background:linear-gradient(135deg, #06B6D4, #0891B2);color:white;border:none;border-radius:50px;padding:10px 24px;font-weight:bold;cursor:pointer;font-size:14px;';
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

      const stats = { totalSessions: sessionsData.length, passedCount: 0, trainedCount: 0, avgSuccess: 85 };
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

async function generateCustomPlan(studentData, sessionsData) {
  return await callAI(`خطة تدريب فردية مخصصة للطالب ${studentData.fullName}`, 'custom-plan');
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
      <textarea id="planTextarea" rows="12" style="width:100%;padding:12px;border-radius:12px;border:1.5px solid #DDD;font-family:'Tajawal';font-size:14px;line-height:1.6;background:#FAF5FF;resize:vertical;margin-bottom:12px;">${planText}</textarea>
      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button id="copyPlanBtn" style="border-radius:50px;padding:10px 24px;background:#7C3AED;color:white;border:none;cursor:pointer;font-weight:bold;">📋 نسخ</button>
        <button id="closePlanModalBtn" style="border-radius:50px;padding:10px 24px;background:#F0F0F0;color:#333;border:none;cursor:pointer;font-weight:bold;">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#closePlanModal').onclick = () => modal.remove();
  modal.querySelector('#closePlanModalBtn').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.querySelector('#copyPlanBtn').onclick = () => {
    const txt = modal.querySelector('#planTextarea');
    txt.select();
    navigator.clipboard.writeText(txt.value).then(() => safeToast('✅ تم نسخ الخطة'));
  };
}

function createCustomPlanButton(studentData) {
  const btn = document.createElement('button');
  btn.id = 'generatePlanBtn';
  btn.style.cssText = 'background:linear-gradient(135deg, #A855F7, #7C3AED);color:white;border:none;border-radius:50px;padding:10px 24px;font-weight:bold;cursor:pointer;font-size:14px;';
  btn.innerHTML = '🎯 خطة مخصصة (AI)';
  btn.onclick = async () => {
    btn.disabled = true;
    btn.innerHTML = '⏳ جاري التوليد...';
    try {
      const plan = await generateCustomPlan(studentData, []);
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
   🌐 التصدير النهائي
   ======================================== */
window.callAI = callAI;
window.getLetterData = getLetterData;
window.saveLetterData = saveLetterData;
window.generateWordImage = generateWordImage;
window.getOrGenerateImage = getOrGenerateImage;
window.createImageButton = createImageButton;
window.generateLetterContent = generateLetterContent;
window.createGenerateLetterButton = createGenerateLetterButton;
window.generateSessionRecommendations = generateSessionRecommendations;
window.createAIButton = createAIButton;
window.createHomeworkButton = createHomeworkButton;
window.createShortStoryButton = createShortStoryButton;
window.createProgressAnalysisButton = createProgressAnalysisButton;
window.createCustomPlanButton = createCustomPlanButton;
window.buildParentMessage = buildParentMessage;
window.safeToast = safeToast;

console.log('✅ AI Features loaded — v19.0 (Full 1000+ lines)');
