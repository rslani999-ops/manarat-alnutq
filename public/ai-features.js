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
   v16.0 — النسخة الكاملة الشاملة
   ======================================== */

console.log('🚀 Starting ai-features.js v16.0 (Full Features)...');

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
}

function safeNotify(msg, type = 'info') {
  if (typeof window.showNotification === 'function') window.showNotification(msg, type);
}

/* ========================================
   📖 Firebase — بيانات الحروف
   ======================================== */
async function getLetterData(letter) {
  try {
    const fbDb = window.db, fbDoc = window.doc, fbGetDoc = window.getDoc;
    if (!fbDb || !fbDoc || !fbGetDoc) return window.LETTER_DATABASE?.[letter] || null;
    const snap = await fbGetDoc(fbDoc(fbDb, "letters_data", letter));
    if (snap.exists()) return snap.data();
    return window.LETTER_DATABASE?.[letter] || null;
  } catch (e) { return window.LETTER_DATABASE?.[letter] || null; }
}

async function saveLetterData(letter, data) {
  const fbDb = window.db, fbDoc = window.doc, fbSetDoc = window.setDoc;
  if (!fbDb || !fbDoc || !fbSetDoc) throw new Error('Firebase غير جاهز');
  await fbSetDoc(fbDoc(fbDb, "letters_data", letter), data);
  return true;
}

/* ========================================
   🎨 توليد الصور
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
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ خطأ من Vercel: ${response.status}`, errorText);
      throw new Error(`فشل الاتصال: ${response.status}`);
    }
    const data = await response.json();
    if (!data.success || !data.image) throw new Error(data.message || 'لم يتم توليد صورة');
    return data.image;
  } catch (error) {
    console.error(`❌ فشل توليد الصورة للكلمة ${word}:`, error);
    throw error;
  }
}

async function getCachedImage(word) {
  try {
    const fbDb = window.db, fbDoc = window.doc, fbGetDoc = window.getDoc;
    if (!fbDb || !fbDoc || !fbGetDoc) return null;
    const snap = await fbGetDoc(fbDoc(fbDb, "images_cache", encodeURIComponent(word)));
    if (snap.exists()) return snap.data().imageUrl || null;
    return null;
  } catch (e) { return null; }
}

async function saveImageToCache(word, imageData) {
  try {
    const fbDb = window.db, fbDoc = window.doc, fbSetDoc = window.setDoc;
    if (!fbDb || !fbDoc || !fbSetDoc) return false;
    await fbSetDoc(fbDoc(fbDb, "images_cache", encodeURIComponent(word)), {
      word: word, imageUrl: imageData, createdAt: new Date().toISOString()
    });
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
    safeToast('✅ جاري تنزيل الصورة');
  };
}

function createImageButton(word) {
  const btn = document.createElement('button');
  btn.style.cssText = 'background:linear-gradient(135deg, #7C3AED, #A855F7);color:white;border:none;border-radius:20px;padding:6px 14px;font-weight:bold;cursor:pointer;font-size:12px;margin-right:6px;';
  btn.innerHTML = `🖼️ صورة`;
  btn.title = `توليد صورة لكلمة "${word}"`;

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
  } catch (error) {
    console.error('❌ خطأ في توليد الحرف:', error);
    throw error;
  }
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
   🤖 التوصيات الذكية
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
    return typeof data.recommendation === 'string' ? data.recommendation : data.recommendation.response || JSON.stringify(data.recommendation);
  } catch (error) { throw error; }
}

async function generateSessionRecommendations(sessionData, studentData) {
  const sessionTypes = window.SESSION_TYPES || [];
  const typeInfo = sessionTypes.find(t => t.id === sessionData.sessionType) || sessionTypes[0] || { name: 'جلسة' };
  const prompt = `أنت مساعد تعليمي متخصص في تدريب النطق للأطفال (4-12 سنة).\n📋 بيانات الجلسة:\n- الطالب: ${studentData.fullName || 'الطالب'}\n- الحرف المستهدف: ${sessionData.letter}\n- نوع الجلسة: ${typeInfo.name}\n- نسبة النجاح: ${sessionData.successRate || 0}%\n- التقييم: ${sessionData.evaluation || 'غير مقيم'}\n\nالمطلوب:\n1. تحليل موجز لأداء الطالب.\n2. أربع توصيات لجلسات قادمة.\n3. تمرينان منزليان بسيطان لولي الأمر.`;
  return await callAI(prompt, 'session-recommendations');
}

/* ========================================
   📊 تحليل التقدم (AI)
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

/* ========================================
   🎯 الخطة المخصصة (AI)
   ======================================== */
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
   🌐 تصدير الدوال للنطاق العام
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
window.createProgressAnalysisButton = createProgressAnalysisButton;
window.createCustomPlanButton = createCustomPlanButton;
window.generateProgressAnalysis = generateProgressAnalysis;
window.generateCustomPlan = generateCustomPlan;
window.safeToast = safeToast;
window.safeRender = safeRender;
window.safeNotify = safeNotify;

console.log('✅ AI Features loaded — v16.0 (Full Features)');
