/**
 * ==================================================
 * GESTOR DE AULAS DIGITAIS - AREA ADMINISTRATIVA
 * Sistema Angola Saude 2026
 * ==================================================
 * 
 * Componente para criar, editar, excluir e gerir
 * aulas digitais com slides, audio e conteudo.
 */

import React, { useState, useEffect, useRef } from 'react';
import { authService } from '../services/auth';
import { API_URL } from '../config/api';
import RichTextEditor from './RichTextEditor';

// ==================================================
// INTERFACES
// ==================================================

interface Slide {
    id: string;
    ordem: number;
    titulo: string;
    conteudoPrincipal: string;
    pontosChave: { titulo: string; descricao: string; }[];
    audioScript: string;
    duracaoAudioSegundos: number;
    conceito: string;
    relevanciaProva: 'alta' | 'media' | 'baixa';
}

// Interfaces para os dados gerados pela IA
interface ConversationalBlock {
    id: string;
    ordem: number;
    tipo: 'introducao' | 'explicacao' | 'exemplo' | 'aplicacao' | 'resumo';
    fala: string;
    perguntaAluno?: string;
    pausaReflexao?: number;
    dicaContextual?: string;
}

interface ConversationalLesson {
    estiloLinguagem: string;
    ritmoAdaptavel: boolean;
    blocos: ConversationalBlock[];
}

interface QuizAlternative {
    letra: string;
    texto: string;
}

interface MiniQuizQuestion {
    id: string;
    enunciado: string;
    alternativas: QuizAlternative[];
    correta: string;
    explicacao: string;
    slideReferencia?: string;
}

interface LessonMiniQuiz {
    titulo: string;
    descricao: string;
    questoes: MiniQuizQuestion[];
    pontuacaoMinima: number;
}

interface LessonFlashcard {
    id: string;
    frente: string;
    verso: string;
    slideOrigem?: string;
    prioridade: 'alta' | 'media' | 'baixa';
}

// Interface para materiais complementares
interface SupplementaryMaterial {
    id: string;
    title: string;
    file_path: string;
    file_size: string;
    file_type: string;
    created_at: string;
    category_id?: string;
}

interface Lesson {
    id: string;
    titulo: string;
    area: string;
    nivel: string;
    categoria?: string;
    slides: Slide[];
    aulaConversacional?: ConversationalLesson;
    miniQuiz?: LessonMiniQuiz;
    flashcards?: LessonFlashcard[];
    objectivoGeral?: string;
    objectivosEspecificos?: string[];
    preRequisitos?: string[];
    duracaoEstimadaMinutos?: number;
    versao?: string;
    autor?: string;
    tags?: string[];
    materiaisComplementares?: string[]; // IDs dos materiais
    materiais_complementares?: string[]; // snake_case do banco
    created_at?: string;
    updated_at?: string;
    // Campos do banco de dados (snake_case)
    aula_conversacional?: ConversationalLesson;
    mini_quiz?: LessonMiniQuiz;
}

interface AdminLessonsManagerProps {
    categories: { id: string; name: string; }[];
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

const AdminLessonsManager: React.FC<AdminLessonsManagerProps> = ({ categories }) => {
    // Estado principal
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Estado do formulario
    const [formData, setFormData] = useState({
        titulo: '',
        area: '',
        nivel: 'intermedio',
        categoria: ''
    });

    // Estado dos slides
    const [slides, setSlides] = useState<Slide[]>([]);
    const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
    const [slideFormData, setSlideFormData] = useState({
        titulo: '',
        conteudoPrincipal: '',
        audioScript: '',
        conceito: '',
        relevanciaProva: 'alta' as 'alta' | 'media' | 'baixa',
        pontosChave: [{ titulo: '', descricao: '' }]
    });

    // Estado de geracao de audio
    const [generatingAudio, setGeneratingAudio] = useState<string | null>(null);
    const [audioPreview, setAudioPreview] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Estado de geracao com IA
    const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiContentBase, setAiContentBase] = useState(''); // Conteúdo base para a IA gerar aula
    const [aiGenerationMode, setAiGenerationMode] = useState<'topic' | 'content' | 'import'>('topic');
    const csvImportRef = useRef<HTMLInputElement>(null);
    const [csvPasteText, setCsvPasteText] = useState(''); // CSV colado manualmente

    // Estado dos dados completos gerados pela IA
    const [aulaConversacional, setAulaConversacional] = useState<ConversationalLesson | null>(null);
    const [miniQuiz, setMiniQuiz] = useState<LessonMiniQuiz | null>(null);
    const [flashcards, setFlashcards] = useState<LessonFlashcard[]>([]);
    const [objectivoGeral, setObjectivoGeral] = useState<string>('');
    const [objectivosEspecificos, setObjectivosEspecificos] = useState<string[]>([]);
    const [preRequisitos, setPreRequisitos] = useState<string[]>([]);
    const [duracaoEstimadaMinutos, setDuracaoEstimadaMinutos] = useState<number>(30);
    const [tags, setTags] = useState<string[]>([]);

    // Estado dos materiais complementares
    const [materiaisComplementares, setMateriaisComplementares] = useState<string[]>([]);
    const [availableMaterials, setAvailableMaterials] = useState<SupplementaryMaterial[]>([]);
    const [loadingMaterials, setLoadingMaterials] = useState(false);

