/**
 * ==================================================
 * ROTAS DE AULAS DIGITAIS - FASTIFY
 * Sistema Angola Saude 2026
 * ==================================================
 * 
 * Endpoints para geracao automatica de aulas com IA
 * e gestao do sistema de aulas digitais.
 */


import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase.js';

// Inicializar IA (Gemini ou OpenRouter via Fetch)
let genAI = null;
let useOpenRouter = false;

if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('placeholder')) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('🤖 Lessons: Usando Gemini para geracao de aulas');
} else if (process.env.OPENROUTER_API_KEY) {
    useOpenRouter = true;
    console.log('🤖 Lessons: Usando OpenRouter (via Fetch) para geracao de aulas');
} else {
    console.warn('⚠️ Lessons: Nenhuma API de IA configurada');
}

// Funcao helper para gerar texto com IA
async function generateWithAI(prompt) {
    if (genAI) {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } else if (useOpenRouter) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000', // To identify your app
                    'X-Title': 'Angola Saude Prep'
                },
                body: JSON.stringify({
                    model: process.env.AI_MODEL || 'mistralai/mistral-small', // Modelo mais confiavel
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenRouter API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Formato inesperado da resposta OpenRouter');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('Erro na chamada OpenRouter:', error);
            throw error;
        }
    } else {
        throw new Error('Nenhuma API de IA disponivel configurada no .env');
    }
}

// ==================================================
// PROMPTS DO SISTEMA
// ==================================================

const PROFESSOR_PROMPT = `
Assumes o papel de PROFESSOR ESPECIALISTA EM CONCURSOS DA AREA DA SAUDE.

PERFIL DO PROFESSOR:
- Especialidade: Preparacao para concursos publicos na area da saude
- Estilo: Claro, objectivo, acessivel
- Idioma: Portugues de Portugal

REGRAS OBRIGATORIAS:
1. Nunca mencionar que es uma IA
2. Nunca usar emojis
3. Ser directo e objectivo
4. Basear-se em praticas aceites na area da saude
5. Focar em conteudo relevante para concursos
`;

const AREA_PROFILES = {
    MEDICO: {
        nome: 'Medicina',
        foco: 'Diagnostico, tratamento e decisoes clinicas',
        exemplos: 'casos clinicos complexos, interpretacao de exames, farmacologia avancada'
    },
    ENFERMAGEM: {
        nome: 'Licenciatura em Enfermagem',
        foco: 'Sistematizacao da assistencia e gestao de enfermagem',
        exemplos: 'processo de enfermagem, lideranca, cuidados especializados'
    },
    TEC_ENFERMAGEM: {
        nome: 'Tecnico de Enfermagem',
        foco: 'Procedimentos basicos e cuidados directos ao paciente',
        exemplos: 'sinais vitais, administracao de medicamentos, higiene e conforto'
    },
    TEC_FARMACIA: {
        nome: 'Tecnico de Farmacia',
        foco: 'Dispensacao, armazenamento e farmacologia pratica',
        exemplos: 'formas farmaceuticas, interacoes medicamentosas, legislacao'
    },
    ANALISES_CLINICAS: {
        nome: 'Analises Clinicas',
        foco: 'Colheita de amostras e interpretacao laboratorial',
        exemplos: 'hematologia, bioquimica, microbiologia, controlo de qualidade'
    }
};

// ==================================================
// FASTIFY PLUGIN
// ==================================================

