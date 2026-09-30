/* ========================================
   منارة النطق - ميزات الذكاء الاصطناعي
   v10.1 — توليد الصور + محتوى الحرف
   ======================================== */

console.log('🚀 Starting ai-features.js v10.1...');

const WORKER_BASE = 'https://manarat-api-v3.rslani999.workers.dev';
const VERCEL_API_BASE = 'https://manarat-alnutq.vercel.app';

/* ========================================
   🖼️ توليد الصور
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
        <button class="btn" id="downloadImageBtn" style="border-radius:50px;padding:10px 24px;background:#7C3AED;color:white;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">💾 تنزيل</button>
        <button class="btn" id="closeImageModalBtn" style="border-radius:50px;padding:10px 24px;background:#F0F0F0;color:#333;border:none;cursor:pointer;font-family:Tajawal,sans-serif;font-weight:bold;">إغلاق</button>
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
      if (typeof showToast === 'function') showToast(`✅ تم توليد صورة "${word}"`);
    } catch (error) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = orig;
      if (typeof showToast === 'function') showToast(`❌ فشل: ${error.message}`);
    }
  };
  return btn;
}

/* ========================================
   📚 توليد محتوى الحرف
   ======================================== */

async function generateLetterContent(letter, letterTitle) {
  console.log(`📚 جاري توليد محتوى حرف: ${letter}`);
  const response = await fetch(`${WORKER_BASE}/api/ai-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ letter: letter, letterTitle: letterTitle })
  });

  if (!response.ok) throw new Error(`فشل الاتصال: ${response.status}`);
  const data = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.message || 'لم يتم توليد محتوى');
  }

  return data.data;
}

async function saveLetterContentToFirebase(letter, data) {
  try {
    const fbDb = window.db;
    const fbDoc = window.doc;
    const fbSetDoc = window.setDoc;
    if (!fbDb || !fbDoc || !fbSetDoc) throw new Error('Firebase غير جاهز');
    await fbSetDoc(fbDoc(fbDb, "letters_data", letter), data);
    return true;
  } catch (e) {
    console.error('خطأ في الحفظ:', e);
    throw e;
  }
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
      await saveLetterContentToFirebase(letter, data);

      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = `✅ تم التوليد — إعادة المحاولة`;
      if (typeof showToast === 'function') showToast(`✅ تم توليد وحفظ محتوى حرف (${letter})`);

      if (typeof onSuccess === 'function') onSuccess(data);

    } catch (error) {
      console.error('❌ فشل:', error);
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = `📚 إعادة محاولة توليد حرف (${letter})`;
      if (typeof showToast === 'function') showToast('❌ فشل: ' + error.message);
    }
  };

  return btn;
}

/* ========================================
   تصدير
   ======================================== */
window.generateWordImage = generateWordImage;
window.getOrGenerateImage = getOrGenerateImage;
window.showImageModal = showImageModal;
window.createImageButton = createImageButton;
window.createGenerateLetterButton = createGenerateLetterButton;
window.generateLetterContent = generateLetterContent;

console.log('✅ AI Features loaded — v10.1');
