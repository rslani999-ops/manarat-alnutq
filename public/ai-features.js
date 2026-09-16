/* ========================================
   منارة النطق - ميزات الذكاء الاصطناعي
   Manarat Al-Nutq - AI Features
   v9.1 — إضافة توليد الصور + التخزين المؤقت
   ========================================
   
   📋 التغييرات في v9.1:
   ✅ إضافة توليد صور الكلمات عبر Cloudflare Workers AI
   ✅ إضافة تخزين مؤقت في Firebase Storage (توفير رصيد AI)
   ✅ إضافة عرض الصور في نافذة للمعلم
   ✅ إصلاح: حذف createGenerateLettersButton (توليد جماعي)
   ✅ تحسين: استخدام window.render / window.showToast الآمنة
   ======================================== */

console.log('🚀 Starting ai-features.js v9.1...');

/* ========================================
   0. دوال مساعدة آمنة (Safe Helpers)
   ======================================== */

function safeRender() {
  if (typeof window.render === 'function') {
    window.render();
  } else {
    console.warn('⚠️ render() غير متوفرة في window');
  }
}

function safeToast(msg) {
  if (typeof window.showToast === 'function') {
    window.showToast(msg);
  } else {
    console.log('TOAST:', msg);
  }
}

function safeNotify(msg, type = 'info') {
  if (typeof window.showNotification === 'function') {
    window.showNotification(msg, type);
  }
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

/* ========================================
   🆕 القسم الجديد: توليد الصور
   ======================================== */

// عنوان Cloudflare Worker
const CLOUDFLARE_WORKER_URL = 'https://manarat-alnutq.rslani999.workers.dev';

/* ========================================
   🆕 0.1 توليد صورة من Cloudflare Worker
   ======================================== */
async function generateWordImage(word) {
  if (!word) throw new Error('الكلمة مطلوبة');
  
  try {
    console.log(`🎨 جاري توليد صورة للكلمة: ${word}`);
    
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/api/ai-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: word })
    });
    
    if (!response.ok) {
      throw new Error(`فشل الاتصال: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.image) {
      throw new Error(data.message || 'لم يتم توليد صورة');
    }
    
    console.log(`✅ تم توليد صورة للكلمة: ${word}`);
    return data.image; // data:image/png;base64,...
    
  } catch (error) {
    console.error('❌ خطأ في توليد الصورة:', error);
    throw error;
  }
}

/* ========================================
   🆕 0.2 البحث عن صورة في Firebase Cache
   ======================================== */
async function getCachedImage(word) {
  try {
    const fbDb = window.db;
    const fbDoc = window.doc;
    const fbGetDoc = window.getDoc;
    
    if (!fbDb || !fbDoc || !fbGetDoc) {
      console.warn('⚠️ Firebase غير جاهز — تخطي التخزين المؤقت');
      return null;
    }
    
    // استخدام اسم آمن للملف (لتجنب مشاكل الرموز العربية)
    const cacheKey = encodeURIComponent(word);
    const ref = fbDoc(fbDb, "images_cache", cacheKey);
    const snap = await fbGetDoc(ref);
    
    if (snap.exists()) {
      const data = snap.data();
      console.log(`✅ صورة موجودة في Cache: ${word}`);
      return data.imageUrl || null;
    }
    
    return null;
    
  } catch (e) {
    console.warn('⚠️ خطأ في البحث عن صورة مخزنة:', e);
    return null;
  }
}

/* ========================================
   🆕 0.3 حفظ صورة في Firebase Cache
   ======================================== */
async function saveImageToCache(word, imageData) {
  try {
    const fbDb = window.db;
    const fbDoc = window.doc;
    const fbSetDoc = window.setDoc;
    
    if (!fbDb || !fbDoc || !fbSetDoc) {
      console.warn('⚠️ Firebase غير جاهز — لا يمكن الحفظ');
      return false;
    }
    
    const cacheKey = encodeURIComponent(word);
    const ref = fbDoc(fbDb, "images_cache", cacheKey);
    
    await fbSetDoc(ref, {
      word: word,
      imageUrl: imageData,
      createdAt: new Date().toISOString()
    });
    
    console.log(`💾 تم حفظ صورة في Cache: ${word}`);
    return true;
    
  } catch (e) {
    console.warn('⚠️ خطأ في حفظ الصورة:', e);
    return false;
  }
}

/* ========================================
   🆕 0.4 الدالة الموحدة: getOrGenerateImage
   (تتحقق من Cache أولاً، ثم تولد إن لم توجد)
   ======================================== */
async function getOrGenerateImage(word) {
  if (!word) throw new Error('الكلمة مطلوبة');
  
  // 1. البحث في Cache
  let cachedImage = await getCachedImage(word);
  if (cachedImage) {
    return { image: cachedImage, fromCache: true };
  }
  
  // 2. التوليد من Cloudflare
  const newImage = await generateWordImage(word);
  
  // 3. الحفظ في Cache (بدون انتظار)
  saveImageToCache(word, newImage).catch(e => 
    console.warn('⚠️ فشل حفظ الصورة في Cache:', e)
  );
  
  return { image: newImage, fromCache: false };
}

/* ========================================
   🆕 0.5 عرض الصورة في نافذة
   ======================================== */
function showImageModal(imageUrl, word) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;';
  
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:600px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;color:#7C3AED;">🖼️ صورة كلمة: ${word}</h3>
        <button id="closeImageModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>
      
      <div style="background:#F8FAFC;border-radius:16px;padding:16px;margin-bottom:16px;display:flex;align-items:center;justify-content:center;min-height:300px;">
        <img src="${imageUrl}" alt="${word}" style="max-width:100%;max-height:400px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
      </div>
      
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-primary" id="downloadImageBtn" style="border-radius:50px;padding:10px 24px;background:#7C3AED;color:white;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">
          💾 تنزيل الصورة
        </button>
        <button class="btn btn-soft" id="closeImageModalBtn" style="border-radius:50px;padding:10px 24px;background:#F0F0F0;color:#333;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">
          إغلاق
        </button>
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

/* ========================================
   🆕 0.6 زر توليد صورة للكلمة (للاستخدام في الجلسة)
   ======================================== */
function createImageButton(word) {
  const btn = document.createElement('button');
  btn.className = 'generate-image-btn';
  btn.style.cssText = 'background:linear-gradient(135deg, #7C3AED, #A855F7);color:white;border:none;border-radius:20px;padding:6px 14px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:12px;margin-right:6px;transition:0.2s;';
  btn.innerHTML = `🖼️ صورة`;
  btn.title = `توليد صورة لكلمة "${word}"`;
  
  btn.onclick = async (e) => {
    e.stopPropagation();
    
    // تعطيل الزر
    btn.disabled = true;
    btn.style.opacity = '0.6';
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ جاري التوليد...';
    
    try {
      const result = await getOrGenerateImage(word);
      
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = originalText;
      
      // عرض الصورة
      showImageModal(result.image, word);
      
      // إشعار
      if (result.fromCache) {
        safeToast(`✅ صورة "${word}" من الذاكرة`);
      } else {
        safeToast(`✅ تم توليد صورة "${word}"`);
        safeNotify(`تم توليد صورة جديدة لكلمة "${word}"`, 'success');
      }
      
    } catch (error) {
      console.error('❌ فشل توليد الصورة:', error);
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = originalText;
      safeToast(`❌ فشل: ${error.message}`);
    }
  };
  
  return btn;
}

/* ========================================
   🆕 0.7 زر توليد محتوى الحرف (للجلسة)
   ======================================== */
function createGenerateLetterButtonForSession(letter, onSuccess) {
  const btn = document.createElement('button');
  btn.id = `generateLetterBtn_${letter}`;
  btn.style.cssText = 'background:linear-gradient(135deg, #A855F7, #7C3AED);color:white;border:none;border-radius:50px;padding:12px 28px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:14px;transition:0.2s;';
  btn.innerHTML = `📚 توليد محتوى حرف (${letter}) بالذكاء الاصطناعي`;
  
  btn.onclick = async () => {
    try {
      const confirmed = await showGenerateLetterConfirmModal(letter);
      if (!confirmed) return;
      
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.innerHTML = '⏳ جاري التوليد...';
      
      const data = await generateSingleLetterData(letter);
      await saveLetterData(letter, data);
      
      showLetterSuccessModal(letter);
      
      safeToast(`✅ تم توليد بيانات حرف (${letter})`);
      safeNotify(`تم توليد محتوى حرف (${letter})`, 'success');
      
      if (typeof onSuccess === 'function') onSuccess(data);
      
    } catch (error) {
      console.error('❌ فشل التوليد:', error);
      safeToast('❌ فشل التوليد: ' + error.message);
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = `📚 إعادة محاولة توليد حرف (${letter})`;
    }
  };
  
  return btn;
}























/* ========================================
   1. الدالة الرئيسية لاستدعاء Gemini AI
   ======================================== */
async function callGeminiAI(prompt, type = 'general') {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, type })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'فشل الاتصال بالذكاء الاصطناعي');
    }

    const data = await response.json();
    if (!data.success || !data.text) {
      throw new Error(data.message || 'لم يتم استلام رد من الذكاء الاصطناعي');
    }
    return data.text;
  } catch (error) {
    console.error('AI Error:', error);
    throw error;
  }
}

/* ========================================
   2. توليد توصيات ذكية بعد جلسة
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

  return await callGeminiAI(prompt, 'session-recommendations');
}

/* ========================================
   3. توليد التمارين المنزلية
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

  return await callGeminiAI(prompt, 'homework');
}

/* ========================================
   4. توليد تحليل تقدم الطالب
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

  return await callGeminiAI(prompt, 'progress-analysis');
}

/* ========================================
   5. توليد خطة تدريب مخصصة
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
📅 خطة 4 أسابيع (كل أسبوع: أهداف + جلستان: الأحد+الثلاثاء / الاثنين+الأربعاء + حروف + أنشطة)
🎯 أولويات التدريب
📝 أنشطة مخصصة لكل حرف
🏠 التمارين المنزلية الأسبوعية
📊 مؤشرات قياس التقدم
⚠️ تحذيرات وتنبيهات
🎉 المكافآت والتحفيز

اكتب بأسلوب عملي ومبني على البيانات، بالعربية الفصحى.
`;

  return await callGeminiAI(prompt, 'custom-plan');
}

/* ========================================
   6. توليد قصة قصيرة تعليمية
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

  return await callGeminiAI(prompt, 'short-story');
}

/* ========================================
   7. توليد بيانات حرف واحد
   ======================================== */
async function generateSingleLetterData(letter) {
  const letterTitle = getLetterTitle(letter);
  
  const prompt = `
أنت خبير في اللغة العربية وتعليم النطق للأطفال.
المطلوب: توليد بيانات كاملة لحرف واحد فقط: "${letter}".

📌 الحرف: ${letter} (مثال: ${letterTitle})

━━━━━━━━━━━━━━━━━━━━━━━━━━
المطلوب:
━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 📍 مخرج الحرف (وصف مختصر جداً: مثلاً "انطباق الشفتين")
2. 📖 الحرف مع الحركات الأربعة:
   - فتحة (مثل: بَ)
   - ضمة (مثل: بُ)
   - كسرة (مثل: بِ)
   - سكون (مثل: بْ)
3. 📝 3 كلمات:
   - بداية الكلمة (مثل: بَاب)
   - وسط الكلمة (مثل: جَبَل)
   - نهاية الكلمة (مثل: عِنَب)
4. ✍️ 3 جمل بسيطة تحتوي على الحرف (مناسبة للأطفال 4-12 سنة)

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ مهم جداً:
━━━━━━━━━━━━━━━━━━━━━━━━━━

- أرجع الإجابة **بصيغة JSON صحيحة فقط** (بدون شرح أو نص إضافي)
- **لا تستخدم علامات \`\`\` أو أي تنسيق آخر**
- ابدأ مباشرة بـ { وانتهي بـ }

الصيغة المطلوبة:

{
  "place": "وصف مخرج الحرف",
  "vowels": {"fatha": "${letter}َ", "damma": "${letter}ُ", "kasra": "${letter}ِ", "sukoon": "${letter}ْ"},
  "words": {"start": ["كلمة1", "كلمة2", "كلمة3"], "middle": ["كلمة1", "كلمة2", "كلمة3"], "end": ["كلمة1", "كلمة2", "كلمة3"]},
  "sentences": ["جملة 1", "جملة 2", "جملة 3"]
}

⚠️ تأكد من:
1. JSON صحيح 100%
2. الكلمات تبدأ فعلاً بالحرف "${letter}"
3. الجمل بسيطة ومناسبة للأطفال
4. الجمل تحتوي على الحرف "${letter}"
`;

  const response = await callGeminiAI(prompt, 'single-letter-data');
  
  let jsonText = response.trim();
  jsonText = jsonText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  jsonText = jsonText.replace(/^[^{]*/, '');
  jsonText = jsonText.replace(/[^}]*$/, '');
  
  const firstBrace = jsonText.indexOf('{');
  const lastBrace = jsonText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
  }
  
  try {
    const data = JSON.parse(jsonText);
    if (!data.place || !data.vowels || !data.words || !data.sentences) {
      throw new Error('بيانات الحرف غير مكتملة');
    }
    return data;
  } catch (e) {
    console.error('❌ فشل تحليل JSON:', e);
    console.error('النص المُستلم:', jsonText.substring(0, 300));
    throw new Error('فشل تحليل JSON من Gemini — حاول مرة أخرى');
  }
}

