import { GameEngine } from './gameEngine.js';
import { CardRenderer } from './cardRender.js';
import { sound } from './sound.js';
import { StorageManager } from './storage.js';
import { Confetti } from './confetti.js';

export class UIController {
    constructor() {
        this.engine = new GameEngine();
        
        // DOM Elements
        this.tableauContainer = document.getElementById('tableau-container');
        this.stockPileEl = document.getElementById('stock-pile');
        this.stockCountEl = document.getElementById('stock-count');
        this.foundationContainer = document.getElementById('foundation-container');
        
        this.moveCountEl = document.getElementById('move-count');
        this.timerEl = document.getElementById('timer-count');
        this.completedCountEl = document.getElementById('completed-count');
        
        this.btnUndo = document.getElementById('btn-undo');
        this.btnRedo = document.getElementById('btn-redo');
        this.btnHint = document.getElementById('btn-hint');
        this.btnNewGame = document.getElementById('btn-new-game');
        this.btnRules = document.getElementById('btn-rules');
        this.btnStats = document.getElementById('btn-stats');
        this.btnSound = document.getElementById('btn-sound');

        this.toastEl = document.getElementById('toast-message');
        this.modalWin = document.getElementById('modal-win');
        this.modalRules = document.getElementById('modal-rules');
        this.modalStats = document.getElementById('modal-stats');

        // Selection & Drag State
        this.selectedSequenceInfo = null; // { colIndex, cardIndex }
        this.dragState = null; // { pointerId, colIndex, cardIndex, ghostEl, startX, startY, offsetX, offsetY, isDragging }
        this.activeHint = null;

        // Timer
        this.timerInterval = null;
        this.secondsElapsed = 0;
        this.timerStarted = false;

        this.initEvents();
    }

    init() {
        const settings = StorageManager.getSettings();
        if (settings.soundMuted) {
            sound.muted = true;
            this.updateSoundButtonUI();
        }

        this.startNewGame();
    }

    startNewGame() {
        this.stopTimer();
        this.secondsElapsed = 0;
        this.timerStarted = false;
        this.updateTimerUI();

        this.engine.initGame();
        StorageManager.recordGameStart();

        this.clearSelection();
        this.clearHint();
        this.renderBoard();
        this.showToast('Bienvenue sur le Solitaire de Mamie Nicole ! Bonne partie ! 💖');
    }

