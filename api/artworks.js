import { Redis } from '@upstash/redis';

// Upstash Redis 클라이언트 초기화
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(request, response) {
  // GET: 모든 작품 조회
  if (request.method === 'GET') {
    try {
      const artworkIds = await redis.lrange('artworks', 0, -1);
      if (artworkIds.length === 0) {
        return response.status(200).json({ success: true, artworks: [] });
      }
      const rawArtworks = await redis.mget(...artworkIds.map(id => `artwork:${id}`));
      
      const artworks = rawArtworks
        .filter(artwork => artwork !== null)
        .map(artwork => JSON.parse(artwork)); 

      const sortedArtworks = artworks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return response.status(200).json({ success: true, artworks: sortedArtworks });
    } catch (error) {
      console.error('Artworks GET Error:', error);
      return response.status(500).json({ success: false, error: '데이터를 불러오는데 실패했습니다.' });
    }
  }

  // POST: 새 작품 등록 또는 수정
  if (request.method === 'POST') {
    try {
      const { artwork } = request.body;
      if (!artwork || !artwork.id) {
        return response.status(400).json({ success: false, error: '작품 정보가 올바르지 않습니다.' });
      }
      const isEditing = await redis.exists(`artwork:${artwork.id}`);
      
      await redis.set(`artwork:${artwork.id}`, JSON.stringify(artwork));
      
      if (!isEditing) {
        await redis.lpush('artworks', artwork.id);
      }
      
      return response.status(200).json({ success: true });
    } catch (error) {
      console.error('Artworks POST Error:', error);
      return response.status(500).json({ success: false, error: '데이터 저장에 실패했습니다.' });
    }
  }
  
  // DELETE: 작품 삭제
  if (request.method === 'DELETE') {
    try {
        const { artworkId } = request.query;
        if (!artworkId) {
            return response.status(400).json({ success: false, error: '삭제할 작품 ID가 없습니다.' });
        }
        await redis.del(`artwork:${artworkId}`);
        await redis.lrem('artworks', 1, artworkId);
        await redis.hdel('likes', artworkId);
        return response.status(200).json({ success: true });
    } catch (error) {
        console.error('Artworks DELETE Error:', error);
        return response.status(500).json({ success: false, error: '데이터 삭제에 실패했습니다.' });
    }
  }

  return response.status(405).json({ success: false, error: '허용되지 않는 요청입니다.' });
}