/* ========================================
   8. جلب بيانات حرف واحد من Firebase
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
    
    if (snap.exists()) {
      return snap.data();
    }
    
    return window.LETTER_DATABASE?.[letter] || null;
  } catch (e) {
    console.warn('خطأ في جلب بيانات الحرف:', e);
    return window.LETTER_DATABASE?.[letter] || null;
  }
}

/* ========================================
   9. حفظ بيانات حرف في Firebase
   ======================================== */
async function saveLetterData(letter, data) {
  try {
    const fbDb = window.db;
    const fbDoc = window.doc;
    const fbSetDoc = window.setDoc;
    
    if (!fbDb || !fbDoc || !fbSetDoc) {
      throw new Error('Firebase غير جاهز');
    }
    
    await fbSetDoc(fbDoc(fbDb, "letters_data", letter), data);
    return true;
  } catch (e) {
    console.error('خطأ في حفظ بيانات الحرف:', e);
    throw e;
  }
}

/* ========================================
   10. عرض نافذة تأكيد التوليد
   ======================================== */
function showGenerateLetterConfirmModal(letter) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.id = 'generateLetterModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;';
    
    modal.innerHTML = `
      <div style="background:white;padding:30px;border-radius:20px;max-width:500px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:60px;margin-bottom:10px;">📚</div>
          <h2 style="margin:0;color:#7C3AED;">توليد محتوى حرف (${letter})</h2>
        </div>
        
        <div style="background:#F3E8FF;padding:18px;border-radius:12px;margin-bottom:20px;border-right:4px solid #7C3AED;">
          <p style="margin:0;font-size:13px;color:#5B21B6;line-height:1.7;">
            سيتم توليد البيانات التالية بالذكاء الاصطناعي:
          </p>
          <ul style="margin:10px 0 0 0;padding-right:20px;font-size:13px;color:#333;line-height:1.8;">
            <li>📍 مخرج الحرف</li>
            <li>📖 4 حركات</li>
            <li>📝 3 كلمات (بداية، وسط، نهاية)</li>
            <li>✍️ 3 جمل بسيطة</li>
          </ul>
        </div>
        
        <p style="margin:0 0 15px 0;font-size:12px;color:#999;text-align:center;">
          ⚠️ سيستغرق 5-10 ثواني
        </p>
        
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button class="btn" id="confirmGenerateBtn" style="background:linear-gradient(135deg, #A855F7, #7C3AED);color:white;border:none;border-radius:50px;padding:12px 30px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:15px;">
            🚀 توليد الآن
          </button>
          <button class="btn" id="cancelGenerateBtn" style="background:#F0F0F0;color:#333;border:none;border-radius:50px;padding:12px 30px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:15px;">
            إلغاء
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = (result) => {
      modal.remove();
      resolve(result);
    };
    
    modal.querySelector('#confirmGenerateBtn').onclick = () => closeModal(true);
    modal.querySelector('#cancelGenerateBtn').onclick = () => closeModal(false);
    modal.onclick = (e) => { if (e.target === modal) closeModal(false); };
  });
}

/* ========================================
   11. عرض نافذة نجاح التوليد
   ======================================== */
function showLetterSuccessModal(letter) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;';
  
  modal.innerHTML = `
    <div style="background:white;padding:30px;border-radius:20px;max-width:450px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
      <div style="font-size:80px;margin-bottom:15px;">🎉</div>
      <h2 style="margin:0 0 10px 0;color:#16A34A;">تم بنجاح!</h2>
      <p style="margin:0 0 20px 0;color:#555;font-size:15px;">
        تم توليد وحفظ بيانات حرف <strong>(${letter})</strong>
      </p>
      <p style="margin:0 0 20px 0;color:#999;font-size:13px;">
        ستظهر البيانات الجديدة في الجلسة الآن
      </p>
      <button class="btn" id="reloadPageBtn" style="background:linear-gradient(135deg, #16A34A, #22C55E);color:white;border:none;border-radius:50px;padding:12px 30px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:15px;">
        🔄 تحديث الجلسة
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#reloadPageBtn').onclick = () => {
    modal.remove();
    safeRender();
  };
}

