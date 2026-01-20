import { authService, getDeviceId, API_URL } from './auth';

interface Flashcard {
    id: string;
    front: string;
    back: string;
    status: 'new' | 'review' | 'mastered';
    updated_at: string;
    deleted_at?: string;
}

// Mock SQLite using IndexedDB/LocalStorage for Browser Environment
// In a real Tauri app, replace this with `tauri-plugin-sql` calls
const DB_KEY = 'offline_flashcards';

const getLocalCards = (): Flashcard[] => {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
};

const saveLocalCards = (cards: Flashcard[]) => {
    localStorage.setItem(DB_KEY, JSON.stringify(cards));
};

export const syncService = {
    // 1. Get cards (Local first)
    getFlashcards(): Flashcard[] {
        return getLocalCards().filter(c => !c.deleted_at);
    },

    // 2. Save card (Local + Mark for Sync)
    async saveFlashcard(card: Flashcard) {
        const cards = getLocalCards();
        const existingIdx = cards.findIndex(c => c.id === card.id);

        const cardWithMeta = {
            ...card,
            updated_at: new Date().toISOString()
        };

        if (existingIdx >= 0) {
            cards[existingIdx] = cardWithMeta;
        } else {
            cards.push(cardWithMeta);
        }

        saveLocalCards(cards);

        // Try to sync immediately if online
        if (navigator.onLine) {
            await this.sync();
        }

        return cardWithMeta;
    },

    // 3. Sync Process
    async sync() {
        if (!authService.isAuthenticated()) return;
        if (!navigator.onLine) return;

        const lastPulledAt = localStorage.getItem('last_sync_time');
        const localCards = getLocalCards();

        // Find changes since last sync (or all if never synced)
        // Simplified: push all local state that is "dirty" or just push everything and let server handle upsert
        // Optimization: In a real app, track 'dirty' flags. Here we send all for robustness.
        const changesToPush = {
            flashcards: localCards
        };

        try {
            const token = authService.getToken();
            const deviceId = getDeviceId();

            const response = await fetch(`${API_URL}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Device-ID': deviceId
                },
                body: JSON.stringify({
                    changes: changesToPush,
                    lastPulledAt
                })
            });

            if (!response.ok) throw new Error('Sync failed');

            const data = await response.json();

            // Apply Server Changes
            if (data.changes && data.changes.flashcards) {
                const serverUpdates = data.changes.flashcards.updated as Flashcard[];
                const serverDeletes = data.changes.flashcards.deleted as string[];

                let newLocal = [...localCards];

                // Apply updates
                serverUpdates.forEach(serverCard => {
                    const idx = newLocal.findIndex(c => c.id === serverCard.id);
                    if (idx >= 0) {
                        // Conflict resolution: Server wins if newer? 
                        // For now, Server Authority: always overwrite local with server
                        newLocal[idx] = serverCard;
                    } else {
                        newLocal.push(serverCard);
                    }
                });

                // Apply deletes
                newLocal = newLocal.filter(c => !serverDeletes.includes(c.id));

                saveLocalCards(newLocal);
            }

            // Update timestamp
            localStorage.setItem('last_sync_time', data.timestamp);

            return { success: true };

        } catch (error) {
            console.error('Sync error:', error);
            throw error;
        }
    }
};
