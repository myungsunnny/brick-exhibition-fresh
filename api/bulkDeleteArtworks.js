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

        data.artworks = data.artworks.filter(art => !idsSet.has(art.id));
        idsToDelete.forEach(id => {
            delete data.comments[id];
            delete data.likes[id];
        });

        await redis.set('gallery_data', data);
        res.status(200).json({ message: 'Artworks bulk-deleted successfully' });

    } catch (error) {
        console.error('Error in /api/bulkDeleteArtworks:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
