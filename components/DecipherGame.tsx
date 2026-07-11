import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { fetchDecipherTermsForGame } from '../services/geminiService';

interface DecipherGameProps {
  category: Category;
  onExit: () => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const DecipherGame: React.FC<DecipherGameProps> = ({ category, onExit }) => {
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<{ term: string; hint: string; definition: string } | null>(null);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [lives, setLives] = useState(5);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  // States for help features
  const [showTerm, setShowTerm] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  // Queue state to manage the rotation of terms
  const [termQueue, setTermQueue] = useState<any[]>([]);



  const startRound = (data: any) => {
    setGuessedLetters(new Set());
    setLives(5);
    setGameState('playing');
    setShowTerm(false);
    setHintsUsed(0);

    // Normalize term to remove accents/special chars
    const sanitizedTerm = data.term.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z]/g, "");
    setGameData({ ...data, term: sanitizedTerm });
  };

  const initGame = async () => {
    setLoading(true);
    try {
      // Fetch all terms for this category (plus global)
      const terms = await fetchDecipherTermsForGame(category.title, category.id);

      if (!terms || terms.length === 0) {
        // Should not happen due to fallback, but just in case
        return;
      }

      // Shuffle terms (Fisher-Yates)
      const shuffled = [...terms];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      setTermQueue(shuffled);

      // Submit the first one
      if (shuffled.length > 0) {
        startRound(shuffled[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // On mount, load the game queue
  useEffect(() => {
    initGame();
  }, [category]);

  // Keyboard support - allow typing letters from physical keyboard
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only process if game is playing
      if (gameState !== 'playing' || !gameData) return;

      // Get the pressed key and convert to uppercase
      const key = event.key.toUpperCase();

      // Check if it's a letter A-Z
      if (/^[A-Z]$/.test(key)) {
        // Prevent default to avoid any unwanted behavior
        event.preventDefault();

        // Trigger the guess
        handleGuess(key);
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, gameData, guessedLetters, lives]); // Dependencies for the handler

  const handleNextLevel = () => {
    // Get next from queue
    if (termQueue.length > 1) {
      const newQueue = termQueue.slice(1);
      setTermQueue(newQueue);
      startRound(newQueue[0]);
    } else {
      // Queue finished, restart/reshuffle
      initGame();
    }
  };

  const handleGuess = (letter: string) => {
    if (gameState !== 'playing' || guessedLetters.has(letter) || !gameData) return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (!gameData.term.includes(letter)) {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives === 0) setGameState('lost');
    } else {
      // Check win condition
      const isWon = gameData.term.split('').every(char => newGuessed.has(char));
      if (isWon) setGameState('won');
    }
  };

  // Reveal one random unguessed letter as a hint (costs 1 life)
  const handleUseHint = () => {
    if (gameState !== 'playing' || !gameData || lives <= 1) return;

    // Find letters in the term that haven't been guessed yet
    const unguessedLetters = gameData.term.split('').filter(
      (char, index, self) => !guessedLetters.has(char) && self.indexOf(char) === index
    );

    if (unguessedLetters.length === 0) return;

    // Pick a random unguessed letter and reveal it
    const randomLetter = unguessedLetters[Math.floor(Math.random() * unguessedLetters.length)];

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(randomLetter);
    setGuessedLetters(newGuessed);
    setHintsUsed(prev => prev + 1);

    // Costs 1 life
    setLives(prev => prev - 1);

    // Check win condition
    const isWon = gameData.term.split('').every(char => newGuessed.has(char));
    if (isWon) setGameState('won');
  };

  // Reveal the entire term (ends round as lost)
  const handleRevealTerm = () => {
    if (gameState !== 'playing') return;
    setShowTerm(true);
    setGameState('lost');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-slate-700">Preparando Desafio...</h2>
        <p className="text-slate-500">A IA está escolhendo termos técnicos...</p>
      </div>
    );
  }

  if (!gameData) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100">
      {/* Header */}
      <div className="bg-white px-4 md:px-6 py-3 md:py-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onExit} className="text-slate-500 hover:text-slate-900 font-medium text-sm flex items-center gap-1 md:gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span className="hidden sm:inline">Sair</span>
          </button>
          <h1 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider sm:tracking-widest text-center flex-1 mx-2">
            Decifre o Termo
            {termQueue.length > 0 && (
              <span className="block sm:inline text-xs text-indigo-500 sm:ml-2 mt-0.5 sm:mt-0">
                ({termQueue.length} restantes)
              </span>
            )}
          </h1>
          {/* Espaçador para manter o título centralizado */}
          <div className="w-10 sm:w-12"></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full">

        {/* Hint Bubble */}
        <div className="mb-8 bg-indigo-50 border border-indigo-100 px-6 py-4 rounded-2xl relative animate-fade-in">
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-50 border-b border-r border-indigo-100 rotate-45"></div>
          <p className="text-indigo-800 font-medium text-center text-lg">💡 Dica: {gameData.hint}</p>
        </div>

        {/* Word Display */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
          {gameData.term.split('').map((char, idx) => (
            <div
              key={idx}
              className={`w-10 h-14 md:w-14 md:h-20 rounded-xl flex items-center justify-center text-3xl md:text-4xl font-bold border-b-4 transition-all duration-300
                    ${guessedLetters.has(char) || gameState !== 'playing'
                  ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
                  : 'bg-slate-200/50 border-slate-300 text-transparent'
                }
                    ${gameState === 'lost' && !guessedLetters.has(char) ? 'text-red-400 opacity-50' : ''}
                    ${gameState === 'won' ? 'border-green-400 text-green-600 bg-green-50' : ''}
                  `}
            >
              {char}
            </div>
          ))}
        </div>

        {/* Keyboard */}
        {gameState === 'playing' ? (
          <>
            {/* Help Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleUseHint}
                disabled={lives <= 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${lives <= 1
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Dica (-1❤️)
                {hintsUsed > 0 && <span className="text-xs text-amber-500">({hintsUsed} usadas)</span>}
              </button>
              <button
                onClick={handleRevealTerm}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver Termo
              </button>
            </div>

            {/* Keyboard Grid */}
            <div className="text-center mb-3">
              <p className="text-xs text-slate-400">
                <span className="hidden md:inline">⌨️ Você também pode usar o teclado do seu PC para digitar</span>
                <span className="md:hidden">📱 Toque nas letras ou use o teclado</span>
              </p>
            </div>
            <div className="grid grid-cols-7 gap-2 md:gap-3 max-w-2xl w-full">
              {ALPHABET.map((letter) => {
                const isGuessed = guessedLetters.has(letter);
                const isCorrect = gameData.term.includes(letter);

                let btnClass = "aspect-square rounded-xl font-bold text-lg md:text-xl transition-all active:scale-95 shadow-sm ";

                if (isGuessed) {
                  btnClass += isCorrect
                    ? "bg-green-100 text-green-600 border border-green-200 cursor-not-allowed"
                    : "bg-slate-100 text-slate-300 border border-transparent cursor-not-allowed";
                } else {
                  btnClass += "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md";
                }

                return (
                  <button
                    key={letter}
                    onClick={() => handleGuess(letter)}
                    disabled={isGuessed}
                    className={btnClass}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          // Game Over / Win State
          <div className="w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center animate-slide-up">
            <div className="text-6xl mb-4">
              {gameState === 'won' ? '🎉' : showTerm ? '👀' : '📚'}
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">
              {gameState === 'won'
                ? 'Excelente!'
                : showTerm
                  ? 'Agora você sabe!'
                  : 'Não foi dessa vez'}
            </h2>
            <p className="text-slate-500 mb-8">
              {showTerm
                ? <>Você revelou o termo: <span className="font-bold text-slate-900">{gameData.term}</span>. Continue tentando para aprender mais!</>
                : <>O termo correto era <span className="font-bold text-slate-900">{gameData.term}</span>.</>
              }
            </p>

            <div className="bg-slate-50 rounded-2xl p-6 text-left mb-8 border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Definição Técnica</p>
              <p className="text-slate-700 leading-relaxed">{gameData.definition}</p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleNextLevel}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                {termQueue.length > 1 ? 'Próximo Termo' : 'Embaralhar Tudo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DecipherGame;
