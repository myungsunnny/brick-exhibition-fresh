import { redis } from './utils/redis.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const newArtwork = req.body;

        if (!newArtwork || !newArtwork.id || !newArtwork.title) {
            return res.status(400).json({ message: 'Bad Request: Missing artwork data.' });
        }

        // 1. 데이터베이스에서 현재 전체 데이터를 읽어옵니다.
        // 이 부분이 수정되었습니다.
        const dataString = await redis.get('gallery_data');
        const data = dataString ? dataString : { artworks: [], comments: {}, likes: {}, settings: {} };

        // 2. 읽어온 데이터에 새로운 작품을 추가합니다.
        if (!data.artworks) {
            data.artworks = [];
        }
        data.artworks.unshift(newArtwork);

        // 3. 변경된 전체 데이터를 다시 데이터베이스에 저장합니다.
        await redis.set('gallery_data', JSON.stringify(data));

        res.status(200).json({ message: 'Artwork added successfully' });

    } catch (error) {
        console.error('Error in /api/addArtwork:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
