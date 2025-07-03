import { Redis } from '@upstash/redis';

// Vercel 환경 변수에서 URL과 Token을 안전하게 불러옵니다.
// 이 코드는 서버에서만 실행되므로 브라우저에는 절대 노출되지 않습니다.
const redis = new Redis({
  url: process.env.UPSTASH_URL,
  token: process.env.UPSTASH_TOKEN,
});

// 이 함수가 브라우저의 요청을 받아 처리하는 API 창구입니다.
export default async function handler(request, response) {
  try {
    // GET 요청: 데이터베이스에서 모든 데이터를 가져와 브라우저에 전달
    if (request.method === 'GET') {
      const data = await redis.get('database');
      return response.status(200).json({ success: true, data: data });
    }
    
    // POST 요청: 브라우저에서 보낸 새로운 데이터를 데이터베이스에 통째로 저장
    if (request.method === 'POST') {
      // request.body에는 이미 JSON 문자열이 포함되어 있으므로 그대로 저장합니다.
      await redis.set('database', request.body);
      return response.status(200).json({ success: true, message: 'Data saved successfully.' });
    }
    
    // 허용되지 않은 메소드에 대한 처리
    response.setHeader('Allow', ['GET', 'POST']);
    return response.status(405).json({ error: `Method ${request.method} Not Allowed` });

  } catch (error) {
    // 서버에서 오류 발생 시 처리
    console.error('API Error:', error);
    return response.status(500).json({ success: false, error: error.message });
  }
}
