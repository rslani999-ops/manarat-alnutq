/* ========================================
   منارة النطق - Vercel AI Function
   Manarat Al-Nutq - AI API Endpoint
   ======================================== */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'استخدم POST فقط'
    });
  }

  // Check API key
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ 
      error: 'API Key Missing',
      message: 'مفتاح Gemini غير مُعدّ في Vercel Environment Variables'
    });
  }

  try {
    const { prompt, type } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing Prompt',
        message: 'الرجاء إرسال prompt'
      });
    }

    // Determine AI model and settings based on type
    const model = 'gemini-2.5-flash';  
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.95,
        topK: 40
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error:', errorData);
      return res.status(response.status).json({
        error: 'Gemini API Error',
        message: errorData.error?.message || 'فشل الاتصال بالذكاء الاصطناعي',
        details: errorData
      });
    }

    const data = await response.json();

    // Extract text from response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        error: 'Empty Response',
        message: 'لم يُعد الذكاء الاصطناعي أي نص',
        raw: data
      });
    }

    return res.status(200).json({
      success: true,
      text: text,
      type: type || 'general',
      model: model
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({
      error: 'Server Error',
      message: 'حدث خطأ في السيرفر',
      details: error.message
    });
  }
}
