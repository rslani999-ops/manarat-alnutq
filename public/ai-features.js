/* ========================================
   منارة النطق - ميزات الذكاء الاصطناعي
   Manarat Al-Nutq - AI Features
   ======================================== */

/* ========================================
   1. الدالة الرئيسية لاستدعاء Gemini AI
   ======================================== */
async function callGeminiAI(prompt, type = 'general') {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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

اكتب بأسلوب:
- واضح ومباشر
- عملي وقابل للتطبيق
- مشجع وإيجابي
- بالعربية الفصحى المبسطة
- بدون مقدمات أو خواتيم طويلة
- استخدم الرموز التعبيرية بشكل معتدل
`;

  return await callGeminiAI(prompt, 'session-recommendations');
}

/* ========================================
   3. 🆕 توليد التمارين المنزلية
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

اكتب التمارين بهذا التنسيق الدقيق:

🏠 **تمارين منزلية لحرف (${sessionData.letter})**

⏱️ **المدة اليومية**: 10-15 دقيقة
📅 **التكرار**: 5 أيام في الأسبوع

**🔥 التمرين 1: [اسم التمرين]**
- الهدف: [الهدف]
- الطريقة: [الشرح]
- المدة: [الوقت]

**🔥 التمرين 2: [اسم التمرين]**
- الهدف: [الهدف]
- الطريقة: [الشرح]
- المدة: [الوقت]

**🔥 التمرين 3: [اسم التمرين]**
- الهدف: [الهدف]
- الطريقة: [الشرح]
- المدة: [الوقت]

**🎮 لعبة ممتعة:**
[وصف لعبة بسيطة]

**⭐ نصائح لولي الأمر:**
- نصيحة 1
- نصيحة 2
- نصيحة 3

**⚠️ تجنب:**
- ما يجب تجنبه

الشروط:
- تمارين سهلة التنفيذ في المنزل
- لا تحتاج أدوات خاصة
- مناسبة لعمر الطفل
- مشجعة وممتعة
- بالعربية الفصحى المبسطة
- لا تستخدم أي شيء يحتاج شراء
`;

  return await callGeminiAI(prompt, 'homework');
}

/* ========================================
   4. عرض توصيات AI في نافذة منبثقة
   ======================================== */
function showAIRecommendationsModal(recommendations, sessionData) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:650px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;color:var(--mint-deep);display:flex;align-items:center;gap:8px;">
          🤖 توصيات الذكاء الاصطناعي
        </h3>
        <button id="closeAIModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>
      
      <div style="background:#F0FDFA;padding:16px;border-radius:12px;margin-bottom:16px;border-right:4px solid var(--mint-deep);">
        <div style="font-size:13px;color:#555;margin-bottom:6px;">
          <strong>📋 جلسة:</strong> حرف (${sessionData.letter}) - ${(window.SESSION_TYPES || []).find(t => t.id === sessionData.sessionType)?.name || ''}
        </div>
        <div style="font-size:13px;color:#555;">
          <strong>📊 نسبة النجاح:</strong> ${sessionData.successRate || 0}%
        </div>
      </div>
      
      <div id="aiRecommendationsContent" style="font-size:15px;line-height:2;color:var(--text);white-space:pre-wrap;background:#FAFDFC;padding:18px;border-radius:12px;">
        ${recommendations}
      </div>
      
      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="btn btn-primary" id="copyAIBtn" style="border-radius:50px;padding:10px 24px;">
          📋 نسخ
        </button>
        <button class="btn btn-soft" id="saveAIBtn" style="border-radius:50px;padding:10px 24px;">
          💾 حفظ في الجلسة
        </button>
        <button class="btn btn-soft" id="closeAIModalBtn" style="border-radius:50px;padding:10px 24px;">
          إغلاق
        </button>
      </div>
      
      <p style="font-size:11px;color:#999;text-align:center;margin-top:16px;">
        ⚠️ هذه التوصيات تعليمية فقط وليست تشخيصاً طبياً
      </p>
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
    }).catch(() => {
      if (typeof showToast === 'function') showToast('❌ فشل النسخ');
    });
  };
  
  modal.querySelector('#saveAIBtn').onclick = () => {
    window.__tempAISave = { recommendations, sessionId: sessionData.id };
    closeModal();
    saveAIToSession(sessionData.id, recommendations);
  };
}

/* ========================================
   5. 🆕 عرض التمارين المنزلية في نافذة منبثقة
   ======================================== */
