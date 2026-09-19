export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    ok: true,
    app: 'منارة النطق',
    version: '5.0-vercel',
    timestamp: new Date().toISOString()
  });
}
