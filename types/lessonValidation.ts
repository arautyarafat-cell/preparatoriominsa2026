/**
 * ==================================================
 * REGRAS DE QUALIDADE E CONTROLO DE ERROS
 * Sistema de Aulas Digitais - Angola Saude 2026
 * ==================================================
 * 
 * BLOCO 9 - REGRAS DE QUALIDADE
 * 
 * Este ficheiro define todas as regras de validacao,
 * controlo de qualidade e tratamento de erros para
 * o sistema de aulas digitais.
 */

import {
    DigitalLesson,
    LessonSlide,
    MiniQuizQuestion,
    ConversationalBlock,
    LessonFlashcard,
    LESSON_SYSTEM_CONFIG
} from './lesson';

// ==================================================
// TIPOS DE VALIDACAO
// ==================================================

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    score: number; // 0-100
}

export interface ValidationError {
    code: string;
    message: string;
    field: string;
    severity: 'critical' | 'high' | 'medium';
}

export interface ValidationWarning {
    code: string;
    message: string;
    field: string;
    suggestion: string;
}

// ==================================================
// CONSTANTES DE VALIDACAO
// ==================================================

export const VALIDATION_RULES = {
    // Slides
    MIN_SLIDES: 5,
    MAX_SLIDES: LESSON_SYSTEM_CONFIG.maxSlidesPerLesson,
    MAX_SLIDE_TITLE_LENGTH: 60,
    MAX_SLIDE_CONTENT_WORDS: 150,
    MAX_POINTS_PER_SLIDE: 4,
    MIN_POINTS_PER_SLIDE: 2,

    // Audio
    MIN_AUDIO_DURATION: 60,  // 1 minuto
    MAX_AUDIO_DURATION: LESSON_SYSTEM_CONFIG.maxAudioDurationSeconds,

    // Quiz
    MIN_QUIZ_QUESTIONS: LESSON_SYSTEM_CONFIG.minQuizQuestions,
    MAX_QUIZ_QUESTIONS: LESSON_SYSTEM_CONFIG.maxQuizQuestions,
    REQUIRED_OPTIONS_PER_QUESTION: 4,

    // Aula Conversacional
    MIN_BLOCKS: 5,
    MAX_BLOCKS: 15,
    MAX_BLOCK_WORDS: 100,

    // Flashcards
    MIN_FLASHCARDS: 5,
    MAX_FLASHCARD_FRONT_LENGTH: 100,
    MAX_FLASHCARD_BACK_LENGTH: 200,

    // Geral
    REQUIRED_OBJECTIVES: 3,
    MAX_TITLE_LENGTH: 80
};

// ==================================================
// FUNCOES DE VALIDACAO
// ==================================================

/**
 * Valida uma aula completa
 */
export const validateLesson = (lesson: DigitalLesson): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Validar identificacao
    validateIdentification(lesson, errors, warnings);

    // 2. Validar objectivos
    validateObjectives(lesson, errors, warnings);

    // 3. Validar slides
    validateSlides(lesson.slides, errors, warnings);

    // 4. Validar aula conversacional
    validateConversationalLesson(lesson.aulaConversacional.blocos, errors, warnings);

    // 5. Validar quiz
    validateQuiz(lesson.miniQuiz.questoes, errors, warnings);

    // 6. Validar flashcards
    validateFlashcards(lesson.flashcards, errors, warnings);

    // Calcular score
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const highErrors = errors.filter(e => e.severity === 'high').length;
    const mediumErrors = errors.filter(e => e.severity === 'medium').length;

    const score = Math.max(0, 100 - (criticalErrors * 30) - (highErrors * 15) - (mediumErrors * 5) - (warnings.length * 2));

    return {
        isValid: criticalErrors === 0 && highErrors === 0,
        errors,
        warnings,
        score
    };
};

/**
 * Valida identificacao da aula
 */
const validateIdentification = (
    lesson: DigitalLesson,
    errors: ValidationError[],
    warnings: ValidationWarning[]
): void => {
    // Titulo
    if (!lesson.titulo || lesson.titulo.trim().length === 0) {
        errors.push({
            code: 'ID_001',
            message: 'Titulo da aula e obrigatorio',
            field: 'titulo',
            severity: 'critical'
        });
    } else if (lesson.titulo.length > VALIDATION_RULES.MAX_TITLE_LENGTH) {
        warnings.push({
            code: 'ID_W001',
            message: `Titulo excede ${VALIDATION_RULES.MAX_TITLE_LENGTH} caracteres`,
            field: 'titulo',
            suggestion: 'Reduza o titulo para melhor visualizacao em dispositivos moveis'
        });
    }

    // Area
    if (!lesson.area) {
        errors.push({
            code: 'ID_002',
            message: 'Area profissional e obrigatoria',
            field: 'area',
            severity: 'critical'
        });
    }

    // Nivel
    if (!lesson.nivel) {
        errors.push({
            code: 'ID_003',
            message: 'Nivel da aula e obrigatorio',
            field: 'nivel',
            severity: 'high'
        });
    }
};

