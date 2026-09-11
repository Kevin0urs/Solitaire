import { Card } from './card.js';

export class Deck {
    /**
     * Creates 104 cards for Spider 1-Suit (8 sets of 13 Spades = 104 cards)
     */
    static createSpider1SuitDeck() {
        const cards = [];
        let counter = 0;
        for (let set = 0; set < 8; set++) {
            for (let rank = 1; rank <= 13; rank++) {
                counter++;
                cards.push(new Card('spades', rank, false, `c-spades-${rank}-${set}-${counter}`));
            }
        }
        return cards;
    }

    /**
     * Creates 104 cards for Spider 2-Suit (4 sets of 13 Spades + 4 sets of 13 Hearts)
     */
    static createSpider2SuitDeck() {
        const cards = [];
        const suits = ['spades', 'hearts'];
        let counter = 0;
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
     * @returns {Array<Card>}
     */
    static shuffle(cards) {
        const shuffled = cards.map(c => c.clone());
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Favorable Deal for 2-Suit Normal Difficulty:
     * Groups suits predominantly by columns and pairs ranks close together to facilitate sequence building.
     */
    static createFavorable2SuitDeal() {
        const spadesDeck = [];
        const heartsDeck = [];
        let counter = 0;

        for (let set = 0; set < 4; set++) {
            for (let rank = 1; rank <= 13; rank++) {
                counter++;
                spadesDeck.push(new Card('spades', rank, false, `c-spades-${rank}-${set}-${counter}`));
                heartsDeck.push(new Card('hearts', rank, false, `c-hearts-${rank}-${set}-${counter}`));
            }
        }

        const shuffledSpades = this.shuffle(spadesDeck);
        const shuffledHearts = this.shuffle(heartsDeck);

        // Build tableau cards (54 cards) favoring suit grouping per column
        const tableauCards = [];
        for (let col = 0; col < 10; col++) {
            const count = col < 4 ? 6 : 5;
            // Columns 0..4 favor Spades, Columns 5..9 favor Hearts
            const primary = col < 5 ? shuffledSpades : shuffledHearts;
            const secondary = col < 5 ? shuffledHearts : shuffledSpades;

            for (let i = 0; i < count; i++) {
                // 80% chance of primary suit for initial tableau cards
                if (Math.random() < 0.8 && primary.length > 0) {
                    tableauCards.push(primary.pop());
                } else if (secondary.length > 0) {
                    tableauCards.push(secondary.pop());
                } else {
                    tableauCards.push(primary.pop());
                }
            }
        }

        // Remaining cards for stock (50 cards)
        const stockCards = this.shuffle([...shuffledSpades, ...shuffledHearts]);

        return [...tableauCards, ...stockCards];
    }
}
