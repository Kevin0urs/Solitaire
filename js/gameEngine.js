import { Deck } from './deck.js';

export class GameEngine {
    constructor() {
        this.tableau = Array.from({ length: 10 }, () => []);
        this.stock = [];
        this.completedRuns = [];
        this.moveCount = 0;
        this.history = [];
        this.redoStack = [];
        this.mode = '2suits'; // '1suit' | '2suits'
        this.difficulty = 'hard'; // 'normal' | 'hard'
    }

    /**
     * Initializes game with mode ('1suit'|'2suits') and difficulty ('normal'|'hard')
     */
    initGame(mode = '2suits', difficulty = 'hard') {
        this.mode = mode;
        this.difficulty = difficulty;

        let fullDeck = [];
        if (mode === '1suit') {
            const deck1 = Deck.createSpider1SuitDeck();
            fullDeck = Deck.shuffle(deck1);
        } else {
            if (difficulty === 'normal') {
                fullDeck = Deck.createFavorable2SuitDeal();
            } else {
                const deck2 = Deck.createSpider2SuitDeck();
                fullDeck = Deck.shuffle(deck2);
            }
        }

        this.tableau = Array.from({ length: 10 }, () => []);
        this.stock = [];
        this.completedRuns = [];
        this.moveCount = 0;
        this.history = [];
        this.redoStack = [];

        let cardIdx = 0;
        for (let col = 0; col < 10; col++) {
            const count = col < 4 ? 6 : 5;
            for (let i = 0; i < count; i++) {
                const card = fullDeck[cardIdx++];
                card.faceUp = (i === count - 1);
                this.tableau[col].push(card);
            }
        }

        while (cardIdx < fullDeck.length) {
            const card = fullDeck[cardIdx++];
            card.faceUp = false;
            this.stock.push(card);
        }
    }

    /**
     * Save snapshot for Undo
     */
    saveSnapshot() {
        const snapshot = {
            tableau: this.tableau.map(col => col.map(c => c.clone())),
            stock: this.stock.map(c => c.clone()),
            completedRuns: [...this.completedRuns],
            moveCount: this.moveCount
        };
        this.history.push(snapshot);
        this.redoStack = [];
    }

    /**
     * Checks if a card sequence starting at cardIndex in fromCol can be moved together.
     * Sequence must be faceUp, strictly descending in rank, and ALL CARDS OF THE SAME SUIT.
     */
    canMoveSequence(fromCol, cardIndex) {
        const col = this.tableau[fromCol];
        if (!col || cardIndex < 0 || cardIndex >= col.length) return false;

        const startCard = col[cardIndex];
        if (!startCard.faceUp) return false;

        for (let i = cardIndex; i < col.length - 1; i++) {
            const current = col[i];
            const next = col[i + 1];
            if (!next.faceUp) return false;
            if (current.suit !== next.suit) return false;
            if (current.rank !== next.rank + 1) return false;
        }

        return true;
    }

    /**
     * Get moveable sequence array starting at cardIndex in fromCol
     */
    getMoveableSequence(fromCol, cardIndex) {
        if (!this.canMoveSequence(fromCol, cardIndex)) return null;
        return this.tableau[fromCol].slice(cardIndex);
    }

    /**
     * Checks if a sequence can be dropped onto targetCol.
     * Rule: targetCol is empty OR top card of targetCol has rank === sequence[0].rank + 1
     */
    canDropSequence(sequence, targetCol) {
        if (!sequence || sequence.length === 0) return false;
        if (targetCol < 0 || targetCol >= 10) return false;

        const col = this.tableau[targetCol];
        if (col.length === 0) return true;

        const topCard = col[col.length - 1];
        if (!topCard.faceUp) return false;

        return topCard.rank === sequence[0].rank + 1;
    }

    /**
     * Executes a card sequence move from fromCol to targetCol
     */
    moveSequence(fromCol, cardIndex, targetCol) {
        if (fromCol === targetCol) return { success: false, reason: 'SAME_COLUMN' };

        const sequence = this.getMoveableSequence(fromCol, cardIndex);
        if (!sequence) return { success: false, reason: 'INVALID_SEQUENCE' };

        if (!this.canDropSequence(sequence, targetCol)) {
            return { success: false, reason: 'INVALID_DROP' };
        }

        this.saveSnapshot();

        this.tableau[fromCol].splice(cardIndex);
        this.tableau[targetCol].push(...sequence);
        this.moveCount++;

        let flippedCard = null;
        const sourceCol = this.tableau[fromCol];
        if (sourceCol.length > 0) {
            const topSource = sourceCol[sourceCol.length - 1];
            if (!topSource.faceUp) {
                topSource.faceUp = true;
                flippedCard = topSource;
            }
        }

        const completedInfo = this.checkAndRemoveCompletedSequence(targetCol);

        return {
            success: true,
            fromCol,
            cardIndex,
            targetCol,
            sequence,
            flippedCard,
            completedInfo,
            isWin: this.isGameWon()
        };
    }

