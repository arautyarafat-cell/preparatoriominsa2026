import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../constants';
import { Category } from '../types';
import { API_URL } from '../config/api';

export const AdminTrilhas: React.FC = () => {
    const [blockedCategories, setBlockedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchBlockedCategories();
    }, []);

    const fetchBlockedCategories = async () => {
        try {
            const res = await fetch(`${API_URL}/blocking/categories`);
            const data = await res.json();
            setBlockedCategories(data.blockedCategories || []);
        } catch (e) {
            console.error('Erro ao buscar categorias bloqueadas:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = async (category: Category) => {
        const isCurrentlyBlocked = blockedCategories.includes(category.id);
        setUpdating(category.id);

        try {
            if (isCurrentlyBlocked) {
                // Desbloquear
                const res = await fetch(`${API_URL}/blocking/category/${category.id}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    setBlockedCategories(prev => prev.filter(id => id !== category.id));
                } else {
                    alert('Erro ao desbloquear trilha');
                }
            } else {
                // Bloquear
                const res = await fetch(`${API_URL}/blocking/category`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        categoryId: category.id,
                        categoryName: category.title
                    })
                });

                if (res.ok) {
                    setBlockedCategories(prev => [...prev, category.id]);
                } else {
                    alert('Erro ao bloquear trilha');
                }
            }
        } catch (e) {
            console.error('Erro ao atualizar bloqueio:', e);
            alert('Erro de conexão');
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur rounded-3xl p-6 border border-white/50 shadow-sm">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg">
                        📚
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-display text-slate-900">Trilhas de Conhecimento</h2>
                        <p className="text-slate-500">Gerencie a disponibilidade das trilhas para os usuários</p>
                    </div>
                </div>
            </div>

            {/* Info Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                    <h4 className="font-bold text-amber-800">Atenção</h4>
                    <p className="text-sm text-amber-700">
                        Trilhas bloqueadas aparecerão como "Indisponível" para todos os usuários (exceto admins).
                        Use esta função para ocultar trilhas em desenvolvimento.
                    </p>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORIES.map((category) => {
                    const isBlocked = blockedCategories.includes(category.id);
                    const isUpdatingThis = updating === category.id;

                    return (
                        <div
                            key={category.id}
                            className={`bg-white rounded-2xl border-2 p-5 transition-all ${isBlocked
                                ? 'border-red-200 bg-red-50/50'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg ${isBlocked ? 'bg-slate-300 grayscale' : category.color
                                    } text-white`}>
                                    {isBlocked ? '🔒' : category.icon}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-slate-900">{category.title}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-1">{category.description}</p>

                                    {/* Status Badges */}
                                    <div className="flex items-center gap-2 mt-2">
                                        {isBlocked ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                Bloqueada (Indisponível para usuários)
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                Disponível
                                            </span>
                                        )}

                                        <span className="text-xs text-slate-400">
                                            {category.totalQuestions} questões
                                        </span>
                                    </div>
                                </div>

                                {/* Toggle Button */}
                                <div className="flex flex-col items-center gap-2">
                                    <button
                                        onClick={() => handleToggleBlock(category)}
                                        disabled={isUpdatingThis}
                                        className={`relative w-14 h-8 rounded-full transition-all duration-300 ${isBlocked
                                            ? 'bg-red-500'
                                            : 'bg-emerald-500'
                                            } ${isUpdatingThis ? 'opacity-50 cursor-wait' : ''}`}
                                    >
                                        <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${isBlocked ? 'left-1' : 'left-7'
                                            }`}>
                                            {isUpdatingThis && (
                                                <span className="absolute inset-0 flex items-center justify-center">
                                                    <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isBlocked ? 'text-red-600' : 'text-emerald-600'
                                        }`}>
                                        {isBlocked ? 'Bloqueada' : 'Liberada'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="bg-slate-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        <span className="text-sm text-slate-600">
                            <strong>{CATEGORIES.length - blockedCategories.length}</strong> trilhas disponíveis
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-sm text-slate-600">
                            <strong>{blockedCategories.length}</strong> trilhas bloqueadas
                        </span>
                    </div>
                </div>
                <button
                    onClick={fetchBlockedCategories}
                    className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Atualizar
                </button>
            </div>
        </div>
    );
};

export default AdminTrilhas;
