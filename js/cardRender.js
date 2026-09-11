/**
 * Card Renderer featuring Grimaud 1898 Tarot Historical Face Artwork & Image Preloading Cache
 */

const GRIMAUD_IMAGES = {
    hearts: {
        13: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_King.jpg",  // Roi de coeur
        12: "https://upload.wikimedia.org/wikipedia/commons/b/bf/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_Queen.jpg", // Dame de coeur
        11: "https://upload.wikimedia.org/wikipedia/commons/4/41/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_Jack.jpg"   // Valet de coeur
    },
    spades: {
        13: "https://upload.wikimedia.org/wikipedia/commons/2/24/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_King.jpg",  // Roi de pique
        12: "https://upload.wikimedia.org/wikipedia/commons/8/88/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_Queen.jpg", // Dame de pique
        11: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_Jack.jpg"   // Valet de pique
    }
};

const preloadedCache = new Map();

export class CardRenderer {
    /**
     * Preloads all 6 figure images into browser memory on startup
     */
    static preloadImages() {
        ['hearts', 'spades'].forEach(suit => {
            [11, 12, 13].forEach(rank => {
                const url = GRIMAUD_IMAGES[suit][rank];
                if (url && !preloadedCache.has(url)) {
                    const img = new Image();
                    img.src = url;
                    preloadedCache.set(url, img);
                }
            });
        });
    }

    /**
     * Creates DOM Node for a card
     */
    static createCardDOM(card, options = {}) {
        const el = document.createElement('div');
        el.className = `card ${card.faceUp ? 'face-up' : 'face-down'} ${card.suit}`;
        el.dataset.cardId = card.id;

        this.updateCardDOM(el, card, options);
        return el;
    }

    /**
     * Updates an existing Card DOM element in-place to avoid expensive DOM re-creations
     */
    static updateCardDOM(el, card, options = {}) {
        el.className = `card ${card.faceUp ? 'face-up' : 'face-down'} ${card.suit}`;
        
        if (options.isSelected) el.classList.add('selected');
        if (options.isHintSource) el.classList.add('hint-source');
        if (options.isHintTarget) el.classList.add('hint-target');
        if (options.isDragging) el.classList.add('dragging');

        if (!card.faceUp) {
            if (!el.querySelector('.card-back-pattern') || el.querySelector('.card-badge')) {
                el.innerHTML = `<div class="card-back-pattern"></div>`;
            }
            return;
        }

        const symbol = card.getSuitSymbol();
        const rankLabel = card.getRankLabel();
        const color = card.getSuitColor();

        // Only rebuild innerHTML if orientation changed from faceDown to faceUp
        if (!el.querySelector('.card-badge')) {
            let bodyContent = '';

            if (card.rank >= 11) {
                const imgUrl = GRIMAUD_IMAGES[card.suit][card.rank];
                bodyContent = `
                    <div class="full-face-image-container">
                        <img src="${imgUrl}" alt="${rankLabel} ${symbol}" class="grimaud-img-full" loading="eager" />
                    </div>
                `;
            } else {
                bodyContent = CardRenderer.getPipsLayoutHTML(card.rank, symbol, color);
            }

            el.innerHTML = `
                ${bodyContent}
                <div class="card-badge top-left" style="color: ${color}">
                    <span class="badge-rank">${rankLabel}</span>
                    <span class="badge-suit">${symbol}</span>
                </div>
                <div class="card-badge bottom-right" style="color: ${color}">
                    <span class="badge-rank">${rankLabel}</span>
                    <span class="badge-suit">${symbol}</span>
                </div>
            `;
        }
    }

    /**
     * Renders exact tarot/playing card pips layout
     */
    static getPipsLayoutHTML(rank, symbol, color) {
        if (rank === 1) {
            return `<div class="pips-container pips-1" style="color: ${color}"><span class="pip center-ace">${symbol}</span></div>`;
        }

        const pipsHTML = [];
        for (let i = 0; i < rank; i++) {
            pipsHTML.push(`<span class="pip">${symbol}</span>`);
        }

        return `
            <div class="pips-container pips-grid-${rank}" style="color: ${color}">
                ${pipsHTML.join('')}
            </div>
        `;
    }
}
