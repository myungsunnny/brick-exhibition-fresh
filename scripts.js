// ----------------------------------------------------------------
// 1. 앱 초기화 및 전역 변수
// ----------------------------------------------------------------

// Cloudinary 설정 (이미지 업로드용)
const CLOUDINARY_CLOUD_NAME = 'dc0hyzldx'; // 본인의 Cloudinary Cloud Name으로 변경하세요.
const CLOUDINARY_UPLOAD_PRESET = 'daebul_fresh'; // 본인의 Cloudinary Upload Preset으로 변경하세요.

// 전역 변수: 앱 전체에서 사용될 데이터와 상태를 저장합니다.
let artworks = [];
let comments = {};
let likes = {};
let settings = {};
let isAdminMode = false;

// 기본 설정값 (서버에 데이터가 없을 경우 사용)
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
        '2학년': { title: '🎨 2학년 브릭모델 작품', description: '2학년 친구들은 더욱 정교한 작품을 만들 수 있게 되었어요. 색깔 조합과 기본 구조를 이해하며 자신만의 개성이 담긴 작품들을 선보입니다.' },
        '3학년': { title: '🏗️ 3학년 브릭모델 작품', description: '3학년이 되면서 더욱 복잡한 구조물을 만들 수 있게 되었어요. 건축물의 기본 원리를 이해하고 계획적으로 작품을 제작하는 능력이 늘어났습니다.' },
        '4학년': { title: '🚀 4학년 브릭모델 작품', description: '4학년 친구들은 테마가 있는 작품들을 만들기 시작했어요. 과학적 사고와 창의적 아이디어를 결합하여 미래 도시, 우주선 등 상상력이 풍부한 작품들을 제작합니다.' },
        '5학년': { title: '🎯 5학년 브릭모델 작품', description: '5학년 작품들은 한층 더 정교하고 완성도가 높아졌어요. 기능적인 요소들을 고려하며 실용적이면서도 아름다운 작품들을 만들어 냅니다.' },
        '6학년': { title: '🏆 6학년 브릭모델 작품', description: '6학년 친구들의 작품은 정말 놀라워요! 수년간 쌓은 경험과 실력으로 복잡한 메커니즘, 대형 구조물, 정교한 디테일을 가진 작품들을 완성합니다.' }
    }
};

// 앱이 처음 시작될 때 실행되는 메인 함수
document.addEventListener('DOMContentLoaded', () => {
    addEventListeners();
    loadInitialData();
});


// ----------------------------------------------------------------
// 2. 서버 통신 (API 호출)
// ----------------------------------------------------------------

async function loadInitialData() {
    console.log('🚀 데이터 로딩을 시작합니다...');
    const gallery = document.getElementById('gallery');
    try {
        const response = await fetch('/api/data');
        if (!response.ok) {
            throw new Error(`서버 오류: ${response.statusText}`);
        }
        const data = await response.json();
        
        if (Object.keys(data).length > 0) {
            artworks = data.artworks || [];
            comments = data.comments || {};
            likes = data.likes || {};
            settings = { ...defaultSettings, ...data.settings };
            console.log('✅ 데이터를 성공적으로 불러왔습니다.');
        } else {
            settings = { ...defaultSettings };
            console.log('ℹ️ 서버에 데이터가 없습니다. 기본 설정으로 시작합니다.');
        }
        
        renderAll();

    } catch (error) {
        console.error('❌ 데이터 로딩 실패:', error);
        gallery.innerHTML = `<div class="loading-message" style="grid-column: 1/-1; text-align: center; color: white; padding: 50px;">
            <h3>데이터를 불러오는데 실패했습니다.</h3>
            <p>인터넷 연결을 확인하거나 관리자에게 문의해주세요.</p>
        </div>`;
        showMessage('데이터 로딩에 실패했습니다.', 'error');
    }
}

async function saveData() {
    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ artworks, comments, likes, settings }),
        });
        if (!response.ok) {
            throw new Error('서버에 데이터를 저장하는데 실패했습니다.');
        }
        console.log('💾 데이터가 서버에 성공적으로 저장되었습니다.');
        return await response.json();
    } catch (error) {
        console.error('❌ 데이터 저장 실패:', error);
        showMessage('데이터 저장에 실패했습니다.', 'error');
    }
}


// ----------------------------------------------------------------
// 3. UI 렌더링 함수
// ----------------------------------------------------------------

function renderAll() {
    applyHeaderSettings();
    renderArtworks();
    renderStaticHTML();
    updateGradeInfo(document.querySelector('.filter-btn.active').dataset.category);
    updateAdminStats();
    if (isAdminMode) {
        renderAdminTables();
    }
}

function applyHeaderSettings() {
    document.title = settings.title || '브릭모델 전시관';
    document.getElementById('headerTitleText').textContent = settings.title || '브릭모델 전시관';
    document.querySelector('.subtitle').textContent = settings.description || '';
    const headerImage = document.getElementById('headerImage');
    if (settings.headerImage) {
        headerImage.src = settings.headerImage;
        headerImage.style.display = 'inline-block';
    } else {
        headerImage.style.display = 'none';
    }
}

