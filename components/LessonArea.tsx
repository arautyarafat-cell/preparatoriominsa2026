import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Category } from '../types';
import {
    DigitalLesson,
    LessonSlide,
    LessonProgress,
    ConversationalBlock,
    MiniQuizQuestion,
    LessonFlashcard,
    LESSON_LEVELS
} from '../types/lesson';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';


// ==================================================
// INTERFACES
// ==================================================

interface LessonAreaProps {
    category: Category;
    lesson: DigitalLesson;
    onBack: () => void;
    onComplete?: (progress: LessonProgress) => void;
}

type LessonTab = 'slides' | 'conversacional' | 'quiz' | 'flashcards' | 'materiais';

interface SupplementaryMaterial {
    id: string;
    title: string;
    file_path: string;
    file_size: string;
    created_at: string;
    category_id: string;
}



// ==================================================
// COMPONENTE PRINCIPAL - LESSON AREA
// ==================================================

const LessonArea: React.FC<LessonAreaProps> = ({ category, lesson, onBack, onComplete }) => {
    // Estado principal
    const [activeTab, setActiveTab] = useState<LessonTab>('slides');
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [currentBlockIndex, setCurrentBlockIndex] = useState(0);



    // Estado do progresso
    const [progress, setProgress] = useState<LessonProgress>({
        lessonId: lesson.id,
        userId: 'current-user',
        slideAtual: 0,
        slidesCompletados: [],
        tempoTotalSegundos: 0,
        ultimoAcesso: new Date().toISOString(),
        quizRespondido: false,
        interacoesCompletadas: [],
        concluida: false
    });

    // Estado do quiz
    const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
    const [showQuizResults, setShowQuizResults] = useState(false);
    const [quizScore, setQuizScore] = useState(0);

    // Estado dos flashcards
    const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
    const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
    const [masteredCards, setMasteredCards] = useState<string[]>([]);

    // Estado da interacao conversacional
    const [userResponse, setUserResponse] = useState('');
    const [showBlockResponse, setShowBlockResponse] = useState(false);

    // Estado dos materiais complementares
    const [materials, setMaterials] = useState<SupplementaryMaterial[]>([]);
    const [loadingMaterials, setLoadingMaterials] = useState(true);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    // Timer de estudo
    useEffect(() => {
        startTimeRef.current = Date.now();

        timerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setProgress(prev => ({
                ...prev,
                tempoTotalSegundos: prev.tempoTotalSegundos + 1
            }));
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Buscar materiais complementares da aula
    useEffect(() => {
        const fetchMaterials = async () => {
            setLoadingMaterials(true);
            try {
                // Obter IDs dos materiais da aula (suporte para snake_case do banco)
                const materialIds = lesson.materiaisComplementares || lesson.materiais_complementares || [];

                if (materialIds.length === 0) {
                    // Se a aula não tem materiais, buscar por categoria como fallback
                    const res = await fetch(`http://localhost:3001/materials/category/${category.id}`);
                    const data = await res.json();
                    setMaterials(data.materials || data.data || []);
                } else {
                    // Buscar materiais pelos IDs específicos da aula
                    const res = await fetch('http://localhost:3001/materials/by-ids', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: materialIds })
                    });
                    const data = await res.json();
                    setMaterials(data.materials || data.data || []);
                }
            } catch (error) {
                console.error('Erro ao buscar materiais:', error);
                setMaterials([]);
            } finally {
                setLoadingMaterials(false);
            }
        };

        fetchMaterials();
    }, [lesson.id, lesson.materiaisComplementares, lesson.materiais_complementares, category.id]);



    // Slide actual - com verificações de segurança
    const currentSlide = lesson.slides?.[currentSlideIndex];
    const currentBlock = lesson.aulaConversacional?.blocos?.[currentBlockIndex];

    // ==================================================
    // HANDLERS - NAVEGACAO DE SLIDES
    // ==================================================

    const handleNextSlide = useCallback(() => {
        if (currentSlideIndex < lesson.slides.length - 1) {
            // Marcar slide actual como completado
            if (!progress.slidesCompletados.includes(currentSlide.id)) {
                setProgress(prev => ({
                    ...prev,
                    slidesCompletados: [...prev.slidesCompletados, currentSlide.id]
                }));
            }
            setCurrentSlideIndex(prev => prev + 1);
        }
    }, [currentSlideIndex, lesson.slides.length, currentSlide?.id, progress.slidesCompletados]);

    const handlePrevSlide = useCallback(() => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(prev => prev - 1);
        }
    }, [currentSlideIndex]);

    const handleGoToSlide = useCallback((index: number) => {
        setCurrentSlideIndex(index);
    }, []);



    // ==================================================
    // HANDLERS - AULA CONVERSACIONAL
    // ==================================================

    const handleNextBlock = useCallback(() => {
        const blocosLength = lesson.aulaConversacional?.blocos?.length ?? 0;
        if (currentBlockIndex < blocosLength - 1) {
            setCurrentBlockIndex(prev => prev + 1);
            setShowBlockResponse(false);
            setUserResponse('');
        }
    }, [currentBlockIndex, lesson.aulaConversacional?.blocos?.length]);

    const handlePrevBlock = useCallback(() => {
        if (currentBlockIndex > 0) {
            setCurrentBlockIndex(prev => prev - 1);
            setShowBlockResponse(false);
            setUserResponse('');
        }
    }, [currentBlockIndex]);

    const handleBlockInteraction = useCallback(() => {
        setShowBlockResponse(true);
        if (currentBlock?.perguntaAluno) {
            setProgress(prev => ({
                ...prev,
                interacoesCompletadas: [...prev.interacoesCompletadas, currentBlock.id]
            }));
        }
    }, [currentBlock]);

    // ==================================================
    // HANDLERS - QUIZ
    // ==================================================

    const handleQuizAnswer = useCallback((questionId: string, answer: string) => {
        setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
    }, []);

    const handleSubmitQuiz = useCallback(() => {
        const questoes = lesson.miniQuiz?.questoes ?? [];
        let correct = 0;
        questoes.forEach(q => {
            if (quizAnswers[q.id] === q.correta) correct++;
        });

        const score = questoes.length > 0 ? Math.round((correct / questoes.length) * 100) : 0;
        setQuizScore(score);
        setShowQuizResults(true);

        setProgress(prev => ({
            ...prev,
            quizRespondido: true,
            quizPontuacao: score,
            respostasQuiz: quizAnswers
        }));
    }, [lesson.miniQuiz?.questoes, quizAnswers]);

    const handleRetryQuiz = useCallback(() => {
        setQuizAnswers({});
        setShowQuizResults(false);
        setQuizScore(0);
    }, []);

    // ==================================================
    // HANDLERS - FLASHCARDS
    // ==================================================

    const handleFlipCard = useCallback(() => {
        setIsFlashcardFlipped(prev => !prev);
    }, []);

    const handleNextCard = useCallback(() => {
        const flashcardsLength = lesson.flashcards?.length ?? 0;
        if (currentFlashcardIndex < flashcardsLength - 1) {
            setCurrentFlashcardIndex(prev => prev + 1);
            setIsFlashcardFlipped(false);
        }
    }, [currentFlashcardIndex, lesson.flashcards?.length]);

    const handlePrevCard = useCallback(() => {
        if (currentFlashcardIndex > 0) {
            setCurrentFlashcardIndex(prev => prev - 1);
            setIsFlashcardFlipped(false);
        }
    }, [currentFlashcardIndex]);

    const handleMasterCard = useCallback((cardId: string) => {
        if (!masteredCards.includes(cardId)) {
            setMasteredCards(prev => [...prev, cardId]);
        }
        handleNextCard();
    }, [masteredCards, handleNextCard]);

    // ==================================================
    // HANDLERS - CONCLUSAO
    // ==================================================

    const handleCompleteLesson = useCallback(() => {
        const finalProgress: LessonProgress = {
            ...progress,
            concluida: true,
            dataConclusao: new Date().toISOString()
        };

        if (onComplete) {
            onComplete(finalProgress);
        }
    }, [progress, onComplete]);

    // ==================================================
    // CALCULO DE PROGRESSO
    // ==================================================

    const progressPercentage = lesson.slides?.length > 0
        ? Math.round((progress.slidesCompletados.length / lesson.slides.length) * 100)
        : 0;

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ==================================================
    // RENDER - HEADER
    // ==================================================

    const renderHeader = () => (
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/60 z-50 sticky top-0">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="group w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
                        title="Voltar"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>

                    <div>
                        <h1 className="text-xl font-display font-bold text-slate-900 truncate max-w-xs sm:max-w-md tracking-tight">
                            {lesson.titulo}
                        </h1>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${LESSON_LEVELS[lesson.nivel].cor} text-white`}>
                                {LESSON_LEVELS[lesson.nivel].titulo}
                            </span>
                            <span className="text-xs text-slate-500">{category.title}</span>
                            <span className="text-xs text-slate-400">|</span>
                            <span className="text-xs text-slate-500">{formatTime(progress.tempoTotalSegundos)}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="hidden md:flex items-center gap-4">
                    <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <span className="text-sm font-bold text-slate-700">{progressPercentage}%</span>
                </div>

                {/* Tab Navigation */}
                <nav className="hidden lg:flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
                    {[
                        { id: 'slides' as LessonTab, label: 'Slides', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
                        { id: 'conversacional' as LessonTab, label: 'Aula', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
                        { id: 'quiz' as LessonTab, label: 'Quiz', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                        { id: 'flashcards' as LessonTab, label: 'Cards', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                        { id: 'materiais' as LessonTab, label: 'Materiais', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                            </svg>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </header>
    );

    // ==================================================
    // RENDER - SLIDES TAB
    // ==================================================

    const renderSlidesTab = () => {
        if (!currentSlide) return null;

        return (
            <div className="h-full flex flex-col lg:flex-row gap-6 p-6">
                {/* Slide Principal */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden flex-1 flex flex-col">
                        {/* Slide Header */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-slate-400 text-sm font-medium">
                                        Slide {currentSlideIndex + 1} de {lesson.slides.length}
                                    </span>
                                    <h2 className="text-2xl font-display font-bold text-white mt-1">
                                        {currentSlide.titulo}
                                    </h2>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${currentSlide.relevanciaProva === 'alta' ? 'bg-red-500/20 text-red-300' :
                                    currentSlide.relevanciaProva === 'media' ? 'bg-yellow-500/20 text-yellow-300' :
                                        'bg-green-500/20 text-green-300'
                                    }`}>
                                    Relevancia {currentSlide.relevanciaProva}
                                </span>
                            </div>
                        </div>

                        {/* Slide Content */}
                        <div className="flex-1 p-8 overflow-y-auto">
                            <div className="prose prose-lg prose-slate max-w-none mb-8">
                                <div
                                    className="rich-content"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentSlide.conteudoPrincipal) }}
                                />
                            </div>

                            {/* Pontos-Chave */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                {currentSlide.pontosChave.map((ponto, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border border-slate-200/50"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">{ponto.titulo}</h4>
                                                <p className="text-slate-600 text-sm mt-1">{ponto.descricao}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Conceito Central */}
                            <div className="mt-8 p-6 bg-brand-50 rounded-2xl border border-brand-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-bold text-brand-700 uppercase tracking-wide">Conceito Central</span>
                                </div>
                                <p className="text-brand-900 font-medium">{currentSlide.conceito}</p>
                            </div>
                        </div>

                        {/* Slide Footer - Navigation Only (Audio Removed) */}
                        <div className="border-t border-slate-200 px-8 py-4 bg-slate-50 flex items-center justify-end">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrevSlide}
                                    disabled={currentSlideIndex === 0}
                                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={handleNextSlide}
                                    disabled={currentSlideIndex === lesson.slides.length - 1}
                                    className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                >
                                    Proximo
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Navegacao de Slides */}
                <div className="lg:w-72 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg p-4 h-full flex flex-col">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 flex-shrink-0">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            Navegacao
                        </h3>

                        <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar pr-1">
                            {lesson.slides.map((slide, idx) => (
                                <button
                                    key={slide.id}
                                    onClick={() => handleGoToSlide(idx)}
                                    className={`w-full text-left p-3 rounded-xl transition-all ${idx === currentSlideIndex
                                        ? 'bg-brand-50 border-2 border-brand-500 text-brand-700'
                                        : progress.slidesCompletados.includes(slide.id)
                                            ? 'bg-green-50 border border-green-200 text-green-700'
                                            : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === currentSlideIndex
                                            ? 'bg-brand-500 text-white'
                                            : progress.slidesCompletados.includes(slide.id)
                                                ? 'bg-green-500 text-white'
                                                : 'bg-slate-200 text-slate-600'
                                            }`}>
                                            {progress.slidesCompletados.includes(slide.id) ? (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                idx + 1
                                            )}
                                        </span>
                                        <span className="text-sm font-medium truncate">{slide.titulo}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ==================================================
    // RENDER - AULA CONVERSACIONAL TAB
    // ==================================================

    const renderConversacionalTab = () => {
        if (!currentBlock) return null;

        const blockTypeStyles: Record<string, { bg: string; icon: string; label: string }> = {
            introducao: { bg: 'from-blue-500 to-blue-600', icon: '🎯', label: 'Introducao' },
            explicacao: { bg: 'from-slate-700 to-slate-800', icon: '📖', label: 'Explicacao' },
            exemplo: { bg: 'from-amber-500 to-orange-500', icon: '💡', label: 'Exemplo' },
            aplicacao: { bg: 'from-purple-500 to-purple-600', icon: '🔧', label: 'Aplicacao' },
            resumo: { bg: 'from-green-500 to-green-600', icon: '📋', label: 'Resumo' }
        };

        const style = blockTypeStyles[currentBlock.tipo] || blockTypeStyles.explicacao;

        return (
            <div className="h-full flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-3xl">
                    {/* Block Type Badge */}
                    <div className="flex justify-center mb-6">
                        <span className={`px-4 py-2 rounded-full bg-gradient-to-r ${style.bg} text-white font-bold text-sm shadow-lg flex items-center gap-2`}>
                            <span>{style.icon}</span>
                            {style.label}
                        </span>
                    </div>

                    {/* Professor Speech Bubble */}
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 md:p-10 relative">
                        {/* Professor Avatar */}
                        <div className="absolute -top-6 left-8 w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg">
                            <span className="text-2xl">👨‍🏫</span>
                        </div>

                        {/* Speech Content */}
                        <div className="pt-4">
                            <p className="text-lg md:text-xl text-slate-800 leading-relaxed">
                                {currentBlock.fala}
                            </p>

                            {/* Dica Contextual */}
                            {currentBlock.dicaContextual && (
                                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">💡</span>
                                        <p className="text-amber-800 text-sm">{currentBlock.dicaContextual}</p>
                                    </div>
                                </div>
                            )}

                            {/* Pergunta ao Aluno */}
                            {currentBlock.perguntaAluno && (
                                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                                    <p className="font-bold text-slate-700 mb-4">{currentBlock.perguntaAluno}</p>

                                    {!showBlockResponse ? (
                                        <button
                                            onClick={handleBlockInteraction}
                                            className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg"
                                        >
                                            Reflectir e Continuar
                                        </button>
                                    ) : (
                                        <div className="text-green-600 font-medium flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Reflexao registada
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8">
                        <button
                            onClick={handlePrevBlock}
                            disabled={currentBlockIndex === 0}
                            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Anterior
                        </button>

                        <span className="text-slate-500 text-sm">
                            {currentBlockIndex + 1} / {lesson.aulaConversacional?.blocos?.length ?? 0}
                        </span>

                        <button
                            onClick={handleNextBlock}
                            disabled={currentBlockIndex === (lesson.aulaConversacional?.blocos?.length ?? 1) - 1}
                            className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            Proximo
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ==================================================
    // RENDER - QUIZ TAB
    // ==================================================

    const renderQuizTab = () => {
        const miniQuiz = lesson.miniQuiz;
        const questoes = miniQuiz?.questoes ?? [];

        if (!miniQuiz || questoes.length === 0) {
            return (
                <div className="h-full flex items-center justify-center">
                    <p className="text-slate-500">Nenhum quiz disponível para esta aula.</p>
                </div>
            );
        }

        if (showQuizResults) {
            const passed = quizScore >= (miniQuiz.pontuacaoMinima ?? 70);

            return (
                <div className="h-full flex items-center justify-center p-6">
                    <div className="w-full max-w-lg text-center">
                        <div className={`w-32 h-32 rounded-full mx-auto mb-8 flex items-center justify-center ${passed ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            <span className="text-6xl">{passed ? '🎉' : '📚'}</span>
                        </div>

                        <h2 className="text-3xl font-display font-bold text-slate-900 mb-4">
                            {passed ? 'Parabens!' : 'Continue a Estudar'}
                        </h2>

                        <p className="text-xl text-slate-600 mb-8">
                            Obtiveste <span className="font-bold text-slate-900">{quizScore}%</span> de acertos
                        </p>

                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={handleRetryQuiz}
                                className="px-8 py-3 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all"
                            >
                                Tentar Novamente
                            </button>

                            {passed && (
                                <button
                                    onClick={handleCompleteLesson}
                                    className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg"
                                >
                                    Concluir Aula
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="h-full overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-display font-bold text-slate-900">{miniQuiz.titulo}</h2>
                        <p className="text-slate-500 mt-2">{miniQuiz.descricao}</p>
                    </div>

                    <div className="space-y-8">
                        {questoes.map((questao, qIdx) => (
                            <div key={questao.id} className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 md:p-8">
                                <div className="flex items-start gap-4 mb-6">
                                    <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold flex-shrink-0">
                                        {qIdx + 1}
                                    </span>
                                    <p className="text-lg font-medium text-slate-900">{questao.enunciado}</p>
                                </div>

                                <div className="space-y-3 ml-12">
                                    {questao.alternativas.map((alt) => {
                                        const isSelected = quizAnswers[questao.id] === alt.letra;

                                        return (
                                            <button
                                                key={alt.letra}
                                                onClick={() => handleQuizAnswer(questao.id, alt.letra)}
                                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected
                                                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold ${isSelected
                                                        ? 'border-brand-500 bg-brand-500 text-white'
                                                        : 'border-slate-300 text-slate-400'
                                                        }`}>
                                                        {alt.letra}
                                                    </span>
                                                    <span className={isSelected ? 'font-medium' : ''}>{alt.texto}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 flex justify-center">
                        <button
                            onClick={handleSubmitQuiz}
                            disabled={Object.keys(quizAnswers).length !== questoes.length}
                            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl"
                        >
                            Submeter Respostas
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ==================================================
    // RENDER - FLASHCARDS TAB
    // ==================================================

    const renderFlashcardsTab = () => {
        const flashcards = lesson.flashcards ?? [];

        if (flashcards.length === 0) {
            return (
                <div className="h-full flex items-center justify-center">
                    <p className="text-slate-500">Nenhum flashcard disponivel para esta aula.</p>
                </div>
            );
        }

        const currentCard = flashcards[currentFlashcardIndex];
        if (!currentCard) {
            return (
                <div className="h-full flex items-center justify-center">
                    <p className="text-slate-500">Nenhum flashcard disponivel para esta aula.</p>
                </div>
            );
        }

        const isMastered = masteredCards.includes(currentCard.id);

        return (
            <div className="h-full flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-lg">
                    {/* Progress */}
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-sm text-slate-500">
                            Card {currentFlashcardIndex + 1} de {flashcards.length}
                        </span>
                        <span className="text-sm text-green-600 font-medium">
                            {masteredCards.length} dominados
                        </span>
                    </div>

                    {/* Card */}
                    <div
                        onClick={handleFlipCard}
                        className={`w-full h-80 rounded-3xl shadow-2xl cursor-pointer transition-all duration-500 transform perspective-1000 ${isFlashcardFlipped ? 'rotate-y-180' : ''
                            }`}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        <div className={`w-full h-full rounded-3xl p-8 flex items-center justify-center ${isFlashcardFlipped
                            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                            : 'bg-gradient-to-br from-slate-800 to-slate-900 text-white'
                            }`}>
                            <div className="text-center">
                                {!isFlashcardFlipped ? (
                                    <>
                                        <span className="text-slate-400 text-sm uppercase tracking-wide block mb-4">Pergunta</span>
                                        <p className="text-xl md:text-2xl font-medium">{currentCard.frente}</p>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-green-200 text-sm uppercase tracking-wide block mb-4">Resposta</span>
                                        <p className="text-xl md:text-2xl font-medium">{currentCard.verso}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-slate-400 text-sm mt-4">
                        Clica no card para virar
                    </p>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-8">
                        <button
                            onClick={handlePrevCard}
                            disabled={currentFlashcardIndex === 0}
                            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Anterior
                        </button>

                        <button
                            onClick={() => handleMasterCard(currentCard.id)}
                            disabled={isMastered}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${isMastered
                                ? 'bg-green-100 text-green-600 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                                }`}
                        >
                            {isMastered ? 'Dominado' : 'Marcar como Dominado'}
                        </button>

                        <button
                            onClick={handleNextCard}
                            disabled={currentFlashcardIndex === flashcards.length - 1}
                            className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Proximo
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ==================================================
    // RENDER - MATERIAIS TAB
    // ==================================================

    const renderMaterialsTab = () => {
        return (
            <div className="h-full overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-display font-bold text-slate-900">Materiais Complementares</h2>
                        <p className="text-slate-500 mt-2">PDFs e documentos de apoio para aprofundar seu estudo</p>
                    </div>

                    {loadingMaterials ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                        </div>
                    ) : materials.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-lg font-bold text-slate-600 mb-2">Nenhum material disponível</h3>
                            <p className="text-slate-400">Ainda não há materiais complementares para esta categoria.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {materials.map((material) => (
                                <a
                                    key={material.id}
                                    href={`http://localhost:3001${material.file_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-5 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300"
                                >
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center flex-shrink-0 group-hover:from-red-100 group-hover:to-rose-200 transition-colors">
                                        <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2zM14 3.5L18.5 8H14V3.5zM10.35 14.04c-.16 0-.31-.02-.46-.05-.15-.03-.29-.08-.41-.14l.11-.49c.11.05.22.1.35.13.13.03.27.05.4.05.19 0 .33-.04.43-.13.1-.08.15-.21.15-.37 0-.11-.02-.2-.06-.28-.04-.07-.1-.13-.18-.18-.07-.05-.16-.09-.25-.12-.09-.04-.19-.07-.29-.1-.13-.04-.25-.09-.36-.15-.11-.06-.21-.14-.29-.23-.08-.09-.15-.2-.19-.32-.05-.12-.07-.27-.07-.43 0-.33.1-.59.31-.78.21-.19.48-.29.84-.29.17 0 .33.02.46.05.14.03.27.08.39.14l-.11.47c-.11-.06-.22-.1-.34-.13-.12-.03-.24-.04-.36-.04-.17 0-.31.04-.41.12-.1.08-.14.2-.14.36 0 .08.01.15.04.21.03.06.08.12.15.17.06.05.14.09.22.13.09.04.19.07.3.11.14.04.26.09.37.15.11.06.21.13.29.22.08.09.15.19.19.31.05.12.07.27.07.44 0 .16-.03.31-.09.44-.06.14-.14.25-.25.35-.11.1-.24.17-.41.22-.16.06-.35.09-.56.09zM12.64 14.14v-2.68h.54v2.68h-.54zM13.77 11.45v.44h-.59v2.24h-.52v-2.24h-.59v-.44h1.7z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 text-lg group-hover:text-red-600 transition-colors truncate">
                                            {material.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                                            <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium">PDF</span>
                                            <span>{material.file_size}</span>
                                            <span>•</span>
                                            <span>{new Date(material.created_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-slate-400 group-hover:text-red-500 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </span>
                                        <span className="text-slate-400 group-hover:text-red-500 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ==================================================
    // RENDER PRINCIPAL
    // ==================================================

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
            {renderHeader()}

            <main className="flex-1 overflow-hidden">
                {activeTab === 'slides' && renderSlidesTab()}
                {activeTab === 'conversacional' && renderConversacionalTab()}
                {activeTab === 'quiz' && renderQuizTab()}
                {activeTab === 'flashcards' && renderFlashcardsTab()}
                {activeTab === 'materiais' && renderMaterialsTab()}
            </main>

            {/* Mobile Tab Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 z-50">
                <div className="flex justify-around">
                    {[
                        { id: 'slides' as LessonTab, label: 'Slides', icon: '📊' },
                        { id: 'conversacional' as LessonTab, label: 'Aula', icon: '💬' },
                        { id: 'quiz' as LessonTab, label: 'Quiz', icon: '✅' },
                        { id: 'flashcards' as LessonTab, label: 'Cards', icon: '🃏' },
                        { id: 'materiais' as LessonTab, label: 'PDFs', icon: '📄' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${activeTab === tab.id
                                ? 'text-brand-600 bg-brand-50'
                                : 'text-slate-500'
                                }`}
                        >
                            <span className="text-xl">{tab.icon}</span>
                            <span className="text-xs font-medium">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default LessonArea;
