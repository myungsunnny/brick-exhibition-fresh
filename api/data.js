import { redis } from './utils/redis.js'; // redis.js 경로 확인!

export default async function handler(req, res) {
    // GET 요청만 허용
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // 1. 데이터베이스에서 전체 데이터를 읽어옵니다.
        const dataString = await redis.get('gallery_data');

        // 2. 데이터가 없으면 기본 구조를, 있으면 그대로 사용합니다. (JSON.parse 제거)
        const data = dataString ? dataString : { artworks: [], comments: {}, likes: {}, settings: {} };

        // 3. 데이터를 클라이언트에 전송합니다.
        res.status(200).json(data);

    } catch (error) {
        // 에러 발생 시 로그를 남기고 에러 응답 전송
        console.error('Error in /api/data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
