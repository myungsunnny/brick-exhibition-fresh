import { Redis } from '@upstash/redis';

// Vercel 환경 변수에서 URL과 토큰을 가져와 Redis 클라이언트 생성
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 이 함수가 API의 핵심입니다.
export default async function handler(request, response) {
  // GET 요청 처리 (데이터 불러오기)
  if (request.method === 'GET') {
    try {
      const data = await redis.get('gallery_data');
      if (data) {
        return response.status(200).json(data);
      } else {
        // 데이터가 없으면 빈 객체를 반환
        return response.status(200).json({});
      }
    } catch (error) {
      console.error('Redis GET Error:', error);
      return response.status(500).json({ error: '데이터를 불러오는 데 실패했습니다.' });
    }
  }

  // POST 요청 처리 (데이터 저장하기)
  if (request.method === 'POST') {
    try {
      const dataToSave = request.body;
      await redis.set('gallery_data', dataToSave);
      return response.status(200).json({ success: true, message: '데이터가 저장되었습니다.' });
    } catch (error) {
      console.error('Redis SET Error:', error);
      return response.status(500).json({ error: '데이터를 저장하는 데 실패했습니다.' });
    }
  }

  // 허용되지 않은 메소드 처리
  return response.status(405).json({ error: '허용되지 않은 요청 방식입니다.' });
}

