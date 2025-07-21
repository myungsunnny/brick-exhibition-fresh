import { redis } from './utils/redis.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { commentsToDelete } = req.body;
        if (!commentsToDelete || !Array.isArray(commentsToDelete)) {
            return res.status(400).json({ message: 'Bad Request: commentsToDelete must be an array.' });
        }

        const data = await redis.get('gallery_data') || { comments: {} };

        commentsToDelete.forEach(item => {
            if (data.comments[item.artworkId]) {
                data.comments[item.artworkId] = data.comments[item.artworkId].filter(c => c.id !== item.commentId);
            }
        });

        await redis.set('gallery_data', data);
        res.status(200).json({ message: 'Comments bulk-deleted successfully' });

    } catch (error) {
        console.error('Error in /api/bulkDeleteComments:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
