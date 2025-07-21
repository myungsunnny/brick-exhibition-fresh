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

        // 1. 데이터베이스에서 현재 전체 데이터를 읽어옵니다.
        const data = await redis.get('gallery_data') || { artworks: [] };

        // 2. 해당 ID를 가진 작품을 제외한 새 배열을 만듭니다.
        const initialLength = data.artworks.length;
        data.artworks = data.artworks.filter(artwork => artwork.id !== artworkIdToDelete);

        // 3. 작품이 실제로 삭제되었는지 확인합니다.
        if (initialLength === data.artworks.length) {
             // 삭제할 작품 ID를 찾지 못한 경우
             return res.status(404).json({ message: 'Artwork not found' });
        }

        // 4. 변경된 전체 데이터를 다시 데이터베이스에 저장합니다.
        await redis.set('gallery_data', data);

        res.status(200).json({ message: 'Artwork deleted successfully' });

    } catch (error) {
        console.error('Error in /api/deleteArtwork:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
