/* ========================================
   منارة النطق - ميزات الذكاء الاصطناعي
   Manarat Al-Nutq - AI Features
   v4.0 — 3 features available
   ======================================== */

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
   4. 🆕 توليد تحليل تقدم الطالب
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

  const sortedSessions = [...sessionsData].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB - dateA;
  });
  const recent5 = sortedSessions.slice(0, 5).map(s => 
    `- ${s.date}: حرف (${s.letter}) - ${s.evaluation || 'غير مقيم'} - ${s.successRate || 0}%`
  ).join('\n');

  const prompt = `
أنت محلل تعليمي متخصص في تدريب النطق للأطفال.
لا تقدم تشخيصاً طبياً — فقط تحليل تعليمي.

📊 **بيانات الطالب:**
- الاسم: ${studentData.fullName || 'الطالب'}
- إجمالي الجلسات: ${totalSessions}
- جلسات مقيمة: ${evaluatedSessions.length}

📈 **النتائج:**
- ✅ اجتاز: ${passedCount}
- 🔄 اجتاز بعد تدريب: ${trainedCount}
- ⚠️ يحتاج تدريب: ${needCount}
- ❌ غير واضح: ${unclearCount}
- 📊 متوسط النجاح: ${avgSuccess}%

📌 **الحروف المتدرب عليها (${lettersList.length}):**
${lettersSummary}

📅 **آخر 5 جلسات:**
${recent5}

المطلوب منك:

🎯 **الملخص التنفيذي** (3-4 أسطر)

📊 **نقاط القوة** (3 نقاط واضحة)

⚠️ **نقاط تحتاج تحسين** (3 نقاط)

📈 **الاتجاه العام** (تحسن / ثبات / تراجع)

🎯 **التوصيات الاستراتيجية** (3-4 توصيات)

⏱️ **التوقع الزمني** (كم من الوقت يحتاج لإتقان الحروف المتبقية)

اكتب بأسلوب:
- احترافي ومشجع
- عملي ومبني على البيانات
- بدون مقدمات
- بالعربية الفصحى
- استخدم الأرقام والنسب
`;

  return await callGeminiAI(prompt, 'progress-analysis');
}

/* ========================================
   5. عرض توصيات AI
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
   6. عرض التمارين المنزلية
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
    if (typeof sendSessionToParent === 'function' && sessionData) {
      const sessionWithHW = { ...sessionData, recommendations: `📝 التمارين المنزلية:\n\n${homeworkText}` };
      if (window.state && window.state.currentStudent) {
        sendSessionToParent(sessionWithHW, window.state.currentStudent);
      } else {
        if (typeof showToast === 'function') showToast('⚠️ اختر طالباً أولاً');
      }
    } else {
      if (typeof showToast === 'function') showToast('⚠️ لا يمكن الإرسال');
    }
  };
  
  modal.querySelector('#saveHWBtn').onclick = () => {
    closeModal();
    saveHomeworkToSession(sessionData.id, homeworkText);
  };
}

/* ========================================
   7. 🆕 عرض تحليل التقدم
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
      
      <p style="font-size:11px;color:#999;text-align:center;margin-top:16px;">
        📊 التحليل مبني على بيانات الطالب في المنصة
      </p>
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
   8. حفظ التوصيات في الجلسة
   ======================================== */
async function saveAIToSession(sessionId, recommendations) {
  try {
    const fbDb = window.db, fbDoc = window.doc, fbUpdateDoc = window.updateDoc;
    if (!fbDb || !fbDoc || !fbUpdateDoc) {
      if (typeof showToast === 'function') showToast('⚠️ Firebase غير جاهز');
      return;
    }
    await fbUpdateDoc(fbDoc(fbDb, "sessions", sessionId), {
      aiRecommendations: recommendations,
      aiGeneratedAt: new Date().toISOString()
    });
    if (typeof showToast === 'function') showToast('✅ تم حفظ التوصيات');
  } catch (e) {
    if (typeof showToast === 'function') showToast('❌ فشل الحفظ');
  }
}

/* ========================================
   9. حفظ التمارين المنزلية
   ======================================== */
async function saveHomeworkToSession(sessionId, homeworkText) {
  try {
    const fbDb = window.db, fbDoc = window.doc, fbUpdateDoc = window.updateDoc;
    if (!fbDb || !fbDoc || !fbUpdateDoc) {
      if (typeof showToast === 'function') showToast('⚠️ Firebase غير جاهز');
      return;
    }
    await fbUpdateDoc(fbDoc(fbDb, "sessions", sessionId), {
      aiHomework: homeworkText,
      aiHomeworkGeneratedAt: new Date().toISOString()
    });
    if (typeof showToast === 'function') showToast('✅ تم حفظ التمارين');
  } catch (e) {
    if (typeof showToast === 'function') showToast('❌ فشل الحفظ');
  }
}

/* ========================================
   10. زر توليد التوصيات
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

/* ========================================
   11. زر التمارين المنزلية
   ======================================== */
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

/* ========================================
   12. 🆕 زر تحليل التقدم
   ======================================== */
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
      
      if (sessionsData.length === 0) {
        throw new Error('لا توجد جلسات لهذا الطالب لتحليلها');
      }
      
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

/* ========================================
   13. تصدير الدوال للنطاق العام
   ======================================== */
window.callGeminiAI = callGeminiAI;
window.generateSessionRecommendations = generateSessionRecommendations;
window.generateHomeworkExercises = generateHomeworkExercises;
window.generateProgressAnalysis = generateProgressAnalysis;
window.showAIRecommendationsModal = showAIRecommendationsModal;
window.showHomeworkModal = showHomeworkModal;
window.showProgressAnalysisModal = showProgressAnalysisModal;
window.saveAIToSession = saveAIToSession;
window.saveHomeworkToSession = saveHomeworkToSession;
window.createAIButton = createAIButton;
window.createHomeworkButton = createHomeworkButton;
window.createProgressAnalysisButton = createProgressAnalysisButton;

console.log('✅ AI Features loaded — 3 features available');
