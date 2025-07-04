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

      // ❗️ [읽기 수정] DB에서 가져온 문자열을 JSON 객체로 변환
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

      // ❗️ [저장 수정] DB에 저장하기 전에 객체를 JSON 문자열로 변환
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
      // (기존 삭제 코드는 문제가 없으므로 생략)
  }

  return response.status(405).json({ success: false, error: '허용되지 않는 요청입니다.' });
}
