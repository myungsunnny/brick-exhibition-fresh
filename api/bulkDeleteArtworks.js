import { redis } from './utils/redis.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { id: artworkIdToDelete } = req.body;
        if (!artworkIdToDelete) {
            return res.status(400).json({ message: 'Bad Request: Missing artwork ID.' });
        }

        const data = await redis.get('gallery_data') || { artworks: [], comments: {}, likes: {} };

        // --- 작품과 연결된 댓글, 좋아요도 함께 삭제하는 로직 ---
        const initialLength = data.artworks.length;
        data.artworks = data.artworks.filter(artwork => artwork.id !== artworkIdToDelete);
        
        // 연결된 댓글과 좋아요 삭제
        delete data.comments[artworkIdToDelete];
        delete data.likes[artworkIdToDelete];
        // --- 로직 끝 ---
        
        if (initialLength === data.artworks.length) {
             return res.status(404).json({ message: 'Artwork not found' });
        }

        await redis.set('gallery_data', data);
        res.status(200).json({ message: '작품과 관련 데이터가 성공적으로 삭제되었습니다.' });

    } catch (error) {
        console.error('Error in /api/deleteArtwork:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
