/**
 * ==================================================
 * HOOK PARA TEXT-TO-SPEECH (Web Speech API)
 * Sistema Angola Saude 2026
 * ==================================================
 * 
 * Hook React para sintetizar audio a partir de texto
 * usando a Web Speech API nativa do browser.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ==================================================
// TIPOS
// ==================================================

export interface SpeechState {
    isPlaying: boolean;
    isPaused: boolean;
    isSupported: boolean;
    currentVoice: SpeechSynthesisVoice | null;
    availableVoices: SpeechSynthesisVoice[];
    progress: number; // 0-100
    error: string | null;
}

export interface SpeechOptions {
    rate?: number;      // 0.1 - 10 (default: 1)
    pitch?: number;     // 0 - 2 (default: 1)
    volume?: number;    // 0 - 1 (default: 1)
    lang?: string;      // BCP 47 language tag (default: 'pt-PT')
    voiceName?: string; // Nome da voz preferida
}

// ==================================================
// HOOK: useTextToSpeech
// ==================================================

export const useTextToSpeech = (options: SpeechOptions = {}) => {
    const {
        rate = 0.95,
        pitch = 1,
        volume = 1,
        lang = 'pt-PT',
        voiceName
    } = options;

    const [state, setState] = useState<SpeechState>({
        isPlaying: false,
        isPaused: false,
        isSupported: false,
        currentVoice: null,
        availableVoices: [],
        progress: 0,
        error: null
    });

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const textRef = useRef<string>('');
    const startTimeRef = useRef<number>(0);
    const estimatedDurationRef = useRef<number>(0);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // ==================================================
    // INICIALIZACAO - VERIFICAR SUPORTE E CARREGAR VOZES
    // ==================================================

    useEffect(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            setState(prev => ({ ...prev, isSupported: false }));
            return;
        }

        setState(prev => ({ ...prev, isSupported: true }));

        const loadVoices = () => {
            const voices = speechSynthesis.getVoices();

            // Filtrar vozes em portugues
            const ptVoices = voices.filter(voice =>
                voice.lang.startsWith('pt') ||
                voice.name.toLowerCase().includes('portuguese') ||
                voice.name.toLowerCase().includes('brasil') ||
                voice.name.toLowerCase().includes('portugal')
            );

            // Seleccionar voz preferida ou primeira disponivel em portugues
            let selectedVoice = ptVoices.find(v => v.name.includes(voiceName || ''));
            if (!selectedVoice) {
                selectedVoice = ptVoices.find(v => v.lang === 'pt-PT') ||
                    ptVoices.find(v => v.lang === 'pt-BR') ||
                    ptVoices[0] ||
                    voices.find(v => v.lang.startsWith('pt')) ||
                    voices[0];
            }

            setState(prev => ({
                ...prev,
                availableVoices: voices,
                currentVoice: selectedVoice || null
            }));
        };

        // Carregar vozes (pode ser assincrono em alguns browsers)
        loadVoices();
        speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            speechSynthesis.onvoiceschanged = null;
        };
    }, [voiceName]);

    // ==================================================
    // LIMPAR INTERVALO DE PROGRESSO
    // ==================================================

    const clearProgressInterval = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    }, []);

    // ==================================================
    // CALCULAR DURACAO ESTIMADA
    // ==================================================

    const calculateEstimatedDuration = useCallback((text: string, speechRate: number): number => {
        // Media de 150 palavras por minuto a velocidade normal (rate = 1)
        const wordsPerMinute = 150;
        const wordCount = text.split(/\s+/).length;
        const baseSeconds = (wordCount / wordsPerMinute) * 60;

        // Ajustar pela velocidade
        return baseSeconds / speechRate;
    }, []);

    // ==================================================
    // FALAR TEXTO
    // ==================================================

    const speak = useCallback((text: string, customOptions?: Partial<SpeechOptions>) => {
        if (!state.isSupported || !text.trim()) {
            return;
        }

        // Parar qualquer sintese anterior
        speechSynthesis.cancel();
        clearProgressInterval();

        // Limpar marcadores de pausas do texto
        const cleanText = text
            .replace(/\[PAUSA\]/gi, '. ')
            .replace(/\[ENFASE\]/gi, '')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '');

        textRef.current = cleanText;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utteranceRef.current = utterance;

        // Configurar opcoes
        utterance.rate = customOptions?.rate || rate;
        utterance.pitch = customOptions?.pitch || pitch;
        utterance.volume = customOptions?.volume || volume;
        utterance.lang = customOptions?.lang || lang;

        if (state.currentVoice) {
            utterance.voice = state.currentVoice;
        }

        // Calcular duracao estimada e iniciar tracking de progresso
        estimatedDurationRef.current = calculateEstimatedDuration(cleanText, utterance.rate);
        startTimeRef.current = Date.now();

        // Event handlers
        utterance.onstart = () => {
            setState(prev => ({ ...prev, isPlaying: true, isPaused: false, error: null }));

            // Iniciar intervalo de progresso
            progressIntervalRef.current = setInterval(() => {
                const elapsed = (Date.now() - startTimeRef.current) / 1000;
                const progress = Math.min(100, (elapsed / estimatedDurationRef.current) * 100);
                setState(prev => ({ ...prev, progress }));
            }, 100);
        };

        utterance.onend = () => {
            clearProgressInterval();
            setState(prev => ({ ...prev, isPlaying: false, isPaused: false, progress: 100 }));
        };

        utterance.onerror = (event) => {
            clearProgressInterval();
            setState(prev => ({
                ...prev,
                isPlaying: false,
                isPaused: false,
                error: `Erro de sintese: ${event.error}`
            }));
        };

        utterance.onpause = () => {
            setState(prev => ({ ...prev, isPaused: true }));
        };

        utterance.onresume = () => {
            setState(prev => ({ ...prev, isPaused: false }));
            startTimeRef.current = Date.now() - (state.progress / 100 * estimatedDurationRef.current * 1000);
        };

        // Iniciar sintese
        speechSynthesis.speak(utterance);

    }, [state.isSupported, state.currentVoice, state.progress, rate, pitch, volume, lang, clearProgressInterval, calculateEstimatedDuration]);

    // ==================================================
    // PAUSAR
    // ==================================================

    const pause = useCallback(() => {
        if (state.isPlaying && !state.isPaused) {
            speechSynthesis.pause();
        }
    }, [state.isPlaying, state.isPaused]);

    // ==================================================
    // RETOMAR
    // ==================================================

    const resume = useCallback(() => {
        if (state.isPaused) {
            speechSynthesis.resume();
        }
    }, [state.isPaused]);

    // ==================================================
    // PARAR
    // ==================================================

    const stop = useCallback(() => {
        speechSynthesis.cancel();
        clearProgressInterval();
        setState(prev => ({ ...prev, isPlaying: false, isPaused: false, progress: 0 }));
    }, [clearProgressInterval]);

    // ==================================================
    // TOGGLE PLAY/PAUSE
    // ==================================================

    const togglePlayPause = useCallback(() => {
        if (state.isPaused) {
            resume();
        } else if (state.isPlaying) {
            pause();
        }
    }, [state.isPlaying, state.isPaused, pause, resume]);

    // ==================================================
    // ALTERAR VOZ
    // ==================================================

    const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
        setState(prev => ({ ...prev, currentVoice: voice }));
    }, []);

    // ==================================================
    // LIMPAR AO DESMONTAR
    // ==================================================

    useEffect(() => {
        return () => {
            speechSynthesis.cancel();
            clearProgressInterval();
        };
    }, [clearProgressInterval]);

    // ==================================================
    // RETORNO DO HOOK
    // ==================================================

    return {
        // Estado
        isPlaying: state.isPlaying,
        isPaused: state.isPaused,
        isSupported: state.isSupported,
        progress: state.progress,
        error: state.error,
        currentVoice: state.currentVoice,
        availableVoices: state.availableVoices,

        // Accoes
        speak,
        pause,
        resume,
        stop,
        togglePlayPause,
        setVoice
    };
};

// ==================================================
// EXPORT DEFAULT
// ==================================================

export default useTextToSpeech;
