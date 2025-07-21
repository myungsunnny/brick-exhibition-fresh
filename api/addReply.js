import { redis } from './utils/redis.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { artworkId, parentCommentId, reply } = req.body;
        if (!artworkId || !parentCommentId || !reply) {
            return res.status(400).json({ message: 'Bad Request: Missing data.' });
        }

        const data = await redis.get('gallery_data') || { comments: {} };

        if (data.comments[artworkId]) {
            const commentIndex = data.comments[artworkId].findIndex(c => c.id === parentCommentId);
            if (commentIndex !== -1) {
                if (!data.comments[artworkId][commentIndex].replies) {
                    data.comments[artworkId][commentIndex].replies = [];
                }
                data.comments[artworkId][commentIndex].replies.push(reply);
            }
        }

        await redis.set('gallery_data', data);
        res.status(200).json({ message: 'Reply added successfully' });

    } catch (error) {
        console.error('Error in /api/addReply:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
