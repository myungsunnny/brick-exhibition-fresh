import { redis } from './utils/redis.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { artworkId, commentId, newText } = req.body;
        if (!artworkId || !commentId || !newText) {
            return res.status(400).json({ message: 'Bad Request: Missing data.' });
        }

        const data = await redis.get('gallery_data') || { comments: {} };

        if (data.comments[artworkId]) {
            const commentIndex = data.comments[artworkId].findIndex(c => c.id === commentId);
            if (commentIndex !== -1) {
                data.comments[artworkId][commentIndex].text = newText;
            }
        }

        await redis.set('gallery_data', data);
        res.status(200).json({ message: 'Comment edited successfully' });

    } catch (error) {
        console.error('Error in /api/editComment:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
