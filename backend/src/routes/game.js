import { openai } from '../lib/openai.js';
import { supabase } from '../lib/supabase.js';
import { searchContext } from '../services/rag.js';
import { config } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { aiRateLimiter, logSecurityEvent } from '../middleware/security.js';

// Mapeamento de configurações por categoria/trilha de conhecimento
const CATEGORY_CONFIGS = {
    'MEDICO': {
        profession: 'Médico',
        role: 'médico(a)',
        objective: 'diagnosticar a condição do paciente e prescrever o tratamento apropriado',
        actionVerb: 'fazer o diagnóstico',
        focusAreas: 'diagnóstico diferencial, exames complementares, prescrição médica e conduta terapêutica',
        exams: {
            hemograma: 'Hemograma Completo',
            raiox: 'Raio-X de Tórax',
            ecg: 'Eletrocardiograma (ECG)',
            usg: 'Ultrassonografia Abdominal',
            cultura: 'Cultura de Secreção'
        },
        answerLabel: 'Diagnóstico'
    },
    'TEC_ENFERMAGEM': {
        profession: 'Técnico de Enfermagem',
        role: 'técnico(a) de enfermagem',
        objective: 'identificar as necessidades de cuidado do paciente e executar os procedimentos adequados',
        actionVerb: 'identificar a prioridade de cuidado',
        focusAreas: 'verificação de sinais vitais, administração de medicamentos, curativos, higiene do paciente, conforto e monitorização',
        exams: {
            sinaisVitais: 'Verificação completa de Sinais Vitais',
            glicemia: 'Glicemia Capilar',
            escalaGlasgow: 'Escala de Coma de Glasgow',
            escalaDor: 'Escala de Dor (EVA)',
            balanco: 'Balanço Hídrico'
        },
        answerLabel: 'Cuidado Prioritário'
    },
    'ENFERMAGEM': {
        profession: 'Enfermeiro',
        role: 'enfermeiro(a)',
        objective: 'elaborar o diagnóstico de enfermagem e planejar as intervenções adequadas',
        actionVerb: 'estabelecer o diagnóstico de enfermagem',
        focusAreas: 'processo de enfermagem (SAE), diagnósticos NANDA, planejamento de cuidados, supervisão da equipe e educação em saúde',
        exams: {
            anamnese: 'Anamnese de Enfermagem',
            exameFisico: 'Exame Físico Sistematizado',
            escalaBraden: 'Escala de Braden (Risco de lesão)',
            escalaFugulin: 'Escala de Fugulin (Complexidade assistencial)',
            historicoFamiliar: 'Histórico Familiar e Social'
        },
        answerLabel: 'Diagnóstico de Enfermagem'
    },
    'TEC_FARMACIA': {
        profession: 'Técnico de Farmácia',
        role: 'técnico(a) de farmácia',
        objective: 'identificar problemas relacionados a medicamentos e garantir a dispensação correta',
        actionVerb: 'identificar o problema farmacêutico',
        focusAreas: 'dispensação de medicamentos, verificação de prescrições, interações medicamentosas, armazenamento e controle de estoque',
        exams: {
            prescricao: 'Análise da Prescrição Médica',
            interacoes: 'Verificação de Interações Medicamentosas',
            alergias: 'Histórico de Alergias',
            adesao: 'Avaliação de Adesão ao Tratamento',
            estoque: 'Consulta de Disponibilidade no Estoque'
        },
        answerLabel: 'Intervenção Farmacêutica'
    },
    'ANALISES_CLINICAS': {
        profession: 'Técnico de Análises Clínicas',
        role: 'técnico(a) de análises clínicas',
        objective: 'identificar alterações laboratoriais e garantir a qualidade dos resultados',
        actionVerb: 'identificar a alteração laboratorial',
        focusAreas: 'coleta de amostras, processamento laboratorial, controle de qualidade, interpretação de resultados e biossegurança',
        exams: {
            hemograma: 'Hemograma Completo com Índices',
            bioquimica: 'Painel Bioquímico (Glicose, Ureia, Creatinina)',
            urina: 'Exame de Urina Tipo I (EAS)',
            coagulacao: 'Coagulograma (TP, TTPA)',
            cultura: 'Cultura e Antibiograma'
        },
        answerLabel: 'Alteração Laboratorial Principal'
    }
};

