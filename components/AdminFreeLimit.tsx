import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { API_URL } from '../config/api';

interface UserInfo {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    plan: string;
}

interface IPLimit {
    id: string;
    ip_address: string;
    quiz_count: number;
    first_quiz_at: string;
    last_quiz_at: string;
    blocked_until: string | null;
    is_permanently_blocked: boolean;
    block_reason: string | null;
    created_at: string;
    updated_at: string;
    last_user_id?: string;
    user?: UserInfo;
}

interface UserLimit {
    user_id: string;
    quiz_count: number;
    blocked_until: string | null;
    is_blocked: boolean;
    block_reason: string | null;
    updated_at: string;
    user?: UserInfo;
}

export const AdminFreeLimit: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'ips'>('users');
    const [ips, setIps] = useState<IPLimit[]>([]);
    const [users, setUsers] = useState<UserLimit[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ type: 'ip' | 'user', id: string, name: string } | null>(null);
    const [blockDuration, setBlockDuration] = useState(60);
    const [blockReason, setBlockReason] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'ips') {
                const response = await fetch(`${API_URL}/admin/limits/ips`, {
                    headers: authService.getAuthHeaders()
                });
                if (response.ok) {
                    const data = await response.json();
                    setIps(data.ips || []);
                }
            } else {
                const response = await fetch(`${API_URL}/admin/limits/users`, {
                    headers: authService.getAuthHeaders()
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data.users || []);
                }
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- ACTIONS FOR IPs ---
    const handleIpBlock = async (ip: string, type: 'permanent' | 'temporary', duration?: number, reason?: string) => {
        setActionLoading(ip);
        try {
            const body: any = { ip_address: ip, type, reason };
            if (type === 'temporary' && duration) body.duration_minutes = duration;

            const response = await fetch(`${API_URL}/admin/limits/block`, {
                method: 'POST',
                headers: { ...authService.getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                alert('IP bloqueado com sucesso!');
                fetchData();
            } else {
                const data = await response.json();
                alert('Erro: ' + data.error);
            }
        } catch (e) { alert('Erro de conexão'); }
        finally { setActionLoading(null); setShowBlockModal(false); }
    };

    const handleIpUnblock = async (ip: string) => {
        if (!confirm(`Desbloquear IP ${ip}?`)) return;
        setActionLoading(ip);
        try {
            const response = await fetch(`${API_URL}/admin/limits/unblock`, {
                method: 'POST',
                headers: { ...authService.getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip_address: ip })
            });
            if (response.ok) { alert('Desbloqueado!'); fetchData(); }
            else { const data = await response.json(); alert('Erro: ' + data.error); }
        } catch (e) { alert('Erro de conexão'); }
        finally { setActionLoading(null); }
    };

    // --- ACTIONS FOR USERS ---
    const handleUserBlock = async (userId: string, duration?: number, reason?: string) => {
        setActionLoading(userId);
        try {
            const body: any = { user_id: userId, reason };
            if (duration) body.duration_minutes = duration;

            const response = await fetch(`${API_URL}/admin/limits/users/block`, {
                method: 'POST',
                headers: { ...authService.getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                alert('Usuário bloqueado com sucesso!');
                fetchData();
            } else {
                const data = await response.json();
                alert('Erro: ' + data.error);
            }
        } catch (e) { alert('Erro de conexão'); }
        finally { setActionLoading(null); setShowBlockModal(false); }
    };

    const handleUserUnblock = async (userId: string) => {
        if (!confirm(`Desbloquear usuário?`)) return;
        setActionLoading(userId);
        try {
            const response = await fetch(`${API_URL}/admin/limits/users/unblock`, {
                method: 'POST',
                headers: { ...authService.getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            if (response.ok) { alert('Desbloqueado!'); fetchData(); }
            else { const data = await response.json(); alert('Erro: ' + data.error); }
        } catch (e) { alert('Erro de conexão'); }
        finally { setActionLoading(null); }
    };

    // --- MODAL SUBMIT ---
    const handleBlockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        if (selectedItem.type === 'ip') {
            // Temporary block for IPs via modal (permanent is direct button)
            handleIpBlock(selectedItem.id, 'temporary', blockDuration, blockReason);
        } else {
            // User block via modal
            handleUserBlock(selectedItem.id, blockDuration, blockReason);
        }
    };

    const openBlockModal = (item: { type: 'ip' | 'user', id: string, name: string }) => {
        setSelectedItem(item);
        setBlockDuration(60);
        setBlockReason('');
        setShowBlockModal(true);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Limites e Bloqueios</h2>
                        <p className="text-white/80">Gestão de limites de quiz por Usuário e IP</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-3 px-4 text-sm font-bold transition-colors ${activeTab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Usuários Registrados
                </button>
                <button
                    onClick={() => setActiveTab('ips')}
                    className={`pb-3 px-4 text-sm font-bold transition-colors ${activeTab === 'ips' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    IPs Anônimos / Fallback
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">
                        {activeTab === 'users' ? 'Usuários Monitorados (Últimos 100)' : 'IPs Monitorados (Últimos 100)'}
                    </h3>
                    <button onClick={fetchData} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>
                ) : activeTab === 'users' ? (
                    // USERS TABLE
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Usuário</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Plano</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Questões (Limit 5)</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Última Atualização</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-slate-500">Nenhum limite de usuário registrado.</td></tr>
                                ) : users.map(u => (
                                    <tr key={u.user_id} className={`hover:bg-slate-50 ${u.is_blocked ? 'bg-red-50/30' : ''}`}>
                                        <td className="px-6 py-4 text-sm text-slate-700">
                                            {u.user ? (
                                                <div>
                                                    <div className="font-bold">{u.user.first_name} {u.user.last_name}</div>
                                                    <div className="text-xs text-slate-500">{u.user.email}</div>
                                                </div>
                                            ) : <span className="text-slate-400 font-mono text-xs">{u.user_id}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${u.user?.plan === 'pro' || u.user?.plan === 'premier' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {u.user?.plan || 'Free'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.quiz_count >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                                {u.quiz_count} / 5
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {u.is_blocked || (u.blocked_until && new Date(u.blocked_until) > new Date()) ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold uppercase">Bloqueado</span>
                                                    {u.blocked_until && <span className="text-[10px] text-red-500 mt-1">até {formatDate(u.blocked_until)}</span>}
                                                </div>
                                            ) : <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold uppercase">Ativo</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-slate-500">{formatDate(u.updated_at)}</td>
                                        <td className="px-6 py-4 text-center">
                                            {u.is_blocked || (u.blocked_until && new Date(u.blocked_until) > new Date()) ? (
                                                <button onClick={() => handleUserUnblock(u.user_id)} disabled={actionLoading === u.user_id} className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg">Desbloquear</button>
                                            ) : (
                                                <button onClick={() => openBlockModal({ type: 'user', id: u.user_id, name: u.user?.email || u.user_id })} disabled={actionLoading === u.user_id} className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg">Bloquear</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    // IPs TABLE
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">IP Address</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Último User</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Questões</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ips.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-slate-500">Nenhum IP anônimo registrado.</td></tr>
                                ) : ips.map(ip => {
                                    const blocked = ip.is_permanently_blocked || (ip.blocked_until && new Date(ip.blocked_until) > new Date());
                                    return (
                                        <tr key={ip.ip_address} className={`hover:bg-slate-50 ${blocked ? 'bg-red-50/30' : ''}`}>
                                            <td className="px-6 py-4 font-mono text-sm text-slate-700">{ip.ip_address}</td>
                                            <td className="px-6 py-4 text-xs text-slate-500">{ip.user?.email || '-'}</td>
                                            <td className="px-6 py-4 text-center"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">{ip.quiz_count}</span></td>
                                            <td className="px-6 py-4 text-center">
                                                {blocked ? <span className="text-red-600 font-bold text-xs uppercase">Bloqueado</span> : <span className="text-green-600 font-bold text-xs uppercase">Ativo</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center flex justify-center gap-2">
                                                {blocked ? (
                                                    <button onClick={() => handleIpUnblock(ip.ip_address)} disabled={actionLoading === ip.ip_address} className="text-xs bg-white border px-2 py-1 rounded">Desbloquear</button>
                                                ) : (
                                                    <>
                                                        <button onClick={() => openBlockModal({ type: 'ip', id: ip.ip_address, name: ip.ip_address })} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded">Temp</button>
                                                        <button onClick={() => handleIpBlock(ip.ip_address, 'permanent')} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">Perm</button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Block Modal */}
            {showBlockModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">
                            Bloquear {selectedItem.type === 'user' ? 'Usuário' : 'IP'} Temporariamente
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Alvo: <span className="font-mono font-medium text-slate-700">{selectedItem.name}</span>
                        </p>

                        <form onSubmit={handleBlockSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Duração (minutos)</label>
                                <input type="number" min="1" required value={blockDuration} onChange={(e) => setBlockDuration(parseInt(e.target.value))} className="w-full px-4 py-2 border rounded-xl" />
                                <div className="flex gap-2 mt-2">
                                    {[60, 1440, 10080].map(m => <button key={m} type="button" onClick={() => setBlockDuration(m)} className="px-2 py-1 text-xs bg-slate-100 rounded">{m < 60 ? `${m}m` : (m >= 1440 ? `${m / 1440}d` : `${m / 60}h`)}</button>)}
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
                                <input type="text" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Ex: Abuso de limite" className="w-full px-4 py-2 border rounded-xl" />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowBlockModal(false)} className="px-4 py-2 text-slate-600 font-medium">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium">Bloquear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