function renderArtworks() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    
    if (artworks.length === 0) {
        gallery.innerHTML = `<div class="loading-message" style="grid-column: 1/-1; text-align: center; color: white; padding: 50px;"><h3>아직 등록된 작품이 없습니다.</h3><p>첫 작품을 등록해보세요!</p></div>`;
        return;
    }
    
    artworks.forEach(artwork => {
        const card = document.createElement('div');
        card.className = 'artwork-card';
        card.dataset.id = artwork.id;
        card.dataset.category = artwork.grade;
        
        const likeCount = likes[artwork.id] || 0;
        const commentCount = (comments[artwork.id] || []).length;
        
        card.innerHTML = `
            <div class="artwork-image">
                ${artwork.image ? `<img src="${artwork.image}" alt="${artwork.title}" loading="lazy">` : '<div class="placeholder">🧱</div>'}
            </div>
            <div class="artwork-info">
                <h3 class="artwork-title">${artwork.title}</h3>
                <p class="artwork-author">${artwork.author} (${artwork.grade})</p>
                <div class="artwork-stats">
                    <span>❤️ ${likeCount}</span>
                    <span>💬 ${commentCount}</span>
                </div>
            </div>
        `;
        gallery.appendChild(card);
    });
}

function renderStaticHTML() {
    renderStatusPanel();
    renderUploadPanel();
    renderAdminPanel();
    renderGradeInfoPanel();
}

function renderStatusPanel() {
    document.getElementById('statusSection').innerHTML = `
        <h3>🚀 시스템 상태</h3>
        <div id="apiStatus"><span class="status-indicator status-success">✅ API 연결됨</span></div>
        <div id="artworkCount"><span class="status-indicator">등록된 작품: <strong id="totalCount">0</strong>개</span></div>
        <div id="commentCount"><span class="status-indicator">총 댓글: <strong id="totalComments">0</strong>개</span></div>
    `;
}

function renderUploadPanel() {
    document.getElementById('uploadPanel').innerHTML = `
        <h2>✏️ 새로운 작품 등록</h2>
        <form id="artworkForm">
            <div class="form-group"><label for="title">작품 제목</label><input type="text" id="title" required></div>
            <div class="form-group"><label for="author">작가명</label><input type="text" id="author" required></div>
            <div class="form-group">
                <label for="grade">학년</label>
                <select id="grade" required>
                    <option value="">선택하세요</option>
                    <option value="1">1학년</option><option value="2">2학년</option><option value="3">3학년</option>
                    <option value="4">4학년</option><option value="5">5학년</option><option value="6">6학년</option>
                </select>
            </div>
            <div class="form-group"><label for="description">작품 설명</label><textarea id="description" placeholder="작품에 대해 설명해주세요..." required></textarea></div>
            <div class="form-group">
                <label>작품 사진</label>
                <div class="image-upload" id="image-upload-box">
                    <input type="file" id="imageFile" accept="image/*" style="display:none;">
                    <div id="uploadText">📁 이미지를 선택하세요</div>
                    <img id="imagePreview" class="image-preview" alt="미리보기">
                </div>
            </div>
            <button type="submit" class="btn btn-primary" id="submitBtn">작품 등록하기</button>
        </form>
    `;
}

function renderAdminPanel() {
    document.getElementById('adminPanel').innerHTML = `
        <h2>⚙️ 관리자 모드</h2>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-number" id="statArtworks">0</div><div class="stat-label">총 작품 수</div></div>
            <div class="stat-card"><div class="stat-number" id="statComments">0</div><div class="stat-label">총 댓글 수</div></div>
            <div class="stat-card"><div class="stat-number" id="statLikes">0</div><div class="stat-label">총 좋아요 수</div></div>
            <div class="stat-card"><div class="stat-number" id="statToday">0</div><div class="stat-label">오늘 등록</div></div>
        </div>
        <div class="admin-tabs" id="admin-tabs-container">
            <button class="admin-tab active" data-tab="artworks">작품 관리</button>
            <button class="admin-tab" data-tab="comments">댓글 관리</button>
            <button class="admin-tab" data-tab="users">사용자 관리</button>
            <button class="admin-tab" data-tab="settings">사이트 설정</button>
        </div>
        <div class="admin-content active" id="artworksContent"></div>
        <div class="admin-content" id="commentsContent"></div>
        <div class="admin-content" id="usersContent"></div>
        <div class="admin-content" id="settingsContent"></div>
    `;
}

function renderGradeInfoPanel() {
    document.getElementById('gradeInfoSection').innerHTML = `
        <div class="grade-info-content">
            <h3 id="gradeInfoTitle"></h3>
            <p id="gradeInfoDescription"></p>
        </div>
        <div class="grade-stats" id="gradeStatsContainer"></div>
    `;
}

// ... 이하는 이전과 동일하게 유지 ...

// ----------------------------------------------------------------
// 4. 이벤트 핸들러 및 유틸리티 함수
// ----------------------------------------------------------------

