// ----------------------------------------------------------------
// 1. 설정 및 전역 변수
// ----------------------------------------------------------------

// ⚠️⚠️⚠️ 중요: Upstash에서 복사한 실제 URL과 Token을 따옴표 안에 정확히 입력해주세요! ⚠️⚠️⚠️
const UPSTASH_URL = 'https://unique-koi-29481.upstash.io';
const UPSTASH_TOKEN = 'AXMpAAIjcDExNzg5MjViZDE5ZDE0YWIyOTBjMGQxZTNiODA4ZTg4ZXAxMA';

const CLOUDINARY_CLOUD_NAME = 'dc0hyzldx';
const CLOUDINARY_UPLOAD_PRESET = 'daebul_fresh';

// Upstash 클라이언트 초기화
const upstashClient = new upstash.Redis({
    url: UPSTASH_URL,
    token: UPSTASH_TOKEN,
});

// 데이터 저장을 위한 전역 변수들
let artworks = [];
let comments = {};
let likes = {};
let settings = {};
let isAdminMode = false;

// 기본 설정값
const defaultSettings = {
    title: '대불초등학교 브릭모델 전시관',
    headerImage: '',
    description: '창의적인 브릭모델 활동으로 만든 멋진 작품들을 만나보세요',
    allowComments: true,
    moderateComments: false,
    adminPassword: '1234',
    useUploadPassword: false, 
    uploadPassword: '',      
    gradeDescriptions: {
        'all': { title: '🧱 모든 학년 브릭모델 작품', description: '대불초등학교 학생들의 창의적인 브릭모델 작품들을 만나보세요. 각 학년별로 다양한 주제와 스타일의 작품들이 전시되어 있습니다.' },
        '1학년': { title: '🌟 1학년 브릭모델 작품', description: '1학년 친구들의 첫 번째 브릭모델 작품들입니다. 기본적인 블록 쌓기부터 시작하여 간단한 집, 동물, 자동차 등을 만들며 창의력과 손재주를 기르고 있어요!' },
        // ... (나머지 학년 설명은 동일)
    }
};


// ----------------------------------------------------------------
// 2. 핵심 로직: 데이터 로딩 및 저장
// ----------------------------------------------------------------

async function loadInitialData() {
    console.log('🧱 브릭모델 전시관 초기화 시작');
    const statusDiv = document.getElementById('upstashStatus');
    const gallery = document.getElementById('gallery');

    try {
        const data = await upstashClient.get('gallery_data');

        if (data) {
            console.log('✅ Upstash에서 데이터를 성공적으로 불러왔습니다.');
            artworks = data.artworks || [];
            comments = data.comments || {};
            likes = data.likes || {};
            settings = { ...defaultSettings, ...data.settings };
            
            statusDiv.innerHTML = '<span class="status-indicator status-success">✅ Upstash DB 연결됨</span>';
        } else {
            console.log('ℹ️ Upstash에 데이터가 없습니다. 기본 설정으로 시작합니다.');
            settings = { ...defaultSettings };
            statusDiv.innerHTML = '<span class="status-indicator status-warning">ℹ️ DB에 데이터 없음 (초기 상태)</span>';
        }
    } catch (error) {
        console.error('❌ Upstash 연결 실패:', error);
        statusDiv.innerHTML = '<span class="status-indicator status-error">❌ DB 연결 실패</span>';
        showMessage('데이터베이스 연결에 실패했습니다. URL과 토큰을 다시 확인해주세요.', 'error');
        gallery.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: white; padding: 50px;"><h3>데이터베이스 연결에 실패했습니다.</h3><p>인터넷 연결을 확인하거나 관리자에게 문의해주세요.</p></div>`;
    } finally {
        // UI 업데이트
        applyHeaderSettings();
        renderArtworks();
        updateGradeInfo('all');
        updateAdminStats();
        setupDragAndDrop();
        renderStaticHTML(); // 정적 HTML 렌더링
        console.log('✅ UI 렌더링 완료');
    }
}