    // Estado para upload de materiais
    const [uploadingMaterial, setUploadingMaterial] = useState(false);
    const [uploadMaterialTitle, setUploadMaterialTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ==================================================
    // CARREGAR AULAS
    // ==================================================

    useEffect(() => {
        fetchLessons();
    }, []);

    const fetchLessons = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:3001/lessons', {
                headers: authService.getAuthHeaders()
            });
            const data = await res.json();
            if (data.data) {
                setLessons(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar aulas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Carregar materiais disponiveis para anexar
    const fetchAvailableMaterials = async () => {
        setLoadingMaterials(true);
        try {
            const res = await fetch('http://localhost:3001/materials', {
                headers: authService.getAuthHeaders()
            });
            const data = await res.json();
            if (data.data) {
                setAvailableMaterials(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar materiais:', error);
        } finally {
            setLoadingMaterials(false);
        }
    };

    // Fazer upload de novo material
    const handleUploadMaterial = async () => {
        if (!selectedFile) {
            alert('Por favor, selecione um arquivo PDF.');
            return;
        }

        if (!uploadMaterialTitle.trim()) {
            alert('Por favor, insira um título para o material.');
            return;
        }

        setUploadingMaterial(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', selectedFile);
            uploadFormData.append('title', uploadMaterialTitle);
            // Opcionalmente associar à categoria da aula
            if (formData.area) {
                uploadFormData.append('category_id', formData.area);
            }

            const res = await fetch('http://localhost:3001/materials', {
                method: 'POST',
                headers: authService.getAuthHeaders(), // For FormData, typically we don't set Content-Type as browser does it with boundary, but we need Auth
                body: uploadFormData
            });

            if (res.ok) {
                const data = await res.json();
                if (data.data?.id) {
                    // Adicionar automaticamente à lista de materiais selecionados
                    setMateriaisComplementares(prev => [...prev, data.data.id]);
                }
                // Atualizar lista de materiais disponíveis
                await fetchAvailableMaterials();
                // Limpar formulário
                setUploadMaterialTitle('');
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                alert('Material enviado com sucesso e adicionado à aula!');
            } else {
                const error = await res.json();
                alert('Erro ao enviar material: ' + (error.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Erro ao enviar material:', error);
            alert('Erro ao enviar material');
        } finally {
            setUploadingMaterial(false);
        }
    };

    // ==================================================
    // CRIAR AULA MANUAL
    // ==================================================

    const handleCreateLesson = () => {
        setIsCreating(true);
        setIsEditing(false);
        setSelectedLesson(null);
        setFormData({
            titulo: '',
            area: 'TEC_ENFERMAGEM',
            nivel: 'intermedio',
            categoria: ''
        });
        setSlides([]);
        // Limpar dados adicionais
        setAulaConversacional(null);
        setMiniQuiz(null);
        setFlashcards([]);
        setObjectivoGeral('');
        setObjectivosEspecificos([]);
        setPreRequisitos([]);
        setDuracaoEstimadaMinutos(30);
        setTags([]);
        setMateriaisComplementares([]);
        // Limpar estados de upload
        setUploadMaterialTitle('');
        setSelectedFile(null);
        // Carregar materiais disponiveis
        fetchAvailableMaterials();
    };

    const handleSaveLesson = async () => {
        if (!formData.titulo.trim()) {
            alert('Por favor, insira um titulo para a aula.');
            return;
        }

        if (slides.length === 0) {
            alert('Por favor, adicione pelo menos um slide.');
            return;
        }

        try {
            const lessonData = {
                titulo: formData.titulo,
                area: formData.area,
                nivel: formData.nivel,
                categoria: formData.categoria,
                slides: slides,
                // Dados adicionais gerados pela IA
                aulaConversacional: aulaConversacional,
                miniQuiz: miniQuiz,
                flashcards: flashcards,
                objectivoGeral: objectivoGeral,
                objectivosEspecificos: objectivosEspecificos,
                preRequisitos: preRequisitos,
                duracaoEstimadaMinutos: duracaoEstimadaMinutos,
                tags: tags,
                materiaisComplementares: materiaisComplementares
            };

            const url = isEditing && selectedLesson
                ? `http://localhost:3001/lessons/${selectedLesson.id}`
                : 'http://localhost:3001/lessons';

            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeaders()
                },
                body: JSON.stringify(lessonData)
            });

            if (res.ok) {
                alert(isEditing ? 'Aula actualizada com sucesso!' : 'Aula criada com sucesso!');
                fetchLessons();
                handleCancelEdit();
            } else {
                const error = await res.json();
                alert('Erro: ' + error.message);
            }
        } catch (error) {
            console.error('Erro ao salvar aula:', error);
            alert('Erro ao salvar aula');
        }
    };

    // ==================================================
    // EDITAR AULA
    // ==================================================

    const handleEditLesson = (lesson: Lesson) => {
        setSelectedLesson(lesson);
        setIsEditing(true);
        setIsCreating(false);
        setFormData({
            titulo: lesson.titulo,
            area: lesson.area,
            nivel: lesson.nivel,
            categoria: lesson.categoria || ''
        });
        setSlides(lesson.slides || []);
        // Carregar dados adicionais (suporte para snake_case do banco de dados)
        setAulaConversacional(lesson.aulaConversacional || lesson.aula_conversacional || null);
        setMiniQuiz(lesson.miniQuiz || lesson.mini_quiz || null);
        setFlashcards(lesson.flashcards || []);
        setObjectivoGeral(lesson.objectivoGeral || '');
        setObjectivosEspecificos(lesson.objectivosEspecificos || []);
        setPreRequisitos(lesson.preRequisitos || []);
        setDuracaoEstimadaMinutos(lesson.duracaoEstimadaMinutos || 30);
        setTags(lesson.tags || []);
        // Carregar materiais complementares (suporte para snake_case)
        setMateriaisComplementares(lesson.materiaisComplementares || lesson.materiais_complementares || []);
        // Limpar estados de upload
        setUploadMaterialTitle('');
        setSelectedFile(null);
        // Carregar materiais disponíveis
        fetchAvailableMaterials();
    };

    const handleCancelEdit = () => {
        setIsCreating(false);
        setIsEditing(false);
        setSelectedLesson(null);
        setFormData({ titulo: '', area: '', nivel: 'intermedio', categoria: '' });
        setSlides([]);
        // Limpar dados adicionais
        setAulaConversacional(null);
        setMiniQuiz(null);
        setFlashcards([]);
        setObjectivoGeral('');
        setObjectivosEspecificos([]);
        setPreRequisitos([]);
        setDuracaoEstimadaMinutos(30);
        setTags([]);
        setMateriaisComplementares([]);
        // Limpar estados de upload
        setUploadMaterialTitle('');
        setSelectedFile(null);
    };

    // ==================================================
    // EXCLUIR AULA
    // ==================================================

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta aula? Esta acao nao pode ser desfeita.')) {
            return;
        }

        try {
            const res = await fetch(`http://localhost:3001/lessons/${lessonId}`, {
                method: 'DELETE',
                headers: authService.getAuthHeaders()
            });

            if (res.ok) {
                alert('Aula excluida com sucesso!');
                fetchLessons();
            } else {
                alert('Erro ao excluir aula');
            }
        } catch (error) {
            console.error('Erro ao excluir aula:', error);
        }
    };

    // ==================================================
    // GESTAO DE SLIDES
    // ==================================================

    const handleAddSlide = () => {
        const newSlide: Slide = {
            id: `slide-${Date.now()}`,
            ordem: slides.length + 1,
            titulo: '',
            conteudoPrincipal: '',
            pontosChave: [],
            audioScript: '',
            duracaoAudioSegundos: 60,
            conceito: '',
            relevanciaProva: 'alta'
        };
        setEditingSlide(newSlide);
        setSlideFormData({
            titulo: '',
            conteudoPrincipal: '',
            audioScript: '',
            conceito: '',
            relevanciaProva: 'alta',
            pontosChave: [{ titulo: '', descricao: '' }]
        });
    };

    const handleEditSlide = (slide: Slide) => {
        setEditingSlide(slide);
        setSlideFormData({
            titulo: slide.titulo,
            conteudoPrincipal: slide.conteudoPrincipal,
            audioScript: slide.audioScript,
            conceito: slide.conceito,
            relevanciaProva: slide.relevanciaProva,
            pontosChave: slide.pontosChave.length > 0 ? slide.pontosChave : [{ titulo: '', descricao: '' }]
        });
    };

    const handleSaveSlide = () => {
        if (!slideFormData.titulo.trim()) {
            alert('Por favor, insira um titulo para o slide.');
            return;
        }

        const updatedSlide: Slide = {
            ...editingSlide!,
            titulo: slideFormData.titulo,
            conteudoPrincipal: slideFormData.conteudoPrincipal,
            audioScript: slideFormData.audioScript,
            conceito: slideFormData.conceito,
            relevanciaProva: slideFormData.relevanciaProva,
            pontosChave: slideFormData.pontosChave.filter(p => p.titulo.trim()),
            duracaoAudioSegundos: Math.ceil(slideFormData.audioScript.split(/\s+/).length / 2.5) // ~150 palavras/min
        };

        const existingIndex = slides.findIndex(s => s.id === updatedSlide.id);
        if (existingIndex >= 0) {
            setSlides(prev => prev.map((s, i) => i === existingIndex ? updatedSlide : s));
        } else {
            setSlides(prev => [...prev, updatedSlide]);
        }

        setEditingSlide(null);
    };

    const handleDeleteSlide = (slideId: string) => {
        setSlides(prev => prev.filter(s => s.id !== slideId).map((s, i) => ({ ...s, ordem: i + 1 })));
    };

    const handleMoveSlide = (slideId: string, direction: 'up' | 'down') => {
        const index = slides.findIndex(s => s.id === slideId);
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === slides.length - 1)
        ) return;

        const newSlides = [...slides];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];

        setSlides(newSlides.map((s, i) => ({ ...s, ordem: i + 1 })));
    };

    // ==================================================
    // GERAR AUDIO
    // ==================================================

    const handleGenerateAudio = async (slide: Slide) => {
        if (!slide.audioScript.trim()) {
            alert('Este slide nao tem script de audio.');
            return;
        }

        setGeneratingAudio(slide.id);
        try {
            const res = await fetch('http://localhost:3001/generate/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeaders()
                },
                body: JSON.stringify({ text: slide.audioScript })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.audio) {
                    const audioUrl = `data:audio/${data.format || 'mp3'};base64,${data.audio}`;
                    setAudioPreview(audioUrl);
                    if (audioRef.current) {
                        audioRef.current.src = audioUrl;
                        audioRef.current.play();
                    }
                }
            } else {
                alert('Erro ao gerar audio');
            }
        } catch (error) {
            console.error('Erro ao gerar audio:', error);
        } finally {
            setGeneratingAudio(null);
        }
    };

    // ==================================================
    // GERAR AULA COM IA
    // ==================================================

    const handleGenerateLessonWithAI = async () => {
        if (!aiTopic.trim()) {
            alert('Por favor, insira um tema para a aula.');
            return;
        }

        if (!formData.area) {
            alert('Por favor, selecione uma area profissional.');
            return;
        }

        setIsGeneratingLesson(true);
        try {
            const res = await fetch('http://localhost:3001/generate/lesson-full', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeaders()
                },
                body: JSON.stringify({
                    tema: aiTopic,
                    area: formData.area,
                    nivel: formData.nivel
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    const lesson = data.data;

                    // Actualizar dados basicos
                    setFormData({
                        titulo: lesson.titulo,
                        area: lesson.area,
                        nivel: lesson.nivel,
                        categoria: formData.categoria
                    });
                    setSlides(lesson.slides || []);

                    // Capturar TODOS os dados gerados pela IA
                    setAulaConversacional(lesson.aulaConversacional || null);
                    setMiniQuiz(lesson.miniQuiz || null);
                    setFlashcards(lesson.flashcards || []);
                    setObjectivoGeral(lesson.objectivoGeral || '');
                    setObjectivosEspecificos(lesson.objectivosEspecificos || []);
                    setPreRequisitos(lesson.preRequisitos || []);
                    setDuracaoEstimadaMinutos(lesson.duracaoEstimadaMinutos || 30);
                    setTags(lesson.tags || []);

                    // Resumo do que foi gerado
                    const blocosCount = lesson.aulaConversacional?.blocos?.length || 0;
                    const quizCount = lesson.miniQuiz?.questoes?.length || 0;
                    const cardsCount = lesson.flashcards?.length || 0;

                    alert(`Aula gerada com sucesso!\n\n` +
                        `📊 ${lesson.slides?.length || 0} slides\n` +
                        `💬 ${blocosCount} blocos conversacionais\n` +
                        `✅ ${quizCount} questões de quiz\n` +
                        `🃏 ${cardsCount} flashcards`);
                }
            } else {
                alert('Erro ao gerar aula com IA');
            }
        } catch (error) {
            console.error('Erro ao gerar aula:', error);
            alert('Erro ao gerar aula');
        } finally {
            setIsGeneratingLesson(false);
        }
    };

    // ==================================================
    // ADICIONAR PONTO CHAVE
    // ==================================================

    const handleAddPontoChave = () => {
        setSlideFormData(prev => ({
            ...prev,
            pontosChave: [...prev.pontosChave, { titulo: '', descricao: '' }]
        }));
    };

    const handleRemovePontoChave = (index: number) => {
        setSlideFormData(prev => ({
            ...prev,
            pontosChave: prev.pontosChave.filter((_, i) => i !== index)
        }));
    };

    const handlePontoChaveChange = (index: number, field: 'titulo' | 'descricao', value: string) => {
        setSlideFormData(prev => ({
            ...prev,
            pontosChave: prev.pontosChave.map((p, i) =>
                i === index ? { ...p, [field]: value } : p
            )
        }));
    };

    // ==================================================
    // GERAR AULA COM CONTEUDO FORNECIDO (TEXTO/CSV)
    // ==================================================

    const handleGenerateLessonFromContent = async () => {
        if (!aiContentBase.trim()) {
            alert('Por favor, cole o conteúdo que deseja usar para gerar a aula.');
            return;
        }

        if (!formData.area) {
            alert('Por favor, selecione uma área profissional.');
            return;
        }

        if (!aiTopic.trim()) {
            alert('Por favor, insira um tema/título para a aula.');
            return;
        }

        setIsGeneratingLesson(true);
        try {
            const res = await fetch(`${API_URL}/generate/lesson-full`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeaders()
                },
                body: JSON.stringify({
                    tema: aiTopic,
                    area: formData.area,
                    nivel: formData.nivel,
                    conteudoBase: aiContentBase
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    const lesson = data.data;

                    setFormData({
                        titulo: lesson.titulo,
                        area: lesson.area,
                        nivel: lesson.nivel,
                        categoria: formData.categoria
                    });
                    setSlides(lesson.slides || []);
                    setAulaConversacional(lesson.aulaConversacional || null);
                    setMiniQuiz(lesson.miniQuiz || null);
                    setFlashcards(lesson.flashcards || []);
                    setObjectivoGeral(lesson.objectivoGeral || '');
                    setObjectivosEspecificos(lesson.objectivosEspecificos || []);
                    setPreRequisitos(lesson.preRequisitos || []);
                    setDuracaoEstimadaMinutos(lesson.duracaoEstimadaMinutos || 30);
                    setTags(lesson.tags || []);
                    setAiContentBase('');

                    const blocosCount = lesson.aulaConversacional?.blocos?.length || 0;
                    const quizCount = lesson.miniQuiz?.questoes?.length || 0;
                    const cardsCount = lesson.flashcards?.length || 0;

                    alert(`Aula gerada com sucesso!\n\n${lesson.slides?.length || 0} slides\n${blocosCount} blocos conversacionais\n${quizCount} questões de quiz\n${cardsCount} flashcards`);
                }
            } else {
                const error = await res.json();
                alert('Erro ao gerar aula: ' + (error.details || error.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Erro ao gerar aula:', error);
            alert('Erro ao gerar aula com conteúdo');
        } finally {
            setIsGeneratingLesson(false);
        }
    };

    // ==================================================
    // PARSEAR CSV PARA ESTRUTURA DE AULA
    // ==================================================

    const parseCSVLine = (line: string, separator: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === separator && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    const parseCSVToLesson = (csvText: string): { slides: Slide[], quiz: MiniQuizQuestion[], flashcards: LessonFlashcard[] } | null => {
        try {
            const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
            if (lines.length < 2) {
                throw new Error('CSV deve ter pelo menos um cabeçalho e uma linha de dados');
            }

            const firstLine = lines[0];
            const separator = firstLine.includes(';') ? ';' : ',';
            const headers = firstLine.split(separator).map(h => h.trim().toLowerCase().replace(/"/g, ''));

            const slidesResult: Slide[] = [];
            const quizResult: MiniQuizQuestion[] = [];
            const flashcardsResult: LessonFlashcard[] = [];

            const hasSlideColumns = headers.includes('titulo') && (headers.includes('conteudo') || headers.includes('conteudoprincipal'));
            const hasQuizColumns = headers.includes('enunciado') && headers.includes('correta');
            const hasFlashcardColumns = headers.includes('frente') && headers.includes('verso');

            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i], separator);
                if (values.length === 0) continue;

                const row: Record<string, string> = {};
                headers.forEach((header, idx) => {
                    row[header] = values[idx]?.replace(/^"|"$/g, '').trim() || '';
                });

                if (hasSlideColumns && row['titulo']) {
                    const slide: Slide = {
                        id: `slide-${Date.now()}-${i}`,
                        ordem: slidesResult.length + 1,
                        titulo: row['titulo'] || '',
                        conteudoPrincipal: row['conteudo'] || row['conteudoprincipal'] || '',
                        pontosChave: row['pontoschave']
                            ? row['pontoschave'].split('|').map(p => {
                                const parts = p.split(':');
                                return { titulo: parts[0]?.trim() || '', descricao: parts[1]?.trim() || '' };
                            })
                            : [],
                        audioScript: row['audioscript'] || row['audio'] || '',
                        duracaoAudioSegundos: parseInt(row['duracao'] || '90') || 90,
                        conceito: row['conceito'] || '',
                        relevanciaProva: (row['relevancia'] || row['relevanciaprova'] || 'alta') as 'alta' | 'media' | 'baixa'
                    };
                    slidesResult.push(slide);
                }

                if (hasQuizColumns && row['enunciado']) {
                    const question: MiniQuizQuestion = {
                        id: `quiz-${Date.now()}-${i}`,
                        enunciado: row['enunciado'],
                        alternativas: [
                            { letra: 'A', texto: row['a'] || row['alternativaa'] || '' },
                            { letra: 'B', texto: row['b'] || row['alternativab'] || '' },
                            { letra: 'C', texto: row['c'] || row['alternativac'] || '' },
                            { letra: 'D', texto: row['d'] || row['alternativad'] || '' }
                        ].filter(alt => alt.texto),
                        correta: row['correta']?.toUpperCase() || 'A',
                        explicacao: row['explicacao'] || '',
                        slideReferencia: row['slidereferencia'] || undefined
                    };
                    quizResult.push(question);
                }

                if (hasFlashcardColumns && row['frente']) {
                    const flashcard: LessonFlashcard = {
                        id: `fc-${Date.now()}-${i}`,
                        frente: row['frente'],
                        verso: row['verso'] || '',
                        slideOrigem: row['slideorigem'] || undefined,
                        prioridade: (row['prioridade'] || 'media') as 'alta' | 'media' | 'baixa'
                    };
                    flashcardsResult.push(flashcard);
                }
            }

            return { slides: slidesResult, quiz: quizResult, flashcards: flashcardsResult };
        } catch (error) {
            console.error('Erro ao parsear CSV:', error);
            return null;
        }
    };

    // ==================================================
    // IMPORTAR AULA PRONTA DE CSV
    // ==================================================

    const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            alert('Por favor, selecione um arquivo CSV válido.');
            return;
        }

        try {
            const text = await file.text();
            const parsed = parseCSVToLesson(text);

            if (!parsed) {
                alert('Erro ao interpretar o CSV. Verifique o formato do arquivo.');
                return;
            }

            const { slides: importedSlides, quiz: importedQuiz, flashcards: importedFlashcards } = parsed;

            if (importedSlides.length === 0 && importedQuiz.length === 0 && importedFlashcards.length === 0) {
                alert('Nenhum dado válido encontrado no CSV. Verifique o formato.');
                return;
            }

            const shouldReplace = slides.length > 0 || (miniQuiz?.questoes?.length || 0) > 0 || flashcards.length > 0;

            if (shouldReplace) {
                const confirmReplace = confirm(
                    `O CSV contém:\n- ${importedSlides.length} slides\n- ${importedQuiz.length} questões\n- ${importedFlashcards.length} flashcards\n\nDeseja SUBSTITUIR os dados atuais?\nOK = Substituir, Cancelar = Adicionar`
                );

                if (confirmReplace) {
                    if (importedSlides.length > 0) setSlides(importedSlides);
                    if (importedQuiz.length > 0) {
                        setMiniQuiz({
                            titulo: 'Quiz da Aula',
                            descricao: 'Teste seus conhecimentos',
                            questoes: importedQuiz,
                            pontuacaoMinima: 60
                        });
                    }
                    if (importedFlashcards.length > 0) setFlashcards(importedFlashcards);
                } else {
                    if (importedSlides.length > 0) {
                        setSlides(prev => [...prev, ...importedSlides.map((s, i) => ({ ...s, ordem: prev.length + i + 1 }))]);
                    }
                    if (importedQuiz.length > 0) {
                        setMiniQuiz(prev => ({
                            titulo: prev?.titulo || 'Quiz da Aula',
                            descricao: prev?.descricao || 'Teste seus conhecimentos',
                            questoes: [...(prev?.questoes || []), ...importedQuiz],
                            pontuacaoMinima: prev?.pontuacaoMinima || 60
                        }));
                    }
                    if (importedFlashcards.length > 0) {
                        setFlashcards(prev => [...prev, ...importedFlashcards]);
                    }
                }
            } else {
                if (importedSlides.length > 0) setSlides(importedSlides);
                if (importedQuiz.length > 0) {
                    setMiniQuiz({
                        titulo: 'Quiz da Aula',
                        descricao: 'Teste seus conhecimentos',
                        questoes: importedQuiz,
                        pontuacaoMinima: 60
                    });
                }
                if (importedFlashcards.length > 0) setFlashcards(importedFlashcards);
            }

            alert(`Importação concluída!\n${importedSlides.length} slides\n${importedQuiz.length} questões\n${importedFlashcards.length} flashcards`);

            if (csvImportRef.current) {
                csvImportRef.current.value = '';
            }

        } catch (error) {
            console.error('Erro ao importar CSV:', error);
            alert('Erro ao ler o arquivo CSV.');
        }
    };

    // ==================================================
    // RENDER - LISTA DE AULAS
    // ==================================================

    if (!isCreating && !isEditing) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Aulas Digitais</h2>
                        <p className="text-slate-500">Gerencie o conteudo das aulas interactivas</p>
                    </div>
                    <button
                        onClick={handleCreateLesson}
                        className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Criar Nova Aula
                    </button>
                </div>

                {/* Lista de Aulas */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-4 text-slate-500">Carregando aulas...</p>
                    </div>
                ) : lessons.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur rounded-3xl p-12 text-center border border-slate-200">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhuma aula criada</h3>
                        <p className="text-slate-500 mb-6">Comece criando sua primeira aula digital interactiva</p>
                        <button
                            onClick={handleCreateLesson}
                            className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700"
                        >
                            Criar Primeira Aula
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {lessons.map(lesson => (
                            <div
                                key={lesson.id}
                                className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-slate-900">{lesson.titulo}</h3>
                                            <span className="px-2 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-bold">
                                                {lesson.area}
                                            </span>
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                                {lesson.nivel}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-sm">
                                            {lesson.slides?.length || 0} slides
                                            {lesson.created_at && ` • Criada em ${new Date(lesson.created_at).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditLesson(lesson)}
                                            className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteLesson(lesson.id)}
                                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Audio player hidden */}
                <audio ref={audioRef} className="hidden" />
            </div>
        );
    }

    // ==================================================
    // RENDER - FORMULARIO DE EDICAO/CRIACAO
    // ==================================================

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {isEditing ? 'Editar Aula' : 'Criar Nova Aula'}
                    </h2>
                    <p className="text-slate-500">
                        {isEditing ? 'Actualizar informacoes e slides' : 'Configure a nova aula digital'}
                    </p>
                </div>
                <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
                >
                    Cancelar
                </button>
            </div>

            {/* Formulario Principal */}
            <div className="bg-white/80 backdrop-blur rounded-3xl p-6 border border-slate-200">
                <h3 className="font-bold text-lg mb-4">Informacoes da Aula</h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Titulo da Aula *</label>
                        <input
                            type="text"
                            value={formData.titulo}
                            onChange={e => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                            placeholder="ex: Atendimento Inicial ao Politraumatizado"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Area Profissional *</label>
                        <select
                            value={formData.area}
                            onChange={e => setFormData(prev => ({ ...prev, area: e.target.value }))}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="">Selecione...</option>
                            <option value="MEDICO">Medico</option>
                            <option value="ENFERMAGEM">Enfermagem</option>
                            <option value="TEC_ENFERMAGEM">Tecnico de Enfermagem</option>
                            <option value="TEC_FARMACIA">Tecnico de Farmacia</option>
                            <option value="ANALISES_CLINICAS">Analises Clinicas</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nivel</label>
                        <select
                            value={formData.nivel}
                            onChange={e => setFormData(prev => ({ ...prev, nivel: e.target.value }))}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="basico">Basico</option>
                            <option value="intermedio">Intermedio</option>
                            <option value="avancado">Avancado</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                        <select
                            value={formData.categoria}
                            onChange={e => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="">Nenhuma</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Geracao com IA - Versao Expandida */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100">
                    <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Gerar/Importar Aula
                    </h4>

                    {/* Abas de modo */}
                    <div className="flex gap-2 mb-4 border-b border-purple-200 pb-3">
                        <button
                            onClick={() => setAiGenerationMode('topic')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aiGenerationMode === 'topic'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-purple-700 hover:bg-purple-100'
                                }`}
                        >
                            Por Tema
                        </button>
                        <button
                            onClick={() => setAiGenerationMode('content')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aiGenerationMode === 'content'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-purple-700 hover:bg-purple-100'
                                }`}
                        >
                            Com Conteudo
                        </button>
                        <button
                            onClick={() => setAiGenerationMode('import')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aiGenerationMode === 'import'
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-green-700 hover:bg-green-100'
                                }`}
                        >
                            Importar CSV
                        </button>
                    </div>

                    {/* Modo: Gerar por Tema */}
                    {aiGenerationMode === 'topic' && (
                        <div className="space-y-3">
                            <p className="text-sm text-purple-700">
                                Insira um tema e a IA gera automaticamente slides, scripts de audio e conteudo.
                            </p>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={aiTopic}
                                    onChange={e => setAiTopic(e.target.value)}
                                    className="flex-1 px-4 py-2 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                                    placeholder="ex: Sinais vitais e monitorizacao"
                                />
                                <button
                                    onClick={handleGenerateLessonWithAI}
                                    disabled={isGeneratingLesson || !aiTopic.trim() || !formData.area}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isGeneratingLesson ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Gerando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Gerar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Modo: Gerar com Conteudo */}
                    {aiGenerationMode === 'content' && (
                        <div className="space-y-3">
                            <p className="text-sm text-purple-700">
                                Cole o conteudo (texto ou CSV) e a IA cria uma aula estruturada baseada nesse material.
                            </p>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={aiTopic}
                                    onChange={e => setAiTopic(e.target.value)}
                                    className="flex-1 px-4 py-2 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                                    placeholder="Titulo da aula (obrigatorio)"
                                />
                            </div>
                            <textarea
                                value={aiContentBase}
                                onChange={e => setAiContentBase(e.target.value)}
                                className="w-full h-48 px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                                placeholder="Cole aqui o conteudo que deseja usar como base para a aula: texto corrido, topicos, conteudo de livros/apostilas, ou dados em formato CSV. A IA ira analisar e criar slides, scripts de audio, blocos conversacionais, quiz e flashcards."
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-purple-600">
                                    {aiContentBase.length} caracteres
                                </span>
                                <button
                                    onClick={handleGenerateLessonFromContent}
                                    disabled={isGeneratingLesson || !aiContentBase.trim() || !aiTopic.trim() || !formData.area}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isGeneratingLesson ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Processando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Gerar com Conteudo
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Modo: Importar CSV */}
                    {aiGenerationMode === 'import' && (
                        <div className="space-y-4">
                            <p className="text-sm text-green-700">
                                Importe uma aula já estruturada em formato CSV. O sistema aceita slides, quiz e flashcards.
                            </p>

                            <div className="bg-white rounded-xl p-4 border border-green-200">
                                <h5 className="font-medium text-green-900 mb-2">Formatos Aceites:</h5>
                                <div className="grid grid-cols-1 gap-3 text-xs">
                                    {/* Slides - formato expandido */}
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <strong className="text-green-800 text-sm">📊 Slides:</strong>
                                        <div className="mt-2 space-y-1">
                                            <code className="block text-green-700 font-semibold">
                                                titulo;conteudo;pontoschave;conceito;audioscript;relevancia
                                            </code>
                                            <p className="text-green-600 mt-2">
                                                <strong>pontoschave:</strong> Use <code className="bg-green-100 px-1 rounded">|</code> para separar múltiplos pontos e <code className="bg-green-100 px-1 rounded">:</code> para título e descrição.
                                            </p>
                                            <p className="text-green-600 text-[11px] italic">
                                                Exemplo: <code className="bg-green-100 px-1 rounded">Sintoma 1:Febre alta|Sintoma 2:Calafrios intensos|Diagnóstico:Exame de sangue</code>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {/* Quiz */}
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <strong className="text-blue-800 text-sm">✅ Quiz:</strong>
                                            <code className="block mt-2 text-blue-700 font-semibold">
                                                enunciado;a;b;c;d;correta;explicacao
                                            </code>
                                            <p className="text-blue-600 text-[11px] mt-1 italic">
                                                Exemplo: O que causa malária?;Vírus;Bactéria;Parasita;Fungo;C;Causada pelo Plasmodium
                                            </p>
                                        </div>

                                        {/* Flashcards */}
                                        <div className="bg-amber-50 p-3 rounded-lg">
                                            <strong className="text-amber-800 text-sm">🃏 Flashcards:</strong>
                                            <code className="block mt-2 text-amber-700 font-semibold">
                                                frente;verso;prioridade
                                            </code>
                                            <p className="text-amber-600 text-[11px] mt-1 italic">
                                                Exemplo: O que é malária?;Doença parasitária causada pelo Plasmodium;alta
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Opção 1: Upload de Arquivo */}
                            <div className="bg-white rounded-xl p-4 border border-slate-200">
                                <h5 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Opção 1: Selecionar Arquivo
                                </h5>
                                <div className="flex items-center gap-4">
                                    <input
                                        ref={csvImportRef}
                                        type="file"
                                        accept=".csv"
                                        onChange={handleImportCSV}
                                        className="hidden"
                                        id="csv-import-input"
                                    />
                                    <label
                                        htmlFor="csv-import-input"
                                        className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 cursor-pointer flex items-center gap-2 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        Selecionar Arquivo CSV
                                    </label>
                                    <span className="text-sm text-slate-500">
                                        Formato: .csv (separador: vírgula ou ponto e vírgula)
                                    </span>
                                </div>
                            </div>

                            {/* Separador */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-slate-200"></div>
                                <span className="text-sm font-medium text-slate-400">OU</span>
                                <div className="flex-1 h-px bg-slate-200"></div>
                            </div>

                            {/* Opção 2: Colar CSV */}
                            <div className="bg-white rounded-xl p-4 border border-slate-200">
                                <h5 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Opção 2: Colar Conteúdo CSV
                                </h5>
                                <textarea
                                    value={csvPasteText}
                                    onChange={(e) => setCsvPasteText(e.target.value)}
                                    className="w-full h-40 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none font-mono text-sm"
                                    placeholder="Cole aqui o conteúdo CSV...&#10;&#10;Exemplo para Slides (com pontos chave):&#10;titulo;conteudo;pontoschave;conceito;audioscript;relevancia&#10;Introdução à Malária;A malária é uma doença parasitária;Sintoma:Febre alta|Causa:Plasmodium|Vetor:Mosquito Anopheles;Conceito básico de malária;Este slide apresenta os conceitos básicos;alta&#10;&#10;Exemplo para Quiz:&#10;enunciado;a;b;c;d;correta;explicacao&#10;O que é malária?;Vírus;Bactéria;Parasita;Fungo;C;Causada pelo Plasmodium"
                                />
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-xs text-slate-500">
                                        {csvPasteText.split('\n').filter(l => l.trim()).length} linhas detectadas
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCsvPasteText('')}
                                            disabled={!csvPasteText.trim()}
                                            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Limpar
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!csvPasteText.trim()) {
                                                    alert('Por favor, cole o conteúdo CSV primeiro.');
                                                    return;
                                                }
                                                const parsed = parseCSVToLesson(csvPasteText);
                                                if (!parsed) {
                                                    alert('Erro ao interpretar o CSV. Verifique o formato.');
                                                    return;
                                                }
                                                const { slides: importedSlides, quiz: importedQuiz, flashcards: importedFlashcards } = parsed;
                                                if (importedSlides.length === 0 && importedQuiz.length === 0 && importedFlashcards.length === 0) {
                                                    alert('Nenhum dado válido encontrado no CSV. Verifique o formato.');
                                                    return;
                                                }
                                                const shouldReplace = slides.length > 0 || (miniQuiz?.questoes?.length || 0) > 0 || flashcards.length > 0;
                                                if (shouldReplace) {
                                                    const confirmReplace = confirm(
                                                        `O CSV contém:\n- ${importedSlides.length} slides\n- ${importedQuiz.length} questões\n- ${importedFlashcards.length} flashcards\n\nDeseja SUBSTITUIR os dados atuais?\nOK = Substituir, Cancelar = Adicionar`
                                                    );
                                                    if (confirmReplace) {
                                                        if (importedSlides.length > 0) setSlides(importedSlides);
                                                        if (importedQuiz.length > 0) {
                                                            setMiniQuiz({
                                                                titulo: 'Quiz da Aula',
                                                                descricao: 'Teste seus conhecimentos',
                                                                questoes: importedQuiz,
                                                                pontuacaoMinima: 60
                                                            });
                                                        }
                                                        if (importedFlashcards.length > 0) setFlashcards(importedFlashcards);
                                                    } else {
                                                        if (importedSlides.length > 0) {
                                                            setSlides(prev => [...prev, ...importedSlides.map((s, i) => ({ ...s, ordem: prev.length + i + 1 }))]);
                                                        }
                                                        if (importedQuiz.length > 0) {
                                                            setMiniQuiz(prev => ({
                                                                titulo: prev?.titulo || 'Quiz da Aula',
                                                                descricao: prev?.descricao || 'Teste seus conhecimentos',
                                                                questoes: [...(prev?.questoes || []), ...importedQuiz],
                                                                pontuacaoMinima: prev?.pontuacaoMinima || 60
                                                            }));
                                                        }
                                                        if (importedFlashcards.length > 0) {
                                                            setFlashcards(prev => [...prev, ...importedFlashcards]);
                                                        }
                                                    }
                                                } else {
                                                    if (importedSlides.length > 0) setSlides(importedSlides);
                                                    if (importedQuiz.length > 0) {
                                                        setMiniQuiz({
                                                            titulo: 'Quiz da Aula',
                                                            descricao: 'Teste seus conhecimentos',
                                                            questoes: importedQuiz,
                                                            pontuacaoMinima: 60
                                                        });
                                                    }
                                                    if (importedFlashcards.length > 0) setFlashcards(importedFlashcards);
                                                }
                                                alert(`Importação concluída!\n${importedSlides.length} slides\n${importedQuiz.length} questões\n${importedFlashcards.length} flashcards`);
                                                setCsvPasteText('');
                                            }}
                                            disabled={!csvPasteText.trim()}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            Importar CSV Colado
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600">
                                <strong>Dica:</strong> Você pode criar o CSV no Excel/Google Sheets e exportar como CSV, ou copiar diretamente de uma planilha.
                                O sistema detecta automaticamente se o conteúdo contém slides, quiz ou flashcards.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Gestao de Slides */}
            <div className="bg-white/80 backdrop-blur rounded-3xl p-6 border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Slides ({slides.length})</h3>
                    <button
                        onClick={handleAddSlide}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Adicionar Slide
                    </button>
                </div>

                {slides.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <p>Nenhum slide adicionado.</p>
                        <p className="text-sm">Clique em "Adicionar Slide" ou use a geracao por IA.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {slides.map((slide, index) => (
                            <div
                                key={slide.id}
                                className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4"
                            >
                                <span className="w-8 h-8 bg-brand-100 text-brand-700 rounded-lg flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </span>
                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-900">{slide.titulo || 'Slide sem titulo'}</h4>
                                    <p className="text-sm text-slate-500 truncate">{slide.conceito || 'Sem conceito definido'}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${slide.relevanciaProva === 'alta' ? 'bg-red-100 text-red-700' :
                                    slide.relevanciaProva === 'media' ? 'bg-amber-100 text-amber-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                    {slide.relevanciaProva}
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleMoveSlide(slide.id, 'up')}
                                        disabled={index === 0}
                                        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleMoveSlide(slide.id, 'down')}
                                        disabled={index === slides.length - 1}
                                        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleGenerateAudio(slide)}
                                        disabled={generatingAudio === slide.id || !slide.audioScript}
                                        className="p-1 text-slate-400 hover:text-green-600 disabled:opacity-30"
                                        title="Gerar audio"
                                    >
                                        {generatingAudio === slide.id ? (
                                            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            </svg>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleEditSlide(slide)}
                                        className="p-1 text-slate-400 hover:text-brand-600"
                                        title="Editar"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSlide(slide.id)}
                                        className="p-1 text-slate-400 hover:text-red-600"
                                        title="Excluir"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Gestao de Aula Conversacional */}
            <div className="bg-white/80 backdrop-blur rounded-3xl p-6 border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            💬 Aula Conversacional ({aulaConversacional?.blocos?.length || 0} blocos)
                        </h3>
                        <p className="text-sm text-slate-500">Blocos de texto que simulam uma aula com o professor</p>
                    </div>
                    <button
                        onClick={() => {
                            const newBloco: ConversationalBlock = {
                                id: `bloco-${Date.now()}`,
                                ordem: (aulaConversacional?.blocos?.length || 0) + 1,
                                tipo: 'explicacao',
                                fala: '',
                                perguntaAluno: undefined,
                                dicaContextual: undefined
                            };
                            setAulaConversacional(prev => ({
                                estiloLinguagem: prev?.estiloLinguagem || 'acessivel',
                                ritmoAdaptavel: prev?.ritmoAdaptavel ?? true,
                                blocos: [...(prev?.blocos || []), newBloco]
                            }));
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Adicionar Bloco
                    </button>
                </div>

                {(!aulaConversacional?.blocos || aulaConversacional.blocos.length === 0) ? (
                    <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <p>Nenhum bloco conversacional adicionado.</p>
                        <p className="text-sm">Adicione blocos para criar a experiencia de aula.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {aulaConversacional.blocos.map((bloco, index) => (
                            <div key={bloco.id} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <div className="flex items-start gap-3">
                                    <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1 space-y-2">
                                        <select
                                            value={bloco.tipo}
                                            onChange={e => {
                                                const newBlocos = [...aulaConversacional.blocos];
                                                newBlocos[index] = { ...bloco, tipo: e.target.value as ConversationalBlock['tipo'] };
                                                setAulaConversacional({ ...aulaConversacional, blocos: newBlocos });
                                            }}
                                            className="px-3 py-1 border border-blue-200 rounded-lg text-sm"
                                        >
                                            <option value="introducao">Introdução</option>
                                            <option value="explicacao">Explicação</option>
                                            <option value="exemplo">Exemplo</option>
                                            <option value="aplicacao">Aplicação</option>
                                            <option value="resumo">Resumo</option>
                                        </select>
                                        <textarea
                                            value={bloco.fala}
                                            onChange={e => {
                                                const newBlocos = [...aulaConversacional.blocos];
                                                newBlocos[index] = { ...bloco, fala: e.target.value };
                                                setAulaConversacional({ ...aulaConversacional, blocos: newBlocos });
                                            }}
                                            placeholder="Texto do professor..."
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm resize-none"
                                            rows={2}
                                        />
                                        <input
                                            type="text"
                                            value={bloco.perguntaAluno || ''}
                                            onChange={e => {
                                                const newBlocos = [...aulaConversacional.blocos];
                                                newBlocos[index] = { ...bloco, perguntaAluno: e.target.value || undefined };
                                                setAulaConversacional({ ...aulaConversacional, blocos: newBlocos });
                                            }}
                                            placeholder="Pergunta ao aluno (opcional)"
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newBlocos = aulaConversacional.blocos.filter((_, i) => i !== index);
                                            setAulaConversacional({ ...aulaConversacional, blocos: newBlocos });
                                        }}
                                        className="p-1 text-slate-400 hover:text-red-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Gestao de Quiz */}
            <div className="bg-white/80 backdrop-blur rounded-3xl p-6 border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            ✅ Quiz ({miniQuiz?.questoes?.length || 0} questões)
                        </h3>
                        <p className="text-sm text-slate-500">Questões de múltipla escolha para verificar o aprendizado</p>
                    </div>
                    <button
                        onClick={() => {
                            const newQuestao: MiniQuizQuestion = {
                                id: `quiz-${Date.now()}`,
                                enunciado: '',
                                alternativas: [
                                    { letra: 'A', texto: '' },
                                    { letra: 'B', texto: '' },
                                    { letra: 'C', texto: '' },
                                    { letra: 'D', texto: '' }
                                ],
                                correta: 'A',
                                explicacao: ''
                            };
                            setMiniQuiz(prev => ({
                                titulo: prev?.titulo || 'Quiz da Aula',
                                descricao: prev?.descricao || 'Teste os seus conhecimentos',
                                pontuacaoMinima: prev?.pontuacaoMinima || 60,
                                questoes: [...(prev?.questoes || []), newQuestao]
                            }));
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Adicionar Questão
                    </button>
                </div>

                {(!miniQuiz?.questoes || miniQuiz.questoes.length === 0) ? (
                    <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <p>Nenhuma questão adicionada.</p>
                        <p className="text-sm">Adicione questões para avaliar o aprendizado.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {miniQuiz.questoes.map((questao, qIdx) => (
                            <div key={questao.id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                                <div className="flex items-start gap-3">
                                    <span className="w-8 h-8 bg-green-100 text-green-700 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {qIdx + 1}
                                    </span>
                                    <div className="flex-1 space-y-3">
                                        <textarea
                                            value={questao.enunciado}
                                            onChange={e => {
                                                const newQuestoes = [...miniQuiz.questoes];
                                                newQuestoes[qIdx] = { ...questao, enunciado: e.target.value };
                                                setMiniQuiz({ ...miniQuiz, questoes: newQuestoes });
                                            }}
                                            placeholder="Enunciado da questão..."
                                            className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm resize-none"
                                            rows={2}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            {questao.alternativas.map((alt, aIdx) => (
                                                <div key={alt.letra} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name={`correta-${questao.id}`}
                                                        checked={questao.correta === alt.letra}
                                                        onChange={() => {
                                                            const newQuestoes = [...miniQuiz.questoes];
                                                            newQuestoes[qIdx] = { ...questao, correta: alt.letra };
                                                            setMiniQuiz({ ...miniQuiz, questoes: newQuestoes });
                                                        }}
                                                        className="text-green-600"
                                                    />
                                                    <span className="font-bold text-sm">{alt.letra})</span>
                                                    <input
                                                        type="text"
                                                        value={alt.texto}
                                                        onChange={e => {
                                                            const newQuestoes = [...miniQuiz.questoes];
                                                            const newAlts = [...questao.alternativas];
                                                            newAlts[aIdx] = { ...alt, texto: e.target.value };
                                                            newQuestoes[qIdx] = { ...questao, alternativas: newAlts };
                                                            setMiniQuiz({ ...miniQuiz, questoes: newQuestoes });
                                                        }}
                                                        placeholder={`Alternativa ${alt.letra}`}
                                                        className="flex-1 px-2 py-1 border border-green-200 rounded text-sm"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            value={questao.explicacao}
                                            onChange={e => {
                                                const newQuestoes = [...miniQuiz.questoes];
                                                newQuestoes[qIdx] = { ...questao, explicacao: e.target.value };
                                                setMiniQuiz({ ...miniQuiz, questoes: newQuestoes });
                                            }}
                                            placeholder="Explicação da resposta correta..."
                                            className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newQuestoes = miniQuiz.questoes.filter((_, i) => i !== qIdx);
                                            setMiniQuiz({ ...miniQuiz, questoes: newQuestoes });
                                        }}
                                        className="p-1 text-slate-400 hover:text-red-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Gestao de Flashcards */}
            <div className="bg-white/80 backdrop-blur rounded-3xl p-6 border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            🃏 Flashcards ({flashcards.length})
                        </h3>
                        <p className="text-sm text-slate-500">Cartões de memorização com frente e verso</p>
                    </div>
                    <button
                        onClick={() => {
                            const newCard: LessonFlashcard = {
                                id: `fc-${Date.now()}`,
                                frente: '',
                                verso: '',
                                prioridade: 'media'
                            };
                            setFlashcards(prev => [...prev, newCard]);
                        }}
                        className="px-4 py-2 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Adicionar Card
                    </button>
                </div>

                {flashcards.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <p>Nenhum flashcard adicionado.</p>
                        <p className="text-sm">Adicione cards para auxiliar a memorização.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {flashcards.map((card, cIdx) => (
                            <div key={card.id} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <div className="flex items-start gap-2">
                                    <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded flex items-center justify-center font-bold text-xs flex-shrink-0">
                                        {cIdx + 1}
                                    </span>
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="text"
                                            value={card.frente}
                                            onChange={e => {
                                                const newCards = [...flashcards];
                                                newCards[cIdx] = { ...card, frente: e.target.value };
                                                setFlashcards(newCards);
                                            }}
                                            placeholder="Frente (pergunta)"
                                            className="w-full px-2 py-1 border border-amber-200 rounded text-sm"
                                        />
                                        <input
                                            type="text"
                                            value={card.verso}
                                            onChange={e => {
                                                const newCards = [...flashcards];
                                                newCards[cIdx] = { ...card, verso: e.target.value };
                                                setFlashcards(newCards);
                                            }}
                                            placeholder="Verso (resposta)"
                                            className="w-full px-2 py-1 border border-amber-200 rounded text-sm"
                                        />
                                        <select
                                            value={card.prioridade}
                                            onChange={e => {
                                                const newCards = [...flashcards];
                                                newCards[cIdx] = { ...card, prioridade: e.target.value as LessonFlashcard['prioridade'] };
                                                setFlashcards(newCards);
                                            }}
                                            className="px-2 py-1 border border-amber-200 rounded text-xs"
                                        >
                                            <option value="alta">Alta prioridade</option>
                                            <option value="media">Média prioridade</option>
                                            <option value="baixa">Baixa prioridade</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => setFlashcards(prev => prev.filter((_, i) => i !== cIdx))}
                                        className="p-1 text-slate-400 hover:text-red-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Gestao de Materiais Complementares */}
            <div className="bg-white/80 backdrop-blur rounded-3xl p-6 border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            📄 Materiais Complementares ({materiaisComplementares.length})
                        </h3>
                        <p className="text-sm text-slate-500">PDFs e documentos de apoio para os alunos</p>
                    </div>
                    <button
                        onClick={fetchAvailableMaterials}
                        disabled={loadingMaterials}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loadingMaterials ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        )}
                        Actualizar Lista
                    </button>
                </div>

                {/* Área de Upload de Novo Material */}
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border border-red-100">
                    <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Enviar Novo Material
                    </h4>
                    <div className="grid gap-3">
                        <div>
                            <label className="block text-sm font-medium text-red-800 mb-1">Título do Material *</label>
                            <input
                                type="text"
                                value={uploadMaterialTitle}
                                onChange={e => setUploadMaterialTitle(e.target.value)}
                                placeholder="ex: Guia de Procedimentos Básicos"
                                className="w-full px-4 py-2 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-red-800 mb-1">Arquivo PDF *</label>
                            <div className="flex gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                    className="flex-1 px-3 py-2 border border-red-200 rounded-xl text-sm bg-white file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-red-100 file:text-red-700 file:font-medium hover:file:bg-red-200"
                                />
                                <button
                                    onClick={handleUploadMaterial}
                                    disabled={uploadingMaterial || !selectedFile || !uploadMaterialTitle.trim()}
                                    className="px-5 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                                >
                                    {uploadingMaterial ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            Enviar
                                        </>
                                    )}
                                </button>
                            </div>
                            {selectedFile && (
                                <p className="text-xs text-red-600 mt-1">
                                    Selecionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-red-500 mt-2">
                        O material enviado será automaticamente anexado a esta aula.
                    </p>
                </div>

                {loadingMaterials ? (
                    <div className="text-center py-6">
                        <div className="w-6 h-6 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto" />
                        <p className="text-sm text-slate-500 mt-2">Carregando materiais...</p>
                    </div>
                ) : availableMaterials.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>Nenhum material disponível.</p>
                        <p className="text-sm">Adicione materiais na seção "Materiais Suplementares" primeiro.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-600 mb-3">Selecione os materiais que deseja anexar a esta aula:</p>
                        <div className="grid gap-2 max-h-64 overflow-y-auto">
                            {availableMaterials.map((material) => {
                                const isSelected = materiaisComplementares.includes(material.id);
                                return (
                                    <button
                                        key={material.id}
                                        onClick={() => {
                                            if (isSelected) {
                                                setMateriaisComplementares(prev => prev.filter(id => id !== material.id));
                                            } else {
                                                setMateriaisComplementares(prev => [...prev, material.id]);
                                            }
                                        }}
                                        className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${isSelected
                                            ? 'border-red-500 bg-red-50 text-red-700'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-red-100' : 'bg-slate-100'
                                            }`}>
                                            <svg className={`w-5 h-5 ${isSelected ? 'text-red-500' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2zM14 3.5L18.5 8H14V3.5z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{material.title}</p>
                                            <p className="text-xs text-slate-400">{material.file_size}</p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-red-500 bg-red-500' : 'border-slate-300'
                                            }`}>
                                            {isSelected && (
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {materiaisComplementares.length > 0 && (
                            <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                                <p className="text-sm text-red-700 font-medium">
                                    ✓ {materiaisComplementares.length} material(is) selecionado(s)
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Resumo do Conteudo */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-4 border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-2">Resumo do Conteúdo</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1">
                        📊 <strong>{slides.length}</strong> slides
                    </span>
                    <span className="flex items-center gap-1">
                        💬 <strong>{aulaConversacional?.blocos?.length || 0}</strong> blocos conversacionais
                    </span>
                    <span className="flex items-center gap-1">
                        ✅ <strong>{miniQuiz?.questoes?.length || 0}</strong> questões de quiz
                    </span>
                    <span className="flex items-center gap-1">
                        🃏 <strong>{flashcards.length}</strong> flashcards
                    </span>
                    <span className="flex items-center gap-1">
                        📄 <strong>{materiaisComplementares.length}</strong> materiais
                    </span>
                </div>
            </div>

            {/* Botao Salvar */}
            <div className="flex justify-end gap-4">
                <button
                    onClick={handleCancelEdit}
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSaveLesson}
                    className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700"
                >
                    {isEditing ? 'Actualizar Aula' : 'Criar Aula'}
                </button>
            </div>

            {/* Modal de Edicao de Slide */}
            {editingSlide && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">
                                {slides.find(s => s.id === editingSlide.id) ? 'Editar Slide' : 'Novo Slide'}
                            </h3>
                            <button
                                onClick={() => setEditingSlide(null)}
                                className="p-2 hover:bg-slate-100 rounded-full"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Titulo do Slide *</label>
                                <input
                                    type="text"
                                    value={slideFormData.titulo}
                                    onChange={e => setSlideFormData(prev => ({ ...prev, titulo: e.target.value }))}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                                    placeholder="ex: O que e o Politraumatizado?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Conteudo Principal</label>
                                <RichTextEditor
                                    value={slideFormData.conteudoPrincipal}
                                    onChange={(value) => setSlideFormData(prev => ({ ...prev, conteudoPrincipal: value }))}
                                    placeholder="Texto principal do slide..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Script de Audio</label>
                                <textarea
                                    value={slideFormData.audioScript}
                                    onChange={e => setSlideFormData(prev => ({ ...prev, audioScript: e.target.value }))}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-xl h-24 resize-none"
                                    placeholder="Texto que sera lido pela voz IA..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Conceito Central</label>
                                <input
                                    type="text"
                                    value={slideFormData.conceito}
                                    onChange={e => setSlideFormData(prev => ({ ...prev, conceito: e.target.value }))}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                                    placeholder="Resumo em uma frase"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Relevancia para Prova</label>
                                <select
                                    value={slideFormData.relevanciaProva}
                                    onChange={e => setSlideFormData(prev => ({ ...prev, relevanciaProva: e.target.value as any }))}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                                >
                                    <option value="alta">Alta</option>
                                    <option value="media">Media</option>
                                    <option value="baixa">Baixa</option>
                                </select>
                            </div>

                            {/* Pontos Chave */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-slate-700">Pontos Chave</label>
                                    <button
                                        type="button"
                                        onClick={handleAddPontoChave}
                                        className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                                    >
                                        + Adicionar
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {slideFormData.pontosChave.map((ponto, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={ponto.titulo}
                                                onChange={e => handlePontoChaveChange(index, 'titulo', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                placeholder="Titulo"
                                            />
                                            <input
                                                type="text"
                                                value={ponto.descricao}
                                                onChange={e => handlePontoChaveChange(index, 'descricao', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                placeholder="Descricao"
                                            />
                                            {slideFormData.pontosChave.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePontoChave(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <button
                                onClick={() => setEditingSlide(null)}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveSlide}
                                className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700"
                            >
                                Guardar Slide
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audio player hidden */}
            <audio ref={audioRef} className="hidden" />
        </div>
    );
};

export default AdminLessonsManager;