/* ========================================
   12. إصلاح الخطأ #2: دالة إرسال التقرير لولي الأمر
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

function showSendToParentOptionsModal(sessionData, studentData) {
  const parentEmail = studentData.parentEmail || '';
  const parentPhone = studentData.parentPhone || '';
  const parentName = studentData.parentName || 'ولي الأمر';
  const studentName = studentData.fullName || studentData.email || 'الطالب';
  
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
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
      
      <div style="background:#FEF3C7;padding:14px;border-radius:12px;margin-bottom:20px;border-right:4px solid #F59E0B;">
        <p style="margin:0;font-size:13px;color:#92400E;">
          💡 اختر طريقة الإرسال المناسبة. سيتم توليد نص التقرير تلقائياً.
        </p>
      </div>
      
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn" id="sendViaEmailBtn" style="background:linear-gradient(135deg, #0891B2, #06B6D4);color:white;border:none;border-radius:50px;padding:14px 24px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:15px;${!parentEmail ? 'opacity:0.5;cursor:not-allowed;' : ''}" ${!parentEmail ? 'disabled' : ''}>
          📧 إرسال بالبريد الإلكتروني ${!parentEmail ? '(غير متوفر)' : ''}
        </button>
        
        <button class="btn" id="sendViaWhatsappBtn" style="background:linear-gradient(135deg, #25D366, #128C7E);color:white;border:none;border-radius:50px;padding:14px 24px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:15px;${!parentPhone ? 'opacity:0.5;cursor:not-allowed;' : ''}" ${!parentPhone ? 'disabled' : ''}>
          💬 إرسال عبر واتساب ${!parentPhone ? '(غير متوفر)' : ''}
        </button>
        
        <button class="btn" id="copyReportBtn" style="background:linear-gradient(135deg, #7C3AED, #A855F7);color:white;border:none;border-radius:50px;padding:14px 24px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:15px;">
          📋 نسخ نص التقرير
        </button>
      </div>
      
      <div style="margin-top:20px;padding-top:20px;border-top:2px dashed var(--line);">
        <details>
          <summary style="cursor:pointer;font-weight:bold;color:var(--mint-deep);font-size:14px;">👁️ معاينة نص التقرير</summary>
          <div id="reportPreview" style="margin-top:12px;background:#FAFDFC;padding:14px;border-radius:12px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:300px;overflow-y:auto;color:var(--text);"></div>
        </details>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeModal = () => modal.remove();
  modal.querySelector('#closeSendModal').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  
  const reportText = generateParentReportText(sessionData, studentData);
  const previewEl = modal.querySelector('#reportPreview');
  if (previewEl) previewEl.textContent = reportText;
  
  const emailBtn = modal.querySelector('#sendViaEmailBtn');
  if (emailBtn && !emailBtn.disabled) {
    emailBtn.onclick = () => {
      const subject = encodeURIComponent(`تقرير جلسة نطق - ${studentName}`);
      const body = encodeURIComponent(reportText);
      window.location.href = `mailto:${parentEmail}?subject=${subject}&body=${body}`;
      safeToast('📧 جاري فتح البريد...');
      closeModal();
    };
  }
  
  const whatsappBtn = modal.querySelector('#sendViaWhatsappBtn');
  if (whatsappBtn && !whatsappBtn.disabled) {
    whatsappBtn.onclick = () => {
      let phone = parentPhone.replace(/\D/g, '');
      if (phone.startsWith('0')) phone = '966' + phone.substring(1);
      if (!phone.startsWith('966') && phone.length === 9) phone = '966' + phone;
      const message = encodeURIComponent(reportText);
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      safeToast('💬 جاري فتح واتساب...');
      closeModal();
    };
  }
  
  const copyBtn = modal.querySelector('#copyReportBtn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(reportText).then(() => {
        safeToast('✅ تم نسخ التقرير');
        safeNotify('تم نسخ التقرير للحافظة', 'success');
      }).catch(() => {
        safeToast('❌ فشل النسخ');
      });
    };
  }
}

function generateParentReportText(sessionData, studentData) {
  const studentName = studentData.fullName || studentData.email || 'الطالب';
  const parentName = studentData.parentName || 'ولي الأمر';
  const sessionTypes = getSessionTypes();
  const typeInfo = sessionTypes.find(t => t.id === sessionData.sessionType) || sessionTypes[0];
  const evalLabels = {
    'passed': '✅ اجتاز بنجاح',
    'trained': '🔄 اجتاز بعد تدريب',
    'need': '⚠️ يحتاج مزيداً من التدريب',
    'unclear': '❌ غير واضح',
    'none': '⏳ قيد التقييم'
  };
  const evalText = evalLabels[sessionData.evaluation] || 'قيد التقييم';
  
  const lines = [
    `السلام عليكم ${parentName} 🌟`,
    '',
    `📋 تقرير جلسة نطق`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 الطالب: ${studentName}`,
    `🔤 الحرف المستهدف: (${sessionData.letter})`,
    `📚 نوع الجلسة: ${typeInfo.name}`,
    `📅 التاريخ: ${sessionData.date || 'غير محدد'}`,
    `⏱️ المدة: ${sessionData.duration || '30 دقيقة'}`,
    '',
    `🎯 الهدف:`,
    `${sessionData.goal || 'غير محدد'}`,
    '',
    `📊 التقييم: ${evalText}`,
    `📈 نسبة النجاح: ${sessionData.successRate || 0}%`,
    ''
  ];
  
  if (sessionData.recommendations) {
    lines.push(
      `💡 التوصيات:`,
      `${sessionData.recommendations}`,
      ''
    );
  }
  
  lines.push(
    `━━━━━━━━━━━━━━━━━━━━`,
    `🏠 نرجو متابعة التدريب المنزلي بانتظام`,
    `📞 للاستفسار: منصة منارة النطق`,
    '',
    `مع تمنياتنا بالتوفيق 🌸`,
    `منارة النطق - منصة تدريب النطق`
  );
  
  return lines.join('\n');
}

/* ========================================
   13. عرض توصيات AI
   ======================================== */
