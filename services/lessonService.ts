/**
 * ==================================================
 * SERVICO DE GERACAO DE AULAS COM IA
 * Sistema de Aulas Digitais - Angola Saude 2026
 * ==================================================
 * 
 * Este servico integra com o backend para gerar
 * aulas digitais completas usando IA.
 */

import {
    DigitalLesson,
    LessonSlide,
    ConversationalBlock,
    MiniQuizQuestion,
    LessonFlashcard,
    ProfessionalArea,
    LessonLevel,
    GameIntegration
} from '../types/lesson';

import {
    buildLessonGenerationPrompt,
    buildTutorInteractionPrompt,
    buildQuizFeedbackPrompt
} from '../types/lessonPrompts';

// ==================================================
// CONFIGURACAO
// ==================================================

import { API_URL } from '../config/api';

const BACKEND_URL = API_URL;

const getHeaders = () => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || localStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return headers;
};

// ==================================================
// INTERFACE DE GERACAO
// ==================================================

export interface LessonGenerationRequest {
    tema: string;
    area: ProfessionalArea;
    nivel: LessonLevel;
    objectivos?: string[];
    preRequisitos?: string[];
    conteudoBase?: string; // Conteudo de referencia (ex: PDF importado)
}

export interface LessonGenerationProgress {
    step: string;
    progress: number; // 0-100
    message: string;
}

export type ProgressCallback = (progress: LessonGenerationProgress) => void;

// ==================================================
// FUNCOES DE GERACAO
// ==================================================

/**
 * Gera uma aula digital completa usando IA
 */
