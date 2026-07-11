import React, { useState, useEffect } from 'react';
import { Icon } from './icons';
import { authService, API_URL } from '../services/auth';

export const AdminYoutubeSettings: React.FC = () => {
    const [videoUrl, setVideoUrl] = useState('');
    const [videoId, setVideoId] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Fetch current settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/settings?t=${Date.now()}`); // Cache busting
                if (response.ok) {
                    const data = await response.json();
                    if (data.featured_video_url) {
                        setVideoUrl(data.featured_video_url);
                        extractVideoId(data.featured_video_url);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    // Extract YouTube ID from URL
    const extractVideoId = (url: string) => {
        if (!url) {
            setVideoId('');
            return;
        }

        // Regular expression for YouTube URLs
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);

        if (match && match[2].length === 11) {
            setVideoId(match[2]);
        } else {
            setVideoId('');
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setVideoUrl(url);
        extractVideoId(url);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        // Validate video ID before saving
        if (videoUrl && !videoId) {
            setMessage({ type: 'error', text: 'URL do YouTube inválido. Por favor insira um link válido.' });
            setSaving(false);
            return;
        }

        try {
            const authHeaders = authService.getAuthHeaders();
            const response = await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({
                    featured_video_url: videoUrl
                })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Vídeo atualizado com sucesso!' });
            } else {
                setMessage({ type: 'error', text: 'Falha ao salvar. Tente novamente.' });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Erro de conexão.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="p-2 bg-red-100 text-red-600 rounded-lg">
                    <Icon name="play" size="md" />
                </span>
                Gestão de Vídeo em Destaque
            </h2>

            <div className="max-w-3xl">
                <p className="text-slate-500 mb-6">
                    Defina o vídeo do YouTube que será exibido na página inicial da plataforma.
                    O vídeo será reproduzido automaticamente (sem som) para os visitantes.
                </p>

                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Link do Vídeo do YouTube
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Icon name="link" size="sm" />
                            </div>
                            <input
                                type="text"
                                value={videoUrl}
                                onChange={handleUrlChange}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Aceita links padrão (watch?v=), links curtos (youtu.be) e links de embed.
                        </p>
                    </div>

                    {/* Preview */}
                    {videoId && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Pré-visualização</h3>
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black shadow-lg">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    )}

                    {message && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            <Icon name={message.type === 'success' ? 'check-circle' : 'alert-circle'} size="md" />
                            {message.text}
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={saving || loading}
                            className={`px-6 py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center gap-2 ${saving ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Icon name="save" size="sm" />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
