class SchemeDeck {
  constructor(schemeCards) {
    this.originalCards = [...schemeCards];
    this.deck = this.shuffleDeck([...schemeCards]);
    this.currentCard = null;
  }

  shuffleDeck(cards) {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  drawCard() {
    if (this.deck.length === 0) {
      return null;
    }
    
    this.currentCard = this.deck.shift();
    this.deck.push(this.currentCard);
    return this.currentCard;
  }

  reset() {
    this.deck = this.shuffleDeck([...this.originalCards]);
    this.currentCard = null;
  }

  getCurrentCard() {
    return this.currentCard;
  }

  getDeckSize() {
    return this.deck.length;
  }
}

class SchemeCardDisplay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  displayCard(card) {
    if (!card) {
      this.container.innerHTML = '<p>山札が空です</p>';
      return;
    }

    const cardHtml = `
      <div class="scheme-card">
        <div class="card-header">
          <span class="card-id">ID: ${card.id}</span>
          <span class="card-type">${card.type}</span>
        </div>
        <h2 class="card-name">${card.name}</h2>
        <h3 class="card-name-jp">${card.name_jp}</h3>
        <div class="card-text">
          <p class="text-en">${card.text}</p>
          <p class="text-jp">${card.text_jp}</p>
        </div>
        ${card.abandon_text ? `
          <div class="abandon-text">
            <h4>放棄時効果:</h4>
            <p class="text-en">${card.abandon_text}</p>
            <p class="text-jp">${card.abandon_text_jp}</p>
          </div>
        ` : ''}
      </div>
    `;
    
    this.container.innerHTML = cardHtml;
  }
}

class SchemeGame {
  constructor(schemeCards, displayContainerId) {
    this.deck = new SchemeDeck(schemeCards);
    this.display = new SchemeCardDisplay(displayContainerId);
    this.turnCount = 0;
  }

  nextTurn() {
    this.turnCount++;
    const card = this.deck.drawCard();
    this.display.displayCard(card);
    
    console.log(`ターン ${this.turnCount}: ${card ? card.name : '山札が空'}`);
    return card;
  }

  resetGame() {
    this.deck.reset();
    this.turnCount = 0;
    this.display.displayCard(null);
    console.log('ゲームをリセットしました');
  }

  getTurnCount() {
    return this.turnCount;
  }

  getCurrentCard() {
    return this.deck.getCurrentCard();
  }
}

async function loadSchemeCards() {
  try {
    const response = await fetch('scheme_cards.yaml');
    const yamlText = await response.text();
    
    const data = jsyaml.load(yamlText);
    return data.scheme_cards;
  } catch (error) {
    console.error('計略カードの読み込みに失敗しました:', error);
    return [];
  }
}

function initializeGame() {
  loadSchemeCards().then(cards => {
    window.schemeGame = new SchemeGame(cards, 'card-display');
    
    document.getElementById('next-turn').addEventListener('click', () => {
      window.schemeGame.nextTurn();
    });
    
    document.getElementById('reset-game').addEventListener('click', () => {
      window.schemeGame.resetGame();
    });
    
    console.log('ゲームが初期化されました');
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SchemeDeck, SchemeCardDisplay, SchemeGame };
}