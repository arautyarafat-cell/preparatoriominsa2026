import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ConnectionGame.css';
import { Category } from '../types';
import { fetchConnectionQuestions } from '../services/geminiService';

interface ConnectionGameProps {
    category: Category;
    onExit: () => void;
}

interface Question {
    id: string;
    left: string;
    right: string;
}

const DEFAULT_QUESTIONS: Question[] = [
    { id: '1', left: "Sinal", right: "Objetivo (ex: febre)" },
    { id: '2', left: "Sintoma", right: "Subjetivo (ex: dor)" },
    { id: '3', left: "Etiologia", right: "Causa da doença" },
    { id: '4', left: "Patogenia", right: "Mecanismo de produção" },
    { id: '5', left: "Antibiótico", right: "Combate bactérias" },
    { id: '6', left: "Antiviral", right: "Combate vírus" },
    { id: '7', left: "Analgésico", right: "Alivia a dor" },
    { id: '8', left: "Posologia", right: "Dose e via de admin" },
    { id: '9', left: "Artéria", right: "Sai do coração" },
    { id: '10', left: "Veia", right: "Volta ao coração" },
    { id: '11', left: "Aurícula", right: "Recebe sangue (átrio)" },
    { id: '12', left: "Ventrículo", right: "Ejeta sangue" },
    { id: '13', left: "AVC", right: "Derrame cerebral" },
    { id: '14', left: "IAM", right: "Infarto agudo miocárdio" },
    { id: '15', left: "PCR", right: "Parada cardiorrespiratória" },
    { id: '16', left: "TEP", right: "Embolia pulmonar" },
    { id: '17', left: "Sondagem", right: "Inserção de sonda" },
    { id: '18', left: "Punção", right: "Perfuração com agulha" },
    { id: '19', left: "Curativo", right: "Tratamento de ferida" },
    { id: '20', left: "Aspiração", right: "Remoção de secreção" }
];

