/**
 * SVG Card Renderer with Open-Source Style Face Card Visuals (Jack, Queen, King)
 */

export class CardRenderer {
    /**
     * Renders a card element DOM Node
     * @param {Card} card 
     * @param {Object} options - extra flags (e.g. isSelected, isHint, isDragging)
     * @returns {HTMLElement}
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

        let centerContent = '';

        if (card.rank >= 11) {
            // Face cards (J, Q, K)
            centerContent = CardRenderer.getFaceCardSVG(card.rank, card.suit);
        } else if (card.rank === 1) {
            // Ace
            centerContent = `<div class="center-ace-pip" style="color: ${color}">${symbol}</div>`;
        } else {
            // Ranks 2..10: Pip layouts
            centerContent = CardRenderer.getPipsHTML(card.rank, symbol, color);
        }

        el.innerHTML = `
            <div class="card-corner top-left" style="color: ${color}">
                <span class="card-rank">${rankLabel}</span>
                <span class="card-suit-symbol">${symbol}</span>
            </div>
            <div class="card-body">
                ${centerContent}
            </div>
            <div class="card-corner bottom-right" style="color: ${color}">
                <span class="card-rank">${rankLabel}</span>
                <span class="card-suit-symbol">${symbol}</span>
            </div>
        `;

        return el;
    }

    /**
     * Generate HTML for pips layout (2..10)
     */
    static getPipsHTML(rank, symbol, color) {
        const pipsCount = rank;
        const pipsArr = Array.from({ length: pipsCount });
        return `
            <div class="pips-grid pips-${rank}" style="color: ${color}">
                ${pipsArr.map(() => `<span class="pip">${symbol}</span>`).join('')}
            </div>
        `;
    }

    /**
     * Returns SVG artwork for Jack (11), Queen (12), King (13)
     */
    static getFaceCardSVG(rank, suit) {
        const primaryColor = suit === 'spades' ? '#1A365D' : '#9B2C2C';
        const secondaryColor = suit === 'spades' ? '#742A2A' : '#2B6CB0';
        const goldColor = '#D69E2E';
        const faceColor = '#FFE4E1';

        if (rank === 11) {
            // Jack (Valet)
            return `
            <svg class="face-card-svg" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="5" width="90" height="120" rx="6" fill="#F7FAFC" stroke="${primaryColor}" stroke-width="2"/>
                <!-- Crown / Hair -->
                <path d="M30 45 C30 25, 70 25, 70 45 Z" fill="${goldColor}"/>
                <circle cx="50" cy="30" r="6" fill="${secondaryColor}"/>
                <!-- Head -->
                <circle cx="50" cy="45" r="16" fill="${faceColor}" stroke="#333" stroke-width="1"/>
                <!-- Eyes & Mustache -->
                <circle cx="44" cy="42" r="2" fill="#222"/>
                <circle cx="56" cy="42" r="2" fill="#222"/>
                <path d="M42 50 Q50 54 58 50" stroke="#222" stroke-width="2" fill="none"/>
                <!-- Torso / Armor -->
                <path d="M25 62 L75 62 L80 115 L20 115 Z" fill="${primaryColor}"/>
                <path d="M35 62 L50 90 L65 62 Z" fill="${secondaryColor}"/>
                <path d="M50 62 L50 115" stroke="${goldColor}" stroke-width="3"/>
                <!-- Halberd / Weapon -->
                <line x1="20" y1="30" x2="20" y2="120" stroke="${goldColor}" stroke-width="4"/>
                <path d="M10 35 L20 20 L30 35 L20 40 Z" fill="${goldColor}"/>
            </svg>`;
        } else if (rank === 12) {
            // Queen (Dame)
            return `
            <svg class="face-card-svg" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="5" width="90" height="120" rx="6" fill="#F7FAFC" stroke="${primaryColor}" stroke-width="2"/>
                <!-- Crown -->
                <path d="M25 35 L35 18 L50 30 L65 18 L75 35 Z" fill="${goldColor}" stroke="#B7791F" stroke-width="1"/>
                <circle cx="35" cy="18" r="3" fill="${secondaryColor}"/>
                <circle cx="50" cy="14" r="3" fill="${goldColor}"/>
                <circle cx="65" cy="18" r="3" fill="${secondaryColor}"/>
                <!-- Face & Hair -->
                <path d="M30 48 C30 32, 70 32, 70 48 C70 65, 30 65, 30 48 Z" fill="${secondaryColor}"/>
                <circle cx="50" cy="48" r="15" fill="${faceColor}" stroke="#333" stroke-width="1"/>
                <circle cx="44" cy="46" r="2" fill="#222"/>
                <circle cx="56" cy="46" r="2" fill="#222"/>
                <path d="M45 54 Q50 58 55 54" stroke="#C53030" stroke-width="2" fill="none"/>
                <!-- Robe -->
                <path d="M20 63 L80 63 L85 115 L15 115 Z" fill="${primaryColor}"/>
                <path d="M40 63 Q50 90 60 63" fill="${goldColor}"/>
                <circle cx="50" cy="85" r="7" fill="${goldColor}"/>
                <circle cx="50" cy="85" r="4" fill="${secondaryColor}"/>
            </svg>`;
        } else {
            // King (Roi)
            return `
            <svg class="face-card-svg" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="5" width="90" height="120" rx="6" fill="#F7FAFC" stroke="${primaryColor}" stroke-width="2"/>
                <!-- Grand Crown -->
                <path d="M20 32 L30 12 L50 25 L70 12 L80 32 Z" fill="${goldColor}" stroke="#975A16" stroke-width="1"/>
                <circle cx="50" cy="10" r="4" fill="${secondaryColor}"/>
                <circle cx="30" cy="12" r="3" fill="${primaryColor}"/>
                <circle cx="70" cy="12" r="3" fill="${primaryColor}"/>
                <!-- Beard & Face -->
                <path d="M28 42 C28 28, 72 28, 72 42 C72 70, 28 70, 28 42 Z" fill="${goldColor}"/>
                <circle cx="50" cy="44" r="15" fill="${faceColor}" stroke="#333" stroke-width="1"/>
                <circle cx="44" cy="42" r="2" fill="#222"/>
                <circle cx="56" cy="42" r="2" fill="#222"/>
                <path d="M40 50 Q50 56 60 50" stroke="#742A2A" stroke-width="3" fill="none"/>
                <!-- Royal Mantle & Scepter -->
                <path d="M15 60 L85 60 L90 115 L10 115 Z" fill="${primaryColor}"/>
                <path d="M35 60 L50 95 L65 60 Z" fill="${secondaryColor}"/>
                <line x1="78" y1="35" x2="78" y2="110" stroke="${goldColor}" stroke-width="4"/>
                <circle cx="78" cy="30" r="6" fill="${goldColor}"/>
            </svg>`;
        }
    }
}
