import React, { useState, useEffect } from 'react';

interface PaymentMethod {
    id: string;
    type: 'reference' | 'qrcode' | 'transfer' | 'unitel';
    name: string;
    enabled: boolean;
    details: Record<string, string>;
}

interface PaymentProof {
    id: string;
    user_email: string;
    file_name: string;
    file_url?: string;
    status: 'pending' | 'approved' | 'rejected';
    plan_type?: string;
    created_at: string;
}

const DEFAULT_METHODS: PaymentMethod[] = [
    {
        id: '1',
        type: 'reference',
        name: 'Pagamento por Referência',
        enabled: true,
        details: {
            entity: '00000',
            reference: '123 456 789',
            beneficiary: 'Angola Saúde Prep'
        }
    },
    {
        id: '4',
        type: 'transfer',
        name: 'Transferência Bancária',
        enabled: true,
        details: {
            bank: 'Banco BAI',
            iban: 'AO06 0000 0000 0000 0000 0000 0',
            beneficiary: 'Angola Saúde Prep'
        }
    },
    {
        id: '5',
        type: 'unitel',
        name: 'Unitel Money',
        enabled: true,
        details: {
            phoneNumber: '920 000 000',
            entityName: 'Angola Saúde'
        }
    }
];

export const AdminPaymentSettings: React.FC = () => {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [proofs, setProofs] = useState<PaymentProof[]>([]);
    const [loadingProofs, setLoadingProofs] = useState(true);
    const [startLoadingMethods, setStartLoadingMethods] = useState(true);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [selectedPlanToApprove, setSelectedPlanToApprove] = useState<string>('pro');

    // Fetch data on mount
    useEffect(() => {
        fetchProofs();
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        setStartLoadingMethods(true);
        try {
            const response = await fetch('http://localhost:3001/payment-methods');
            if (response.ok) {
                const data = await response.json();
                if (data && Array.isArray(data) && data.length > 0) {
                    setMethods(data);
                } else {
                    // Fallback to defaults if empty and attempt to initialize
                    console.log('No methods found, initializing defaults...');
                    setMethods(DEFAULT_METHODS);
                    // Optional: Auto-save defaults to DB
                    saveMethodsToBackend(DEFAULT_METHODS).catch(err => console.warn('Failed to init DB:', err));
                }
            } else {
                setMethods(DEFAULT_METHODS);
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            setMethods(DEFAULT_METHODS);
        } finally {
            setStartLoadingMethods(false);
        }
    };

    const fetchProofs = async () => {
        setLoadingProofs(true);
        try {
            const response = await fetch('http://localhost:3001/payments/proofs');
            if (response.ok) {
                const data = await response.json();
                setProofs(data);
            }
        } catch (error) {
            console.error('Error fetching proofs:', error);
        } finally {
            setLoadingProofs(false);
        }
    };

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<PaymentMethod | null>(null);

    const saveMethodsToBackend = async (data: PaymentMethod[]) => {
        const response = await fetch('http://localhost:3001/payment-methods', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Backend error');
        }
    };

    const handleToggle = async (id: string) => {
        const updatedMethods = methods.map(m =>
            m.id === id ? { ...m, enabled: !m.enabled } : m
        );
        setMethods(updatedMethods); // Optimistic update

        try {
            await saveMethodsToBackend(updatedMethods);
        } catch (e) {
            console.error("Failed to auto-save toggle", e);
            alert("Atenção: A alteração não foi salva no servidor. Verifique se a tabela 'payment_methods' existe.");
        }
    };

    const handleEdit = (method: PaymentMethod) => {
        setEditingId(method.id);
        setEditForm({ ...method });
    };

    const handleSave = async () => {
        if (!editForm) return;

        const updatedMethods = methods.map(m =>
            m.id === editForm.id ? editForm : m
        );

        setMethods(updatedMethods); // Optimistic
        setEditingId(null);
        setEditForm(null);

        try {
            await saveMethodsToBackend(updatedMethods);
            alert('Configurações salvas e aplicadas com sucesso!');
        } catch (e: any) {
            console.error(e);
            alert('Erro ao salvar no servidor: ' + e.message);
        }
    };

    const handleApproveProof = async (id: string, email: string, plan: string) => {
        try {
            const response = await fetch(`http://localhost:3001/payments/proof/${id}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan })
            });
            if (response.ok) {
                const data = await response.json();
                setProofs(proofs.map(p =>
                    p.id === id ? { ...p, status: 'approved' as const } : p
                ));
                setApprovingId(null);
                alert(`Acesso ${plan.toUpperCase()} ativado para ${email}!`);
            } else {
                alert('Erro ao aprovar. Tente novamente.');
            }
        } catch (error) {
            console.error('Approve error:', error);
            alert('Erro de conexão.');
        }
    };

    const handleRejectProof = async (id: string) => {
        if (!confirm('Tem certeza que deseja rejeitar este comprovativo?')) return;

        try {
            const response = await fetch(`http://localhost:3001/payments/proof/${id}/reject`, {
                method: 'PUT'
            });
            if (response.ok) {
                setProofs(proofs.map(p =>
                    p.id === id ? { ...p, status: 'rejected' as const } : p
                ));
                alert('Comprovativo rejeitado.');
            } else {
                alert('Erro ao rejeitar. Tente novamente.');
            }
        } catch (error) {
            console.error('Reject error:', error);
            alert('Erro de conexão.');
        }
    };

    const handleDetailChange = (key: string, value: string) => {
        if (!editForm) return;
        setEditForm({
            ...editForm,
            details: {
                ...editForm.details,
                [key]: value
            }
        });
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-slate-900">Configuração de Pagamentos</h2>
                        <p className="text-slate-500 mt-1">Gerencie os métodos de pagamento disponíveis para os usuários.</p>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {startLoadingMethods ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {methods.map(method => (
                            <div key={method.id} className={`rounded-2xl border-2 transition-all p-6 ${method.enabled ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-75'}`}>
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${method.enabled ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {method.type === 'reference' && (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                            )}
                                            {method.type === 'qrcode' && (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM5 11v-1M5 19v-4M4 7h16M6 7v6m2-6v6m4-6v6m4-6v6m-4 6v4" /></svg>
                                            )}
                                            {method.type === 'transfer' && (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                                            )}
                                            {method.type === 'unitel' && (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">{method.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`inline-block w-2 h-2 rounded-full ${method.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                                <span className="text-xs font-medium text-slate-500">{method.enabled ? 'Ativo' : 'Inativo'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggle(method.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${method.enabled ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                                        >
                                            {method.enabled ? 'Desativar' : 'Ativar'}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(method)}
                                            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
                                        >
                                            Configurar
                                        </button>
                                    </div>
                                </div>

                                {/* Details View (When not editing) */}
                                {editingId !== method.id && Object.keys(method.details).length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        {Object.entries(method.details).map(([key, value]) => (
                                            <div key={key}>
                                                <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{key}</span>
                                                <span className="font-medium text-slate-700 font-mono text-xs">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Edit Mode */}
                                {editingId === method.id && editForm && (
                                    <div className="mt-4 bg-slate-50 p-6 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome do Método</label>
                                                <input
                                                    type="text"
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                />
                                            </div>
                                            {Object.entries(editForm.details).map(([key, value]) => (
                                                <div key={key}>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                    <input
                                                        type="text"
                                                        value={value}
                                                        onChange={(e) => handleDetailChange(key, e.target.value)}
                                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-4 py-2 rounded-lg text-slate-500 font-bold text-sm hover:bg-slate-200"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                className="px-4 py-2 rounded-lg bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 shadow-md"
                                            >
                                                Salvar Alterações
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Proofs Section */}
            <div className="border-t border-slate-100 bg-slate-50/50 p-8">
                <h3 className="text-xl font-display font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    Comprovativos Recebidos
                    {proofs.filter(p => p.status === 'pending').length > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                            {proofs.filter(p => p.status === 'pending').length} pendente(s)
                        </span>
                    )}
                </h3>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Usuário / Email</th>
                                <th className="px-6 py-4">Plano Solicitado</th>
                                <th className="px-6 py-4">Arquivo</th>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {proofs.map(proof => (
                                <tr key={proof.id} className={`hover:bg-slate-50 transition-colors ${proof.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                                    <td className="px-6 py-4 font-medium text-slate-900">{proof.user_email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${proof.plan_type === 'premier' ? 'bg-purple-100 text-purple-700' :
                                            proof.plan_type === 'pro' ? 'bg-brand-100 text-brand-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {proof.plan_type || 'pro'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-brand-600 underline cursor-pointer">
                                        {proof.file_url ? (
                                            <a href={proof.file_url} target="_blank" rel="noopener noreferrer">{proof.file_name}</a>
                                        ) : proof.file_name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{new Date(proof.created_at).toLocaleDateString('pt-PT')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${proof.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                            proof.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {proof.status === 'approved' ? 'Aprovado' : proof.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {proof.status === 'pending' && (
                                            <div className="flex items-center justify-end gap-2">
                                                {approvingId === proof.id ? (
                                                    <div className="flex items-center gap-2 animate-in fade-in">
                                                        <select
                                                            value={selectedPlanToApprove}
                                                            onChange={(e) => setSelectedPlanToApprove(e.target.value)}
                                                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                                        >
                                                            <option value="lite">Lite</option>
                                                            <option value="pro">Pro</option>
                                                            <option value="premier">Premier</option>
                                                        </select>
                                                        <button
                                                            onClick={() => handleApproveProof(proof.id, proof.user_email, selectedPlanToApprove)}
                                                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                                                        >
                                                            Confirmar
                                                        </button>
                                                        <button
                                                            onClick={() => setApprovingId(null)}
                                                            className="text-slate-400 hover:text-slate-600 px-2"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setApprovingId(proof.id);
                                                                setSelectedPlanToApprove(proof.plan_type || 'pro');
                                                            }}
                                                            className="text-emerald-600 hover:text-emerald-800 font-bold text-xs bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            ✓ Ativar Cliente
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectProof(proof.id)}
                                                            className="text-red-600 hover:text-red-800 font-bold text-xs bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            ✕ Rejeitar
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        {proof.status === 'approved' && (
                                            <span className="text-emerald-600 text-xs font-medium flex items-center justify-end gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                Cliente Ativo
                                            </span>
                                        )}
                                        {proof.status === 'rejected' && (
                                            <span className="text-red-500 text-xs font-medium">Rejeitado</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {loadingProofs && (
                        <div className="p-8 text-center text-slate-500">
                            <div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                            Carregando comprovativos...
                        </div>
                    )}
                    {!loadingProofs && proofs.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            Nenhum comprovativo recebido ainda.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
