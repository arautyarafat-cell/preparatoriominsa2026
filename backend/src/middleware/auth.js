import { supabase } from '../lib/supabase.js';

export async function authenticate(request, reply) {
    const authHeader = request.headers.authorization;
    const deviceId = request.headers['x-device-id'];

    if (!authHeader) {
        return reply.code(401).send({ error: 'Missing Authorization header' });
    }

    if (!deviceId) {
        return reply.code(400).send({ error: 'Missing Device-ID header' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        // 1. Verify Token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return reply.code(401).send({ error: 'Invalid or expired token' });
        }

        // 2. Enforce Single Session per User (Check if this device is the active one)
        const { data: session, error: sessionError } = await supabase
            .from('user_sessions')
            .select('device_id')
            .eq('user_id', user.id)
            .single();

        if (sessionError && sessionError.code !== 'PGRST116') { // PGRST116 is "Is null/no rows"
            return reply.code(500).send({ error: 'Session validation failed' });
        }

        // If a session exists but the device_id doesn't match...
        if (session && session.device_id !== deviceId) {
            return reply.code(403).send({
                error: 'Session invalid: Account in use on another device.',
                code: 'DEVICE_MISMATCH'
            });
        }

        // 3. Attach user to request
        request.user = user;
        request.deviceId = deviceId;

    } catch (err) {
        request.log.error(err);
        return reply.code(401).send({ error: 'Authentication failed' });
    }
}
