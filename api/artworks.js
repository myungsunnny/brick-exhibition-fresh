export default async function handler(req, res) {
  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    return res.status(500).json({ success: false, error: 'Upstash configuration missing' });
  }

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 캐시 방지 헤더 추가
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // 모든 작품 가져오기
      const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/artworks`, {
        headers: {
          Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        },
      });

      const data = await response.json();
      console.log('Upstash response:', data); // 디버깅용
      
      let artworks = [];
      if (data.result) {
        try {
          artworks = JSON.parse(data.result);
        } catch (e) {
          console.error('JSON parse error:', e);
          artworks = [];
        }
      }

      return res.status(200).json({ success: true, artworks });

    } else if (req.method === 'POST') {
      // 작품 저장/수정
      const { artwork } = req.body;
      
      // 기존 작품 목록 가져오기
      const getResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/get/artworks`, {
        headers: {
          Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        },
      });

      const getData = await getResponse.json();
      let artworks = [];
      
      if (getData.result) {
        try {
          artworks = JSON.parse(getData.result);
        } catch (e) {
          console.error('JSON parse error:', e);
          artworks = [];
        }
      }

      // 수정인 경우 기존 작품 업데이트, 신규인 경우 추가
      const existingIndex = artworks.findIndex(a => a.id === artwork.id);
      if (existingIndex >= 0) {
        artworks[existingIndex] = artwork;
      } else {
        artworks.unshift(artwork);
      }

      // 저장 - Upstash REST API 형식에 맞게
      const setResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/set/artworks/${encodeURIComponent(JSON.stringify(artworks))}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        },
      });

      const setData = await setResponse.json();
      console.log('Set response:', setData); // 디버깅용

      if (!setResponse.ok) {
        throw new Error('Failed to save to Upstash');
      }

      return res.status(200).json({ success: true, total: artworks.length });

    } else if (req.method === 'DELETE') {
      // 작품 삭제
      const { artworkId } = req.query;

      const getResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/get/artworks`, {
        headers: {
          Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        },
      });

      const getData = await getResponse.json();
      let artworks = getData.result ? JSON.parse(getData.result) : [];

      artworks = artworks.filter(a => a.id !== artworkId);

      const setResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/set/artworks/${encodeURIComponent(JSON.stringify(artworks))}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        },
      });

      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('Upstash error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
