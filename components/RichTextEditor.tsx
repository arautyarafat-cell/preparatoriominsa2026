/**
 * ==================================================
 * RICH TEXT EDITOR - EDITOR DE TEXTO PERSONALIZADO
 * Compatível com React 19
 * ==================================================
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = 'Digite aqui...',
    className = ''
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showBgColorPicker, setShowBgColorPicker] = useState(false);
    const [currentColor, setCurrentColor] = useState('#000000');
    const [currentBgColor, setCurrentBgColor] = useState('#ffff00');
    const [fontSize, setFontSize] = useState('3');

    // Sincronizar o valor inicial
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, []);

    // Executar comando de formatação
    const execCommand = useCallback((command: string, commandValue: string | undefined = undefined) => {
        document.execCommand(command, false, commandValue);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
        editorRef.current?.focus();
    }, [onChange]);

    // Handler para mudanças no conteúdo
    const handleInput = useCallback(() => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

    // Handler para mudança de tamanho de fonte
    const handleFontSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = e.target.value;
        setFontSize(newSize);
        execCommand('fontSize', newSize);
    }, [execCommand]);

    // Cores predefinidas - todas únicas
    const colors = [
        '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
        '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
        '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
        '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
        '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
    ];

    // Botão da toolbar
    const ToolbarButton: React.FC<{
        onClick: () => void;
        active?: boolean;
        title: string;
        children: React.ReactNode;
    }> = ({ onClick, active, title, children }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 transition-colors ${active ? 'bg-slate-200 text-brand-600' : 'text-slate-600'
                }`}
        >
            {children}
        </button>
    );

    return (
        <div className={`border border-slate-300 rounded-xl overflow-hidden bg-white ${className}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 bg-slate-50">
                {/* Tamanho da Fonte */}
                <select
                    value={fontSize}
                    onChange={handleFontSizeChange}
                    className="h-8 px-2 border border-slate-200 rounded text-sm bg-white"
                    title="Tamanho da fonte"
                >
                    <option value="1">Pequeno</option>
                    <option value="3">Normal</option>
                    <option value="5">Grande</option>
                    <option value="7">Enorme</option>
                </select>

                <div className="w-px h-6 bg-slate-300 mx-1" />

                {/* Negrito */}
                <ToolbarButton onClick={() => execCommand('bold')} title="Negrito (Ctrl+B)">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
                    </svg>
                </ToolbarButton>

                {/* Itálico */}
                <ToolbarButton onClick={() => execCommand('italic')} title="Itálico (Ctrl+I)">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
                    </svg>
                </ToolbarButton>

                {/* Sublinhado */}
                <ToolbarButton onClick={() => execCommand('underline')} title="Sublinhado (Ctrl+U)">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
                    </svg>
                </ToolbarButton>

                {/* Riscado */}
                <ToolbarButton onClick={() => execCommand('strikeThrough')} title="Riscado">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z" />
                    </svg>
                </ToolbarButton>

                <div className="w-px h-6 bg-slate-300 mx-1" />

                {/* Cor do texto */}
                <div className="relative">
                    <ToolbarButton
                        onClick={() => { setShowColorPicker(!showColorPicker); setShowBgColorPicker(false); }}
                        title="Cor do texto"
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold">A</span>
                            <div className="w-4 h-1 rounded" style={{ backgroundColor: currentColor }} />
                        </div>
                    </ToolbarButton>
                    {showColorPicker && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 grid grid-cols-10 gap-1">
                            {colors.map((color, index) => (
                                <button
                                    key={`text-${index}-${color}`}
                                    type="button"
                                    onClick={() => {
                                        setCurrentColor(color);
                                        execCommand('foreColor', color);
                                        setShowColorPicker(false);
                                    }}
                                    className="w-5 h-5 rounded border border-slate-200 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Cor de fundo (destaque) */}
                <div className="relative">
                    <ToolbarButton
                        onClick={() => { setShowBgColorPicker(!showBgColorPicker); setShowColorPicker(false); }}
                        title="Destacar texto"
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold px-1 rounded" style={{ backgroundColor: currentBgColor }}>A</span>
                        </div>
                    </ToolbarButton>
                    {showBgColorPicker && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 grid grid-cols-10 gap-1">
                            {colors.map((color, index) => (
                                <button
                                    key={`bg-${index}-${color}`}
                                    type="button"
                                    onClick={() => {
                                        setCurrentBgColor(color);
                                        execCommand('hiliteColor', color);
                                        setShowBgColorPicker(false);
                                    }}
                                    className="w-5 h-5 rounded border border-slate-200 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-px h-6 bg-slate-300 mx-1" />

                {/* Lista com marcadores */}
                <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Lista com marcadores">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
                    </svg>
                </ToolbarButton>

                {/* Lista numerada */}
                <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Lista numerada">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
                    </svg>
                </ToolbarButton>

                <div className="w-px h-6 bg-slate-300 mx-1" />

                {/* Alinhar à esquerda */}
                <ToolbarButton onClick={() => execCommand('justifyLeft')} title="Alinhar à esquerda">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z" />
                    </svg>
                </ToolbarButton>

                {/* Centralizar */}
                <ToolbarButton onClick={() => execCommand('justifyCenter')} title="Centralizar">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z" />
                    </svg>
                </ToolbarButton>

                {/* Alinhar à direita */}
                <ToolbarButton onClick={() => execCommand('justifyRight')} title="Alinhar à direita">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z" />
                    </svg>
                </ToolbarButton>

                <div className="w-px h-6 bg-slate-300 mx-1" />

                {/* Limpar formatação */}
                <ToolbarButton onClick={() => execCommand('removeFormat')} title="Limpar formatação">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z" />
                    </svg>
                </ToolbarButton>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="min-h-[200px] max-h-[400px] overflow-y-auto p-4 focus:outline-none prose prose-slate max-w-none"
                style={{ whiteSpace: 'pre-wrap' }}
                data-placeholder={placeholder}
                suppressContentEditableWarning
            />

            {/* Estilo para placeholder */}
            <style>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
