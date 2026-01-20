import React, { useState, useEffect } from 'react';
import { Category, Flashcard } from '../types';
import { generateFlashcards } from '../services/geminiService';
import { authService } from '../services/auth';

interface FlashcardAreaProps {
    category: Category;
    onExit: () => void;
}

const FlashcardArea: React.FC<FlashcardAreaProps> = ({ category, onExit }) => {
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [stats, setStats] = useState({ mastered: 0, review: 0 });
    const [resultsSent, setResultsSent] = useState(false);

    // Submit flashcard results when session is completed
    useEffect(() => {
        if (completed && !resultsSent && cards.length > 0) {
            const submitResults = async () => {
                try {
                    const headers = {
                        ...authService.getAuthHeaders(),
                        'Content-Type': 'application/json'
                    };
                    await fetch('http://localhost:3001/flashcards/result', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            category_id: category.id,
                            cards_reviewed: cards.length,
                            mastered: stats.mastered
                        })
                    });
                    console.log('[FlashcardArea] Results submitted successfully');
                    setResultsSent(true);
                } catch (error) {
                    console.error('[FlashcardArea] Failed to submit results:', error);
                }
            };
            submitResults();
        }
    }, [completed, resultsSent, cards.length, stats.mastered, category.id]);

    useEffect(() => {
        const loadCards = async () => {
            setLoading(true);
            try {
                const generated = await generateFlashcards(category.title, category.id);
                setCards(generated);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadCards();
    }, [category.title, category.id]);

    const handleLoadMore = async () => {
        setLoadingMore(true);
        try {
            const newCards = await generateFlashcards(category.title, category.id);

            setCards(prev => {
                // Create new IDs to avoid conflicts if AI generates duplicates
                const adjustedNewCards = newCards.map((c, i) => ({
                    ...c,
                    id: `${c.id}-more-${Date.now()}-${i}`
                }));
                return [...prev, ...adjustedNewCards];
            });

            // If we were in the completed state, go back to the view
            if (completed) {
                setCompleted(false);
                // Current index is already at the end, so it points to the first new card
            }
        } catch (error) {
            console.error("Failed to load more cards", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (currentIndex < cards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
        } else {
            setCompleted(true);
        }
    };

    const handlePrevious = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
        }
    };

    const handleRate = (status: 'mastered' | 'review') => {
        // Update stats
        setStats(prev => ({
            ...prev,
            [status]: prev[status] + 1
        }));

        // Update current card status locally (optional, for future persistence)
        const updatedCards = [...cards];
        updatedCards[currentIndex].status = status;
        setCards(updatedCards);

        // Reset and move next
        setIsFlipped(false);
        setTimeout(() => {
            if (currentIndex < cards.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setCompleted(true);
            }
        }, 200); // Wait for flip reset logic
    };

    const restart = () => {
        setStats({ mastered: 0, review: 0 });
        setCurrentIndex(0);
        setCompleted(false);
        setIsFlipped(false);
        setResultsSent(false); // Reset so new session can submit
        // Optionally shuffle cards here
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold text-slate-700">Carregando Flashcards...</h2>
                <p className="text-slate-500">Buscando flashcards de {category.title}</p>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">
                        🎉
                    </div>
                    <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Revisão Concluída!</h2>
                    <p className="text-slate-500 mb-8">Você revisou {cards.length} termos importantes.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Dominados</p>
                            <p className="text-3xl font-bold text-slate-900">{stats.mastered}</p>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Para Revisar</p>
                            <p className="text-3xl font-bold text-slate-900">{stats.review}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                            {loadingMore ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Carregando...
                                </>
                            ) : (
                                <>🔄 Carregar Mais Flashcards</>
                            )}
                        </button>
                        <button onClick={restart} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                            Revisar Novamente
                        </button>
                        <button onClick={onExit} className="w-full bg-white text-slate-600 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-colors">
                            Voltar ao Hub
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    if (!loading && cards.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h2 className="text-xl font-bold text-slate-700">Nenhum flashcard disponível</h2>
                <p className="text-slate-500 mb-6 max-w-md">
                    Não existem flashcards cadastrados para <strong>{category.title}</strong>.
                    Por favor, contacte o administrador para adicionar flashcards.
                </p>
                <button onClick={onExit} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                    Voltar ao Hub
                </button>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    const progress = ((currentIndex) / cards.length) * 100;

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm z-10">
                <button onClick={onExit} className="text-slate-500 hover:text-slate-900 font-medium text-sm flex items-center gap-2 w-20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Sair
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Flashcards • {category.title}</span>
                    <span className="text-sm font-bold text-slate-900">{currentIndex + 1} / {cards.length}</span>
                </div>
                <div className="w-20 flex justify-end">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-bold uppercase tracking-wider bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {loadingMore ? (
                            <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        ) : (
                            <span>+ Cards</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-200">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>

            {/* Card Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                {loadingMore && (
                    <div className="absolute top-4 bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-slide-up z-20 flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Adicionando novos termos...
                    </div>
                )}

                <div className="w-full max-w-5xl flex items-center justify-center gap-4 md:gap-8">
                    {/* Previous Button */}
                    <button
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className={`p-4 rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm transition-all
                        ${currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 hover:text-indigo-600 hover:scale-110 active:scale-95'}
                    `}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>

                    {/* The Card */}
                    <div
                        className="relative w-full max-w-xl aspect-[4/3] group cursor-pointer perspective-1000"
                        onClick={handleFlip}
                        style={{ perspective: '1000px' }}
                    >
                        <div
                            className={`relative w-full h-full duration-500 preserve-3d transition-all shadow-2xl rounded-[2rem] group-hover:scale-[1.02] group-hover:shadow-indigo-500/30`}
                            style={{
                                transformStyle: 'preserve-3d',
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                            }}
                        >
                            {/* Front */}
                            <div
                                className="absolute inset-0 bg-white rounded-[2rem] flex flex-col items-center justify-center p-8 text-center border border-slate-100"
                                style={{ backfaceVisibility: 'hidden' }}
                            >
                                <span className="absolute top-8 text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                                    Termo / Pergunta
                                </span>
                                <h3 className="text-3xl md:text-4xl font-display font-bold text-slate-800 leading-tight">
                                    {currentCard.front}
                                </h3>
                                <p className="absolute bottom-8 text-slate-400 text-sm font-medium animate-pulse">
                                    Toque para ver a resposta
                                </p>
                            </div>

                            {/* Back */}
                            <div
                                className="absolute inset-0 bg-indigo-600 rounded-[2rem] flex flex-col items-center justify-center p-10 text-center text-white"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)'
                                }}
                            >
                                <span className="absolute top-8 text-xs font-bold text-white/80 bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider">
                                    Definição / Resposta
                                </span>
                                <p className="text-xl md:text-2xl font-medium leading-relaxed">
                                    {currentCard.back}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={handleNext}
                        className="p-4 rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600 hover:scale-110 active:scale-95"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                {/* Controls */}
                <div className={`flex items-center gap-4 mt-12 transition-all duration-500 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleRate('review'); }}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-white border-2 border-amber-200 text-amber-500 flex items-center justify-center text-2xl shadow-sm group-hover:bg-amber-50 group-hover:scale-110 transition-all">
                            🤔
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-amber-600">Revisar</span>
                    </button>

                    <div className="w-px h-12 bg-slate-300 mx-4"></div>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleRate('mastered'); }}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-indigo-200 group-hover:bg-indigo-500 group-hover:scale-110 transition-all">
                            🧠
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-600">Dominei</span>
                    </button>
                </div>

                {!isFlipped && (
                    <div className="mt-12 text-slate-400 text-sm h-[88px] flex items-center">
                        (Vire o cartão para avaliar)
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlashcardArea;