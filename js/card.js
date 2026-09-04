/**
 * Card Model for Spider Solitaire
 */
export class Card {
    /**
     * @param {string} suit - 'spades' | 'hearts'
     * @param {number} rank - 1 (Ace) to 13 (King)
     * @param {boolean} faceUp - initial orientation
     * @param {string} id - unique identifier
     */
    constructor(suit, rank, faceUp = false, id = null) {
        this.suit = suit; // 'spades' | 'hearts'
        this.rank = rank; // 1..13
        this.faceUp = faceUp;
        this.id = id || `card-${suit}-${rank}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getRankLabel() {
        switch (this.rank) {
            case 1: return 'A';
            case 11: return 'J';
            case 12: return 'Q';
            case 13: return 'K';
            default: return this.rank.toString();
        }
    }

    getSuitSymbol() {
        return this.suit === 'spades' ? '♠' : '♥';
    }

    getSuitColor() {
        return this.suit === 'spades' ? '#000000' : '#C0392B';
    }

    clone() {
        return new Card(this.suit, this.rank, this.faceUp, this.id);
    }
}
