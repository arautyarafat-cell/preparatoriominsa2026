import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';

interface ProfileProps {
    user: any;
    onBack: () => void;
    onLogout: () => void;
    onEnterPricing?: () => void;
}

interface QuizResult {
    id: string;
    category: string;
    score: number;
    total: number;
    date: string;
}

interface FlashcardSession {
    id: string;
    category: string;
    cardsReviewed: number;
    mastered: number;
    date: string;
}

interface UserPlanInfo {
    plan: string;
    plan_activated_at: string | null;
}

const Profile: React.FC<ProfileProps> = ({ user, onBack, onLogout, onEnterPricing }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'quizzes' | 'flashcards' | 'plan'>('overview');
    const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
    const [flashcardHistory, setFlashcardHistory] = useState<FlashcardSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [userPlanInfo, setUserPlanInfo] = useState<UserPlanInfo>({ plan: 'free', plan_activated_at: null });
    const [loadingPlan, setLoadingPlan] = useState(true);

    // Fetch user plan from backend
    useEffect(() => {
        const fetchUserPlan = async () => {
            if (user?.email) {
                setLoadingPlan(true);
                try {
                    const response = await fetch(`http://localhost:3001/user/plan/${encodeURIComponent(user.email)}`);
                    if (response.ok) {
                        const data = await response.json();
                        setUserPlanInfo(data);
                    }
                } catch (error) {
                    console.error('Error fetching user plan:', error);
                } finally {
                    setLoadingPlan(false);
                }
            }
        };
        fetchUserPlan();
    }, [user?.email]);

    // Fetch user activity history
    useEffect(() => {
        setLoading(true);
        // TODO: Replace with real API call to fetch user history
        // For now using empty arrays since there's no backend for this yet
        setTimeout(() => {
            setQuizHistory([]);
            setFlashcardHistory([]);
            setLoading(false);
        }, 300);
    }, []);

    // Plan display data based on actual plan
    const getPlanDetails = () => {
        switch (userPlanInfo.plan) {
            case 'premier':
            case 'premium':
                return {
                    name: 'Premium',
                    price: '3.000 KZ',
                    period: 'mês',
                    status: 'Ativo',
                    color: 'purple',
                    features: [
                        'Acesso a TODAS as Trilhas',
                        'Simulados Ilimitados',
                        'Flashcards Ilimitados',
                        'Aulas Digitais Completas',
                        'Jogos Clínicos',
                        'Suporte Prioritário'
                    ]
                };
            case 'pro':
                return {
                    name: 'Pro',
                    price: '2.500 KZ',
                    period: 'mês',
                    status: 'Ativo',
                    color: 'brand',
                    features: [
                        'Acesso a TODAS as Trilhas',
                        'Simulados Ilimitados',
                        'Flashcards Ilimitados',
                        'Aulas Digitais',
                        'Jogos Clínicos'
                    ]
                };
            case 'lite':
                return {
                    name: 'Lite',
                    price: '2.000 KZ',
                    period: 'mês',
                    status: 'Ativo',
                    color: 'blue',
                    features: [
                        'Acesso a 1 Trilha',
                        'Simulados Básicos',
                        'Flashcards Limitados',
                        'Aulas Digitais Básicas'
                    ]
                };
            default:
                return {
                    name: 'Gratuito',
                    price: '0 KZ',
                    period: 'sempre',
                    status: 'Ativo',
                    color: 'slate',
                    features: [
                        'Visualização de Trilhas',
                        'Acesso limitado ao conteúdo'
                    ]
                };
        }
    };

    const planDetails = getPlanDetails();
    const isPremium = ['lite', 'pro', 'premier', 'premium'].includes(userPlanInfo.plan);

    const tabs = [
        { id: 'overview', label: 'Visão Geral', icon: '👤' },
        { id: 'quizzes', label: 'Histórico de Quizzes', icon: '📝' },
        { id: 'flashcards', label: 'Histórico de Flashcards', icon: '🃏' },
        { id: 'plan', label: 'Meu Plano', icon: '💳' },
    ];

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Background Decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[300px] -right-[300px] w-[800px] h-[800px] bg-brand-100/30 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute top-[20%] -left-[200px] w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-3xl opacity-50"></div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        <span className="font-bold text-sm">Voltar</span>
                    </button>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors bg-red-50 px-4 py-2 rounded-xl border border-red-100"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        <span className="font-bold text-sm">Sair</span>
                    </button>
                </div>

                {/* Profile Header */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 mb-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                            {user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">
                                {user?.email?.split('@')[0] || 'Usuário'}
                            </h1>
                            <p className="text-slate-500">{user?.email}</p>
                            <div className="mt-3 flex items-center justify-center md:justify-start gap-2 flex-wrap">
                                {loadingPlan ? (
                                    <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                                        Carregando...
                                    </span>
                                ) : (
                                    <>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${userPlanInfo.plan === 'premier' ? 'bg-purple-100 text-purple-700' :
                                            userPlanInfo.plan === 'pro' ? 'bg-brand-100 text-brand-700' :
                                                userPlanInfo.plan === 'lite' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            Plano {planDetails.name}
                                        </span>
                                        {isPremium && (
                                            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                                                {planDetails.status}
                                            </span>
                                        )}
                                        {!isPremium && (
                                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
                                                Acesso Limitado
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        {user?.id && (
                            <div className="text-right hidden md:block">
                                <p className="text-xs text-slate-400 mb-1">ID do Usuário</p>
                                <p className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded">{user.id.substring(0, 8)}...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div>
                                    <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">Visão Geral</h2>

                                    {/* Account Info */}
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4">Informações da Conta</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-slate-500 mb-1">Email</p>
                                                <p className="font-medium text-slate-900">{user?.email || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500 mb-1">Plano Atual</p>
                                                <p className="font-medium text-slate-900">{planDetails.name}</p>
                                            </div>
                                            {userPlanInfo.plan_activated_at && (
                                                <div>
                                                    <p className="text-sm text-slate-500 mb-1">Plano Ativado em</p>
                                                    <p className="font-medium text-slate-900">{formatDate(userPlanInfo.plan_activated_at)}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm text-slate-500 mb-1">Status</p>
                                                <p className={`font-medium ${isPremium ? 'text-green-600' : 'text-amber-600'}`}>
                                                    {isPremium ? 'Assinante Ativo' : 'Conta Gratuita'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                                            <p className="text-blue-600 text-sm font-bold uppercase tracking-wider mb-2">Quizzes Completos</p>
                                            <p className="text-4xl font-display font-bold text-blue-900">{quizHistory.length}</p>
                                        </div>
                                        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                                            <p className="text-purple-600 text-sm font-bold uppercase tracking-wider mb-2">Flashcards Revisados</p>
                                            <p className="text-4xl font-display font-bold text-purple-900">
                                                {flashcardHistory.reduce((acc, s) => acc + s.cardsReviewed, 0)}
                                            </p>
                                        </div>
                                        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                                            <p className="text-emerald-600 text-sm font-bold uppercase tracking-wider mb-2">Taxa de Acerto Média</p>
                                            <p className="text-4xl font-display font-bold text-emerald-900">
                                                {quizHistory.length > 0
                                                    ? Math.round((quizHistory.reduce((acc, q) => acc + (q.score / q.total) * 100, 0) / quizHistory.length))
                                                    : 0}%
                                            </p>
                                        </div>
                                    </div>

                                    {quizHistory.length > 0 && (
                                        <div className="mt-8">
                                            <h3 className="text-lg font-bold text-slate-900 mb-4">Atividade Recente</h3>
                                            <div className="space-y-3">
                                                {quizHistory.slice(0, 3).map(quiz => (
                                                    <div key={quiz.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">📝</span>
                                                            <div>
                                                                <p className="font-bold text-slate-900">Quiz de {quiz.category}</p>
                                                                <p className="text-sm text-slate-500">{quiz.date}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`font-bold ${quiz.score / quiz.total >= 0.7 ? 'text-green-600' : 'text-amber-600'}`}>
                                                            {quiz.score}/{quiz.total}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {quizHistory.length === 0 && flashcardHistory.length === 0 && (
                                        <div className="mt-8 text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                                            <span className="text-4xl mb-4 block">📊</span>
                                            <p className="text-slate-500">Você ainda não tem atividade registrada.</p>
                                            <p className="text-sm text-slate-400 mt-1">Complete quizzes e flashcards para ver seu progresso aqui.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quizzes Tab */}
                            {activeTab === 'quizzes' && (
                                <div>
                                    <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">Histórico de Quizzes</h2>
                                    {quizHistory.length === 0 ? (
                                        <div className="text-center py-16 bg-slate-50 rounded-2xl">
                                            <span className="text-5xl mb-4 block">📝</span>
                                            <p className="text-slate-500 text-lg">Nenhum quiz realizado ainda.</p>
                                            <p className="text-sm text-slate-400 mt-2">Complete quizzes para ver seu histórico aqui.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {quizHistory.map(quiz => (
                                                <div key={quiz.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">📝</div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-lg">{quiz.category}</p>
                                                            <p className="text-sm text-slate-500">{quiz.date}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-2xl font-bold ${quiz.score / quiz.total >= 0.7 ? 'text-green-600' : 'text-amber-600'}`}>
                                                            {Math.round((quiz.score / quiz.total) * 100)}%
                                                        </p>
                                                        <p className="text-sm text-slate-500">{quiz.score} de {quiz.total} corretas</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Flashcards Tab */}
                            {activeTab === 'flashcards' && (
                                <div>
                                    <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">Histórico de Flashcards</h2>
                                    {flashcardHistory.length === 0 ? (
                                        <div className="text-center py-16 bg-slate-50 rounded-2xl">
                                            <span className="text-5xl mb-4 block">🃏</span>
                                            <p className="text-slate-500 text-lg">Nenhuma sessão de flashcards ainda.</p>
                                            <p className="text-sm text-slate-400 mt-2">Revise flashcards para ver seu progresso aqui.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {flashcardHistory.map(session => (
                                                <div key={session.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">🃏</div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-lg">{session.category}</p>
                                                            <p className="text-sm text-slate-500">{session.date}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-purple-600">{session.mastered}/{session.cardsReviewed}</p>
                                                        <p className="text-sm text-slate-500">cartões dominados</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Plan Tab */}
                            {activeTab === 'plan' && (
                                <div>
                                    <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">Meu Plano</h2>

                                    {loadingPlan ? (
                                        <div className="flex items-center justify-center py-20">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`rounded-3xl p-8 text-white mb-8 ${userPlanInfo.plan === 'premier' ? 'bg-gradient-to-br from-purple-900 to-purple-700' :
                                                userPlanInfo.plan === 'pro' ? 'bg-gradient-to-br from-brand-700 to-brand-500' :
                                                    userPlanInfo.plan === 'lite' ? 'bg-gradient-to-br from-blue-800 to-blue-600' :
                                                        'bg-gradient-to-br from-slate-700 to-slate-500'
                                                }`}>
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <p className="text-white/60 text-sm uppercase tracking-wider mb-1">Plano Atual</p>
                                                        <h3 className="text-3xl font-display font-bold">{planDetails.name}</h3>
                                                    </div>
                                                    <span className={`text-sm font-bold px-4 py-2 rounded-full border ${isPremium
                                                        ? 'bg-green-500/20 text-green-300 border-green-400/30'
                                                        : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                                                        }`}>
                                                        {isPremium ? 'Ativo' : 'Gratuito'}
                                                    </span>
                                                </div>
                                                <div className="flex items-baseline gap-1 mb-6">
                                                    <span className="text-4xl font-bold">{planDetails.price}</span>
                                                    <span className="text-white/60">/{planDetails.period}</span>
                                                </div>
                                                {userPlanInfo.plan_activated_at && (
                                                    <p className="text-white/60 text-sm mb-6">
                                                        Ativado em: <span className="text-white font-bold">{formatDate(userPlanInfo.plan_activated_at)}</span>
                                                    </p>
                                                )}
                                                <div className="border-t border-white/20 pt-6">
                                                    <p className="text-sm text-white/60 mb-3">Recursos inclusos:</p>
                                                    <ul className="space-y-2">
                                                        {planDetails.features.map((feature, i) => (
                                                            <li key={i} className="flex items-center gap-2 text-sm">
                                                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                {feature}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            {!isPremium && onEnterPricing && (
                                                <div className="bg-gradient-to-r from-brand-50 to-indigo-50 rounded-2xl p-6 border border-brand-100">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="font-bold text-brand-900 mb-1">Desbloqueie todo o conteúdo!</h4>
                                                            <p className="text-brand-600 text-sm">Faça upgrade para ter acesso a Aulas, Quizzes, Flashcards e muito mais.</p>
                                                        </div>
                                                        <button
                                                            onClick={onEnterPricing}
                                                            className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                                        >
                                                            Ver Planos
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {isPremium && (
                                                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-emerald-900">Você tem acesso completo!</h4>
                                                            <p className="text-emerald-600 text-sm">Aproveite todos os recursos disponíveis na plataforma.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
