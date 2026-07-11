import React, { useState } from 'react';
import { authService } from '../services/auth';

interface LoginProps {
    onLoginSuccess: (user: any) => void;
    onBack: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [isRecovering, setIsRecovering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
            if (isRecovering) {
                const data = await authService.requestPasswordReset(email);
                setSuccessMessage(data.message || 'Email de recuperação enviado!');
                setLoading(false);
                return;
            }

            let data;
            if (isRegistering) {
                data = await authService.register(email, password);
                if (data.message && !data.session) {
                    setSuccessMessage(data.message);
                    setLoading(false);
                    return;
                }
            } else {
                data = await authService.login(email, password);
            }

            if (data.user) {
                onLoginSuccess(data.user);
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = (mode: 'login' | 'register' | 'recover') => {
        setError(null);
        setSuccessMessage(null);
        if (mode === 'login') {
            setIsRegistering(false);
            setIsRecovering(false);
        } else if (mode === 'register') {
            setIsRegistering(true);
            setIsRecovering(false);
        } else if (mode === 'recover') {
            setIsRegistering(false);
            setIsRecovering(true);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-50 relative overflow-hidden">
            {/* Left Side - Branding & Aesthetics */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center p-12 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-900 to-slate-900 opacity-90"></div>
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative z-10 max-w-lg text-left">
                    <div className="bg-white p-4 rounded-3xl mb-8 inline-block shadow-2xl shadow-brand-900/20 transform hover:scale-105 transition-transform duration-500">
                        <img src="/logo.png" alt="Logo" className="w-32 h-auto" />
                    </div>
                    <h1 className="text-5xl font-display font-bold text-white mb-6 leading-tight">
                        A sua jornada para a <span className="text-brand-400">aprovação</span> começa aqui.
                    </h1>
                    <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                        Junte-se a milhares de profissionais de saúde que estão a transformar a sua carreira com a melhor plataforma de preparação de Angola.
                    </p>

                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex-1">
                            <div className="text-2xl font-bold text-white mb-1">10k+</div>
                            <div className="text-slate-400 text-sm">Questões</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex-1">
                            <div className="text-2xl font-bold text-white mb-1">+80%</div>
                            <div className="text-slate-400 text-sm leading-tight">Probabilidade de Aprovação</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex-1">
                            <div className="text-2xl font-bold text-white mb-1">24/7</div>
                            <div className="text-slate-400 text-sm">Suporte AI</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
                <button
                    onClick={onBack}
                    className="absolute top-8 left-8 text-slate-400 hover:text-slate-700 flex items-center gap-2 transition-colors font-medium text-sm group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Voltar
                </button>

                <div className="w-full max-w-md">
                    <div className="text-center lg:text-left mb-10">
                        {/* Mobile Logo */}
                        <div className="lg:hidden bg-white p-3 rounded-2xl mx-auto mb-6 inline-block shadow-lg">
                            <img src="/logo.png" alt="Logo" className="w-24 h-auto" />
                        </div>

                        <h2 className="text-3xl font-display font-bold text-slate-900 mb-3 tracking-wide">
                            {isRecovering ? 'Recuperar Senha' : (isRegistering ? 'Criar Conta' : 'Bem-vindo de volta')}
                        </h2>
                        <p className="text-slate-500 text-lg">
                            {isRecovering
                                ? 'Digite o seu email para receber o link de recuperação.'
                                : (isRegistering
                                    ? 'Preencha os dados abaixo para começar.'
                                    : 'Por favor, insira os seus dados para entrar.')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 ml-1">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-0 transition-all font-medium"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        {!isRecovering && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="block text-sm font-semibold text-slate-700">Senha</label>
                                    {!isRegistering && (
                                        <button
                                            type="button"
                                            onClick={() => toggleMode('recover')}
                                            className="text-sm text-brand-600 hover:text-brand-700 font-semibold"
                                        >
                                            Esqueceu a senha?
                                        </button>
                                    )}
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-11 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-0 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-3 animate-shake">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="p-4 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200 flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {successMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold py-4 rounded-xl shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 disabled:opacity-70 disabled:cursor-wait ${loading ? 'cursor-wait' : ''}`}
                        >
                            <span className={`relative z-10 flex items-center justify-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                                {isRecovering ? 'Enviar Link de Recuperação' : (isRegistering ? 'Criar Minha Conta' : 'Entrar na Plataforma')}
                                {!isRecovering && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                )}
                            </span>
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                </div>
                            )}
                        </button>

                        {isRecovering && (
                            <button
                                type="button"
                                onClick={() => toggleMode('login')}
                                className="w-full text-slate-500 hover:text-slate-800 font-medium py-2 transition-colors flex items-center justify-center gap-2"
                            >
                                Cancelar
                            </button>
                        )}
                    </form>

                    {!isRecovering && (
                        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                            <p className="text-slate-500 mb-4 font-medium">
                                {isRegistering ? 'Já tem uma conta?' : 'Ainda não é membro?'}
                            </p>
                            <button
                                onClick={() => toggleMode(isRegistering ? 'login' : 'register')}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-50 text-brand-700 font-bold hover:bg-brand-100 transition-colors"
                            >
                                {isRegistering ? 'Fazer Login' : 'Criar Conta Gratuita'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
