export default async function handler(req, res) {
  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // 모든 데이터 초기화
      const keys = ['artworks', 'likes', 'comments', 'settings', 'artwork_order'];
      
      for (const key of keys) {
        await fetch(`${UPSTASH_REDIS_REST_URL}/del/${key}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
          },
        });
      }

      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('Upstash error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
