import { v4 as uuidv4 } from 'uuid';

/**
 * 🛡️ SERVIÇO DE AUTENTICAÇÃO (Frontend)
 * Angola Saúde 2026
 * 
 * Este serviço gerencia:
 * - Login/Logout
 * - Registo
 * - Gestão de sessão
 * - Device ID (para controlo de sessão única)
 */

// URL da API - usa variável de ambiente ou fallback para localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================================
// GESTÃO DE DEVICE ID
// ============================================================

/**
 * Obtém ou cria um Device ID único para este dispositivo
 * Usado para implementar política de sessão única
 */
export const getDeviceId = (): string => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
};

// ============================================================
// SERVIÇO DE AUTENTICAÇÃO
// ============================================================

export const authService = {
    /**
     * Registo de novo utilizador
     */
    async register(email: string, password: string) {
        const deviceId = getDeviceId();

        // Validação básica no frontend
        if (!email || !password) {
            throw new Error('Email e password são obrigatórios');
        }

        if (password.length < 6) {
            throw new Error('Password deve ter pelo menos 6 caracteres');
        }

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, deviceId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Falha no registo');
            }

            const data = await response.json();

            // Se sessão retornada, fazer login automático
            if (data.session) {
                this.persistSession(data.session.access_token, email, data.user);
            }

            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    /**
     * Login de utilizador
     */
    async login(email: string, password: string) {
        const deviceId = getDeviceId();

        if (!email || !password) {
            throw new Error('Email e password são obrigatórios');
        }

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, deviceId })
            });

            if (!response.ok) {
                const error = await response.json();

                // Tratar erro de sessão noutro dispositivo
                if (error.code === 'DEVICE_MISMATCH') {
                    throw new Error('A sua conta está em uso noutro dispositivo. Termine a sessão lá primeiro.');
                }

                throw new Error(error.error || 'Falha no login');
            }

            const data = await response.json();

            // Persistir sessão
            await this.persistSession(data.session.access_token, email, data.user);

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Persiste a sessão e obtém dados adicionais do utilizador
     */
    async persistSession(accessToken: string, email: string, user: any) {
        localStorage.setItem('auth_token', accessToken);

        // Obter plano do utilizador
        const planData = await this.fetchUserPlan(email);
        const userWithPlan = { ...user, plan: planData.plan };

        localStorage.setItem('user', JSON.stringify(userWithPlan));
    },

    /**
     * Solicitar reset de password
     */
    async requestPasswordReset(email: string) {
        if (!email) {
            throw new Error('Email é obrigatório');
        }

        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao enviar email de recuperação');
            }

            return data;
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    },

    /**
     * Atualizar password com token
     */
    async updatePassword(password: string, accessToken: string) {
        if (!password || !accessToken) {
            throw new Error('Password e token são obrigatórios');
        }

        if (password.length < 6) {
            throw new Error('Password deve ter pelo menos 6 caracteres');
        }

        try {
            const response = await fetch(`${API_URL}/auth/update-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, accessToken })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao atualizar password');
            }

            return data;
        } catch (error) {
            console.error('Update password error:', error);
            throw error;
        }
    },

    /**
     * Obtém plano do utilizador
     */
    async fetchUserPlan(email: string) {
        try {
            const token = this.getToken();
            const headers: Record<string, string> = {};

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                headers['X-Device-ID'] = getDeviceId();
            }

            const response = await fetch(
                `${API_URL}/user/plan/${encodeURIComponent(email)}`,
                { headers }
            );

            if (response.ok) {
                return await response.json();
            }
            return { plan: 'free', plan_activated_at: null };
        } catch (error) {
            console.error('Failed to fetch user plan:', error);
            return { plan: 'free', plan_activated_at: null };
        }
    },

    /**
     * Atualiza plano do utilizador na sessão local
     */
    async refreshUserPlan() {
        const user = this.getUser();
        if (user && user.email) {
            const planData = await this.fetchUserPlan(user.email);
            const updatedUser = { ...user, plan: planData.plan };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        }
        return user;
    },

    /**
     * Logout
     */
    async logout() {
        const token = localStorage.getItem('auth_token');
        const deviceId = getDeviceId();

        if (token) {
            try {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Device-ID': deviceId
                    }
                });
            } catch (e) {
                console.warn('Logout server call failed', e);
            }
        }

        // Limpar dados locais
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');

        // Recarregar para limpar estado
        window.location.reload();
    },

    /**
     * Verifica se utilizador está autenticado
     */
    isAuthenticated(): boolean {
        return !!localStorage.getItem('auth_token');
    },

    /**
     * Obtém dados do utilizador
     */
    getUser(): any {
        const userStr = localStorage.getItem('user');
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    },

    /**
     * Obtém token de autenticação
     */
    getToken(): string | null {
        return localStorage.getItem('auth_token');
    },

    /**
     * Verifica se utilizador tem acesso premium
     */
    hasPremiumAccess(): boolean {
        const user = this.getUser();
        if (!user) return false;
        return ['lite', 'pro', 'premier'].includes(user.plan);
    },

    /**
     * Verifica se utilizador é admin
     */
    isAdmin(): boolean {
        const user = this.getUser();
        if (!user) return false;

        // Verificar role ou email em lista de admins
        if (user.role === 'admin') return true;

        // Lista local de emails admin (deve corresponder ao backend)
        const adminEmails = ['admin@angolasaude.ao'];
        return adminEmails.includes(user.email?.toLowerCase());
    },

    /**
     * Obtém headers de autenticação para requests
     */
    getAuthHeaders(): Record<string, string> {
        const token = this.getToken();
        const deviceId = getDeviceId();

        if (!token) return {};

        return {
            'Authorization': `Bearer ${token}`,
            'X-Device-ID': deviceId
        };
    }
};

// ============================================================
// HELPER: Fazer request autenticado
// ============================================================

export async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const authHeaders = authService.getAuthHeaders();

    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...options.headers
        }
    });

    // Se 401 ou 403 com código de dispositivo, fazer logout
    if (response.status === 401 || response.status === 403) {
        const data = await response.clone().json().catch(() => ({}));

        if (data.code === 'DEVICE_MISMATCH') {
            alert('A sua sessão foi terminada porque a conta está em uso noutro dispositivo.');
            authService.logout();
        }
    }

    return response;
}
