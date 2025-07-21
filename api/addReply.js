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

        // 1. 데이터베이스에서 현재 전체 데이터를 읽어옵니다.
        const data = await redis.get('gallery_data') || { comments: {} };

        // 2. 해당 작품의 댓글 목록을 찾습니다.
        if (data.comments && data.comments[artworkId]) {
            // 3. 부모 댓글을 찾아 replies 배열에 새 답글을 추가합니다.
            const commentIndex = data.comments[artworkId].findIndex(c => c.id === parentCommentId);
            if (commentIndex !== -1) {
                if (!data.comments[artworkId][commentIndex].replies) {
                    data.comments[artworkId][commentIndex].replies = [];
                }
                data.comments[artworkId][commentIndex].replies.push(reply);
            }
        }

        // 4. 변경된 전체 데이터를 다시 데이터베이스에 저장합니다.
        await redis.set('gallery_data', data);
        res.status(200).json({ message: 'Reply added successfully' });

    } catch (error) {
        console.error('Error in /api/addReply:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
