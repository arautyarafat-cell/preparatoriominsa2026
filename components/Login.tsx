import React, { useState } from 'react';
import { authService } from '../services/auth';

interface LoginProps {
    onLoginSuccess: (user: any) => void;
    onBack: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
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

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 relative p-4">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[300px] -right-[300px] w-[800px] h-[800px] bg-brand-100/40 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute top-[20%] -left-[200px] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-3xl opacity-50"></div>
            </div>

            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-indigo-500/10 w-full max-w-md relative z-10 border border-slate-100">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg shadow-brand-900/20">
                        A
                    </div>
                    <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">
                        {isRegistering ? 'Criar Conta' : 'Boas-vindas'}
                    </h2>
                    <p className="text-slate-500">
                        {isRegistering
                            ? 'Comece sua jornada de aprovação hoje.'
                            : 'Entre para continuar seus estudos.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none"
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Senha</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="p-4 bg-green-50 text-green-600 text-sm rounded-xl border border-green-100 flex items-center gap-2">
                            <span>✅</span> {successMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-70 disabled:cursor-wait mt-4"
                    >
                        {loading ? 'Processando...' : (isRegistering ? 'Criar Conta' : 'Entrar')}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                    <p className="text-slate-500 text-sm mb-4">
                        {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError(null);
                                setSuccessMessage(null);
                            }}
                            className="text-brand-600 font-bold hover:text-brand-700 transition-colors"
                        >
                            {isRegistering ? 'Fazer Login' : 'Criar uma conta grátis'}
                        </button>

                        <button
                            onClick={onBack}
                            className="text-slate-400 font-medium text-sm hover:text-slate-600 transition-colors"
                        >
                            Voltar ao início
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