function addEventListeners() {
    document.getElementById('upload-panel-btn').addEventListener('click', toggleUploadPanel);
    document.getElementById('admin-panel-btn').addEventListener('click', toggleAdminPanel);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.querySelector('.filters').addEventListener('click', handleFilter);
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    document.getElementById('fullscreenOverlay').addEventListener('click', closeFullscreenImage);

    document.body.addEventListener('click', (e) => {
        const card = e.target.closest('.artwork-card');
        if (card) showArtworkModal(card.dataset.id);
        if (e.target.closest('#image-upload-box')) document.getElementById('imageFile').click();
        if (e.target.closest('#admin-tabs-container')) handleAdminTabClick(e);
    });

    document.body.addEventListener('submit', async (e) => {
        if (e.target.id === 'artworkForm') {
            e.preventDefault();
            await handleArtworkFormSubmit();
        }
    });

    document.body.addEventListener('change', (e) => {
        if (e.target.id === 'imageFile') previewImage(e.target.files[0]);
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeFullscreenImage();
        }
    });
}

async function handleArtworkFormSubmit() {
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '등록 중...';

    try {
        const imageFile = document.getElementById('imageFile').files[0];
        let imageUrl = '';
        if (imageFile) {
            submitBtn.textContent = '이미지 업로드 중...';
            imageUrl = await uploadImageToCloudinary(imageFile);
            if (!imageUrl) throw new Error('이미지 업로드 실패');
        }

        const newArtwork = {
            id: Date.now().toString(),
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            grade: document.getElementById('grade').value + '학년',
            description: document.getElementById('description').value,
            image: imageUrl,
            createdAt: new Date().toISOString()
        };

        artworks.unshift(newArtwork);
        await saveData();
        
        showMessage('작품이 성공적으로 등록되었습니다!', 'success');
        document.getElementById('artworkForm').reset();
        previewImage(null);
        renderArtworks();
        updateAdminStats();
        toggleUploadPanel();

    } catch (error) {
        showMessage(`작품 등록 실패: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '작품 등록하기';
    }
}

async function uploadImageToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Cloudinary 업로드 실패');
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('❌ Cloudinary 업로드 오류:', error);
        return null;
    }
}

function previewImage(file) {
    const preview = document.getElementById('imagePreview');
    const uploadText = document.getElementById('uploadText');
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            preview.src = e.target.result;
            preview.style.display = 'block';
            uploadText.style.display = 'none';
        };
        reader.readAsDataURL(file);
    } else {
        preview.src = '';
        preview.style.display = 'none';
        uploadText.style.display = 'block';
    }
}

function toggleUploadPanel() {
    document.getElementById('uploadPanel').classList.toggle('active');
}

function toggleAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (!panel.classList.contains('active')) {
        const password = prompt('관리자 비밀번호를 입력하세요:');
        if (password === settings.adminPassword) {
            panel.classList.add('active');
            isAdminMode = true;
            renderAdminTables();
        } else if (password) {
            showMessage('비밀번호가 틀렸습니다.', 'error');
        }
    } else {
        panel.classList.remove('active');
        isAdminMode = false;
    }
}

function showMessage(text, type = 'success') {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) existingMessage.remove();

    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
}

function showArtworkModal(id) {
    // ... (모달 관련 로직은 복잡하므로 생략, 이전 코드 참조)
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function closeFullscreenImage() {
    document.getElementById('fullscreenOverlay').style.display = 'none';
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    document.querySelectorAll('.artwork-card').forEach(card => {
        const title = card.querySelector('.artwork-title').textContent.toLowerCase();
        const author = card.querySelector('.artwork-author').textContent.toLowerCase();
        card.style.display = (title.includes(searchTerm) || author.includes(searchTerm)) ? 'block' : 'none';
    });
}

function handleFilter(e) {
    if (e.target.classList.contains('filter-btn')) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const category = e.target.dataset.category;
        updateGradeInfo(category);
        document.querySelectorAll('.artwork-card').forEach(card => {
            card.style.display = (category === 'all' || card.dataset.category === category) ? 'block' : 'none';
        });
    }
}

function updateGradeInfo(category) {
    const gradeInfoSection = document.getElementById('gradeInfoSection');
    const titleEl = document.getElementById('gradeInfoTitle');
    const descEl = document.getElementById('gradeInfoDescription');
    const statsEl = document.getElementById('gradeStatsContainer');

    const gradeKey = category.includes('학년') ? category : 'all';
    const info = settings.gradeDescriptions[gradeKey];

    if (info) {
        titleEl.textContent = info.title;
        descEl.textContent = info.description;
        gradeInfoSection.classList.add('active');
    } else {
        gradeInfoSection.classList.remove('active');
    }
    
    // ... (통계 업데이트 로직)
}

function updateAdminStats() {
    // ...
}

function renderAdminTables() {
    // ...
}

function handleAdminTabClick(e) {
    if (e.target.classList.contains('admin-tab')) {
        const tab = e.target.dataset.tab;
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById(`${tab}Content`).classList.add('active');
        // 각 탭에 맞는 테이블 렌더링 함수 호출
    }
}

function setupDragAndDrop() {
    // ...
}
