import { redis } from './utils/redis.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const updatedArtwork = req.body;
        if (!updatedArtwork || !updatedArtwork.id) {
            return res.status(400).json({ message: 'Bad Request: Missing artwork data.' });
        }

        const data = await redis.get('gallery_data') || { artworks: [] };

        const artworkIndex = data.artworks.findIndex(art => art.id === updatedArtwork.id);
        if (artworkIndex === -1) {
            return res.status(404).json({ message: 'Artwork not found' });
        }

        data.artworks[artworkIndex] = updatedArtwork;

        await redis.set('gallery_data', data);
        res.status(200).json({ message: 'Artwork updated successfully' });

    } catch (error) {
        console.error('Error in /api/editArtwork:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
