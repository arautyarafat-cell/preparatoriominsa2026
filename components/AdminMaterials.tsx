import React, { useState, useEffect, useRef } from 'react';
import { authService } from '../services/auth';

interface AdminMaterialsProps {
    categories: any[];
}

interface Material {
    id: string;
    title: string;
    file_path: string;
    file_size: string;
    created_at: string;
    category_id: string;
}

export const AdminMaterials: React.FC<AdminMaterialsProps> = ({ categories }) => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [uploading, setUploading] = useState(false);

    // Form
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchMaterials();
    }, [selectedCategory]);

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            let url = 'http://localhost:3001/materials';
            if (selectedCategory) url += `?category_id=${selectedCategory}`;
            const res = await fetch(url, {
                headers: authService.getAuthHeaders()
            });
            const data = await res.json();
            setMaterials(data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        if (selectedCategory) formData.append('category_id', selectedCategory);

        try {
            const res = await fetch('http://localhost:3001/materials', {
                method: 'POST',
                headers: authService.getAuthHeaders(), // For FormData, typically we don't set Content-Type as browser does it with boundary, but we need Auth
                body: formData
            });

            if (res.ok) {
                alert('Material adicionado com sucesso!');
                setTitle('');
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                fetchMaterials();
            } else {
                alert('Erro ao enviar.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao adicionar material.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja apagar este material?')) return;
        try {
            await fetch(`http://localhost:3001/materials/${id}`, {
                method: 'DELETE',
                headers: authService.getAuthHeaders()
            });
            fetchMaterials();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Materiais Complementares</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Upload Form */}
                <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit sticky top-6">
                    <h3 className="font-bold text-lg mb-4">Adicionar Novo Material</h3>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título do Documento</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder="Ex: Guia de Procedimentos"
                                required
                            />
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
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Arquivo PDF</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                accept="application/pdf"
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={uploading}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${uploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 shadow-lg hover:shadow-brand-500/25'}`}
                        >
                            {uploading ? 'Enviando...' : 'Adicionar Material'}
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-slate-700">Materiais Cadastrados ({materials.length})</h3>
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm"
                        >
                            <option value="">Filtrar por Categoria</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-slate-400">Carregando...</div>
                    ) : materials.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                            Nenhum material encontrado.
                        </div>
                    ) : (
                        materials.map(material => (
                            <div key={material.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-200 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-lg flex items-center justify-center text-xl">
                                        📄
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{material.title}</h4>
                                        <p className="text-xs text-slate-400 flex gap-2">
                                            <span>{material.file_size}</span>
                                            <span>•</span>
                                            <span>{new Date(material.created_at).toLocaleDateString()}</span>
                                            {material.category_id && (
                                                <>
                                                    <span>•</span>
                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                                        {categories.find(c => c.id === material.category_id)?.name || 'Categoria'}
                                                    </span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`http://localhost:3001${material.file_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                        title="Visualizar"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </a>
                                    <button
                                        onClick={() => handleDelete(material.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
