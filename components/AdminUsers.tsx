import React, { useState, useEffect } from 'react';

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
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<string>('free');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setSelectedPlan(user.plan);
    };

    const handleSavePlan = async () => {
        if (!editingUser) return;

        try {
            const response = await fetch(`http://localhost:3001/users/${editingUser.id}/plan`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: selectedPlan,
                    email: editingUser.email
                })
            });

            if (response.ok) {
                setUsers(users.map(u =>
                    u.id === editingUser.id ? { ...u, plan: selectedPlan as any } : u
                ));
                setEditingUser(null);
                alert('Plano do usuário atualizado com sucesso!');
            } else {
                alert('Erro ao atualizar plano.');
            }
        } catch (error) {
            console.error('Error updating plan:', error);
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
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold text-xl text-slate-900">Base de Usuários ({users.length})</h3>
                    <button className="text-sm font-bold text-brand-600 bg-brand-50 px-4 py-2 rounded-lg hover:bg-brand-100 transition-colors opacity-50 cursor-not-allowed" title="Em breve">
                        + Novo Usuário
                    </button>
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
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="text-brand-600 hover:text-brand-800 font-bold text-xs"
                                            >
                                                Editar Plano
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
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