    startTimer() {
        if (this.timerStarted) return;
        this.timerStarted = true;
        this.timerInterval = setInterval(() => {
            this.secondsElapsed++;
            this.updateTimerUI();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerStarted = false;
    }

    updateTimerUI() {
        const mins = Math.floor(this.secondsElapsed / 60);
        const secs = this.secondsElapsed % 60;
        const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        this.timerEl.textContent = formatted;
    }

    updateSoundButtonUI() {
        this.btnSound.textContent = sound.muted ? '🔇 Son Off' : '🔊 Son On';
        const settings = StorageManager.getSettings();
        settings.soundMuted = sound.muted;
        StorageManager.saveSettings(settings);
    }

    showToast(message, duration = 3000) {
        if (!this.toastEl) return;
        this.toastEl.textContent = message;
        this.toastEl.classList.add('visible');
        setTimeout(() => {
            this.toastEl.classList.remove('visible');
        }, duration);
    }

    // --- RENDER ENGINE ---

    renderBoard() {
        this.renderTableau();
        this.renderStock();
        this.renderFoundation();
        this.updateHeaderStats();
        this.updateControlsUI();
    }

    getDynamicCardOffsets() {
        let cardHeight = 190;
        const sampleCard = this.tableauContainer.querySelector('.card');
        if (sampleCard) {
            const rect = sampleCard.getBoundingClientRect();
            if (rect.height > 0) cardHeight = rect.height;
        }
        const faceUpStep = Math.max(22, Math.round(cardHeight * 0.22));
        const faceDownStep = Math.max(8, Math.round(cardHeight * 0.08));
        return { faceUpStep, faceDownStep };
    }

    renderTableau() {
        this.tableauContainer.innerHTML = '';
        const { faceUpStep, faceDownStep } = this.getDynamicCardOffsets();

        for (let colIdx = 0; colIdx < 10; colIdx++) {
            const colEl = document.createElement('div');
            colEl.className = 'column';
            colEl.dataset.colIndex = colIdx;

            const cards = this.engine.tableau[colIdx];

            if (cards.length === 0) {
                const emptySlot = document.createElement('div');
                emptySlot.className = 'empty-column-slot';
                emptySlot.textContent = 'Vide';
                colEl.appendChild(emptySlot);
            } else {
                cards.forEach((card, cardIdx) => {
                    const isSelected = this.selectedSequenceInfo &&
                        this.selectedSequenceInfo.colIndex === colIdx &&
                        cardIdx >= this.selectedSequenceInfo.cardIndex;

                    const isHintSource = this.activeHint &&
                        this.activeHint.fromCol === colIdx &&
                        cardIdx >= this.activeHint.cardIndex;

                    const cardDOM = CardRenderer.createCardDOM(card, {
                        isSelected,
                        isHintSource
                    });

                    cardDOM.dataset.colIndex = colIdx;
                    cardDOM.dataset.cardIndex = cardIdx;

                    cardDOM.style.zIndex = (cardIdx + 1).toString();

                    let topOffset = 0;
                    for (let k = 0; k < cardIdx; k++) {
                        topOffset += cards[k].faceUp ? faceUpStep : faceDownStep;
                    }
                    cardDOM.style.top = `${topOffset}px`;

                    colEl.appendChild(cardDOM);
                });
            }

            if (this.activeHint && this.activeHint.toCol === colIdx) {
                colEl.classList.add('hint-target-column');
            }

            this.tableauContainer.appendChild(colEl);
        }
    }

    renderStock() {
        const remaining = this.engine.stock.length;
        this.stockCountEl.textContent = `${remaining} (${remaining / 10} pioches)`;
        this.stockPileEl.innerHTML = '';

        if (remaining > 0) {
            const layers = Math.min(5, Math.ceil(remaining / 10));
            for (let i = 0; i < layers; i++) {
                const stockCard = document.createElement('div');
                stockCard.className = 'stock-card-back';
                stockCard.style.right = `${i * 3}px`;
                stockCard.style.bottom = `${i * 2}px`;
                this.stockPileEl.appendChild(stockCard);
            }
        } else {
            const emptyStock = document.createElement('div');
            emptyStock.className = 'empty-stock-slot';
            emptyStock.textContent = 'Vide';
            this.stockPileEl.appendChild(emptyStock);
        }
    }

    renderFoundation() {
        this.foundationContainer.innerHTML = '';
        const completed = this.engine.completedRuns;
        this.completedCountEl.textContent = `${completed.length} / 8`;

        for (let i = 0; i < 8; i++) {
            const slot = document.createElement('div');
            slot.className = 'foundation-slot';

            if (i < completed.length) {
                const run = completed[i];
                slot.classList.add('completed');
                const symbol = run.suit === 'spades' ? '♠' : '♥';
                const color = run.suit === 'spades' ? '#000000' : '#C0392B';
                slot.innerHTML = `<span style="color: ${color}">R${symbol}</span>`;
            } else {
                slot.innerHTML = `<span class="slot-placeholder">R-1</span>`;
            }

            this.foundationContainer.appendChild(slot);
        }
    }

    updateHeaderStats() {
        this.moveCountEl.textContent = this.engine.moveCount;
    }

    updateControlsUI() {
        this.btnUndo.disabled = this.engine.history.length === 0;
        this.btnRedo.disabled = this.engine.redoStack.length === 0;
    }

    // --- INTERACTION & EVENTS ---

    initEvents() {
        // Prevent native HTML drag and drop interferes
        document.addEventListener('dragstart', (e) => e.preventDefault());

        this.stockPileEl.addEventListener('click', () => this.handleStockClick());

        this.tableauContainer.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
        document.addEventListener('pointermove', (e) => this.handlePointerMove(e));
        document.addEventListener('pointerup', (e) => this.handlePointerUp(e));
        document.addEventListener('pointercancel', (e) => this.handlePointerCancel(e));

        window.addEventListener('resize', () => {
            this.renderBoard();
        });

        this.btnUndo.addEventListener('click', () => this.handleUndo());
        this.btnRedo.addEventListener('click', () => this.handleRedo());
        this.btnHint.addEventListener('click', () => this.handleHint());
        this.btnNewGame.addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment démarrer une nouvelle partie ?')) {
                this.startNewGame();
            }
        });

