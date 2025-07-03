import { Redis } from '@upstash/redis';

// Upstash Redis 클라이언트 초기화
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL, // 이 부분 확인
  token: process.env.UPSTASH_REDIS_REST_TOKEN, // 이 부분 확인
});

export default async function handler(request, response) {
  // GET: 모든 작품 조회
  if (request.method === 'GET') {
    try {
      const artworkIds = await redis.lrange('artworks', 0, -1);
      if (artworkIds.length === 0) {
        return response.status(200).json({ success: true, artworks: [] });
      }
      const artworks = await redis.mget(...artworkIds.map(id => `artwork:${id}`));
      // 최신순으로 정렬
      const sortedArtworks = artworks.filter(a => a).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return response.status(200).json({ success: true, artworks: sortedArtworks });
    } catch (error) {
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

      // 작품 데이터를 JSON 형태로 저장
      await redis.set(`artwork:${artwork.id}`, JSON.stringify(artwork));
      
      // 수정이 아닌 새 등록일 경우, 작품 목록에 ID 추가
      if (!isEditing) {
        await redis.lpush('artworks', artwork.id);
      }
      
      const total = await redis.llen('artworks');
      return response.status(200).json({ success: true, total });

    } catch (error) {
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

      await redis.del(`artwork:${artworkId}`); // 작품 데이터 삭제
      await redis.lrem('artworks', 1, artworkId); // 목록에서 ID 제거
      await redis.hdel('likes', artworkId); // 좋아요 데이터도 함께 삭제

      return response.status(200).json({ success: true });

    } catch (error) {
        return response.status(500).json({ success: false, error: '데이터 삭제에 실패했습니다.' });
    }
  }

  // 지원하지 않는 메소드
  return response.status(405).json({ success: false, error: '허용되지 않는 요청입니다.' });
}
