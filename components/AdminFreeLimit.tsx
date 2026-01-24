import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { API_URL } from '../config/api';

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
}

export const AdminFreeLimit: React.FC = () => {
    const [ips, setIps] = useState<IPLimit[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [selectedIp, setSelectedIp] = useState<IPLimit | null>(null);
    const [blockDuration, setBlockDuration] = useState(60); // Default 60 minutes
    const [blockReason, setBlockReason] = useState('');

    useEffect(() => {
        fetchLimits();
    }, []);

    const fetchLimits = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/limits/ips`, {
                headers: authService.getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setIps(data.ips || []);
            }
        } catch (error) {
            console.error('Failed to fetch limits:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePermanentBlock = async (ip: IPLimit) => {
        if (!confirm(`Tem certeza que deseja BLOQUEAR PERMANENTEMENTE o IP ${ip.ip_address}?`)) {
            return;
        }

        setActionLoading(ip.ip_address);
        try {
            const response = await fetch(`${API_URL}/admin/limits/block`, {
                method: 'POST',
                headers: {
                    ...authService.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ip_address: ip.ip_address,
                    type: 'permanent',
                    reason: 'Bloqueio administrativo permanente'
                })
            });

            if (response.ok) {
                alert('IP bloqueado permanentemente com sucesso!');
                fetchLimits();
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

    const openTemporaryBlockModal = (ip: IPLimit) => {
        setSelectedIp(ip);
        setBlockDuration(60);
        setBlockReason('');
        setShowBlockModal(true);
    };

    const handleTemporaryBlock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIp) return;

        setActionLoading(selectedIp.ip_address);
        setShowBlockModal(false);

        try {
            const response = await fetch(`${API_URL}/admin/limits/block`, {
                method: 'POST',
                headers: {
                    ...authService.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ip_address: selectedIp.ip_address,
                    type: 'temporary',
                    duration_minutes: blockDuration,
                    reason: blockReason || 'Bloqueio temporário'
                })
            });

            if (response.ok) {
                alert('IP bloqueado temporariamente com sucesso!');
                fetchLimits();
            } else {
                const data = await response.json();
                alert('Erro ao bloquear: ' + data.error);
            }
        } catch (error) {
            alert('Erro de conexão');
        } finally {
            setActionLoading(null);
            setSelectedIp(null);
        }
    };

    const handleUnblock = async (ip: IPLimit) => {
        if (!confirm(`Deseja DESBLOQUEAR o IP ${ip.ip_address}?`)) {
            return;
        }

        setActionLoading(ip.ip_address);
        try {
            const response = await fetch(`${API_URL}/admin/limits/unblock`, {
                method: 'POST',
                headers: {
                    ...authService.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ip_address: ip.ip_address })
            });

            if (response.ok) {
                alert('IP desbloqueado com sucesso!');
                fetchLimits();
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

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isBlocked = (ip: IPLimit) => {
        if (ip.is_permanently_blocked) return true;
        if (ip.blocked_until && new Date(ip.blocked_until) > new Date()) return true;
        return false;
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
                        <h2 className="text-2xl font-bold">Limites de Conta Gratuita</h2>
                        <p className="text-white/80">Gestão de IPs e limites de questionários gratuitos</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">IPs Monitorados (Últimos 100 ativos)</h3>
                    <button
                        onClick={fetchLimits}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        title="Atualizar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : ips.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-slate-500">Nenhum registro encontrado.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">IP Address</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Questões</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Primeiro Acesso</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Último Acesso</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ips.map((ip) => {
                                    const blocked = isBlocked(ip);
                                    return (
                                        <tr key={ip.ip_address} className={`hover:bg-slate-50 transition-colors ${blocked ? 'bg-red-50/30' : ''}`}>
                                            <td className="px-6 py-4 font-mono text-sm text-slate-700">
                                                {ip.ip_address}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ip.quiz_count >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {ip.quiz_count} / 5
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-slate-500">
                                                {formatDate(ip.first_quiz_at)}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-slate-500">
                                                {formatDate(ip.last_quiz_at)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {blocked ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold uppercase">
                                                            Bloqueado
                                                        </span>
                                                        {ip.blocked_until && (
                                                            <span className="text-[10px] text-red-500 mt-1">
                                                                até {formatDate(ip.blocked_until)}
                                                            </span>
                                                        )}
                                                        {ip.is_permanently_blocked && (
                                                            <span className="text-[10px] text-red-500 mt-1">
                                                                PERMANENTE
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold uppercase">
                                                        Ativo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {blocked ? (
                                                        <button
                                                            onClick={() => handleUnblock(ip)}
                                                            disabled={actionLoading === ip.ip_address}
                                                            className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                                            Desbloquear
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => openTemporaryBlockModal(ip)}
                                                                disabled={actionLoading === ip.ip_address}
                                                                className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg transition-colors"
                                                                title="Bloquear Temporariamente"
                                                            >
                                                                Temp.
                                                            </button>
                                                            <button
                                                                onClick={() => handlePermanentBlock(ip)}
                                                                disabled={actionLoading === ip.ip_address}
                                                                className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg transition-colors"
                                                                title="Bloquear Permanentemente"
                                                            >
                                                                Perm.
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
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
            {showBlockModal && selectedIp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Bloquear IP Temporariamente</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            IP: <span className="font-mono font-medium text-slate-700">{selectedIp.ip_address}</span>
                        </p>

                        <form onSubmit={handleTemporaryBlock}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Duração (minutos)</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={blockDuration}
                                    onChange={(e) => setBlockDuration(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <div className="flex gap-2 mt-2">
                                    {[30, 60, 120, 1440].map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setBlockDuration(m)}
                                            className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                                        >
                                            {m < 60 ? `${m}m` : `${m / 60}h`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Motivo (opcional)</label>
                                <input
                                    type="text"
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    placeholder="Ex: Abuso de limite"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowBlockModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!!actionLoading}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium"
                                >
                                    Confirmar Bloqueio
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
