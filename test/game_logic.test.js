import { GameEngine } from '../js/gameEngine.js';
import { Card } from '../js/card.js';
import { Deck } from '../js/deck.js';

export function runAllGameEngineTests(assert) {
    console.log("🧪 Starting Game Engine Unit Tests...");

    // Test 1: Deck Creation & Initial Setup for 1-Suit and 2-Suit
    assert.test('Deck creation 1-Suit has 104 Spades cards', () => {
        const deck = Deck.createSpider1SuitDeck();
        assert.equal(deck.length, 104, 'Deck should contain 104 cards');
        const spades = deck.filter(c => c.suit === 'spades');
        assert.equal(spades.length, 104, '104 Spades cards');
    });

    assert.test('Deck creation 2-Suit has 104 cards and 2 suits (Spades & Hearts)', () => {
        const deck = Deck.createSpider2SuitDeck();
        assert.equal(deck.length, 104, 'Deck should contain 104 cards');

        const spades = deck.filter(c => c.suit === 'spades');
        const hearts = deck.filter(c => c.suit === 'hearts');
        assert.equal(spades.length, 52, '52 Spades cards');
        assert.equal(hearts.length, 52, '52 Hearts cards');
    });

    assert.test('Game initialization sets up 10 columns and 50 stock cards in 1-Suit mode', () => {
        const engine = new GameEngine();
        engine.initGame('1suit', 'normal');

        assert.equal(engine.tableau.length, 10, '10 tableau columns');
        assert.equal(engine.stock.length, 50, '50 stock cards');
        assert.equal(engine.mode, '1suit', '1-Suit mode active');
    });

    assert.test('Game initialization sets up 2-Suit Normal (Favorable Deal)', () => {
        const engine = new GameEngine();
        engine.initGame('2suits', 'normal');

        assert.equal(engine.tableau.length, 10, '10 tableau columns');
        assert.equal(engine.stock.length, 50, '50 stock cards');
        assert.equal(engine.mode, '2suits', '2-Suit mode active');
        assert.equal(engine.difficulty, 'normal', 'Normal difficulty active');
    });

    // Test 2: Valid and Invalid Move Sequences
    assert.test('canMoveSequence validates same-suit descending sequences only', () => {
        const engine = new GameEngine();
        engine.tableau[0] = [
            new Card('spades', 10, true),
            new Card('spades', 9, true),
            new Card('spades', 8, true)
        ];

        assert.equal(engine.canMoveSequence(0, 0), true, 'Full 10-9-8 Spades sequence is moveable');
        assert.equal(engine.canMoveSequence(0, 1), true, 'Partial 9-8 Spades sequence is moveable');
        assert.equal(engine.canMoveSequence(0, 2), true, 'Single 8 Spades card is moveable');

        engine.tableau[1] = [
            new Card('spades', 10, true),
            new Card('hearts', 9, true),
            new Card('spades', 8, true)
        ];
        assert.equal(engine.canMoveSequence(1, 0), false, '10♠ - 9♥ mixed sequence cannot be moved together');
        assert.equal(engine.canMoveSequence(1, 1), false, '9♥ - 8♠ mixed sequence cannot be moved together');
        assert.equal(engine.canMoveSequence(1, 2), true, 'Bottom single card 8♠ is moveable');
    });

    // Test 3: Can Drop Rules
    assert.test('canDropSequence allows dropping onto rank + 1 regardless of suit or empty column', () => {
        const engine = new GameEngine();
        engine.tableau[0] = [new Card('spades', 10, true)];
        engine.tableau[1] = [new Card('hearts', 10, true)];
        engine.tableau[2] = [];

        const sequence9Spades = [new Card('spades', 9, true)];

        assert.equal(engine.canDropSequence(sequence9Spades, 0), true, '9♠ can drop onto 10♠ (same suit)');
        assert.equal(engine.canDropSequence(sequence9Spades, 1), true, '9♠ can drop onto 10♥ (cross suit)');
        assert.equal(engine.canDropSequence(sequence9Spades, 2), true, '9♠ can drop onto empty column');

        const sequence8Spades = [new Card('spades', 8, true)];
        assert.equal(engine.canDropSequence(sequence8Spades, 0), false, '8♠ cannot drop directly onto 10♠ (rank gap > 1)');
    });

    // Test 4: Stock Distribution Restrictions
    assert.test('dealStock fails if any column is empty', () => {
        const engine = new GameEngine();
        engine.initGame('2suits', 'hard');
        engine.tableau[0] = [];

        const res = engine.dealStock();
        assert.equal(res.success, false, 'Stock deal should fail');
        assert.equal(res.reason, 'EMPTY_COLUMN', 'Reason should be EMPTY_COLUMN');
    });

    assert.test('dealStock deals 1 card faceUp to each column when all columns have cards', () => {
        const engine = new GameEngine();
        engine.initGame('2suits', 'hard');

        const initialStockLen = engine.stock.length;
        const initialColLengths = engine.tableau.map(col => col.length);

        const res = engine.dealStock();
        assert.equal(res.success, true, 'Stock deal succeeded');
        assert.equal(engine.stock.length, initialStockLen - 10, 'Stock reduced by 10 cards');

        for (let col = 0; col < 10; col++) {
            assert.equal(engine.tableau[col].length, initialColLengths[col] + 1, `Column ${col} gained 1 card`);
            assert.equal(engine.tableau[col].slice(-1)[0].faceUp, true, `Dealt card in column ${col} is faceUp`);
        }
    });

    // Test 5: Completed Sequence Removal (K to A same suit)
    assert.test('checkAndRemoveCompletedSequence automatically detects and removes K..A same suit sequence', () => {
        const engine = new GameEngine();
        engine.tableau[0] = [new Card('spades', 4, false)];

        for (let rank = 13; rank >= 1; rank--) {
            engine.tableau[0].push(new Card('spades', rank, true));
        }

        assert.equal(engine.tableau[0].length, 14, '14 cards before completed run removal');

        const info = engine.checkAndRemoveCompletedSequence(0);
        assert.notEqual(info, null, 'Completed sequence detected');
        assert.equal(engine.completedRuns.length, 1, '1 run in completedRuns');
        assert.equal(engine.tableau[0].length, 1, 'Only 1 card remaining in column 0');
        assert.equal(engine.tableau[0][0].faceUp, true, 'Card underneath was automatically flipped faceUp');
    });

    // Test 6: Undo & Redo History State
    assert.test('Undo and Redo restore exact game states', () => {
        const engine = new GameEngine();
        engine.initGame('2suits', 'hard');

        engine.tableau[0] = [new Card('spades', 10, true)];
        engine.tableau[1] = [new Card('spades', 9, true)];

        engine.moveSequence(1, 0, 0);

        assert.equal(engine.tableau[0].length, 2, 'Col 0 has 2 cards after move');
        assert.equal(engine.tableau[1].length, 0, 'Col 1 is empty after move');
        assert.equal(engine.moveCount, 1, 'Move count incremented to 1');

        const undoSuccess = engine.undo();
        assert.equal(undoSuccess, true, 'Undo succeeded');
        assert.equal(engine.tableau[0].length, 1, 'Col 0 restored to 1 card');
        assert.equal(engine.tableau[1].length, 1, 'Col 1 restored to 1 card');
        assert.equal(engine.moveCount, 0, 'Move count restored to 0');

        const redoSuccess = engine.redo();
        assert.equal(redoSuccess, true, 'Redo succeeded');
        assert.equal(engine.tableau[0].length, 2, 'Col 0 has 2 cards after redo');
        assert.equal(engine.tableau[1].length, 0, 'Col 1 empty after redo');
        assert.equal(engine.moveCount, 1, 'Move count back to 1');
    });
}
