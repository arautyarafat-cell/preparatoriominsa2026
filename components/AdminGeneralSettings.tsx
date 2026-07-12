import React, { useState, useEffect } from 'react';
import { settingsService, AppSettings } from '../services/settingsService';

export const AdminGeneralSettings: React.FC = () => {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            const data = await settingsService.getSettings();
            setSettings(data);
        };
        loadSettings();
    }, []);

    const handleToggleExplanations = async () => {
        if (!settings) return;
        
        const newValue = settings.global_explanations_enabled === false ? true : false;
        setSaving(true);
        
        const updatedSettings = { ...settings, global_explanations_enabled: newValue };
        setSettings(updatedSettings);
        
        await settingsService.updateSettings({ global_explanations_enabled: newValue });
        setSaving(false);
    };

    if (!settings) return <div className="p-8 text-center text-slate-500">A carregar definições...</div>;

    const isExplanationsEnabled = settings.global_explanations_enabled !== false; // default is true se não definido

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden min-h-[400px]">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-slate-900">Configurações Gerais</h2>
                        <p className="text-slate-500 mt-1">Definições globais da plataforma.</p>
                    </div>
                </div>
            </div>

            <div className="p-8">
                <div className="max-w-2xl">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Testes e Questionários</h3>
                    
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-6 py-5">
                        <div className="pr-6">
                            <div className="text-slate-900 font-medium flex items-center gap-2">
                                <span>💡</span> Ativar Explicações Globalmente
                            </div>
                            <p className="text-slate-500 text-sm mt-1">
                                Quando ativado, os utilizadores poderão ver as explicações ao final de cada questão. Se desativado, as explicações ficarão ocultas para todos os utilizadores.
                            </p>
                        </div>
                        <button
                            onClick={handleToggleExplanations}
                            disabled={saving}
                            className={`ml-4 relative inline-flex h-7 w-14 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                                isExplanationsEnabled ? 'bg-[#3ccfcf]' : 'bg-slate-300'
                            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                    isExplanationsEnabled ? 'translate-x-8' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