async function saveDataToUpstash() {
    try {
        await upstashClient.set('gallery_data', { artworks, comments, likes, settings });
        console.log('💾 데이터가 Upstash에 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('❌ Upstash 저장 실패:', error);
        showMessage('데이터 저장에 실패했습니다. 인터넷 연결을 확인해주세요.', 'error');
    }
}


// ----------------------------------------------------------------
// 3. UI 렌더링 및 이벤트 처리
// ----------------------------------------------------------------

// 이벤트 리스너 설정: HTML의 onclick을 제거하고 여기서 이벤트를 관리합니다.
function addEventListeners() {
    // 헤더 버튼
    document.getElementById('upload-panel-btn').addEventListener('click', toggleUploadPanel);
    document.getElementById('admin-panel-btn').addEventListener('click', toggleAdminPanel);

    // 검색 및 필터
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.querySelector('.filters').addEventListener('click', handleFilter);

    // 모달 및 전체화면 닫기
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') closeModal();
    });
    document.getElementById('fullscreenOverlay').addEventListener('click', closeFullscreenImage);
    
    // 키보드 이벤트
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeFullscreenImage();
        }
    });
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const artworkCards = document.querySelectorAll('.artwork-card');
    
    artworkCards.forEach(card => {
        const title = card.querySelector('.artwork-title').textContent.toLowerCase();
        const author = card.querySelector('.artwork-author').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || author.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function handleFilter(e) {
    if (e.target.classList.contains('filter-btn')) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const category = e.target.dataset.category;
        updateGradeInfo(category);
        
        const artworkCards = document.querySelectorAll('.artwork-card');
        artworkCards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
}


function renderArtworks() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    
    if (artworks.length === 0) {
        gallery.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: white; padding: 50px;"><h3>아직 등록된 작품이 없습니다</h3><p>첫 번째 작품을 등록해보세요! 😊</p></div>`;
        return;
    }
    
    artworks.forEach((artwork, index) => {
        const card = document.createElement('div');
        card.className = 'artwork-card';
        card.setAttribute('data-category', artwork.grade);
        card.addEventListener('click', () => showArtworkModal(artwork.id));
        
        const likeCount = likes[artwork.id] || 0;
        const artworkComments = comments[artwork.id] || [];
        
        card.innerHTML = `
            <div class="artwork-image">
                ${artwork.image ? `<img src="${artwork.image}" alt="${artwork.title}" loading="lazy">` : '<div class="placeholder">🧱</div>'}
            </div>
            <div class="artwork-info">
                <h3 class="artwork-title">${artwork.title}</h3>
                <p class="artwork-author">${artwork.author} (${artwork.grade})</p>
                <div class="artwork-stats">
                    <span>❤️ ${likeCount}</span>
                    <span>💬 ${artworkComments.length}</span>
                </div>
            </div>
        `;
        gallery.appendChild(card);
    });
}

function showArtworkModal(artworkId) {
    // ... (이하 모든 함수는 이전과 동일한 로직을 가집니다)
    // 모달창을 열고, 내용을 채우는 등의 함수들...
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function closeFullscreenImage() {
    document.getElementById('fullscreenOverlay').style.display = 'none';
}

function toggleUploadPanel() {
    const panel = document.getElementById('uploadPanel');
    panel.classList.toggle('active');
    // ...
}

function toggleAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (!panel.classList.contains('active')) {
        const password = prompt('관리자 비밀번호를 입력하세요:');
        if (password === settings.adminPassword) {
            panel.classList.add('active');
            isAdminMode = true;
            // ...
        } else {
            alert('비밀번호가 틀렸습니다.');
        }
    } else {
        panel.classList.remove('active');
        isAdminMode = false;
    }
}


function applyHeaderSettings() {
    document.getElementById('headerTitleText').textContent = settings.title;
    document.querySelector('.subtitle').textContent = settings.description;
    // ...
}

function updateGradeInfo(category) {
    // ...
}

function updateAdminStats() {
    // ...
}

function renderStaticHTML() {
    // 관리자/업로드 패널 등 초기에 비어있는 HTML 구조를 여기서 그려줍니다.
    // 예: document.getElementById('uploadPanel').innerHTML = `...`;
}

function setupDragAndDrop() {
    // ...
}

function showMessage(text, type = 'success') {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    document.querySelector('header').appendChild(message);
    setTimeout(() => message.remove(), 3000);
}


// ----------------------------------------------------------------
// 4. 앱 실행
// ----------------------------------------------------------------

// 이벤트 리스너들을 먼저 설정합니다.
addEventListeners();
// 초기 데이터를 로딩하고 앱을 시작합니다.
loadInitialData();
