import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { API_URL } from '../config/api';

interface SecurityViolation {
    user_id: string;
    email: string;
    full_name: string | null;
    is_blocked: boolean;
    blocked_reason: string | null;
    blocked_at: string | null;
    unique_devices_7days: number;
    last_login: string;
    device_ids: string[];
}

export const AdminSecurity: React.FC = () => {
    const [violations, setViolations] = useState<SecurityViolation[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'blocked' | 'unblocked'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchViolations();
    }, []);

    const fetchViolations = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/security/violations`, {
                headers: authService.getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setViolations(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch violations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBlockUser = async (userId: string, email: string) => {
        if (!confirm(`Tem certeza que deseja BLOQUEAR o usuário ${email}? Ele não poderá acessar a plataforma.`)) {
            return;
        }

        setActionLoading(userId);
        try {
            const response = await fetch(`${API_URL}/admin/security/block`, {
                method: 'POST',
                headers: {
                    ...authService.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    reason: 'Acesso em múltiplos dispositivos detectado'
                })
            });

            if (response.ok) {
                alert('Usuário bloqueado com sucesso!');
                fetchViolations();
            } else {
                const data = await response.json();
                alert('Erro ao bloquear: ' + data.error);
            }
        } catch (error) {
            alert('Erro de conexão');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnblockUser = async (userId: string, email: string) => {
        if (!confirm(`Deseja DESBLOQUEAR o usuário ${email}?`)) {
            return;
        }

        setActionLoading(userId);
        try {
            const response = await fetch(`${API_URL}/admin/security/unblock`, {
                method: 'POST',
                headers: {
                    ...authService.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id: userId })
            });

            if (response.ok) {
                alert('Usuário desbloqueado com sucesso!');
                fetchViolations();
            } else {
                const data = await response.json();
                alert('Erro ao desbloquear: ' + data.error);
            }
        } catch (error) {
            alert('Erro de conexão');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredViolations = violations.filter(v => {
        const matchesFilter = filter === 'all'
            || (filter === 'blocked' && v.is_blocked)
            || (filter === 'unblocked' && !v.is_blocked);

        const matchesSearch = searchTerm === ''
            || v.email?.toLowerCase().includes(searchTerm.toLowerCase())
            || v.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Centro de Segurança</h2>
                        <p className="text-white/80">Monitoramento de acessos suspeitos e bloqueio de contas</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{violations.length}</p>
                            <p className="text-xs text-slate-500">Violações Detectadas</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{violations.filter(v => v.is_blocked).length}</p>
                            <p className="text-xs text-slate-500">Contas Bloqueadas</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{violations.filter(v => !v.is_blocked).length}</p>
                            <p className="text-xs text-slate-500">Para Análise</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">
                                {violations.length > 0 ? Math.max(...violations.map(v => v.unique_devices_7days)) : 0}
                            </p>
                            <p className="text-xs text-slate-500">Máx. Dispositivos</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Buscar por email ou nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-2">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'unblocked', label: 'Para Análise' },
                            { id: 'blocked', label: 'Bloqueados' }
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id as any)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.id
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchViolations}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : filteredViolations.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Tudo Limpo!</h3>
                        <p className="text-slate-500">Nenhuma violação de segurança detectada.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuário</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dispositivos</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Último Login</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredViolations.map((violation) => (
                                    <tr key={violation.user_id} className={`hover:bg-slate-50 transition-colors ${violation.is_blocked ? 'bg-red-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${violation.is_blocked ? 'bg-red-500' : 'bg-amber-500'}`}>
                                                    {violation.email?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{violation.full_name || 'Sem nome'}</p>
                                                    <p className="text-sm text-slate-500">{violation.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${violation.unique_devices_7days >= 3
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    {violation.unique_devices_7days} dispositivos
                                                </span>
                                                <span className="text-xs text-slate-400 mt-1">nos últimos 7 dias</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm text-slate-600">{formatDate(violation.last_login)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {violation.is_blocked ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                    </svg>
                                                    Bloqueado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    Suspeito
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {violation.is_blocked ? (
                                                <button
                                                    onClick={() => handleUnblockUser(violation.user_id, violation.email)}
                                                    disabled={actionLoading === violation.user_id}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === violation.user_id ? (
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                                        </svg>
                                                    )}
                                                    Desbloquear
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleBlockUser(violation.user_id, violation.email)}
                                                    disabled={actionLoading === violation.user_id}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === violation.user_id ? (
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                    )}
                                                    Bloquear
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900 mb-2">Como funciona a detecção?</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• O sistema detecta automaticamente quando uma conta faz login em <strong>mais de 1 dispositivo</strong> nos últimos 7 dias.</li>
                            <li>• Quando um usuário é bloqueado, ele receberá uma mensagem ao tentar fazer login.</li>
                            <li>• Você pode desbloquear a qualquer momento após verificar a situação.</li>
                            <li>• Dispositivos são identificados por um ID único gerado no navegador.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSecurity;
