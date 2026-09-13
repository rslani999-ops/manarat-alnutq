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
  const typeInfo = SESSION_TYPES.find(t => t.id === sessionData.sessionType) || SESSION_TYPES[0];
  
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
   3. عرض توصيات AI في نافذة منبثقة
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
          <strong>📋 جلسة:</strong> حرف (${sessionData.letter}) - ${SESSION_TYPES.find(t => t.id === sessionData.sessionType)?.name || ''}
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
  
  // زر الإغلاق
  const closeModal = () => modal.remove();
  modal.querySelector('#closeAIModal').onclick = closeModal;
  modal.querySelector('#closeAIModalBtn').onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  
  // زر النسخ
  modal.querySelector('#copyAIBtn').onclick = () => {
    navigator.clipboard.writeText(recommendations).then(() => {
      showToast('✅ تم نسخ التوصيات');
    }).catch(() => {
      showToast('❌ فشل النسخ');
    });
  };
  
  // زر الحفظ
  modal.querySelector('#saveAIBtn').onclick = () => {
    window.__tempAISave = { recommendations, sessionId: sessionData.id };
    closeModal();
    saveAIToSession(sessionData.id, recommendations);
  };
}

/* ========================================
   4. حفظ التوصيات الذكية في الجلسة
   ======================================== */
async function saveAIToSession(sessionId, recommendations) {
  try {
    await updateDoc(doc(db, "sessions", sessionId), {
      aiRecommendations: recommendations,
      aiGeneratedAt: new Date().toISOString()
    });
    showToast('✅ تم حفظ التوصيات الذكية');
    showNotification('تم حفظ توصيات الذكاء الاصطناعي', 'success');
  } catch (e) {
    console.error('خطأ في الحفظ:', e);
    showToast('❌ فشل الحفظ: ' + e.message);
  }
}

/* ========================================
   5. زر توليد التوصيات (يُستخدم في صفحة الجلسة)
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
      showToast('❌ فشل الاتصال بالذكاء الاصطناعي: ' + error.message);
    }
  };
  
  return btn;
}

/* ========================================
   6. تصدير الدوال للنطاق العام
   ======================================== */
window.callGeminiAI = callGeminiAI;
window.generateSessionRecommendations = generateSessionRecommendations;
window.showAIRecommendationsModal = showAIRecommendationsModal;
window.saveAIToSession = saveAIToSession;
window.createAIButton = createAIButton;

console.log('✅ AI Features loaded successfully');
