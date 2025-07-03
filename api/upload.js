const cloudinary = require('cloudinary').v2;

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { image } = req.body;
    
    // 이미지 데이터 확인
    if (!image) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image provided' 
      });
    }

    console.log('이미지 업로드 시작...');

    // Cloudinary에 이미지 업로드
    const result = await cloudinary.uploader.upload(image, {
      folder: 'daebul-fresh',
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    console.log('업로드 성공:', result.secure_url);

    // 성공 응답
    res.status(200).json({ 
      success: true, 
      imageUrl: result.secure_url,
      public_id: result.public_id
    });

  } catch (error) {
    console.error('업로드 오류:', error);
    
    // 오류 응답
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Upload failed'
    });
  }
}