export const generateDigitalLesson = async (
    request: LessonGenerationRequest,
    onProgress?: ProgressCallback
): Promise<DigitalLesson> => {
    const { tema, area, nivel, objectivos = [], preRequisitos = [], conteudoBase = '' } = request;

    try {
        // Passo 1: Gerar estrutura base
        onProgress?.({
            step: 'estrutura',
            progress: 10,
            message: 'A criar estrutura da aula...'
        });

        const lessonId = `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Passo 2: Gerar slides
        onProgress?.({
            step: 'slides',
            progress: 25,
            message: 'A gerar slides inteligentes...'
        });

        const slides = await generateSlides(tema, area, nivel, conteudoBase);

        // Passo 3: Gerar audio scripts
        onProgress?.({
            step: 'audio',
            progress: 40,
            message: 'A criar scripts de audio...'
        });

        // Audio ja incluido na geracao de slides

        // Passo 4: Gerar aula conversacional
        onProgress?.({
            step: 'conversacional',
            progress: 55,
            message: 'A estruturar aula conversacional...'
        });

        const blocos = await generateConversationalBlocks(tema, area, slides);

        // Passo 5: Gerar quiz
        onProgress?.({
            step: 'quiz',
            progress: 70,
            message: 'A criar perguntas de avaliacao...'
        });

        const questoes = await generateQuizQuestions(tema, slides);

        // Passo 6: Gerar flashcards
        onProgress?.({
            step: 'flashcards',
            progress: 85,
            message: 'A gerar flashcards de revisao...'
        });

        const flashcards = await generateFlashcards(slides);

        // Passo 7: Gerar integracao com jogos
        onProgress?.({
            step: 'jogos',
            progress: 95,
            message: 'A preparar integracao com jogos...'
        });

        const integracaoJogos = await generateGameIntegration(tema, area);

        // Passo 8: Montar aula completa
        onProgress?.({
            step: 'finalizacao',
            progress: 100,
            message: 'A finalizar aula...'
        });

        const lesson: DigitalLesson = {
            id: lessonId,
            titulo: tema,
            area,
            nivel,
            versao: '1.0.0',
            dataAtualizacao: new Date().toISOString().split('T')[0],
            autor: 'Sistema Angola Saude 2026',
            objectivoGeral: objectivos[0] || `Compreender os conceitos fundamentais de ${tema}`,
            objectivosEspecificos: objectivos.length > 1 ? objectivos.slice(1) : [
                `Identificar os principais aspectos de ${tema}`,
                `Aplicar os conhecimentos em contexto pratico`,
                `Reconhecer situacoes relevantes para concursos`
            ],
            preRequisitos,
            slides,
            aulaConversacional: {
                estiloLinguagem: 'acessivel',
                ritmoAdaptavel: true,
                blocos
            },
            miniQuiz: {
                titulo: 'Verificacao Rapida',
                descricao: `Teste os seus conhecimentos sobre ${tema}`,
                pontuacaoMinima: 60,
                questoes
            },
            flashcards,
            integracaoJogos,
            duracaoEstimadaMinutos: Math.ceil(slides.length * 3), // ~3 min por slide
            numeroConceitos: slides.length,
            tags: [tema.toLowerCase(), area, nivel]
        };

        return lesson;

    } catch (error) {
        console.error('Erro ao gerar aula:', error);
        throw error;
    }
};

/**
 * Gera slides para a aula
 */
const generateSlides = async (
    tema: string,
    area: ProfessionalArea,
    nivel: LessonLevel,
    conteudoBase: string
): Promise<LessonSlide[]> => {
    try {
        const response = await fetch(`${BACKEND_URL}/generate/lesson-slides`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                tema,
                area,
                nivel,
                conteudoBase
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.data && Array.isArray(result.data)) {
                return result.data.map((slide: any, index: number) => ({
                    id: `slide-${Date.now()}-${index}`,
                    ordem: index + 1,
                    titulo: slide.titulo || `Slide ${index + 1}`,
                    conteudoPrincipal: slide.conteudoPrincipal || '',
                    pontosChave: slide.pontosChave || [],
                    audioScript: slide.audioScript || '',
                    duracaoAudioSegundos: slide.duracaoAudioSegundos || 90,
                    interacao: slide.interacao,
                    conceito: slide.conceito || '',
                    relevanciaProva: slide.relevanciaProva || 'media',
                    status: 'pending'
                }));
            }
        }
    } catch (error) {
        console.error('Erro ao gerar slides via backend:', error);
    }

    // Fallback: gerar slides basicos localmente
    return generateFallbackSlides(tema, nivel);
};

/**
 * Gera slides basicos (fallback)
 */
const generateFallbackSlides = (tema: string, nivel: LessonLevel): LessonSlide[] => {
    const baseSlides: LessonSlide[] = [
        {
            id: `slide-${Date.now()}-1`,
            ordem: 1,
            titulo: `Introducao: ${tema}`,
            conteudoPrincipal: `Nesta aula vamos explorar os conceitos fundamentais de **${tema}**.\n\nEste conhecimento e essencial para a preparacao para concursos na area da saude.`,
            pontosChave: [
                { titulo: 'Objectivo', descricao: 'Compreender os conceitos essenciais' },
                { titulo: 'Relevancia', descricao: 'Tema frequente em provas de concurso' }
            ],
            audioScript: `Bem-vindo a esta aula sobre ${tema}. Vamos explorar juntos os conceitos mais importantes para a tua preparacao.`,
            duracaoAudioSegundos: 60,
            conceito: `Introducao a ${tema}`,
            relevanciaProva: 'media',
            status: 'pending'
        },
        {
            id: `slide-${Date.now()}-2`,
            ordem: 2,
            titulo: 'Conceitos Fundamentais',
            conteudoPrincipal: `Os conceitos fundamentais de ${tema} incluem os principios basicos que orientam a pratica profissional.\n\nE importante dominar estes conceitos para responder correctamente as questoes de concurso.`,
            pontosChave: [
                { titulo: 'Definicao', descricao: 'Conceito basico e sua aplicacao' },
                { titulo: 'Importancia', descricao: 'Porque este tema e relevante' },
                { titulo: 'Aplicacao', descricao: 'Como usar na pratica' }
            ],
            audioScript: 'Vamos agora aos conceitos fundamentais. Presta atencao pois estes pontos aparecem frequentemente nas provas.',
            duracaoAudioSegundos: 90,
            conceito: 'Conceitos basicos',
            relevanciaProva: 'alta',
            status: 'pending'
        },
        {
            id: `slide-${Date.now()}-3`,
            ordem: 3,
            titulo: 'Aplicacao Pratica',
            conteudoPrincipal: 'A aplicacao pratica dos conceitos aprendidos e fundamental para fixar o conhecimento.\n\nNas provas de concurso, muitas questoes apresentam cenarios praticos que exigem a aplicacao destes conceitos.',
            pontosChave: [
                { titulo: 'Cenarios', descricao: 'Situacoes praticas comuns' },
                { titulo: 'Decisoes', descricao: 'Como tomar decisoes correctas' }
            ],
            audioScript: 'Agora vamos ver como aplicar estes conceitos na pratica, o que e essencial para as questoes de concurso.',
            duracaoAudioSegundos: 90,
            interacao: {
                tipo: 'aplicacao',
                pergunta: `Como aplicarias este conhecimento numa situacao real?`
            },
            conceito: 'Aplicacao pratica',
            relevanciaProva: 'alta',
            status: 'pending'
        },
        {
            id: `slide-${Date.now()}-4`,
            ordem: 4,
            titulo: 'Resumo e Pontos-Chave',
            conteudoPrincipal: `Nesta aula exploramos os conceitos fundamentais de ${tema}.\n\nLembra-te de revisar os pontos-chave e praticar com as questoes do quiz.`,
            pontosChave: [
                { titulo: 'Revise', descricao: 'Os conceitos principais' },
                { titulo: 'Pratique', descricao: 'Com as questoes do quiz' },
                { titulo: 'Memorize', descricao: 'Os flashcards essenciais' }
            ],
            audioScript: 'Chegamos ao fim desta aula. Vamos resumir os pontos mais importantes que deves memorizar para a prova.',
            duracaoAudioSegundos: 75,
            conceito: 'Resumo da aula',
            relevanciaProva: 'alta',
            status: 'pending'
        }
    ];

    return baseSlides;
};

/**
 * Gera blocos conversacionais
 */
const generateConversationalBlocks = async (
    tema: string,
    area: ProfessionalArea,
    slides: LessonSlide[]
): Promise<ConversationalBlock[]> => {
    try {
        const response = await fetch(`${BACKEND_URL}/generate/lesson-conversation`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                tema,
                area,
                slidesContext: slides.map(s => s.conceito).join(', ')
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.data && Array.isArray(result.data)) {
                return result.data.map((bloco: any, index: number) => ({
                    id: `bloco-${Date.now()}-${index}`,
                    ordem: index + 1,
                    tipo: bloco.tipo || 'explicacao',
                    fala: bloco.fala || '',
                    perguntaAluno: bloco.perguntaAluno,
                    pausaReflexao: bloco.pausaReflexao,
                    dicaContextual: bloco.dicaContextual
                }));
            }
        }
    } catch (error) {
        console.error('Erro ao gerar blocos conversacionais:', error);
    }

    // Fallback
    return generateFallbackBlocks(tema, slides);
};

/**
 * Gera blocos conversacionais (fallback)
 */
const generateFallbackBlocks = (tema: string, slides: LessonSlide[]): ConversationalBlock[] => {
    return [
        {
            id: `bloco-${Date.now()}-1`,
            ordem: 1,
            tipo: 'introducao',
            fala: `Hoje vamos explorar ${tema}. Este e um tema importante para a preparacao para concursos na area da saude.`,
            pausaReflexao: 2
        },
        {
            id: `bloco-${Date.now()}-2`,
            ordem: 2,
            tipo: 'explicacao',
            fala: `Vamos comecar pelos conceitos basicos. E fundamental que compreendas bem estes pontos antes de avancarmos.`,
            dicaContextual: 'Presta atencao aos termos tecnicos.'
        },
        {
            id: `bloco-${Date.now()}-3`,
            ordem: 3,
            tipo: 'exemplo',
            fala: `Vou dar-te um exemplo pratico para que possas visualizar como estes conceitos se aplicam no dia-a-dia profissional.`,
            perguntaAluno: 'Consegues pensar noutras situacoes onde isto se aplica?'
        },
        {
            id: `bloco-${Date.now()}-4`,
            ordem: 4,
            tipo: 'aplicacao',
            fala: `Agora quero que penses numa situacao de prova. Como responderias a uma questao sobre este tema?`,
            perguntaAluno: 'Qual seria a tua abordagem?',
            pausaReflexao: 5
        },
        {
            id: `bloco-${Date.now()}-5`,
            ordem: 5,
            tipo: 'resumo',
            fala: `Para resumir: hoje vimos os conceitos fundamentais de ${tema}. Lembra-te dos pontos-chave e pratica com o quiz.`,
            dicaContextual: 'Revisa os flashcards para memorizar melhor.'
        }
    ];
};

/**
 * Gera questoes do quiz
 */
const generateQuizQuestions = async (
    tema: string,
    slides: LessonSlide[]
): Promise<MiniQuizQuestion[]> => {
    try {
        const response = await fetch(`${BACKEND_URL}/generate/lesson-quiz`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                tema,
                conceitos: slides.map(s => s.conceito)
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.data && Array.isArray(result.data)) {
                return result.data.slice(0, 3).map((q: any, index: number) => ({
                    id: `quiz-${Date.now()}-${index}`,
                    enunciado: q.enunciado || q.question || '',
                    alternativas: q.alternativas || q.options?.map((opt: string, i: number) => ({
                        letra: String.fromCharCode(65 + i),
                        texto: opt
                    })) || [],
                    correta: q.correta || q.correctAnswer || 'A',
                    explicacao: q.explicacao || q.explanation || '',
                    slideReferencia: slides[Math.min(index, slides.length - 1)]?.id || ''
                }));
            }
        }
    } catch (error) {
        console.error('Erro ao gerar quiz:', error);
    }

    // Fallback
    return [{
        id: `quiz-${Date.now()}-1`,
        enunciado: `Qual dos seguintes conceitos esta relacionado com ${tema}?`,
        alternativas: [
            { letra: 'A', texto: 'Conceito A relacionado ao tema' },
            { letra: 'B', texto: 'Conceito B nao relacionado' },
            { letra: 'C', texto: 'Conceito C nao relacionado' },
            { letra: 'D', texto: 'Conceito D nao relacionado' }
        ],
        correta: 'A',
        explicacao: `A opcao A esta correcta porque esta directamente relacionada com os conceitos de ${tema} apresentados na aula.`,
        slideReferencia: slides[0]?.id || ''
    }];
};

/**
 * Gera flashcards
 */
const generateFlashcards = async (slides: LessonSlide[]): Promise<LessonFlashcard[]> => {
    const flashcards: LessonFlashcard[] = [];

    slides.forEach((slide, index) => {
        // Criar flashcard para cada conceito
        if (slide.conceito) {
            flashcards.push({
                id: `fc-${Date.now()}-${index}`,
                frente: `O que e ${slide.titulo}?`,
                verso: slide.conceito,
                slideOrigem: slide.id,
                prioridade: slide.relevanciaProva === 'alta' ? 'alta' : 'media'
            });
        }

        // Criar flashcards para pontos-chave
        slide.pontosChave.forEach((ponto, pIndex) => {
            flashcards.push({
                id: `fc-${Date.now()}-${index}-${pIndex}`,
                frente: ponto.titulo,
                verso: ponto.descricao,
                slideOrigem: slide.id,
                prioridade: 'media'
            });
        });
    });

    return flashcards.slice(0, 10); // Limitar a 10 flashcards
};

/**
 * Gera integracao com jogos
 */
const generateGameIntegration = async (
    tema: string,
    area: ProfessionalArea
): Promise<GameIntegration> => {
    // Extrair termos para o jogo de decifrar
    const termosComuns: Record<ProfessionalArea, string[]> = {
        medicina: ['DIAGNOSTICO', 'TRATAMENTO', 'PROGNOSTICO', 'SINTOMA', 'SINAL'],
        enfermagem: ['CUIDADO', 'ASSISTENCIA', 'PROCESSO', 'AVALIACAO', 'INTERVENCAO'],
        tecnico_enfermagem: ['PROCEDIMENTO', 'HIGIENE', 'SINAISVITAIS', 'MEDICACAO', 'PACIENTE'],
        tecnico_farmacia: ['FARMACO', 'DOSAGEM', 'DISPENSACAO', 'INTERACAO', 'EFEITO'],
        analises_clinicas: ['AMOSTRA', 'RESULTADO', 'REFERENCIA', 'COLHEITA', 'ANALISE']
    };

    return {
        termosParaDecifrar: termosComuns[area] || termosComuns.tecnico_enfermagem,
        cenarioSimulacao: `Cenario pratico relacionado com ${tema} para aplicacao dos conhecimentos aprendidos.`
    };
};

// ==================================================
// FUNCOES DE INTERACAO COM TUTOR
// ==================================================

/**
 * Cria sessao de tutor para a aula
 */
export const createLessonTutorSession = (lesson: DigitalLesson) => {
    return {
        sendMessage: async (message: string, currentSlideIndex: number): Promise<string> => {
            const currentSlide = lesson.slides[currentSlideIndex];
            const context = `
        Aula: ${lesson.titulo}
        Area: ${lesson.area}
        Slide Actual: ${currentSlide?.titulo || 'N/A'}
        Conceito: ${currentSlide?.conceito || 'N/A'}
      `;

            try {
                const response = await fetch(`${BACKEND_URL}/correct`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        question: message,
                        userAnswer: 'Preciso de ajuda',
                        topic: context
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.feedback || 'Nao consegui processar a tua pergunta.';
                }
            } catch (error) {
                console.error('Erro no tutor:', error);
            }

            return `Obrigado pela tua pergunta sobre "${currentSlide?.titulo || lesson.titulo}". 
      Este conceito e importante para a preparacao para concursos. 
      Revisa os pontos-chave do slide actual para encontrar a resposta.`;
        }
    };
};

/**
 * Gera feedback para resposta do quiz
 */
export const generateQuizFeedback = async (
    questao: MiniQuizQuestion,
    respostaAluno: string,
    acertou: boolean
): Promise<string> => {
    try {
        const response = await fetch(`${BACKEND_URL}/generate/quiz-feedback`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                questao: questao.enunciado,
                respostaAluno,
                respostaCorrecta: questao.correta,
                acertou,
                explicacao: questao.explicacao
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data.feedback;
        }
    } catch (error) {
        console.error('Erro ao gerar feedback:', error);
    }

    // Fallback
    if (acertou) {
        return `Correcto! ${questao.explicacao}`;
    } else {
        return `A resposta correcta e "${questao.correta}". ${questao.explicacao}`;
    }
};

// ==================================================
// FUNCOES DE PERSISTENCIA
// ==================================================

/**
 * Guarda progresso da aula
 */
export const saveLessonProgress = async (
    lessonId: string,
    progress: any
): Promise<boolean> => {
    try {
        // Guardar localmente
        localStorage.setItem(`lesson-progress-${lessonId}`, JSON.stringify(progress));

        // Tentar sincronizar com backend
        const response = await fetch(`${BACKEND_URL}/lessons/${lessonId}/progress`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(progress)
        });

        return response.ok;
    } catch (error) {
        console.error('Erro ao guardar progresso:', error);
        return false;
    }
};

/**
 * Carrega progresso da aula
 */
export const loadLessonProgress = async (lessonId: string): Promise<any | null> => {
    try {
        // Tentar carregar do backend
        const response = await fetch(`${BACKEND_URL}/lessons/${lessonId}/progress`, {
            headers: getHeaders()
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Erro ao carregar progresso do backend:', error);
    }

    // Fallback: carregar do localStorage
    const local = localStorage.getItem(`lesson-progress-${lessonId}`);
    return local ? JSON.parse(local) : null;
};
