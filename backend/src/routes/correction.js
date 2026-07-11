import { openrouter } from '../lib/openrouter.js';
import { searchContext } from '../services/rag.js';
import { config } from '../config/env.js';

export default async function correctionRoutes(fastify, options) {
    fastify.post('/correct', async (request, reply) => {
        const { question, userAnswer, topic, category_id } = request.body;

        if (!question || !userAnswer || !topic) {
            return reply.code(400).send({ error: 'Question, User Answer and Topic are required' });
        }

        try {
            // Combine topic and question for better context retrieval
            let context = '';
            try {
                // Search utilizing both the topic context and the specific question, filtering by category if provided
                context = await searchContext(`${topic}: ${question}`, category_id);
            } catch (e) {
                console.warn('RAG search failed, using general knowledge:', e.message);
            }

            if (!openrouter) {
                return reply.code(500).send({ error: 'AI service not configured' });
            }

            const model = config.openai.model || "mistralai/devstral-2512:free";

            const prompt = `
        You are an intelligent and highly organized private tutor for health students in Angola.
        
        Your task is to answer the STUDENT'S QUESTION based STRICTLY on the PROVIDED CONTEXT.
        
        GUIDELINES:
        1. **STRUCTURE**: Your answer MUST be well-structured. Use:
           - Clear paragraphs.
           - Bullet points for lists.
           - **Bold** for key terms or important concepts.
           - Headers (###) if necessary to divide topics.
        2. **SOURCE**: Base your answer STRICTLY on the Context provided below. Do not invent information. If the context does not contain the answer, explicitly state: "O material disponível não aborda este ponto específico," and then provide general medical guidance if safe to do so.
        3. **TONE**: Professional, encouraging, and educational.
        4. **LANGUAGE**: Portuguese (Angola/Portugal).
        
        Context from Material:
        ${context || 'No specific context found in the uploaded material. Use general medical knowledge strictly related to: ' + topic}

        Student's Question: ${question}
        Student's Input/Context: ${userAnswer}

        Output format (JSON):
        {
          "isCorrect": boolean,
          "feedback": "Your structured, markdown-formatted answer here (string)."
        }
        
        Return ONLY the raw JSON.
      `;

            console.log(`Correcting answer for topic: ${topic} using model: ${model}`);

            const response = await openrouter.chat.send({
                model: model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3
            });

            const content = response.choices[0].message.content;
            const feedback = JSON.parse(content.replace(/```json|```/g, '').trim());
            return feedback;

        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: `Failed to correct answer: ${error.message}` });
        }
    });
}
