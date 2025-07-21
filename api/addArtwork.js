// 이 파일은 '/api/addArtwork.js' 경로에 만들어야 합니다.
// (Upstash Redis와 연결하는 코드는 이미 있다고 가정합니다.)
import { redis } from './utils/redis.js'; // 실제 Redis 클라이언트 파일 경로

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const newArtwork = req.body;

        // 1. 데이터베이스에서 현재 전체 데이터를 읽어옵니다.
        const dataString = await redis.get('gallery_data');
        const data = dataString ? JSON.parse(dataString) : { artworks: [], comments: {}, likes: {}, settings: {} };

        // 2. 읽어온 데이터에 새로운 작품을 추가합니다.
        if (!data.artworks) {
            data.artworks = [];
        }
        data.artworks.unshift(newArtwork); // 배열 맨 앞에 추가

        // 3. 변경된 전체 데이터를 다시 데이터베이스에 저장합니다.
        await redis.set('gallery_data', JSON.stringify(data));

        res.status(200).json({ message: 'Artwork added successfully' });

    } catch (error) {
        console.error('Error adding artwork:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
