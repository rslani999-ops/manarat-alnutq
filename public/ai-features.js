/* ========================================
   منارة النطق - ميزات الذكاء الاصطناعي
   Manarat Al-Nutq - AI Features
   v7.0 — 6 features
   ======================================== */

console.log('🚀 Starting ai-features.js v7.0...');

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
   2. توليد توصيات ذكية
   ======================================== */
async function generateSessionRecommendations(sessionData, studentData) {
  const sessionTypes = window.SESSION_TYPES || [
    { id: 1, name: 'الحرف مجرداً' },
    { id: 2, name: 'الحرف مع الحركات' },
    { id: 3, name: 'الحرف في كلمات' },
    { id: 4, name: 'الحرف في جمل' }
  ];
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
  const sessionTypes = window.SESSION_TYPES || [
    { id: 1, name: 'الحرف مجرداً' },
    { id: 2, name: 'الحرف مع الحركات' },
    { id: 3, name: 'الحرف في كلمات' },
    { id: 4, name: 'الحرف في جمل' }
  ];
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
  const allLetters = window.ALL_LETTERS || [];
  
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
  const avgSuccess = totalSessions > 0 
    ? Math.round(sessionsData.filter(s => s.successRate).reduce((sum, s) => sum + (s.successRate || 0), 0) / sessionsData.filter(s => s.successRate).length)
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
  const sessionTypes = window.SESSION_TYPES || [
    { id: 1, name: 'الحرف مجرداً' },
    { id: 2, name: 'الحرف مع الحركات' },
    { id: 3, name: 'الحرف في كلمات' },
    { id: 4, name: 'الحرف في جمل' }
  ];
  const typeInfo = sessionTypes.find(t => t.id === sessionData.sessionType) || sessionTypes[0];
  const letterTitle = window.letterTitleMap?.[sessionData.letter] || '';
  
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
   7. توليد بيانات 28 حرفاً كاملة
   ======================================== */
async function generateAllLettersData() {
  const allLetters = window.ALL_LETTERS || [];
  const alphabetData = window.alphabetData || [];
  
  const letterTitles = {};
  alphabetData.forEach(item => { letterTitles[item.letter] = item.title; });
  
  const lettersList = allLetters.map(l => `- ${l} (${letterTitles[l] || ''})`).join('\n');
  
  const prompt = `
أنت خبير في اللغة العربية وتعليم النطق للأطفال.
المطلوب: توليد بيانات كاملة لـ 28 حرفاً عربياً.

📋 الحروف المطلوبة:
${lettersList}

━━━━━━━━━━━━━━━━━━━━━━━━━━
المطلوب لكل حرف:
━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 📍 مخرج الحرف (وصف مختصر)
2. 📖 الحرف مع الحركات الأربعة (فتحة، ضمة، كسرة، سكون)
3. 📝 3 كلمات: بداية، وسط، نهاية
4. ✍️ 3 جمل بسيطة

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ مهم جداً:
━━━━━━━━━━━━━━━━━━━━━━━━━━

- أرجع الإجابة بصيغة JSON صحيحة فقط (بدون شرح أو نص إضافي)
- لا تستخدم علامات \`\`\` أو أي تنسيق آخر

الصيغة المطلوبة:

{
  "أ": {
    "place": "من أقصى الحلق",
    "vowels": {"fatha": "أَ", "damma": "أُ", "kasra": "أِ", "sukoon": "أْ"},
    "words": {"start": ["أَسَد", "أَب", "أُم"], "middle": ["سَأَل", "رَأَى", "قَرَأَ"], "end": ["مَاء", "سَمَاء", "دُعَاء"]},
    "sentences": ["أَحْمَدُ يَلْعَبُ.", "أُمِّي طَيِّبَة.", "أَبِي فِي البَيْت."]
  }
  // ... وهكذا لجميع الحروف الـ 28
}

تأكد من:
1. جميع الحروف الـ 28 موجودة
2. كل حرف له 4 حركات + 3 كلمات + 3 جمل
3. JSON صحيح 100%
`;

  const response = await callGeminiAI(prompt, 'letters-data');
  
  let jsonText = response.trim();
  jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  const firstBrace = jsonText.indexOf('{');
  const lastBrace = jsonText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
  }
  
  try {
    const data = JSON.parse(jsonText);
    return data;
  } catch (e) {
    console.error('❌ فشل تحليل JSON:', e);
    throw new Error('فشل تحليل JSON من رد Gemini — حاول مرة أخرى');
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
   9. جلب بيانات جميع الحروف من Firebase
   ======================================== */
async function getAllLettersData() {
  try {
    const fbDb = window.db;
    const fbCollection = window.collection;
    const fbGetDocs = window.getDocs;
    
    if (!fbDb || !fbCollection || !fbGetDocs) return null;
    
    const snap = await fbGetDocs(fbCollection(fbDb, "letters_data"));
    const result = {};
    snap.forEach(d => { result[d.id] = d.data(); });
    return result;
  } catch (e) {
    console.warn('خطأ في جلب بيانات الحروف:', e);
    return null;
  }
}

/* ========================================
   10. عرض نافذة توليد محتوى الحروف
   ======================================== */
function showGenerateLettersModal() {
  console.log('📚 فتح نافذة توليد الحروف...');
  
  const modal = document.createElement('div');
  modal.id = 'generateLettersModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;';
  
  modal.innerHTML = `
    <div style="background:white;padding:30px;border-radius:20px;max-width:650px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
      <div style="text-align:center;margin-bottom:25px;">
        <div style="font-size:60px;margin-bottom:10px;">📚</div>
        <h2 style="margin:0;color:#7C3AED;">توليد محتوى الحروف</h2>
        <p style="margin:10px 0 0 0;color:#666;font-size:14px;">
          توليد بيانات 28 حرفاً عربياً بالذكاء الاصطناعي
        </p>
      </div>
      
      <div style="background:#F3E8FF;padding:18px;border-radius:12px;margin-bottom:20px;border-right:4px solid #7C3AED;">
        <p style="margin:0;font-size:13px;color:#5B21B6;line-height:1.7;">
          <strong>⚠️ ملاحظة:</strong><br>
          هذه العملية ستستغرق <strong>2-5 دقائق</strong>. الرجاء عدم إغلاق الصفحة.
        </p>
      </div>
      
      <div style="background:#F9FDFC;padding:18px;border-radius:12px;margin-bottom:20px;">
        <strong style="color:#155E75;display:block;margin-bottom:10px;">📋 ما سيتم توليده:</strong>
        <ul style="margin:0;padding-right:20px;font-size:13px;color:#333;line-height:1.8;">
          <li>📍 مخرج كل حرف</li>
          <li>📖 4 حركات لكل حرف</li>
          <li>📝 3 كلمات لكل حرف (بداية/وسط/نهاية)</li>
          <li>✍️ 3 جمل بسيطة لكل حرف</li>
        </ul>
      </div>
      
      <div id="generateStatus" style="display:none;background:#ECFEFF;padding:18px;border-radius:12px;margin-bottom:20px;text-align:center;">
        <div style="font-size:40px;margin-bottom:10px;">⏳</div>
        <p style="margin:0;color:#155E75;font-weight:bold;" id="generateStatusText">جاري التوليد...</p>
        <p style="margin:10px 0 0 0;color:#666;font-size:12px;" id="generateStatusSub"></p>
      </div>
      
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <button class="btn" id="startGenerateBtn" style="background:linear-gradient(135deg, #A855F7, #7C3AED);color:white;border:none;border-radius:50px;padding:12px 30px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:15px;">
          🚀 بدء التوليد
        </button>
        <button class="btn" id="closeGenerateModalBtn" style="background:#F0F0F0;color:#333;border:none;border-radius:50px;padding:12px 30px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:15px;">
          إغلاق
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeModal = () => modal.remove();
  modal.querySelector('#closeGenerateModalBtn').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  
  const startBtn = modal.querySelector('#startGenerateBtn');
  const statusBox = modal.querySelector('#generateStatus');
  const statusText = modal.querySelector('#generateStatusText');
  const statusSub = modal.querySelector('#generateStatusSub');
  
  startBtn.onclick = async () => {
    startBtn.disabled = true;
    startBtn.textContent = '⏳ جاري التوليد...';
    statusBox.style.display = 'block';
    statusText.textContent = 'جاري الاتصال بـ Gemini AI...';
    statusSub.textContent = 'قد يستغرق 2-5 دقائق';
    
    try {
      const data = await generateAllLettersData();
      
      const lettersCount = Object.keys(data).length;
      statusText.textContent = `✅ تم توليد ${lettersCount} حرفاً`;
      statusSub.textContent = 'جاري الحفظ في Firebase...';
      
      const fbDb = window.db;
      const fbDoc = window.doc;
      const fbSetDoc = window.setDoc;
      
      if (!fbDb || !fbDoc || !fbSetDoc) {
        throw new Error('Firebase غير جاهز');
      }
      
      let saved = 0;
      for (const [letter, letterData] of Object.entries(data)) {
        try {
          await fbSetDoc(fbDoc(fbDb, "letters_data", letter), letterData);
          saved++;
          statusText.textContent = `✅ تم حفظ ${saved}/${lettersCount}`;
        } catch (e) {
          console.warn(`خطأ في حفظ ${letter}:`, e);
        }
      }
      
      statusBox.innerHTML = `
        <div style="font-size:60px;margin-bottom:15px;">🎉</div>
        <p style="margin:0;color:#16A34A;font-weight:bold;font-size:18px;">تم بنجاح!</p>
        <p style="margin:10px 0 0 0;color:#333;font-size:14px;">
          تم حفظ <strong>${saved}</strong> حرفاً في قاعدة البيانات
        </p>
      `;
      
      startBtn.style.display = 'none';
      
      const closeBtn = modal.querySelector('#closeGenerateModalBtn');
      closeBtn.textContent = 'إغلاق';
      closeBtn.style.background = 'linear-gradient(135deg, #16A34A, #22C55E)';
      closeBtn.style.color = 'white';
      
      if (typeof showToast === 'function') showToast(`✅ تم توليد وحفظ ${saved} حرفاً`);
      if (typeof showNotification === 'function') showNotification(`تم توليد ${saved} حرفاً بنجاح`, 'success');
      
    } catch (error) {
      console.error('خطأ في التوليد:', error);
      statusBox.innerHTML = `
        <div style="font-size:60px;margin-bottom:15px;">❌</div>
        <p style="margin:0;color:#DC2626;font-weight:bold;font-size:16px;">فشل التوليد</p>
        <p style="margin:10px 0 0 0;color:#666;font-size:13px;">${error.message}</p>
      `;
      
      startBtn.disabled = false;
      startBtn.textContent = '🔄 إعادة المحاولة';
      
      if (typeof showToast === 'function') showToast('❌ فشل التوليد: ' + error.message);
    }
  };
}

/* ========================================
   11. زر توليد محتوى الحروف
   ======================================== */
function createGenerateLettersButton() {
  console.log('✅ إنشاء زر توليد الحروف...');
  
  const btn = document.createElement('button');
  btn.id = 'generateLettersBtn';
  btn.className = 'btn btn-sm';
  btn.style.cssText = 'background:linear-gradient(135deg, #A855F7, #7C3AED);color:white;border:none;border-radius:50px;padding:10px 24px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:14px;';
  btn.innerHTML = '📚 توليد محتوى الحروف (AI)';
  
  btn.onclick = () => showGenerateLettersModal();
  
  return btn;
}

/* ========================================
   12. عرض توصيات AI
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
      if (typeof showToast === 'function') showToast('✅ تم نسخ التوصيات');
    });
  };
  
  modal.querySelector('#saveAIBtn').onclick = () => {
    closeModal();
    saveAIToSession(sessionData.id, recommendations);
  };
}

/* ========================================
   13. عرض التمارين المنزلية
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
      if (typeof showToast === 'function') showToast('✅ تم نسخ التمارين');
    });
  };
  
  modal.querySelector('#sendHWToParentBtn').onclick = () => {
    try {
      const sendFunc = window.sendSessionToParent;
      if (typeof sendFunc !== 'function') {
        if (typeof showToast === 'function') showToast('⚠️ دالة الإرسال غير متوفرة');
        return;
      }
      
      let targetStudent = null;
      if (typeof window.getCurrentStudent === 'function') {
        targetStudent = window.getCurrentStudent();
      }
      if (!targetStudent && window.state?.currentStudent) {
        targetStudent = window.state.currentStudent;
      }
      if (!targetStudent && window.currentStudent) {
        targetStudent = window.currentStudent;
      }
      
      if (!targetStudent) {
        if (typeof showToast === 'function') showToast('⚠️ اختر طالباً أولاً');
        return;
      }
      
      const sessionWithHW = { 
        ...sessionData, 
        recommendations: `📝 التمارين المنزلية:\n\n${homeworkText}` 
      };
      
      sendFunc(sessionWithHW, targetStudent);
    } catch (e) {
      console.error('خطأ في الإرسال:', e);
      if (typeof showToast === 'function') showToast('⚠️ خطأ: ' + e.message);
    }
  };
  
  modal.querySelector('#saveHWBtn').onclick = () => {
    closeModal();
    saveHomeworkToSession(sessionData.id, homeworkText);
  };
}

/* ========================================
   14. عرض تحليل التقدم
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
      if (typeof showToast === 'function') showToast('✅ تم نسخ التحليل');
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
   15. عرض خطة التدريب المخصصة
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
      if (typeof showToast === 'function') showToast('✅ تم نسخ الخطة');
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
   16. عرض القصة القصيرة
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
      if (typeof showToast === 'function') showToast('✅ تم نسخ القصة');
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
   17. دوال الحفظ
   ======================================== */
async function saveAIToSession(sessionId, recommendations) {
  try {
    const fbDb = window.db, fbDoc = window.doc, fbUpdateDoc = window.updateDoc;
    if (!fbDb || !fbDoc || !fbUpdateDoc) return;
    await fbUpdateDoc(fbDoc(fbDb, "sessions", sessionId), {
      aiRecommendations: recommendations,
      aiGeneratedAt: new Date().toISOString()
    });
    if (typeof showToast === 'function') showToast('✅ تم حفظ التوصيات');
  } catch (e) {
    if (typeof showToast === 'function') showToast('❌ فشل الحفظ');
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
    if (typeof showToast === 'function') showToast('✅ تم حفظ التمارين');
  } catch (e) {
    if (typeof showToast === 'function') showToast('❌ فشل الحفظ');
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
    if (typeof showToast === 'function') showToast('✅ تم حفظ القصة');
  } catch (e) {
    if (typeof showToast === 'function') showToast('❌ فشل الحفظ');
  }
}

/* ========================================
   18. أزرار التوليد
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
      if (typeof showToast === 'function') showToast('❌ ' + error.message);
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
      if (typeof showToast === 'function') showToast('❌ ' + error.message);
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
      if (typeof showToast === 'function') showToast('❌ ' + error.message);
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
      if (typeof showToast === 'function') showToast('❌ ' + error.message);
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
      if (typeof showToast === 'function') showToast('❌ ' + error.message);
    }
  };
  return btn;
}

/* ========================================
   19. تصدير الدوال للنطاق العام
   ======================================== */
console.log('📤 تصدير الدوال إلى window...');

window.callGeminiAI = callGeminiAI;
window.generateSessionRecommendations = generateSessionRecommendations;
window.generateHomeworkExercises = generateHomeworkExercises;
window.generateProgressAnalysis = generateProgressAnalysis;
window.generateCustomPlan = generateCustomPlan;
window.generateShortStory = generateShortStory;
window.generateAllLettersData = generateAllLettersData;
window.getLetterData = getLetterData;
window.getAllLettersData = getAllLettersData;
window.showGenerateLettersModal = showGenerateLettersModal;
window.createGenerateLettersButton = createGenerateLettersButton;
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

console.log('✅ AI Features loaded — 6 features available');
console.log('🔍 createGenerateLettersButton:', typeof window.createGenerateLettersButton);
