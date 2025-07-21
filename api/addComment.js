import { redis } from './utils/redis.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { artworkId, comment } = req.body;

        if (!artworkId || !comment) {
            return res.status(400).json({ message: 'Bad Request: Missing data.' });
        }

        // 1. 데이터베이스에서 현재 전체 데이터를 읽어옵니다.
        const data = await redis.get('gallery_data') || { artworks: [], comments: {}, likes: {}, settings: {} };

        // 2. 해당 작품의 댓글 목록에 새 댓글을 추가합니다.
        if (!data.comments[artworkId]) {
            data.comments[artworkId] = [];
        }
        data.comments[artworkId].push(comment);

        // 3. 변경된 전체 데이터를 다시 데이터베이스에 저장합니다.
        await redis.set('gallery_data', data);

        res.status(200).json({ message: 'Comment added successfully' });

    } catch (error) {
        console.error('Error in /api/addComment:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
