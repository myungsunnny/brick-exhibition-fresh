import { redis } from './utils/redis.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { idsToDelete } = req.body;
        if (!idsToDelete || !Array.isArray(idsToDelete)) {
            return res.status(400).json({ message: 'Bad Request: idsToDelete must be an array.' });
        }

        const data = await redis.get('gallery_data') || { artworks: [], comments: {}, likes: {} };
        const idsSet = new Set(idsToDelete);

        // 작품 목록에서 삭제
        data.artworks = data.artworks.filter(art => !idsSet.has(art.id));
        
        // 각 작품 ID에 연결된 댓글과 좋아요 삭제
        idsToDelete.forEach(id => {
            delete data.comments[id];
            delete data.likes[id];
        });

        await redis.set('gallery_data', data);
        res.status(200).json({ message: '작품들과 관련 데이터가 성공적으로 삭제되었습니다.' });

    } catch (error) {
        console.error('Error in /api/bulkDeleteArtworks:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