function showAIRecommendationsModal(recommendations, sessionData) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:650px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;color:var(--mint-deep);">🤖 توصيات الذكاء الاصطناعي</h3>
        <button id="closeAIModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>
      <div style="background:#F0FDFA;padding:16px;border-radius:12px;margin-bottom:16px;border-right:4px solid var(--mint-deep);">
        <div style="font-size:13px;color:#555;"><strong>📋 جلسة:</strong> حرف (${sessionData.letter})</div>
        <div style="font-size:13px;color:#555;"><strong>📊 نسبة النجاح:</strong> ${sessionData.successRate || 0}%</div>
      </div>
      <div style="font-size:15px;line-height:2;color:var(--text);white-space:pre-wrap;background:#FAFDFC;padding:18px;border-radius:12px;">${recommendations}</div>
      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="btn btn-primary" id="copyAIBtn" style="border-radius:50px;padding:10px 24px;">📋 نسخ</button>
        <button class="btn btn-soft" id="saveAIBtn" style="border-radius:50px;padding:10px 24px;">💾 حفظ</button>
        <button class="btn btn-soft" id="closeAIModalBtn" style="border-radius:50px;padding:10px 24px;">إغلاق</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  const closeModal = () => modal.remove();
  modal.querySelector('#closeAIModal').onclick = closeModal;
  modal.querySelector('#closeAIModalBtn').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  
  modal.querySelector('#copyAIBtn').onclick = () => {
    navigator.clipboard.writeText(recommendations).then(() => {
      safeToast('✅ تم نسخ التوصيات');
    });
  };
  
  modal.querySelector('#saveAIBtn').onclick = () => {
    closeModal();
    saveAIToSession(sessionData.id, recommendations);
  };
}

