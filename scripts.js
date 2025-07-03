// ----------------------------------------------------------------
// 1. 앱 초기화 및 전역 변수
// ----------------------------------------------------------------

// 전역 변수: 앱 전체에서 사용될 데이터와 상태를 저장합니다.
let artworks = [];
let comments = {};
let likes = {};
let settings = {};
let isAdminMode = false;

// 앱이 처음 시작될 때 실행되는 메인 함수
document.addEventListener('DOMContentLoaded', () => {
    addEventListeners();
    loadInitialData();
});


// ----------------------------------------------------------------
// 2. 서버 통신 (API 호출)
// ----------------------------------------------------------------

/**
 * 서버에서 모든 갤러리 데이터를 가져옵니다.
 * (artworks, comments, likes, settings)
 */
async function loadInitialData() {
    console.log('🚀 데이터 로딩을 시작합니다...');
    const gallery = document.getElementById('gallery');
    try {
        const response = await fetch('/api/data');
        if (!response.ok) {
            throw new Error(`서버 오류: ${response.statusText}`);
        }
        const data = await response.json();
        
        // 전역 변수에 데이터 할당
        artworks = data.artworks || [];
        comments = data.comments || {};
        likes = data.likes || {};
        settings = data.settings || {};

        console.log('✅ 데이터를 성공적으로 불러왔습니다.');
        
        // UI 업데이트
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

/**
 * 변경된 데이터를 서버에 저장합니다.
 */
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

/**
 * 모든 UI 컴포넌트를 다시 그립니다.
 */
function renderAll() {
    applyHeaderSettings();
    renderArtworks();
    renderStaticHTML(); // 동적으로 생성될 HTML 영역을 그림
    updateGradeInfo(document.querySelector('.filter-btn.active').dataset.category);
    updateAdminStats();
    if (isAdminMode) {
        renderAdminTables();
    }
}

/**
 * 헤더(제목, 설명, 로고)를 렌더링합니다.
 */
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

/**
 * 작품 갤러리를 렌더링합니다.
 */
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

/**
 * 동적으로 생성되는 HTML 영역 (패널, 모달 등)의 기본 틀을 렌더링합니다.
 */
function renderStaticHTML() {
    // 이 함수들은 각 패널의 기본 HTML 구조를 그려줍니다.
    renderStatusPanel();
    renderUploadPanel();
    renderAdminPanel();
    renderGradeInfoPanel();
}

// 각 패널의 HTML을 그리는 함수들...
function renderStatusPanel() {
    const statusSection = document.getElementById('statusSection');
    statusSection.innerHTML = `
        <h3>🚀 시스템 상태</h3>
        <div id="upstashStatus">
            <span class="status-indicator status-success">✅ API 연결됨</span>
        </div>
        <div id="artworkCount">
            <span class="status-indicator">등록된 작품: <strong id="totalCount">0</strong>개</span>
        </div>
        <div id="commentCount">
            <span class="status-indicator">총 댓글: <strong id="totalComments">0</strong>개</span>
        </div>
    `;
}

function renderUploadPanel() {
    const uploadPanel = document.getElementById('uploadPanel');
    uploadPanel.innerHTML = `
        <h2>✏️ 새로운 작품 등록</h2>
        <form id="artworkForm">
            <div class="form-group">
                <label for="title">작품 제목</label>
                <input type="text" id="title" required>
            </div>
            <div class="form-group">
                <label for="author">작가명</label>
                <input type="text" id="author" required>
            </div>
            <div class="form-group">
                <label for="grade">학년</label>
                <select id="grade" required>
                    <option value="">선택하세요</option>
                    <option value="1">1학년</option>
                    <option value="2">2학년</option>
                    <option value="3">3학년</option>
                    <option value="4">4학년</option>
                    <option value="5">5학년</option>
                    <option value="6">6학년</option>
                </select>
            </div>
            <div class="form-group">
                <label for="description">작품 설명</label>
                <textarea id="description" placeholder="작품에 대해 설명해주세요..." required></textarea>
            </div>
            <div class="form-group">
                <label>작품 사진</label>
                <div class="image-upload" id="image-upload-box">
                    <input type="file" id="imageFile" accept="image/*">
                    <div id="uploadText">📁 이미지를 선택하세요</div>
                    <img id="imagePreview" class="image-preview" alt="미리보기">
                </div>
            </div>
            <button type="submit" class="btn btn-primary" id="submitBtn">작품 등록하기</button>
        </form>
    `;
    // 폼 제출 이벤트는 addEventListeners에서 한 번만 설정합니다.
}

function renderAdminPanel() {
    // 관리자 패널의 복잡한 HTML 구조
}

function renderGradeInfoPanel() {
    // 학년 정보 패널의 HTML 구조
}

// ... 기타 UI 렌더링 함수들 ...


// ----------------------------------------------------------------
// 4. 이벤트 핸들러 및 유틸리티 함수
// ----------------------------------------------------------------

/**
 * 모든 이벤트 리스너를 설정합니다.
 */
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
    
    // 동적으로 생성된 요소에 대한 이벤트 위임(Event Delegation)
    document.body.addEventListener('click', (e) => {
        // 갤러리 카드 클릭 시 모달 열기
        const card = e.target.closest('.artwork-card');
        if (card) {
            showArtworkModal(card.dataset.id);
        }
        
        // 업로드 박스 클릭 시 파일 입력창 열기
        if (e.target.closest('#image-upload-box')) {
            document.getElementById('imageFile').click();
        }
    });
    
    // 폼 제출 이벤트
    document.body.addEventListener('submit', async (e) => {
        if (e.target.id === 'artworkForm') {
            e.preventDefault();
            await handleArtworkFormSubmit();
        }
    });
    
    // 파일 변경 이벤트
    document.body.addEventListener('change', (e) => {
        if (e.target.id === 'imageFile') {
            previewImage(e.target.files[0]);
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
        previewImage(null); // 미리보기 초기화
        renderArtworks(); // 갤러리 새로고침
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

// ... 나머지 모든 헬퍼 함수들 (toggleUploadPanel, showMessage 등)
// (이전 코드와 대부분 동일하므로 생략)
function toggleUploadPanel() {
    document.getElementById('uploadPanel').classList.toggle('active');
}
function toggleAdminPanel() {
    // ...
}
function showMessage(text, type = 'success') {
    // ...
}
function showArtworkModal(id) {
    // ...
}
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}
function closeFullscreenImage() {
    document.getElementById('fullscreenOverlay').style.display = 'none';
}
function handleSearch(e) {
    // ...
}
function handleFilter(e) {
    // ...
}
function updateGradeInfo(category) {
    // ...
}
function updateAdminStats() {
    // ...
}
function renderAdminTables() {
    // ...
}
function setupDragAndDrop() {
    // ...
}