        this.btnRules.addEventListener('click', () => this.modalRules.classList.add('open'));
        this.btnStats.addEventListener('click', () => this.showStatsModal());
        this.btnSound.addEventListener('click', () => {
            sound.toggleMute();
            this.updateSoundButtonUI();
        });

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.remove('open');
            });
        });
    }

    handleStockClick() {
        this.clearSelection();
        this.clearHint();

        const result = this.engine.dealStock();
        if (!result.success) {
            sound.playError();
            if (result.reason === 'EMPTY_COLUMN') {
                this.showToast('⚠️ Impossible de distribuer : toutes les colonnes doivent contenir au moins une carte !');
                this.highlightEmptyColumns();
            } else if (result.reason === 'NO_STOCK') {
                this.showToast('La pioche est vide !');
            }
            return;
        }

        this.startTimer();
        sound.playDeal();

        if (result.completedInfoList && result.completedInfoList.length > 0) {
            sound.playSequenceComplete();
            this.showToast('🎉 Suite complète (Roi à 1) formée !');
        }

        this.renderBoard();

        if (result.isWin) {
            this.handleWin();
        }
    }

    highlightEmptyColumns() {
        document.querySelectorAll('.column').forEach(col => {
            const colIdx = parseInt(col.dataset.colIndex, 10);
            if (this.engine.tableau[colIdx].length === 0) {
                col.classList.add('shake-empty');
                setTimeout(() => col.classList.remove('shake-empty'), 800);
            }
        });
    }

    handlePointerDown(e) {
        // Only trigger on primary button (button === 0)
        if (e.button !== undefined && e.button !== 0) return;

        const cardEl = e.target.closest('.card');
        const columnEl = e.target.closest('.column');

        // Target empty column when a sequence is selected
        if (!cardEl && columnEl && this.selectedSequenceInfo) {
            const targetCol = parseInt(columnEl.dataset.colIndex, 10);
            this.attemptMove(this.selectedSequenceInfo.colIndex, this.selectedSequenceInfo.cardIndex, targetCol);
            return;
        }

        if (!cardEl) return;

        const colIndex = parseInt(cardEl.dataset.colIndex, 10);
        const cardIndex = parseInt(cardEl.dataset.cardIndex, 10);

        // Check if cardIndex starts a valid moveable sequence
        if (!this.engine.canMoveSequence(colIndex, cardIndex)) {
            if (this.selectedSequenceInfo) {
                this.attemptMove(this.selectedSequenceInfo.colIndex, this.selectedSequenceInfo.cardIndex, colIndex);
            } else {
                sound.playError();
                this.showToast('⚠️ Impossible de déplacer cette carte : la suite au-dessus n\'est pas valide !');
            }
            return;
        }

        if (this.selectedSequenceInfo && this.selectedSequenceInfo.colIndex !== colIndex) {
            const moved = this.attemptMove(this.selectedSequenceInfo.colIndex, this.selectedSequenceInfo.cardIndex, colIndex);
            if (moved) return;
        }

        // Set pointer capture if supported
        try {
            if (e.pointerId !== undefined && cardEl.setPointerCapture) {
                cardEl.setPointerCapture(e.pointerId);
            }
        } catch (err) {}

        this.clearHint();
        this.dragState = {
            pointerId: e.pointerId,
            colIndex,
            cardIndex,
            startX: e.clientX,
            startY: e.clientY,
            isDragging: false,
            cardEl
        };
    }

    handlePointerMove(e) {
        if (!this.dragState) return;

        // STRICT SAFETY CHECK: If primary mouse button is NOT currently pressed, CANCEL DRAG IMMEDIATELY!
        if (e.buttons !== undefined && e.buttons !== 1) {
            this.handlePointerCancel(e);
            return;
        }

        const dist = Math.hypot(e.clientX - this.dragState.startX, e.clientY - this.dragState.startY);

        if (!this.dragState.isDragging && dist > 5) {
            this.dragState.isDragging = true;
            this.createDragGhost(e.clientX, e.clientY);
            this.hideSourceCardsInTableau();
        }

        if (this.dragState.isDragging && this.dragState.ghostEl) {
            this.dragState.ghostEl.style.left = `${e.clientX - this.dragState.offsetX}px`;
            this.dragState.ghostEl.style.top = `${e.clientY - this.dragState.offsetY}px`;
            this.highlightDropTargetsUnderPointer(e.clientX, e.clientY);
        }
    }

    handlePointerUp(e) {
        if (!this.dragState) return;

        // Release pointer capture
        try {
            if (this.dragState.cardEl && e && e.pointerId !== undefined && this.dragState.cardEl.releasePointerCapture) {
                this.dragState.cardEl.releasePointerCapture(e.pointerId);
            }
        } catch (err) {}

        if (this.dragState.isDragging) {
            const dropTargetCol = this.findDropTargetColumn(e.clientX, e.clientY);
            this.showSourceCardsInTableau();
            this.cleanupDragGhost();

            const fromCol = this.dragState.colIndex;
            const cardIndex = this.dragState.cardIndex;
            this.dragState = null;

            if (dropTargetCol !== null) {
                this.attemptMove(fromCol, cardIndex, dropTargetCol);
            } else {
                sound.playError();
                this.renderBoard();
            }
        } else {
            const fromCol = this.dragState.colIndex;
            const cardIndex = this.dragState.cardIndex;
            this.dragState = null;
            this.handleCardClick(fromCol, cardIndex);
        }
    }

    handlePointerCancel(e) {
        if (this.dragState) {
            try {
                if (this.dragState.cardEl && e && e.pointerId !== undefined && this.dragState.cardEl.releasePointerCapture) {
                    this.dragState.cardEl.releasePointerCapture(e.pointerId);
                }
            } catch (err) {}

            this.showSourceCardsInTableau();
            this.cleanupDragGhost();
            this.dragState = null;
            this.renderBoard();
        }
    }

    hideSourceCardsInTableau() {
        if (!this.dragState) return;
        const { colIndex, cardIndex } = this.dragState;
        const colEl = document.querySelector(`.column[data-col-index="${colIndex}"]`);
        if (!colEl) return;

        const cardElements = colEl.querySelectorAll('.card');
        cardElements.forEach(cardEl => {
            const cIdx = parseInt(cardEl.dataset.cardIndex, 10);
            if (cIdx >= cardIndex) {
                cardEl.classList.add('dragging-hidden');
            }
        });
    }

    showSourceCardsInTableau() {
        if (!this.dragState) return;
        const { colIndex } = this.dragState;
        const colEl = document.querySelector(`.column[data-col-index="${colIndex}"]`);
        if (!colEl) return;

        const cardElements = colEl.querySelectorAll('.card');
        cardElements.forEach(cardEl => cardEl.classList.remove('dragging-hidden'));
    }

    handleCardClick(colIndex, cardIndex) {
        if (this.selectedSequenceInfo &&
            this.selectedSequenceInfo.colIndex === colIndex &&
            this.selectedSequenceInfo.cardIndex === cardIndex) {
            this.clearSelection();
            this.renderBoard();
            return;
        }

        this.selectedSequenceInfo = { colIndex, cardIndex };
        sound.playCardFlip();
        this.renderBoard();
    }

    attemptMove(fromCol, cardIndex, targetCol) {
        const res = this.engine.moveSequence(fromCol, cardIndex, targetCol);

        if (!res.success) {
            sound.playError();
            this.clearSelection();
            this.renderBoard();
            return false;
        }

        this.startTimer();
        sound.playCardDrop();
        this.clearSelection();
        this.clearHint();

        if (res.completedInfo) {
            sound.playSequenceComplete();
            this.showToast('🎉 Suite complète retirée ! (Roi à 1)');
        }

        this.renderBoard();

        if (res.isWin) {
            this.handleWin();
        }

        return true;
    }

    createDragGhost(clientX, clientY) {
        const { colIndex, cardIndex, cardEl } = this.dragState;
        const sequence = this.engine.tableau[colIndex].slice(cardIndex);

        const rect = cardEl.getBoundingClientRect();
        this.dragState.offsetX = clientX - rect.left;
        this.dragState.offsetY = clientY - rect.top;

        const ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        ghost.style.width = `${rect.width}px`;
        ghost.style.left = `${clientX - this.dragState.offsetX}px`;
        ghost.style.top = `${clientY - this.dragState.offsetY}px`;

        const { faceUpStep } = this.getDynamicCardOffsets();

        sequence.forEach((card, idx) => {
            const cardDOM = CardRenderer.createCardDOM(card, { isDragging: true });
            cardDOM.style.top = `${idx * faceUpStep}px`;
            ghost.appendChild(cardDOM);
        });

        document.body.appendChild(ghost);
        this.dragState.ghostEl = ghost;
    }

    highlightDropTargetsUnderPointer(clientX, clientY) {
        document.querySelectorAll('.column').forEach(col => {
            col.classList.remove('drop-target-hover');
        });

        const targetCol = this.findDropTargetColumn(clientX, clientY);
        if (targetCol !== null) {
            const colEl = document.querySelector(`.column[data-col-index="${targetCol}"]`);
            if (colEl) colEl.classList.add('drop-target-hover');
        }
    }

    findDropTargetColumn(clientX, clientY) {
        if (!this.dragState) return null;
        const sequence = this.engine.tableau[this.dragState.colIndex].slice(this.dragState.cardIndex);

        const columns = document.querySelectorAll('.column');
        for (const col of columns) {
            const rect = col.getBoundingClientRect();
            if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom + 100) {
                const targetColIdx = parseInt(col.dataset.colIndex, 10);
                if (targetColIdx !== this.dragState.colIndex && this.engine.canDropSequence(sequence, targetColIdx)) {
                    return targetColIdx;
                }
            }
        }
        return null;
    }

    cleanupDragGhost() {
        if (this.dragState && this.dragState.ghostEl) {
            this.dragState.ghostEl.remove();
        }
        document.querySelectorAll('.column').forEach(col => col.classList.remove('drop-target-hover'));
    }

    clearSelection() {
        this.selectedSequenceInfo = null;
    }

    clearHint() {
        this.activeHint = null;
    }

    handleUndo() {
        this.clearSelection();
        this.clearHint();

        if (this.engine.undo()) {
            sound.playCardFlip();
            this.renderBoard();
            this.showToast('Coup annulé');
        }
    }

    handleRedo() {
        this.clearSelection();
        this.clearHint();

        if (this.engine.redo()) {
            sound.playCardFlip();
            this.renderBoard();
            this.showToast('Coup rétabli');
        }
    }

    handleHint() {
        this.clearSelection();
        const validMoves = this.engine.getValidMoves();

        if (validMoves.length === 0) {
            sound.playError();
            if (this.engine.stock.length > 0) {
                this.showToast('💡 Aucun coup sur le plateau. Distribuez la pioche !');
            } else {
                this.showToast('💡 Aucun coup possible. Essayez d\'annuler un coup !');
            }
            return;
        }

        const bestMove = validMoves[0];
        this.activeHint = bestMove;
        sound.playCardFlip();
        this.renderBoard();

        const fromCard = this.engine.tableau[bestMove.fromCol][bestMove.cardIndex];
        this.showToast(`💡 Astuce : Déplacez le ${fromCard.getRankLabel()}${fromCard.getSuitSymbol()} vers la colonne ${bestMove.toCol + 1}`);
    }

    handleWin() {
        this.stopTimer();
        sound.playSequenceComplete();
        Confetti.launch();

        StorageManager.recordWin(this.secondsElapsed, this.engine.moveCount);

        const timeStr = this.timerEl.textContent;
        document.getElementById('win-time').textContent = timeStr;
        document.getElementById('win-moves').textContent = this.engine.moveCount;

        this.modalWin.classList.add('open');
    }

    showStatsModal() {
        const stats = StorageManager.getStats();
        document.getElementById('stat-played').textContent = stats.gamesPlayed;
        document.getElementById('stat-won').textContent = stats.gamesWon;

        const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
        document.getElementById('stat-rate').textContent = `${winRate}%`;

        if (stats.bestTime !== null) {
            const mins = Math.floor(stats.bestTime / 60);
            const secs = stats.bestTime % 60;
            document.getElementById('stat-best-time').textContent = `${mins}m ${secs}s`;
        } else {
            document.getElementById('stat-best-time').textContent = '-';
        }

        document.getElementById('stat-min-moves').textContent = stats.minMoves !== null ? stats.minMoves : '-';

        this.modalStats.classList.add('open');
    }
}
