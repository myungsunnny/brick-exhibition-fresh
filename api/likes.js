import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(request, response) {
  // GET: 모든 좋아요 데이터 조회
  if (request.method === 'GET') {
    try {
      const likes = await redis.hgetall('likes');
      return response.status(200).json({ success: true, likes: likes || {} });
    } catch (error) {
      return response.status(500).json({ success: false, error: '좋아요 데이터를 불러오지 못했습니다.' });
    }
  }

  // POST: 좋아요/좋아요 취소
  if (request.method === 'POST') {
    try {
      const { artworkId, action } = request.body;
      if (!artworkId || !action) {
        return response.status(400).json({ success: false, error: '필요한 정보가 부족합니다.' });
      }

      let likeCount;
      if (action === 'like') {
        likeCount = await redis.hincrby('likes', artworkId, 1);
      } else {
        likeCount = await redis.hincrby('likes', artworkId, -1);
      }
      
      // 좋아요 수가 0보다 작아지지 않도록 보정
      if (likeCount < 0) {
        likeCount = 0;
        await redis.hset('likes', { [artworkId]: 0 });
      }

      return response.status(200).json({ success: true, likeCount });
    } catch (error) {
      return response.status(500).json({ success: false, error: '좋아요 처리에 실패했습니다.' });
    }
  }

  return response.status(405).json({ success: false, error: '허용되지 않는 요청입니다.' });
}
