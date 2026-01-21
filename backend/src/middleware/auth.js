import { supabase } from '../lib/supabase.js';

/**
 * 🔐 MIDDLEWARE DE AUTENTICAÇÃO
 * 
 * Valida o token JWT do Supabase e verifica política de sessão única.
 * 
 * Melhorias:
 * - Melhor tratamento de erros de token expirado
 * - Logs detalhados para debugging
 * - Código de erro específico para sessão expirada
 */

export async function authenticate(request, reply) {
    const authHeader = request.headers.authorization;
    const deviceId = request.headers['x-device-id'];

    if (!authHeader) {
        request.log.warn('[Auth] Missing Authorization header');
        return reply.code(401).send({
            error: 'Missing Authorization header',
            code: 'NO_AUTH_HEADER'
        });
    }

    if (!deviceId) {
        request.log.warn('[Auth] Missing Device-ID header');
        return reply.code(400).send({
            error: 'Missing Device-ID header',
            code: 'NO_DEVICE_ID'
        });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        // 1. Verify Token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) {
            // Log detalhado do erro
            request.log.warn(`[Auth] Token validation failed: ${error.message}`);

            // Verificar tipo de erro do Supabase
            const errorMessage = error.message.toLowerCase();

            if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
                return reply.code(401).send({
                    error: 'Token expired or invalid',
                    code: 'TOKEN_EXPIRED'
                });
            }

            return reply.code(401).send({
                error: 'Invalid or expired token',
                code: 'TOKEN_INVALID'
            });
        }

        if (!user) {
            request.log.warn('[Auth] No user found for token');
            return reply.code(401).send({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // 2. Enforce Single Session per User (Check if this device is the active one)
        const { data: session, error: sessionError } = await supabase
            .from('user_sessions')
            .select('device_id, last_seen_at')
            .eq('user_id', user.id)
            .single();

        if (sessionError && sessionError.code !== 'PGRST116') { // PGRST116 is "Is null/no rows"
            request.log.error(`[Auth] Session lookup error: ${sessionError.message}`);
            return reply.code(500).send({
                error: 'Session validation failed',
                code: 'SESSION_ERROR'
            });
        }

        // If a session exists but the device_id doesn't match...
        if (session && session.device_id !== deviceId) {
            request.log.warn(`[Auth] Device mismatch for user ${user.id}: expected ${session.device_id}, got ${deviceId}`);
            return reply.code(403).send({
                error: 'Session invalid: Account in use on another device.',
                code: 'DEVICE_MISMATCH'
            });
        }

        // 3. Update last_seen_at in background (não bloqueia a resposta)
        supabase
            .from('user_sessions')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .then(() => { })
            .catch(err => request.log.warn(`[Auth] Failed to update last_seen: ${err.message}`));

        // 4. Attach user to request
        request.user = user;
        request.deviceId = deviceId;

    } catch (err) {
        request.log.error(`[Auth] Unexpected error: ${err.message}`);
        return reply.code(401).send({
            error: 'Authentication failed',
            code: 'AUTH_ERROR'
        });
    }
}

/**
 * Middleware opcional para rotas que podem funcionar sem autenticação
 * mas beneficiam de ter o utilizador identificado
 */
export async function optionalAuthenticate(request, reply) {
    const authHeader = request.headers.authorization;
    const deviceId = request.headers['x-device-id'];

    // Se não há header de auth, continua sem user
    if (!authHeader || !deviceId) {
        request.user = null;
        return;
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (!error && user) {
            request.user = user;
            request.deviceId = deviceId;
        } else {
            request.user = null;
        }
    } catch (err) {
        request.log.warn(`[OptionalAuth] Error: ${err.message}`);
        request.user = null;
    }
}
