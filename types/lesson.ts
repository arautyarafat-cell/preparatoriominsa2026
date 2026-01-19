/**
 * ==================================================
 * SISTEMA DE AULAS DIGITAIS - ESTRUTURA DE DADOS
 * Angola Saude 2026 - Preparacao para Concursos
 * ==================================================
 * 
 * Este ficheiro define toda a estrutura de dados para
 * o sistema de aulas digitais sem video.
 */

// ==================================================
// BLOCO 7 - ESTRUTURA DE DADOS (JSON)
// ==================================================

/**
 * Nivel de dificuldade da aula
 */
export type LessonLevel = 'basico' | 'intermedio' | 'avancado';

/**
 * Area profissional
 */
export type ProfessionalArea =
    | 'medicina'
    | 'enfermagem'
    | 'tecnico_enfermagem'
    | 'tecnico_farmacia'
    | 'analises_clinicas';

/**
 * Estado do slide na sessao
 */
export type SlideStatus = 'pending' | 'viewed' | 'completed';

/**
 * Tipo de interacao no slide
 */
export type InteractionType =
    | 'reflexao'     // Pergunta reflexiva ao aluno
    | 'verificacao'  // Mini-quiz de verificacao
    | 'aplicacao'    // Cenario de aplicacao pratica
    | 'conexao';     // Conexao com conteudo anterior

/**
 * Estrutura de uma interacao no slide
 */
export interface SlideInteraction {
    tipo: InteractionType;
    pergunta: string;
    respostaEsperada?: string;
    dicaContextual?: string;
}

/**
 * Estrutura de um ponto-chave
 */
export interface KeyPoint {
    titulo: string;
    descricao: string;
    icone?: string;
}

/**
 * Estrutura de um slide inteligente
 */
export interface LessonSlide {
    id: string;
    ordem: number;
    titulo: string;

    // Conteudo visual (texto curto, focado)
    conteudoPrincipal: string;
    pontosChave: KeyPoint[];

    // Audio explicativo (nao le texto, explica com exemplos)
    audioScript: string;
    duracaoAudioSegundos: number;

    // Interacao conversacional
    interacao?: SlideInteraction;

    // Metadados
    conceito: string;
    relevanciaProva: 'alta' | 'media' | 'baixa';
    status: SlideStatus;
}

/**
 * Estrutura de uma alternativa do mini-quiz
 */
export interface QuizAlternative {
    letra: string;
    texto: string;
}

/**
 * Estrutura de uma pergunta do mini-quiz
 */
export interface MiniQuizQuestion {
    id: string;
    enunciado: string;
    alternativas: QuizAlternative[];
    correta: string;
    explicacao: string;
    slideReferencia: string;
}

/**
 * Estrutura do mini-quiz da aula
 */
export interface LessonMiniQuiz {
    titulo: string;
    descricao: string;
    questoes: MiniQuizQuestion[];
    tempoLimiteSegundos?: number;
    pontuacaoMinima: number; // Percentagem minima para aprovar
}

/**
 * Estrutura de um flashcard da aula
 */
export interface LessonFlashcard {
    id: string;
    frente: string;
    verso: string;
    slideOrigem: string;
    prioridade: 'alta' | 'media' | 'baixa';
}

/**
 * Estrutura de integracao com jogos
 */
export interface GameIntegration {
    casoClinicoRelacionado?: string;
    termosParaDecifrar: string[];
    cenarioSimulacao?: string;
}

/**
 * Estrutura de bloco conversacional
 */
export interface ConversationalBlock {
    id: string;
    ordem: number;
    tipo: 'introducao' | 'explicacao' | 'exemplo' | 'aplicacao' | 'resumo';

    // Texto do professor
    fala: string;

    // Pergunta ao aluno (opcional)
    perguntaAluno?: string;

    // Pausa para reflexao (segundos)
    pausaReflexao?: number;

    // Dica contextual
    dicaContextual?: string;
}

