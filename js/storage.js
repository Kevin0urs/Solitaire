/**
 * LocalStorage Persistence Manager
 */
const STORAGE_KEY_STATS = 'spider_solitaire_2suit_stats';
const STORAGE_KEY_SETTINGS = 'spider_solitaire_2suit_settings';

export class StorageManager {
    static getStats() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_STATS);
            if (!raw) return { gamesPlayed: 0, gamesWon: 0, bestTime: null, minMoves: null };
            return JSON.parse(raw);
        } catch (e) {
            return { gamesPlayed: 0, gamesWon: 0, bestTime: null, minMoves: null };
        }
    }

    static recordGameStart() {
        const stats = this.getStats();
        stats.gamesPlayed += 1;
        this.saveStats(stats);
    }

    static recordWin(timeInSeconds, moves) {
        const stats = this.getStats();
        stats.gamesWon += 1;
        if (stats.bestTime === null || timeInSeconds < stats.bestTime) {
            stats.bestTime = timeInSeconds;
        }
        if (stats.minMoves === null || moves < stats.minMoves) {
            stats.minMoves = moves;
        }
        this.saveStats(stats);
    }

    static saveStats(stats) {
        try {
            localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
        } catch (e) {
            console.error('Failed to save stats', e);
        }
    }

    static getSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
            if (!raw) return { theme: 'blue', soundMuted: false };
            return JSON.parse(raw);
        } catch (e) {
            return { theme: 'blue', soundMuted: false };
        }
    }

    static saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings', e);
        }
    }
}
