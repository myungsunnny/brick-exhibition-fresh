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
      // 모든 댓글 가져오기
      const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/comments`, {
        headers: {
          Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        },
      });

      const data = await response.json();
      const comments = data.result ? JSON.parse(data.result) : {};

      return res.status(200).json({ success: true, comments });

    } else if (req.method === 'POST') {
      // 댓글 저장
      const { artworkId, comments: artworkComments } = req.body;

      // 기존 댓글 데이터 가져오기
      const getResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/get/comments`, {
        headers: {
          Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        },
      });

      const getData = await getResponse.json();
      const allComments = getData.result ? JSON.parse(getData.result) : {};

      // 해당 작품의 댓글 업데이트
      allComments[artworkId] = artworkComments;

      // 저장
      const setResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/set/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([JSON.stringify(allComments)]),
      });

      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('Upstash error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