function showHomeworkModal(homeworkText, sessionData) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  
  modal.innerHTML = `
    <div style="background:white;padding:25px;border-radius:20px;max-width:700px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;color:#EA580C;display:flex;align-items:center;gap:8px;">
          📝 التمارين المنزلية
        </h3>
        <button id="closeHWModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">×</button>
      </div>
      
      <div style="background:#FFF7ED;padding:16px;border-radius:12px;margin-bottom:16px;border-right:4px solid #EA580C;">
        <div style="font-size:13px;color:#555;margin-bottom:6px;">
          <strong>📋 جلسة:</strong> حرف (${sessionData.letter})
        </div>
        <div style="font-size:13px;color:#555;">
          <strong>📊 نسبة النجاح:</strong> ${sessionData.successRate || 0}%
        </div>
      </div>
      
      <div id="homeworkContent" style="font-size:15px;line-height:2;color:var(--text);white-space:pre-wrap;background:#FFFBF5;padding:18px;border-radius:12px;">
        ${homeworkText}
      </div>
      
      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <button class="btn btn-primary" id="copyHWBtn" style="border-radius:50px;padding:10px 24px;background:#EA580C;">
          📋 نسخ
        </button>
        <button class="btn btn-success" id="sendHWToParentBtn" style="border-radius:50px;padding:10px 24px;">
          📤 إرسال لولي الأمر
        </button>
        <button class="btn btn-soft" id="saveHWBtn" style="border-radius:50px;padding:10px 24px;">
          💾 حفظ في الجلسة
        </button>
        <button class="btn btn-soft" id="closeHWModalBtn" style="border-radius:50px;padding:10px 24px;">
          إغلاق
        </button>
      </div>
      
      <p style="font-size:11px;color:#999;text-align:center;margin-top:16px;">
        💡 هذه التمارين مقترحة من الذكاء الاصطناعي — راجعها قبل الإرسال
      </p>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeModal = () => modal.remove();
  modal.querySelector('#closeHWModal').onclick = closeModal;
  modal.querySelector('#closeHWModalBtn').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  
  // زر النسخ
  modal.querySelector('#copyHWBtn').onclick = () => {
    navigator.clipboard.writeText(homeworkText).then(() => {
      if (typeof showToast === 'function') showToast('✅ تم نسخ التمارين');
    }).catch(() => {
      if (typeof showToast === 'function') showToast('❌ فشل النسخ');
    });
  };
  
  // زر الإرسال لولي الأمر
  modal.querySelector('#sendHWToParentBtn').onclick = () => {
    if (typeof sendSessionToParent === 'function' && sessionData && state?.currentStudent) {
      const sessionWithHW = {
        ...sessionData,
        recommendations: `📝 التمارين المنزلية:\n\n${homeworkText}`
      };
      sendSessionToParent(sessionWithHW, state.currentStudent);
    } else {
      if (typeof showToast === 'function') showToast('⚠️ لا يمكن الإرسال — تحقق من بيانات ولي الأمر');
    }
  };
  
  // زر الحفظ
  modal.querySelector('#saveHWBtn').onclick = () => {
    closeModal();
    saveHomeworkToSession(sessionData.id, homeworkText);
  };
}

/* ========================================
   6. حفظ التوصيات الذكية في الجلسة
   ======================================== */
async function saveAIToSession(sessionId, recommendations) {
  try {
    const fbDb = window.db;
    const fbDoc = window.doc;
    const fbUpdateDoc = window.updateDoc;
    
    if (!fbDb || !fbDoc || !fbUpdateDoc) {
      if (typeof showToast === 'function') showToast('⚠️ Firebase غير جاهز');
      return;
    }
    
    await fbUpdateDoc(fbDoc(fbDb, "sessions", sessionId), {
      aiRecommendations: recommendations,
      aiGeneratedAt: new Date().toISOString()
    });
    
    if (typeof showToast === 'function') showToast('✅ تم حفظ التوصيات الذكية');
    if (typeof showNotification === 'function') showNotification('تم حفظ توصيات الذكاء الاصطناعي', 'success');
  } catch (e) {
    console.error('خطأ في الحفظ:', e);
    if (typeof showToast === 'function') showToast('❌ فشل الحفظ: ' + e.message);
  }
}

/* ========================================
   7. 🆕 حفظ التمارين المنزلية في الجلسة
   ======================================== */
async function saveHomeworkToSession(sessionId, homeworkText) {
  try {
    const fbDb = window.db;
    const fbDoc = window.doc;
    const fbUpdateDoc = window.updateDoc;
    
    if (!fbDb || !fbDoc || !fbUpdateDoc) {
      if (typeof showToast === 'function') showToast('⚠️ Firebase غير جاهز');
      return;
    }
    
    await fbUpdateDoc(fbDoc(fbDb, "sessions", sessionId), {
      aiHomework: homeworkText,
      aiHomeworkGeneratedAt: new Date().toISOString()
    });
    
    if (typeof showToast === 'function') showToast('✅ تم حفظ التمارين المنزلية');
    if (typeof showNotification === 'function') showNotification('تم حفظ التمارين المنزلية', 'success');
  } catch (e) {
    console.error('خطأ في الحفظ:', e);
    if (typeof showToast === 'function') showToast('❌ فشل الحفظ: ' + e.message);
  }
}

/* ========================================
   8. زر توليد التوصيات (الأصلي)
   ======================================== */
function createAIButton(sessionData, studentData) {
  const btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.id = 'generateAIBtn';
  btn.style.cssText = 'background:linear-gradient(135deg, #7C3AED, #4F46E5);color:white;border-radius:50px;padding:10px 24px;font-weight:bold;';
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
      if (typeof showToast === 'function') showToast('❌ فشل الاتصال بالذكاء الاصطناعي: ' + error.message);
    }
  };
  
  return btn;
}

/* ========================================
   9. 🆕 زر توليد التمارين المنزلية
   ======================================== */
function createHomeworkButton(sessionData, studentData) {
  const btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.id = 'generateHWBtn';
  btn.style.cssText = 'background:linear-gradient(135deg, #F97316, #EA580C);color:white;border-radius:50px;padding:10px 24px;font-weight:bold;';
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
      if (typeof showToast === 'function') showToast('❌ فشل التوليد: ' + error.message);
    }
  };
  
  return btn;
}

/* ========================================
   10. تصدير الدوال للنطاق العام
   ======================================== */
window.callGeminiAI = callGeminiAI;
window.generateSessionRecommendations = generateSessionRecommendations;
window.generateHomeworkExercises = generateHomeworkExercises;
window.showAIRecommendationsModal = showAIRecommendationsModal;
window.showHomeworkModal = showHomeworkModal;
window.saveAIToSession = saveAIToSession;
window.saveHomeworkToSession = saveHomeworkToSession;
window.createAIButton = createAIButton;
window.createHomeworkButton = createHomeworkButton;

console.log('✅ AI Features loaded — 2 features available');
