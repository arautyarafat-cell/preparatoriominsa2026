import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3001';

// 1. Device ID Management
export const getDeviceId = (): string => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
};

// 2. Auth Service
export const authService = {
    async register(email: string, password: string) {
        const deviceId = getDeviceId();
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, deviceId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Registration failed');
            }

            const data = await response.json();

            // If session is returned, login immediately
            if (data.session) {
                localStorage.setItem('auth_token', data.session.access_token);

                // Fetch user plan
                const plan = await this.fetchUserPlan(email);
                const userWithPlan = { ...data.user, plan };
                localStorage.setItem('user', JSON.stringify(userWithPlan));
            }

            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    async login(email: string, password: string) {
        const deviceId = getDeviceId();

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, deviceId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }

            const data = await response.json();

            // Persist Session
            localStorage.setItem('auth_token', data.session.access_token);

            // Fetch user plan
            const planData = await this.fetchUserPlan(email);
            const userWithPlan = { ...data.user, plan: planData.plan };
            localStorage.setItem('user', JSON.stringify(userWithPlan));

            return { ...data, user: userWithPlan };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async fetchUserPlan(email: string) {
        try {
            const response = await fetch(`${API_URL}/user/plan/${encodeURIComponent(email)}`);
            if (response.ok) {
                return await response.json();
            }
            return { plan: 'free', plan_activated_at: null };
        } catch (error) {
            console.error('Failed to fetch user plan:', error);
            return { plan: 'free', plan_activated_at: null };
        }
    },

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

        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.reload(); // Force reset state
    },

    isAuthenticated() {
        return !!localStorage.getItem('auth_token');
    },

    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    getToken() {
        return localStorage.getItem('auth_token');
    },

    // Check if user has premium access (lite, pro, or premier)
    hasPremiumAccess() {
        const user = this.getUser();
        if (!user) return false;
        return ['lite', 'pro', 'premier'].includes(user.plan);
    }
};

