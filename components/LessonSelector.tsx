
import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { DigitalLesson, LESSON_LEVELS } from '../types/lesson';

interface LessonSelectorProps {
    category: Category;
    onSelectLesson: (lesson: DigitalLesson) => void;
    onBack: () => void;
}

// Interface para materiais complementares
interface SupplementaryMaterial {
    id: string;
    title: string;
    file_path: string;
    file_size: string;
    file_type: string;
    category_id?: string;
    created_at: string;
}

const LessonSelector: React.FC<LessonSelectorProps> = ({ category, onSelectLesson, onBack }) => {
    const [lessons, setLessons] = useState<DigitalLesson[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estado para materiais complementares
    const [materials, setMaterials] = useState<SupplementaryMaterial[]>([]);
    const [loadingMaterials, setLoadingMaterials] = useState(true);

    useEffect(() => {
        const fetchLessons = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('http://localhost:3001/lessons');
                if (!res.ok) throw new Error('Falha ao carregar aulas');

                const data = await res.json();
                const rawLessons = data.data || [];

                // Mapear campos snake_case do banco para camelCase
                const allLessons: DigitalLesson[] = rawLessons.map((lesson: any) => ({
                    ...lesson,
                    // Mapear campos do banco de dados (snake_case) para camelCase
                    aulaConversacional: lesson.aulaConversacional || lesson.aula_conversacional || null,
                    miniQuiz: lesson.miniQuiz || lesson.mini_quiz || null,
                    flashcards: lesson.flashcards || [],
                    objectivoGeral: lesson.objectivoGeral || lesson.objectivo_geral || '',
                    objectivosEspecificos: lesson.objectivosEspecificos || lesson.objectivos_especificos || [],
                    preRequisitos: lesson.preRequisitos || lesson.pre_requisitos || [],
                    duracaoEstimadaMinutos: lesson.duracaoEstimadaMinutos || lesson.duracao_estimada_minutos || 30,
                    integracaoJogos: lesson.integracaoJogos || lesson.integracao_jogos || { termosParaDecifrar: [] },
                    versao: lesson.versao || '1.0.0',
                    dataAtualizacao: lesson.dataAtualizacao || lesson.updated_at || new Date().toISOString(),
                    autor: lesson.autor || 'Sistema Angola Saude 2026',
                    numeroConceitos: lesson.numeroConceitos || lesson.slides?.length || 0,
                    tags: lesson.tags || []
                }));

                // Filter lessons by category or area
                const filtered = allLessons.filter(lesson =>
                    (lesson.categoria && lesson.categoria === category.id) ||
                    (lesson.area && lesson.area === category.id)
                );

                setLessons(filtered);
            } catch (err) {
                console.error("Erro ao buscar aulas:", err);
                setError('Nao foi possivel carregar as aulas disponíveis.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLessons();
    }, [category.id]);

    // Buscar materiais complementares da categoria
    useEffect(() => {
        const fetchMaterials = async () => {
            setLoadingMaterials(true);
            try {
                const res = await fetch(`http://localhost:3001/materials/category/${category.id}`);
                if (!res.ok) throw new Error('Falha ao carregar materiais');

                const data = await res.json();
                setMaterials(data.materials || data.data || []);
            } catch (err) {
                console.error("Erro ao buscar materiais:", err);
                setMaterials([]);
            } finally {
                setLoadingMaterials(false);
            }
        };

        fetchMaterials();
    }, [category.id]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            {/* Header */}
            <div className={`relative ${category.color.replace('bg-', 'bg-gradient-to-r from-').replace('50', '600').replace('100', '700')} to-slate-800 h-64 overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                <div className="max-w-7xl mx-auto px-6 h-full flex flex-col justify-center relative z-10 text-white">
                    <button
                        onClick={onBack}
                        className="absolute top-8 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Voltar
                    </button>

                    <div className="flex items-center gap-6 mt-4">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl shadow-xl">
                            {category.icon}
                        </div>
                        <div>
                            <span className="text-white/80 font-bold uppercase tracking-wider text-xs bg-white/20 px-3 py-1 rounded-full border border-white/10">
                                Aulas Digitais
                            </span>
                            <h1 className="text-4xl font-display font-bold mt-2">{category.title}</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20 space-y-8">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 min-h-[400px]">

                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Aulas Disponíveis</h2>
                        <span className="text-slate-500 font-medium">{lessons.length} aul{lessons.length === 1 ? 'a' : 'as'}</span>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
                            <p>Carregando aulas...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 text-red-500 bg-red-50 rounded-2xl">
                            <p className="font-bold mb-2">Ops, algo correu mal.</p>
                            <p>{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    ) : lessons.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                📚
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhuma aula encontrada</h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Ainda não existem aulas digitais publicadas para esta categoria.
                                Fique atento, novos conteúdos são adicionados semanalmente.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lessons.map(lesson => (
                                <button
                                    key={lesson.id}
                                    onClick={() => onSelectLesson(lesson)}
                                    className="group text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className={`h-2 ${lesson.nivel === 'basico' ? 'bg-green-500' : lesson.nivel === 'avancado' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${lesson.nivel === 'basico' ? 'bg-green-100 text-green-700' :
                                                lesson.nivel === 'avancado' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {LESSON_LEVELS[lesson.nivel]?.titulo || lesson.nivel}
                                            </span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {lesson.duracaoEstimadaMinutos || 20} min
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
                                            {lesson.titulo}
                                        </h3>

                                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                                            {lesson.objectivoGeral || 'Aula interactiva completa com slides, audio e quiz.'}
                                        </p>

                                        <div className="flex items-center gap-3 text-xs text-slate-400 border-t border-slate-100 pt-4">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                {lesson.slides?.length || 0} Slides
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                                Quiz
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 px-6 py-3 text-center text-xs font-bold text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                                        INICIAR AULA
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Supplementary Materials Section */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Material Complementar</h2>
                        {materials.length > 0 && (
                            <span className="text-sm text-slate-500">({materials.length})</span>
                        )}
                    </div>

                    {loadingMaterials ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                            <p className="text-sm">Carregando materiais...</p>
                        </div>
                    ) : materials.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                                📄
                            </div>
                            <h3 className="font-bold text-slate-700 mb-1">Sem materiais</h3>
                            <p className="text-sm text-slate-500">Nenhum material complementar disponível para esta categoria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {materials.map((material) => (
                                <a
                                    key={material.id}
                                    href={`http://localhost:3001${material.file_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-slate-50 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2zM14 3.5L18.5 8H14V3.5zM8 11h8v2H8v-2zm0 4h8v2H8v-2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                                                {material.title || 'Material sem título'}
                                            </h3>
                                            <p className="text-xs text-slate-500 uppercase font-bold mt-1">
                                                {material.file_type || 'PDF'} • {material.file_size || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-slate-300 group-hover:text-brand-500 transition-colors flex-shrink-0">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonSelector;
