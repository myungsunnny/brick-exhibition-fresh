import { redis } from './utils/redis.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { artworkId, commentId } = req.body;
        if (!artworkId || !commentId) {
            return res.status(400).json({ message: 'Bad Request: Missing IDs.' });
        }

        const data = await redis.get('gallery_data') || { comments: {} };

        if (data.comments[artworkId]) {
            data.comments[artworkId] = data.comments[artworkId].filter(c => c.id !== commentId);
        }

        await redis.set('gallery_data', data);
        res.status(200).json({ message: 'Comment deleted successfully' });

    } catch (error) {
        console.error('Error in /api/deleteComment:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
