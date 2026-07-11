import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';

const AdminContactSettings: React.FC = () => {
    const [whatsapp, setWhatsapp] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        const settings = await settingsService.getSettings();
        setWhatsapp(settings.whatsapp || '');
        setEmail(settings.email || '');
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const success = await settingsService.updateSettings({
            whatsapp,
            email
        });

        if (success) {
            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
            // Clear message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({
                type: 'error',
                text: 'Erro ao salvar. Verifique se a tabela "app_settings" foi criada no Supabase. Consulte backend/migrations/create_app_settings_table.sql'
            });
        }
        setSaving(false);
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Carregando configurações...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span>📞</span> Configurações de Contato
            </h2>

            <p className="text-slate-500 mb-8">
                Defina os contatos que aparecerão para os usuários em todas as áreas do aplicativo (Saiba Mais, Suporte, etc).
            </p>

            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    <span className="text-xl">{message.type === 'success' ? '✅' : '❌'}</span>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        WhatsApp de Suporte
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            💬
                        </div>
                        <input
                            type="text"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            placeholder="Ex: https://wa.me/244923456789 ou apenas o número"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        Pode ser o link completo (https://wa.me/...) ou o número. O sistema usará este valor nos botões de contato.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Email de Contato/Parcerias
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            📧
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Ex: contato@angolasaude.com"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95 ${saving
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminContactSettings;
