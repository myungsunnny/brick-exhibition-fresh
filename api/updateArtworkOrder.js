import { redis } from './utils/redis.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { orderedIds } = req.body;

        if (!orderedIds || !Array.isArray(orderedIds)) {
            return res.status(400).json({ message: 'Bad Request: orderedIds must be an array.' });
        }

        // 1. 데이터베이스에서 현재 전체 데이터를 읽어옵니다.
        const data = await redis.get('gallery_data') || { artworks: [] };

        // 2. 기존 작품들을 Map 형태로 만들어 빠르게 찾을 수 있도록 준비합니다.
        const artworkMap = new Map(data.artworks.map(art => [art.id, art]));

        // 3. 받아온 ID 순서대로 작품 배열을 새로 만듭니다.
        const reorderedArtworks = orderedIds.map(id => artworkMap.get(id)).filter(Boolean);

        // 4. 기존 작품 배열을 새로 정렬된 배열로 교체합니다.
        data.artworks = reorderedArtworks;

        // 5. 변경된 전체 데이터를 다시 데이터베이스에 저장합니다.
        await redis.set('gallery_data', data);

        res.status(200).json({ message: 'Order updated successfully' });

    } catch (error) {
        console.error('Error in /api/updateArtworkOrder:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
