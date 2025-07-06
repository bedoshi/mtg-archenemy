class ArchenemyGame {
    constructor() {
        this.schemes = [...DUSKMOURN_SCHEME_CARDS];
        this.usedSchemes = [];
        this.currentScheme = null;
        this.ongoingSchemes = [];
        this.turnCount = 0;
        this.isJapanese = true;
        
        this.shuffleDeck();
        this.initializeEventListeners();
        this.updateStats();
    }

    shuffleDeck() {
        for (let i = this.schemes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.schemes[i], this.schemes[j]] = [this.schemes[j], this.schemes[i]];
        }
    }

    initializeEventListeners() {
        document.getElementById('next-scheme').addEventListener('click', () => {
            this.drawNextScheme();
        });

        document.getElementById('reset-game').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('language-switch').addEventListener('change', (e) => {
            this.isJapanese = e.target.checked;
            if (this.currentScheme) {
                this.displayScheme(this.currentScheme);
            }
        });

        // Modal event listeners
        document.addEventListener('click', (e) => {
            if (e.target.closest('#total-cards-section')) {
                this.openCardGalleryModal('all');
            } else if (e.target.closest('#ongoing-cards-section')) {
                this.openCardGalleryModal('ongoing');
            } else if (e.target.closest('#regular-cards-section')) {
                this.openCardGalleryModal('regular');
            } else if (e.target.closest('#used-cards-control-btn')) {
                this.openCardGalleryModal('used');
            }
        });

        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeCardGalleryModal();
        });

        document.getElementById('card-gallery-modal').addEventListener('click', (e) => {
            if (e.target.id === 'card-gallery-modal') {
                this.closeCardGalleryModal();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCardGalleryModal();
            }
        });

        // Touch/swipe support for mobile
        this.initializeTouchSupport();
    }

    drawNextScheme() {
        // First, abandon current scheme if it exists
        if (this.currentScheme) {
            // If current scheme is ongoing, remove from ongoing schemes
            if (this.currentScheme.type_line.includes('Ongoing')) {
                const index = this.ongoingSchemes.findIndex(os => os.collector_number === this.currentScheme.collector_number);
                if (index > -1) {
                    this.ongoingSchemes.splice(index, 1);
                }
            }
            // Put the abandoned scheme at the bottom of the deck
            this.schemes.push(this.currentScheme);
        }

        if (this.schemes.length === 0) {
            this.showMessage('すべての計略カードが使用されました！デッキをリセットしてください。');
            return;
        }

        this.currentScheme = this.schemes.shift();
        this.usedSchemes.push(this.currentScheme);
        this.turnCount++;

        // If it's an ongoing scheme, add to ongoing schemes list
        if (this.currentScheme.type_line.includes('Ongoing')) {
            this.ongoingSchemes.push(this.currentScheme);
        }

        this.displayScheme(this.currentScheme);
        this.updateTurnCounter();
        this.updateStats();
    }

    displayScheme(scheme) {
        const cardDisplay = document.getElementById('card-display');
        
        const name = this.isJapanese ? scheme.name_ja : scheme.name;
        const typeLine = this.isJapanese ? scheme.type_line_ja : scheme.type_line;
        const oracleText = this.isJapanese ? scheme.oracle_text_ja : scheme.oracle_text;
        const imageUrl = this.isJapanese ? scheme.image_uris_ja.normal : scheme.image_uris_en.normal;

        cardDisplay.innerHTML = `
            <div class="card">
                <img src="${imageUrl}" alt="${name}" class="card-image" onerror="this.style.display='none'">
                <div class="card-title">${name}</div>
                <div class="card-type">${typeLine}</div>
                <div class="card-text">${oracleText.replace(/\n/g, '<br>')}</div>
                ${scheme.flavor_text ? `<div class="card-flavor">${scheme.flavor_text}</div>` : ''}
                <div class="card-details">
                    <span>アーティスト: ${scheme.artist}</span>
                    <span>セット: ${scheme.set.toUpperCase()}</span>
                    <span>コレクター番号: ${scheme.collector_number}</span>
                </div>
                ${this.ongoingSchemes.length > 0 ? `
                    <div style="margin-top: 20px; padding: 15px; background: rgba(255, 165, 0, 0.2); border-radius: 10px;">
                        <strong>継続中の計略:</strong><br>
                        ${this.ongoingSchemes.map(os => this.isJapanese ? os.name_ja : os.name).join(', ')}
                    </div>
                ` : ''}
            </div>
        `;
    }


    resetGame() {
        console.log('Game reset called');
        this.schemes = [...DUSKMOURN_SCHEME_CARDS];
        this.usedSchemes = [];
        this.currentScheme = null;
        this.ongoingSchemes = [];
        this.turnCount = 0;
        
        this.shuffleDeck();
        this.updateTurnCounter();
        this.updateStats();
        this.showInitialScreen();
        console.log('Game reset completed');
    }

    showInitialScreen() {
        console.log('Showing initial screen');
        const cardDisplay = document.getElementById('card-display');
        cardDisplay.innerHTML = `
            <div class="welcome-message">
                「次の計略」ボタンを押してアーチエネミーゲームを開始してください
            </div>
            <div class="stats">
                <div class="stat-card clickable" id="total-cards-section">
                    <div class="stat-number">40</div>
                    <div class="stat-label">総計略カード数</div>
                </div>
                <div class="stat-card clickable" id="ongoing-cards-section">
                    <div class="stat-number">12</div>
                    <div class="stat-label">持続計略</div>
                </div>
                <div class="stat-card clickable" id="regular-cards-section">
                    <div class="stat-number">28</div>
                    <div class="stat-label">通常計略</div>
                </div>
            </div>
        `;
        console.log('Initial screen HTML set');
    }

    updateTurnCounter() {
        const counter = document.getElementById('turn-counter');
        if (this.turnCount === 0) {
            counter.textContent = 'ゲーム開始前';
        } else {
            counter.textContent = `ターン ${this.turnCount}`;
        }
        
        // Update used cards button visibility and text
        const usedCardsBtn = document.getElementById('used-cards-control-btn');
        if (this.usedSchemes.length > 0) {
            usedCardsBtn.style.display = 'inline-block';
            usedCardsBtn.textContent = `過去の計略を見る (${this.usedSchemes.length})`;
        } else {
            usedCardsBtn.style.display = 'none';
        }
    }

    updateStats() {
        const remainingCardsElement = document.getElementById('remaining-cards');
        if (remainingCardsElement) {
            remainingCardsElement.textContent = this.schemes.length;
        }
    }

    showMessage(message) {
        const cardDisplay = document.getElementById('card-display');
        cardDisplay.innerHTML = `
            <div class="welcome-message">
                ${message}
            </div>
        `;
        
        // Auto-hide message after 3 seconds if it's a temporary message
        if (message.includes('シャッフル') || message.includes('破棄')) {
            setTimeout(() => {
                if (cardDisplay.innerHTML.includes(message)) {
                    cardDisplay.innerHTML = `
                        <div class="welcome-message">
                            「次の計略」ボタンを押してゲームを続行してください
                        </div>
                    `;
                }
            }, 3000);
        }
    }

    openCardGalleryModal(type = 'all') {
        const modal = document.getElementById('card-gallery-modal');
        const cardsGrid = document.getElementById('cards-grid');
        const modalTitle = document.querySelector('.modal-title');
        
        // Clear existing content
        cardsGrid.innerHTML = '';
        
        // Filter cards based on type
        let cardsToShow = [];
        let titleText = '';
        
        if (type === 'ongoing') {
            cardsToShow = DUSKMOURN_SCHEME_CARDS.filter(card => 
                card.type_line_ja.includes('持続') || card.type_line.includes('Ongoing')
            );
            titleText = '持続計略カード一覧';
        } else if (type === 'regular') {
            cardsToShow = DUSKMOURN_SCHEME_CARDS.filter(card => 
                !card.type_line_ja.includes('持続') && !card.type_line.includes('Ongoing')
            );
            titleText = '通常計略カード一覧';
        } else if (type === 'used') {
            cardsToShow = this.usedSchemes.slice().reverse(); // 新しい順に表示
            titleText = '過去の計略カード一覧';
        } else {
            cardsToShow = DUSKMOURN_SCHEME_CARDS;
            titleText = '計略カード一覧';
        }
        
        // Update modal title
        modalTitle.textContent = titleText;
        
        // Populate with filtered cards
        cardsToShow.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card-item';
            
            const name = this.isJapanese ? card.name_ja : card.name;
            const typeLine = this.isJapanese ? card.type_line_ja : card.type_line;
            const imageUrl = this.isJapanese ? card.image_uris_ja.normal : card.image_uris_en.normal;
            
            cardElement.innerHTML = `
                <img src="${imageUrl}" alt="${name}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMjIyIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjE2Ij7jgqvjg7zjg4njgYzloqXjgJXjgozjgb7jgZvjgpM8L3RleHQ+Cjwvc3ZnPgo='">
                <div class="card-item-title">${name}</div>
                <div class="card-item-type">${typeLine}</div>
                <div class="card-item-number">#${card.collector_number}</div>
            `;
            cardsGrid.appendChild(cardElement);
        });
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeCardGalleryModal() {
        const modal = document.getElementById('card-gallery-modal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    initializeTouchSupport() {
        const cardsGrid = document.getElementById('cards-grid');
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        let isDragging = false;

        cardsGrid.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
        }, { passive: true });

        cardsGrid.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
            
            const diffX = Math.abs(currentX - startX);
            const diffY = Math.abs(currentY - startY);
            
            // Allow vertical scrolling but prevent horizontal scrolling
            if (diffX > diffY) {
                e.preventDefault();
            }
        }, { passive: false });

        cardsGrid.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            const diffX = currentX - startX;
            const diffY = currentY - startY;
            
            // Detect swipe gestures (minimum 50px movement)
            if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 0) {
                    // Swipe right - could be used for navigation if needed
                    console.log('Swiped right');
                } else {
                    // Swipe left - could be used for navigation if needed  
                    console.log('Swiped left');
                }
            }
            
            isDragging = false;
        }, { passive: true });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.archenemyGame = new ArchenemyGame();
});