/* ========================================
   14. عرض التمارين المنزلية
   ======================================== */
function showHomeworkModal(homeworkText, sessionData) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:700px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;color:#EA580C;">📝 التمارين المنزلية</h3>
        <button id="closeHWModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>
      <div style="background:#FFF7ED;padding:16px;border-radius:12px;margin-bottom:16px;border-right:4px solid #EA580C;">
        <div style="font-size:13px;color:#555;"><strong>📋 جلسة:</strong> حرف (${sessionData.letter})</div>
        <div style="font-size:13px;color:#555;"><strong>📊 نسبة النجاح:</strong> ${sessionData.successRate || 0}%</div>
      </div>
      <div style="font-size:15px;line-height:2;color:var(--text);white-space:pre-wrap;background:#FFFBF5;padding:18px;border-radius:12px;">${homeworkText}</div>
      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="btn btn-primary" id="copyHWBtn" style="border-radius:50px;padding:10px 24px;background:#EA580C;">📋 نسخ</button>
        <button class="btn btn-success" id="sendHWToParentBtn" style="border-radius:50px;padding:10px 24px;">📤 إرسال لولي الأمر</button>
        <button class="btn btn-soft" id="saveHWBtn" style="border-radius:50px;padding:10px 24px;">💾 حفظ</button>
        <button class="btn btn-soft" id="closeHWModalBtn" style="border-radius:50px;padding:10px 24px;">إغلاق</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  const closeModal = () => modal.remove();
  modal.querySelector('#closeHWModal').onclick = closeModal;
  modal.querySelector('#closeHWModalBtn').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  
  modal.querySelector('#copyHWBtn').onclick = () => {
    navigator.clipboard.writeText(homeworkText).then(() => {
      safeToast('✅ تم نسخ التمارين');
    });
  };
  
  modal.querySelector('#sendHWToParentBtn').onclick = () => {
    try {
      let targetStudent = null;
      if (typeof window.getCurrentStudent === 'function') {
        targetStudent = window.getCurrentStudent();
      }
      if (!targetStudent && window.state?.currentStudent) {
        targetStudent = window.state.currentStudent;
      }
      
      if (!targetStudent) {
        safeToast('⚠️ اختر طالباً أولاً');
        return;
      }
      
      const sessionWithHW = { 
        ...sessionData, 
        recommendations: `📝 التمارين المنزلية:\n\n${homeworkText}` 
      };
      
      sendSessionToParent(sessionWithHW, targetStudent);
      closeModal();
    } catch (e) {
      console.error('خطأ في الإرسال:', e);
      safeToast('⚠️ خطأ: ' + e.message);
    }
  };
  
  modal.querySelector('#saveHWBtn').onclick = () => {
    closeModal();
    saveHomeworkToSession(sessionData.id, homeworkText);
  };
}

