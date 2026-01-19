import { supabase } from '../lib/supabase.js';
import { requireAdmin } from '../middleware/adminAuth.js';

/**
 * 🛡️ ROTAS DE GESTÃO DE UTILIZADORES
 * TODAS as rotas neste ficheiro requerem permissões de ADMIN
 */
export default async function userRoutes(fastify, options) {

    /**
     * GET /users
     * Lista todos os utilizadores com informação do plano
     * ADMIN ONLY
     */
    fastify.get('/users', { preHandler: requireAdmin }, async (request, reply) => {
        try {
            // Filtros opcionais
            const { plan, search, limit = 100, offset = 0 } = request.query;

            // 1. Obter utilizadores do Auth (requer service role)
            const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
                page: 1,
                perPage: parseInt(limit)
            });

            if (authError) {
                request.log.error(authError);
                return reply.code(500).send({ error: 'Falha ao obter utilizadores' });
            }

            // 2. Obter todos os perfis
            const { data: profiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('*');

            if (profilesError) {
                request.log.warn('Error fetching profiles:', profilesError);
            }

            // 3. Verificar utilizadores bloqueados
            const { data: blockedUsers } = await supabase
                .from('blocked_users')
                .select('email, reason');

            const blockedEmails = new Set((blockedUsers || []).map(b => b.email.toLowerCase()));
            const blockedReasons = new Map((blockedUsers || []).map(b => [b.email.toLowerCase(), b.reason]));

            // 4. Combinar dados
            let users = authData.users.map(user => {
                const profile = profiles?.find(p => p.email === user.email);
                const isBlocked = blockedEmails.has(user.email?.toLowerCase());

                return {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at,
                    last_sign_in_at: user.last_sign_in_at,
                    plan: profile?.plan || 'free',
                    plan_activated_at: profile?.plan_activated_at || null,
                    status: isBlocked ? 'blocked' : 'active',
                    blocked_reason: isBlocked ? blockedReasons.get(user.email?.toLowerCase()) : null
                };
            });

            // 5. Aplicar filtros
            if (plan && plan !== 'all') {
                users = users.filter(u => u.plan === plan);
            }

            if (search) {
                const searchLower = search.toLowerCase();
                users = users.filter(u =>
                    u.email?.toLowerCase().includes(searchLower) ||
                    u.id?.toLowerCase().includes(searchLower)
                );
            }

            // 6. Ordenar por data de criação (mais recentes primeiro)
            users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // 7. Log de auditoria
            request.log.info({
                event: 'ADMIN_LIST_USERS',
                adminEmail: request.user.email,
                filters: { plan, search },
                resultCount: users.length
            });

            return {
                users,
                total: users.length,
                limit: parseInt(limit),
                offset: parseInt(offset)
            };

        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Erro interno do servidor' });
        }
    });

    /**
     * GET /users/:id
     * Obtém detalhes de um utilizador específico
     * ADMIN ONLY
     */
    fastify.get('/users/:id', { preHandler: requireAdmin }, async (request, reply) => {
        try {
            const { id } = request.params;

            // Obter utilizador do Auth
            const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(id);

            if (authError || !user) {
                return reply.code(404).send({ error: 'Utilizador não encontrado' });
            }

            // Obter perfil
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('email', user.email)
                .single();

            // Verificar se está bloqueado
            const { data: blocked } = await supabase
                .from('blocked_users')
                .select('*')
                .eq('email', user.email)
                .single();

            // Obter histórico de pagamentos
            const { data: payments } = await supabase
                .from('payment_proofs')
                .select('*')
                .eq('user_email', user.email)
                .order('created_at', { ascending: false })
                .limit(10);

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at,
                    last_sign_in_at: user.last_sign_in_at,
                    email_confirmed_at: user.email_confirmed_at
                },
                profile: profile || { plan: 'free' },
                blocked: blocked || null,
                payments: payments || []
            };

        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Erro interno do servidor' });
        }
    });

    /**
     * PUT /users/:id/plan
     * Atualiza o plano de um utilizador manualmente
     * ADMIN ONLY
     */
    fastify.put('/users/:id/plan', { preHandler: requireAdmin }, async (request, reply) => {
        const { id } = request.params;
        const { plan, email } = request.body;
        const adminUser = request.user;

        // Validar plano
        if (!['free', 'lite', 'pro', 'premier'].includes(plan)) {
            return reply.code(400).send({ error: 'Tipo de plano inválido' });
        }

        // Email é obrigatório
        if (!email) {
            return reply.code(400).send({ error: 'Email é obrigatório' });
        }

        try {
            // Verificar se o utilizador existe
            const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(id);

            if (userError || !user) {
                return reply.code(404).send({ error: 'Utilizador não encontrado' });
            }

            // Verificar se o email corresponde
            if (user.email !== email) {
                return reply.code(400).send({ error: 'Email não corresponde ao utilizador' });
            }

            // Verificar se perfil existe
            const { data: existingProfile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('email', email)
                .single();

            const previousPlan = existingProfile?.plan || 'free';

            if (existingProfile) {
                // Atualizar perfil existente
                await supabase
                    .from('user_profiles')
                    .update({
                        plan,
                        plan_activated_at: plan !== 'free' ? new Date().toISOString() : null,
                        updated_at: new Date().toISOString(),
                        updated_by: adminUser.email
                    })
                    .eq('email', email);
            } else {
                // Criar novo perfil
                await supabase
                    .from('user_profiles')
                    .insert({
                        email: email,
                        plan,
                        plan_activated_at: plan !== 'free' ? new Date().toISOString() : null,
                        created_by: adminUser.email
                    });
            }

            // Log de auditoria
            request.log.info({
                event: 'ADMIN_UPDATE_USER_PLAN',
                adminEmail: adminUser.email,
                targetEmail: email,
                previousPlan,
                newPlan: plan
            });

            return {
                success: true,
                message: `Plano do utilizador atualizado para ${plan}`,
                previousPlan,
                newPlan: plan
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Falha ao atualizar plano do utilizador' });
        }
    });

    /**
     * POST /users/:id/block
     * Bloqueia um utilizador
     * ADMIN ONLY
     */
    fastify.post('/users/:id/block', { preHandler: requireAdmin }, async (request, reply) => {
        const { id } = request.params;
        const { email, reason } = request.body;
        const adminUser = request.user;

        if (!email) {
            return reply.code(400).send({ error: 'Email é obrigatório' });
        }

        // Não permitir bloquear a si próprio
        if (email.toLowerCase() === adminUser.email.toLowerCase()) {
            return reply.code(400).send({ error: 'Não pode bloquear a sua própria conta' });
        }

        try {
            // Verificar se já está bloqueado
            const { data: existing } = await supabase
                .from('blocked_users')
                .select('id')
                .eq('email', email)
                .single();

            if (existing) {
                return reply.code(400).send({ error: 'Utilizador já está bloqueado' });
            }

            // Adicionar à lista de bloqueados
            const { error } = await supabase
                .from('blocked_users')
                .insert({
                    user_id: id,
                    email: email,
                    reason: reason || 'Bloqueado pelo administrador',
                    blocked_by: adminUser.email,
                    blocked_at: new Date().toISOString()
                });

            if (error) throw error;

            // Log de auditoria
            request.log.info({
                event: 'ADMIN_BLOCK_USER',
                adminEmail: adminUser.email,
                targetEmail: email,
                reason
            });

            return { success: true, message: 'Utilizador bloqueado com sucesso' };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Falha ao bloquear utilizador' });
        }
    });

    /**
     * DELETE /users/:id/block
     * Desbloqueia um utilizador
     * ADMIN ONLY
     */
    fastify.delete('/users/:id/block', { preHandler: requireAdmin }, async (request, reply) => {
        const { id } = request.params;
        const { email } = request.body || request.query;
        const adminUser = request.user;

        if (!email) {
            return reply.code(400).send({ error: 'Email é obrigatório' });
        }

        try {
            const { error } = await supabase
                .from('blocked_users')
                .delete()
                .eq('email', email);

            if (error) throw error;

            // Log de auditoria
            request.log.info({
                event: 'ADMIN_UNBLOCK_USER',
                adminEmail: adminUser.email,
                targetEmail: email
            });

            return { success: true, message: 'Utilizador desbloqueado com sucesso' };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Falha ao desbloquear utilizador' });
        }
    });

    /**
     * DELETE /users/:id
     * Remove um utilizador completamente
     * ADMIN ONLY - USAR COM CUIDADO
     */
    fastify.delete('/users/:id', { preHandler: requireAdmin }, async (request, reply) => {
        const { id } = request.params;
        const { confirmEmail } = request.body;
        const adminUser = request.user;

        try {
            // Obter dados do utilizador primeiro
            const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(id);

            if (getUserError || !user) {
                return reply.code(404).send({ error: 'Utilizador não encontrado' });
            }

            // Verificar confirmação (segurança adicional)
            if (confirmEmail !== user.email) {
                return reply.code(400).send({
                    error: 'Confirmação de email incorreta. Envie o email do utilizador para confirmar a eliminação.'
                });
            }

            // Não permitir eliminar a si próprio
            if (user.email.toLowerCase() === adminUser.email.toLowerCase()) {
                return reply.code(400).send({ error: 'Não pode eliminar a sua própria conta' });
            }

            // Eliminar do Auth
            const { error: deleteError } = await supabase.auth.admin.deleteUser(id);

            if (deleteError) throw deleteError;

            // Limpar dados relacionados
            await supabase.from('user_profiles').delete().eq('email', user.email);
            await supabase.from('blocked_users').delete().eq('email', user.email);
            await supabase.from('user_progress').delete().eq('user_id', id);
            await supabase.from('user_lesson_stats').delete().eq('user_id', id);

            // Log de auditoria
            request.log.info({
                event: 'ADMIN_DELETE_USER',
                adminEmail: adminUser.email,
                deletedEmail: user.email,
                deletedId: id
            });

            return { success: true, message: 'Utilizador eliminado com sucesso' };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Falha ao eliminar utilizador: ' + error.message });
        }
    });
}
