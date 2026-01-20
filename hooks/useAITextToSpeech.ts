/**
 * ==================================================
 * HOOK PARA TEXT-TO-SPEECH COM IA
 * Sistema Angola Saude 2026
 * ==================================================
 * 
 * Hook React para reproduzir audio gerado por IA
 * atraves do backend (Google Cloud TTS / alternativas).
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ==================================================
// TIPOS
// ==================================================

export interface AIAudioState {
    isLoading: boolean;
    isPlaying: boolean;
    isPaused: boolean;
    error: string | null;
    progress: number; // 0-100
    duration: number;
    currentTime: number;
}

export interface AIAudioOptions {
    speed?: number;
    cacheEnabled?: boolean;
}

// ==================================================
// CONFIGURACAO
// ==================================================

import { API_URL } from '../config/api';

const BACKEND_URL = API_URL;

// Cache local para audios gerados
const audioCache = new Map<string, string>();

// ==================================================
// HOOK: useAITextToSpeech
// ==================================================

export const useAITextToSpeech = (options: AIAudioOptions = {}) => {
    const {
        speed = 1.0,
        cacheEnabled = true
    } = options;

    const [state, setState] = useState<AIAudioState>({
        isLoading: false,
        isPlaying: false,
        isPaused: false,
        error: null,
        progress: 0,
        duration: 0,
        currentTime: 0
    });

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentTextRef = useRef<string>('');

    // ==================================================
    // INICIALIZACAO
    // ==================================================

    useEffect(() => {
        // Criar elemento de audio
        audioRef.current = new Audio();

        // Event handlers
        audioRef.current.onplay = () => {
            setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
            startProgressTracking();
        };

        audioRef.current.onpause = () => {
            setState(prev => ({ ...prev, isPaused: true }));
            stopProgressTracking();
        };

        audioRef.current.onended = () => {
            setState(prev => ({
                ...prev,
                isPlaying: false,
                isPaused: false,
                progress: 100,
                currentTime: prev.duration
            }));
            stopProgressTracking();
        };

        audioRef.current.onerror = (e) => {
            // Ignorar erro se não houver src (estado inicial)
            if (!audioRef.current?.src || audioRef.current.src === window.location.href) {
                return;
            }
            console.error('Erro no audio:', e);
            setState(prev => ({
                ...prev,
                isLoading: false,
                isPlaying: false,
                error: 'Erro ao reproduzir audio'
            }));
            stopProgressTracking();
        };

        audioRef.current.onloadedmetadata = () => {
            if (audioRef.current) {
                setState(prev => ({
                    ...prev,
                    duration: audioRef.current!.duration
                }));
            }
        };

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
            stopProgressTracking();
        };
    }, []);

    // ==================================================
    // TRACKING DE PROGRESSO
    // ==================================================

    const startProgressTracking = useCallback(() => {
        stopProgressTracking();

        progressIntervalRef.current = setInterval(() => {
            if (audioRef.current && !audioRef.current.paused) {
                const currentTime = audioRef.current.currentTime;
                const duration = audioRef.current.duration || 1;
                const progress = (currentTime / duration) * 100;

                setState(prev => ({
                    ...prev,
                    currentTime,
                    progress: Math.min(100, progress)
                }));
            }
        }, 100);
    }, []);

    const stopProgressTracking = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    }, []);

    // ==================================================
    // GERAR E REPRODUZIR AUDIO
    // ==================================================

    const speak = useCallback(async (text: string) => {
        if (!text || text.trim().length === 0) return;

        currentTextRef.current = text;

        setState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
            progress: 0,
            currentTime: 0
        }));

        try {
            // Verificar cache
            const cacheKey = `${text.substring(0, 100)}_${speed}`;
            let audioDataUrl: string | null = null;

            if (cacheEnabled && audioCache.has(cacheKey)) {
                audioDataUrl = audioCache.get(cacheKey)!;
            } else {
                // Tentar backend para gerar audio com IA
                try {
                    const response = await fetch(`${BACKEND_URL}/generate/tts`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            text,
                            speed
                        })
                    });

                    if (response.ok) {
                        const result = await response.json();

                        if (result.success && result.audio) {
                            // Criar data URL do audio base64
                            audioDataUrl = `data:audio/${result.format || 'mp3'};base64,${result.audio}`;

                            // Guardar em cache
                            if (cacheEnabled) {
                                audioCache.set(cacheKey, audioDataUrl);
                            }

                            // Configurar duracao estimada
                            if (result.duration) {
                                setState(prev => ({ ...prev, duration: result.duration }));
                            }
                        }
                    }
                } catch (backendError) {
                    console.log('Backend TTS indisponivel, usando fallback...', backendError);
                }
            }

            // Se temos audio do backend, reproduzir
            if (audioDataUrl && audioRef.current) {
                audioRef.current.src = audioDataUrl;
                audioRef.current.playbackRate = speed;

                setState(prev => ({ ...prev, isLoading: false }));

                await audioRef.current.play();
                return;
            }

            // FALLBACK: Web Speech API
            if ('speechSynthesis' in window) {
                console.log('Usando Web Speech API como fallback...');

                // Limpar texto
                const cleanText = text
                    .replace(/\[PAUSA\]/gi, '. ')
                    .replace(/\[ENFASE\]/gi, '')
                    .replace(/\*\*/g, '')
                    .replace(/\*/g, '')
                    .substring(0, 2000);

                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.lang = 'pt-PT';
                utterance.rate = speed;
                utterance.pitch = 1;
                utterance.volume = 1;

                // Tentar encontrar voz portuguesa
                const voices = speechSynthesis.getVoices();
                const ptVoice = voices.find(v => v.lang.startsWith('pt'));
                if (ptVoice) {
                    utterance.voice = ptVoice;
                }

                utterance.onstart = () => {
                    setState(prev => ({ ...prev, isLoading: false, isPlaying: true, error: null }));
                };

                utterance.onend = () => {
                    setState(prev => ({ ...prev, isPlaying: false, progress: 100 }));
                };

                utterance.onerror = (e) => {
                    setState(prev => ({ ...prev, isPlaying: false, error: 'Erro no audio' }));
                };

                speechSynthesis.speak(utterance);
                return;
            }

            // Se nada funciona
            throw new Error('Nenhum servico de audio disponivel');

        } catch (error) {
            console.error('Erro ao gerar audio:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }));
        }
    }, [speed, cacheEnabled]);

    // ==================================================
    // CONTROLOS DE REPRODUCAO
    // ==================================================

    const pause = useCallback(() => {
        if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
        }
    }, []);

    const resume = useCallback(() => {
        if (audioRef.current && audioRef.current.paused && audioRef.current.src) {
            audioRef.current.play().catch(console.error);
        }
    }, []);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        stopProgressTracking();
        setState(prev => ({
            ...prev,
            isPlaying: false,
            isPaused: false,
            progress: 0,
            currentTime: 0
        }));
    }, [stopProgressTracking]);

    const togglePlayPause = useCallback(() => {
        if (state.isPlaying && !state.isPaused) {
            pause();
        } else if (state.isPaused) {
            resume();
        } else if (currentTextRef.current) {
            speak(currentTextRef.current);
        }
    }, [state.isPlaying, state.isPaused, pause, resume, speak]);

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    }, []);

    const setPlaybackRate = useCallback((rate: number) => {
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
        }
    }, []);

    // ==================================================
    // LIMPAR CACHE
    // ==================================================

    const clearCache = useCallback(() => {
        audioCache.clear();
    }, []);

    // ==================================================
    // RETORNO DO HOOK
    // ==================================================

    return {
        // Estado
        isLoading: state.isLoading,
        isPlaying: state.isPlaying,
        isPaused: state.isPaused,
        error: state.error,
        progress: state.progress,
        duration: state.duration,
        currentTime: state.currentTime,
        isSupported: true, // Sempre suportado (audio HTML5)

        // Accoes
        speak,
        pause,
        resume,
        stop,
        togglePlayPause,
        seek,
        setPlaybackRate,
        clearCache
    };
};

// ==================================================
// EXPORT DEFAULT
// ==================================================

export default useAITextToSpeech;
