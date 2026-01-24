import { supabase } from '../lib/supabase.js';
import { getCategoryId } from '../utils/categories.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { aiRateLimiter } from '../middleware/security.js';

export default async function questionRoutes(fastify, options) {

    // ==================== CATEGORIES ====================

    // Get all categories
    fastify.get('/categories', async (request, reply) => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            return { data };
        } catch (error) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // ==================== SUBJECTS ====================

    // Get subjects for a category
    fastify.get('/subjects', async (request, reply) => {
        const { category_id } = request.query;

        try {
            let query = supabase
                .from('subjects')
                .select('*, category:categories(name)')
                .order('name');

            if (category_id) {
                query = query.eq('category_id', category_id);
            }

            const { data, error } = await query;
            if (error) throw error;
            return { data };
        } catch (error) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Create a new subject
    fastify.post('/subjects', async (request, reply) => {
        const { category_id, name, description } = request.body;

        if (!category_id || !name) {
            return reply.code(400).send({ error: 'category_id and name are required' });
        }

        try {
            const { data, error } = await supabase
                .from('subjects')
                .insert({ category_id, name, description })
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // ==================== TOPICS ====================

    // Get unique topics (for filtering)
    // Get unique topics (for filtering)
    fastify.get('/topics', async (request, reply) => {
        let { category_id } = request.query;

        try {
            // Resolve category ID if it's a code
            category_id = await getCategoryId(category_id);

            console.log(`[Topics] Fetching topics for category: ${category_id || 'all'}`);

            let query = supabase
                .from('questions')
                .select('topic, category_id');

            if (category_id) {
                query = query.eq('category_id', category_id);
            }

            const { data, error } = await query;

            if (error) {
                console.error('[Topics] Supabase error:', error);
                throw error;
            }

            if (!data) {
                console.warn('[Topics] No data returned from Supabase');
                return { data: [] };
            }

            // Get unique topics
            const uniqueTopics = [...new Set(data.map(q => q.topic).filter(Boolean))].sort();
            console.log(`[Topics] Found ${uniqueTopics.length} unique topics`);

            return { data: uniqueTopics };
        } catch (error) {
            console.error('[Topics] Internal Error:', error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // ==================== QUESTIONS ====================

    // Create a new question (Quiz or Flashcard) manually
    fastify.post('/questions', async (request, reply) => {
        let { topic, type, content, category_id, subject_id } = request.body;

        if (!topic || !type || !content) {
            return reply.code(400).send({ error: 'Missing required fields: topic, type, content' });
        }

        // Resolve Category ID
        if (category_id) category_id = await getCategoryId(category_id);

        if (type !== 'quiz' && type !== 'flashcard') {
            return reply.code(400).send({ error: 'Invalid type. Must be "quiz" or "flashcard"' });
        }

        // Validate content structure based on type
        if (type === 'quiz') {
            if (!content.question || !Array.isArray(content.options) || content.correctAnswer === undefined || !content.explanation) {
                return reply.code(400).send({ error: 'Invalid quiz format. Requires: question, options[], correctAnswer, explanation' });
            }
        } else if (type === 'flashcard') {
            if (!content.front || !content.back) {
                return reply.code(400).send({ error: 'Invalid flashcard format. Requires: front, back' });
            }
        }

        try {
            const { data, error } = await supabase
                .from('questions')
                .insert({
                    topic,
                    type,
                    content,
                    category_id: category_id || null,
                    subject_id: subject_id || null
                })
                .select()
                .single();

            if (error) {
                console.error('Database error:', error);
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: `Failed to save question: ${error.message}` });
        }
    });

    // Get all questions with filtering
    fastify.get('/questions', async (request, reply) => {
        try {
            let { limit = 50, type, topic, category_id, subject_id } = request.query;

            // Resolve Category ID
            if (category_id) category_id = await getCategoryId(category_id);

            let query = supabase
                .from('questions')
                .select('*, category:categories(name, icon), subject:subjects(name)')
                .order('created_at', { ascending: false })
                .limit(parseInt(limit));

            if (type) {
                query = query.eq('type', type);
            }
            if (topic) {
                query = query.ilike('topic', `%${topic}%`);
            }
            if (category_id) {
                query = query.eq('category_id', category_id);
            }
            if (subject_id) {
                query = query.eq('subject_id', subject_id);
            }

            const { data, error } = await query;

            if (error) throw error;

            return { data };
        } catch (error) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Delete a question
    fastify.delete('/questions/:id', async (request, reply) => {
        const { id } = request.params;

        try {
            const { error } = await supabase
                .from('questions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Update a question
    fastify.put('/questions/:id', async (request, reply) => {
        const { id } = request.params;
        const { topic, type, content, category_id, subject_id } = request.body;

        if (!topic || !type || !content) {
            return reply.code(400).send({ error: 'Missing required fields: topic, type, content' });
        }

        // Validate content structure based on type
        if (type === 'quiz') {
            if (!content.question || !Array.isArray(content.options) || content.correctAnswer === undefined || !content.explanation) {
                return reply.code(400).send({ error: 'Invalid quiz format. Requires: question, options[], correctAnswer, explanation' });
            }
        } else if (type === 'flashcard') {
            if (!content.front || !content.back) {
                return reply.code(400).send({ error: 'Invalid flashcard format. Requires: front, back' });
            }
        }

        try {
            // Primeiro verificar se a questão existe
            const { data: existingQuestion, error: checkError } = await supabase
                .from('questions')
                .select('id')
                .eq('id', id);

            if (checkError) throw checkError;

            if (!existingQuestion || existingQuestion.length === 0) {
                return reply.code(404).send({ error: 'Questão não encontrada. Verifique se o ID está correto.' });
            }

            // Atualizar a questão
            const { data, error } = await supabase
                .from('questions')
                .update({
                    topic,
                    type,
                    content,
                    category_id: category_id || null,
                    subject_id: subject_id || null
                })
                .eq('id', id)
                .select('*, category:categories(name, icon), subject:subjects(name)');

            if (error) throw error;

            if (!data || data.length === 0) {
                return reply.code(404).send({ error: 'Falha ao atualizar: questão não encontrada ou sem permissão.' });
            }

            return { success: true, data: data[0] };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: `Failed to update question: ${error.message}` });
        }
    });

    // Delete ALL questions (bulk delete)
    fastify.delete('/questions/all', async (request, reply) => {
        const { category_id } = request.query;

        try {
            let query = supabase
                .from('questions')
                .delete();

            // Se category_id for fornecido, apagar apenas dessa categoria
            if (category_id) {
                query = query.eq('category_id', category_id);
            } else {
                // Para apagar tudo, precisamos de uma condição - usamos id não nulo
                query = query.neq('id', '00000000-0000-0000-0000-000000000000');
            }

            const { error, count } = await query;

            if (error) throw error;
            return { success: true, message: 'Todas as questões foram apagadas', count };
        } catch (error) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Bulk Import Questions
    fastify.post('/questions/import', async (request, reply) => {
        const { questions, category_id, subject_id } = request.body;

        if (!Array.isArray(questions) || questions.length === 0) {
            return reply.code(400).send({ error: 'No questions provided' });
        }

        try {
            const rowsToInsert = questions.map(q => ({
                topic: q.topic,
                type: q.type,
                content: q.content,
                category_id: category_id || q.category_id || null, // Allow per-question or global category
                subject_id: subject_id || q.subject_id || null
            }));

            const { data, error } = await supabase
                .from('questions')
                .insert(rowsToInsert)
                .select();

            if (error) throw error;
            return { success: true, count: data.length };
        } catch (error) {
            return reply.code(500).send({ error: 'Failed to import questions: ' + error.message });
        }
    });

    // Extract Questions from Text (AI)
    fastify.post('/questions/extract', async (request, reply) => {
        const { text, type } = request.body;

        if (!text) {
            return reply.code(400).send({ error: 'Text content is required' });
        }

        // Dynamic import to avoid circular dependencies
        const { openai } = await import('../lib/openai.js');

        if (!openai) {
            return reply.code(500).send({ error: 'AI service not configured' });
        }

        try {
            let prompt = '';
            if (type === 'quiz') {
                prompt = `
                Extract multiple-choice questions from the following text.
                Return ONLY a JSON array with this structure:
                [
                    {
                        "topic": "Topic inferred from text",
                        "type": "quiz",
                        "content": {
                            "question": "The question text?",
                            "options": ["Option A", "Option B", "Option C", "Option D"],
                            "correctAnswer": 0, // Index of correct option (0-3)
                            "explanation": "Why this is correct."
                        }
                    }
                ]
                If no questions can be extracted, return an empty array [].
                Text to process:
                ${text}
                `;
            } else {
                prompt = `
                Extract flashcards (term/definition or question/answer) from the following text.
                Return ONLY a JSON array with this structure:
                [
                    {
                        "topic": "Topic inferred from text",
                        "type": "flashcard",
                        "content": {
                            "front": "Term or Question",
                            "back": "Definition or Answer"
                        }
                    }
                ]
                If no flashcards can be extracted, return an empty array [].
                Text to process:
                ${text}
                `;
            }

            const completion = await openai.chat.completions.create({
                model: "google/gemini-2.0-flash-001", // Fast model for extraction
                messages: [
                    { role: "system", content: "You are a helpful assistant that extracts educational content from text into JSON format. Output ONLY raw JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1
            });

            let raw = completion.choices[0].message.content.trim();
            // Remove markdown code blocks if present
            if (raw.startsWith('```json')) {
                raw = raw.replace(/^```json\n/, '').replace(/\n```$/, '');
            } else if (raw.startsWith('```')) {
                raw = raw.replace(/^```\n/, '').replace(/\n```$/, '');
            }

            const parsed = JSON.parse(raw);
            return { data: parsed };

        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'AI Extraction failed: ' + error.message });
        }
    });
}
