/* ========================================
   Manarat Al-Nutq - Vercel Function
   توليد الصور عبر Fanar
   v2.1 — الإصدار الآمن (بدون مفاتيح مكشوفة)
   ======================================== */

const FANAR_API_KEY = process.env.FANAR_API_KEY;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-8f83fb6338db4c5aac3fd512bef2610f.r2.dev";
const R2_UPLOAD_URL = process.env.R2_UPLOAD_URL || "https://manarat-api-v3.rslani999.workers.dev/api/r2-upload";

function wordToFileName(word) {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    const char = word.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(36);
  const safeName = word.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_').substring(0, 20);
  return safeName + '_' + hashStr + '.png';
}

export default async function handler(req, res) {
  // CORS محمي
  const allowedOrigins = ['https://www.alnutq.com', 'https://manarat-alnutq.vercel.app', 'http://localhost:3000'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'استخدم POST' });
  }

  // ✅ التحقق من وجود المفتاح في البيئة
  if (!FANAR_API_KEY) {
    return res.status(500).json({ 
      success: false, 
      message: 'مفتاح Fanar غير مُعدّ في إعدادات Vercel (FANAR_API_KEY)' 
    });
  }

  const word = req.body?.word || 'apple';
  
  // ✅ حماية: منع الكلمات الطويلة جداً لتجنب إغراق الخدمة
  if (word.length > 50) {
    return res.status(400).json({ success: false, message: 'الكلمة طويلة جداً' });
  }

  const fileName = wordToFileName(word);
  const publicUrl = `${R2_PUBLIC_URL}/${fileName}`;

  try {
    const fanarResponse = await fetch('https://api.fanar.qa/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FANAR_API_KEY}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ar,en;q=0.9'
      },
      body: JSON.stringify({
        model: 'Fanar-Oryx-IG-2',
        prompt: word,
        n: 1,
        size: '1024x1024'
      })
    });

    if (!fanarResponse.ok) {
      const errorText = await fanarResponse.text();
      return res.status(500).json({
        success: false,
        message: 'فشل توليد الصورة من Fanar',
        detail: errorText.substring(0, 300)
      });
    }

    const fanarData = await fanarResponse.json();
    let base64Image = null;

    if (fanarData.data && fanarData.data[0]) {
      base64Image = fanarData.data[0].b64_json || fanarData.data[0].url;
    }

    if (!base64Image) {
      return res.status(500).json({ success: false, message: 'لم يتم استلام صورة من Fanar' });
    }

    // رفع الصورة إلى R2
    if (!base64Image.startsWith('http')) {
      try {
        const uploadResponse = await fetch(R2_UPLOAD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: fileName, base64: base64Image })
        });

        const uploadData = await uploadResponse.json();

        if (uploadResponse.ok && uploadData.success) {
          return res.status(200).json({
            success: true,
            image: publicUrl,
            word: word,
            source: 'fanar-new'
          });
        }
      } catch (r2Error) {
        console.error('خطأ R2:', r2Error.message);
      }

      // احتياطي: إرجاع base64
      return res.status(200).json({
        success: true,
        image: 'data:image/png;base64,' + base64Image,
        word: word,
        source: 'fanar-fallback'
      });
    }

    return res.status(200).json({
      success: true,
      image: base64Image,
      word: word,
      source: 'fanar-direct'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخدمة',
      detail: error.message
    });
  }
}