/**
 * Valida objectivos da aula
 */
const validateObjectives = (
    lesson: DigitalLesson,
    errors: ValidationError[],
    warnings: ValidationWarning[]
): void => {
    if (!lesson.objectivoGeral || lesson.objectivoGeral.trim().length === 0) {
        errors.push({
            code: 'OBJ_001',
            message: 'Objectivo geral e obrigatorio',
            field: 'objectivoGeral',
            severity: 'high'
        });
    }

    if (!lesson.objectivosEspecificos || lesson.objectivosEspecificos.length < VALIDATION_RULES.REQUIRED_OBJECTIVES) {
        warnings.push({
            code: 'OBJ_W001',
            message: `Recomendado ter pelo menos ${VALIDATION_RULES.REQUIRED_OBJECTIVES} objectivos especificos`,
            field: 'objectivosEspecificos',
            suggestion: 'Adicione mais objectivos para clarificar as metas de aprendizagem'
        });
    }
};

/**
 * Valida slides
 */
const validateSlides = (
    slides: LessonSlide[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
): void => {
    // Quantidade de slides
    if (slides.length < VALIDATION_RULES.MIN_SLIDES) {
        errors.push({
            code: 'SLD_001',
            message: `Minimo de ${VALIDATION_RULES.MIN_SLIDES} slides e obrigatorio`,
            field: 'slides',
            severity: 'high'
        });
    }

    if (slides.length > VALIDATION_RULES.MAX_SLIDES) {
        warnings.push({
            code: 'SLD_W001',
            message: `Aula com mais de ${VALIDATION_RULES.MAX_SLIDES} slides pode ser muito longa`,
            field: 'slides',
            suggestion: 'Considere dividir em multiplas aulas'
        });
    }

    // Validar cada slide
    slides.forEach((slide, index) => {
        // Titulo do slide
        if (!slide.titulo || slide.titulo.trim().length === 0) {
            errors.push({
                code: 'SLD_002',
                message: `Slide ${index + 1}: Titulo e obrigatorio`,
                field: `slides[${index}].titulo`,
                severity: 'high'
            });
        } else if (slide.titulo.length > VALIDATION_RULES.MAX_SLIDE_TITLE_LENGTH) {
            warnings.push({
                code: 'SLD_W002',
                message: `Slide ${index + 1}: Titulo muito longo`,
                field: `slides[${index}].titulo`,
                suggestion: `Reduza para ${VALIDATION_RULES.MAX_SLIDE_TITLE_LENGTH} caracteres`
            });
        }

        // Conteudo principal
        if (!slide.conteudoPrincipal || slide.conteudoPrincipal.trim().length === 0) {
            errors.push({
                code: 'SLD_003',
                message: `Slide ${index + 1}: Conteudo principal e obrigatorio`,
                field: `slides[${index}].conteudoPrincipal`,
                severity: 'high'
            });
        } else {
            const wordCount = slide.conteudoPrincipal.split(/\s+/).length;
            if (wordCount > VALIDATION_RULES.MAX_SLIDE_CONTENT_WORDS) {
                warnings.push({
                    code: 'SLD_W003',
                    message: `Slide ${index + 1}: Conteudo com ${wordCount} palavras (max: ${VALIDATION_RULES.MAX_SLIDE_CONTENT_WORDS})`,
                    field: `slides[${index}].conteudoPrincipal`,
                    suggestion: 'Reduza o texto para manter o slide focado em um conceito'
                });
            }
        }

        // Pontos-chave
        if (!slide.pontosChave || slide.pontosChave.length < VALIDATION_RULES.MIN_POINTS_PER_SLIDE) {
            warnings.push({
                code: 'SLD_W004',
                message: `Slide ${index + 1}: Adicione pelo menos ${VALIDATION_RULES.MIN_POINTS_PER_SLIDE} pontos-chave`,
                field: `slides[${index}].pontosChave`,
                suggestion: 'Pontos-chave ajudam na memorizacao'
            });
        }

        // Audio script
        if (!slide.audioScript || slide.audioScript.trim().length === 0) {
            errors.push({
                code: 'SLD_004',
                message: `Slide ${index + 1}: Script de audio e obrigatorio`,
                field: `slides[${index}].audioScript`,
                severity: 'medium'
            });
        }

        // Duracao do audio
        if (slide.duracaoAudioSegundos < VALIDATION_RULES.MIN_AUDIO_DURATION) {
            warnings.push({
                code: 'SLD_W005',
                message: `Slide ${index + 1}: Audio muito curto (${slide.duracaoAudioSegundos}s)`,
                field: `slides[${index}].duracaoAudioSegundos`,
                suggestion: `Minimo recomendado: ${VALIDATION_RULES.MIN_AUDIO_DURATION}s`
            });
        }

        if (slide.duracaoAudioSegundos > VALIDATION_RULES.MAX_AUDIO_DURATION) {
            warnings.push({
                code: 'SLD_W006',
                message: `Slide ${index + 1}: Audio muito longo (${slide.duracaoAudioSegundos}s)`,
                field: `slides[${index}].duracaoAudioSegundos`,
                suggestion: `Maximo recomendado: ${VALIDATION_RULES.MAX_AUDIO_DURATION}s`
            });
        }

        // Conceito
        if (!slide.conceito || slide.conceito.trim().length === 0) {
            warnings.push({
                code: 'SLD_W007',
                message: `Slide ${index + 1}: Defina o conceito central`,
                field: `slides[${index}].conceito`,
                suggestion: 'O conceito central ajuda na revisao'
            });
        }
    });
};

/**
 * Valida aula conversacional
 */
const validateConversationalLesson = (
    blocos: ConversationalBlock[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
): void => {
    if (blocos.length < VALIDATION_RULES.MIN_BLOCKS) {
        errors.push({
            code: 'CONV_001',
            message: `Minimo de ${VALIDATION_RULES.MIN_BLOCKS} blocos conversacionais`,
            field: 'aulaConversacional.blocos',
            severity: 'medium'
        });
    }

    if (blocos.length > VALIDATION_RULES.MAX_BLOCKS) {
        warnings.push({
            code: 'CONV_W001',
            message: 'Aula conversacional muito longa',
            field: 'aulaConversacional.blocos',
            suggestion: `Reduza para ${VALIDATION_RULES.MAX_BLOCKS} blocos`
        });
    }

    // Verificar tipos de blocos
    const tipos = blocos.map(b => b.tipo);

    if (!tipos.includes('introducao')) {
        warnings.push({
            code: 'CONV_W002',
            message: 'Falta bloco de introducao',
            field: 'aulaConversacional.blocos',
            suggestion: 'Inicie a aula com uma introducao contextual'
        });
    }

    if (!tipos.includes('resumo')) {
        warnings.push({
            code: 'CONV_W003',
            message: 'Falta bloco de resumo',
            field: 'aulaConversacional.blocos',
            suggestion: 'Termine com um resumo dos pontos principais'
        });
    }

    // Verificar interactividade
    const blocosComPergunta = blocos.filter(b => b.perguntaAluno).length;
    if (blocosComPergunta < 2) {
        warnings.push({
            code: 'CONV_W004',
            message: 'Poucas perguntas ao aluno',
            field: 'aulaConversacional.blocos',
            suggestion: 'Adicione mais perguntas para manter o aluno engajado'
        });
    }

    // Validar cada bloco
    blocos.forEach((bloco, index) => {
        if (!bloco.fala || bloco.fala.trim().length === 0) {
            errors.push({
                code: 'CONV_002',
                message: `Bloco ${index + 1}: Texto da fala e obrigatorio`,
                field: `aulaConversacional.blocos[${index}].fala`,
                severity: 'high'
            });
        } else {
            const wordCount = bloco.fala.split(/\s+/).length;
            if (wordCount > VALIDATION_RULES.MAX_BLOCK_WORDS) {
                warnings.push({
                    code: 'CONV_W005',
                    message: `Bloco ${index + 1}: Texto muito longo (${wordCount} palavras)`,
                    field: `aulaConversacional.blocos[${index}].fala`,
                    suggestion: `Reduza para ${VALIDATION_RULES.MAX_BLOCK_WORDS} palavras`
                });
            }
        }
    });
};

/**
 * Valida quiz
 */
const validateQuiz = (
    questoes: MiniQuizQuestion[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
): void => {
    if (questoes.length < VALIDATION_RULES.MIN_QUIZ_QUESTIONS) {
        errors.push({
            code: 'QUIZ_001',
            message: `Minimo de ${VALIDATION_RULES.MIN_QUIZ_QUESTIONS} questao no quiz`,
            field: 'miniQuiz.questoes',
            severity: 'high'
        });
    }

    if (questoes.length > VALIDATION_RULES.MAX_QUIZ_QUESTIONS) {
        warnings.push({
            code: 'QUIZ_W001',
            message: `Quiz com mais de ${VALIDATION_RULES.MAX_QUIZ_QUESTIONS} questoes`,
            field: 'miniQuiz.questoes',
            suggestion: 'Mantenha o quiz breve para verificacao rapida'
        });
    }

    questoes.forEach((questao, index) => {
        // Enunciado
        if (!questao.enunciado || questao.enunciado.trim().length === 0) {
            errors.push({
                code: 'QUIZ_002',
                message: `Questao ${index + 1}: Enunciado e obrigatorio`,
                field: `miniQuiz.questoes[${index}].enunciado`,
                severity: 'critical'
            });
        }

        // Alternativas
        if (!questao.alternativas || questao.alternativas.length !== VALIDATION_RULES.REQUIRED_OPTIONS_PER_QUESTION) {
            errors.push({
                code: 'QUIZ_003',
                message: `Questao ${index + 1}: Deve ter exactamente ${VALIDATION_RULES.REQUIRED_OPTIONS_PER_QUESTION} alternativas`,
                field: `miniQuiz.questoes[${index}].alternativas`,
                severity: 'critical'
            });
        }

        // Resposta correcta
        if (!questao.correta) {
            errors.push({
                code: 'QUIZ_004',
                message: `Questao ${index + 1}: Resposta correcta e obrigatoria`,
                field: `miniQuiz.questoes[${index}].correta`,
                severity: 'critical'
            });
        } else {
            const letrasValidas = questao.alternativas?.map(a => a.letra) || [];
            if (!letrasValidas.includes(questao.correta)) {
                errors.push({
                    code: 'QUIZ_005',
                    message: `Questao ${index + 1}: Resposta correcta "${questao.correta}" nao corresponde a nenhuma alternativa`,
                    field: `miniQuiz.questoes[${index}].correta`,
                    severity: 'critical'
                });
            }
        }

        // Explicacao
        if (!questao.explicacao || questao.explicacao.trim().length === 0) {
            warnings.push({
                code: 'QUIZ_W002',
                message: `Questao ${index + 1}: Adicione uma explicacao`,
                field: `miniQuiz.questoes[${index}].explicacao`,
                suggestion: 'Explicacoes ajudam o aluno a aprender com os erros'
            });
        }
    });
};

/**
 * Valida flashcards
 */
const validateFlashcards = (
    flashcards: LessonFlashcard[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
): void => {
    if (flashcards.length < VALIDATION_RULES.MIN_FLASHCARDS) {
        warnings.push({
            code: 'FC_W001',
            message: `Recomendado ter pelo menos ${VALIDATION_RULES.MIN_FLASHCARDS} flashcards`,
            field: 'flashcards',
            suggestion: 'Flashcards ajudam na memorizacao'
        });
    }

    flashcards.forEach((card, index) => {
        // Frente
        if (!card.frente || card.frente.trim().length === 0) {
            errors.push({
                code: 'FC_001',
                message: `Flashcard ${index + 1}: Frente e obrigatoria`,
                field: `flashcards[${index}].frente`,
                severity: 'medium'
            });
        } else if (card.frente.length > VALIDATION_RULES.MAX_FLASHCARD_FRONT_LENGTH) {
            warnings.push({
                code: 'FC_W002',
                message: `Flashcard ${index + 1}: Frente muito longa`,
                field: `flashcards[${index}].frente`,
                suggestion: `Reduza para ${VALIDATION_RULES.MAX_FLASHCARD_FRONT_LENGTH} caracteres`
            });
        }

        // Verso
        if (!card.verso || card.verso.trim().length === 0) {
            errors.push({
                code: 'FC_002',
                message: `Flashcard ${index + 1}: Verso e obrigatorio`,
                field: `flashcards[${index}].verso`,
                severity: 'medium'
            });
        } else if (card.verso.length > VALIDATION_RULES.MAX_FLASHCARD_BACK_LENGTH) {
            warnings.push({
                code: 'FC_W003',
                message: `Flashcard ${index + 1}: Verso muito longo`,
                field: `flashcards[${index}].verso`,
                suggestion: `Reduza para ${VALIDATION_RULES.MAX_FLASHCARD_BACK_LENGTH} caracteres`
            });
        }
    });
};

// ==================================================
// FUNCOES DE CONTROLO DE QUALIDADE
// ==================================================

/**
 * Verifica se a aula esta pronta para publicacao
 */
export const isReadyForPublish = (lesson: DigitalLesson): boolean => {
    const result = validateLesson(lesson);
    return result.isValid && result.score >= 70;
};

/**
 * Gera relatorio de qualidade
 */
export const generateQualityReport = (lesson: DigitalLesson): string => {
    const result = validateLesson(lesson);

    let report = `
# Relatorio de Qualidade
## Aula: ${lesson.titulo}

### Resumo
- **Score Geral:** ${result.score}/100
- **Status:** ${result.isValid ? 'APROVADA' : 'REPROVADA'}
- **Erros Criticos:** ${result.errors.filter(e => e.severity === 'critical').length}
- **Erros Importantes:** ${result.errors.filter(e => e.severity === 'high').length}
- **Avisos:** ${result.warnings.length}

### Estatisticas da Aula
- Slides: ${lesson.slides.length}
- Blocos Conversacionais: ${lesson.aulaConversacional.blocos.length}
- Questoes do Quiz: ${lesson.miniQuiz.questoes.length}
- Flashcards: ${lesson.flashcards.length}
- Duracao Estimada: ${lesson.duracaoEstimadaMinutos} minutos
`;

    if (result.errors.length > 0) {
        report += `\n### Erros\n`;
        result.errors.forEach(e => {
            report += `- **[${e.severity.toUpperCase()}]** ${e.code}: ${e.message}\n`;
        });
    }

    if (result.warnings.length > 0) {
        report += `\n### Avisos\n`;
        result.warnings.forEach(w => {
            report += `- ${w.code}: ${w.message}\n  *Sugestao: ${w.suggestion}*\n`;
        });
    }

    return report;
};

/**
 * Calcula metricas de engajamento previsto
 */
export const calculateEngagementMetrics = (lesson: DigitalLesson): {
    interactivityScore: number;
    contentDensity: number;
    estimatedCompletionRate: number;
} => {
    // Interactividade
    const totalInteractions =
        lesson.slides.filter(s => s.interacao).length +
        lesson.aulaConversacional.blocos.filter(b => b.perguntaAluno).length +
        lesson.miniQuiz.questoes.length +
        lesson.flashcards.length;

    const interactivityScore = Math.min(100, (totalInteractions / lesson.slides.length) * 25);

    // Densidade de conteudo
    const totalWords =
        lesson.slides.reduce((acc, s) => acc + s.conteudoPrincipal.split(/\s+/).length, 0) +
        lesson.aulaConversacional.blocos.reduce((acc, b) => acc + b.fala.split(/\s+/).length, 0);

    const contentDensity = totalWords / lesson.duracaoEstimadaMinutos;

    // Taxa de conclusao estimada (baseada em heuristicas)
    const durationPenalty = lesson.duracaoEstimadaMinutos > 30 ?
        (lesson.duracaoEstimadaMinutos - 30) * 2 : 0;

    const estimatedCompletionRate = Math.max(40,
        90 - durationPenalty + (interactivityScore * 0.1));

    return {
        interactivityScore,
        contentDensity,
        estimatedCompletionRate
    };
};

// ==================================================
// TRATAMENTO DE ERROS
// ==================================================

export class LessonValidationError extends Error {
    constructor(
        public readonly code: string,
        public readonly field: string,
        message: string
    ) {
        super(message);
        this.name = 'LessonValidationError';
    }
}

export class LessonGenerationError extends Error {
    constructor(
        public readonly step: string,
        message: string,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'LessonGenerationError';
    }
}

/**
 * Trata erros de forma amigavel para o utilizador
 */
export const handleLessonError = (error: Error): string => {
    if (error instanceof LessonValidationError) {
        return `Erro de validacao no campo "${error.field}": ${error.message}`;
    }

    if (error instanceof LessonGenerationError) {
        return `Erro ao gerar aula (${error.step}): ${error.message}`;
    }

    return `Erro inesperado: ${error.message}`;
};
