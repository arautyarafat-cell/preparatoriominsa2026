
const getBackendUrl = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        return `http://${hostname}:3001`;
    }
    return 'http://localhost:3001';
};

const BACKEND_URL = getBackendUrl();

export interface AppSettings {
    whatsapp: string;
    email: string;
    [key: string]: string;
}

export const settingsService = {
    /**
     * Get all settings
     */
    getSettings: async (): Promise<AppSettings> => {
        try {
            const response = await fetch(`${BACKEND_URL}/settings`);
            if (!response.ok) throw new Error('Failed to fetch settings');
            return await response.json();
        } catch (error) {
            console.error('Error fetching settings:', error);
            // Return defaults if failed
            return {
                whatsapp: '+244923456789',
                email: 'contato@angolasaude.com'
            };
        }
    },

    /**
     * Update settings
     */
    updateSettings: async (settings: Partial<AppSettings>): Promise<boolean> => {
        try {
            const response = await fetch(`${BACKEND_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (!response.ok) throw new Error('Failed to update settings');
            return true;
        } catch (error) {
            console.error('Error updating settings:', error);
            return false;
        }
    }
};
