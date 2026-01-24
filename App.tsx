import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import StudyArea from './components/StudyArea';
import LessonArea from './components/LessonArea';
import LessonSelector from './components/LessonSelector';
import { DigitalLesson } from './types/lesson';
import GameArea from './components/GameArea';
import FlashcardArea from './components/FlashcardArea';
import QuizArea from './components/QuizArea';
import DecipherGame from './components/DecipherGame';
import ConnectionGame from './components/ConnectionGame';
import CategoryHub from './components/CategoryHub';
import KnowledgeTestArea from './components/KnowledgeTestArea';
import AdminArea from './components/AdminArea';
import Pricing from './components/Pricing';
import Payment from './components/Payment';
import Profile from './components/Profile';
import { Login } from './components/Login';
import { UpdatePassword } from './components/UpdatePassword';
import { ViewState, Category, Topic } from './types';
import { MOCK_TOPICS, CATEGORIES } from './constants';
import { authService, setupSessionManager } from './services/auth';
import TermsAndPrivacy from './components/TermsAndPrivacy';
import HowItWorks from './components/HowItWorks';
import { EXEMPLO_AULA_POLITRAUMATIZADO } from './types/lessonExamples';

import { Preloader } from './components/Preloader';
import { IconSprite } from './components/icons';

const App: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [viewState, setViewState] = useState<ViewState>(ViewState.DASHBOARD);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<DigitalLesson | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<{ name: string, price: string } | null>(null);
    const [user, setUser] = useState<any>(null);
    const [sessionExpired, setSessionExpired] = useState(false);

    // Handler para sessão expirada
    const handleSessionExpired = useCallback(() => {
        console.log('[App] Session expired - redirecting to login');
        setSessionExpired(true);
        setUser(null);

        // Se não está no login ou update password, redirecionar
        if (viewState !== ViewState.LOGIN && viewState !== ViewState.UPDATE_PASSWORD) {
            setViewState(ViewState.LOGIN);
        }
    }, [viewState]);

    // Handler para logout
    const handleLogout = useCallback(() => {
        console.log('[App] User logged out');
        authService.logout();
        setUser(null);
        setSessionExpired(false);
        setViewState(ViewState.DASHBOARD);
    }, []);

    // Initialize Auth and setup session manager
    useEffect(() => {
        // Detectar rota de redefinição de senha OU hash de recuperação (magic link)
        const hash = window.location.hash;
        const isRecoveryHash = hash.includes('type=recovery');

        if (window.location.pathname === '/update-password' || isRecoveryHash) {
            console.log('Detectado fluxo de recuperação de senha');
            setViewState(ViewState.UPDATE_PASSWORD);
        }

        const currentUser = authService.getUser();
        if (currentUser) {
            setUser(currentUser);
        }

        // Setup session manager com callbacks
        const cleanup = setupSessionManager({
            onSessionExpired: handleSessionExpired,
            onSessionRefreshed: () => {
                console.log('[App] Session refreshed');
                // Atualizar user data se necessário
                const updatedUser = authService.getUser();
                if (updatedUser) {
                    setUser(updatedUser);
                }
            },
            onLogout: handleLogout
        });

        // Sync plan with server in background (apenas se autenticado)
        if (currentUser && authService.getToken()) {
            authService.refreshUserPlan().then(updatedUser => {
                if (updatedUser && updatedUser.plan !== currentUser.plan) {
                    setUser(updatedUser);
                }
            }).catch(err => {
                console.warn('Failed to sync user plan:', err);
            });
        }

        return cleanup;
    }, [handleSessionExpired, handleLogout]);

    if (loading) {
        return <Preloader onComplete={() => setLoading(false)} />;
    }

    // 1. Selection from Main Dashboard -> Goes to Category Hub or Login
    const handleSelectCategory = (category: Category) => {
        if (!user) {
            // Save intent and redirect to Login
            setSelectedCategory(category);
            setViewState(ViewState.LOGIN);
            return;
        }
        setSelectedCategory(category);
        setViewState(ViewState.CATEGORY_HUB);
    };

    // 2. Selection from Hub -> Goes to Study Area
    const handleSelectTopic = (topic: Topic) => {
        setSelectedTopic(topic);
        setViewState(ViewState.STUDY);

        // Ensure category context exists if coming from "Recent Topics"
        if (!selectedCategory) {
            const category = CATEGORIES.find(c => c.id === topic.categoryId);
            if (category) setSelectedCategory(category);
        }
    };

    // 3. Selection from Hub -> Goes to Game
    const handleEnterGame = () => {
        if (selectedCategory) {
            setViewState(ViewState.GAME);
        }
    }

    // 4. Selection from Hub -> Goes to Flashcards
    const handleEnterFlashcards = () => {
        if (selectedCategory) {
            setViewState(ViewState.FLASHCARDS);
        }
    }

    // 5. Selection from Hub -> Goes to Quiz
    const handleEnterQuiz = () => {
        if (selectedCategory) {
            setViewState(ViewState.QUIZ);
        }
    }

    // 6. Selection from Hub -> Goes to Decipher Game
    const handleEnterDecipher = () => {
        if (selectedCategory) {
            setViewState(ViewState.DECIPHER_GAME);
        }
    }

    // 6.5 Selection from Hub -> Goes to Connection Game
    const handleEnterConnectionGame = () => {
        if (selectedCategory) {
            setViewState(ViewState.CONNECTION_GAME);
        }
    }

    // 6.5 Selection from Hub -> Goes to Lesson (Sistema de Aulas Digitais)
    const handleEnterLesson = () => {
        if (selectedCategory) {
            setViewState(ViewState.LESSON_SELECTOR);
        }
    }

    const handleSelectLesson = (lesson: DigitalLesson) => {
        setSelectedLesson(lesson);
        setViewState(ViewState.LESSON);
    }

    // 7. Go to Admin
    const handleEnterAdmin = () => {
        if (!user || user.email !== 'arautyarafat@gmail.com') {
            alert('Acesso negado. Apenas administradores podem acessar esta área.');
            return;
        }
        setViewState(ViewState.ADMIN);
    };

    // 8. Go to Pricing
    const handleEnterPricing = () => {
        setViewState(ViewState.PRICING);
    };

    const handleSubscribe = (plan: { name: string, price: string }) => {
        setSelectedPlan(plan);
        setViewState(ViewState.PAYMENT);
    };

    // 9. Go to Profile
    const handleEnterProfile = () => {
        if (user) {
            setViewState(ViewState.PROFILE);
        }
    };

    // 10. Navigation to Terms
    const handleEnterTerms = () => {
        setViewState(ViewState.TERMS);
    };

    // 11. Navigation to How It Works
    const handleEnterHowItWorks = () => {
        setViewState(ViewState.HOW_IT_WORKS);
    };

    // 12. Navigation to Knowledge Test (MINSA 2026)
    const handleEnterKnowledgeTest = () => {
        setViewState(ViewState.KNOWLEDGE_TEST);
    };

    // 12. Logout - agora usa o callback handleLogout definido acima

    // Navigation Handlers
    const handleBackToDashboard = () => {
        setViewState(ViewState.DASHBOARD);
        setSelectedCategory(null);
        setSelectedTopic(null);
    };

    const handleBackToHub = () => {
        if (selectedCategory) {
            setViewState(ViewState.CATEGORY_HUB);
            setSelectedTopic(null);
        } else {
            // Fallback if state is lost
            handleBackToDashboard();
        }
    };

    const headerProps = {
        user,
        onLogin: () => setViewState(ViewState.LOGIN),
        onLogout: handleLogout,
        onEnterAdmin: handleEnterAdmin,
        onEnterPricing: handleEnterPricing,
        onEnterProfile: handleEnterProfile,
        onEnterHowItWorks: handleEnterHowItWorks,
        onSelectCategory: handleSelectCategory,
        onGoHome: handleBackToDashboard
    };

    return (
        // Applied global font, text color, and background to ensure full-page consistency
        <div className="font-sans text-slate-900 bg-slate-50 min-h-screen flex flex-col">
            {/* SVG Sprite - definições de ícones disponíveis globalmente */}
            <IconSprite />

            {viewState === ViewState.DASHBOARD && (
                <Dashboard
                    onSelectCategory={handleSelectCategory}
                    onSelectTopic={handleSelectTopic}
                    onEnterAdmin={handleEnterAdmin}
                    onLogin={() => setViewState(ViewState.LOGIN)}
                    onEnterPricing={handleEnterPricing}
                    onEnterProfile={handleEnterProfile}
                    onEnterTerms={handleEnterTerms}
                    onEnterHowItWorks={handleEnterHowItWorks}
                    onEnterKnowledgeTest={handleEnterKnowledgeTest}
                    onLogout={handleLogout}
                    user={user}
                />
            )}

            {viewState === ViewState.TERMS && (
                <TermsAndPrivacy
                    onBack={handleBackToDashboard}
                />
            )}

            {viewState === ViewState.HOW_IT_WORKS && (
                <HowItWorks
                    onBack={handleBackToDashboard}
                    onStart={() => setViewState(ViewState.DASHBOARD)}
                    headerProps={headerProps}
                />
            )}

            {viewState === ViewState.LOGIN && (
                <Login
                    onLoginSuccess={(userData) => {
                        setUser(userData);
                        // If user was trying to access a category, go there. Otherwise Dashboard.
                        if (selectedCategory) {
                            setViewState(ViewState.CATEGORY_HUB);
                        } else {
                            setViewState(ViewState.DASHBOARD);
                        }
                    }}
                    onBack={handleBackToDashboard}
                />
            )}

            {viewState === ViewState.UPDATE_PASSWORD && (
                <UpdatePassword
                    onSuccess={() => setViewState(ViewState.LOGIN)}
                />
            )}

            {viewState === ViewState.PROFILE && user && (
                <Profile
                    user={user}
                    onBack={handleBackToDashboard}
                    onLogout={handleLogout}
                    onEnterPricing={handleEnterPricing}
                />
            )}

            {viewState === ViewState.PRICING && (
                <Pricing
                    onBack={handleBackToDashboard}
                    onSubscribe={handleSubscribe}
                    headerProps={headerProps}
                />
            )}

            {viewState === ViewState.PAYMENT && (
                <Payment
                    onBack={() => setViewState(ViewState.PRICING)}
                    planName={selectedPlan?.name}
                    planPrice={selectedPlan?.price}
                    user={user}
                    headerProps={headerProps}
                />
            )}

            {viewState === ViewState.CATEGORY_HUB && selectedCategory && (
                <CategoryHub
                    category={selectedCategory}
                    categories={CATEGORIES}
                    onSelectCategory={handleSelectCategory}
                    onEnterGame={handleEnterGame}
                    onEnterFlashcards={handleEnterFlashcards}
                    onEnterQuiz={handleEnterQuiz}
                    onEnterDecipher={handleEnterDecipher}
                    onEnterConnectionGame={handleEnterConnectionGame}
                    onEnterLesson={handleEnterLesson}
                    onBack={handleBackToDashboard}
                    onEnterPricing={handleEnterPricing}
                />
            )}

            {viewState === ViewState.STUDY && selectedTopic && selectedCategory && (
                <StudyArea
                    category={selectedCategory}
                    topic={selectedTopic}
                    onBack={handleBackToHub}
                />
            )}

            {viewState === ViewState.LESSON_SELECTOR && selectedCategory && (
                <LessonSelector
                    category={selectedCategory}
                    onSelectLesson={handleSelectLesson}
                    onBack={handleBackToHub}
                />
            )}

            {viewState === ViewState.LESSON && selectedCategory && selectedLesson && (
                <LessonArea
                    category={selectedCategory}
                    lesson={selectedLesson}
                    onBack={() => setViewState(ViewState.LESSON_SELECTOR)}
                />
            )}

            {viewState === ViewState.GAME && selectedCategory && (
                <GameArea
                    category={selectedCategory}
                    onExit={handleBackToHub}
                />
            )}

            {viewState === ViewState.FLASHCARDS && selectedCategory && (
                <FlashcardArea
                    category={selectedCategory}
                    onExit={handleBackToHub}
                />
            )}

            {viewState === ViewState.QUIZ && selectedCategory && (
                <QuizArea
                    category={selectedCategory}
                    onExit={handleBackToHub}
                />
            )}

            {viewState === ViewState.DECIPHER_GAME && selectedCategory && (
                <DecipherGame
                    category={selectedCategory}
                    onExit={handleBackToHub}
                />
            )}

            {viewState === ViewState.CONNECTION_GAME && selectedCategory && (
                <ConnectionGame
                    category={selectedCategory}
                    onExit={handleBackToHub}
                />
            )}

            {viewState === ViewState.ADMIN && (
                <AdminArea onBack={handleBackToDashboard} />
            )}

            {viewState === ViewState.KNOWLEDGE_TEST && (
                <KnowledgeTestArea
                    onExit={handleBackToDashboard}
                    onNavigate={(page) => {
                        if (page === 'plans') {
                            setViewState(ViewState.PRICING);
                        } else if (page === 'login') {
                            setViewState(ViewState.LOGIN);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default App;