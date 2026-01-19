import React, { useState, useEffect, useRef } from 'react';

interface AdminDecipherTermsProps {
    categories: any[];
}

interface DecipherTerm {
    id: string;
    term: string;
    hint: string;
    definition: string;
    category_id: string | null;
    difficulty: 'facil' | 'medio' | 'dificil';
    is_active: boolean;
    created_at: string;
    categories?: { id: string; name: string; icon: string } | null;
}

export const AdminDecipherTerms: React.FC<AdminDecipherTermsProps> = ({ categories }) => {
    const [terms, setTerms] = useState<DecipherTerm[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [term, setTerm] = useState('');
    const [hint, setHint] = useState('');
    const [definition, setDefinition] = useState('');
    const [difficulty, setDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');

    // Edit Modal State
    const [editingTerm, setEditingTerm] = useState<DecipherTerm | null>(null);
    const [editTerm, setEditTerm] = useState('');
    const [editHint, setEditHint] = useState('');
    const [editDefinition, setEditDefinition] = useState('');
    const [editDifficulty, setEditDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');
    const [editCategoryId, setEditCategoryId] = useState('');
    const [editActive, setEditActive] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Bulk Import State
    const [importMode, setImportMode] = useState<'manual' | 'csv'>('manual');
    const [csvText, setCsvText] = useState('');
    const [extractedTerms, setExtractedTerms] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get backend URL dynamically
    const getBackendUrl = () => {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            return `http://${hostname}:3001`;
        }
        return 'http://localhost:3001';
    };

    const BACKEND_URL = getBackendUrl();

    useEffect(() => {
        fetchTerms();
    }, [selectedCategory]);

    const fetchTerms = async () => {
        setLoading(true);
        try {
            let url = `${BACKEND_URL}/decipher-terms`;
            if (selectedCategory) url += `?category_id=${selectedCategory}`;
            const res = await fetch(url);
            const data = await res.json();
            setTerms(data.data || []);
        } catch (error) {
            console.error('Error fetching terms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!term || !hint || !definition) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${BACKEND_URL}/decipher-terms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    term,
                    hint,
                    definition,
                    category_id: selectedCategory || null,
                    difficulty
                })
            });

            if (res.ok) {
                alert('Termo adicionado com sucesso!');
                setTerm('');
                setHint('');
                setDefinition('');
                setDifficulty('medio');
                fetchTerms();
            } else {
                const error = await res.json();
                alert('Erro ao adicionar: ' + error.error);
            }
        } catch (error) {
            console.error('Error creating term:', error);
            alert('Erro de conexão.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja apagar este termo?')) return;

        try {
            const res = await fetch(`${BACKEND_URL}/decipher-terms/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setTerms(prev => prev.filter(t => t.id !== id));
            } else {
                const error = await res.json();
                alert('Erro ao apagar: ' + error.error);
            }
        } catch (error) {
            console.error('Error deleting term:', error);
            alert('Erro de conexão.');
        }
    };

    const handleDeleteAll = async () => {
        const msg = selectedCategory
            ? 'ATENÇÃO: Isso irá APAGAR TODOS os termos desta categoria! Tem certeza?'
            : 'ATENÇÃO: Isso irá APAGAR TODOS os termos do jogo! Tem certeza?';

        if (!confirm(msg)) return;
        if (!confirm('Esta ação é IRREVERSÍVEL. Clique OK para continuar.')) return;

        try {
            let url = `${BACKEND_URL}/decipher-terms/bulk`;
            if (selectedCategory) url += `?category_id=${selectedCategory}`;

            const res = await fetch(url, { method: 'DELETE' });

            if (res.ok) {
                setTerms([]);
                alert('Todos os termos foram apagados com sucesso!');
            } else {
                const error = await res.json();
                alert('Erro ao apagar: ' + error.error);
            }
        } catch (error) {
            console.error('Error deleting all terms:', error);
        }
    };

    const openEditModal = (termData: DecipherTerm) => {
        setEditingTerm(termData);
        setEditTerm(termData.term);
        setEditHint(termData.hint);
        setEditDefinition(termData.definition);
        setEditDifficulty(termData.difficulty);
        setEditCategoryId(termData.category_id || '');
        setEditActive(termData.is_active);
    };

    const closeEditModal = () => {
        setEditingTerm(null);
        setEditTerm('');
        setEditHint('');
        setEditDefinition('');
        setEditDifficulty('medio');
        setEditCategoryId('');
        setEditActive(true);
    };

    const handleUpdate = async () => {
        if (!editingTerm) return;

        setIsUpdating(true);
        try {
            const res = await fetch(`${BACKEND_URL}/decipher-terms/${editingTerm.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    term: editTerm,
                    hint: editHint,
                    definition: editDefinition,
                    difficulty: editDifficulty,
                    category_id: editCategoryId || null,
                    is_active: editActive
                })
            });

            if (res.ok) {
                const result = await res.json();
                setTerms(prev => prev.map(t => t.id === editingTerm.id ? result.data : t));
                closeEditModal();
                alert('Termo atualizado com sucesso!');
            } else {
                const error = await res.json();
                alert('Erro ao atualizar: ' + error.error);
            }
        } catch (error) {
            console.error('Error updating term:', error);
            alert('Erro de conexão.');
        } finally {
            setIsUpdating(false);
        }
    };

    // CSV Import Functions
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            setCsvText(text);
            parseCSV(text);
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Erro ao ler arquivo.');
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const parseCSV = (text: string) => {
        const lines = text.split('\n').filter(l => l.trim());
        const parsed: any[] = [];

        for (const line of lines) {
            const parts = line.split(',').map(p => p.trim());
            // Formato: Termo, Dica, Definição, Dificuldade (opcional)
            if (parts.length < 3) continue;

            const [termVal, hintVal, definitionVal, difficultyVal] = parts;
            if (!termVal || !hintVal || !definitionVal) continue;

            parsed.push({
                term: termVal.toUpperCase(),
                hint: hintVal,
                definition: definitionVal,
                difficulty: ['facil', 'medio', 'dificil'].includes(difficultyVal?.toLowerCase())
                    ? difficultyVal.toLowerCase()
                    : 'medio'
            });
        }

        if (parsed.length === 0) {
            alert('Nenhum termo válido encontrado. Use o formato: Termo, Dica, Definição');
            return;
        }

        setExtractedTerms(parsed);
        alert(`${parsed.length} termos encontrados! Revise e confirme a importação.`);
    };

    const handleBulkImport = async () => {
        if (extractedTerms.length === 0) return;

        setIsImporting(true);
        try {
            const res = await fetch(`${BACKEND_URL}/decipher-terms/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    terms: extractedTerms,
                    category_id: selectedCategory || null
                })
            });

            if (res.ok) {
                const result = await res.json();
                alert(`Importado com sucesso! ${result.count} termos adicionados.`);
                setExtractedTerms([]);
                setCsvText('');
                fetchTerms();
            } else {
                const error = await res.json();
                alert('Erro na importação: ' + error.error);
            }
        } catch (error) {
            console.error('Error importing terms:', error);
            alert('Erro de conexão.');
        } finally {
            setIsImporting(false);
        }
    };

    const getDifficultyLabel = (diff: string) => {
        switch (diff) {
            case 'facil': return { text: 'Fácil', color: 'bg-green-100 text-green-700' };
            case 'medio': return { text: 'Médio', color: 'bg-yellow-100 text-yellow-700' };
            case 'dificil': return { text: 'Difícil', color: 'bg-red-100 text-red-700' };
            default: return { text: 'Médio', color: 'bg-yellow-100 text-yellow-700' };
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Decifre o Termo</h2>
                    <p className="text-slate-500 text-sm mt-1">Gerenciar termos técnicos para o jogo de adivinhação</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setImportMode(importMode === 'manual' ? 'csv' : 'manual')}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm"
                    >
                        {importMode === 'manual' ? '📥 Importar CSV' : '✏️ Modo Manual'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Panel - Form */}
                <div className="md:col-span-1 space-y-6">
                    {/* Add Term Form */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="text-2xl">🎯</span>
                            {importMode === 'manual' ? 'Adicionar Termo' : 'Importar CSV'}
                        </h3>

                        {importMode === 'manual' ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Termo *</label>
                                    <input
                                        type="text"
                                        value={term}
                                        onChange={e => setTerm(e.target.value.toUpperCase())}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono uppercase"
                                        placeholder="HIPERTENSAO"
                                        required
                                    />
                                    <p className="text-xs text-slate-400 mt-1">A palavra que o jogador irá decifrar</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Dica *</label>
                                    <input
                                        type="text"
                                        value={hint}
                                        onChange={e => setHint(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="Pressão alta sustentada"
                                        required
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Uma pista curta para ajudar</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Definição Técnica *</label>
                                    <textarea
                                        value={definition}
                                        onChange={e => setDefinition(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[100px]"
                                        placeholder="Condição clínica caracterizada por elevação sustentada dos níveis pressóricos..."
                                        required
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Explicação exibida após o jogo</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                    <select
                                        value={selectedCategory}
                                        onChange={e => setSelectedCategory(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="">Geral / Todas</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Dificuldade</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'facil', label: 'Fácil', emoji: '🟢' },
                                            { value: 'medio', label: 'Médio', emoji: '🟡' },
                                            { value: 'dificil', label: 'Difícil', emoji: '🔴' }
                                        ].map(d => (
                                            <button
                                                key={d.value}
                                                type="button"
                                                onClick={() => setDifficulty(d.value as any)}
                                                className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${difficulty === d.value
                                                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                    }`}
                                            >
                                                {d.emoji} {d.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`w-full py-3 rounded-xl font-bold text-white transition-all ${submitting
                                            ? 'bg-slate-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-indigo-500/25'
                                        }`}
                                >
                                    {submitting ? 'Salvando...' : '➕ Adicionar Termo'}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-brand-300 transition-colors">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept=".csv,.txt"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-slate-600 hover:text-brand-600"
                                    >
                                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <span className="font-medium">Clique para upload CSV</span>
                                    </button>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 space-y-2">
                                    <p className="font-bold">📋 Formato CSV:</p>
                                    <code className="block bg-white p-2 rounded text-xs">
                                        Termo, Dica, Definição, Dificuldade
                                    </code>
                                    <p className="text-xs text-slate-400">
                                        Dificuldade opcional: facil, medio, dificil
                                    </p>
                                </div>

                                <textarea
                                    value={csvText}
                                    onChange={e => setCsvText(e.target.value)}
                                    placeholder="Ou cole o CSV aqui..."
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[120px] text-sm font-mono"
                                />

                                <button
                                    onClick={() => parseCSV(csvText)}
                                    disabled={!csvText.trim()}
                                    className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 font-medium"
                                >
                                    📊 Processar CSV
                                </button>

                                {extractedTerms.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <p className="text-green-700 font-medium text-sm">
                                                ✅ {extractedTerms.length} termos prontos para importar
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleBulkImport}
                                            disabled={isImporting}
                                            className={`w-full py-3 rounded-xl font-bold text-white ${isImporting
                                                    ? 'bg-slate-400'
                                                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                                                }`}
                                        >
                                            {isImporting ? 'Importando...' : '📥 Importar Todos'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Terms List */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">
                            Termos Cadastrados ({terms.length})
                        </h3>
                        <div className="flex gap-2">
                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm"
                            >
                                <option value="">Todas as Categorias</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {terms.length > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    🗑️ Apagar Todos
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-slate-400">
                            <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2"></div>
                            Carregando...
                        </div>
                    ) : terms.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                            <span className="text-4xl mb-4 block">🎯</span>
                            <h3 className="font-bold text-slate-900 mb-2">Nenhum termo cadastrado</h3>
                            <p className="text-slate-400 text-sm">
                                Adicione termos técnicos para o jogo "Decifre o Termo"
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {terms.map(t => {
                                const diffLabel = getDifficultyLabel(t.difficulty);
                                return (
                                    <div
                                        key={t.id}
                                        className={`bg-white p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${t.is_active ? 'border-slate-100' : 'border-red-200 bg-red-50/50 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="font-mono font-bold text-lg text-slate-900 tracking-widest">
                                                        {t.term}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffLabel.color}`}>
                                                        {diffLabel.text}
                                                    </span>
                                                    {!t.is_active && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                                                            Inativo
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-indigo-600 font-medium mb-1">
                                                    💡 {t.hint}
                                                </p>
                                                <p className="text-sm text-slate-500 line-clamp-2">
                                                    {t.definition}
                                                </p>
                                                <div className="flex gap-2 mt-2 text-xs text-slate-400">
                                                    {t.categories && (
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded">
                                                            {t.categories.icon} {t.categories.name}
                                                        </span>
                                                    )}
                                                    <span>
                                                        {new Date(t.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEditModal(t)}
                                                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingTerm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Editar Termo</h3>
                            <button
                                onClick={closeEditModal}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Termo</label>
                                <input
                                    type="text"
                                    value={editTerm}
                                    onChange={e => setEditTerm(e.target.value.toUpperCase())}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Dica</label>
                                <input
                                    type="text"
                                    value={editHint}
                                    onChange={e => setEditHint(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Definição</label>
                                <textarea
                                    value={editDefinition}
                                    onChange={e => setEditDefinition(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[100px]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                <select
                                    value={editCategoryId}
                                    onChange={e => setEditCategoryId(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                                >
                                    <option value="">Geral / Todas</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Dificuldade</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'facil', label: 'Fácil', emoji: '🟢' },
                                        { value: 'medio', label: 'Médio', emoji: '🟡' },
                                        { value: 'dificil', label: 'Difícil', emoji: '🔴' }
                                    ].map(d => (
                                        <button
                                            key={d.value}
                                            type="button"
                                            onClick={() => setEditDifficulty(d.value as any)}
                                            className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${editDifficulty === d.value
                                                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            {d.emoji} {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editActive}
                                        onChange={e => setEditActive(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                </label>
                                <span className="text-sm text-slate-700">Termo Ativo</span>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeEditModal}
                                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className={`flex-1 py-3 rounded-xl font-bold text-white ${isUpdating
                                        ? 'bg-slate-400'
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                                    }`}
                            >
                                {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