/**
 * Estrutura da aula conversacional
 */
export interface ConversationalLesson {
    blocos: ConversationalBlock[];
    estiloLinguagem: 'formal' | 'acessivel' | 'tecnico';
    ritmoAdaptavel: boolean;
}

/**
 * Estrutura completa de uma aula digital
 */
export interface DigitalLesson {
    // Identificacao
    id: string;
    titulo: string;
    area: ProfessionalArea | string; // Allow backend values like 'TEC_ENFERMAGEM'
    nivel: LessonLevel;
    categoria?: string; // Add categoria field from DB

    // Metadados
    versao: string;
    dataAtualizacao: string;
    autor: string;

    // Objectivos
    objectivoGeral: string;
    objectivosEspecificos: string[];

    // Pre-requisitos
    preRequisitos: string[];

    // Conteudo
    slides: LessonSlide[];
    aulaConversacional: ConversationalLesson;

    // Avaliacao
    miniQuiz: LessonMiniQuiz;

    // Integracao
    flashcards: LessonFlashcard[];
    integracaoJogos: GameIntegration;

    // Materiais complementares (IDs dos materiais)
    materiaisComplementares?: string[];
    materiais_complementares?: string[]; // snake_case do banco

    // Estatisticas
    duracaoEstimadaMinutos: number;
    numeroConceitos: number;

    // Tags para busca
    tags: string[];
}

/**
 * Estado de progresso do aluno na aula
 */
export interface LessonProgress {
    lessonId: string;
    userId: string;

    // Progresso nos slides
    slideAtual: number;
    slidesCompletados: string[];

    // Tempo
    tempoTotalSegundos: number;
    ultimoAcesso: string;

    // Avaliacao
    quizRespondido: boolean;
    quizPontuacao?: number;
    respostasQuiz?: Record<string, string>;

    // Interacoes
    interacoesCompletadas: string[];

    // Status geral
    concluida: boolean;
    dataConclusao?: string;
}

/**
 * Estrutura do modulo de aulas
 */
export interface LessonModule {
    id: string;
    titulo: string;
    descricao: string;
    area: ProfessionalArea;
    nivel: LessonLevel;

    aulas: DigitalLesson[];

    ordem: number;
    icone: string;
    cor: string;

    // Progresso
    totalAulas: number;
    aulasDisponiveis: number;
}

/**
 * Configuracao do sistema de aulas
 */
export interface LessonSystemConfig {
    maxSlidesPerLesson: number;
    maxAudioDurationSeconds: number;
    minQuizQuestions: number;
    maxQuizQuestions: number;
    defaultLanguage: 'pt-PT' | 'pt-BR' | 'pt-AO';
    enableAudioPlayback: boolean;
    enableProgressTracking: boolean;
}

// ==================================================
// CONSTANTES DO SISTEMA
// ==================================================

export const LESSON_SYSTEM_CONFIG: LessonSystemConfig = {
    maxSlidesPerLesson: 10,
    maxAudioDurationSeconds: 120, // 2 minutos
    minQuizQuestions: 1,
    maxQuizQuestions: 3,
    defaultLanguage: 'pt-PT',
    enableAudioPlayback: true,
    enableProgressTracking: true
};

export const PROFESSIONAL_AREAS: Record<ProfessionalArea, string> = {
    medicina: 'Medicina',
    enfermagem: 'Licenciatura em Enfermagem',
    tecnico_enfermagem: 'Tecnico de Enfermagem',
    tecnico_farmacia: 'Tecnico de Farmacia',
    analises_clinicas: 'Analises Clinicas'
};

export const LESSON_LEVELS: Record<LessonLevel, { titulo: string; cor: string }> = {
    basico: { titulo: 'Basico', cor: 'bg-green-500' },
    intermedio: { titulo: 'Intermedio', cor: 'bg-yellow-500' },
    avancado: { titulo: 'Avancado', cor: 'bg-red-500' }
};
