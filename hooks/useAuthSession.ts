import { useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/auth';

/**
 * 🔐 HOOK DE GESTÃO DE SESSÃO
 * 
 * Este hook resolve o problema de expiração silenciosa de sessão:
 * 
 * 1. Refresh automático periódico do token (antes de expirar)
 * 2. Verificação de sessão quando a página volta a ficar visível
 * 3. Detecção de sessão inválida e logout automático
 * 4. Evento personalizado para notificar componentes sobre mudanças de sessão
 */

// Tempo padrão do JWT Supabase é 1 hora (3600 segundos)
// Fazemos refresh 5 minutos antes de expirar
const REFRESH_INTERVAL_MS = 55 * 60 * 1000; // 55 minutos
const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000; // Verificar a cada 5 minutos

// Evento customizado para notificar sobre sessão expirada
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';
export const SESSION_REFRESHED_EVENT = 'auth:session-refreshed';

interface UseAuthSessionResult {
    user: any;
    isAuthenticated: boolean;
    isLoading: boolean;
    sessionError: string | null;
    refreshSession: () => Promise<boolean>;
    clearSession: () => void;
    updateUser: (userData: any) => void;
}

export function useAuthSession(): UseAuthSessionResult {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionError, setSessionError] = useState<string | null>(null);

    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const checkTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isRefreshingRef = useRef(false);

    /**
     * Tenta renovar a sessão
     */
    const refreshSession = useCallback(async (): Promise<boolean> => {
        // Evitar múltiplas chamadas simultâneas
        if (isRefreshingRef.current) {
            return false;
        }

        const refreshToken = authService.getRefreshToken();
        if (!refreshToken) {
            console.log('[AuthSession] No refresh token available');
            return false;
        }

        isRefreshingRef.current = true;
        console.log('[AuthSession] Attempting session refresh...');

        try {
            const newToken = await authService.refreshSession();

            if (newToken) {
                console.log('[AuthSession] Session refreshed successfully');
                const updatedUser = authService.getUser();
                setUser(updatedUser);
                setSessionError(null);

                // Disparar evento de sessão renovada
                window.dispatchEvent(new CustomEvent(SESSION_REFRESHED_EVENT));

                return true;
            } else {
                console.warn('[AuthSession] Session refresh failed - no new token');
                return false;
            }
        } catch (error) {
            console.error('[AuthSession] Session refresh error:', error);
            return false;
        } finally {
            isRefreshingRef.current = false;
        }
    }, []);

    /**
     * Verifica se a sessão ainda é válida
     */
    const checkSession = useCallback(async () => {
        const token = authService.getToken();

        if (!token) {
            console.log('[AuthSession] No token found');
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            // Tentar fazer um request simples para verificar se o token é válido
            const response = await fetch(`${authService.getToken() ? '/auth/me' : ''}`, {
                method: 'GET',
                headers: authService.getAuthHeaders()
            });

            if (response.status === 401 || response.status === 403) {
                console.log('[AuthSession] Token invalid, attempting refresh...');

                // Tentar refresh
                const refreshed = await refreshSession();

                if (!refreshed) {
                    // Sessão completamente expirada
                    console.log('[AuthSession] Session expired, clearing...');
                    setSessionError('Sessão expirada. Por favor, faça login novamente.');
                    clearSession();

                    // Disparar evento de sessão expirada
                    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
                }
            } else if (response.ok) {
                // Sessão válida
                setSessionError(null);
            }
        } catch (error) {
            console.error('[AuthSession] Session check error:', error);
            // Em caso de erro de rede, não limpar sessão
            // O utilizador pode estar offline temporariamente
        }
    }, [refreshSession]);

    /**
     * Limpa a sessão local (sem chamar logout no servidor)
     */
    const clearSession = useCallback(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        setSessionError(null);

        // Limpar timers
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
        if (checkTimerRef.current) {
            clearInterval(checkTimerRef.current);
            checkTimerRef.current = null;
        }
    }, []);

    /**
     * Atualiza dados do utilizador
     */
    const updateUser = useCallback((userData: any) => {
        setUser(userData);
        if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
        }
    }, []);

    /**
     * Configura refresh automático periódico
     */
    const setupAutoRefresh = useCallback(() => {
        // Limpar timer existente
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
        }

        // Configurar novo timer para refresh automático
        refreshTimerRef.current = setInterval(async () => {
            if (authService.isAuthenticated()) {
                console.log('[AuthSession] Auto-refreshing session...');
                await refreshSession();
            }
        }, REFRESH_INTERVAL_MS);

        console.log('[AuthSession] Auto-refresh timer configured');
    }, [refreshSession]);

    /**
     * Configura verificação periódica de sessão
     */
    const setupSessionCheck = useCallback(() => {
        // Limpar timer existente
        if (checkTimerRef.current) {
            clearInterval(checkTimerRef.current);
        }

        // Configurar novo timer para verificação de sessão
        checkTimerRef.current = setInterval(async () => {
            if (authService.isAuthenticated()) {
                console.log('[AuthSession] Periodic session check...');
                await checkSession();
            }
        }, SESSION_CHECK_INTERVAL_MS);
    }, [checkSession]);

    /**
     * Handler para quando a página volta a ficar visível
     */
    const handleVisibilityChange = useCallback(async () => {
        if (document.visibilityState === 'visible' && authService.isAuthenticated()) {
            console.log('[AuthSession] Page became visible, checking session...');

            // Dar um pequeno delay para evitar múltiplas verificações
            setTimeout(async () => {
                const refreshed = await refreshSession();
                if (!refreshed && authService.getRefreshToken()) {
                    // Token pode ter expirado enquanto a página estava em background
                    // Tentar verificar sessão
                    await checkSession();
                }
            }, 500);
        }
    }, [refreshSession, checkSession]);

    /**
     * Handler para eventos de foco da janela
     */
    const handleWindowFocus = useCallback(async () => {
        if (authService.isAuthenticated()) {
            console.log('[AuthSession] Window focused, refreshing session...');
            await refreshSession();
        }
    }, [refreshSession]);

    /**
     * Inicialização
     */
    useEffect(() => {
        const initSession = async () => {
            setIsLoading(true);

            const currentUser = authService.getUser();
            const token = authService.getToken();

            if (currentUser && token) {
                setUser(currentUser);

                // Tentar refresh imediato para garantir token válido
                const refreshed = await refreshSession();

                if (refreshed) {
                    // Atualizar dados do utilizador do servidor
                    try {
                        const updatedUser = await authService.refreshUserPlan();
                        if (updatedUser) {
                            setUser(updatedUser);
                        }
                    } catch (err) {
                        console.warn('[AuthSession] Failed to sync user plan:', err);
                    }

                    // Configurar refresh automático
                    setupAutoRefresh();
                    setupSessionCheck();
                } else if (!authService.getRefreshToken()) {
                    // Sem refresh token, sessão inválida
                    console.log('[AuthSession] No valid session found');
                    clearSession();
                }
            }

            setIsLoading(false);
        };

        initSession();

        // Listeners de visibilidade e foco
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);

        // Listener para eventos de armazenamento (detectar logout em outra aba)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'auth_token' && !e.newValue) {
                console.log('[AuthSession] Token removed in another tab');
                setUser(null);
                clearSession();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            // Cleanup
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleWindowFocus);
            window.removeEventListener('storage', handleStorageChange);

            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
            if (checkTimerRef.current) {
                clearInterval(checkTimerRef.current);
            }
        };
    }, []);

    return {
        user,
        isAuthenticated: !!user && !!authService.getToken(),
        isLoading,
        sessionError,
        refreshSession,
        clearSession,
        updateUser
    };
}

export default useAuthSession;