    /**
     * Checks if targetCol contains a completed K -> A sequence of the SAME suit.
     */
    checkAndRemoveCompletedSequence(colIndex) {
        const col = this.tableau[colIndex];
        if (col.length < 13) return null;

        const sub = col.slice(col.length - 13);
        if (sub[0].rank !== 13) return null;

        const suit = sub[0].suit;
        for (let i = 0; i < 13; i++) {
            const card = sub[i];
            if (!card.faceUp || card.suit !== suit || card.rank !== 13 - i) {
                return null;
            }
        }

        const removedCards = col.splice(col.length - 13, 13);
        const runData = { suit, cards: removedCards, timestamp: Date.now() };
        this.completedRuns.push(runData);

        let flippedCard = null;
        if (col.length > 0) {
            const top = col[col.length - 1];
            if (!top.faceUp) {
                top.faceUp = true;
                flippedCard = top;
            }
        }

        return {
            runData,
            colIndex,
            flippedCard,
            completedCount: this.completedRuns.length
        };
    }

    /**
     * Checks if stock can be dealt.
     */
    canDealStock() {
        if (this.stock.length < 10) return { canDeal: false, reason: 'NO_STOCK' };
        
        for (let i = 0; i < 10; i++) {
            if (this.tableau[i].length === 0) {
                return { canDeal: false, reason: 'EMPTY_COLUMN' };
            }
        }

        return { canDeal: true };
    }

    /**
     * Deals 1 card faceUp to each of the 10 columns
     */
    dealStock() {
        const check = this.canDealStock();
        if (!check.canDeal) return { success: false, reason: check.reason };

        this.saveSnapshot();

        const dealtCards = [];
        const completedInfoList = [];

        for (let col = 0; col < 10; col++) {
            const card = this.stock.pop();
            card.faceUp = true;
            this.tableau[col].push(card);
            dealtCards.push({ col, card });

            const comp = this.checkAndRemoveCompletedSequence(col);
            if (comp) completedInfoList.push(comp);
        }

        this.moveCount++;

        return {
            success: true,
            dealtCards,
            completedInfoList,
            remainingStock: this.stock.length,
            isWin: this.isGameWon()
        };
    }

    /**
     * Hint Engine
     */
    getValidMoves() {
        const moves = [];

        for (let fromCol = 0; fromCol < 10; fromCol++) {
            const col = this.tableau[fromCol];
            if (col.length === 0) continue;

            for (let cardIdx = 0; cardIdx < col.length; cardIdx++) {
                if (!this.canMoveSequence(fromCol, cardIdx)) continue;

                const sequence = col.slice(cardIdx);
                const firstCard = sequence[0];
                const cardUnderneath = cardIdx > 0 ? col[cardIdx - 1] : null;

                for (let toCol = 0; toCol < 10; toCol++) {
                    if (fromCol === toCol) continue;

                    if (this.canDropSequence(sequence, toCol)) {
                        const targetColCards = this.tableau[toCol];
                        const targetTopCard = targetColCards.length > 0 ? targetColCards[targetColCards.length - 1] : null;

                        let score = 0;

                        if (targetTopCard) {
                            if (targetTopCard.suit === firstCard.suit) {
                                score += 80;
                            } else {
                                score += 30;
                            }
                        } else {
                            if (cardIdx === 0 && col.length === sequence.length) {
                                score += 5;
                            } else {
                                score += 50;
                            }
                        }

                        if (cardUnderneath && !cardUnderneath.faceUp) {
                            score += 50;
                        }

                        if (cardIdx === 0) {
                            score += 20;
                        }

                        moves.push({
                            fromCol,
                            cardIndex: cardIdx,
                            toCol,
                            sequence,
                            score
                        });
                    }
                }
            }
        }

        moves.sort((a, b) => b.score - a.score);
        return moves;
    }

    isGameWon() {
        return this.completedRuns.length === 8;
    }

    undo() {
        if (this.history.length === 0) return false;

        const currentSnapshot = {
            tableau: this.tableau.map(col => col.map(c => c.clone())),
            stock: this.stock.map(c => c.clone()),
            completedRuns: [...this.completedRuns],
            moveCount: this.moveCount
        };
        this.redoStack.push(currentSnapshot);

        const previous = this.history.pop();
        this.tableau = previous.tableau.map(col => col.map(c => c.clone()));
        this.stock = previous.stock.map(c => c.clone());
        this.completedRuns = [...previous.completedRuns];
        this.moveCount = previous.moveCount;

        return true;
    }

    redo() {
        if (this.redoStack.length === 0) return false;

        const currentSnapshot = {
            tableau: this.tableau.map(col => col.map(c => c.clone())),
            stock: this.stock.map(c => c.clone()),
            completedRuns: [...this.completedRuns],
            moveCount: this.moveCount
        };
        this.history.push(currentSnapshot);

        const next = this.redoStack.pop();
        this.tableau = next.tableau.map(col => col.map(c => c.clone()));
        this.stock = next.stock.map(c => c.clone());
        this.completedRuns = [...next.completedRuns];
        this.moveCount = next.moveCount;

        return true;
    }
}
