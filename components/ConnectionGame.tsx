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
    const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());

    // UI State
    const [showStartModal, setShowStartModal] = useState(true);
    const [showLevelModal, setShowLevelModal] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [shakingCards, setShakingCards] = useState<string[]>([]);

    // Dragging State
    const [isDrawing, setIsDrawing] = useState(false);
    const [startCardId, setStartCardId] = useState<string | null>(null);
    const [lineCoords, setLineCoords] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
    const [lineStatus, setLineStatus] = useState<'default' | 'success' | 'error'>('default');

    // Refs
    const gameContainerRef = useRef<HTMLDivElement>(null);
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
        setMatchedIds(new Set());
        setLineCoords(null);
        setStartCardId(null);
        setIsDrawing(false);

        let available = allQuestions.filter(q => !usedQuestions.has(q.id));

        if (available.length < 4) {
            // If we run out, reset used questions only for the current set 
            // (or just re-use from pool if pool is small)
            if (allQuestions.length >= 4) {
                const newUsed = new Set<string>();
                setUsedQuestions(newUsed);
                available = allQuestions;
            } else {
                // Fallback if total questions < 4 (shouldn't happen with default)
                available = allQuestions;
            }
        }

        const shuffledAvailable = [...available].sort(() => Math.random() - 0.5);
        const currentBatch = shuffledAvailable.slice(0, 4);

        // Mark used
        const newUsed = new Set(usedQuestions);
        currentBatch.forEach(q => newUsed.add(q.id));
        setUsedQuestions(newUsed);

        setLeftCards(currentBatch);
        // Right side shuffled differently
        setRightCards([...currentBatch].sort(() => Math.random() - 0.5));
    }, [usedQuestions]);

    // Initialize Game Data
    useEffect(() => {
        const initGame = async () => {
            setIsLoading(true);
            try {
                // Fetch dynamic questions
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
        if (!isLoading && allQuestions.length > 0 && !showStartModal && !showLevelModal) {
            loadLevel();
        }
    }, [isLoading, allQuestions, showStartModal]);


    const handleStartGame = () => {
        setScore(0);
        setLevel(1);
        setUsedQuestions(new Set());
        setShowStartModal(false);
        // Attempt to play audio
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

    // Drag Logic
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, cardId: string, side: 'left' | 'right') => {
        if (side !== 'left' || matchedIds.has(cardId)) return;

        // Prevent default to stop scrolling on touch
        // e.preventDefault(); // Might block click, be careful. For touch it's important.

        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const containerRect = gameContainerRef.current?.getBoundingClientRect();

        if (!containerRect) return;

        const startX = rect.left + rect.width / 2 - containerRect.left;
        const startY = rect.top + rect.height / 2 - containerRect.top;

        setStartCardId(cardId);
        setLineCoords({ x1: startX, y1: startY, x2: startX, y2: startY });
        setIsDrawing(true);
        setLineStatus('default');
    };

    const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDrawing || !gameContainerRef.current) return;
        e.preventDefault(); // Stop scrolling while dragging line

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        const containerRect = gameContainerRef.current.getBoundingClientRect();
        const relX = clientX - containerRect.left;
        const relY = clientY - containerRect.top;

        setLineCoords(prev => prev ? { ...prev, x2: relX, y2: relY } : null);

        // Check hover over right cards (optional visual feedback)
        // Simplified: we will just check on MouseUp
    }, [isDrawing]);

    const handleMouseUp = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDrawing) return;
        setIsDrawing(false);

        let clientX, clientY;
        if ('changedTouches' in e) { // For touchend
            clientX = (e as TouchEvent).changedTouches[0].clientX;
            clientY = (e as TouchEvent).changedTouches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        // Identify target
        const targetEl = document.elementFromPoint(clientX, clientY);
        const targetCard = targetEl?.closest('.card') as HTMLElement;

        if (targetCard && targetCard.dataset.side === 'right') {
            const targetId = targetCard.dataset.id;
            if (targetId === startCardId) {
                // MATCH!
                setScore(s => s + 100);
                setMatchedIds(prev => {
                    const next = new Set(prev);
                    next.add(startCardId!);
                    // Check level complete
                    if (next.size === leftCards.length) { // Wait a bit then show modal
                        setTimeout(() => fireConfetti(), 100);
                        setTimeout(() => setShowLevelModal(true), 600);
                    }
                    return next;
                });
                setLineStatus('success');
            } else {
                // Mismatch
                shakeCards(startCardId!, targetId!);
                setLineStatus('error');
            }
        } else {
            // Released elsewhere
        }

        // Reset line after short delay or immediately?
        // If matched, we might want to keep a line? 
        // The original code keeps the line if matched.
        // But here we're rendering lines based on state.
        // We need a persistent list of successful lines.
        // Actually, maybe simpler: if match found, add to "completedLines" state.

        setStartCardId(null);
        setLineCoords(null);

    }, [isDrawing, startCardId, leftCards.length]);

    // Persistent lines for matched pairs
    // We need to calculate their coords.
    // This is tricky because positions might shift on resize.
    // But given the layout is flex, we can re-calc or just let CSS handle "matched" state visually (green border).
    // The original game kept lines. Let's try to keep lines using a re-render approach?
    // Or just rely on card styling "matched" which is easier. The prompt had "matched" class.

    // Add global event listeners for drag
    useEffect(() => {
        if (isDrawing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleMouseMove, { passive: false });
            window.addEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDrawing, handleMouseMove, handleMouseUp]);


    const shakeCards = (id1: string, id2: string) => {
        setShakingCards([id1, id2]);
        setTimeout(() => setShakingCards([]), 500);
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

            <div id="game-container" ref={gameContainerRef}>
                <svg id="svg-layer">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#4e54c8" />
                        </marker>
                        <marker id="arrowhead-success" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#00b09b" />
                        </marker>
                        <marker id="arrowhead-error" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#ff416c" />
                        </marker>
                    </defs>

                    {/* Render active dragging line */}
                    {lineCoords && (
                        <line
                            x1={lineCoords.x1}
                            y1={lineCoords.y1}
                            x2={lineCoords.x2}
                            y2={lineCoords.y2}
                            stroke={lineStatus === 'success' ? '#00b09b' : lineStatus === 'error' ? '#ff416c' : '#4e54c8'}
                            markerEnd={lineStatus === 'success' ? 'url(#arrowhead-success)' : lineStatus === 'error' ? 'url(#arrowhead-error)' : 'url(#arrowhead)'}
                        />
                    )}
                </svg>

                <div className="column col-left">
                    {leftCards.map(q => (
                        <div
                            key={q.id}
                            data-id={q.id}
                            data-side="left"
                            className={`card ${matchedIds.has(q.id) ? 'matched' : ''} ${shakingCards.includes(q.id) ? 'shake' : ''}`}
                        >
                            <div
                                className="connector"
                                onMouseDown={(e) => handleMouseDown(e, q.id, 'left')}
                                onTouchStart={(e) => handleMouseDown(e, q.id, 'left')}
                            />
                            <div className="card-text">{q.left}</div>
                        </div>
                    ))}
                </div>

                <div className="column col-right">
                    {rightCards.map(q => (
                        <div
                            key={q.id}
                            data-id={q.id}
                            data-side="right"
                            className={`card ${matchedIds.has(q.id) ? 'matched' : ''} ${shakingCards.includes(q.id) ? 'shake' : ''}`}
                        >
                            <div className="connector" />
                            <div className="card-text">{q.right}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Start Modal */}
            <div className={`modal-overlay ${showStartModal ? 'active' : ''}`}>
                <div className="connection-modal">
                    <h2>JOGO DE LIGAÇÃO 🔗</h2>
                    <p>Treine seu cérebro com associações na área da saúde.</p>
                    <p>Arraste as <strong>bolas</strong> da esquerda para conectar com as respostas da direita!</p>
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
