import { supabase } from '../lib/supabase.js';

// Mapeamento de IDs do frontend para nomes de categorias no banco de dados
const CATEGORY_MAP = {
    'MEDICO': 'Médicos',
    'ENFERMAGEM': 'Enfermeiros',
    'TEC_ENFERMAGEM': 'Técnicos de Enfermagem',
    'TEC_FARMACIA': 'Técnicos de Farmácia',
    'ANALISES_CLINICAS': 'Técnicos de Análises Clínicas'
};

// Função para buscar o UUID real da categoria no banco de dados
async function getCategoryUUID(frontendCategoryId) {
    if (!frontendCategoryId) return null;

    // Se já for um UUID (contém hífens), retornar direto
    if (frontendCategoryId.includes('-')) {
        return frontendCategoryId;
    }

    // Buscar o nome da categoria pelo ID do frontend
    const categoryName = CATEGORY_MAP[frontendCategoryId];
    // Se não encontrar no mapa, tenta usar o próprio ID como fallback parcial ou nome direto
    const searchTerm = categoryName || frontendCategoryId;

    console.log(`[Flashcard] Buscando UUID para categoria: ${frontendCategoryId} -> ${searchTerm}`);

    // Buscar o UUID na tabela categories
    const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', `%${searchTerm}%`)
        .limit(1);

    if (error || !data || data.length === 0) {
        console.log(`[Flashcard] UUID não encontrado para categoria: ${searchTerm}`);
        // Log available categories for debugging
        const { data: allCats } = await supabase.from('categories').select('name');
        if (allCats) {
            console.log(`[Flashcard] Categorias disponíveis no banco: ${allCats.map(c => c.name).join(', ')}`);
        }
        return null;
    }

    console.log(`[Flashcard] Mapeado ${frontendCategoryId} -> ${data[0].name} -> UUID: ${data[0].id}`);
    return data[0].id;
}

export default async function flashcardRoutes(fastify, options) {
    fastify.post('/generate/flashcards', async (request, reply) => {
        const { topic, category_id } = request.body;

        if (!topic) {
            return reply.code(400).send({ error: 'Topic is required' });
        }

        try {
            // Buscar flashcards EXCLUSIVAMENTE do banco de dados
            let existingCards = [];
            let dbError = null;

            console.log(`[Flashcard] Recebido - topic: ${topic}, category_id: ${category_id}`);

            // Converter o category_id do frontend para UUID do banco de dados
            const realCategoryId = await getCategoryUUID(category_id);
            console.log(`[Flashcard] category_id convertido: ${category_id} -> ${realCategoryId}`);

            // Strategy 1: If category_id is provided, get flashcards ONLY from that category
            if (realCategoryId) {
                const { data, error } = await supabase
                    .from('questions')
                    .select('content, topic, category_id')
                    .eq('category_id', realCategoryId)
                    .eq('type', 'flashcard')
                    .limit(20);

                existingCards = data || [];
                dbError = error;
                console.log(`[Flashcard] Strategy 1 (category_id=${realCategoryId}): encontrados ${existingCards.length} flashcards`);
            }

            // NOTA: Removidas Strategy 2 e 3 que buscavam flashcards de outras categorias
            // Agora o sistema retorna APENAS flashcards da categoria selecionada
            // Se não houver flashcards, retorna 404 (tratado abaixo)

            // Return database flashcards if found
            if (!dbError && existingCards && existingCards.length > 0) {
                // Shuffle and pick random 5
                const shuffled = existingCards.sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 5);
                const formattedCards = selected.map(c => c.content);
                console.log(`[Flashcard] Retornando ${formattedCards.length} flashcards do banco de dados`);

                return {
                    type: 'flashcard',
                    data: formattedCards,
                    source: 'database'
                };
            }

            // Não há flashcards no banco de dados
            console.log(`[Flashcard] Nenhum flashcard encontrado no banco de dados`);
            return reply.code(404).send({
                error: 'Não há flashcards disponíveis para esta categoria. Por favor, contacte o administrador para adicionar flashcards.',
                message: 'Nenhum flashcard encontrado no banco de dados',
                type: 'no_questions'
            });

        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: `Failed to generate flashcards: ${error.message}` });
        }
    });
}
