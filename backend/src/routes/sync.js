import { supabase } from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

export default async function syncRoutes(fastify, options) {

    // Sync flashcards (and other entities later)
    fastify.post('/sync', { preHandler: authenticate }, async (request, reply) => {
        const { changes, lastPulledAt } = request.body;
        const userId = request.user.id;
        const serverTimestamp = new Date().toISOString();

        const response = {
            success: true,
            timestamp: serverTimestamp,
            changes: {}
        };

        // 1. APPLY INCOMING CHANGES (Client -> Server)
        if (changes && changes.flashcards) {
            const pushedFlashcards = changes.flashcards;

            if (pushedFlashcards.length > 0) {
                // Attach user_id to all records to ensure security
                const recordsToUpsert = pushedFlashcards.map(fc => ({
                    id: fc.id,
                    user_id: userId,
                    front: fc.front,
                    back: fc.back,
                    status: fc.status,
                    created_at: fc.created_at,
                    updated_at: serverTimestamp, // Server authority on time
                    deleted_at: fc.deleted_at || null
                }));

                const { error: upsertError } = await supabase
                    .from('flashcards')
                    .upsert(recordsToUpsert, { onConflict: 'id' });

                if (upsertError) {
                    request.log.error('Sync upsert failed', upsertError);
                    return reply.code(500).send({ error: 'Failed to apply changes' });
                }
            }
        }

        // 2. FETCH UPDATES for Client (Server -> Client)
        // Get everything that changed since lastPulledAt AND belongs to this user
        let query = supabase
            .from('flashcards')
            .select('*')
            .eq('user_id', userId);

        if (lastPulledAt) {
            query = query.gt('updated_at', lastPulledAt);
        }

        const { data: serverChanges, error: fetchError } = await query;

        if (fetchError) {
            request.log.error('Sync fetch failed', fetchError);
            return reply.code(500).send({ error: 'Failed to fetch updates' });
        }

        response.changes.flashcards = {
            created: [], // Simplification: we just send "updated" for everything to be safe/easy on client
            updated: serverChanges.filter(r => !r.deleted_at),
            deleted: serverChanges.filter(r => r.deleted_at).map(r => r.id)
        };

        return response;
    });
}
