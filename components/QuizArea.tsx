import React, { useState, useEffect } from 'react';
import { Category, GeneratedQuestion } from '../types';
import { generateGeneralQuiz } from '../services/geminiService';
import { authService } from '../services/auth';

interface QuizAreaProps {
    category: Category;
    onExit: () => void;
}

const QuizArea: React.FC<QuizAreaProps> = ({ category, onExit }) => {
    const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [score, setScore] = useState(0);
    const [completed, setCompleted] = useState(false);

    // Topic selection state
    const [availableTopics, setAvailableTopics] = useState<string[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [loadingTopics, setLoadingTopics] = useState(true);
    const [showTopicSelection, setShowTopicSelection] = useState(true);

    // Submit quiz results when completed
    useEffect(() => {
        if (completed && questions.length > 0) {
            const submitResults = async () => {
                try {
                    const headers = {
                        ...authService.getAuthHeaders(),
                        'Content-Type': 'application/json'
                    };
                    await fetch('http://localhost:3001/quiz/result', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            category_id: category.id,
                            topic: selectedTopic || category.title,
                            score: score,
                            total_questions: questions.length
                        })
                    });
                    console.log('[QuizArea] Results submitted successfully');
                } catch (error) {
                    console.error('[QuizArea] Failed to submit results:', error);
                }
            };
            submitResults();
        }
    }, [completed]);

    // Fetch available topics for the category
    useEffect(() => {
        const fetchTopics = async () => {
            setLoadingTopics(true);
            try {
                const response = await fetch(`http://localhost:3001/topics?category_id=${category.id}`);
                const data = await response.json();
                if (data.data) {
                    setAvailableTopics(data.data);
                }
            } catch (e) {
                console.error('Failed to fetch topics:', e);
            } finally {
                setLoadingTopics(false);
            }
        };
        fetchTopics();
    }, [category.id]);

    const loadQuiz = async (topicFilter?: string) => {
        setLoading(true);
        setCompleted(false);
        setScore(0);
        setCurrentIndex(0);
        setIsAnswered(false);
        setSelectedOption(null);
        setShowTopicSelection(false);

        try {
            const generated = await generateGeneralQuiz(category.title, category.id, topicFilter);
            setQuestions(generated);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartQuiz = () => {
        const topicFilter = selectedTopic === '' ? undefined : selectedTopic;
        loadQuiz(topicFilter);
    };

    const handleRetry = () => {
        setScore(0);
        setCurrentIndex(0);
        setIsAnswered(false);
        setSelectedOption(null);
        setCompleted(false);
        setShowHint(false);
    };

    const handleNewQuiz = () => {
        setShowTopicSelection(true);
        setQuestions([]);
        setSelectedTopic('');
    };

    const handleAction = () => {
        if (!isAnswered) {
            // If no option selected, do nothing
            if (!selectedOption) return;

            // Check Answer
            setIsAnswered(true);
            if (selectedOption === currentQuestion.correta) {
                setScore(prev => prev + 1);
            }
        } else {
            // Next Question
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsAnswered(false);
                setShowHint(false);
            } else {
                setCompleted(true);
            }
        }
    };

    // Auto-advance if correct answer? No, user usually wants to see feedback.
    // The previous implementation required clicking "Next". Keeping that.

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a092d] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 border-4 border-[#2e3856] border-t-[#18ae79] rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold text-white">Carregando Questionário...</h2>
                <p className="text-slate-400 mt-2">Buscando questões de {category.title}</p>
            </div>
        );
    }

    if (showTopicSelection) {
        return (
            <div className="min-h-screen bg-[#0a092d] flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-[#2e3856] p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full border border-slate-700/50">
                    <div className="text-6xl mb-6">📝</div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2">Questionário de {category.title}</h2>
                    <p className="text-slate-400 mb-8">Selecione um tópico para filtrar as questões.</p>

                    {loadingTopics ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-4 border-[#1a1d2e] border-t-[#18ae79] rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <select
                                value={selectedTopic}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                className="w-full bg-[#0a092d] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#18ae79] text-lg"
                            >
                                <option value="">🔀 Todos os tópicos</option>
                                {availableTopics.map(topic => (
                                    <option key={topic} value={topic}>📌 {topic}</option>
                                ))}
                            </select>

                            {availableTopics.length === 0 && (
                                <p className="text-amber-400 text-sm bg-amber-900/20 p-3 rounded-xl border border-amber-900/50">
                                    💡 As questões serão carregadas sem filtro.
                                </p>
                            )}

                            <button
                                onClick={handleStartQuiz}
                                className="w-full bg-[#3ccfcf] text-[#0a092d] py-4 rounded-xl font-bold hover:bg-[#2fbdbd] transition-colors shadow-lg text-lg"
                            >
                                🚀 Iniciar
                            </button>

                            <button
                                onClick={onExit}
                                className="w-full text-slate-400 py-2 font-medium hover:text-white transition-colors text-sm"
                            >
                                ← Voltar ao Hub
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // No questions state
    if (!loading && !showTopicSelection && questions.length === 0) {
        return (
            <div className="min-h-screen bg-[#0a092d] flex flex-col items-center justify-center p-6 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h2 className="text-xl font-bold text-white">Nenhuma questão disponível</h2>
                <div className="flex flex-col gap-3 w-full max-w-xs mt-8">
                    <button onClick={handleNewQuiz} className="bg-[#3ccfcf] text-[#0a092d] px-6 py-3 rounded-xl font-bold hover:bg-[#2fbdbd] transition-colors">
                        Tentar Outro
                    </button>
                    <button onClick={onExit} className="text-slate-400 py-2 hover:text-white">
                        Sair
                    </button>
                </div>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="min-h-screen bg-[#0a092d] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="bg-[#2e3856] p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full border border-slate-700/50">
                    <div className="text-6xl mb-6">🏆</div>
                    <h2 className="text-3xl font-display font-bold text-white mb-2">Simulado Concluído</h2>
                    <p className="text-slate-400 mb-8">Você acertou <span className="font-bold text-white">{score}</span> de {questions.length} questões.</p>

                    <div className="w-full bg-[#0a092d] rounded-full h-4 mb-8 overflow-hidden">
                        <div
                            className="h-full bg-[#18ae79] transition-all duration-1000 ease-out"
                            style={{ width: `${(score / questions.length) * 100}%` }}
                        ></div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={handleRetry} className="w-full bg-[#0a092d] text-white py-3 rounded-xl font-bold hover:bg-[#1a1c2e] transition-colors border border-slate-700">
                            Repetir Jogo
                        </button>
                        <button onClick={handleNewQuiz} className="w-full bg-[#3ccfcf] text-[#0a092d] py-3 rounded-xl font-bold hover:bg-[#2fbdbd] transition-colors">
                            Novo Questionário
                        </button>
                        <button onClick={onExit} className="w-full text-slate-500 py-2 font-medium hover:text-slate-300 transition-colors text-sm">
                            Sair
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

        // Base
        let base = "w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center gap-4 border-2 outline-none group relative bg-[#2e3856] ";
        let numberBox = "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors border-2 ";

        if (!isAnswered) {
            if (isSelected) {
                // Selected state (before confirming) - Blue border like standard selection
                return {
                    container: base + "border-[#3ccfcf] bg-[#2e3856]",
                    number: numberBox + "border-[#3ccfcf] bg-[#3ccfcf] text-[#0a092d]"
                };
            }
            // Default state
            return {
                container: base + "border-slate-600/50 hover:border-slate-500 hover:bg-[#343e5c]",
                number: numberBox + "border-slate-500/50 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-300"
            };
        } else {
            // Answered state logic
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
            // Dim others
            return {
                container: base + "border-slate-700 opacity-50",
                number: numberBox + "border-slate-700 text-slate-600"
            };
        }
    };

    return (
        <div className="min-h-screen bg-[#0a092d] text-white font-sans flex flex-col items-center">

            {/* Top Navigation / Progress */}
            <div className="w-full max-w-6xl mx-auto px-4 pt-6 pb-2">
                <div className="flex items-center justify-between mb-2 px-2">
                    <button onClick={onExit} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="font-bold text-slate-400">{score} pts</div>
                </div>

                {/* Segmented Progress Bar */}
                <div className="flex items-center gap-2 w-full">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors shrink-0 
                        ${currentIndex >= 0 ? 'bg-[#18ae79] text-white' : 'bg-[#2e3856] text-slate-400'}`}>
                        {currentIndex + 1}
                    </div>

                    <div className="flex-1 flex gap-1 h-2">
                        <div className="w-full bg-[#2e3856] rounded-full h-full overflow-hidden relative">
                            <div
                                className="absolute top-0 left-0 h-full bg-[#18ae79] transition-all duration-300"
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
                <div className="bg-[#2e3856] rounded-[2rem] p-8 md:p-12 shadow-2xl animate-slide-up relative overflow-hidden">

                    {/* Label */}
                    <div className="flex items-center gap-2 mb-6 text-slate-400 text-sm font-bold uppercase tracking-widest">
                        <span>Definição</span>
                        <span className="text-slate-600">•</span>
                        <span>Questão {currentIndex + 1}</span>
                        {isAnswered && (
                            <span className={selectedOption === currentQuestion.correta ? "text-[#18ae79]" : "text-red-500"}>
                                {selectedOption === currentQuestion.correta ? "Correto" : "Incorreto"}
                            </span>
                        )}
                    </div>

                    {/* Question Text */}
                    <h2 className="text-xl md:text-2xl font-medium leading-relaxed text-white mb-12">
                        {currentQuestion.enunciado}
                    </h2>

                    {/* Divider Label */}
                    <div className="text-slate-400 text-sm font-bold mb-4">
                        Selecione uma resposta
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <span className="flex-1 text-base font-medium text-slate-200 text-left">
                                        {opt.texto}
                                    </span>

                                    {/* Tick/X Icons */}
                                    {isAnswered && opt.letra === currentQuestion.correta && (
                                        <span className="text-[#18ae79]">✓</span>
                                    )}
                                    {isAnswered && selectedOption === opt.letra && selectedOption !== currentQuestion.correta && (
                                        <span className="text-red-500">✕</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Explanation Section */}
                    {isAnswered && (
                        <div className="mt-8 pt-6 border-t border-slate-600/50 animate-fade-in">
                            <h4 className="font-bold text-white mb-2">Explicação:</h4>
                            <p className="text-slate-300 leading-relaxed text-sm">
                                {currentQuestion.explicacao}
                            </p>
                        </div>
                    )}

                    {/* Next Button Action Area */}
                    <div className="mt-8 flex justify-end items-center gap-4">

                        {/* Reveal Hint / "Don't know" - Only show if not answered */}
                        {!isAnswered && !showHint && (
                            <button
                                onClick={() => setShowHint(true)}
                                className="text-slate-400 hover:text-white text-sm font-bold transition-colors flex items-center gap-2 ml-auto md:ml-0"
                            >
                                Não sabe a resposta?
                            </button>
                        )}

                        {showHint && !isAnswered && (
                            <div className="text-sm text-yellow-500 italic bg-yellow-500/10 p-2 rounded px-4 ml-auto border border-yellow-500/20">
                                💡 Dica: {currentQuestion.dica || "Sem dica disponível."}
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            onClick={handleAction}
                            disabled={!selectedOption && !isAnswered} // Allow next if answered
                            className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg text-lg flex items-center gap-2
                                ${!selectedOption && !isAnswered
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed hidden' // Hide if not actionable
                                    : 'bg-[#3ccfcf] text-[#0a092d] hover:bg-[#2fbdbd] ml-auto'
                                }
                            `}
                        >
                            {isAnswered ? (
                                currentIndex < questions.length - 1 ? 'Próxima' : 'Ver Resultado'
                            ) : (
                                'Responder'
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default QuizArea;