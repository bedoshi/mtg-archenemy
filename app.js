/**
 * Constants and configuration
 */
const GAME_CONSTANTS = {
    ELEMENT_IDS: {
        NEXT_SCHEME: 'next-scheme',
        UNDO_SCHEME: 'undo-scheme',
        RESET_GAME: 'reset-game',
        LANGUAGE_SWITCH: 'language-switch',
        TURN_COUNTER: 'turn-counter',
        CARD_DISPLAY: 'card-display',
        MODAL_CLOSE: 'modal-close',
        CARD_GALLERY_MODAL: 'card-gallery-modal',
        CARDS_GRID: 'cards-grid',
        USED_CARDS_CONTROL_BTN: 'used-cards-control-btn',
        TOTAL_CARDS_SECTION: 'total-cards-section',
        ONGOING_CARDS_SECTION: 'ongoing-cards-section',
        REGULAR_CARDS_SECTION: 'regular-cards-section',
        REMAINING_CARDS: 'remaining-cards'
    },
    SELECTORS: {
        MODAL_TITLE: '.modal-title'
    },
    CARD_TYPES: {
        ALL: 'all',
        ONGOING: 'ongoing',
        REGULAR: 'regular',
        USED: 'used'
    },
    TIMEOUTS: {
        AUTO_HIDE_MESSAGE: 3000
    },
    TOUCH: {
        MIN_SWIPE_DISTANCE: 50
    },
    ONGOING_KEYWORDS: {
        JAPANESE: '持続',
        ENGLISH: 'Ongoing'
    },
    MESSAGES: {
        GAME_START: '「次の計略」ボタンを押してアーチエネミーゲームを開始してください',
        GAME_CONTINUE: '「次の計略」ボタンを押してゲームを続行してください',
        ALL_CARDS_USED: 'すべての計略カードが使用されました！デッキをリセットしてください。',
        GAME_NOT_STARTED: 'ゲーム開始前'
    },
    MODAL_TITLES: {
        ALL_CARDS: '計略カード一覧',
        ONGOING_CARDS: '持続計略カード一覧',
        REGULAR_CARDS: '通常計略カード一覧',
        USED_CARDS: '過去の計略カード一覧'
    },
    FALLBACK_IMAGE: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMjIyIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjE2Ij7jgqvjg7zjg4njgYzloqXjgJXjgozjgb7jgZvjgpM8L3RleHQ+Cjwvc3ZnPgo='
};

/**
 * Main game class for MTG Archenemy scheme card management
 */
class ArchenemyGame {
    constructor() {
        this.schemes = [...DUSKMOURN_SCHEME_CARDS];
        this.usedSchemes = [];
        this.currentScheme = null;
        this.ongoingSchemes = [];
        this.turnCount = 0;
        this.isJapanese = true;
        
        // Undo functionality
        this.previousState = null;
        
        // Cache DOM elements
        this.domCache = new Map();
        
        this.shuffleDeck();
        this.initializeEventListeners();
        this.updateStats();
    }

    /**
     * Get cached DOM element or query and cache it
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} DOM element
     */
    getElement(id) {
        if (!this.domCache.has(id)) {
            const element = document.getElementById(id);
            this.domCache.set(id, element);
        }
        return this.domCache.get(id);
    }

    /**
     * Get localized card data based on current language setting
     * @param {Object} card - Card object
     * @returns {Object} Localized card data
     */
    getLocalizedCardData(card) {
        return {
            name: this.isJapanese ? card.name_ja : card.name,
            typeLine: this.isJapanese ? card.type_line_ja : card.type_line,
            oracleText: this.isJapanese ? card.oracle_text_ja : card.oracle_text,
            imageUrl: this.isJapanese ? card.image_uris_ja.normal : card.image_uris_en.normal
        };
    }

