import { redis } from './utils/redis.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const newSettings = req.body;

        // 1. 데이터베이스에서 현재 전체 데이터를 읽어옵니다.
        const data = await redis.get('gallery_data') || { artworks: [], comments: {}, likes: {}, settings: {} };

        // 2. 기존 설정에 새로운 설정 내용을 덮어씁니다.
        // 이렇게 하면 artworks, comments, likes 데이터는 그대로 유지됩니다.
        data.settings = { ...data.settings, ...newSettings };

        // 3. 변경된 전체 데이터를 다시 데이터베이스에 저장합니다.
        await redis.set('gallery_data', data);

        res.status(200).json({ message: 'Settings updated successfully' });

    } catch (error) {
        console.error('Error in /api/updateSettings:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
