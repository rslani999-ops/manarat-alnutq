/* ========================================
   منارة النطق - ميزات الذكاء الاصطناعي
   Manarat Al-Nutq - AI Features
   v10.0 — مع توليد الصور عبر Vercel API
   ======================================== */

console.log('🚀 Starting ai-features.js v10.0...');

/* ========================================
   🔑 عنوان Vercel API
   ======================================== */
const VERCEL_API_BASE = 'https://manarat-alnutq.vercel.app';
const R2_PUBLIC_URL = 'https://pub-8f83fb6338db4c5aac3fd512bef2610f.r2.dev';

/* ========================================
   🖼️ دوال توليد الصور
   ======================================== */

async function generateWordImage(word) {
  if (!word) throw new Error('الكلمة مطلوبة');

  try {
    console.log(`🎨 جاري توليد صورة للكلمة: ${word}`);

    const response = await fetch(`${VERCEL_API_BASE}/api/ai-image`, {
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
    return data.image;

  } catch (error) {
    console.error('❌ خطأ في توليد الصورة:', error);
    throw error;
  }
}

async function getOrGenerateImage(word) {
  try {
    const imageUrl = await generateWordImage(word);
    return { image: imageUrl, fromCache: false };
  } catch (error) {
    throw error;
  }
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
    if (typeof showToast === 'function') showToast('✅ جاري تنزيل الصورة');
  };
}

function createImageButton(word) {
  const btn = document.createElement('button');
  btn.className = 'generate-image-btn';
  btn.style.cssText = 'background:linear-gradient(135deg, #7C3AED, #A855F7);color:white;border:none;border-radius:20px;padding:6px 14px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:12px;margin-right:6px;transition:0.2s;';
  btn.innerHTML = `🖼️ صورة`;
  btn.title = `توليد صورة لكلمة "${word}"`;

  btn.onclick = async (e) => {
    e.stopPropagation();

    btn.disabled = true;
    btn.style.opacity = '0.6';
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ جاري التوليد...';

    try {
      const result = await getOrGenerateImage(word);

      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = originalText;

      showImageModal(result.image, word);

      if (typeof showToast === 'function') {
        showToast(`✅ تم توليد صورة "${word}"`);
      }

    } catch (error) {
      console.error('❌ فشل توليد الصورة:', error);
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = originalText;
      if (typeof showToast === 'function') {
        showToast(`❌ فشل: ${error.message}`);
      }
    }
  };

  return btn;
}

function createGenerateLetterButton(letter, onSuccess) {
  const btn = document.createElement('button');
  btn.id = `generateLetterBtn_${letter}`;
  btn.style.cssText = 'background:linear-gradient(135deg, #A855F7, #7C3AED);color:white;border:none;border-radius:50px;padding:12px 28px;font-weight:bold;cursor:pointer;font-family:Tajawal,sans-serif;font-size:14px;transition:0.2s;';
  btn.innerHTML = `📚 توليد محتوى حرف (${letter}) بالذكاء الاصطناعي`;

  btn.onclick = async () => {
    try {
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.innerHTML = '⏳ جاري التوليد...';

      if (typeof showToast === 'function') {
        showToast('⏳ جاري توليد محتوى الحرف...');
      }

      setTimeout(() => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.innerHTML = `📚 إعادة محاولة توليد حرف (${letter})`;
        if (typeof showToast === 'function') {
          showToast('⚠️ ميزة توليد المحتوى قيد التطوير');
        }
      }, 3000);

    } catch (error) {
      console.error('❌ فشل التوليد:', error);
      if (typeof showToast === 'function') showToast('❌ فشل التوليد: ' + error.message);
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = `📚 إعادة محاولة توليد حرف (${letter})`;
    }
  };

  return btn;
}

/* ========================================
   تصدير الدوال إلى window
   ======================================== */
window.generateWordImage = generateWordImage;
window.getOrGenerateImage = getOrGenerateImage;
window.showImageModal = showImageModal;
window.createImageButton = createImageButton;
window.createGenerateLetterButton = createGenerateLetterButton;

console.log('✅ AI Features loaded — v10.0');
console.log('🖼️ createImageButton:', typeof window.createImageButton);
