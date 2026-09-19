/* ========================================
   Manarat Al-Nutq - Vercel Function
   توليد الصور عبر Fanar
   ======================================== */

const FANAR_API_KEY = process.env.FANAR_API_KEY || "6kUl68R2x4degWtI2eKeilDdyM3hLmUu";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-8f83fb6338db4c5aac3fd512bef2610f.r2.dev";

// رفع إلى R2 عبر Cloudflare Worker
const R2_UPLOAD_URL = process.env.R2_UPLOAD_URL || "https://manarat-alnutq.rslani999.workers.dev/api/r2-upload";

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
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'استخدم POST' });
  }

  const word = req.body?.word || 'apple';
  const fileName = wordToFileName(word);
  const publicUrl = `${R2_PUBLIC_URL}/${fileName}`;

  console.log(`🎨 توليد صورة: ${word}`);

  try {
    // 1. الترجمة (اختياري) — نستخدم Fanar مباشرة بالعربية
    let prompt = word;

    // 2. استدعاء Fanar
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
        prompt: prompt,
        n: 1,
        size: '1024x1024'
      })
    });

    if (!fanarResponse.ok) {
      const errorText = await fanarResponse.text();
      console.error('Fanar error:', errorText.substring(0, 300));
      return res.status(500).json({
        success: false,
        message: 'فشل توليد الصورة من Fanar',
        detail: errorText.substring(0, 300)
      });
    }

    const fanarData = await fanarResponse.json();
    let base64Image = null;
    let revisedPrompt = null;

    if (fanarData.data && fanarData.data[0]) {
      base64Image = fanarData.data[0].b64_json || fanarData.data[0].url;
      revisedPrompt = fanarData.data[0].revised_prompt || null;
    }

    if (!base64Image) {
      return res.status(500).json({
        success: false,
        message: 'لم يتم استلام صورة من Fanar'
      });
    }

    // 3. رفع الصورة إلى R2 (عبر Cloudflare Worker)
    if (!base64Image.startsWith('http')) {
      try {
        const uploadResponse = await fetch(R2_UPLOAD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: fileName,
            base64: base64Image
          })
        });

        if (uploadResponse.ok) {
          console.log(`✅ تم حفظ الصورة في R2: ${fileName}`);
          return res.status(200).json({
            success: true,
            image: publicUrl,
            word: word,
            revisedPrompt: revisedPrompt,
            source: 'fanar-new',
            model: 'fanar-oryx-ig-2'
          });
        } else {
          console.warn('فشل رفع الصورة إلى R2');
        }
      } catch (r2Error) {
        console.error('خطأ R2:', r2Error.message);
      }

      // إذا فشل R2، أرجع base64
      return res.status(200).json({
        success: true,
        image: 'data:image/png;base64,' + base64Image,
        word: word,
        revisedPrompt: revisedPrompt,
        source: 'fanar-fallback',
        model: 'fanar-oryx-ig-2'
      });
    }

    // إذا كانت الصورة URL مباشر
    return res.status(200).json({
      success: true,
      image: base64Image,
      word: word,
      revisedPrompt: revisedPrompt,
      source: 'fanar-direct',
      model: 'fanar-oryx-ig-2'
    });

  } catch (error) {
    console.error('خطأ عام:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخدمة',
      detail: error.message
    });
  }
}
