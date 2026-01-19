import { supabase } from '../lib/supabase.js';
import { getCategoryId } from '../utils/categories.js';

export default async function contentRoutes(fastify, options) {
    // Get study topics (modules)
    fastify.get('/study-topics', async (request, reply) => {
        const { category_id } = request.query;
        console.log(`[StudyTopics v2.0] Request received for category_id: ${category_id}`);

        try {

            let query = supabase
                .from('study_topics')
                .select('*')
                .order('created_at', { ascending: false });

            if (category_id) {
                try {
                    // Resolve category ID using the shared utility
                    const resolvedCategoryId = await getCategoryId(category_id);
                    console.log(`[StudyTopics] Resolved category: ${category_id} -> ${resolvedCategoryId}`);

                    if (resolvedCategoryId) {
                        query = query.eq('category_id', resolvedCategoryId);
                    } else {
                        console.warn(`[StudyTopics] Category not found for code: ${category_id}`);
                        // Return empty if category not found
                        return { data: [] };
                    }
                } catch (catError) {
                    console.error(`[StudyTopics] Error resolving category:`, catError);
                    return { data: [] };
                }
            }

            const { data, error } = await query;

            if (error) {
                console.error(`[StudyTopics] Supabase Query Error:`, JSON.stringify(error));
                throw error;
            }

            console.log(`[StudyTopics] Returning ${data?.length || 0} topics`);
            return { data };

        } catch (error) {
            console.error(`[StudyTopics] CRITICAL HANDLER ERROR:`, error);
            // Return 200 with empty data to prevent frontend crash, but log error on server
            // actually, 500 is better for debugging, but let's make it informative
            return reply.code(500).send({
                error: 'Internal Server Error',
                details: error.message,
                hint: "Check server logs for Supabase error details"
            });
        }
    });

    // Get specific topic content
    fastify.get('/study-topics/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            const { data, error } = await supabase
                .from('study_topics')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { data };
        } catch (error) {
            return reply.code(500).send({ error: error.message });
        }
    });
}
