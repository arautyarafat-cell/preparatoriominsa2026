import React, { useState, useEffect } from 'react';
import { Category, GeneratedQuestion, CategoryId } from '../types';
import { CATEGORIES } from '../constants';
import { generateGeneralQuiz } from '../services/geminiService';
import { authService } from '../services/auth';
import { API_URL } from '../config/api';

interface KnowledgeTestAreaProps {
    onExit: () => void;
    onNavigate?: (page: 'plans' | 'login') => void;
}

const QUESTION_COUNT_OPTIONS = [20, 40, 60, 80, 100];

// Interface para estado do limite de questionários
interface TrialLimitState {
    hasProPlan: boolean;
    canTakeQuiz: boolean;
    count: number;
    limit: number;
    remaining: number;
    message: string;
    loading: boolean;
}

const KnowledgeTestArea: React.FC<KnowledgeTestAreaProps> = ({ onExit, onNavigate }) => {
    // Configuration state
    const [showConfig, setShowConfig] = useState(true);
    const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | ''>('');
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(20);
    const [availableTopics, setAvailableTopics] = useState<string[]>([]);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [blockedCategories, setBlockedCategories] = useState<string[]>([]);

    // Quiz state
    const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [score, setScore] = useState(0);
    const [completed, setCompleted] = useState(false);

    // Trial limit state - controla limite de 5 questionários para usuários sem plano Pro/Premier
    const [trialLimit, setTrialLimit] = useState<TrialLimitState>({
        hasProPlan: false,
        canTakeQuiz: true,
        count: 0,
        limit: 5,
        remaining: 5,
        message: '',
        loading: true
    });
    const [showLimitReached, setShowLimitReached] = useState(false);
    // Blocking reason state for modal content
    const [blockingReason, setBlockingReason] = useState<'trial_limit' | 'question_limit'>('trial_limit');

    // Verificar limite de questionários de teste ao carregar
    useEffect(() => {
        const checkTrialLimit = async () => {
            try {
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                };

                // Adicionar headers de autenticação se estiver logado
                const authHeaders = authService.getAuthHeaders();
                if (authHeaders.Authorization) {
                    headers['Authorization'] = authHeaders.Authorization;
                }
                if (authHeaders['X-Device-ID']) {
                    headers['X-Device-ID'] = authHeaders['X-Device-ID'];
                }

                console.log('[KnowledgeTestArea] Verificando limite de trial quiz...');
                const response = await fetch(`${API_URL}/trial-quiz-limit`, {
                    method: 'GET',
                    headers
                });

                console.log('[KnowledgeTestArea] Resposta:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('[KnowledgeTestArea] Dados de limite recebidos:', JSON.stringify(data, null, 2));

                    const newState = {
                        hasProPlan: data.hasProPlan === true,
                        canTakeQuiz: data.canTakeQuiz === true,
                        count: data.count || 0,
                        limit: data.limit || 5,
                        remaining: data.remaining || 0,
                        message: data.message || '',
                        loading: false
                    };

                    console.log('[KnowledgeTestArea] Novo estado de trialLimit:', JSON.stringify(newState, null, 2));
                    setTrialLimit(newState);

                    // Se limite atingido E NÃO é Pro, mostrar modal
                    if (!newState.canTakeQuiz && !newState.hasProPlan) {
                        console.log('[KnowledgeTestArea] Limite atingido - mostrando modal de bloqueio');
                        setShowLimitReached(true);
                    } else {
                        console.log('[KnowledgeTestArea] Acesso permitido - hasProPlan:', newState.hasProPlan, 'canTakeQuiz:', newState.canTakeQuiz);
                    }
                } else {
                    console.error('[KnowledgeTestArea] Erro ao verificar limite:', response.status);
                    // Em caso de erro, permitir acesso (fail-open) mas continuar tentando
                    setTrialLimit(prev => ({
                        ...prev,
                        loading: false,
                        // Permitir que continue em caso de erro de API
                        canTakeQuiz: true,
                        message: 'Erro ao verificar limite - acesso temporário permitido'
                    }));
                }
            } catch (error) {
                console.error('[KnowledgeTestArea] Erro ao verificar limite:', error);
                // Em caso de erro de rede, permitir acesso temporário
                setTrialLimit(prev => ({
                    ...prev,
                    loading: false,
                    canTakeQuiz: true,
                    message: 'Erro de conexão - acesso temporário permitido'
                }));
            }
        };

        checkTrialLimit();
    }, []);

    // Fetch blocked categories
    useEffect(() => {
        const fetchBlocked = async () => {
            try {
                const res = await fetch(`${API_URL}/blocking/categories`);
                const data = await res.json();
                setBlockedCategories(data.blockedCategories || []);
            } catch (e) {
                console.error('Failed to fetch blocked categories:', e);
            }
        };
        fetchBlocked();
    }, []);

    // Get available categories (not blocked)
    const availableCategories = CATEGORIES.filter(cat => {
        const user = authService.getUser();
        const isAdmin = user?.role === 'admin' ||
            user?.email?.toLowerCase() === 'arautyarafat@gmail.com' ||
            user?.email?.toLowerCase() === 'admin@angolasaude.ao';

        const isBlockedByServer = blockedCategories.includes(cat.id);
        return !isBlockedByServer || isAdmin;
    });

    // Fetch topics when category changes
    useEffect(() => {
        if (!selectedCategoryId) {
            setAvailableTopics([]);
            setSelectedTopic('');
            return;
        }

        const fetchTopics = async () => {
            setLoadingTopics(true);
            try {
                const response = await fetch(`${API_URL}/topics?category_id=${selectedCategoryId}`);
                const data = await response.json();
                if (data.data) {
                    setAvailableTopics(data.data);
                } else {
                    setAvailableTopics([]);
                }
            } catch (e) {
                console.error('Failed to fetch topics:', e);
                setAvailableTopics([]);
            } finally {
                setLoadingTopics(false);
            }
        };
        fetchTopics();
    }, [selectedCategoryId]);

    // Submit quiz results when completed
    useEffect(() => {
        if (completed && questions.length > 0) {
            const submitResults = async () => {
                try {
                    const headers = {
                        ...authService.getAuthHeaders(),
                        'Content-Type': 'application/json'
                    };
                    await fetch(`${API_URL}/quiz/result`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            category_id: selectedCategoryId,
                            topic: selectedTopic || 'Teste de Conhecimento MINSA',
                            score: score,
                            total_questions: questions.length
                        })
                    });
                    console.log('[KnowledgeTestArea] Results submitted successfully');
                } catch (error) {
                    console.error('[KnowledgeTestArea] Failed to submit results:', error);
                }
            };
            submitResults();

            // Incrementar contador de limite de teste (apenas para usuários sem plano Pro/Premier)
            if (!trialLimit.hasProPlan) {
                const incrementTrialLimit = async () => {
                    try {
                        const headers: Record<string, string> = {
                            'Content-Type': 'application/json'
                        };

                        const authHeaders = authService.getAuthHeaders();
                        if (authHeaders.Authorization) {
                            headers['Authorization'] = authHeaders.Authorization;
                        }
                        if (authHeaders['X-Device-ID']) {
                            headers['X-Device-ID'] = authHeaders['X-Device-ID'];
                        }

                        const response = await fetch(`${API_URL}/trial-quiz-limit/increment`, {
                            method: 'POST',
                            headers
                        });

                        if (response.ok) {
                            const data = await response.json();
                            console.log('[KnowledgeTestArea] Trial limit incremented:', data);

                            // Atualizar estado local do limite
                            setTrialLimit(prev => ({
                                ...prev,
                                count: data.count,
                                remaining: data.remaining,
                                canTakeQuiz: data.canContinue,
                                message: data.message
                            }));

                            // Se limite atingido após este quiz, mostrar modal
                            if (!data.canContinue) {
                                setShowLimitReached(true);
                            }
                        }
                    } catch (error) {
                        console.error('[KnowledgeTestArea] Failed to increment trial limit:', error);
                    }
                };
                // incrementTrialLimit();
            }
        }
    }, [completed]);

    const selectedCategory = CATEGORIES.find(c => c.id === selectedCategoryId);

    // Quiz Session State
    const [sessionId, setSessionId] = useState<string | null>(null);

    const loadQuiz = async () => {
        if (!selectedCategoryId || !selectedCategory) return;

        setLoading(true);
        setCompleted(false);
        setScore(0);
        setCurrentIndex(0);
        setIsAnswered(false);
        setSelectedOption(null);
        setShowConfig(false);

        // 1. Iniciar Sessão de Monitoramento no Servidor
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            const authHeaders = authService.getAuthHeaders();
            if (authHeaders.Authorization) {
                headers['Authorization'] = authHeaders.Authorization;
            }
            if (authHeaders['X-Device-ID']) {
                headers['X-Device-ID'] = authHeaders['X-Device-ID'];
            }

            const sessionRes = await fetch(`${API_URL}/quiz/session/start`, {
                method: 'POST',
                headers,
                body: JSON.stringify({})
            });

            if (sessionRes.ok) {
                const sessionData = await sessionRes.json();
                setSessionId(sessionData.sessionId);
                console.log('[Quiz] Sessão iniciada:', sessionData.sessionId);
            } else {
                console.warn('[Quiz] Falha ao iniciar sessão:', sessionRes.status);
            }

            // Incrementar contador de Trial (mantido para compatibilidade, mas o endpoint start já poderia fazer isso)
            if (!trialLimit.hasProPlan) {
                await fetch(`${API_URL}/trial-quiz-limit/increment`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({})
                }).then(r => r.json()).then(data => {
                    setTrialLimit(prev => ({
                        ...prev,
                        count: data.count,
                        remaining: data.remaining,
                        canTakeQuiz: data.canContinue,
                        message: data.message
                    }));
                }).catch(e => console.error(e));
            }

        } catch (error) {
            console.error('[Quiz] Erro ao iniciar sessão:', error);
        }

        try {
            // Generate multiple batches if needed to reach the selected count
            let allQuestions: GeneratedQuestion[] = [];
            const topicFilter = selectedTopic === '' ? undefined : selectedTopic;

            // Generate questions in batches (API typically returns 10-20 at a time)
            while (allQuestions.length < selectedQuestionCount) {
                const generated = await generateGeneralQuiz(
                    selectedCategory.title,
                    selectedCategoryId,
                    topicFilter
                );

                // Add questions avoiding duplicates
                for (const q of generated) {
                    if (!allQuestions.find(existing => existing.enunciado === q.enunciado)) {
                        allQuestions.push(q);
                    }
                    if (allQuestions.length >= selectedQuestionCount) break;
                }

                // Safety check to prevent infinite loop
                if (generated.length === 0) break;
            }

            // Trim to exact count and shuffle
            allQuestions = allQuestions.slice(0, selectedQuestionCount);
            allQuestions = allQuestions.sort(() => Math.random() - 0.5);

            setQuestions(allQuestions);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartQuiz = () => {
        if (!selectedCategoryId) {
            alert('Por favor, selecione uma trilha de conhecimento.');
            return;
        }

        // Verificar se o utilizador pode fazer mais questionários
        if (!trialLimit.hasProPlan && !trialLimit.canTakeQuiz) {
            setShowLimitReached(true);
            return;
        }

        loadQuiz();
    };

    const handleRetry = () => {
        // Repetir o mesmo quiz não conta como novo questionário
        setScore(0);
        setCurrentIndex(0);
        setIsAnswered(false);
        setSelectedOption(null);
        setCompleted(false);
        setShowHint(false);
        // Start new session for retry? Usually yes, to track progress.
        // Re-call loadQuiz actually fetches new questions. 
        // handleRetry just resets state. We should PROBABLY start a new session ID if we want to track this "run".
        // But let's keep it simple for now. 
    };

    const handleNewTest = () => {
        // Verificar se pode fazer novo teste antes de ir para configuração
        if (!trialLimit.hasProPlan && !trialLimit.canTakeQuiz) {
            setShowLimitReached(true);
            return;
        }

        setShowConfig(true);
        setQuestions([]);
        setSelectedCategoryId('');
        setSelectedTopic('');
        setSelectedQuestionCount(20);
        setSessionId(null);
    };

    const handleAction = async () => {
        if (!isAnswered) {
            if (!selectedOption) return;
            setIsAnswered(true);

            // 2. Verificar Progresso no Servidor (Ao responder)
            if (sessionId) {
                try {
                    const headers = { ...authService.getAuthHeaders(), 'Content-Type': 'application/json' };

                    // Enviar progresso
                    const progressRes = await fetch(`${API_URL}/quiz/session/progress`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ sessionId, answer_count: 1 })
                    });

                    if (progressRes.ok) {
                        const progress = await progressRes.json();
                        console.log('[KnowledgeTestArea] Progress response:', progress);

                        // Se utilizador é Pro/Premium, atualizar estado local
                        if (progress.isPro) {
                            console.log('[KnowledgeTestArea] User is PRO - updating local state');
                            setTrialLimit(prev => ({ ...prev, hasProPlan: true, canTakeQuiz: true }));
                        }

                        // BLOQUEIO PELO SERVIDOR - apenas para utilizadores gratuitos
                        if (!progress.allowed) {
                            console.log('[KnowledgeTestArea] Server blocked: ', progress.reason);
                            setBlockingReason('question_limit');
                            setShowLimitReached(true);
                            return;
                        }
                    }
                } catch (e) {
                    console.error('Falha ao sincronizar progresso:', e);
                    // Em caso de erro, continuar (fail-open para não prejudicar utilizadores Pro)
                }
            }

            // Update score
            if (selectedOption === currentQuestion.correta) {
                setScore(prev => prev + 1);
            }
        } else {
            // "Next" button click
            if (currentIndex < questions.length - 1) {
                // NOTA: Verificação de limite é feita pelo servidor no handleAction
                // Removida verificação local que bloqueava todos os utilizadores
                // O servidor já verificou o plano e retornou isPro na resposta anterior

                setCurrentIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsAnswered(false);
                setShowHint(false);
            } else {
                setCompleted(true);
            }
        }
    };

    // Loading state - verificando limite de teste
    if (trialLimit.loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a092d] via-[#1a1d3a] to-[#0a092d] flex flex-col items-center justify-center p-6 text-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-[#2e3856] border-t-[#3ccfcf] rounded-full animate-spin"></div>
                </div>
                <h2 className="text-xl font-bold text-white mt-6">Verificando acesso...</h2>
                <p className="text-slate-400 mt-2">Aguarde um momento</p>
            </div>
        );
    }

    // Limite de teste atingido - Mostrar tela de upgrade
    if (showLimitReached || (!trialLimit.hasProPlan && !trialLimit.canTakeQuiz)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a092d] via-[#1a1d3a] to-[#0a092d] flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-[#2e3856]/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-lg w-full border border-slate-700/50">

                    {/* Ícone de bloqueio */}
                    <div className="relative mb-6">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-full flex items-center justify-center border-2 border-amber-500/50">
                            <span className="text-5xl">🔒</span>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-amber-500 text-[#0a092d] px-4 py-1 rounded-full text-xs font-bold uppercase">
                            Limite Atingido
                        </div>
                    </div>

                    {/* Título */}
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">
                        {blockingReason === 'question_limit'
                            ? 'Você atingiu o limite de questões disponíveis no plano gratuito.'
                            : 'Você atingiu o limite de questionários gratuitos'
                        }
                    </h1>

                    {/* Mensagem */}
                    <p className="text-slate-300 mb-6 leading-relaxed">
                        {blockingReason === 'question_limit' ? (
                            <>
                                Para continuar o questionário, aceder às restantes questões e desbloquear todos os módulos da plataforma, é necessário ativar um plano <span className="font-bold text-amber-400">Pro ou Premium</span>.
                            </>
                        ) : (
                            <>
                                Você já respondeu <span className="font-bold text-[#3ccfcf]">{trialLimit.count}</span> questionários de teste gratuitos.
                                Para continuar a testar o seu conhecimento e ter acesso a todos os módulos do aplicativo,
                                <span className="font-bold text-amber-400"> assine o plano Pro ou Premier</span>.
                            </>
                        )}
                    </p>

                    {/* Benefícios */}
                    <div className="bg-[#0a092d]/50 rounded-2xl p-5 mb-6 text-left border border-slate-700/50">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                            Com os planos Pro e Premier você terá:
                        </h3>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-3 text-slate-300">
                                <span className="text-[#3ccfcf]">✓</span>
                                <span>Questionários <span className="font-semibold text-white">ilimitados</span></span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <span className="text-[#3ccfcf]">✓</span>
                                <span>Acesso a <span className="font-semibold text-white">todas as trilhas</span> de conhecimento</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <span className="text-[#3ccfcf]">✓</span>
                                <span>Aulas Digitais e materiais complementares</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <span className="text-[#3ccfcf]">✓</span>
                                <span>Jogos educativos e flashcards</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <span className="text-[#3ccfcf]">✓</span>
                                <span>Suporte prioritário</span>
                            </li>
                        </ul>
                    </div>

                    {/* Botões de ação */}
                    <div className="space-y-3">
                        <button
                            onClick={() => onNavigate?.('plans')}
                            className="w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3 
                                bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-amber-500/30 hover:shadow-xl hover:scale-[1.02]"
                        >
                            <span>⭐</span>
                            Ver Planos Pro & Premier
                        </button>

                        <button
                            onClick={onExit}
                            className="w-full text-slate-400 py-3 font-medium hover:text-white transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <span>←</span>
                            Voltar ao Início
                        </button>
                    </div>

                    {/* Contato */}
                    <div className="mt-6 pt-6 border-t border-slate-700/50">
                        <p className="text-slate-500 text-sm">
                            Dúvidas? <a
                                href="https://wa.me/244934931225"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#3ccfcf] hover:underline"
                            >
                                Fale connosco via WhatsApp
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state - carregando quiz
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a092d] via-[#1a1d3a] to-[#0a092d] flex flex-col items-center justify-center p-6 text-center">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-[#2e3856] border-t-[#3ccfcf] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">🧠</span>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mt-6">Preparando o Teste...</h2>
                <p className="text-slate-400 mt-2">Carregando {selectedQuestionCount} questões de {selectedCategory?.title}</p>
                <div className="mt-4 text-slate-500 text-sm">Isso pode levar alguns segundos</div>
            </div>
        );
    }

    // Configuration screen
    if (showConfig) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a092d] via-[#1a1d3a] to-[#0a092d] flex flex-col items-center justify-center p-4 md:p-6">
                <div className="bg-[#2e3856]/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-2xl w-full border border-slate-700/50">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">🎯</div>
                        <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
                            Teste o seu Conhecimento
                        </h1>
                        <h2 className="text-lg md:text-xl text-[#3ccfcf] font-semibold mb-4">
                            para o Concurso MINSA 2026
                        </h2>
                        <p className="text-slate-400 text-sm md:text-base">
                            Configure o seu teste personalizado selecionando a trilha, tópico e quantidade de questões.
                        </p>

                        {/* Indicador de questionários gratuitos restantes */}
                        {!trialLimit.hasProPlan && (
                            <div className={`mt-4 px-4 py-3 rounded-xl border text-center ${trialLimit.remaining > 2
                                ? 'bg-[#3ccfcf]/10 border-[#3ccfcf]/30 text-[#3ccfcf]'
                                : trialLimit.remaining > 0
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                                }`}>
                                <div className="flex items-center justify-center gap-2 text-sm font-medium">
                                    <span>{trialLimit.remaining > 0 ? '🎁' : '⚠️'}</span>
                                    <span>
                                        {trialLimit.remaining > 0
                                            ? `Você tem ${trialLimit.remaining} questionário${trialLimit.remaining !== 1 ? 's' : ''} gratuito${trialLimit.remaining !== 1 ? 's' : ''} restante${trialLimit.remaining !== 1 ? 's' : ''}`
                                            : 'Limite de questionários gratuitos atingido'
                                        }
                                    </span>
                                </div>
                                {trialLimit.remaining > 0 && trialLimit.remaining <= 2 && (
                                    <button
                                        onClick={() => onNavigate?.('plans')}
                                        className="mt-1 text-xs opacity-80 hover:underline"
                                    >
                                        Assine o plano Pro para acesso ilimitado →
                                    </button>
                                )}
                            </div>
                        )}

                        {trialLimit.hasProPlan && (
                            <div className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/30 text-center">
                                <span className="text-purple-400 text-sm font-medium flex items-center justify-center gap-2">
                                    <span>⭐</span>
                                    <span>Acesso Ilimitado - Plano Pro/Premier Ativo</span>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Configuration Form */}
                    <div className="space-y-6">
                        {/* Step 1: Select Category/Trail */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wider">
                                <span className="w-6 h-6 rounded-full bg-[#3ccfcf] text-[#0a092d] flex items-center justify-center text-xs font-bold">1</span>
                                Trilha de Conhecimento
                            </label>
                            <select
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value as CategoryId)}
                                className="w-full bg-[#0a092d] border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-[#3ccfcf] text-lg transition-all"
                            >
                                <option value="">📚 Selecione uma trilha...</option>
                                {availableCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Step 2: Select Topic */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wider">
                                <span className="w-6 h-6 rounded-full bg-[#3ccfcf] text-[#0a092d] flex items-center justify-center text-xs font-bold">2</span>
                                Tópico (Opcional)
                            </label>
                            {loadingTopics ? (
                                <div className="flex items-center justify-center py-4 bg-[#0a092d] rounded-xl border border-slate-700">
                                    <div className="w-6 h-6 border-2 border-[#1a1d2e] border-t-[#3ccfcf] rounded-full animate-spin"></div>
                                    <span className="ml-2 text-slate-400">Carregando tópicos...</span>
                                </div>
                            ) : (
                                <select
                                    value={selectedTopic}
                                    onChange={(e) => setSelectedTopic(e.target.value)}
                                    disabled={!selectedCategoryId}
                                    className="w-full bg-[#0a092d] border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-[#3ccfcf] text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">🔀 Todos os tópicos</option>
                                    {availableTopics.map(topic => (
                                        <option key={topic} value={topic}>📌 {topic}</option>
                                    ))}
                                </select>
                            )}
                            {selectedCategoryId && availableTopics.length === 0 && !loadingTopics && (
                                <p className="text-amber-400 text-sm bg-amber-900/20 p-3 rounded-xl border border-amber-900/50 flex items-center gap-2">
                                    <span>💡</span>
                                    As questões serão carregadas de todos os tópicos disponíveis.
                                </p>
                            )}
                        </div>

                        {/* Step 3: Select Question Count */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wider">
                                <span className="w-6 h-6 rounded-full bg-[#3ccfcf] text-[#0a092d] flex items-center justify-center text-xs font-bold">3</span>
                                Quantidade de Questões
                            </label>
                            <div className="grid grid-cols-5 gap-2 md:gap-3">
                                {QUESTION_COUNT_OPTIONS.map(count => (
                                    <button
                                        key={count}
                                        onClick={() => setSelectedQuestionCount(count)}
                                        className={`py-3 md:py-4 rounded-xl font-bold text-lg transition-all duration-200 border-2
                                            ${selectedQuestionCount === count
                                                ? 'bg-[#3ccfcf] text-[#0a092d] border-[#3ccfcf] shadow-lg shadow-[#3ccfcf]/20 scale-105'
                                                : 'bg-[#0a092d] text-slate-300 border-slate-700 hover:border-[#3ccfcf]/50 hover:text-white'
                                            }`}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                            <p className="text-slate-500 text-sm text-center">
                                Tempo estimado: ~{Math.round(selectedQuestionCount * 1.5)} minutos
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 space-y-3">
                            <button
                                onClick={handleStartQuiz}
                                disabled={!selectedCategoryId}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2
                                    ${selectedCategoryId
                                        ? 'bg-gradient-to-r from-[#3ccfcf] to-[#2da8a8] text-[#0a092d] hover:shadow-[#3ccfcf]/30 hover:shadow-xl hover:scale-[1.02]'
                                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                <span>🚀</span>
                                Iniciar Teste
                            </button>

                            <button
                                onClick={onExit}
                                className="w-full text-slate-400 py-3 font-medium hover:text-white transition-colors text-sm flex items-center justify-center gap-2"
                            >
                                <span>←</span>
                                Voltar ao Início
                            </button>
                        </div>
                    </div>

                    {/* Info Footer */}
                    <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
                        <p className="text-slate-500 text-xs">
                            💡 As questões são baseadas em exames anteriores do MINSA e conteúdos alinhados ao Sistema Nacional de Saúde de Angola.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // No questions state
    if (!loading && !showConfig && questions.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a092d] via-[#1a1d3a] to-[#0a092d] flex flex-col items-center justify-center p-6 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h2 className="text-xl font-bold text-white">Nenhuma questão disponível</h2>
                <p className="text-slate-400 mt-2 mb-6">Não foi possível carregar as questões para este teste.</p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button onClick={handleNewTest} className="bg-[#3ccfcf] text-[#0a092d] px-6 py-3 rounded-xl font-bold hover:bg-[#2fbdbd] transition-colors">
                        Tentar Novamente
                    </button>
                    <button onClick={onExit} className="text-slate-400 py-2 hover:text-white">
                        Voltar ao Início
                    </button>
                </div>
            </div>
        );
    }

    // Completed state
    if (completed) {
        const percentage = Math.round((score / questions.length) * 100);
        const isApproved = percentage >= 60;

        const getResultMessage = () => {
            if (isApproved) {
                return {
                    emoji: '😊',
                    status: 'APROVADO',
                    text: percentage >= 90 ? 'Excelente!' : percentage >= 80 ? 'Muito Bom!' : 'Parabéns!',
                    color: 'text-green-400',
                    bgColor: 'bg-green-500/10',
                    borderColor: 'border-green-500/30'
                };
            }
            return {
                emoji: '😢',
                status: 'REPROVADO',
                text: 'Continue estudando!',
                color: 'text-red-400',
                bgColor: 'bg-red-500/10',
                borderColor: 'border-red-500/30'
            };
        };
        const result = getResultMessage();

        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a092d] via-[#1a1d3a] to-[#0a092d] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="bg-[#2e3856]/80 backdrop-blur-xl p-10 md:p-12 rounded-[2.5rem] shadow-2xl max-w-lg w-full border border-slate-700/50">
                    <div className="text-8xl mb-4">{result.emoji}</div>

                    {/* Status Badge - Aprovado/Reprovado */}
                    <div className={`inline-block px-8 py-3 rounded-2xl ${result.bgColor} border-2 ${result.borderColor} mb-6`}>
                        <span className={`text-2xl md:text-3xl font-display font-bold ${result.color}`}>
                            {result.status}
                        </span>
                    </div>

                    <h2 className="text-2xl font-display font-bold text-white mb-2">Teste Concluído!</h2>
                    <p className={`text-lg font-semibold ${result.color} mb-2`}>{result.text}</p>
                    <p className="text-slate-400 mb-6">
                        Você acertou <span className="font-bold text-white text-2xl">{score}</span> de <span className="font-bold text-white">{questions.length}</span> questões
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#0a092d] rounded-full h-4 mb-4 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ease-out ${isApproved ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between items-center mb-8">
                        <p className={`text-sm font-bold ${result.color}`}>{percentage}% de aproveitamento</p>
                        <p className="text-slate-500 text-sm">Mínimo: 60%</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-[#0a092d] rounded-xl p-4">
                            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Trilha</p>
                            <p className="text-white font-bold">{selectedCategory?.title}</p>
                        </div>
                        <div className="bg-[#0a092d] rounded-xl p-4">
                            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Questões</p>
                            <p className="text-white font-bold">{questions.length}</p>
                        </div>
                    </div>

                    {/* Mensagem de incentivo */}
                    {!isApproved && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                            <p className="text-amber-400 text-sm">
                                💪 Não desista! Revise o conteúdo e tente novamente. Você precisa de pelo menos 60% para ser aprovado.
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button onClick={handleRetry} className="w-full bg-[#0a092d] text-white py-3 rounded-xl font-bold hover:bg-[#1a1c2e] transition-colors border border-slate-700">
                            🔄 Repetir Teste
                        </button>
                        <button onClick={handleNewTest} className="w-full bg-gradient-to-r from-[#3ccfcf] to-[#2da8a8] text-[#0a092d] py-3 rounded-xl font-bold hover:shadow-lg transition-all">
                            ✨ Novo Teste
                        </button>
                        <button onClick={onExit} className="w-full text-slate-500 py-2 font-medium hover:text-slate-300 transition-colors text-sm">
                            ← Voltar ao Início
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    // Helper to determine style of options based on state
    const getOptionStyle = (letter: string, index: number) => {
        const isSelected = selectedOption === letter;
        const isCorrect = letter === currentQuestion.correta;

        let base = "w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center gap-4 border-2 outline-none group relative bg-[#2e3856] ";
        let numberBox = "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors border-2 ";

        if (!isAnswered) {
            if (isSelected) {
                return {
                    container: base + "border-[#3ccfcf] bg-[#2e3856]",
                    number: numberBox + "border-[#3ccfcf] bg-[#3ccfcf] text-[#0a092d]"
                };
            }
            return {
                container: base + "border-slate-600/50 hover:border-slate-500 hover:bg-[#343e5c]",
                number: numberBox + "border-slate-500/50 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-300"
            };
        } else {
            if (isCorrect) {
                return {
                    container: base + "border-[#18ae79] bg-[#18ae79]/10",
                    number: numberBox + "border-[#18ae79] bg-[#18ae79] text-white"
                };
            }
            if (isSelected && !isCorrect) {
                return {
                    container: base + "border-red-500 bg-red-500/10",
                    number: numberBox + "border-red-500 bg-red-500 text-white"
                };
            }
            return {
                container: base + "border-slate-700 opacity-50",
                number: numberBox + "border-slate-700 text-slate-600"
            };
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a092d] via-[#1a1d3a] to-[#0a092d] text-white font-sans flex flex-col items-center">

            {/* Top Navigation / Progress */}
            <div className="w-full max-w-6xl mx-auto px-4 pt-6 pb-2">
                <div className="flex items-center justify-between mb-2 px-2">
                    <button onClick={onExit} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="text-slate-500 text-sm hidden md:block">{selectedCategory?.title}</span>
                        <div className="font-bold text-[#3ccfcf] bg-[#3ccfcf]/10 px-4 py-1 rounded-full">{score} pts</div>
                    </div>
                </div>

                {/* Segmented Progress Bar */}
                <div className="flex items-center gap-2 w-full">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors shrink-0 
                        ${currentIndex >= 0 ? 'bg-[#3ccfcf] text-[#0a092d]' : 'bg-[#2e3856] text-slate-400'}`}>
                        {currentIndex + 1}
                    </div>

                    <div className="flex-1 flex gap-1 h-2">
                        <div className="w-full bg-[#2e3856] rounded-full h-full overflow-hidden relative">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3ccfcf] to-[#18ae79] transition-all duration-300"
                                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-[#2e3856] flex items-center justify-center text-sm font-bold text-slate-400 shrink-0">
                        {questions.length}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 flex flex-col justify-center">

                {/* Question Card */}
                <div className="bg-[#2e3856]/80 backdrop-blur-xl rounded-[2rem] p-6 md:p-10 shadow-2xl animate-slide-up relative overflow-hidden border border-slate-700/50">

                    {/* Label */}
                    <div className="flex items-center gap-2 mb-6 text-slate-400 text-sm font-bold uppercase tracking-widest">
                        <span>🎯 Teste MINSA 2026</span>
                        <span className="text-slate-600">•</span>
                        <span>Questão {currentIndex + 1}</span>
                        {isAnswered && (
                            <span className={selectedOption === currentQuestion.correta ? "text-[#18ae79]" : "text-red-500"}>
                                {selectedOption === currentQuestion.correta ? "✓ Correto" : "✕ Incorreto"}
                            </span>
                        )}
                    </div>

                    {/* Question Text */}
                    <h2 className="text-lg md:text-xl font-medium leading-relaxed text-white mb-10">
                        {currentQuestion.enunciado}
                    </h2>

                    {/* Divider Label */}
                    <div className="text-slate-400 text-sm font-bold mb-4">
                        Selecione uma resposta
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        {currentQuestion.alternativas.map((opt, idx) => {
                            const styles = getOptionStyle(opt.letra, idx);
                            return (
                                <button
                                    key={opt.letra}
                                    onClick={() => !isAnswered && setSelectedOption(opt.letra)}
                                    disabled={isAnswered}
                                    className={styles.container}
                                >
                                    <span className={styles.number}>
                                        {idx + 1}
                                    </span>
                                    <span className="flex-1 text-sm md:text-base font-medium text-slate-200 text-left">
                                        {opt.texto}
                                    </span>

                                    {/* Tick/X Icons */}
                                    {isAnswered && opt.letra === currentQuestion.correta && (
                                        <span className="text-[#18ae79] text-xl">✓</span>
                                    )}
                                    {isAnswered && selectedOption === opt.letra && selectedOption !== currentQuestion.correta && (
                                        <span className="text-red-500 text-xl">✕</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Explanation Section */}
                    {isAnswered && (
                        <div className="mt-8 pt-6 border-t border-slate-600/50 animate-fade-in">
                            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                <span>💡</span> Explicação:
                            </h4>
                            <p className="text-slate-300 leading-relaxed text-sm">
                                {currentQuestion.explicacao}
                            </p>
                        </div>
                    )}

                    {/* Next Button Action Area */}
                    <div className="mt-8 flex flex-col md:flex-row justify-end items-center gap-4">

                        {/* Reveal Hint / "Don't know" - Only show if not answered */}
                        {!isAnswered && !showHint && (
                            <button
                                onClick={() => setShowHint(true)}
                                className="text-slate-400 hover:text-white text-sm font-bold transition-colors flex items-center gap-2 order-2 md:order-1"
                            >
                                Não sabe a resposta?
                            </button>
                        )}

                        {showHint && !isAnswered && (
                            <div className="text-sm text-yellow-500 italic bg-yellow-500/10 p-3 rounded-xl px-4 border border-yellow-500/20 w-full md:w-auto order-1 md:order-1">
                                💡 Dica: {currentQuestion.dica || "Sem dica disponível."}
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            onClick={handleAction}
                            disabled={!selectedOption && !isAnswered}
                            className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg text-lg flex items-center gap-2 w-full md:w-auto justify-center order-1 md:order-2
                                ${!selectedOption && !isAnswered
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#3ccfcf] to-[#2da8a8] text-[#0a092d] hover:shadow-[#3ccfcf]/30 hover:shadow-xl'
                                }
                            `}
                        >
                            {isAnswered ? (
                                currentIndex < questions.length - 1 ? '→ Próxima' : '🏆 Ver Resultado'
                            ) : (
                                '✓ Responder'
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default KnowledgeTestArea;
