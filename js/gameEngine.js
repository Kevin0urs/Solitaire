import { Deck } from './deck.js';

export class GameEngine {
    constructor() {
        this.tableau = Array.from({ length: 10 }, () => []);
        this.stock = [];
        this.completedRuns = []; // Array of completed suit sets (e.g. { suit: 'spades', id: ... })
        this.moveCount = 0;
        this.history = [];
        this.redoStack = [];
    }

    /**
     * Initializes a new game of Spider Solitaire 2-Suit
     */
    initGame() {
        const fullDeck = Deck.createSpider2SuitDeck();
        const shuffled = Deck.shuffle(fullDeck);

        this.tableau = Array.from({ length: 10 }, () => []);
        this.stock = [];
        this.completedRuns = [];
        this.moveCount = 0;
        this.history = [];
        this.redoStack = [];

        // Deal initial cards:
        // Cols 0-3: 6 cards (5 hidden, 1 faceUp)
        // Cols 4-9: 5 cards (4 hidden, 1 faceUp)
        let cardIdx = 0;
        for (let col = 0; col < 10; col++) {
            const count = col < 4 ? 6 : 5;
            for (let i = 0; i < count; i++) {
                const card = shuffled[cardIdx++];
                card.faceUp = (i === count - 1);
                this.tableau[col].push(card);
            }
        }

        // Remaining 50 cards go to stock
        while (cardIdx < shuffled.length) {
            const card = shuffled[cardIdx++];
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
        if (col.length === 0) return true; // Empty column can receive any valid sequence

        const topCard = col[col.length - 1];
        if (!topCard.faceUp) return false;

        return topCard.rank === sequence[0].rank + 1;
    }

    /**
     * Executes a card sequence move from fromCol (starting at cardIndex) to targetCol
     */
    moveSequence(fromCol, cardIndex, targetCol) {
        if (fromCol === targetCol) return { success: false, reason: 'SAME_COLUMN' };

        const sequence = this.getMoveableSequence(fromCol, cardIndex);
        if (!sequence) return { success: false, reason: 'INVALID_SEQUENCE' };

        if (!this.canDropSequence(sequence, targetCol)) {
            return { success: false, reason: 'INVALID_DROP' };
        }

        this.saveSnapshot();

        // Perform move
        this.tableau[fromCol].splice(cardIndex);
        this.tableau[targetCol].push(...sequence);
        this.moveCount++;

        let flippedCard = null;
        // Flip top card of source column if faceDown
        const sourceCol = this.tableau[fromCol];
        if (sourceCol.length > 0) {
            const topSource = sourceCol[sourceCol.length - 1];
            if (!topSource.faceUp) {
                topSource.faceUp = true;
                flippedCard = topSource;
            }
        }

        // Check completed sequence in target column
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
     * If found, removes it from tableau and adds to completedRuns.
     */
    checkAndRemoveCompletedSequence(colIndex) {
        const col = this.tableau[colIndex];
        if (col.length < 13) return null;

        // Check top 13 cards
        const sub = col.slice(col.length - 13);
        if (sub[0].rank !== 13) return null; // Must start with King

        const suit = sub[0].suit;
        for (let i = 0; i < 13; i++) {
            const card = sub[i];
            if (!card.faceUp || card.suit !== suit || card.rank !== 13 - i) {
                return null;
            }
        }

        // Complete sequence found! Remove top 13 cards
        const removedCards = col.splice(col.length - 13, 13);
        const runData = { suit, cards: removedCards, timestamp: Date.now() };
        this.completedRuns.push(runData);

        // Auto flip card underneath if faceDown
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
     * Stock must have >= 10 cards AND NO column can be empty.
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
     * Hint Engine: finds legal moves and ranks them by strategic value
     */
    getValidMoves() {
        const moves = [];

        for (let fromCol = 0; fromCol < 10; fromCol++) {
            const col = this.tableau[fromCol];
            if (col.length === 0) continue;

            // Find all valid start indices for sequences in fromCol
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

                        // Calculate strategic score
                        if (targetTopCard) {
                            if (targetTopCard.suit === firstCard.suit) {
                                // Same suit match!
                                score += 80;
                            } else {
                                // Cross suit match
                                score += 30;
                            }
                        } else {
                            // Target is empty column
                            if (cardIdx === 0 && col.length === sequence.length) {
                                // Moving entire column to empty column doesn't accomplish anything unless breaking a non-pure sequence above, skip redundant moves
                                score += 5;
                            } else {
                                score += 50;
                            }
                        }

                        // Bonus if this move reveals a hidden card in source column
                        if (cardUnderneath && !cardUnderneath.faceUp) {
                            score += 50;
                        }

                        // Bonus if it empties a column (allowing free placement)
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

        // Sort by highest score first
        moves.sort((a, b) => b.score - a.score);
        return moves;
    }

    /**
     * Checks if player has won (8 completed runs)
     */
    isGameWon() {
        return this.completedRuns.length === 8;
    }

    /**
     * Undo last action
     */
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

    /**
     * Redo last undone action
     */
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
