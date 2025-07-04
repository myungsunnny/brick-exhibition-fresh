export default async function handler(request, response) {
  // Redis 연결 없이, 배포 확인을 위한 메시지만 반환합니다.
  return response.status(200).json({
    message: "배포 성공 확인 - 최종 테스트 버전입니다.",
    deployed_at: new Date().toISOString()
  });
}
