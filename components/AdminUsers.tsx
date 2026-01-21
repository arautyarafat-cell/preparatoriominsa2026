import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { API_URL } from '../config/api';

interface User {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
    plan: 'free' | 'lite' | 'pro' | 'premier';
    plan_activated_at: string | null;
    status: string;
}

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<string>('free');

    // Create User State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', plan: 'free' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const authHeaders = authService.getAuthHeaders();
            const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
            const response = await fetch(`${API_URL}/users${query}`, {
                headers: {
                    ...authHeaders
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []); // Handle { users: [...] } structure
            } else {
                console.error('Error fetching users:', response.status, await response.text());
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers();
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setSelectedPlan(user.plan);
    };

    const handleSavePlan = async () => {
        if (!editingUser) return;

        try {
            const authHeaders = authService.getAuthHeaders();
            const response = await fetch(`${API_URL}/users/${editingUser.id}/plan`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({
                    plan: selectedPlan,
                    email: editingUser.email
                })
            });

            if (response.ok) {
                fetchUsers(); // Refresh list
                setEditingUser(null);
                alert('Plano do usuário atualizado com sucesso!');
            } else {
                const err = await response.json();
                alert(`Erro ao atualizar plano: ${err.error}`);
            }
        } catch (error) {
            console.error('Error updating plan:', error);
            alert('Erro de conexão.');
        }
    };

    const handleCreateUser = async () => {
        try {
            if (!newUser.email || !newUser.password) {
                alert('Preencha email e senha.');
                return;
            }

            const authHeaders = authService.getAuthHeaders();
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify(newUser)
            });

            if (response.ok) {
                setShowCreateModal(false);
                setNewUser({ email: '', password: '', plan: 'free' });
                fetchUsers();
                alert('Usuário criado com sucesso!');
            } else {
                const err = await response.json();
                alert(`Erro ao criar usuário: ${err.error}`);
            }
        } catch (error) {
            alert('Erro ao criar usuário.');
        }
    };

    const handleBlockUser = async (user: User) => {
        const isBlocked = user.status === 'blocked';
        const action = isBlocked ? 'desbloquear' : 'bloquear';

        if (!confirm(`Tem certeza que deseja ${action} o usuário ${user.email}?`)) return;

        try {
            const authHeaders = authService.getAuthHeaders();
            const url = `${API_URL}/users/${user.id}/block`;
            const method = isBlocked ? 'DELETE' : 'POST';

            const body = isBlocked ? { email: user.email } : { email: user.email, reason: 'Bloqueio administrativo' };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                fetchUsers();
            } else {
                const err = await response.json();
                alert(`Erro: ${err.error}`);
            }
        } catch (error) {
            alert('Erro de conexão.');
        }
    };

    const handleDeleteUser = async (user: User) => {
        if (!confirm(`ATENÇÃO: Tem certeza que deseja ELIMINAR PERMANENTEMENTE o usuário ${user.email}? Esta ação não pode ser desfeita.`)) return;

        try {
            const authHeaders = authService.getAuthHeaders();
            const response = await fetch(`${API_URL}/users/${user.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ confirmEmail: user.email })
            });

            if (response.ok) {
                fetchUsers();
                alert('Usuário eliminado com sucesso.');
            } else {
                const err = await response.json();
                alert(`Erro ao eliminar: ${err.error}`);
            }
        } catch (error) {
            alert('Erro de conexão.');
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Nunca';
        return new Date(dateString).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur rounded-3xl p-8 border border-white/50 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h3 className="font-bold text-xl text-slate-900">Base de Usuários ({users.length})</h3>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nome ou email..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </form>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="text-sm font-bold text-white bg-brand-600 px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20 whitespace-nowrap"
                        >
                            + Novo Usuário
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden bg-white rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Usuário / Email</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Plano</th>
                                <th className="px-6 py-4">Criado em</th>
                                <th className="px-6 py-4">Último Acesso</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                        Carregando usuários...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                                                    {user.email[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{user.email.split('@')[0]}</p>
                                                    <p className="text-xs text-slate-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Ativo</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${user.plan === 'premier' ? 'bg-purple-100 text-purple-700' :
                                                user.plan === 'pro' ? 'bg-brand-100 text-brand-700' :
                                                    user.plan === 'lite' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-500'
                                                }`}>
                                                {user.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{formatDate(user.last_sign_in_at)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                                                    title="Editar Plano"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleBlockUser(user)}
                                                    className={`p-1 transition-colors ${user.status === 'blocked' ? 'text-red-500 hover:text-red-700' : 'text-slate-400 hover:text-orange-500'}`}
                                                    title={user.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                                                >
                                                    {user.status === 'blocked' ? (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                    title="Eliminar usuário"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Novo Usuário</h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2"
                                    placeholder="email@exemplo.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Senha</label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2"
                                    placeholder="******"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Plano Inicial</label>
                                <select
                                    value={newUser.plan}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, plan: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2"
                                >
                                    <option value="free">Free</option>
                                    <option value="lite">Lite</option>
                                    <option value="pro">Pro</option>
                                    <option value="premier">Premier</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateUser}
                                className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
                            >
                                Criar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal (Existing) */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Editar Usuário</h3>
                        <p className="text-slate-500 text-sm mb-6">{editingUser.email}</p>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Plano de Acesso</label>
                            <select
                                value={selectedPlan}
                                onChange={(e) => setSelectedPlan(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="free">Free (Gratuito)</option>
                                <option value="lite">Lite</option>
                                <option value="pro">Pro</option>
                                <option value="premier">Premier</option>
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSavePlan}
                                className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
