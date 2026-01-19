import { supabase } from '../lib/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_FILE = path.join(__dirname, '..', '..', 'data', 'settings.json');

// Ensure data directory exists
const dataDir = path.dirname(SETTINGS_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load settings from local file
const loadLocalSettings = () => {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading local settings:', e);
    }
    return { whatsapp: '', email: '' };
};

// Save settings to local file
const saveLocalSettings = (settings) => {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving local settings:', e);
        return false;
    }
};

/**
 * Rotas para gerenciar configurações globais do aplicativo
 * Usa arquivo local como fallback se a tabela não existir
 */
export default async function settingsRoutes(fastify) {

    /**
     * GET /settings
     * Retorna todas as configurações
     */
    fastify.get('/settings', async (request, reply) => {
        try {
            // Tentar buscar do Supabase primeiro
            const { data, error } = await supabase
                .from('app_settings')
                .select('*');

            if (error) {
                // Se erro, usar arquivo local como fallback
                console.warn('Supabase error, using local file:', error.message);
                return loadLocalSettings();
            }

            // Converter array [{key: 'k', value: 'v'}] para objeto {k: v}
            const settings = { whatsapp: '', email: '' };
            if (data && data.length > 0) {
                data.forEach(item => {
                    if (item.key && item.value !== undefined) {
                        settings[item.key] = item.value;
                    }
                });
            }

            return settings;
        } catch (e) {
            console.error('Error in GET /settings:', e);
            // Fallback para arquivo local
            return loadLocalSettings();
        }
    });

    /**
     * POST /settings
     * Atualiza ou cria configurações
     */
    fastify.post('/settings', async (request, reply) => {
        try {
            const settings = request.body;

            if (!settings || typeof settings !== 'object') {
                return reply.status(400).send({ error: 'Body deve ser um objeto JSON.' });
            }

            // Tentar salvar no Supabase primeiro
            const upserts = Object.keys(settings).map(key => ({
                key,
                value: settings[key]
            }));

            if (upserts.length === 0) {
                return { success: true };
            }

            const { data, error } = await supabase
                .from('app_settings')
                .upsert(upserts, { onConflict: 'key' })
                .select();

            if (error) {
                console.warn('Supabase error, saving to local file:', error.message);

                // Fallback: salvar em arquivo local
                const currentSettings = loadLocalSettings();
                const newSettings = { ...currentSettings, ...settings };

                if (saveLocalSettings(newSettings)) {
                    return { success: true, source: 'local_file', data: newSettings };
                } else {
                    return reply.status(500).send({ error: 'Falha ao salvar configurações.' });
                }
            }

            return { success: true, source: 'supabase', data };
        } catch (e) {
            console.error('Error in POST /settings:', e);

            // Tentar salvar localmente como último recurso
            try {
                const settings = request.body;
                const currentSettings = loadLocalSettings();
                const newSettings = { ...currentSettings, ...settings };

                if (saveLocalSettings(newSettings)) {
                    return { success: true, source: 'local_file', data: newSettings };
                }
            } catch (localError) {
                console.error('Local save also failed:', localError);
            }

            return reply.status(500).send({ error: e.message });
        }
    });
}
