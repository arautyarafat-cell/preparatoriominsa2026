import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ViewState } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import AdminLessonsManager from './AdminLessonsManager';
import { AdminUsers } from './AdminUsers';
import { AdminGeneralSettings } from './AdminGeneralSettings';
import { AdminPaymentSettings } from './AdminPaymentSettings';
import AdminContactSettings from './AdminContactSettings';
import { AdminDecipherTerms } from './AdminDecipherTerms';
import AdminBlocking from './AdminBlocking';
import { AdminYoutubeSettings } from './AdminYoutubeSettings';
import { AdminTrilhas } from './AdminTrilhas';
import { AdminSecurity } from './AdminSecurity';


// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface AdminAreaProps {
    onBack: () => void;
}

interface FileItem {
    id: string;
    file: File;
    status: 'waiting' | 'uploading' | 'success' | 'error';
    message?: string;
}

const AdminArea: React.FC<AdminAreaProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'upload' | 'users' | 'settings' | 'questions' | 'lessons' | 'payments' | 'general_settings' | 'decipher' | 'contact' | 'blocking' | 'youtube' | 'trilhas' | 'security'>('upload');

    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Categories & Subjects State
    const [categories, setCategories] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

    // New Subject Form
    const [newSubjectName, setNewSubjectName] = useState('');
    const [addingSubject, setAddingSubject] = useState(false);

    // Question Bank State
    const [qType, setQType] = useState<'quiz' | 'flashcard'>('quiz');
    const [qTopic, setQTopic] = useState('');
    const [qQuestion, setQQuestion] = useState('');
    const [qAnswer, setQAnswer] = useState('');
    const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
    const [qCorrectIndex, setQCorrectIndex] = useState(0);
    const [qExplanation, setQExplanation] = useState('');
    const [submittingQ, setSubmittingQ] = useState(false);
    const [recentQuestions, setRecentQuestions] = useState<any[]>([]);
    const [filterCategoryId, setFilterCategoryId] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');
    const [questionsLimit, setQuestionsLimit] = useState(500); // Limite aumentado para acesso admin completo
    const [totalQuestions, setTotalQuestions] = useState(0);

    // Edit Modal State
    const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
    const [editTopic, setEditTopic] = useState('');
    const [editType, setEditType] = useState<'quiz' | 'flashcard'>('quiz');
    const [editQuestion, setEditQuestion] = useState('');
    const [editAnswer, setEditAnswer] = useState('');
    const [editOptions, setEditOptions] = useState<string[]>(['', '', '', '']);
    const [editCorrectIndex, setEditCorrectIndex] = useState(0);
    const [editExplanation, setEditExplanation] = useState('');
    const [editCategoryId, setEditCategoryId] = useState('');
    const [editSubjectId, setEditSubjectId] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

    // Bulk Import State
    const [importMode, setImportMode] = useState<'manual' | 'csv' | 'ai'>('manual');
    const [importText, setImportText] = useState(''); // Shared for CSV or AI text
    const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [csvImportType, setCsvImportType] = useState<'quiz' | 'flashcard'>('quiz'); // Tipo para importação CSV
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isParsingFile, setIsParsingFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Topics State for Import
    const [availableTopics, setAvailableTopics] = useState<string[]>([]);
    const [importTopic, setImportTopic] = useState<string>('');
    const [customTopic, setCustomTopic] = useState<string>('');

    // Fetch categories on mount
    React.useEffect(() => {
        fetchCategories();
    }, []);

    // Fetch subjects and topics when category changes
    React.useEffect(() => {
        if (selectedCategoryId) {
            fetchSubjects(selectedCategoryId);
            fetchTopics(selectedCategoryId);
        } else {
            setSubjects([]);
            setAvailableTopics([]);
        }
        setSelectedSubjectId('');
        setImportTopic('');
        setCustomTopic('');
    }, [selectedCategoryId]);

    // Fetch questions when tab is active or filter changes
    React.useEffect(() => {
        if (activeTab === 'questions') {
            fetchRecentQuestions();
        }
    }, [activeTab, filterCategoryId, filterType, questionsLimit]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('http://localhost:3001/categories');
            const data = await res.json();
            if (data.data) {
                setCategories(data.data);
            }
        } catch (e) {
            console.error('Failed to fetch categories');
        }
    };

    const fetchSubjects = async (categoryId: string) => {
        try {
            const res = await fetch(`http://localhost:3001/subjects?category_id=${categoryId}`);
            const data = await res.json();
            if (data.data) {
                setSubjects(data.data);
            }
        } catch (e) {
            console.error('Failed to fetch subjects');
        }
    };

    const fetchTopics = async (categoryId: string) => {
        try {
            const res = await fetch(`http://localhost:3001/topics?category_id=${categoryId}`);
            const data = await res.json();
            if (data.data) {
                setAvailableTopics(data.data);
            }
        } catch (e) {
            console.error('Failed to fetch topics');
        }
    };

    const fetchRecentQuestions = async () => {
        try {
            let url = `http://localhost:3001/questions?limit=${questionsLimit}`;
            if (filterCategoryId) {
                url += `&category_id=${filterCategoryId}`;
            }
            if (filterType) {
                url += `&type=${filterType}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (data.data) {
                setRecentQuestions(data.data);
                setTotalQuestions(data.data.length);
            }
        } catch (e) {
            console.error('Failed to fetch questions');
        }
    };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!confirm('Tem certeza que deseja apagar esta questão? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const res = await fetch(`http://localhost:3001/questions/${questionId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                // Remover da lista local
                setRecentQuestions(prev => prev.filter(q => q.id !== questionId));
                alert('Questão apagada com sucesso!');
            } else {
                const data = await res.json();
                alert('Erro ao apagar: ' + data.error);
            }
        } catch (e: any) {
            console.error('Failed to delete question:', e);
            alert('Erro de conexão ao apagar questão.');
        }
    };

    const [isDeletingAll, setIsDeletingAll] = useState(false);

    const handleDeleteAllQuestions = async () => {
        const confirmMessage = filterCategoryId
            ? 'ATENÇÃO: Isso irá APAGAR TODAS as questões desta categoria! Tem certeza?'
            : 'ATENÇÃO: Isso irá APAGAR TODAS as questões do banco de dados! Tem certeza?';

        if (!confirm(confirmMessage)) {
            return;
        }
        if (!confirm('Esta ação é IRREVERSÍVEL. Clique OK para continuar.')) {
            return;
        }

        setIsDeletingAll(true);
        try {
            // Usar endpoint bulk delete
            let url = 'http://localhost:3001/questions/all';
            if (filterCategoryId) {
                url += `?category_id=${filterCategoryId}`;
            }

            const res = await fetch(url, {
                method: 'DELETE'
            });

            if (res.ok) {
                setRecentQuestions([]);
                setTotalQuestions(0);
                alert('Todas as questões foram apagadas com sucesso!');
            } else {
                const data = await res.json();
                alert('Erro ao apagar: ' + data.error);
            }
        } catch (e: any) {
            console.error('Failed to delete all questions:', e);
            alert('Erro de conexão ao apagar questões.');
            fetchRecentQuestions(); // Recarregar para ver o que sobrou
        } finally {
            setIsDeletingAll(false);
        }
    };

    // Open edit modal with question data
    const openEditModal = (question: any) => {
        setEditingQuestion(question);
        setEditTopic(question.topic || '');
        setEditType(question.type);
        setEditCategoryId(question.category_id || '');
        setEditSubjectId(question.subject_id || '');

        if (question.type === 'quiz') {
            setEditQuestion(question.content.question || '');
            setEditOptions(question.content.options || ['', '', '', '']);
            setEditCorrectIndex(question.content.correctAnswer || 0);
            setEditExplanation(question.content.explanation || '');
            setEditAnswer('');
        } else {
            setEditQuestion(question.content.front || '');
            setEditAnswer(question.content.back || '');
            setEditOptions(['', '', '', '']);
            setEditCorrectIndex(0);
            setEditExplanation('');
        }

        // Load subjects for the category
        if (question.category_id) {
            fetchSubjects(question.category_id);
        }
    };

    // Close edit modal
    const closeEditModal = () => {
        setEditingQuestion(null);
        setEditTopic('');
        setEditType('quiz');
        setEditQuestion('');
        setEditAnswer('');
        setEditOptions(['', '', '', '']);
        setEditCorrectIndex(0);
        setEditExplanation('');
        setEditCategoryId('');
        setEditSubjectId('');
    };

    // Handle question update
    const handleUpdateQuestion = async () => {
        if (!editingQuestion) return;

        setIsUpdating(true);

        const payload = {
            topic: editTopic,
            type: editType,
            category_id: editCategoryId || null,
            subject_id: editSubjectId || null,
            content: editType === 'quiz' ? {
                question: editQuestion,
                options: editOptions,
                correctAnswer: editCorrectIndex,
                explanation: editExplanation
            } : {
                front: editQuestion,
                back: editAnswer
            }
        };

        try {
            const res = await fetch(`http://localhost:3001/questions/${editingQuestion.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                alert('Questão atualizada com sucesso!');
                // Update local list
                setRecentQuestions(prev => prev.map(q =>
                    q.id === editingQuestion.id ? data.data : q
                ));
                closeEditModal();
            } else {
                alert('Erro ao atualizar: ' + data.error);
            }
        } catch (e: any) {
            alert('Erro de conexão: ' + e.message);
        } finally {
            setIsUpdating(false);
        }
    };

    // Toggle expanded view
    const toggleExpandQuestion = (questionId: string) => {
        setExpandedQuestionId(prev => prev === questionId ? null : questionId);
    };

    const handleAddSubject = async () => {
        if (!selectedCategoryId || !newSubjectName.trim()) return;
        setAddingSubject(true);
        try {
            const res = await fetch('http://localhost:3001/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category_id: selectedCategoryId,
                    name: newSubjectName.trim()
                })
            });
            if (res.ok) {
                setNewSubjectName('');
                fetchSubjects(selectedCategoryId);
            }
        } catch (e) {
            console.error('Failed to add subject');
        } finally {
            setAddingSubject(false);
        }
    };

    const handleQuestionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCategoryId) {
            alert('Por favor, selecione uma categoria profissional.');
            return;
        }

        setSubmittingQ(true);

        const payload = {
            topic: qTopic,
            type: qType,
            category_id: selectedCategoryId,
            subject_id: selectedSubjectId || null,
            content: qType === 'quiz' ? {
                question: qQuestion,
                options: qOptions,
                correctAnswer: qCorrectIndex,
                explanation: qExplanation
            } : {
                front: qQuestion,
                back: qAnswer
            }
        };

        try {
            const res = await fetch('http://localhost:3001/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                alert('Questão salva com sucesso!');
                setQQuestion('');
                setQAnswer('');
                setQOptions(['', '', '', '']);
                setQExplanation('');
                setQTopic('');
                fetchRecentQuestions();
            } else {
                alert('Erro ao salvar: ' + data.error);
            }
        } catch (e: any) {
            alert('Erro de conexão: ' + e.message);
        } finally {
            setSubmittingQ(false);
        }
    };

    const handleExtractAI = async () => {
        if (!importText.trim()) return;

        // Validar tópico selecionado
        const selectedTopic = importTopic === '__custom__' ? customTopic.trim() : importTopic;
        if (!selectedTopic) {
            alert('Por favor, selecione ou digite um tópico para as questões.');
            return;
        }

        setIsExtracting(true);
        try {
            const res = await fetch('http://localhost:3001/questions/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: importText,
                    type: qType // Use selected type
                })
            });
            const data = await res.json();
            if (data.data) {
                // Aplicar o tópico selecionado a todas as questões extraídas
                const questionsWithTopic = data.data.map((q: any) => ({
                    ...q,
                    topic: selectedTopic
                }));
                setExtractedQuestions(questionsWithTopic);
            } else {
                alert('Falha na extração: ' + (data.error || 'Erro desconhecido'));
            }
        } catch (e: any) {
            alert('Erro de conexão: ' + e.message);
        } finally {
            setIsExtracting(false);
        }
    };

    // Handle file upload for CSV and PDF
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadedFile(file);
        setIsParsingFile(true);

        try {
            const fileExtension = file.name.split('.').pop()?.toLowerCase();

            if (fileExtension === 'csv') {
                // Read CSV file as text
                const text = await file.text();
                setImportText(text);
                // Auto-parse CSV
                const lines = text.split('\n');
                const parsed: any[] = [];
                for (let line of lines) {
                    const parts = line.split(',').map(p => p.trim());
                    if (parts.length < 4) continue;
                    const [topic, type, q, a, correctIdx, expl, ...opts] = parts;
                    if (type.toLowerCase() === 'quiz') {
                        parsed.push({
                            topic,
                            type: 'quiz',
                            content: {
                                question: q,
                                options: opts.slice(0, 4),
                                correctAnswer: parseInt(correctIdx) || 0,
                                explanation: expl || ''
                            }
                        });
                    } else {
                        parsed.push({
                            topic,
                            type: 'flashcard',
                            content: { front: q, back: a }
                        });
                    }
                }
                setExtractedQuestions(parsed);
                alert(`CSV processado! ${parsed.length} questões encontradas.`);
            } else if (fileExtension === 'pdf') {
                // Parse PDF using pdfjs-dist
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items
                        .map((item: any) => item.str)
                        .join(' ');
                    fullText += pageText + '\n';
                }

                setImportText(fullText);
                alert(`PDF processado! ${pdf.numPages} páginas extraídas. Clique em "Extrair Questões" para processar com IA.`);
            } else {
                alert('Formato não suportado. Use CSV ou PDF.');
            }
        } catch (error: any) {
            console.error('Error parsing file:', error);
            alert('Erro ao processar arquivo: ' + error.message);
        } finally {
            setIsParsingFile(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleParseCSV = () => {
        if (!importText.trim()) {
            alert('Por favor, cole ou carregue um CSV primeiro.');
            return;
        }

        // Validar tópico selecionado
        const selectedTopic = importTopic === '__custom__' ? customTopic.trim() : importTopic;
        if (!selectedTopic) {
            alert('Por favor, selecione ou digite um tópico para as questões.');
            return;
        }

        // Simple CSV Parser - Formato depende do tipo selecionado
        const lines = importText.split('\n').filter(l => l.trim());
        const parsed: any[] = [];

        for (let line of lines) {
            const parts = line.split(',').map(p => p.trim());

            // Usar o tipo selecionado pelo usuário
            if (csvImportType === 'quiz') {
                // Formato Quiz: Pergunta, Resposta A, Resposta B, Resposta C, Resposta D, Índice Correto (0-3), Explicação
                if (parts.length < 6) continue; // Mínimo: pergunta + 4 opções + índice correto

                const [question, optA, optB, optC, optD, correctIdx, explanation] = parts;
                if (!question) continue;

                parsed.push({
                    topic: selectedTopic, // Usar o tópico selecionado
                    type: 'quiz',
                    content: {
                        question: question,
                        options: [optA || '', optB || '', optC || '', optD || ''],
                        correctAnswer: parseInt(correctIdx) || 0,
                        explanation: explanation || ''
                    }
                });
            } else {
                // Formato Flashcard: Pergunta/Frente, Resposta/Verso
                if (parts.length < 2) continue; // Mínimo: frente + verso

                const [front, back] = parts;
                if (!front || !back) continue;

                parsed.push({
                    topic: selectedTopic, // Usar o tópico selecionado
                    type: 'flashcard',
                    content: {
                        front: front,
                        back: back
                    }
                });
            }
        }

        if (parsed.length === 0) {
            alert('Nenhuma questão válida encontrada no CSV. Verifique o formato.');
            return;
        }

        setExtractedQuestions(parsed);
        alert(`${parsed.length} questões encontradas! Revise abaixo e confirme a importação.`);
    };

    const handleBulkImport = async () => {
        if (extractedQuestions.length === 0) return;

        if (!selectedCategoryId) {
            alert('Por favor, selecione uma categoria para importar.');
            return;
        }

        // Validar tópico (deve já estar definido nas questões, mas verificar mesmo assim)
        const hasTopics = extractedQuestions.every(q => q.topic && q.topic.trim());
        if (!hasTopics) {
            alert('Algumas questões não têm tópico definido.');
            return;
        }

        setIsImporting(true);
        try {
            const res = await fetch('http://localhost:3001/questions/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questions: extractedQuestions,
                    category_id: selectedCategoryId,
                    subject_id: selectedSubjectId || null
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Importado com sucesso! ${data.count} questões adicionadas.`);
                setExtractedQuestions([]);
                setImportText('');
                setImportTopic('');
                setCustomTopic('');
                fetchRecentQuestions();
                // Recarregar lista de tópicos para incluir o novo
                if (selectedCategoryId) {
                    fetchTopics(selectedCategoryId);
                }
            } else {
                alert('Erro na importação: ' + data.error);
            }
        } catch (e: any) {
            alert('Erro de conexão: ' + e.message);
        } finally {
            setIsImporting(false);
        }
    };

    // Drag handlers
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            addFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            addFiles(e.target.files);
        }
    };

    const addFiles = (fileList: FileList) => {
        const newFiles = Array.from(fileList).map(file => ({
            id: uuidv4(),
            file,
            status: 'waiting' as const
        }));
        setFiles(prev => [...prev, ...newFiles]);
    };

    const handleProcessFiles = async () => {
        // Validate category selection
        if (!selectedCategoryId) {
            alert('Por favor, selecione uma trilha profissional antes de processar os arquivos.');
            return;
        }

        setIsProcessing(true);

        // Loop through waiting files
        for (const fileItem of files) {
            if (fileItem.status !== 'waiting') continue;

            // Update status to uploading
            setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, status: 'uploading' } : f));

            try {
                // Read file content
                let content = '';
                if (fileItem.file.type === 'text/plain' || fileItem.file.name.toLowerCase().endsWith('.txt')) {
                    content = await fileItem.file.text();
                } else if (fileItem.file.type === 'application/pdf' || fileItem.file.name.toLowerCase().endsWith('.pdf')) {
                    try {
                        const arrayBuffer = await fileItem.file.arrayBuffer();
                        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items
                                .map((item: any) => item.str)
                                .join(' ');
                            content += pageText + '\n';
                        }
                    } catch (pdfError: any) {
                        throw new Error('Erro ao ler PDF: ' + pdfError.line || pdfError.message);
                    }
                } else {
                    throw new Error('Formato não suportado. Apenas .txt e .pdf são suportados.');
                }

                // Send to backend
                const response = await fetch('http://localhost:3001/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        content,
                        category_id: selectedCategoryId || null, // Pass selected category
                        metadata: {
                            filename: fileItem.file.name,
                            uploadedAt: new Date().toISOString()
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error('Falha no upload');
                }

                // Success
                setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, status: 'success' } : f));

            } catch (error: any) {
                // Error
                setFiles(prev => prev.map(f => f.id === fileItem.id ? {
                    ...f,
                    status: 'error',
                    message: error.message || 'Erro desconhecido'
                } : f));
            }
        }

        setIsProcessing(false);
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[200px] -right-[200px] w-[800px] h-[800px] bg-brand-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
                <div className="absolute top-[100px] -left-[200px] w-[600px] h-[600px] bg-purple-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold font-display text-slate-900">Painel Administrativo</h1>
                        <p className="text-xs text-slate-500 font-medium">Gerenciamento de Conteúdo e IA</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Sistema Operacional
                    </div>
                </div>
            </header>

            <div className="flex-1 relative z-10 p-8 max-w-7xl mx-auto w-full grid grid-cols-12 gap-8">

                {/* Sidebar Navigation */}
                <aside className="col-span-3">
                    <nav className="space-y-2">
                        {[
                            {
                                id: 'upload',
                                label: 'Upload de Conteúdo',
                                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            },
                            {
                                id: 'questions',
                                label: 'Banco de Questões',
                                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            },
                            {
                                id: 'lessons',
                                label: 'Aulas Digitais',
                                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            },
                            {
                                id: 'youtube',
                                label: 'Gestão de Vídeos',
                                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            },

                            {
                                id: 'users',
                                label: 'Gerenciar Usuários',
                                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            },
                            {
                                id: 'payments',
                                label: 'Pagamentos',
                                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            },
                            {
                                id: 'decipher',
                                label: 'Decifre o Termo',
                                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            },
                            {
                                id: 'settings', // AI Settings
                                label: 'Configurações IA',
                                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            },
                            {
                                id: 'general_settings', // General Settings
                                label: 'Definições',
                                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            },
                            {
                                id: 'contact',
                                label: 'Configurar Contatos',
                                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            },
                            {
                                id: 'trilhas',
                                label: 'Trilhas de Conhecimento',
                                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            },
                            {
                                id: 'blocking',
                                label: 'Bloqueios Usuários',
                                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            },
                            {
                                id: 'security',
                                label: 'Segurança',
                                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                    : 'bg-white/50 text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold opacity-80 backdrop-blur-sm ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {tab.icon}
                                </div>
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                        <h3 className="font-bold text-lg mb-2">Status da API</h3>
                        <div className="space-y-3 text-sm opacity-90">
                            <div className="flex justify-between">
                                <span>Backend</span>
                                <span className="font-mono bg-emerald-400/30 text-emerald-100 px-2 py-0.5 rounded text-xs border border-emerald-400/50">ONLINE</span>
                            </div>
                            <div className="flex justify-between">
                                <span>AI Agent</span>
                                <span className="font-mono bg-white/20 px-1 rounded">READY</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="col-span-9">

                    {activeTab === 'upload' && (
                        <div className="space-y-6">
                            {/* Step 1: Category Selection */}
                            <div className="bg-white/80 backdrop-blur rounded-3xl p-6 border border-white/50 shadow-sm">
                                <h3 className="font-bold text-lg text-slate-900 mb-4">1. Selecione a Trilha Profissional (Obrigatório)</h3>
                                <p className="text-sm text-slate-500 mb-4">O conteúdo enviado será associado a esta trilha para gerar questões específicas.</p>

                                {categories.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">Carregando categorias...</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setSelectedCategoryId(cat.id)}
                                                className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${selectedCategoryId === cat.id
                                                    ? 'border-brand-500 bg-brand-50 shadow-lg shadow-brand-500/20'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="text-2xl">{cat.icon || '📚'}</div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{cat.name}</p>
                                                </div>
                                                {selectedCategoryId === cat.id && (
                                                    <div className="ml-auto text-brand-600">
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Upload Zone */}
                            {selectedCategoryId ? (
                                <div
                                    className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${dragActive
                                        ? 'border-brand-500 bg-brand-50/50 scale-[1.02]'
                                        : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        multiple
                                        accept=".txt,.pdf"
                                        onChange={handleChange}
                                    />

                                    <div className="w-20 h-20 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-4xl shadow-sm text-slate-400">
                                        📂
                                    </div>

                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">2. Arraste seus arquivos PDF ou TXT</h3>
                                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                        O material será processado para a trilha: <strong className="text-brand-600">{categories.find(c => c.id === selectedCategoryId)?.name}</strong>
                                    </p>

                                    <label
                                        htmlFor="file-upload"
                                        className="inline-flex cursor-pointer bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                                    >
                                        Selecionar Arquivos
                                    </label>
                                </div>
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                                    <div className="text-4xl mb-4 opacity-30">👆</div>
                                    <p className="text-slate-500 font-medium">Selecione uma trilha acima para liberar o upload.</p>
                                </div>
                            )}

                            {/* File List */}
                            {files.length > 0 && (
                                <div className="bg-white/80 backdrop-blur rounded-3xl p-8 border border-white/50 shadow-sm">
                                    <h3 className="font-bold text-lg text-slate-900 mb-6 flex justify-between items-center">
                                        <span>Arquivos na Fila ({files.length})</span>
                                        {files.some(f => f.status === 'success') && (
                                            <button
                                                onClick={() => setFiles(prev => prev.filter(f => f.status !== 'success'))}
                                                className="text-xs text-slate-500 hover:text-red-500"
                                            >
                                                Limpar Concluídos
                                            </button>
                                        )}
                                    </h3>

                                    <div className="space-y-3">
                                        {files.map((fileItem) => (
                                            <div key={fileItem.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 table-row-animate group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs uppercase
                                                        ${fileItem.status === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                                            fileItem.status === 'error' ? 'bg-red-100 text-red-600' :
                                                                'bg-slate-200 text-slate-500'}`}>
                                                        {fileItem.file.name.split('.').pop()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{fileItem.file.name}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB • {fileItem.file.type || 'Desconhecido'}
                                                        </p>
                                                        {fileItem.message && (
                                                            <p className="text-xs text-red-500 mt-1">{fileItem.message}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    {fileItem.status === 'waiting' && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Aguardando</span>}
                                                    {fileItem.status === 'uploading' && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded animate-pulse">Processando...</span>}
                                                    {fileItem.status === 'success' && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Concluído</span>}
                                                    {fileItem.status === 'error' && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Falha</span>}

                                                    <button
                                                        onClick={() => removeFile(fileItem.id)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2"
                                                        disabled={fileItem.status === 'uploading'}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 flex justify-end">
                                        <button
                                            onClick={handleProcessFiles}
                                            disabled={isProcessing || !files.some(f => f.status === 'waiting')}
                                            className={`
                                                px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg
                                                ${isProcessing || !files.some(f => f.status === 'waiting')
                                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                                    : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-600/30 hover:scaleS-105'}
                                            `}
                                        >
                                            <span className="text-xl">{isProcessing ? '⏳' : '✨'}</span>
                                            {isProcessing ? 'Processando...' : 'Processar Tudo com IA'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'questions' && (
                        <div className="space-y-6">
                            {/* Category Cards */}
                            <div className="bg-white/80 backdrop-blur rounded-3xl p-6 border border-white/50 shadow-sm">
                                <h3 className="font-bold text-lg text-slate-900 mb-4">Selecione a Trilha Profissional</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategoryId(cat.id)}
                                            className={`p-4 rounded-2xl border-2 transition-all text-left ${selectedCategoryId === cat.id
                                                ? 'border-brand-500 bg-brand-50 shadow-lg shadow-brand-500/20'
                                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                                                }`}
                                        >
                                            <div className="text-3xl mb-2">{cat.icon || '📚'}</div>
                                            <p className="font-bold text-slate-900">{cat.name}</p>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedCategoryId && (
                                <div className="bg-white/80 backdrop-blur rounded-3xl p-8 border border-white/50 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-xl text-slate-900">
                                            Adicionar Questão para: <span className="text-brand-600">{categories.find(c => c.id === selectedCategoryId)?.name}</span>
                                        </h3>
                                        <div className="flex bg-slate-100 p-1 rounded-xl">
                                            <button
                                                onClick={() => setImportMode('manual')}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${importMode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Manual
                                            </button>
                                            <button
                                                onClick={() => { setImportMode('csv'); setExtractedQuestions([]); }}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${importMode === 'csv' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Importar CSV
                                            </button>
                                            <button
                                                onClick={() => { setImportMode('ai'); setExtractedQuestions([]); }}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${importMode === 'ai' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Extrair com IA
                                            </button>
                                        </div>
                                    </div>

                                    {/* MANUAL ENTRY */}
                                    {importMode === 'manual' && (
                                        <form onSubmit={handleQuestionSubmit} className="space-y-6">
                                            {/* Subject and Topic Row */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-bold text-slate-700">Matéria/Disciplina</label>
                                                    <select
                                                        value={selectedSubjectId}
                                                        onChange={e => setSelectedSubjectId(e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                    >
                                                        <option value="">-- Geral (Sem matéria) --</option>
                                                        {subjects.map(s => (
                                                            <option key={s.id} value={s.id}>{s.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="block text-sm font-bold text-slate-700">Tópico Específico</label>
                                                    <input
                                                        type="text"
                                                        value={qTopic}
                                                        onChange={e => setQTopic(e.target.value)}
                                                        placeholder="Ex: Malária, Farmacologia..."
                                                        required
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="block text-sm font-bold text-slate-700">Tipo da Questão</label>
                                                    <select
                                                        value={qType}
                                                        onChange={e => setQType(e.target.value as any)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                    >
                                                        <option value="quiz">Quiz (Múltipla Escolha)</option>
                                                        <option value="flashcard">Flashcard</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Add New Subject Inline */}
                                            <div className="flex items-end gap-3 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-xs font-medium text-slate-500">Adicionar nova matéria a esta categoria:</label>
                                                    <input
                                                        type="text"
                                                        value={newSubjectName}
                                                        onChange={e => setNewSubjectName(e.target.value)}
                                                        placeholder="Nome da nova matéria..."
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleAddSubject}
                                                    disabled={addingSubject || !newSubjectName.trim()}
                                                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {addingSubject ? '...' : '+ Adicionar'}
                                                </button>
                                            </div>

                                            {/* Quiz or Flashcard Fields will be below (lines 620+) */}

                                            {/* The rest of the form fields will follow here, we need to wrap them properly */}
                                            {/* Need to make sure we don't break the existing JSX structure */}


                                            {qType === 'quiz' ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-bold text-slate-700">Pergunta</label>
                                                        <textarea
                                                            value={qQuestion}
                                                            onChange={e => setQQuestion(e.target.value)}
                                                            rows={3}
                                                            required
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-bold text-slate-700">Opções de Resposta</label>
                                                        {qOptions.map((opt, idx) => (
                                                            <div key={idx} className="flex items-center gap-3">
                                                                <input
                                                                    type="radio"
                                                                    name="correctAnswer"
                                                                    checked={qCorrectIndex === idx}
                                                                    onChange={() => setQCorrectIndex(idx)}
                                                                    className="w-5 h-5 text-brand-600"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={opt}
                                                                    onChange={e => {
                                                                        const newOpts = [...qOptions];
                                                                        newOpts[idx] = e.target.value;
                                                                        setQOptions(newOpts);
                                                                    }}
                                                                    placeholder={`Opção ${String.fromCharCode(65 + idx)}`}
                                                                    required
                                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                                />
                                                            </div>
                                                        ))}
                                                        <p className="text-xs text-slate-400">Selecione o botão radial para indicar a resposta correta.</p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-bold text-slate-700">Explicação</label>
                                                        <textarea
                                                            value={qExplanation}
                                                            onChange={e => setQExplanation(e.target.value)}
                                                            rows={2}
                                                            required
                                                            placeholder="Explique porque a resposta correta é a certa..."
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-bold text-slate-700">Frente (Pergunta/Termo)</label>
                                                        <textarea
                                                            value={qQuestion}
                                                            onChange={e => setQQuestion(e.target.value)}
                                                            rows={3}
                                                            required
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-bold text-slate-700">Verso (Resposta/Definição)</label>
                                                        <textarea
                                                            value={qAnswer}
                                                            onChange={e => setQAnswer(e.target.value)}
                                                            rows={3}
                                                            required
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            <div className="flex justify-end pt-4">
                                                <button
                                                    type="submit"
                                                    disabled={submittingQ}
                                                    className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20 disabled:opacity-50"
                                                >
                                                    {submittingQ ? 'Salvando...' : 'Salvar no Banco'}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* CSV IMPORT */}
                                    {importMode === 'csv' && (
                                        <div className="space-y-6">
                                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                                <h4 className="font-bold text-slate-900 mb-2">Importar CSV</h4>
                                                <p className="text-sm text-slate-600 mb-4">
                                                    Faça upload de um arquivo CSV ou cole o conteúdo diretamente.
                                                </p>

                                                {/* Tipo de Importação */}
                                                <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200">
                                                    <label className="block text-sm font-bold text-slate-700 mb-3">Importar como:</label>
                                                    <div className="flex gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCsvImportType('quiz')}
                                                            className={`flex-1 p-4 rounded-xl border-2 transition-all ${csvImportType === 'quiz'
                                                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            <div className="text-2xl mb-2">📝</div>
                                                            <div className="font-bold">Questionário</div>
                                                            <div className="text-xs opacity-75 mt-1">Múltipla escolha com explicação</div>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCsvImportType('flashcard')}
                                                            className={`flex-1 p-4 rounded-xl border-2 transition-all ${csvImportType === 'flashcard'
                                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            <div className="text-2xl mb-2">🗂️</div>
                                                            <div className="font-bold">Flashcard</div>
                                                            <div className="text-xs opacity-75 mt-1">Pergunta e resposta simples</div>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Seleção de Tópico */}
                                                <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                                    <label className="block text-sm font-bold text-amber-800 mb-2">
                                                        📌 Tópico para as Questões <span className="text-red-500">*</span>
                                                    </label>
                                                    <p className="text-xs text-amber-600 mb-3">
                                                        Selecione um tópico existente ou crie um novo. Todas as questões importadas serão associadas a este tópico.
                                                    </p>
                                                    <div className="space-y-3">
                                                        <select
                                                            value={importTopic}
                                                            onChange={e => {
                                                                setImportTopic(e.target.value);
                                                                if (e.target.value !== '__custom__') {
                                                                    setCustomTopic('');
                                                                }
                                                            }}
                                                            className="w-full bg-white border border-amber-300 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                        >
                                                            <option value="">-- Selecione um tópico --</option>
                                                            {availableTopics.map(t => (
                                                                <option key={t} value={t}>{t}</option>
                                                            ))}
                                                            <option value="__custom__">➕ Criar novo tópico...</option>
                                                        </select>

                                                        {importTopic === '__custom__' && (
                                                            <input
                                                                type="text"
                                                                value={customTopic}
                                                                onChange={e => setCustomTopic(e.target.value)}
                                                                placeholder="Digite o nome do novo tópico..."
                                                                className="w-full bg-white border border-amber-300 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                            />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* CSV File Upload */}
                                                <div className="mb-4">
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Upload de Arquivo CSV</label>
                                                    <div
                                                        className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-slate-500 transition-colors cursor-pointer bg-white"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            accept=".csv"
                                                            onChange={handleFileUpload}
                                                            className="hidden"
                                                        />
                                                        {isParsingFile ? (
                                                            <span className="text-slate-600">Processando...</span>
                                                        ) : uploadedFile && uploadedFile.name.endsWith('.csv') ? (
                                                            <span className="text-emerald-600 font-medium">✓ {uploadedFile.name}</span>
                                                        ) : (
                                                            <span className="text-slate-500">📄 Clique para selecionar arquivo CSV</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-sm text-slate-500 mb-2 p-3 bg-white rounded-lg border border-slate-200">
                                                    <strong>Formato esperado:</strong><br />
                                                    {csvImportType === 'quiz' ? (
                                                        <>
                                                            <code className="bg-slate-100 px-1 rounded text-xs block mt-1">Pergunta, Opção A, Opção B, Opção C, Opção D, Índice Correto (0-3), Explicação</code>
                                                            <p className="text-xs text-slate-400 mt-2">Exemplo: O que é malária?, Doença viral, Doença bacteriana, Doença parasitária, Doença fúngica, 2, Malária é causada por Plasmodium</p>
                                                            <p className="text-xs text-amber-600 mt-1">💡 O tópico será definido pela seleção acima</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <code className="bg-slate-100 px-1 rounded text-xs block mt-1">Pergunta/Frente, Resposta/Verso</code>
                                                            <p className="text-xs text-slate-400 mt-2">Exemplo: O que é malária?, Doença infecciosa causada por parasitas do gênero Plasmodium</p>
                                                            <p className="text-xs text-amber-600 mt-1">💡 O tópico será definido pela seleção acima</p>
                                                        </>
                                                    )}
                                                </div>
                                                <textarea
                                                    value={importText}
                                                    onChange={e => setImportText(e.target.value)}
                                                    rows={10}
                                                    placeholder={csvImportType === 'quiz'
                                                        ? "Pergunta, Opção A, Opção B, Opção C, Opção D, Índice Correto, Explicação\nO que é malária?, Doença viral, Doença bacteriana, Doença parasitária, Doença fúngica, 2, Malária é causada por Plasmodium"
                                                        : "Pergunta, Resposta\nO que é malária?, Doença infecciosa causada por parasitas do gênero Plasmodium"
                                                    }
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                />
                                                <div className="flex justify-end gap-3 mt-4">
                                                    <button
                                                        type="button"
                                                        onClick={handleParseCSV}
                                                        className={`px-6 py-2 ${csvImportType === 'quiz' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg font-bold transition-colors`}
                                                    >
                                                        Processar como {csvImportType === 'quiz' ? 'Questionário' : 'Flashcard'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* AI EXTRACTION */}
                                    {importMode === 'ai' && (
                                        <div className="space-y-6">
                                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                                <h4 className="font-bold text-slate-900 mb-2">Extração Inteligente</h4>
                                                <p className="text-sm text-slate-600 mb-4">
                                                    Faça upload de um arquivo CSV ou PDF, ou cole o texto diretamente. A IA irá extrair perguntas automaticamente.
                                                </p>

                                                {/* File Upload Area */}
                                                <div className="mb-6">
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Upload de Arquivo</label>
                                                    <div
                                                        className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors cursor-pointer bg-white"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            accept=".csv,.pdf"
                                                            onChange={handleFileUpload}
                                                            className="hidden"
                                                        />
                                                        {isParsingFile ? (
                                                            <div className="text-purple-600">
                                                                <svg className="animate-spin h-8 w-8 mx-auto mb-2" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                <span className="font-medium">Processando arquivo...</span>
                                                            </div>
                                                        ) : uploadedFile ? (
                                                            <div className="text-emerald-600">
                                                                <svg className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <span className="font-medium">{uploadedFile.name}</span>
                                                                <p className="text-sm text-slate-500 mt-1">Clique para trocar o arquivo</p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <svg className="h-10 w-10 mx-auto mb-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                                </svg>
                                                                <span className="font-medium text-slate-600">Clique para selecionar</span>
                                                                <p className="text-sm text-slate-400 mt-1">Suporta CSV e PDF</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="relative mb-4">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <div className="w-full border-t border-slate-200"></div>
                                                    </div>
                                                    <div className="relative flex justify-center text-sm">
                                                        <span className="bg-slate-50 px-3 text-slate-500">ou cole o texto</span>
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Extração</label>
                                                    <select
                                                        value={qType}
                                                        onChange={e => setQType(e.target.value as any)}
                                                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                                    >
                                                        <option value="quiz">Quiz (Múltipla Escolha)</option>
                                                        <option value="flashcard">Flashcards</option>
                                                    </select>
                                                </div>

                                                {/* Seleção de Tópico para AI */}
                                                <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                                    <label className="block text-sm font-bold text-amber-800 mb-2">
                                                        📌 Tópico para as Questões <span className="text-red-500">*</span>
                                                    </label>
                                                    <p className="text-xs text-amber-600 mb-3">
                                                        Defina o tópico para as questões extraídas pela IA.
                                                    </p>
                                                    <div className="space-y-3">
                                                        <select
                                                            value={importTopic}
                                                            onChange={e => {
                                                                setImportTopic(e.target.value);
                                                                if (e.target.value !== '__custom__') {
                                                                    setCustomTopic('');
                                                                }
                                                            }}
                                                            className="w-full bg-white border border-amber-300 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                        >
                                                            <option value="">-- Selecione um tópico --</option>
                                                            {availableTopics.map(t => (
                                                                <option key={t} value={t}>{t}</option>
                                                            ))}
                                                            <option value="__custom__">➕ Criar novo tópico...</option>
                                                        </select>

                                                        {importTopic === '__custom__' && (
                                                            <input
                                                                type="text"
                                                                value={customTopic}
                                                                onChange={e => setCustomTopic(e.target.value)}
                                                                placeholder="Digite o nome do novo tópico..."
                                                                className="w-full bg-white border border-amber-300 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                            />
                                                        )}
                                                    </div>
                                                </div>

                                                <textarea
                                                    value={importText}
                                                    onChange={e => setImportText(e.target.value)}
                                                    rows={10}
                                                    placeholder="Cole o texto do material de estudo aqui..."
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                />
                                                <div className="flex justify-end gap-3 mt-4">
                                                    <button
                                                        onClick={handleExtractAI}
                                                        disabled={isExtracting}
                                                        className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
                                                    >
                                                        {isExtracting ? 'Extraindo...' : '✨ Extrair Questões'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* PREVIEW & CONFIRMATION */}
                                    {extractedQuestions.length > 0 && (
                                        <div className="mt-8 border-t border-slate-200 pt-8">
                                            <h3 className="font-bold text-lg text-slate-900 mb-4">
                                                Questões para Importar ({extractedQuestions.length})
                                            </h3>

                                            <div className="bg-slate-50 rounded-xl border border-slate-200 max-h-[400px] overflow-y-auto p-4 space-y-3 mb-6">
                                                {extractedQuestions.map((q, idx) => (
                                                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-sm">
                                                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                                                            <span>{q.topic}</span>
                                                            <span className="uppercase text-xs bg-slate-100 px-2 py-0.5 rounded">{q.type}</span>
                                                        </div>
                                                        <div className="text-slate-600">
                                                            {q.type === 'quiz' ? q.content.question : q.content.front}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-end gap-4">
                                                <button
                                                    onClick={() => setExtractedQuestions([])}
                                                    className="px-6 py-3 text-slate-500 font-bold hover:text-red-500"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleBulkImport}
                                                    disabled={isImporting}
                                                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                                >
                                                    {isImporting ? 'Importando...' : 'Confirmar Importação'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}


                            {/* Questions filter and list */}
                            <div className="bg-white/80 backdrop-blur rounded-3xl p-8 border border-white/50 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-slate-900">Questões Recentes ({recentQuestions.length})</h3>
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={filterCategoryId}
                                            onChange={e => setFilterCategoryId(e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                        >
                                            <option value="">Todas as Categorias</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={filterType}
                                            onChange={e => setFilterType(e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                        >
                                            <option value="">Todos os Tipos</option>
                                            <option value="quiz">Questionário (Quiz)</option>
                                            <option value="flashcard">Flashcards</option>
                                        </select>
                                        {recentQuestions.length > 0 && (
                                            <button
                                                onClick={handleDeleteAllQuestions}
                                                disabled={isDeletingAll}
                                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${isDeletingAll
                                                    ? 'bg-red-100 text-red-400 cursor-not-allowed'
                                                    : 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-200'
                                                    }`}
                                            >
                                                {isDeletingAll ? (
                                                    <>
                                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Apagando...
                                                    </>
                                                ) : (
                                                    <>🗑️ Apagar Todas</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {recentQuestions.map((q) => (
                                        <div key={q.id} className={`bg-slate-50 rounded-xl border transition-all ${expandedQuestionId === q.id ? 'border-brand-300 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}>
                                            {/* Header */}
                                            <div className="p-4 flex justify-between items-start">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${q.type === 'quiz' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {q.type}
                                                    </span>
                                                    {q.category && (
                                                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                                                            {q.category.icon} {q.category.name}
                                                        </span>
                                                    )}
                                                    {q.subject && (
                                                        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded">
                                                            {q.subject.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-400">{new Date(q.created_at).toLocaleDateString()}</span>
                                                    {/* Expand Button */}
                                                    <button
                                                        onClick={() => toggleExpandQuestion(q.id)}
                                                        className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition-all"
                                                        title={expandedQuestionId === q.id ? "Recolher" : "Expandir detalhes"}
                                                    >
                                                        <svg className={`w-4 h-4 transition-transform ${expandedQuestionId === q.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                    {/* Edit Button */}
                                                    <button
                                                        onClick={() => openEditModal(q)}
                                                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Editar questão"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => handleDeleteQuestion(q.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Apagar questão"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Question Content - Always visible */}
                                            <div className="px-4 pb-4">
                                                <p className="font-bold text-slate-800 text-sm mb-1">{q.topic}</p>
                                                <p className="text-slate-600 text-sm">
                                                    {q.type === 'quiz' ? q.content.question : q.content.front}
                                                </p>
                                            </div>

                                            {/* Expanded Content */}
                                            {expandedQuestionId === q.id && (
                                                <div className="px-4 pb-4 border-t border-slate-200 pt-4 space-y-3 bg-white/50 rounded-b-xl">
                                                    {q.type === 'quiz' ? (
                                                        <>
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-bold text-slate-500 uppercase">Opções:</p>
                                                                {q.content.options?.map((opt: string, idx: number) => (
                                                                    <div
                                                                        key={idx}
                                                                        className={`flex items-center gap-2 p-2 rounded-lg text-sm ${idx === q.content.correctAnswer ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-100 text-slate-600'}`}
                                                                    >
                                                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx === q.content.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                                                                            {String.fromCharCode(65 + idx)}
                                                                        </span>
                                                                        {opt}
                                                                        {idx === q.content.correctAnswer && (
                                                                            <span className="ml-auto text-xs bg-emerald-600 text-white px-2 py-0.5 rounded">✓ Correta</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {q.content.explanation && (
                                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                                                    <p className="text-xs font-bold text-amber-600 uppercase mb-1">Explicação:</p>
                                                                    <p className="text-sm text-amber-800">{q.content.explanation}</p>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                                            <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Resposta:</p>
                                                            <p className="text-sm text-emerald-800">{q.content.back}</p>
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-slate-400 flex gap-4 pt-2">
                                                        <span>ID: {q.id.slice(0, 8)}...</span>
                                                        <span>Criado em: {new Date(q.created_at).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {recentQuestions.length === 0 && (
                                        <p className="text-slate-400 text-center py-8">Nenhuma questão encontrada.</p>
                                    )}
                                </div>

                                {/* Load More / Pagination */}
                                {recentQuestions.length >= questionsLimit && (
                                    <div className="mt-4 flex justify-center">
                                        <button
                                            onClick={() => setQuestionsLimit(prev => prev + 500)}
                                            className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                                        >
                                            Carregar Mais Questões
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <AdminUsers />
                    )}



                    {activeTab === 'lessons' && (
                        <AdminLessonsManager categories={categories} />
                    )}

                    {activeTab === 'decipher' && (
                        <AdminDecipherTerms categories={categories} />
                    )}

                    {activeTab === 'settings' && (
                        <div className="bg-white/80 backdrop-blur rounded-3xl p-8 border border-white/50 shadow-sm">
                            <h3 className="font-bold text-xl text-slate-900 mb-6">Configurações do Sistema</h3>

                            <div className="space-y-6 max-w-2xl">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Modelo de IA (LLM)</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500">
                                        <option>Gemini 1.5 Pro (Google)</option>
                                        <option>GPT-4o (OpenAI)</option>
                                        <option>Claude 3.5 Sonnet (Anthropic)</option>
                                    </select>
                                    <p className="text-xs text-slate-400">O modelo escolhido será usado para gerar questões e correções.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Chave de API (OpenRouter)</label>
                                    <input
                                        type="password"
                                        placeholder="sk-or-..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-900">Backup Automático</p>
                                            <p className="text-xs text-slate-500">Salvar dados diariamente</p>
                                        </div>
                                        <div className="w-12 h-6 bg-brand-500 rounded-full relative cursor-pointer">
                                            <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                                        Salvar Alterações
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <AdminPaymentSettings />
                    )}

                    {activeTab === 'general_settings' && (
                        <AdminGeneralSettings />
                    )}

                    {activeTab === 'contact' && (
                        <AdminContactSettings />
                    )}

                    {activeTab === 'blocking' && (
                        <AdminBlocking />
                    )}

                    {activeTab === 'youtube' && (
                        <AdminYoutubeSettings />
                    )}

                    {activeTab === 'trilhas' && (
                        <AdminTrilhas />
                    )}

                    {activeTab === 'security' && (
                        <AdminSecurity />
                    )}

                </main>
            </div>

            {/* Edit Question Modal */}
            {editingQuestion && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl z-10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Editar Questão</h2>
                                <p className="text-sm text-slate-500">ID: {editingQuestion.id.slice(0, 8)}...</p>
                            </div>
                            <button
                                onClick={closeEditModal}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Type Display */}
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-bold px-3 py-1.5 rounded-lg uppercase ${editType === 'quiz' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {editType === 'quiz' ? '📝 Quiz' : '🃏 Flashcard'}
                                </span>
                            </div>

                            {/* Topic */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tópico</label>
                                <input
                                    type="text"
                                    value={editTopic}
                                    onChange={(e) => setEditTopic(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    placeholder="Ex: Farmacologia, Anatomia..."
                                />
                            </div>

                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                                <select
                                    value={editCategoryId}
                                    onChange={(e) => {
                                        setEditCategoryId(e.target.value);
                                        if (e.target.value) {
                                            fetchSubjects(e.target.value);
                                        }
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                >
                                    <option value="">Selecione uma categoria</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject Selection */}
                            {editCategoryId && subjects.length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Disciplina (Opcional)</label>
                                    <select
                                        value={editSubjectId}
                                        onChange={(e) => setEditSubjectId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="">Nenhuma disciplina específica</option>
                                        {subjects.map((subj) => (
                                            <option key={subj.id} value={subj.id}>{subj.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Question/Front */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    {editType === 'quiz' ? 'Pergunta' : 'Frente do Cartão'}
                                </label>
                                <textarea
                                    value={editQuestion}
                                    onChange={(e) => setEditQuestion(e.target.value)}
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    placeholder={editType === 'quiz' ? 'Digite a pergunta...' : 'Termo ou pergunta...'}
                                />
                            </div>

                            {/* Type-specific fields */}
                            {editType === 'quiz' ? (
                                <>
                                    {/* Options */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Opções de Resposta</label>
                                        <div className="space-y-2">
                                            {editOptions.map((opt, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditCorrectIndex(idx)}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${editCorrectIndex === idx
                                                            ? 'bg-emerald-500 text-white shadow-lg'
                                                            : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                                                            }`}
                                                    >
                                                        {String.fromCharCode(65 + idx)}
                                                    </button>
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOpts = [...editOptions];
                                                            newOpts[idx] = e.target.value;
                                                            setEditOptions(newOpts);
                                                        }}
                                                        className={`flex-1 bg-slate-50 border rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 ${editCorrectIndex === idx ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'
                                                            }`}
                                                        placeholder={`Opção ${String.fromCharCode(65 + idx)}`}
                                                    />
                                                    {editCorrectIndex === idx && (
                                                        <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded font-bold">Correta</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2">Clique na letra para marcar como resposta correta</p>
                                    </div>

                                    {/* Explanation */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Explicação</label>
                                        <textarea
                                            value={editExplanation}
                                            onChange={(e) => setEditExplanation(e.target.value)}
                                            rows={3}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                            placeholder="Por que esta é a resposta correta..."
                                        />
                                    </div>
                                </>
                            ) : (
                                /* Flashcard - Answer/Back */
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Verso do Cartão (Resposta)</label>
                                    <textarea
                                        value={editAnswer}
                                        onChange={(e) => setEditAnswer(e.target.value)}
                                        rows={4}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="Definição ou resposta..."
                                    />
                                </div>
                            )}
                        </div>

                        {/* Modal Actions */}
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-4 sticky bottom-0 bg-white rounded-b-3xl">
                            <button
                                onClick={closeEditModal}
                                className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdateQuestion}
                                disabled={isUpdating}
                                className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-brand-600/20 flex items-center gap-2"
                            >
                                {isUpdating ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Salvando...
                                    </>
                                ) : (
                                    <>✓ Salvar Alterações</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default AdminArea;