export default async function lessonRoutes(fastify, options) {

    // ==================================================
    // ENDPOINT: LISTAR TODAS AS AULAS
    // ==================================================

    fastify.get('/lessons', async (request, reply) => {
        try {
            const { data, error } = await supabase
                .from('lessons')
                .select('*')
                .order('created_at', { ascending: false });

            // Se tabela nao existe, retornar array vazio
            if (error) {
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.log('Tabela lessons nao existe ainda, retornando array vazio');
                    return { success: true, data: [] };
                }
                throw error;
            }

            return { success: true, data: data || [] };
        } catch (error) {
            fastify.log.error('Erro ao listar aulas:', error);
            // Retornar array vazio em caso de erro para nao quebrar o frontend
            return { success: true, data: [] };
        }
    });

    // ==================================================
    // ENDPOINT: OBTER AULA POR ID
    // ==================================================

    fastify.get('/lessons/:id', async (request, reply) => {
        try {
            const { id } = request.params;

            const { data, error } = await supabase
                .from('lessons')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            fastify.log.error('Erro ao obter aula:', error);
            return reply.status(500).send({ error: 'Falha ao obter aula' });
        }
    });

    // ==================================================
    // ENDPOINT: CRIAR AULA
    // ==================================================

    fastify.post('/lessons', async (request, reply) => {
        try {
            const {
                titulo, area, categoria, slides,
                aulaConversacional, miniQuiz, flashcards,
                objectivoGeral, objectivosEspecificos, preRequisitos,
                duracaoEstimadaMinutos, versao, autor, tags, integracaoJogos,
                materiaisComplementares
            } = request.body;

            if (!titulo) {
                return reply.status(400).send({ error: 'Titulo e obrigatorio' });
            }

            const lessonData = {
                id: `lesson-${Date.now()}`,
                titulo,
                area: area || 'TEC_ENFERMAGEM',
                categoria: categoria || null,
                slides: slides || [],
                aula_conversacional: aulaConversacional || null,
                mini_quiz: miniQuiz || null,
                flashcards: flashcards || null,
                objectivo_geral: objectivoGeral || null,
                objectivos_especificos: objectivosEspecificos || [],
                pre_requisitos: preRequisitos || [],
                duracao_estimada_minutos: duracaoEstimadaMinutos || Math.ceil((slides?.length || 6) * 5),
                versao: versao || '1.0.0',
                autor: autor || 'Sistema Angola Saude 2026',
                tags: tags || [],
                materiais_complementares: materiaisComplementares || [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('lessons')
                .insert([lessonData])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            fastify.log.error('Erro ao criar aula:', error);
            return reply.status(500).send({ error: 'Falha ao criar aula' });
        }
    });

    // ==================================================
    // ENDPOINT: ACTUALIZAR AULA
    // ==================================================

    fastify.put('/lessons/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const {
                titulo, area, categoria, slides,
                aulaConversacional, miniQuiz, flashcards,
                objectivoGeral, objectivosEspecificos, preRequisitos,
                duracaoEstimadaMinutos, versao, autor, tags,
                materiaisComplementares
            } = request.body;

            const updateData = {
                titulo,
                area,
                categoria,
                slides,
                aula_conversacional: aulaConversacional,
                mini_quiz: miniQuiz,
                flashcards: flashcards,
                objectivo_geral: objectivoGeral,
                objectivos_especificos: objectivosEspecificos,
                pre_requisitos: preRequisitos,
                duracao_estimada_minutos: duracaoEstimadaMinutos,
                versao: versao,
                autor: autor,
                tags: tags,
                materiais_complementares: materiaisComplementares,
                updated_at: new Date().toISOString()
            };

            // Remover campos undefined para nao sobrescrever com null
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            const { data, error } = await supabase
                .from('lessons')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            fastify.log.error('Erro ao actualizar aula:', error);
            return reply.status(500).send({ error: 'Falha ao actualizar aula' });
        }
    });

    // ==================================================
    // ENDPOINT: EXCLUIR AULA
    // ==================================================

    fastify.delete('/lessons/:id', async (request, reply) => {
        try {
            const { id } = request.params;

            const { error } = await supabase
                .from('lessons')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            fastify.log.error('Erro ao excluir aula:', error);
            return reply.status(500).send({ error: 'Falha ao excluir aula' });
        }
    });

    // ==================================================
    // ENDPOINT: GERAR SLIDES

    fastify.post('/generate/lesson-slides', async (request, reply) => {
        try {
            const { tema, area, conteudoBase } = request.body;

            if (!tema || !area) {
                return reply.status(400).send({ error: 'Tema e area sao obrigatorios' });
            }

            const areaProfile = AREA_PROFILES[area] || AREA_PROFILES.TEC_ENFERMAGEM;

            // Definir instrucoes diferentes dependendo se ha conteudo base
            const conteudoInstrucoes = conteudoBase ? `
CONTEUDO FORNECIDO PELO USUARIO (OBRIGATORIO USAR NA INTEGRA):
${conteudoBase}

REGRA CRITICA - OBRIGATORIO SEGUIR:
- VOCE DEVE USAR TODO O CONTEUDO ACIMA SEM EXCLUIR, RESUMIR OU DIMINUIR NADA
- Cada informacao, conceito, definicao e detalhe fornecido DEVE aparecer na aula
- NAO omita nenhuma parte do material fornecido pelo usuario
- Crie tantos slides quantos forem necessarios para cobrir TODO o conteudo
- NAO resuma nem simplifique - use o conteudo completo
` : '';

            const prompt = `
${PROFESSOR_PROMPT}

TAREFA: Gerar slides para uma aula digital sobre "${tema}"

AREA PROFISSIONAL: ${areaProfile.nome}
FOCO: ${areaProfile.foco}
${conteudoInstrucoes}

INSTRUCOES:
${conteudoBase ? '- Criar o numero de slides NECESSARIO para cobrir TODO o conteudo fornecido (pode ser mais de 10 slides)' : '- Gerar entre 6 e 10 slides'}
- Um conceito por slide
- ${conteudoBase ? 'Incluir TODAS as informacoes do conteudo fornecido' : 'Maximo 150 palavras por slide'}
- Incluir 2-4 pontos-chave por slide
- Audio script que NAO repete o texto (explica de forma diferente)
- Duracao audio: 60-120 segundos por slide

FORMATO DE SAIDA (JSON ARRAY):
[
  {
    "titulo": "Titulo do Slide (max 60 chars)",
    "conteudoPrincipal": "Texto principal em markdown...",
    "pontosChave": [
      { "titulo": "Ponto 1", "descricao": "Descricao breve" }
    ],
    "audioScript": "Texto do audio explicativo diferente do conteudo...",
    "duracaoAudioSegundos": 90,
    "conceito": "Conceito central em uma frase",
    "relevanciaProva": "alta|media|baixa"
  }
]

Retorna APENAS o JSON array, sem texto adicional.
`;

            const text = await generateWithAI(prompt);

            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('Formato de resposta invalido');
            }

            const slides = JSON.parse(jsonMatch[0]);

            const slidesComId = slides.map((slide, index) => ({
                id: `slide-${Date.now()}-${index}`,
                ordem: index + 1,
                ...slide,
                status: 'pending'
            }));

            return { success: true, data: slidesComId };

        } catch (error) {
            fastify.log.error('Erro ao gerar slides:', error);
            return reply.status(500).send({
                error: 'Falha ao gerar slides',
                details: error.message
            });
        }
    });

    // ==================================================
    // ENDPOINT: GERAR AULA CONVERSACIONAL
    // ==================================================

    fastify.post('/generate/lesson-conversation', async (request, reply) => {
        try {
            const { tema, area, slidesContext } = request.body;

            if (!tema) {
                return reply.status(400).send({ error: 'Tema e obrigatorio' });
            }

            const areaProfile = AREA_PROFILES[area] || AREA_PROFILES.TEC_ENFERMAGEM;

            const prompt = `
${PROFESSOR_PROMPT}

TAREFA: Gerar blocos de aula conversacional sobre "${tema}"

AREA: ${areaProfile.nome}
CONCEITOS ABORDADOS: ${slidesContext || tema}

ESTRUTURA DA AULA:
1. INTRODUCAO (1-2 blocos): Apresentar tema e relevancia
2. DESENVOLVIMENTO (4-6 blocos): Explicar conceitos principais
3. EXEMPLOS (2 blocos): Casos praticos
4. APLICACAO (1-2 blocos): Cenarios de prova
5. RESUMO (1 bloco): Pontos essenciais

REGRAS:
- Maximo 80 palavras por bloco
- Incluir perguntas retoricas
- Usar "tu" e linguagem acessivel
- Algumas perguntas ao aluno (campo perguntaAluno)

FORMATO DE SAIDA (JSON ARRAY):
[
  {
    "tipo": "introducao|explicacao|exemplo|aplicacao|resumo",
    "fala": "Texto do professor...",
    "perguntaAluno": "Pergunta opcional ao aluno (pode ser null)",
    "pausaReflexao": 3,
    "dicaContextual": "Dica opcional (pode ser null)"
  }
]

Retorna APENAS o JSON array.
`;

            const text = await generateWithAI(prompt);

            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('Formato de resposta invalido');
            }

            const blocos = JSON.parse(jsonMatch[0]);

            const blocosComId = blocos.map((bloco, index) => ({
                id: `bloco-${Date.now()}-${index}`,
                ordem: index + 1,
                ...bloco
            }));

            return { success: true, data: blocosComId };

        } catch (error) {
            fastify.log.error('Erro ao gerar aula conversacional:', error);
            return reply.status(500).send({
                error: 'Falha ao gerar aula conversacional',
                details: error.message
            });
        }
    });

    // ==================================================
    // ENDPOINT: GERAR QUIZ DA AULA
    // ==================================================

    fastify.post('/generate/lesson-quiz', async (request, reply) => {
        try {
            const { tema, conceitos } = request.body;

            if (!tema) {
                return reply.status(400).send({ error: 'Tema e obrigatorio' });
            }

            const prompt = `
${PROFESSOR_PROMPT}

TAREFA: Gerar 3 questoes de quiz sobre "${tema}"

CONCEITOS A AVALIAR: ${Array.isArray(conceitos) ? conceitos.join(', ') : tema}

REGRAS:
- Exactamente 3 questoes
- 4 alternativas cada (A, B, C, D)
- Questoes claras e objectivas
- Explicacao educativa para cada resposta
- Sem pegadinhas

FORMATO DE SAIDA (JSON ARRAY):
[
  {
    "enunciado": "Pergunta clara...",
    "alternativas": [
      { "letra": "A", "texto": "Opcao A" },
      { "letra": "B", "texto": "Opcao B" },
      { "letra": "C", "texto": "Opcao C" },
      { "letra": "D", "texto": "Opcao D" }
    ],
    "correta": "B",
    "explicacao": "Explicacao educativa..."
  }
]

Retorna APENAS o JSON array.
`;

            const text = await generateWithAI(prompt);

            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('Formato de resposta invalido');
            }

            const questoes = JSON.parse(jsonMatch[0]);

            const questoesComId = questoes.map((q, index) => ({
                id: `quiz-${Date.now()}-${index}`,
                ...q
            }));

            return { success: true, data: questoesComId };

        } catch (error) {
            fastify.log.error('Erro ao gerar quiz:', error);
            return reply.status(500).send({
                error: 'Falha ao gerar quiz',
                details: error.message
            });
        }
    });

    // ==================================================
    // ENDPOINT: FEEDBACK DO QUIZ
    // ==================================================

    fastify.post('/generate/quiz-feedback', async (request, reply) => {
        try {
            const { questao, respostaAluno, respostaCorrecta, acertou, explicacao } = request.body;

            const prompt = `
${PROFESSOR_PROMPT}

TAREFA: Dar feedback sobre resposta do aluno

QUESTAO: ${questao}
RESPOSTA DO ALUNO: ${respostaAluno}
RESPOSTA CORRECTA: ${respostaCorrecta}
RESULTADO: ${acertou ? 'ACERTOU' : 'ERROU'}
EXPLICACAO BASE: ${explicacao}

INSTRUCOES:
1. ${acertou ? 'Parabenizar brevemente' : 'Encorajar e explicar o erro'}
2. Reforcar o conceito correcto
3. Dar dica para lembrar
4. Maximo 60 palavras

Responde como professor, sem mencionar que es IA.
`;

            const feedback = await generateWithAI(prompt);

            return { success: true, feedback };

        } catch (error) {
            fastify.log.error('Erro ao gerar feedback:', error);
            return reply.status(500).send({
                error: 'Falha ao gerar feedback',
                details: error.message
            });
        }
    });

    // ==================================================
    // ENDPOINT: GUARDAR PROGRESSO
    // ==================================================

    fastify.post('/lessons/:lessonId/progress', async (request, reply) => {
        try {
            const { lessonId } = request.params;
            const progressData = request.body;

            const userId = 'anonymous'; // TODO: Extract from auth

            const { data, error } = await supabase
                .from('lesson_progress')
                .upsert({
                    lesson_id: lessonId,
                    user_id: userId,
                    progress_data: progressData,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'lesson_id,user_id'
                });

            if (error) throw error;

            return { success: true };

        } catch (error) {
            fastify.log.error('Erro ao guardar progresso:', error);
            return reply.status(500).send({
                error: 'Falha ao guardar progresso',
                details: error.message
            });
        }
    });

    // ==================================================
    // ENDPOINT: CARREGAR PROGRESSO
    // ==================================================

    fastify.get('/lessons/:lessonId/progress', async (request, reply) => {
        try {
            const { lessonId } = request.params;
            const userId = 'anonymous';

            const { data, error } = await supabase
                .from('lesson_progress')
                .select('*')
                .eq('lesson_id', lessonId)
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return data?.progress_data || null;

        } catch (error) {
            fastify.log.error('Erro ao carregar progresso:', error);
            return reply.status(500).send({
                error: 'Falha ao carregar progresso',
                details: error.message
            });
        }
    });

    // ==================================================
    // ENDPOINT: GERAR AULA COMPLETA
    // ==================================================

    fastify.post('/generate/lesson-full', async (request, reply) => {
        try {
            const { tema, area, objectivos, preRequisitos, conteudoBase } = request.body;

            if (!tema || !area) {
                return reply.status(400).send({ error: 'Tema e area sao obrigatorios' });
            }

            const areaProfile = AREA_PROFILES[area] || AREA_PROFILES.TEC_ENFERMAGEM;

            // Definir instrucoes diferentes dependendo se ha conteudo base
            const conteudoInstrucoes = conteudoBase ? `
CONTEUDO FORNECIDO PELO USUARIO (OBRIGATORIO USAR NA INTEGRA):
${conteudoBase}

================ REGRA CRITICA - OBRIGATORIO SEGUIR ================
VOCE DEVE USAR TODO O CONTEUDO ACIMA SEM EXCLUIR, RESUMIR OU DIMINUIR NADA!

1. CADA informacao, conceito, definicao, exemplo e detalhe fornecido DEVE aparecer na aula
2. NAO omita NENHUMA parte do material fornecido pelo usuario
3. Crie TANTOS slides, blocos e flashcards quantos forem NECESSARIOS para cobrir TODO o conteudo
4. NAO resuma, NAO simplifique, NAO corte - use o conteudo COMPLETO e INTEGRAL
5. Se o conteudo for extenso, crie mais slides (10, 15, 20 ou mais se necessario)
6. Cada topico/secao do material deve ter seu proprio slide
7. Os flashcards devem cobrir TODOS os conceitos do material
8. O quiz deve testar pontos de TODO o conteudo fornecido
====================================================================
` : '';

            const prompt = `
${PROFESSOR_PROMPT}

TAREFA: Gerar aula digital COMPLETA sobre "${tema}"

AREA: ${areaProfile.nome}
OBJECTIVOS: ${objectivos?.join(', ') || 'Dominar os conceitos fundamentais'}
${conteudoInstrucoes}

ESTRUTURA A GERAR:
${conteudoBase ? `
1. TODOS os slides necessarios para cobrir TODO o conteudo (minimo 6, sem limite maximo)
2. Blocos conversacionais para CADA conceito do material (minimo 8)
3. Questoes de quiz cobrindo TODOS os topicos (minimo 3, mais se o conteudo for extenso)
4. Flashcards para CADA termo/conceito importante do material (minimo 8)
` : `
1. 6-10 slides com audio scripts
2. 8-12 blocos conversacionais
3. 3 questoes de quiz
4. 8-10 flashcards
`}

FORMATO DE SAIDA (JSON OBJECT):
{
  "titulo": "${tema}",
  "objectivoGeral": "Objectivo principal...",
  "objectivosEspecificos": ["obj1", "obj2", "obj3"],
  "slides": [
    {
      "titulo": "...",
      "conteudoPrincipal": "...",
      "pontosChave": [{"titulo": "...", "descricao": "..."}],
      "audioScript": "...",
      "duracaoAudioSegundos": 90,
      "conceito": "...",
      "relevanciaProva": "alta"
    }
  ],
  "blocos": [
    {
      "tipo": "introducao|explicacao|exemplo|aplicacao|resumo",
      "fala": "...",
      "perguntaAluno": null,
      "dicaContextual": null
    }
  ],
  "quiz": [
    {
      "enunciado": "...",
      "alternativas": [
        {"letra": "A", "texto": "..."},
        {"letra": "B", "texto": "..."},
        {"letra": "C", "texto": "..."},
        {"letra": "D", "texto": "..."}
      ],
      "correta": "B",
      "explicacao": "..."
    }
  ],
  "flashcards": [
    {
      "frente": "Pergunta ou termo",
      "verso": "Resposta",
      "prioridade": "alta|media|baixa"
    }
  ]
}

${conteudoBase ? 'LEMBRE-SE: Use TODO o conteudo fornecido! NAO resuma nem exclua nada!' : ''}
Retorna APENAS o JSON object.
`;

            const text = await generateWithAI(prompt);

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Formato de resposta invalido');
            }

            const aulaData = JSON.parse(jsonMatch[0]);

            const lessonId = `lesson-${Date.now()}`;

            const lesson = {
                id: lessonId,
                titulo: aulaData.titulo || tema,
                area: area,
                versao: '1.0.0',
                dataAtualizacao: new Date().toISOString().split('T')[0],
                autor: 'Sistema Angola Saude 2026',
                objectivoGeral: aulaData.objectivoGeral,
                objectivosEspecificos: aulaData.objectivosEspecificos || [],
                preRequisitos: preRequisitos || [],
                slides: (aulaData.slides || []).map((s, i) => ({
                    id: `slide-${lessonId}-${i}`,
                    ordem: i + 1,
                    ...s,
                    status: 'pending'
                })),
                aulaConversacional: {
                    estiloLinguagem: 'acessivel',
                    ritmoAdaptavel: true,
                    blocos: (aulaData.blocos || []).map((b, i) => ({
                        id: `bloco-${lessonId}-${i}`,
                        ordem: i + 1,
                        ...b
                    }))
                },
                miniQuiz: {
                    titulo: 'Verificacao Rapida',
                    descricao: `Teste os seus conhecimentos sobre ${tema}`,
                    pontuacaoMinima: 60,
                    questoes: (aulaData.quiz || []).map((q, i) => ({
                        id: `quiz-${lessonId}-${i}`,
                        ...q,
                        slideReferencia: `slide-${lessonId}-${Math.min(i, (aulaData.slides?.length || 1) - 1)}`
                    }))
                },
                flashcards: (aulaData.flashcards || []).map((f, i) => ({
                    id: `fc-${lessonId}-${i}`,
                    ...f,
                    slideOrigem: `slide-${lessonId}-${Math.min(i, (aulaData.slides?.length || 1) - 1)}`
                })),
                integracaoJogos: {
                    termosParaDecifrar: (aulaData.flashcards || [])
                        .slice(0, 5)
                        .map(f => f.frente?.toUpperCase().replace(/[?]/g, '') || '')
                },
                duracaoEstimadaMinutos: Math.ceil((aulaData.slides?.length || 6) * 3),
                numeroConceitos: aulaData.slides?.length || 6,
                tags: [tema.toLowerCase(), area, nivel || 'intermedio']
            };

            return { success: true, data: lesson };

        } catch (error) {
            fastify.log.error('Erro ao gerar aula completa:', error);
            return reply.status(500).send({
                error: 'Falha ao gerar aula completa',
                details: error.message
            });
        }
    });
}