/* ========================================
   15. عرض تحليل التقدم
   ======================================== */
function showProgressAnalysisModal(analysisText, studentData, stats) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:750px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
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
      
      <div style="font-size:15px;line-height:2;color:var(--text);white-space:pre-wrap;background:#F0F9FF;padding:18px;border-radius:12px;">${analysisText}</div>
      
      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="btn btn-primary" id="copyProgBtn" style="border-radius:50px;padding:10px 24px;background:#0891B2;">📋 نسخ</button>
        <button class="btn btn-soft" id="printProgBtn" style="border-radius:50px;padding:10px 24px;">🖨️ طباعة</button>
        <button class="btn btn-soft" id="closeProgModalBtn" style="border-radius:50px;padding:10px 24px;">إغلاق</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  const closeModal = () => modal.remove();
  modal.querySelector('#closeProgModal').onclick = closeModal;
  modal.querySelector('#closeProgModalBtn').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  
  modal.querySelector('#copyProgBtn').onclick = () => {
    navigator.clipboard.writeText(analysisText).then(() => {
      safeToast('✅ تم نسخ التحليل');
    });
  };
  
  modal.querySelector('#printProgBtn').onclick = () => {
    let printArea = document.getElementById('iep-print-area');
    if (!printArea) {
      printArea = document.createElement('div');
      printArea.id = 'iep-print-area';
      document.body.appendChild(printArea);
    }
    printArea.innerHTML = `
      <div style="font-family:'Tajawal',sans-serif;direction:rtl;padding:20px;background:white;color:#1E2A47;">
        <div style="text-align:center;margin-bottom:20px;">
          <h1 style="font-size:24px;color:#0891B2;margin:0;">منارة النطق</h1>
          <p style="margin:5px 0 0;font-size:14px;color:#555;">تحليل تقدم الطالب</p>
          <hr style="border:1px solid #ddd;margin:10px 0;">
        </div>
        <div style="margin-bottom:15px;"><strong>الطالب:</strong> ${studentData.fullName || 'الطالب'}</div>
        <div style="margin-bottom:15px;"><strong>إجمالي الجلسات:</strong> ${stats.totalSessions} | <strong>متوسط النجاح:</strong> ${stats.avgSuccess}%</div>
        <div style="white-space:pre-wrap;font-size:14px;line-height:1.8;">${analysisText}</div>
        <div style="margin-top:20px;font-size:12px;color:#999;text-align:center;">بتاريخ: ${new Date().toLocaleDateString('ar-SA')}</div>
      </div>
    `;
    window.print();
    setTimeout(() => { if (printArea) printArea.remove(); }, 1000);
  };
}

