import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Redis에서 좋아요 데이터 조회
      const likesData = await redis.get('likes');
      const likes = likesData || {};
      
      res.status(200).json({ 
        success: true, 
        likes,
        source: 'upstash-redis'
      });
      
    } else if (req.method === 'POST') {
      // 좋아요 토글
      const { artworkId, action } = req.body;
      
      const likesData = await redis.get('likes');
      const likes = likesData || {};
      
      if (action === 'like') {
        likes[artworkId] = (likes[artworkId] || 0) + 1;
      } else if (action === 'unlike') {
        likes[artworkId] = Math.max(0, (likes[artworkId] || 1) - 1);
      }
      
      await redis.set('likes', likes);
      
      console.log(`Upstash 좋아요 업데이트: ${artworkId} = ${likes[artworkId]}`);
      
      res.status(200).json({ 
        success: true, 
        artworkId, 
        likeCount: likes[artworkId] || 0,
        source: 'upstash-redis'
      });
      
    } else {
      res.status(405).json({ 
        success: false, 
        error: 'Method not allowed' 
      });
    }
    
  } catch (error) {
    console.error('Upstash 좋아요 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
