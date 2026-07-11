import { supabase } from '../lib/supabase.js';
import { requireAdmin } from '../middleware/adminAuth.js';

export default async function adminLimitsRoutes(fastify, options) {
    // Add admin authentication hook
    fastify.addHook('preHandler', async (request, reply) => {
        await requireAdmin(request, reply);
    });

    // GET /admin/limits/ips - List all tracked IPs
    fastify.get('/admin/limits/ips', async (request, reply) => {
        try {
            // First fetch limits
            const { data: limits, error } = await supabase
                .from('trial_quiz_limits')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            // Then fetch user details for those with last_user_id
            const userIds = limits
                .filter(l => l.last_user_id)
                .map(l => l.last_user_id);

            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('user_profiles')
                    .select('user_id, first_name, last_name, email, plan')
                    .in('user_id', userIds);

                // Merge data
                const profileMap = new Map();
                if (profiles) {
                    profiles.forEach(p => profileMap.set(p.user_id, p));
                }

                limits.forEach(limit => {
                    if (limit.last_user_id && profileMap.has(limit.last_user_id)) {
                        limit.user = profileMap.get(limit.last_user_id);
                    }
                });
            }

            return { success: true, ips: limits };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch IP limits' });
        }
    });

    // POST /admin/limits/block - Block an IP
    fastify.post('/admin/limits/block', async (request, reply) => {
        const { ip_address, type, duration_minutes, reason } = request.body;

        if (!ip_address || !type) {
            return reply.code(400).send({ error: 'IP address and block type are required' });
        }

        try {
            let updates = {
                block_reason: reason || 'Bloqueado pelo administrador',
                updated_at: new Date().toISOString()
            };

            if (type === 'permanent') {
                updates.is_permanently_blocked = true;
                updates.blocked_until = null;
            } else if (type === 'temporary') {
                if (!duration_minutes) {
                    return reply.code(400).send({ error: 'Duration is required for temporary block' });
                }
                const blockedUntil = new Date();
                blockedUntil.setMinutes(blockedUntil.getMinutes() + parseInt(duration_minutes));

                updates.is_permanently_blocked = false;
                updates.blocked_until = blockedUntil.toISOString();
            } else {
                return reply.code(400).send({ error: 'Invalid block type' });
            }

            const { data, error } = await supabase
                .from('trial_quiz_limits')
                .update(updates)
                .eq('ip_address', ip_address)
                .select()
                .single();

            if (error) throw error;

            return { success: true, message: `IP ${ip_address} blocked successfully`, ip: data };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to block IP' });
        }
    });

    // POST /admin/limits/unblock - Unblock an IP
    fastify.post('/admin/limits/unblock', async (request, reply) => {
        const { ip_address } = request.body;

        if (!ip_address) {
            return reply.code(400).send({ error: 'IP address is required' });
        }

        try {
            const { data, error } = await supabase
                .from('trial_quiz_limits')
                .update({
                    is_permanently_blocked: false,
                    blocked_until: null,
                    block_reason: null,
                    updated_at: new Date().toISOString()
                })
                .eq('ip_address', ip_address)
                .select()
                .single();

            if (error) throw error;

            return { success: true, message: `IP ${ip_address} unblocked successfully`, ip: data };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to unblock IP' });
        }
    });

    // ===========================================
    // USER LIMITS (NEW)
    // ===========================================

    // GET /admin/limits/users - List all tracked Users
    fastify.get('/admin/limits/users', async (request, reply) => {
        try {
            // Fetch user limits
            const { data: limits, error } = await supabase
                .from('user_limits')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            // Fetch user details
            const userIds = limits.map(l => l.user_id);

            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('user_profiles')
                    .select('user_id, first_name, last_name, email, plan')
                    .in('user_id', userIds);

                const profileMap = new Map();
                if (profiles) {
                    profiles.forEach(p => profileMap.set(p.user_id, p));
                }

                limits.forEach(limit => {
                    if (profileMap.has(limit.user_id)) {
                        limit.user = profileMap.get(limit.user_id);
                    }
                });
            }

            return { success: true, users: limits };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch User limits' });
        }
    });

    // POST /admin/limits/users/block - Block a User
    fastify.post('/admin/limits/users/block', async (request, reply) => {
        const { user_id, reason, duration_minutes } = request.body;

        if (!user_id) {
            return reply.code(400).send({ error: 'User ID is required' });
        }

        try {
            let updates = {
                is_blocked: true,
                block_reason: reason || 'Bloqueado pelo administrador',
                updated_at: new Date().toISOString()
            };

            if (duration_minutes) {
                const blockedUntil = new Date();
                blockedUntil.setMinutes(blockedUntil.getMinutes() + parseInt(duration_minutes));
                updates.blocked_until = blockedUntil.toISOString();
            } else {
                updates.blocked_until = null; // Permanent/Indefinite until manually unblocked if logic dictates
            }

            // Upsert mainly because we might want to block a user who hasn't taken a quiz yet
            // But usually we interact with existing rows. Let's assume upsert.
            const { data, error } = await supabase
                .from('user_limits')
                .upsert({ user_id, ...updates })
                .select()
                .single();

            if (error) throw error;

            return { success: true, message: `User blocked successfully`, user: data };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to block User' });
        }
    });

    // POST /admin/limits/users/unblock - Unblock a User
    fastify.post('/admin/limits/users/unblock', async (request, reply) => {
        const { user_id } = request.body;

        if (!user_id) {
            return reply.code(400).send({ error: 'User ID is required' });
        }

        try {
            const { data, error } = await supabase
                .from('user_limits')
                .update({
                    is_blocked: false,
                    blocked_until: null,
                    block_reason: null,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user_id)
                .select()
                .single();

            if (error) throw error;

            return { success: true, message: `User unblocked successfully`, user: data };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to unblock User' });
        }
    });
}