/* ========================================
   16. عرض خطة التدريب المخصصة
   ======================================== */
function showCustomPlanModal(planText, studentData) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:800px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;color:#7C3AED;">🎯 خطة التدريب المخصصة</h3>
        <button id="closePlanModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>
      
      <div style="background:#F3E8FF;padding:16px;border-radius:12px;margin-bottom:16px;border-right:4px solid #7C3AED;">
        <div style="font-size:14px;color:#6D28D9;font-weight:bold;margin-bottom:6px;">👤 ${studentData.fullName || 'الطالب'}</div>
        <div style="font-size:12px;color:#6D28D9;">📅 خطة مخصصة بالذكاء الاصطناعي • 4 أسابيع</div>
      </div>
      
      <div style="font-size:15px;line-height:2;color:var(--text);white-space:pre-wrap;background:#FAF5FF;padding:18px;border-radius:12px;">${planText}</div>
      
      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="btn btn-primary" id="copyPlanBtn" style="border-radius:50px;padding:10px 24px;background:#7C3AED;">📋 نسخ</button>
        <button class="btn btn-soft" id="printPlanBtn" style="border-radius:50px;padding:10px 24px;">🖨️ طباعة</button>
        <button class="btn btn-soft" id="closePlanModalBtn" style="border-radius:50px;padding:10px 24px;">إغلاق</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  const closeModal = () => modal.remove();
  modal.querySelector('#closePlanModal').onclick = closeModal;
  modal.querySelector('#closePlanModalBtn').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  
  modal.querySelector('#copyPlanBtn').onclick = () => {
    navigator.clipboard.writeText(planText).then(() => {
      safeToast('✅ تم نسخ الخطة');
    });
  };
  
  modal.querySelector('#printPlanBtn').onclick = () => {
    let printArea = document.getElementById('iep-print-area');
    if (!printArea) {
      printArea = document.createElement('div');
      printArea.id = 'iep-print-area';
      document.body.appendChild(printArea);
    }
    printArea.innerHTML = `
      <div style="font-family:'Tajawal',sans-serif;direction:rtl;padding:20px;background:white;color:#1E2A47;">
        <div style="text-align:center;margin-bottom:20px;">
          <h1 style="font-size:24px;color:#7C3AED;margin:0;">منارة النطق</h1>
          <p style="margin:5px 0 0;font-size:14px;color:#555;">خطة التدريب المخصصة</p>
          <hr style="border:1px solid #ddd;margin:10px 0;">
        </div>
        <div style="margin-bottom:15px;"><strong>الطالب:</strong> ${studentData.fullName || 'الطالب'}</div>
        <div style="white-space:pre-wrap;font-size:14px;line-height:1.8;">${planText}</div>
        <div style="margin-top:20px;font-size:12px;color:#999;text-align:center;">بتاريخ: ${new Date().toLocaleDateString('ar-SA')}</div>
      </div>
    `;
    window.print();
    setTimeout(() => { if (printArea) printArea.remove(); }, 1000);
  };
}

/* ========================================
   17. عرض القصة القصيرة
   ======================================== */