const ConnectionGame: React.FC<ConnectionGameProps> = ({ category, onExit }) => {
    // Game Content State
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Game State
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [leftCards, setLeftCards] = useState<Question[]>([]);
    const [rightCards, setRightCards] = useState<Question[]>([]);
    const [usedQuestions, setUsedQuestions] = useState<Set<string>>(new Set());
    
    const [connections, setConnections] = useState<Record<string, { rightId: string, status: 'correct' | 'error' }>>({});
    const [selectedLeftCardId, setSelectedLeftCardId] = useState<string | null>(null);

    // UI State
    const [showStartModal, setShowStartModal] = useState(true);
    const [showLevelModal, setShowLevelModal] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);

    // Refs
    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Audio Control
    const toggleAudio = () => {
        if (!audioRef.current) return;
        if (audioEnabled) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
        setAudioEnabled(!audioEnabled);
    };

    // Level Management
    const loadLevel = useCallback(() => {
        setConnections({});
        setSelectedLeftCardId(null);

        setUsedQuestions(prevUsed => {
            let available = allQuestions.filter(q => !prevUsed.has(q.id));
            let newUsed = new Set(prevUsed);

            if (available.length < 4) {
                if (allQuestions.length >= 4) {
                    newUsed = new Set<string>();
                    available = allQuestions;
                } else {
                    available = allQuestions;
                }
            }

            const shuffledAvailable = [...available].sort(() => Math.random() - 0.5);
            const currentBatch = shuffledAvailable.slice(0, 4);

            currentBatch.forEach(q => newUsed.add(q.id));
            
            setLeftCards(currentBatch);
            setRightCards([...currentBatch].sort(() => Math.random() - 0.5));

            return newUsed;
        });
    }, [allQuestions]);

    // Initialize Game Data
    useEffect(() => {
        const initGame = async () => {
            setIsLoading(true);
            try {
                const questions = await fetchConnectionQuestions(category.title, category.id);
                if (questions && questions.length >= 4) {
                    setAllQuestions(questions);
                } else {
                    console.warn("Using default questions fallback");
                    setAllQuestions(DEFAULT_QUESTIONS);
                }
            } catch (err) {
                console.error("Failed to load game data:", err);
                setAllQuestions(DEFAULT_QUESTIONS);
            } finally {
                setIsLoading(false);
            }
        };

        initGame();
    }, [category]);

    useEffect(() => {
        // Run loadLevel only when conditions are met and ensure it doesn't cause infinite loops
        // since loadLevel now only depends on allQuestions.
        if (!isLoading && allQuestions.length > 0 && !showStartModal && !showLevelModal && leftCards.length === 0) {
            loadLevel();
        }
    }, [isLoading, allQuestions, showStartModal, showLevelModal, leftCards.length, loadLevel]);


    const handleStartGame = () => {
        setScore(0);
        setLevel(1);
        setUsedQuestions(new Set());
        setShowStartModal(false);
        if (audioRef.current) {
            audioRef.current.volume = 0.3;
            audioRef.current.play().then(() => setAudioEnabled(true)).catch(() => setAudioEnabled(false));
        }
    };

    const handleNextLevel = () => {
        setShowLevelModal(false);
        setLevel(prev => prev + 1);
        loadLevel();
    };

    const handleLeftClick = (id: string) => {
        // Se já está correto, não permite alterar
        if (connections[id]?.status === 'correct') return;
        
        // Alternar seleção
        setSelectedLeftCardId(prev => prev === id ? null : id);
    };

    const handleRightClick = (rightId: string) => {
        if (!selectedLeftCardId) return;

        // Se a direita já estiver associada a uma resposta correta, não permite usar
        const isRightCardMatched = Object.values(connections).some(c => c.rightId === rightId && c.status === 'correct');
        if (isRightCardMatched) return;

        const isCorrect = selectedLeftCardId === rightId;

        setConnections(prev => {
            const newStatus: 'correct' | 'error' = isCorrect ? 'correct' : 'error';
            const next = {
                ...prev,
                [selectedLeftCardId]: { rightId, status: newStatus }
            };

            if (isCorrect) {
                setScore(s => s + 100);
                const correctCount = Object.values(next).filter(c => c.status === 'correct').length;
                if (correctCount === leftCards.length) {
                    setTimeout(() => fireConfetti(), 100);
                    setTimeout(() => setShowLevelModal(true), 600);
                }
            }

            return next;
        });

        setSelectedLeftCardId(null);
    };

    // Confetti
    const fireConfetti = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: any[] = [];
        const colors = ['#4e54c8', '#00b09b', '#ff416c', '#f9d423'];

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                r: Math.random() * 6 + 2,
                dx: Math.random() * 10 - 5,
                dy: Math.random() * 10 - 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 100
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;

            particles.forEach(p => {
                if (p.life > 0) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();

                    p.x += p.dx;
                    p.y += p.dy;
                    p.dy += 0.2;
                    p.life--;
                    active = true;
                }
            });

            if (active) requestAnimationFrame(animate);
            else ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
        animate();
    };

    const getRightCardLetter = (rightId: string) => {
        const index = rightCards.findIndex(r => r.id === rightId);
        if (index === -1) return '?';
        return String.fromCharCode(65 + index); // A, B, C, D...
    };

    if (isLoading) {
        return (
            <div className="connection-game-wrapper" style={{ justifyContent: 'center' }}>
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold text-slate-700">Carregando Desafio...</h2>
            </div>
        );
    }

    return (
        <div className="connection-game-wrapper">
            <audio ref={audioRef} loop>
                <source src="https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3" type="audio/mpeg" />
            </audio>

            <canvas ref={canvasRef} id="confetti-canvas" />

            <div className="connection-game-header">
                <div className="header-left">
                    <button className="exit-btn" onClick={onExit} title="Sair">⬅️</button>
                    <button className="audio-btn" onClick={toggleAudio} title="Ligar/Desligar Som">
                        {audioEnabled ? "🔊" : "🔇"}
                    </button>
                    <div className="level-badge">Nível {level}</div>
                </div>
                <div className="score-display">Score: <span>{score}</span></div>
            </div>

            <div className="game-instruction" style={{ textAlign: 'center', margin: '0 20px 15px', color: '#64748b', fontSize: '0.9rem', backgroundColor: 'rgba(255,255,255,0.6)', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                💡 <strong>Dica:</strong> Primeiro selecione a pergunta (esquerda), depois escolha a resposta correspondente (direita).
            </div>

            <div id="game-container">
                <div className="column col-left">
                    {leftCards.map((q, index) => {
                        const conn = connections[q.id];
                        const statusClass = conn ? (conn.status === 'correct' ? 'matched-correct' : 'matched-error') : '';
                        const selectedClass = selectedLeftCardId === q.id ? 'selected-left' : '';

                        return (
                            <div
                                key={q.id}
                                className={`card letter-card left-card ${statusClass} ${selectedClass}`}
                                onClick={() => handleLeftClick(q.id)}
                            >
                                <div className="card-number-badge">{index + 1}</div>
                                <div className="card-text">{q.left}</div>
                                <div className="card-letter-slot">
                                    {conn ? getRightCardLetter(conn.rightId) : ''}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="column col-right">
                    {rightCards.map((q, index) => {
                        const isMatched = Object.values(connections).some(c => c.rightId === q.id && c.status === 'correct');
                        const matchedClass = isMatched ? 'matched-right' : '';
                        const letter = String.fromCharCode(65 + index);

                        return (
                            <div
                                key={q.id}
                                className={`card letter-card right-card ${matchedClass}`}
                                onClick={() => handleRightClick(q.id)}
                            >
                                <div className="card-letter-badge">{letter}</div>
                                <div className="card-text">{q.right}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Start Modal */}
            <div className={`modal-overlay ${showStartModal ? 'active' : ''}`}>
                <div className="connection-modal">
                    <h2>JOGO DE LIGAÇÃO 🔗</h2>
                    <p>Treine seu cérebro com associações na área da saúde.</p>
                    <p><strong>Selecione</strong> um item à esquerda e depois <strong>clique na letra</strong> da resposta correspondente à direita!</p>
                    <button className="connection-btn" onClick={handleStartGame}>Começar Agora</button>
                    <div style={{ marginTop: '10px' }}>
                        <button className="btn-text" onClick={onExit} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}>Voltar</button>
                    </div>
                </div>
            </div>

            {/* Level Up Modal */}
            <div className={`modal-overlay ${showLevelModal ? 'active' : ''}`}>
                <div className="connection-modal">
                    <h2>Nível Completo! 🎉</h2>
                    <p>Excelente memória! Vamos para o próximo desafio?</p>
                    <button className="connection-btn" onClick={handleNextLevel}>Próximo Nível</button>
                    <div style={{ marginTop: '10px' }}>
                        <button className="btn-text" onClick={onExit} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}>Sair do Jogo</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConnectionGame;

