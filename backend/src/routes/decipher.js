import { supabase } from '../lib/supabase.js';

/**
 * Rotas para gerenciar os termos do jogo "Decifre o Termo"
 */
export default async function decipherRoutes(fastify) {

    /**
     * GET /decipher-terms
     * Lista todos os termos do jogo
     */
    fastify.get('/decipher-terms', async (request, reply) => {
        try {
            const { category_id, difficulty, active_only, limit = 1000 } = request.query;

            let query = supabase
                .from('decipher_terms')
                .select(`
                    *,
                    categories:category_id (id, name, icon)
                `)
                .order('created_at', { ascending: false })
                .limit(parseInt(limit));

            if (category_id) {
                query = query.eq('category_id', category_id);
            }

            if (difficulty) {
                query = query.eq('difficulty', difficulty);
            }

            if (active_only === 'true') {
                query = query.eq('is_active', true);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching decipher terms:', error);
                return reply.status(500).send({ error: error.message });
            }

            return { data, count: data?.length || 0 };
        } catch (e) {
            console.error('Error in GET /decipher-terms:', e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /**
     * GET /decipher-terms/random
     * Retorna um termo aleatório para o jogo
     */
    fastify.get('/decipher-terms/random', async (request, reply) => {
        try {
            const { category_id, difficulty } = request.query;

            // Helper function to validate UUID format
            const isValidUUID = (str) => {
                if (!str) return false;
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                return uuidRegex.test(str);
            };

            let query = supabase
                .from('decipher_terms')
                .select('*')
                .eq('is_active', true);

            // Only apply category filter if it's a valid UUID
            if (category_id && isValidUUID(category_id)) {
                // Busca termos da categoria específica OU termos gerais (sem categoria)
                query = query.or(`category_id.eq.${category_id},category_id.is.null`);
            }

            if (difficulty) {
                query = query.eq('difficulty', difficulty);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching random term:', error);
                return reply.status(500).send({ error: error.message });
            }

            if (!data || data.length === 0) {
                // Retornar termo fallback se não houver termos no banco
                return {
                    data: {
                        term: "HIPERTENSAO",
                        hint: "Pressão alta sustentada",
                        definition: "Condição clínica caracterizada por elevação sustentada dos níveis pressóricos."
                    },
                    source: 'fallback'
                };
            }

            // Selecionar termo aleatório
            const randomIndex = Math.floor(Math.random() * data.length);
            const randomTerm = data[randomIndex];

            return {
                data: {
                    id: randomTerm.id,
                    term: randomTerm.term.toUpperCase(),
                    hint: randomTerm.hint,
                    definition: randomTerm.definition
                },
                source: 'database'
            };
        } catch (e) {
            console.error('Error in GET /decipher-terms/random:', e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /**
     * POST /decipher-terms
     * Cria um novo termo
     */
    fastify.post('/decipher-terms', async (request, reply) => {
        try {
            const { term, hint, definition, category_id, difficulty = 'medio' } = request.body;

            if (!term || !hint || !definition) {
                return reply.status(400).send({ error: 'Termo, dica e definição são obrigatórios.' });
            }

            const { data, error } = await supabase
                .from('decipher_terms')
                .insert({
                    term: term.toUpperCase().trim(),
                    hint: hint.trim(),
                    definition: definition.trim(),
                    category_id: category_id || null,
                    difficulty,
                    is_active: true
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating decipher term:', error);
                return reply.status(500).send({ error: error.message });
            }

            return reply.status(201).send({ data });
        } catch (e) {
            console.error('Error in POST /decipher-terms:', e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /**
     * GET /decipher-terms/game
     * Retorna todos os termos válidos para o jogo (categoria específica + globais)
     * para permitir que o frontend faça o embaralhamento e evite repetições.
     */
    fastify.get('/decipher-terms/game', async (request, reply) => {
        try {
            const { category_id, difficulty } = request.query;

            // Helper function to validate UUID format
            const isValidUUID = (str) => {
                if (!str) return false;
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                return uuidRegex.test(str);
            };

            let query = supabase
                .from('decipher_terms')
                .select('id, term, hint, definition, category_id') // Fetch necessary fields
                .eq('is_active', true);

            // Only apply category filter if it's a valid UUID
            if (category_id && isValidUUID(category_id)) {
                query = query.or(`category_id.eq.${category_id},category_id.is.null`);
            }

            if (difficulty) {
                query = query.eq('difficulty', difficulty);
            }

            // Limit reasonable size for a game session
            const { data, error } = await query.limit(500);

            if (error) {
                console.error('Error fetching game terms:', error);
                return reply.status(500).send({ error: error.message });
            }

            return { data: data || [], count: data?.length || 0 };
        } catch (e) {
            console.error('Error in GET /decipher-terms/game:', e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /**
     * POST /decipher-terms/import
     * Importação em massa de termos
     */
    fastify.post('/decipher-terms/import', async (request, reply) => {
        try {
            const { terms, category_id } = request.body;

            if (!terms || !Array.isArray(terms) || terms.length === 0) {
                return reply.status(400).send({ error: 'Lista de termos é obrigatória.' });
            }

            const termsToInsert = terms.map(t => ({
                term: (t.term || '').toUpperCase().trim(),
                hint: (t.hint || '').trim(),
                definition: (t.definition || '').trim(),
                category_id: t.category_id || category_id || null,
                difficulty: t.difficulty || 'medio',
                is_active: true
            })).filter(t => t.term && t.hint && t.definition);

            if (termsToInsert.length === 0) {
                return reply.status(400).send({ error: 'Nenhum termo válido para importar.' });
            }

            const { data, error } = await supabase
                .from('decipher_terms')
                .insert(termsToInsert)
                .select();

            if (error) {
                console.error('Error importing decipher terms:', error);
                return reply.status(500).send({ error: error.message });
            }

            return reply.status(201).send({ data, count: data?.length || 0 });
        } catch (e) {
            console.error('Error in POST /decipher-terms/import:', e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /**
     * PUT /decipher-terms/:id
     * Atualiza um termo existente
     */
    fastify.put('/decipher-terms/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const { term, hint, definition, category_id, difficulty, is_active } = request.body;

            const updates = { updated_at: new Date().toISOString() };

            if (term !== undefined) updates.term = term.toUpperCase().trim();
            if (hint !== undefined) updates.hint = hint.trim();
            if (definition !== undefined) updates.definition = definition.trim();
            if (category_id !== undefined) updates.category_id = category_id || null;
            if (difficulty !== undefined) updates.difficulty = difficulty;
            if (is_active !== undefined) updates.is_active = is_active;

            const { data, error } = await supabase
                .from('decipher_terms')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating decipher term:', error);
                return reply.status(500).send({ error: error.message });
            }

            return { data };
        } catch (e) {
            console.error('Error in PUT /decipher-terms/:id:', e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /**
     * DELETE /decipher-terms/:id
     * Remove um termo
     */
    fastify.delete('/decipher-terms/:id', async (request, reply) => {
        try {
            const { id } = request.params;

            const { error } = await supabase
                .from('decipher_terms')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting decipher term:', error);
                return reply.status(500).send({ error: error.message });
            }

            return { success: true };
        } catch (e) {
            console.error('Error in DELETE /decipher-terms/:id:', e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /**
     * DELETE /decipher-terms/bulk
     * Remove todos os termos (com filtro opcional por categoria)
     */
    fastify.delete('/decipher-terms/bulk', async (request, reply) => {
        try {
            const { category_id } = request.query;

            let query = supabase.from('decipher_terms').delete();

            if (category_id) {
                query = query.eq('category_id', category_id);
            } else {
                // Deletar tudo
                query = query.neq('id', '00000000-0000-0000-0000-000000000000');
            }

            const { error } = await query;

            if (error) {
                console.error('Error deleting all decipher terms:', error);
                return reply.status(500).send({ error: error.message });
            }

            return { success: true };
        } catch (e) {
            console.error('Error in DELETE /decipher-terms/bulk:', e);
            return reply.status(500).send({ error: e.message });
        }
    });
}
