import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../constants';
import { authService } from '../services/auth';
import { API_URL } from '../config/api';

interface BlockedUser {
    email: string;
    reason: string;
    blockedAt: string;
}

export const AdminBlocking: React.FC = () => {
    const [blockedCategories, setBlockedCategories] = useState<string[]>([]);
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [blockingUser, setBlockingUser] = useState(false);
    const [blockReason, setBlockReason] = useState('');
    const [selectedUserEmail, setSelectedUserEmail] = useState('');
    const [showBlockUserModal, setShowBlockUserModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch blocking data
            const blockRes = await fetch(`${API_URL}/blocking`, {
                headers: authService.getAuthHeaders()
            });
            if (blockRes.ok) {
                const blockData = await blockRes.json();
                setBlockedCategories(blockData.blockedCategories || []);
                setBlockedUsers(blockData.blockedUsers || []);
            }

            // Fetch users
            const usersRes = await fetch(`${API_URL}/users`, {
                headers: authService.getAuthHeaders()
            });
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(usersData.users || []);
            }

        } catch (e) {
            console.error('Failed to fetch data:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleBlockCategory = async (categoryId: string, categoryName: string) => {
        try {
            const res = await fetch(`${API_URL}/blocking/category`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeaders()
                },
                body: JSON.stringify({ categoryId, categoryName })
            });

            if (res.ok) {
                setBlockedCategories(prev => [...prev, categoryId]);
            } else {
                alert('Erro ao bloquear categoria');
            }
        } catch (e) {
            console.error('Failed to block category:', e);
        }
    };

    const handleUnblockCategory = async (categoryId: string) => {
        try {
            const res = await fetch(`${API_URL}/blocking/category/${categoryId}`, {
                method: 'DELETE',
                headers: authService.getAuthHeaders()
            });

            if (res.ok) {
                setBlockedCategories(prev => prev.filter(id => id !== categoryId));
            } else {
                alert('Erro ao desbloquear categoria');
            }
        } catch (e) {
            console.error('Failed to unblock category:', e);
        }
    };

    const handleBlockUser = async () => {
        if (!selectedUserEmail) return;

        setBlockingUser(true);
        try {
            const res = await fetch(`${API_URL}/blocking/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeaders()
                },
                body: JSON.stringify({
                    email: selectedUserEmail,
                    reason: blockReason || 'Bloqueado pelo administrador'
                })
            });

            if (res.ok) {
                setBlockedUsers(prev => [...prev, {
                    email: selectedUserEmail,
                    reason: blockReason || 'Bloqueado pelo administrador',
                    blockedAt: new Date().toISOString()
                }]);
                setShowBlockUserModal(false);
                setSelectedUserEmail('');
                setBlockReason('');
            } else {
                alert('Erro ao bloquear usuário');
            }
        } catch (e) {
            console.error('Failed to block user:', e);
        } finally {
            setBlockingUser(false);
        }
    };

    const handleUnblockUser = async (email: string) => {
        try {
            const res = await fetch(`${API_URL}/blocking/user/${encodeURIComponent(email)}`, {
                method: 'DELETE',
                headers: authService.getAuthHeaders()
            });

            if (res.ok) {
                setBlockedUsers(prev => prev.filter(u => u.email !== email));
            } else {
                alert('Erro ao desbloquear usuário');
            }
        } catch (e) {
            console.error('Failed to unblock user:', e);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Categories Blocking Section */}
            <div className="bg-white/80 backdrop-blur rounded-3xl p-6 border border-white/50 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Bloquear Trilhas de Conhecimento
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Trilhas bloqueadas ficam indisponíveis para todos os usuários.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {CATEGORIES.map((cat) => {
                        const isBlocked = blockedCategories.includes(cat.id);
                        return (
                            <div
                                key={cat.id}
                                className={`relative p-4 rounded-2xl border-2 transition-all ${isBlocked
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`text-2xl ${isBlocked ? 'grayscale opacity-50' : ''}`}>
                                        {cat.icon || '📚'}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-bold ${isBlocked ? 'text-red-700 line-through' : 'text-slate-900'}`}>
                                            {cat.title}
                                        </p>
                                        {isBlocked && (
                                            <p className="text-xs text-red-600 font-medium">Bloqueada</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => isBlocked
                                            ? handleUnblockCategory(cat.id)
                                            : handleBlockCategory(cat.id, cat.title)
                                        }
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isBlocked
                                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                            : 'bg-red-500 text-white hover:bg-red-600'
                                            }`}
                                    >
                                        {isBlocked ? 'Desbloquear' : 'Bloquear'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Users Blocking Section */}
            <div className="bg-white/80 backdrop-blur rounded-3xl p-6 border border-white/50 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Bloquear Usuários
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Usuários bloqueados não conseguem acessar a plataforma.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowBlockUserModal(true)}
                        className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Bloquear Usuário
                    </button>
                </div>

                {/* Blocked Users List */}
                {blockedUsers.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <p className="font-medium">Nenhum usuário bloqueado</p>
                        <p className="text-sm mt-1">Todos os usuários têm acesso à plataforma.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {blockedUsers.map((user) => (
                            <div
                                key={user.email}
                                className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center text-red-700 font-bold">
                                        {user.email[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{user.email}</p>
                                        <p className="text-sm text-red-600">{user.reason}</p>
                                        <p className="text-xs text-slate-400">
                                            Bloqueado em: {new Date(user.blockedAt).toLocaleDateString('pt-PT')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleUnblockUser(user.email)}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                                >
                                    Desbloquear
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Block User Modal */}
            {showBlockUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Bloquear Usuário</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Selecionar Usuário
                                </label>
                                <select
                                    value={selectedUserEmail}
                                    onChange={(e) => setSelectedUserEmail(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    <option value="">Selecione um usuário...</option>
                                    {users
                                        .filter(u => !blockedUsers.find(bu => bu.email === u.email))
                                        .map((user) => (
                                            <option key={user.id} value={user.email}>
                                                {user.email}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Motivo do Bloqueio (Opcional)
                                </label>
                                <textarea
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    placeholder="Ex: Violação dos termos de uso..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none h-24"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => {
                                    setShowBlockUserModal(false);
                                    setSelectedUserEmail('');
                                    setBlockReason('');
                                }}
                                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleBlockUser}
                                disabled={!selectedUserEmail || blockingUser}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {blockingUser ? 'Bloqueando...' : 'Confirmar Bloqueio'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBlocking;
