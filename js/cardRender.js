/**
 * Card Renderer featuring Grimaud 1898 Tarot Historical Face Artwork & Tarot Card Badges
 */

const GRIMAUD_IMAGES = {
    hearts: {
        13: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Tarot_nouveau_-_Grimaud_-_1898_-_Hearts_-_King.jpg",  // Roi de coeur
        12: "https://upload.wikimedia.org/wikipedia/commons/7/77/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_Queen.jpg", // Dame de coeur
        11: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_Jack.jpg"   // Valet de coeur
    },
    spades: {
        13: "https://upload.wikimedia.org/wikipedia/commons/2/24/Tarot_nouveau_-_Grimaud_-_1898_-_Spades_-_King.jpg",  // Roi de pique
        12: "https://upload.wikimedia.org/wikipedia/commons/7/77/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_Queen.jpg", // Dame de pique
        11: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Tarot_nouveau_-_Grimaud_-_1898_-_Diamonds_-_Jack.jpg"   // Valet de pique
    }
};

export class CardRenderer {
    /**
     * Creates DOM Node for a card
     */
    static createCardDOM(card, options = {}) {
        const el = document.createElement('div');
        el.className = `card ${card.faceUp ? 'face-up' : 'face-down'} ${card.suit}`;
        el.dataset.cardId = card.id;

        if (options.isSelected) el.classList.add('selected');
        if (options.isHintSource) el.classList.add('hint-source');
        if (options.isHintTarget) el.classList.add('hint-target');
        if (options.isDragging) el.classList.add('dragging');

        if (!card.faceUp) {
            el.innerHTML = `<div class="card-back-pattern"></div>`;
            return el;
        }

        const symbol = card.getSuitSymbol();
        const rankLabel = card.getRankLabel();
        const color = card.getSuitColor();

        let bodyContent = '';

        if (card.rank >= 11) {
            // Face cards (Valet, Dame, Roi) - Grimaud 1898 image takes the FULL card face!
            const imgUrl = GRIMAUD_IMAGES[card.suit][card.rank];
            bodyContent = `
                <div class="full-face-image-container">
                    <img src="${imgUrl}" alt="${rankLabel} ${symbol}" class="grimaud-img-full" loading="lazy" />
                </div>
            `;
        } else {
            // Number cards (1..10)
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

        return el;
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
