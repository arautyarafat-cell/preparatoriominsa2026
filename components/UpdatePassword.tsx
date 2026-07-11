import React, { useState, useEffect } from 'react';

// URL do Backend (local ou prod)
const getBackendUrl = () => {
    if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
    if (typeof window !== 'undefined') return `http://${window.location.hostname}:3001`;
    return 'http://localhost:3001';
};

interface UpdatePasswordProps {
    onSuccess: () => void;
}

export const UpdatePassword: React.FC<UpdatePasswordProps> = ({ onSuccess }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    // Parse URL hash to get token
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1)); // remove #
            const token = params.get('access_token');
            if (token) {
                setAccessToken(token);
                // Opcional: Limpar a hash da URL
                window.history.replaceState(null, '', window.location.pathname);
            } else {
                setError('Link inválido. O token de acesso não foi encontrado.');
            }
        } else {
            setError('Link inválido. Nenhum token encontrado.');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!accessToken) {
            setError('Sessão inválida. Por favor, solicite um novo link.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${getBackendUrl()}/auth/update-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password,
                    accessToken
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao atualizar senha.');
            }

            setSuccessMessage('Senha atualizada com sucesso!');
            setTimeout(() => {
                onSuccess();
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar a senha');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 relative p-4">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[300px] -right-[300px] w-[800px] h-[800px] bg-brand-100/40 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-[20%] -left-[200px] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-3xl opacity-50"></div>
            </div>

            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-indigo-500/10 w-full max-w-md relative z-10 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg shadow-brand-900/20">
                        🔑
                    </div>
                    <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">
                        Nova Senha
                    </h2>
                    <p className="text-slate-500">
                        Digite sua nova senha abaixo para redefinir o acesso à sua conta.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nova Senha</label>
                        <input
                            type="password"
                            required
                            minLength={6}
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
                        disabled={loading || !!successMessage || !accessToken}
                        className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-900/20 disabled:opacity-70 disabled:cursor-wait mt-4"
                    >
                        {loading ? 'Atualizando...' : 'Definir Nova Senha'}
                    </button>

                    {error && (
                        <button
                            type="button"
                            onClick={onSuccess}
                            className="w-full text-slate-500 hover:text-slate-800 font-medium py-2 mt-2"
                        >
                            Voltar ao Login
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};