    /**
     * Check if a scheme is an ongoing scheme
     * @param {Object} scheme - Scheme card object
     * @returns {boolean} True if ongoing scheme
     */
    isOngoingScheme(scheme) {
        return scheme.type_line.includes(GAME_CONSTANTS.ONGOING_KEYWORDS.ENGLISH) ||
               scheme.type_line_ja.includes(GAME_CONSTANTS.ONGOING_KEYWORDS.JAPANESE);
    }

    shuffleDeck() {
        for (let i = this.schemes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.schemes[i], this.schemes[j]] = [this.schemes[j], this.schemes[i]];
        }
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        this.initializeButtonListeners();
        this.initializeModalListeners();
        this.initializeKeyboardListeners();
        this.initializeTouchSupport();
    }

    /**
     * Initialize button event listeners
     */
    initializeButtonListeners() {
        const nextSchemeBtn = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.NEXT_SCHEME);
        const undoSchemeBtn = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.UNDO_SCHEME);
        const resetGameBtn = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.RESET_GAME);
        const languageSwitch = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.LANGUAGE_SWITCH);

        if (nextSchemeBtn) {
            nextSchemeBtn.addEventListener('click', () => this.drawNextScheme());
        }

        if (undoSchemeBtn) {
            undoSchemeBtn.addEventListener('click', () => this.undoLastScheme());
        }

        if (resetGameBtn) {
            resetGameBtn.addEventListener('click', () => this.resetGame());
        }

        if (languageSwitch) {
            languageSwitch.addEventListener('change', (e) => {
                this.isJapanese = e.target.checked;
                if (this.currentScheme) {
                    this.displayScheme(this.currentScheme);
                }
            });
        }
    }

    /**
     * Initialize modal event listeners
     */
    initializeModalListeners() {
        // Delegated click event for card sections
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[id$="-section"], #' + GAME_CONSTANTS.ELEMENT_IDS.USED_CARDS_CONTROL_BTN);
            if (!target) return;

            const modalTypeMap = {
                [GAME_CONSTANTS.ELEMENT_IDS.TOTAL_CARDS_SECTION]: GAME_CONSTANTS.CARD_TYPES.ALL,
                [GAME_CONSTANTS.ELEMENT_IDS.ONGOING_CARDS_SECTION]: GAME_CONSTANTS.CARD_TYPES.ONGOING,
                [GAME_CONSTANTS.ELEMENT_IDS.REGULAR_CARDS_SECTION]: GAME_CONSTANTS.CARD_TYPES.REGULAR,
                [GAME_CONSTANTS.ELEMENT_IDS.USED_CARDS_CONTROL_BTN]: GAME_CONSTANTS.CARD_TYPES.USED
            };

            const modalType = modalTypeMap[target.id];
            if (modalType) {
                this.openCardGalleryModal(modalType);
            }
        });

        const modalClose = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.MODAL_CLOSE);
        const modal = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.CARD_GALLERY_MODAL);

        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeCardGalleryModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === GAME_CONSTANTS.ELEMENT_IDS.CARD_GALLERY_MODAL) {
                    this.closeCardGalleryModal();
                }
            });
        }
    }

    /**
     * Initialize keyboard event listeners
     */
    initializeKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCardGalleryModal();
            }
        });
    }

    /**
     * Draw the next scheme from the deck
     */
    drawNextScheme() {
        try {
            // Save current state before making changes
            this.saveCurrentState();

            this.handleCurrentScheme();

            if (this.schemes.length === 0) {
                this.showMessage(GAME_CONSTANTS.MESSAGES.ALL_CARDS_USED);
                return;
            }

            this.processNewScheme();
            this.updateDisplay();
            this.updateUndoButton();
        } catch (error) {
            console.error('Error drawing next scheme:', error);
        }
    }

    /**
     * Handle current scheme before drawing next one
     */
    handleCurrentScheme() {
        if (this.currentScheme) {
            // If current scheme is ongoing, remove from ongoing schemes
            if (this.isOngoingScheme(this.currentScheme)) {
                this.removeFromOngoingSchemes(this.currentScheme);
            }
            // Put the abandoned scheme at the bottom of the deck
            this.schemes.push(this.currentScheme);
        }
    }

    /**
     * Process the new scheme that was drawn
     */
    processNewScheme() {
        this.currentScheme = this.schemes.shift();
        this.usedSchemes.push(this.currentScheme);
        this.turnCount++;

        // If it's an ongoing scheme, add to ongoing schemes list
        if (this.isOngoingScheme(this.currentScheme)) {
            this.ongoingSchemes.push(this.currentScheme);
        }
    }

    /**
     * Update all display elements
     */
    updateDisplay() {
        this.displayScheme(this.currentScheme);
        this.updateTurnCounter();
        this.updateStats();
    }

    /**
     * Remove scheme from ongoing schemes list
     * @param {Object} scheme - Scheme to remove
     */
    removeFromOngoingSchemes(scheme) {
        const index = this.ongoingSchemes.findIndex(os => os.collector_number === scheme.collector_number);
        if (index > -1) {
            this.ongoingSchemes.splice(index, 1);
        }
    }

    /**
     * Display the current scheme card
     * @param {Object} scheme - Scheme card to display
     */
    displayScheme(scheme) {
        const cardDisplay = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.CARD_DISPLAY);
        if (!cardDisplay) {
            console.error('Card display element not found');
            return;
        }

        const localizedData = this.getLocalizedCardData(scheme);
        const cardHTML = this.generateCardHTML(scheme, localizedData);
        cardDisplay.innerHTML = cardHTML;
    }

    /**
     * Generate HTML for the scheme card
     * @param {Object} scheme - Original scheme object
     * @param {Object} localizedData - Localized card data
     * @returns {string} HTML string
     */
    generateCardHTML(scheme, localizedData) {
        const flavorTextHTML = scheme.flavor_text ? 
            `<div class="card-flavor">${scheme.flavor_text}</div>` : '';
        
        const ongoingSchemesHTML = this.generateOngoingSchemesHTML();
        
        return `
            <div class="card">
                <img src="${localizedData.imageUrl}" alt="${localizedData.name}" class="card-image" onerror="this.style.display='none'">
                <div class="card-title">${localizedData.name}</div>
                <div class="card-type">${localizedData.typeLine}</div>
                <div class="card-text">${localizedData.oracleText.replace(/\n/g, '<br>')}</div>
                ${flavorTextHTML}
                <div class="card-details">
                    <span>アーティスト: ${scheme.artist}</span>
                    <span>セット: ${scheme.set.toUpperCase()}</span>
                    <span>コレクター番号: ${scheme.collector_number}</span>
                </div>
                ${ongoingSchemesHTML}
            </div>
        `;
    }

    /**
     * Generate HTML for ongoing schemes section
     * @returns {string} HTML string for ongoing schemes
     */
    generateOngoingSchemesHTML() {
        if (this.ongoingSchemes.length === 0) {
            return '';
        }

        const ongoingNames = this.ongoingSchemes
            .map(os => this.isJapanese ? os.name_ja : os.name)
            .join(', ');

        return `
            <div style="margin-top: 20px; padding: 15px; background: rgba(255, 165, 0, 0.2); border-radius: 10px;">
                <strong>継続中の計略:</strong><br>
                ${ongoingNames}
            </div>
        `;
    }


    /**
     * Reset the game to initial state
     */
    resetGame() {
        try {
            console.log('Game reset called');
            this.initializeGameState();
            this.shuffleDeck();
            this.updateAllDisplays();
            this.showInitialScreen();
            this.updateUndoButton();
            console.log('Game reset completed');
        } catch (error) {
            console.error('Error resetting game:', error);
        }
    }

    /**
     * Initialize game state to defaults
     */
    initializeGameState() {
        this.schemes = [...DUSKMOURN_SCHEME_CARDS];
        this.usedSchemes = [];
        this.currentScheme = null;
        this.ongoingSchemes = [];
        this.turnCount = 0;
        this.previousState = null;
    }

    /**
     * Update all display elements
     */
    updateAllDisplays() {
        this.updateTurnCounter();
        this.updateStats();
    }

    /**
     * Show the initial welcome screen
     */
    showInitialScreen() {
        console.log('Showing initial screen');
        const cardDisplay = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.CARD_DISPLAY);
        if (!cardDisplay) {
            console.error('Card display element not found');
            return;
        }

        cardDisplay.innerHTML = this.generateInitialScreenHTML();
        console.log('Initial screen HTML set');
    }

    /**
     * Generate HTML for initial screen
     * @returns {string} HTML string for initial screen
     */
    generateInitialScreenHTML() {
        return `
            <div class="welcome-message">
                ${GAME_CONSTANTS.MESSAGES.GAME_START}
            </div>
            <div class="stats">
                <div class="stat-card clickable" id="${GAME_CONSTANTS.ELEMENT_IDS.TOTAL_CARDS_SECTION}">
                    <div class="stat-number">40</div>
                    <div class="stat-label">総計略カード数</div>
                </div>
                <div class="stat-card clickable" id="${GAME_CONSTANTS.ELEMENT_IDS.ONGOING_CARDS_SECTION}">
                    <div class="stat-number">12</div>
                    <div class="stat-label">持続計略</div>
                </div>
                <div class="stat-card clickable" id="${GAME_CONSTANTS.ELEMENT_IDS.REGULAR_CARDS_SECTION}">
                    <div class="stat-number">28</div>
                    <div class="stat-label">通常計略</div>
                </div>
            </div>
        `;
    }

    /**
     * Update the turn counter display
     */
    updateTurnCounter() {
        const counter = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.TURN_COUNTER);
        if (counter) {
            counter.textContent = this.turnCount === 0 ? 
                GAME_CONSTANTS.MESSAGES.GAME_NOT_STARTED : 
                `ターン ${this.turnCount}`;
        }
        
        this.updateUsedCardsButton();
    }

    /**
     * Update used cards button visibility and text
     */
    updateUsedCardsButton() {
        const usedCardsBtn = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.USED_CARDS_CONTROL_BTN);
        if (usedCardsBtn) {
            if (this.usedSchemes.length > 0) {
                usedCardsBtn.style.display = 'inline-block';
                usedCardsBtn.textContent = `過去の計略を見る (${this.usedSchemes.length})`;
            } else {
                usedCardsBtn.style.display = 'none';
            }
        }
    }

    /**
     * Update statistics display
     */
    updateStats() {
        const remainingCardsElement = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.REMAINING_CARDS);
        if (remainingCardsElement) {
            remainingCardsElement.textContent = this.schemes.length;
        }
    }

    /**
     * Show a message to the user
     * @param {string} message - Message to display
     */
    showMessage(message) {
        const cardDisplay = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.CARD_DISPLAY);
        if (!cardDisplay) {
            console.error('Card display element not found');
            return;
        }

        cardDisplay.innerHTML = `
            <div class="welcome-message">
                ${message}
            </div>
        `;
        
        this.handleTemporaryMessage(message, cardDisplay);
    }

    /**
     * Handle temporary message auto-hide functionality
     * @param {string} message - The message to check
     * @param {HTMLElement} cardDisplay - Card display element
     */
    handleTemporaryMessage(message, cardDisplay) {
        if (message.includes('シャッフル') || message.includes('破棄')) {
            setTimeout(() => {
                if (cardDisplay.innerHTML.includes(message)) {
                    cardDisplay.innerHTML = `
                        <div class="welcome-message">
                            ${GAME_CONSTANTS.MESSAGES.GAME_CONTINUE}
                        </div>
                    `;
                }
            }, GAME_CONSTANTS.TIMEOUTS.AUTO_HIDE_MESSAGE);
        }
    }

    /**
     * Open card gallery modal with filtered cards
     * @param {string} type - Type of cards to show ('all', 'ongoing', 'regular', 'used')
     */
    openCardGalleryModal(type = GAME_CONSTANTS.CARD_TYPES.ALL) {
        try {
            const modal = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.CARD_GALLERY_MODAL);
            const cardsGrid = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.CARDS_GRID);
            const modalTitle = document.querySelector(GAME_CONSTANTS.SELECTORS.MODAL_TITLE);
            
            if (!modal || !cardsGrid || !modalTitle) {
                console.error('Modal elements not found');
                return;
            }

            const { cards, title } = this.getFilteredCardsData(type);
            
            // Clear existing content and update title
            cardsGrid.innerHTML = '';
            modalTitle.textContent = title;
            
            // Populate with filtered cards
            this.populateCardsGrid(cardsGrid, cards);
            
            // Show modal
            this.showModal(modal);
        } catch (error) {
            console.error('Error opening card gallery modal:', error);
        }
    }

    /**
     * Get filtered cards data based on type
     * @param {string} type - Card type filter
     * @returns {Object} Object containing cards array and title
     */
    getFilteredCardsData(type) {
        const filterMap = {
            [GAME_CONSTANTS.CARD_TYPES.ONGOING]: {
                cards: DUSKMOURN_SCHEME_CARDS.filter(card => this.isOngoingScheme(card)),
                title: GAME_CONSTANTS.MODAL_TITLES.ONGOING_CARDS
            },
            [GAME_CONSTANTS.CARD_TYPES.REGULAR]: {
                cards: DUSKMOURN_SCHEME_CARDS.filter(card => !this.isOngoingScheme(card)),
                title: GAME_CONSTANTS.MODAL_TITLES.REGULAR_CARDS
            },
            [GAME_CONSTANTS.CARD_TYPES.USED]: {
                cards: this.usedSchemes.slice().reverse(),
                title: GAME_CONSTANTS.MODAL_TITLES.USED_CARDS
            },
            [GAME_CONSTANTS.CARD_TYPES.ALL]: {
                cards: DUSKMOURN_SCHEME_CARDS,
                title: GAME_CONSTANTS.MODAL_TITLES.ALL_CARDS
            }
        };

        return filterMap[type] || filterMap[GAME_CONSTANTS.CARD_TYPES.ALL];
    }

    /**
     * Populate cards grid with card elements
     * @param {HTMLElement} cardsGrid - Grid container element
     * @param {Array} cards - Array of card objects
     */
    populateCardsGrid(cardsGrid, cards) {
        const fragment = document.createDocumentFragment();
        
        cards.forEach(card => {
            const cardElement = this.createCardElement(card);
            fragment.appendChild(cardElement);
        });
        
        cardsGrid.appendChild(fragment);
    }

    /**
     * Create a card element for the modal grid
     * @param {Object} card - Card object
     * @returns {HTMLElement} Card element
     */
    createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-item';
        
        const localizedData = this.getLocalizedCardData(card);
        
        cardElement.innerHTML = `
            <img src="${localizedData.imageUrl}" alt="${localizedData.name}" loading="lazy" onerror="this.src='${GAME_CONSTANTS.FALLBACK_IMAGE}'">
            <div class="card-item-title">${localizedData.name}</div>
            <div class="card-item-type">${localizedData.typeLine}</div>
            <div class="card-item-number">#${card.collector_number}</div>
        `;
        
        return cardElement;
    }

    /**
     * Show the modal
     * @param {HTMLElement} modal - Modal element
     */
    showModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close the card gallery modal
     */
    closeCardGalleryModal() {
        const modal = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.CARD_GALLERY_MODAL);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Initialize touch/swipe support for mobile devices
     */
    initializeTouchSupport() {
        const cardsGrid = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.CARDS_GRID);
        if (!cardsGrid) {
            console.warn('Cards grid element not found for touch support');
            return;
        }

        const touchState = {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            isDragging: false
        };

        this.addTouchEventListeners(cardsGrid, touchState);
    }

    /**
     * Add touch event listeners to cards grid
     * @param {HTMLElement} cardsGrid - Cards grid element
     * @param {Object} touchState - Touch state object
     */
    addTouchEventListeners(cardsGrid, touchState) {
        cardsGrid.addEventListener('touchstart', (e) => {
            touchState.startX = e.touches[0].clientX;
            touchState.startY = e.touches[0].clientY;
            touchState.isDragging = true;
        }, { passive: true });

        cardsGrid.addEventListener('touchmove', (e) => {
            if (!touchState.isDragging) return;
            
            touchState.currentX = e.touches[0].clientX;
            touchState.currentY = e.touches[0].clientY;
            
            const diffX = Math.abs(touchState.currentX - touchState.startX);
            const diffY = Math.abs(touchState.currentY - touchState.startY);
            
            // Allow vertical scrolling but prevent horizontal scrolling
            if (diffX > diffY) {
                e.preventDefault();
            }
        }, { passive: false });

        cardsGrid.addEventListener('touchend', () => {
            if (!touchState.isDragging) return;
            
            this.handleSwipeGesture(touchState);
            touchState.isDragging = false;
        }, { passive: true });
    }

    /**
     * Handle swipe gesture detection
     * @param {Object} touchState - Touch state object
     */
    handleSwipeGesture(touchState) {
        const diffX = touchState.currentX - touchState.startX;
        const diffY = touchState.currentY - touchState.startY;
        
        // Detect swipe gestures (minimum distance required)
        if (Math.abs(diffX) > GAME_CONSTANTS.TOUCH.MIN_SWIPE_DISTANCE && 
            Math.abs(diffX) > Math.abs(diffY)) {
            
            if (diffX > 0) {
                console.log('Swiped right');
                // Could be used for navigation if needed
            } else {
                console.log('Swiped left');
                // Could be used for navigation if needed
            }
        }
    }

    /**
     * Save current game state for undo functionality
     */
    saveCurrentState() {
        this.previousState = {
            schemes: [...this.schemes],
            usedSchemes: [...this.usedSchemes],
            currentScheme: this.currentScheme,
            ongoingSchemes: [...this.ongoingSchemes],
            turnCount: this.turnCount
        };
    }

    /**
     * Undo the last scheme draw operation
     */
    undoLastScheme() {
        if (!this.previousState) {
            console.log('No previous state to undo');
            return;
        }

        try {
            // Restore previous state
            this.schemes = [...this.previousState.schemes];
            this.usedSchemes = [...this.previousState.usedSchemes];
            this.currentScheme = this.previousState.currentScheme;
            this.ongoingSchemes = [...this.previousState.ongoingSchemes];
            this.turnCount = this.previousState.turnCount;
            
            // Clear previous state (can only undo once)
            this.previousState = null;
            
            // Update display
            if (this.currentScheme) {
                this.displayScheme(this.currentScheme);
            } else {
                this.showInitialScreen();
            }
            
            this.updateTurnCounter();
            this.updateStats();
            this.updateUndoButton();
            
            console.log('Undo completed');
        } catch (error) {
            console.error('Error during undo:', error);
        }
    }

    /**
     * Update the undo button visibility and state
     */
    updateUndoButton() {
        const undoBtn = this.getElement(GAME_CONSTANTS.ELEMENT_IDS.UNDO_SCHEME);
        if (undoBtn) {
            if (this.previousState) {
                undoBtn.style.display = 'inline-block';
                undoBtn.classList.add('undo');
                undoBtn.disabled = false;
            } else {
                undoBtn.style.display = 'none';
                undoBtn.disabled = true;
            }
        }
    }
}

/**
 * Initialize the game when the page loads
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.archenemyGame = new ArchenemyGame();
        console.log('Archenemy game initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Archenemy game:', error);
    }
});