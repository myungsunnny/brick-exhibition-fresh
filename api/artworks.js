import { Redis } from '@upstash/redis';

// Upstash Redis 클라이언트 초기화
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Redis에서 모든 작품 조회
      const artworksData = await redis.get('artworks');
      const artworks = artworksData || [];
      
      console.log(`Upstash에서 ${artworks.length}개 작품 조회`);
      res.status(200).json({ 
        success: true, 
        artworks,
        source: 'upstash-redis'
      });
      
    } else if (req.method === 'POST') {
      // 새 작품 추가
      const { artwork } = req.body;
      
      if (!artwork) {
        return res.status(400).json({ 
          success: false, 
          error: '작품 데이터가 없습니다' 
        });
      }
      
      // 기존 작품들 가져오기
      const artworksData = await redis.get('artworks');
      const artworks = artworksData || [];
      
      // 새 작품을 맨 앞에 추가
      artworks.unshift(artwork);
      
      // Redis에 저장 (만료시간 없음 = 영구 저장)
      await redis.set('artworks', artworks);
      
      console.log(`Upstash에 새 작품 저장: ${artwork.title}`);
      res.status(200).json({ 
        success: true, 
        artwork, 
        total: artworks.length,
        source: 'upstash-redis'
      });
      
    } else if (req.method === 'DELETE') {
      // 작품 삭제
      const { artworkId } = req.query;
      
      if (!artworkId) {
        return res.status(400).json({ 
          success: false, 
          error: '작품 ID가 없습니다' 
        });
      }
      
      const artworksData = await redis.get('artworks');
      const artworks = artworksData || [];
      const filteredArtworks = artworks.filter(a => a.id !== artworkId);
      
      await redis.set('artworks', filteredArtworks);
      
      console.log(`Upstash에서 작품 삭제: ${artworkId}`);
      res.status(200).json({ 
        success: true, 
        total: filteredArtworks.length,
        source: 'upstash-redis'
      });
      
    } else {
      res.status(405).json({ 
        success: false, 
        error: 'Method not allowed' 
      });
    }
    
  } catch (error) {
    console.error('Upstash Redis 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      source: 'upstash-redis'
    });
  }
}
