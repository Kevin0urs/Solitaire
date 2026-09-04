import { Card } from './card.js';

export class Deck {
    /**
     * Creates 104 cards for Spider 2-Suit (4 sets of 13 Spades, 4 sets of 13 Hearts)
     */
    static createSpider2SuitDeck() {
        const cards = [];
        const suits = ['spades', 'hearts'];
        
        let counter = 0;
        // 4 sets of each suit = 8 complete sets of 13 cards = 104 cards total
        for (let set = 0; set < 4; set++) {
            for (const suit of suits) {
                for (let rank = 1; rank <= 13; rank++) {
                    counter++;
                    cards.push(new Card(suit, rank, false, `c-${suit}-${rank}-${set}-${counter}`));
                }
            }
        }
        return cards;
    }

    /**
     * Fisher-Yates shuffle
     * @param {Array<Card>} cards 
     * @returns {Array<Card>} shuffled copy
     */
    static shuffle(cards) {
        const shuffled = cards.map(c => c.clone());
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
