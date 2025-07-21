import { redis } from './utils/redis.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // 기본 데이터 구조 (초기 상태)
        const defaultData = {
            artworks: [],
            comments: {},
            likes: {},
            settings: {
                title: '대불초등학교 브릭모델 전시관',
                headerImage: '',
                description: '창의적인 브릭모델 활동으로 만든 멋진 작품들을 만나보세요',
                allowComments: true,
                moderateComments: false,
                adminPassword: '1234',
                requireUploadPassword: false,
                uploadPassword: '0000',
                gradeDescriptions: {
                    'all': { title: '🧱 모든 학년 브릭모델 작품', description: '대불초등학교 학생들의 창의적인 브릭모델 작품들을 만나보세요. 각 학년별로 다양한 주제와 스타일의 작품들이 전시되어 있습니다.' },
                    '1학년': { title: '🌟 1학년 브릭모델 작품', description: '1학년 친구들의 첫 번째 브릭모델 작품들입니다. 기본적인 블록 쌓기부터 시작하여 간단한 집, 동물, 자동차 등을 만들며 창의력과 손재주를 기르고 있어요!' },
                    '2학년': { title: '🎨 2학년 브릭모델 작품', description: '2학년 친구들은 더욱 정교한 작품을 만들 수 있게 되었어요. 색깔 조합과 기본 구조를 이해하며 자신만의 개성이 담긴 작품들을 선보입니다.' },
                    '3학년': { title: '🏗️ 3학년 브릭모델 작품', description: '3학년이 되면서 더욱 복잡한 구조물을 만들 수 있게 되었어요. 건축물의 기본 원리를 이해하고 계획적으로 작품을 제작하는 능력이 늘어났습니다.' },
                    '4학년': { title: '🚀 4학년 브릭모델 작품', description: '4학년 친구들은 테마가 있는 작품들을 만들기 시작했어요. 과학적 사고와 창의적 아이디어를 결합하여 미래 도시, 우주선 등 상상력이 풍부한 작품들을 제작합니다.' },
                    '5학년': { title: '🎯 5학년 브릭모델 작품', description: '5학년 작품들은 한층 더 정교하고 완성도가 높아졌어요. 기능적인 요소들을 고려하며 실용적이면서도 아름다운 작품들을 만들어 냅니다.' },
                    '6학년': { title: '🏆 6학년 브릭모델 작품', description: '6학년 친구들의 작품은 정말 놀라워요! 수년간 쌓은 경험과 실력으로 복잡한 메커니즘, 대형 구조물, 정교한 디테일을 가진 작품들을 완성합니다.' }
                }
            }
        };

        await redis.set('gallery_data', defaultData);
        res.status(200).json({ message: 'All data has been reset successfully' });

    } catch (error) {
        console.error('Error in /api/resetAllData:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
