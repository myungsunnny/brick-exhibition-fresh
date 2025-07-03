export default async function handler(req, res) {
  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // 모든 좋아요 데이터 가져오기
      const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/likes`, {
        headers: {
          Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        },
      });

      const data = await response.json();
      const likes = data.result ? JSON.parse(data.result) : {};

      return res.status(200).json({ success: true, likes });

    } else if (req.method === 'POST') {
      // 좋아요 토글
      const { artworkId, action } = req.body;

      // 기존 좋아요 데이터 가져오기
      const getResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/get/likes`, {
        headers: {
          Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        },
      });

      const getData = await getResponse.json();
      const likes = getData.result ? JSON.parse(getData.result) : {};

      // 좋아요 수 업데이트
      if (!likes[artworkId]) {
        likes[artworkId] = 0;
      }

      if (action === 'like') {
        likes[artworkId]++;
      } else if (action === 'unlike' && likes[artworkId] > 0) {
        likes[artworkId]--;
      }

      // 저장
      const setResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/set/likes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([JSON.stringify(likes)]),
      });

      return res.status(200).json({ 
        success: true, 
        likeCount: likes[artworkId] 
      });
    }

  } catch (error) {
    console.error('Upstash error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
