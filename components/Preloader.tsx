import React, { useEffect, useState } from 'react';

interface PreloaderProps {
    onComplete: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsFading(true);
                    setTimeout(onComplete, 800); // Wait for fade out
                    return 100;
                }
                // Randomize increment for clearer "loading" effect
                const increment = Math.random() * 10 + 5;
                return Math.min(prev + increment, 100);
            });
        }, 150);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900 transition-opacity duration-700 ease-in-out ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
        >
            <div className="relative flex flex-col items-center">
                {/* Logo or Icon Animation */}
                <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                    <div
                        className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"
                        style={{ animationDuration: '1.5s' }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                        <svg className="w-10 h-10 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                </div>

                {/* Text */}
                <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-2 animate-pulse">
                    Minsa Preparatório
                </h1>
                <p className="text-slate-400 text-sm font-medium tracking-widest uppercase">
                    2026
                </p>

                {/* Progress Bar */}
                <div className="w-64 h-1 bg-slate-800 rounded-full mt-8 overflow-hidden relative">
                    <div
                        className="h-full bg-gradient-to-r from-brand-600 to-emerald-400 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Percentage */}
                <span className="text-slate-500 text-xs font-mono mt-2 min-w-[3ch] text-right">
                    {Math.round(progress)}%
                </span>
            </div>
        </div>
    );
};
