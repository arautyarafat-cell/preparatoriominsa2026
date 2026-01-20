import { supabase } from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

export default async function authRoutes(fastify, options) {

    // Register: Creates a new user
    fastify.post('/auth/register', async (request, reply) => {
        const { email, password, deviceId } = request.body;

        if (!email || !password || !deviceId) {
            return reply.code(400).send({ error: 'Email, password, and deviceId are required' });
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            return reply.code(400).send({ error: error.message });
        }

        const user = data.user;
        const session = data.session;

        // Auto-login logic (register session)
        if (session) {
            const { error: sessionError } = await supabase
                .from('user_sessions')
                .upsert({
                    user_id: user.id,
                    device_id: deviceId,
                    last_seen_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (sessionError) {
                request.log.error('Session registration failed', sessionError);
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                session: {
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                    expires_in: session.expires_in
                }
            };
        } else {
            // If email confirmation is enabled, session might be null
            return {
                success: true,
                message: "Registo efectuado com sucesso. Verifica a mensagem na sua caixa de spam."
            }
        }
    });

    // Login: Authenticates and Locks Session to Device
    fastify.post('/auth/login', async (request, reply) => {
        const { email, password, deviceId } = request.body;

        if (!email || !password || !deviceId) {
            return reply.code(400).send({ error: 'Email, password, and deviceId are required' });
        }

        // 1. Authenticate with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return reply.code(401).send({ error: error.message });
        }

        const user = data.user;
        const session = data.session;

        // 2. Register/Update Active Session for this User -> One Device Policy
        // Uses upsert to overwrite any previous device_id for this user
        const { error: sessionError } = await supabase
            .from('user_sessions')
            .upsert({
                user_id: user.id,
                device_id: deviceId,
                last_seen_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (sessionError) {
            request.log.error('Session registration failed', sessionError);
            return reply.code(500).send({ error: 'Failed to register session' });
        }

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            session: {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_in: session.expires_in
            }
        };
    });

    // Forgot Password: Sends reset link
    fastify.post('/auth/forgot-password', async (request, reply) => {
        const { email } = request.body;
        const origin = request.headers.origin || 'http://localhost:3000';

        if (!email) {
            return reply.code(400).send({ error: 'Email is required' });
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/update-password`,
        });

        if (error) {
            return reply.code(400).send({ error: error.message });
        }

        return { success: true, message: 'Link de recuperação enviado para seu email.' };
    });

    // Update Password (com token de acesso)
    fastify.post('/auth/update-password', async (request, reply) => {
        const { password, accessToken } = request.body;

        if (!password || !accessToken) {
            return reply.code(400).send({ error: 'Password and access token are required' });
        }

        // 1. Validar token e identificar usuário
        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

        if (userError || !user) {
            return reply.code(401).send({ error: 'Token inválido ou expirado.' });
        }

        // 2. Atualizar a senha
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: password }
        );

        if (updateError) {
            return reply.code(400).send({ error: updateError.message });
        }

        return { success: true, message: 'Senha atualizada com sucesso!' };
    });

    // Logout: Clears the session
    fastify.post('/auth/logout', { preHandler: authenticate }, async (request, reply) => {
        const userId = request.user.id;

        // Remove session entry
        const { error } = await supabase
            .from('user_sessions')
            .delete()
            .eq('user_id', userId);

        if (error) {
            return reply.code(500).send({ error: 'Logout failed' });
        }

        // Also sign out from Supabase (invalidates the JWT on Supabase side if using RLS mostly)
        await supabase.auth.signOut(request.headers.authorization.replace('Bearer ', ''));

        return { success: true };
    });

    // Verify Session (Heartbeat)
    fastify.get('/auth/me', { preHandler: authenticate }, async (request, reply) => {
        // Update last seen
        await supabase
            .from('user_sessions')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('user_id', request.user.id);

        return {
            authenticated: true,
            user: request.user,
            deviceId: request.deviceId
        };
    });

    // Refresh Token: Get new access token using refresh token
    fastify.post('/auth/refresh', async (request, reply) => {
        const { refresh_token } = request.body;

        if (!refresh_token) {
            return reply.code(400).send({ error: 'Refresh token required' });
        }

        const { data, error } = await supabase.auth.refreshSession({ refresh_token });

        if (error || !data.session) {
            return reply.code(401).send({ error: 'Invalid or expired refresh token' });
        }

        return {
            success: true,
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in
            },
            user: data.user
        };
    });
}