function showShortStoryModal(storyText, sessionData) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:750px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;color:#DB2777;">📖 قصة قصيرة تعليمية</h3>
        <button id="closeStoryModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>
      
      <div style="background:#FCE7F3;padding:16px;border-radius:12px;margin-bottom:16px;border-right:4px solid #DB2777;">
        <div style="font-size:13px;color:#9D174D;"><strong>📋 جلسة:</strong> حرف (${sessionData.letter})</div>
        <div style="font-size:13px;color:#9D174D;"><strong>📊 مستوى الطالب:</strong> ${sessionData.successRate || 0}%</div>
      </div>
      
      <div style="font-size:15px;line-height:2;color:var(--text);white-space:pre-wrap;background:#FFF5F7;padding:18px;border-radius:12px;">${storyText}</div>
      
      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="btn btn-primary" id="copyStoryBtn" style="border-radius:50px;padding:10px 24px;background:#DB2777;">📋 نسخ</button>
        <button class="btn btn-soft" id="printStoryBtn" style="border-radius:50px;padding:10px 24px;">🖨️ طباعة</button>
        <button class="btn btn-soft" id="saveStoryBtn" style="border-radius:50px;padding:10px 24px;">💾 حفظ</button>
        <button class="btn btn-soft" id="closeStoryModalBtn" style="border-radius:50px;padding:10px 24px;">إغلاق</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  const closeModal = () => modal.remove();
  modal.querySelector('#closeStoryModal').onclick = closeModal;
  modal.querySelector('#closeStoryModalBtn').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  
  modal.querySelector('#copyStoryBtn').onclick = () => {
    navigator.clipboard.writeText(storyText).then(() => {
      safeToast('✅ تم نسخ القصة');
    });
  };
  
  modal.querySelector('#printStoryBtn').onclick = () => {
    let printArea = document.getElementById('iep-print-area');
    if (!printArea) {
      printArea = document.createElement('div');
      printArea.id = 'iep-print-area';
      document.body.appendChild(printArea);
    }
    printArea.innerHTML = `
      <div style="font-family:'Tajawal',sans-serif;direction:rtl;padding:20px;background:white;color:#1E2A47;">
        <div style="text-align:center;margin-bottom:20px;">
          <h1 style="font-size:24px;color:#DB2777;margin:0;">منارة النطق</h1>
          <p style="margin:5px 0 0;font-size:14px;color:#555;">قصة قصيرة تعليمية - حرف (${sessionData.letter})</p>
          <hr style="border:1px solid #ddd;margin:10px 0;">
        </div>
        <div style="white-space:pre-wrap;font-size:15px;line-height:2;">${storyText}</div>
        <div style="margin-top:20px;font-size:12px;color:#999;text-align:center;">بتاريخ: ${new Date().toLocaleDateString('ar-SA')}</div>
      </div>
    `;
    window.print();
    setTimeout(() => { if (printArea) printArea.remove(); }, 1000);
  };
  
  modal.querySelector('#saveStoryBtn').onclick = () => {
    closeModal();
    saveStoryToSession(sessionData.id, storyText);
  };
}

/* ========================================
   18. دوال الحفظ
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
   19. أزرار التوليد
   ======================================== */
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
   20. تصدير الدوال للنطاق العام
   ======================================== */
window.callGeminiAI = callGeminiAI;
window.generateSessionRecommendations = generateSessionRecommendations;
window.generateHomeworkExercises = generateHomeworkExercises;
window.generateProgressAnalysis = generateProgressAnalysis;
window.generateCustomPlan = generateCustomPlan;
window.generateShortStory = generateShortStory;
window.generateSingleLetterData = generateSingleLetterData;
window.getLetterData = getLetterData;
window.saveLetterData = saveLetterData;
window.showGenerateLetterConfirmModal = showGenerateLetterConfirmModal;
window.showLetterSuccessModal = showLetterSuccessModal;
window.createGenerateLetterButton = createGenerateLetterButtonForSession;
window.sendSessionToParent = sendSessionToParent;
window.generateParentReportText = generateParentReportText;
window.showAIRecommendationsModal = showAIRecommendationsModal;
window.showHomeworkModal = showHomeworkModal;
window.showProgressAnalysisModal = showProgressAnalysisModal;
window.showCustomPlanModal = showCustomPlanModal;
window.showShortStoryModal = showShortStoryModal;
window.saveAIToSession = saveAIToSession;
window.saveHomeworkToSession = saveHomeworkToSession;
window.saveStoryToSession = saveStoryToSession;
window.createAIButton = createAIButton;
window.createHomeworkButton = createHomeworkButton;
window.createProgressAnalysisButton = createProgressAnalysisButton;
window.createCustomPlanButton = createCustomPlanButton;
window.createShortStoryButton = createShortStoryButton;

// 🆕 تصدير دوال توليد الصور
window.generateWordImage = generateWordImage;
window.getCachedImage = getCachedImage;
window.saveImageToCache = saveImageToCache;
window.getOrGenerateImage = getOrGenerateImage;
window.showImageModal = showImageModal;
window.createImageButton = createImageButton;
window.createGenerateLetterButtonForSession = createGenerateLetterButtonForSession;

console.log('✅ AI Features loaded — v9.1');
console.log('🖼️ Image generation ready');
console.log('🔍 createGenerateLetterButtonForSession:', typeof window.createGenerateLetterButtonForSession);
console.log('🔍 createImageButton:', typeof window.createImageButton);
console.log('🔍 getOrGenerateImage:', typeof window.getOrGenerateImage);