// Função auxiliar para identificar categoria pelo título
function getCategoryConfig(topic) {
    const topicLower = topic.toLowerCase();

    if (topicLower.includes('téc. enfermagem') || topicLower.includes('tec_enfermagem') || topicLower.includes('técnico de enfermagem')) {
        return { id: 'TEC_ENFERMAGEM', ...CATEGORY_CONFIGS['TEC_ENFERMAGEM'] };
    }
    if (topicLower.includes('lic. enfermagem') || topicLower.includes('enfermagem') && !topicLower.includes('téc')) {
        return { id: 'ENFERMAGEM', ...CATEGORY_CONFIGS['ENFERMAGEM'] };
    }
    if (topicLower.includes('téc. farmácia') || topicLower.includes('tec_farmacia') || topicLower.includes('farmácia')) {
        return { id: 'TEC_FARMACIA', ...CATEGORY_CONFIGS['TEC_FARMACIA'] };
    }
    if (topicLower.includes('análises clínicas') || topicLower.includes('analises_clinicas') || topicLower.includes('laboratório')) {
        return { id: 'ANALISES_CLINICAS', ...CATEGORY_CONFIGS['ANALISES_CLINICAS'] };
    }
    // Default: Médico
    return { id: 'MEDICO', ...CATEGORY_CONFIGS['MEDICO'] };
}

// Lista de condições/patologias para forçar variedade
const VARIED_CONDITIONS = {
    'MEDICO': [
        'Infarto Agudo do Miocárdio', 'Pneumonia Bacteriana', 'Acidente Vascular Cerebral',
        'Apendicite Aguda', 'Cetoacidose Diabética', 'Tromboembolismo Pulmonar',
        'Insuficiência Cardíaca Descompensada', 'Crise Asmática Grave', 'Meningite',
        'Pancreatite Aguda', 'Colecistite Aguda', 'Pielonefrite', 'Crise Hipertensiva',
        'Dengue Grave', 'Malária Complicada', 'Úlcera Péptica Perfurada', 'Obstrução Intestinal'
    ],
    'TEC_ENFERMAGEM': [
        'Risco de Queda', 'Hipoglicemia', 'Desidratação', 'Febre Alta',
        'Dor Aguda Não Controlada', 'Risco de Infecção', 'Hipotensão Postural',
        'Oxigenação Inadequada', 'Higiene Comprometida', 'Risco de Úlcera por Pressão',
        'Agitação Psicomotora', 'Retenção Urinária', 'Náuseas e Vômitos Persistentes'
    ],
    'ENFERMAGEM': [
        'Padrão Respiratório Ineficaz', 'Débito Cardíaco Diminuído', 'Risco de Sangramento',
        'Dor Crônica', 'Ansiedade Relacionada a Procedimento', 'Déficit de Autocuidado',
        'Integridade Tissular Prejudicada', 'Mobilidade Física Prejudicada', 'Confusão Aguda'
    ],
    'TEC_FARMACIA': [
        'Interação Medicamentosa', 'Dose Inadequada', 'Alergia Medicamentosa',
        'Medicamento Vencido', 'Via de Administração Incorreta', 'Duplicidade Terapêutica',
        'Subdosagem', 'Falta de Adesão ao Tratamento'
    ],
    'ANALISES_CLINICAS': [
        'Anemia Ferropriva', 'Leucocitose com Desvio à Esquerda', 'Trombocitopenia',
        'Hiperglicemia', 'Insuficiência Renal', 'Alteração Hepática', 'Infecção Urinária',
        'Distúrbio Eletrolítico', 'Hemólise'
    ]
};

