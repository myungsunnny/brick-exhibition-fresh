import { redis } from './utils/redis.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { artworkId, action } = req.body;

        if (!artworkId || !action) {
            return res.status(400).json({ message: 'Bad Request: Missing data.' });
        }

        // 1. 데이터베이스에서 현재 전체 데이터를 읽어옵니다.
        const data = await redis.get('gallery_data') || { likes: {} };

        // 2. 해당 작품의 좋아요 수를 조작합니다.
        if (!data.likes) data.likes = {};
        if (!data.likes[artworkId]) data.likes[artworkId] = 0;

        if (action === 'like') {
            data.likes[artworkId]++;
        } else {
            data.likes[artworkId] = Math.max(0, data.likes[artworkId] - 1);
        }

        // 3. 변경된 전체 데이터를 다시 데이터베이스에 저장합니다.
        await redis.set('gallery_data', data);

        res.status(200).json({ message: 'Like toggled successfully', newLikes: data.likes[artworkId] });

    } catch (error) {
        console.error('Error in /api/toggleLike:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
