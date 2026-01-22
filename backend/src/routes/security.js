import { supabase } from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';

// Alias para manter compatibilidade com o código existente
const authenticateAdmin = requireAdmin;

export default async function securityRoutes(fastify, options) {

    // Registrar histórico de login de dispositivo (chamado internamente pelo login)
    fastify.post('/security/log-device', { preHandler: authenticate }, async (request, reply) => {
        const { deviceId } = request.body;
        const userId = request.user.id;

        try {
            // Registrar o login do dispositivo
            const { error } = await supabase
                .from('device_login_history')
                .insert({
                    user_id: userId,
                    device_id: deviceId,
                    ip_address: request.ip || request.headers['x-forwarded-for'] || 'unknown',
                    user_agent: request.headers['user-agent'] || 'unknown',
                    logged_in_at: new Date().toISOString()
                });

            if (error) {
                request.log.error('Failed to log device:', error);
            }

            return { success: true };
        } catch (error) {
            request.log.error('Device log error:', error);
            return { success: false };
        }
    });

    // Verificar se usuário está bloqueado (usado no login)
    fastify.get('/security/check-blocked/:email', async (request, reply) => {
        const { email } = request.params;

        try {
            // Buscar usuário pelo email
            const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

            if (userError) {
                return reply.code(500).send({ error: 'Failed to check user' });
            }

            const user = userData.users.find(u => u.email === email);
            if (!user) {
                return { blocked: false }; // Usuário não existe, deixar login normal tratar
            }

            // Verificar se está bloqueado no profiles
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_blocked, blocked_reason')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                request.log.error('Profile check error:', profileError);
                return { blocked: false };
            }

            return {
                blocked: profile?.is_blocked || false,
                reason: profile?.blocked_reason || null
            };
        } catch (error) {
            request.log.error('Check blocked error:', error);
            return { blocked: false };
        }
    });

    // ==================== ADMIN ROUTES ====================

    // Listar violações de segurança (usuários com múltiplos dispositivos)
    fastify.get('/admin/security/violations', { preHandler: authenticateAdmin }, async (request, reply) => {
        try {
            // Buscar histórico de dispositivos dos últimos 7 dias
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: history, error: historyError } = await supabase
                .from('device_login_history')
                .select('user_id, device_id, logged_in_at')
                .gte('logged_in_at', sevenDaysAgo.toISOString())
                .order('logged_in_at', { ascending: false });

            if (historyError) {
                request.log.error('History fetch error:', historyError);
                return reply.code(500).send({ error: 'Failed to fetch device history' });
            }

            // Agrupar por usuário
            const userDevices = {};
            for (const entry of history || []) {
                if (!userDevices[entry.user_id]) {
                    userDevices[entry.user_id] = {
                        user_id: entry.user_id,
                        devices: new Set(),
                        last_login: entry.logged_in_at
                    };
                }
                userDevices[entry.user_id].devices.add(entry.device_id);
            }

            // Filtrar apenas usuários com mais de 1 dispositivo
            const violators = Object.values(userDevices).filter(u => u.devices.size > 1);

            if (violators.length === 0) {
                return { data: [] };
            }

            // Buscar detalhes dos usuários violadores
            const userIds = violators.map(v => v.user_id);

            // Buscar emails do auth
            const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

            if (authError) {
                request.log.error('Auth users error:', authError);
                return reply.code(500).send({ error: 'Failed to fetch user details' });
            }

            // Buscar profiles
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, is_blocked, blocked_reason, blocked_at')
                .in('id', userIds);

            if (profileError) {
                request.log.error('Profiles error:', profileError);
            }

            // Combinar dados
            const result = violators.map(v => {
                const authUser = authUsers.users.find(u => u.id === v.user_id);
                const profile = profiles?.find(p => p.id === v.user_id);

                return {
                    user_id: v.user_id,
                    email: authUser?.email || 'Unknown',
                    full_name: profile?.full_name || null,
                    is_blocked: profile?.is_blocked || false,
                    blocked_reason: profile?.blocked_reason || null,
                    blocked_at: profile?.blocked_at || null,
                    unique_devices_7days: v.devices.size,
                    last_login: v.last_login,
                    device_ids: Array.from(v.devices)
                };
            });

            // Ordenar por número de dispositivos (mais primeiro)
            result.sort((a, b) => b.unique_devices_7days - a.unique_devices_7days);

            return { data: result };
        } catch (error) {
            request.log.error('Violations error:', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    // Bloquear usuário
    fastify.post('/admin/security/block', { preHandler: authenticateAdmin }, async (request, reply) => {
        const { user_id, reason } = request.body;

        if (!user_id) {
            return reply.code(400).send({ error: 'user_id is required' });
        }

        const blockReason = reason || 'Acesso em múltiplos dispositivos detectado';

        try {
            // Atualizar profile com bloqueio
            const { error } = await supabase
                .from('profiles')
                .update({
                    is_blocked: true,
                    blocked_reason: blockReason,
                    blocked_at: new Date().toISOString()
                })
                .eq('id', user_id);

            if (error) {
                request.log.error('Block user error:', error);
                return reply.code(500).send({ error: 'Failed to block user' });
            }

            // Também remover a sessão ativa do usuário
            await supabase
                .from('user_sessions')
                .delete()
                .eq('user_id', user_id);

            request.log.info(`User ${user_id} blocked by admin for: ${blockReason}`);

            return {
                success: true,
                message: 'Usuário bloqueado com sucesso'
            };
        } catch (error) {
            request.log.error('Block error:', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    // Desbloquear usuário
    fastify.post('/admin/security/unblock', { preHandler: authenticateAdmin }, async (request, reply) => {
        const { user_id } = request.body;

        if (!user_id) {
            return reply.code(400).send({ error: 'user_id is required' });
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    is_blocked: false,
                    blocked_reason: null,
                    blocked_at: null
                })
                .eq('id', user_id);

            if (error) {
                request.log.error('Unblock user error:', error);
                return reply.code(500).send({ error: 'Failed to unblock user' });
            }

            request.log.info(`User ${user_id} unblocked by admin`);

            return {
                success: true,
                message: 'Usuário desbloqueado com sucesso'
            };
        } catch (error) {
            request.log.error('Unblock error:', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
}