export default async function gameRoutes(fastify, options) {
    // Endpoint de geração de casos clínicos - PROTEGIDO
    // Requer autenticação e tem rate limiting específico para IA
    fastify.post('/generate/game', {
        preHandler: [authenticate, aiRateLimiter]
    }, async (request, reply) => {
        const { topic, difficulty, seed, count = 1, categoryId } = request.body;

        if (!topic) {
            return reply.code(400).send({ error: 'Topic is required' });
        }

        try {
            // Try to get context from RAG, but don't fail if it doesn't work
            let context = '';
            try {
                context = await searchContext(topic);
            } catch (e) {
                console.warn('RAG search failed, using general knowledge:', e.message);
            }

            if (!openai) {
                return reply.code(500).send({ error: 'AI service not configured' });
            }

            // Fallback to a reliable free model if not configured
            // Use flash models for batch generation speed
            const model = config.openai.model || "google/gemini-2.0-flash-exp:free";

            const difficultyLevel = difficulty || 1;

            // Obter configuração específica da categoria
            const catConfig = categoryId && CATEGORY_CONFIGS[categoryId]
                ? { id: categoryId, ...CATEGORY_CONFIGS[categoryId] }
                : getCategoryConfig(topic);

            console.log(`🎮 Game: Gerando caso para categoria ${catConfig.id} (${catConfig.profession})`);

            // Gerar seed de variação para garantir casos únicos
            const variationSeed = seed || Date.now();
            const randomIndex = variationSeed % 1000;

            // Selecionar condições aleatórias para sugerir (força variedade)
            const conditionsList = VARIED_CONDITIONS[catConfig.id] || VARIED_CONDITIONS['MEDICO'];
            const shuffledConditions = [...conditionsList].sort(() => Math.random() - 0.5);
            const suggestedConditions = shuffledConditions.slice(0, Math.min(5, count + 2)).join(', ');

            // Gerar lista de exames baseada na categoria
            const examKeys = Object.keys(catConfig.exams);
            const examDescriptions = examKeys.map(key => `"${key}": "${catConfig.exams[key]} resultado"`).join(',\n               ');

            const prompt = `
        Crie ${count} caso(s) clínico(s) COMPLETAMENTE DIFERENTES E ÚNICOS para um jogo de simulação de ${catConfig.profession}.
        
        🔴 REGRA CRÍTICA DE VARIAÇÃO:
        - Código de variação: #${randomIndex}
        - Se está gerando múltiplos casos, CADA UM deve ter uma condição/doença DIFERENTE
        - Use DIFERENTES: nomes de pacientes, idades, gêneros, queixas e diagnósticos
        - SUGESTÕES de condições para usar (escolha entre estas): ${suggestedConditions}
        
        Tema/Área: ${topic}
        Dificuldade: Nível ${difficultyLevel} (Escala de 1 a 10).
        
        O usuário joga como ${catConfig.role} e precisa ${catConfig.objective}.
        
        CONTEXTO DA PROFISSÃO:
        - Profissão: ${catConfig.profession}
        - Foco principal: ${catConfig.focusAreas}
        - Objetivo do jogador: ${catConfig.actionVerb}
        
        IMPORTANTE: Todo o conteúdo DEVE estar em Português (Angola/Portugal).
        
        Contexto adicional:
        ${context || 'Conhecimento geral da área de saúde'}

        Formato de saída (APENAS JSON Array, sem markdown):
        [
          {
            "name": "Nome completo do paciente angolano/português (DIFERENTE para cada caso)",
            "age": (idade entre 18 e 85, VARIAR para cada caso),
            "gender": "M" ou "F" (VARIAR),
            "avatar": "👨" ou "👩" ou "👴" ou "👵" ou "👦" ou "👧" (de acordo com idade/gênero),
            "complaint": "Queixa principal do paciente (DIFERENTE para cada caso)",
            "vitals": { 
               "bp": "120/80", 
               "hr": "80", 
               "temp": "36.5", 
               "spo2": "98" 
            },
            "disease": "A resposta correta - ${catConfig.answerLabel} (DIFERENTE para cada caso)",
            "options": ["Opção errada 1", "A resposta correta", "Opção errada 2", "Opção errada 3"],
            "questions": [
               { "text": "Pergunta relevante para ${catConfig.profession} 1?", "answer": "Resposta do paciente 1", "clue": "Dica/interpretação clínica 1" },
               { "text": "Pergunta relevante para ${catConfig.profession} 2?", "answer": "Resposta do paciente 2", "clue": "Dica/interpretação clínica 2" },
               { "text": "Pergunta relevante para ${catConfig.profession} 3?", "answer": "Resposta do paciente 3", "clue": "Dica/interpretação clínica 3" }
            ],
            "exams": {
               ${examDescriptions}
            },
            "treatment": "Intervenção ou tratamento recomendado para ${catConfig.profession}",
            "conduct": "Conduta imediata que o ${catConfig.role} deve tomar",
            "explanation": "Explicação detalhada de por que a resposta está correta e as outras estão erradas, focando na perspectiva do ${catConfig.profession}."
          }
        ]
        
        REGRAS IMPORTANTES DE PERSONALIZAÇÃO:
        1. 🔴 VARIAÇÃO OBRIGATÓRIA: Cada caso DEVE ter diagnóstico/condição DIFERENTE. NUNCA repita o mesmo caso ou condição.
        2. Os casos DEVEM ser estritamente focados no escopo de prática de um ${catConfig.profession}. NÃO gere casos que exijam conhecimentos exclusivos de medicina se a profissão for Enfermagem ou Técnico.
        3. As perguntas (anamnese) DEVEM refletir EXATAMENTE o que um ${catConfig.role} perguntaria na sua rotina de trabalho.
        4. Os "exams" DEVEM ser limitados aos procedimentos listados acima que um ${catConfig.profession} realiza.
        5. A "disease" e as opções DEVEM corresponder ao "${catConfig.answerLabel}" e não necessariamente a um diagnóstico médico complexo, a menos que seja pertinente para a área. PARA TÉCNICO DE ENFERMAGEM, foque em CUIDADOS e PROCEDIMENTOS.
        6. Não inclua formatação markdown (como \`\`\`json), apenas o JSON puro.
        7. GERE CASOS COMPLETAMENTE NOVOS - imagine situações criativas e variadas.
      `;

            console.log(`Generating ${count} game(s) for topic: ${topic} using model: ${model} [seed: ${randomIndex}]`);

            const response = await openai.chat.completions.create({
                model: model,
                messages: [{ role: "user", content: prompt }],
                temperature: 1.0  // Maximum temperature for maximum variety/randomness
            });

            const content = response.choices[0].message.content;
            let gameContent = JSON.parse(content.replace(/```json|```/g, '').trim());

            // Ensure result is always an array
            if (!Array.isArray(gameContent)) {
                gameContent = [gameContent];
            }

            // Save each case individually to game_cases table for future use
            try {
                for (const caseData of gameContent) {
                    await supabase.from('game_cases').insert({
                        category_id: catConfig.id,
                        difficulty: difficultyLevel,
                        case_data: caseData,
                        used: false,
                        created_at: new Date().toISOString()
                    });
                }
                console.log(`✅ Saved ${gameContent.length} cases to game_cases table`);
            } catch (dbErr) {
                console.warn("Database storage failed:", dbErr.message);
            }

            return { type: 'game_batch', data: gameContent };

        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: `Failed to generate game: ${error.message}` });
        }
    });

    /**
     * GET /game-cases
     * Busca casos clínicos pré-gerados do banco de dados
     * Query params: category_id (opcional), limit (padrão: 10)
     */
    fastify.get('/game-cases', async (request, reply) => {
        const { category_id, limit = 10 } = request.query;
        const limitNum = Math.min(parseInt(limit) || 10, 20); // Máximo 20 casos

        try {
            let query = supabase
                .from('game_cases')
                .select('*')
                .eq('used', false)
                .order('created_at', { ascending: true })
                .limit(limitNum);

            if (category_id) {
                query = query.eq('category_id', category_id);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching game cases:', error);
                return reply.code(500).send({ error: 'Database error' });
            }

            if (!data || data.length === 0) {
                // No pre-generated cases available
                return reply.code(404).send({
                    error: 'No cases available',
                    message: 'Nenhum caso pré-gerado disponível.'
                });
            }

            console.log(`📦 Retornando ${data.length} casos para categoria: ${category_id || 'todas'}`);

            // Retornar array de casos
            const cases = data.map(gameCase => ({
                ...gameCase.case_data,
                caseId: gameCase.id,
                categoryId: gameCase.category_id
            }));

            return {
                success: true,
                data: cases,
                count: cases.length
            };

        } catch (error) {
            console.error('Error in GET /game-cases:', error);
            return reply.code(500).send({ error: error.message });
        }
    });

    /**
     * POST /game-cases/:id/used
     * Marca um caso como usado (não será retornado novamente)
     */
    fastify.post('/game-cases/:id/used', async (request, reply) => {
        const { id } = request.params;
        console.log(`📌 Recebida solicitação para marcar caso ${id} como usado`);

        if (!id) {
            return reply.code(400).send({ error: 'Missing case ID' });
        }

        try {
            const { error } = await supabase
                .from('game_cases')
                .update({ used: true, used_at: new Date().toISOString() })
                .eq('id', id);

            if (error) {
                console.error('Error marking case as used:', error);
                return reply.code(500).send({ error: 'Database error' });
            }

            return { success: true, message: 'Case marked as used' };

        } catch (error) {
            console.error('Error in POST /game-cases/:id/used:', error);
            return reply.code(500).send({ error: error.message });
        }
    });

    /**
     * GET /game-cases/count
     * Retorna a quantidade de casos disponíveis por categoria
     */
    fastify.get('/game-cases/count', async (request, reply) => {
        const { category_id } = request.query;

        try {
            let query = supabase
                .from('game_cases')
                .select('category_id', { count: 'exact' })
                .eq('used', false);

            if (category_id) {
                query = query.eq('category_id', category_id);
            }

            const { count, error } = await query;

            if (error) {
                console.error('Error counting game cases:', error);
                return reply.code(500).send({ error: 'Database error' });
            }

            return {
                success: true,
                count: count || 0
            };

        } catch (error) {
            console.error('Error in GET /game-cases/count:', error);
            return reply.code(500).send({ error: error.message });
        }
    });

    /**
     * POST /game-cases/generate-batch
     * Gera múltiplos casos e salva no banco de dados (para uso pelo admin ou cron)
     */
    fastify.post('/game-cases/generate-batch', async (request, reply) => {
        const { category_id, count = 5 } = request.body;

        if (!category_id) {
            return reply.code(400).send({ error: 'category_id is required' });
        }

        try {
            // Get category config
            const catConfig = CATEGORY_CONFIGS[category_id];
            if (!catConfig) {
                return reply.code(400).send({ error: 'Invalid category_id' });
            }

            console.log(`📦 Batch generating ${count} cases for ${category_id}...`);

            // Generate cases using the existing logic
            const topic = catConfig.profession;
            const difficulty = Math.floor(Math.random() * 5) + 3; // Random difficulty 3-7

            // Make internal request to generate endpoint
            const generateResponse = await fastify.inject({
                method: 'POST',
                url: '/generate/game',
                payload: {
                    topic,
                    difficulty,
                    count,
                    categoryId: category_id,
                    seed: Date.now()
                }
            });

            const result = JSON.parse(generateResponse.body);

            if (result.error) {
                return reply.code(500).send({ error: result.error });
            }

            return {
                success: true,
                message: `Generated and saved ${result.data?.length || 0} cases`,
                count: result.data?.length || 0
            };

        } catch (error) {
            console.error('Error in batch generation:', error);
            return reply.code(500).send({ error: error.message });
        }
    });
}
