import { supabase } from '../lib/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const BLOCKING_FILE = path.join(DATA_DIR, 'blocking.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read blocking data
function getBlockingData() {
    try {
        if (fs.existsSync(BLOCKING_FILE)) {
            return JSON.parse(fs.readFileSync(BLOCKING_FILE, 'utf-8'));
        }
    } catch (e) {
        console.error('Error reading blocking file:', e);
    }
    return { blockedCategories: [], blockedUsers: [] };
}

// Helper to save blocking data
function saveBlockingData(data) {
    try {
        fs.writeFileSync(BLOCKING_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving blocking file:', e);
        return false;
    }
}

export default async function blockingRoutes(fastify, options) {

    // Get all blocking data
    fastify.get('/blocking', async (request, reply) => {
        return getBlockingData();
    });

    // Get blocked categories only
    fastify.get('/blocking/categories', async (request, reply) => {
        const data = getBlockingData();
        return { blockedCategories: data.blockedCategories || [] };
    });

    // Get blocked users only
    fastify.get('/blocking/users', async (request, reply) => {
        const data = getBlockingData();
        return { blockedUsers: data.blockedUsers || [] };
    });

    // Check if a specific category is blocked
    fastify.get('/blocking/category/:categoryId', async (request, reply) => {
        const { categoryId } = request.params;
        const data = getBlockingData();
        const isBlocked = (data.blockedCategories || []).includes(categoryId);
        return { categoryId, blocked: isBlocked };
    });

    // Check if a specific user is blocked
    fastify.get('/blocking/user/:email', async (request, reply) => {
        const { email } = request.params;
        const data = getBlockingData();
        const blockedUser = (data.blockedUsers || []).find(u => u.email === email);
        return { email, blocked: !!blockedUser, reason: blockedUser?.reason || null };
    });

    // Block a category
    fastify.post('/blocking/category', async (request, reply) => {
        const { categoryId, categoryName } = request.body;

        if (!categoryId) {
            return reply.code(400).send({ error: 'categoryId is required' });
        }

        const data = getBlockingData();
        if (!data.blockedCategories) data.blockedCategories = [];

        // Check if already blocked
        if (data.blockedCategories.includes(categoryId)) {
            return { success: true, message: 'Category already blocked' };
        }

        data.blockedCategories.push(categoryId);

        if (saveBlockingData(data)) {
            return { success: true, message: `Category ${categoryName || categoryId} blocked` };
        }
        return reply.code(500).send({ error: 'Failed to save blocking data' });
    });

    // Unblock a category
    fastify.delete('/blocking/category/:categoryId', async (request, reply) => {
        const { categoryId } = request.params;

        const data = getBlockingData();
        if (!data.blockedCategories) data.blockedCategories = [];

        data.blockedCategories = data.blockedCategories.filter(id => id !== categoryId);

        if (saveBlockingData(data)) {
            return { success: true, message: `Category ${categoryId} unblocked` };
        }
        return reply.code(500).send({ error: 'Failed to save blocking data' });
    });

    // Block a user
    fastify.post('/blocking/user', async (request, reply) => {
        const { email, reason } = request.body;

        if (!email) {
            return reply.code(400).send({ error: 'email is required' });
        }

        const data = getBlockingData();
        if (!data.blockedUsers) data.blockedUsers = [];

        // Check if already blocked
        if (data.blockedUsers.find(u => u.email === email)) {
            return { success: true, message: 'User already blocked' };
        }

        data.blockedUsers.push({
            email,
            reason: reason || 'Bloqueado pelo administrador',
            blockedAt: new Date().toISOString()
        });

        if (saveBlockingData(data)) {
            return { success: true, message: `User ${email} blocked` };
        }
        return reply.code(500).send({ error: 'Failed to save blocking data' });
    });

    // Unblock a user
    fastify.delete('/blocking/user/:email', async (request, reply) => {
        const { email } = request.params;

        const data = getBlockingData();
        if (!data.blockedUsers) data.blockedUsers = [];

        data.blockedUsers = data.blockedUsers.filter(u => u.email !== email);

        if (saveBlockingData(data)) {
            return { success: true, message: `User ${email} unblocked` };
        }
        return reply.code(500).send({ error: 'Failed to save blocking data' });
    });
}
