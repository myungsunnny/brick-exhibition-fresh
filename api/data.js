import { Redis } from '@upstash/redis';

// Vercel 환경 변수에서 URL과 토큰을 가져와 Redis 클라이언트 초기화
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(request, response) {
  // GET 요청: 모든 데이터를 DB에서 가져옴
  if (request.method === 'GET') {
    try {
      // mget을 사용해 여러 키를 한번에 효율적으로 조회
      const data = await redis.mget('artworks', 'comments', 'likes', 'settings');
      
      const artworks = data[0] || [];
      const comments = data[1] || {};
      const likes = data[2] || {};
      const settings = data[3] || null; // 설정은 없을 수 있으므로 null 처리

      return response.status(200).json({ artworks, comments, likes, settings });
    } catch (error) {
      console.error('Data fetching error:', error);
      return response.status(500).json({ error: '데이터를 불러오는 데 실패했습니다.' });
    }
  }

  // POST 요청: 모든 데이터를 DB에 저장함
  if (request.method === 'POST') {
    try {
      const { artworks, comments, likes, settings } = request.body;

      // mset을 사용해 여러 키를 한번에 저장
      await redis.mset({
        artworks: JSON.stringify(artworks),
        comments: JSON.stringify(comments),
        likes: JSON.stringify(likes),
        settings: JSON.stringify(settings)
      });
      
      return response.status(200).json({ message: '데이터가 성공적으로 저장되었습니다.' });
    } catch (error) {
      console.error('Data saving error:', error);
      return response.status(500).json({ error: '데이터 저장에 실패했습니다.' });
    }
  }

  // 허용되지 않은 메소드 처리
  return response.status(405).json({ error: `Method ${request.method} Not Allowed` });
}
