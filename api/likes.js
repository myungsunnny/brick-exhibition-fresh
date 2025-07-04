import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(request, response) {
  if (request.method === 'GET') {
    try {
      const likes = await redis.hgetall('likes');
      return response.status(200).json({ success: true, likes: likes || {} });
    } catch (error) {
      return response.status(500).json({ success: false, error: '좋아요 데이터를 불러오지 못했습니다.' });
    }
  }

  if (request.method === 'POST') {
    try {
      const { artworkId, action } = request.body;
      if (!artworkId || !action) return response.status(400).json({ success: false, error: '필요한 정보가 부족합니다.' });
      const increment = action === 'like' ? 1 : -1;
      let likeCount = await redis.hincrby('likes', artworkId, increment);
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
