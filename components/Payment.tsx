import React, { useState, useRef, useEffect } from 'react';
import { authService } from '../services/auth';
import { settingsService, AppSettings } from '../services/settingsService';
import { Header, HeaderProps } from './Header';

interface PaymentProps {
    onBack: () => void;
    planName?: string;
    planPrice?: string;
    user?: { email: string } | null;
    headerProps: HeaderProps;
}

interface PaymentMethod {
    id: string;
    type: 'reference' | 'qrcode' | 'transfer' | 'unitel';
    name: string;
    enabled: boolean;
    details: Record<string, string>;
}

const Payment: React.FC<PaymentProps> = ({ onBack, planName = 'Pro', planPrice = '2.500', user, headerProps }) => {
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loadingMethods, setLoadingMethods] = useState(true);
    const [appSettings, setAppSettings] = useState<AppSettings>({ whatsapp: '', email: '' });

    useEffect(() => {
        fetchPaymentMethods();
        fetchAppSettings();
    }, []);

    const fetchAppSettings = async () => {
        try {
            const settings = await settingsService.getSettings();
            setAppSettings(settings);
        } catch (error) {
            console.error('Failed to fetch app settings', error);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const response = await fetch('http://localhost:3001/payment-methods');
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    setMethods(data);
                    return;
                }
            }
            // Fallback defaults if API fails or empty
            setMethods([
                { id: '1', type: 'reference', name: 'Referência', enabled: true, details: { entity: '00000', reference: '123 456 789' } },
                { id: '4', type: 'transfer', name: 'Transferência Bancária', enabled: true, details: { bank: 'Banco BAI', iban: 'AO06 0000 0000 0000 0000 0000 0', beneficiary: 'Angola Saúde Prep' } },
                { id: '5', type: 'unitel', name: 'Unitel Money', enabled: true, details: { phoneNumber: '920 000 000', entityName: 'Angola Saúde' } }
            ]);
        } catch (error) {
            console.error('Failed to fetch payment methods', error);
        } finally {
            setLoadingMethods(false);
        }
    };

    const getMethod = (type: string) => methods.find(m => m.type === type);

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        alert(`${label} copiado!`);
    };

    const [proofFile, setProofFile] = useState<File | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [proofUrl, setProofUrl] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setProofFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!proofFile) return;
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', proofFile);
            formData.append('userEmail', user?.email || 'usuario_anonimo@email.com');
            formData.append('planType', planName?.toLowerCase() || 'pro');

            const response = await fetch('http://localhost:3001/payments/proof', {
                method: 'POST',
                headers: {
                    ...authService.getAuthHeaders()
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                if (data.proof && data.proof.file_url) {
                    setProofUrl(data.proof.file_url);
                }
                setUploadSuccess(true);
            } else {
                alert('Erro ao enviar comprovativo. Tente novamente.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Erro de conexão. Verifique sua internet.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleWhatsAppClick = () => {
        // Format phone number - remove any spaces, dashes, or plus signs
        const phone = (appSettings.whatsapp || '244923456789').replace(/[\s\-+]/g, '');
        let text = 'Olá, acabei de enviar o comprovativo de pagamento.';
        if (proofUrl) {
            text += `\n\nAqui está o link do comprovativo: ${proofUrl}`;
        }
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans relative overflow-x-hidden">
            <Header {...headerProps} />
            {/* Simple Modern Background */}
            <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-br from-brand-50 to-slate-50 pointer-events-none" />
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-200/20 blur-[100px] pointer-events-none" />
            <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-100/20 blur-[80px] pointer-events-none" />

            <div className="w-full mx-auto px-5 lg:px-20 py-12 relative z-10">

                {/* Header */}
                {/* Header removed */}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Order Summary & Proof Upload */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Order Summary Card */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300">
                            {/* Decorative top bar */}
                            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-500 to-brand-400" />

                            <h2 className="text-2xl font-display font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                </span>
                                Resumo
                            </h2>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mb-6">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Plano Selecionado</p>
                                    <p className="text-lg font-bold text-brand-600">Angola Saúde {planName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-display font-bold text-slate-900">{planPrice} <span className="text-sm text-slate-400">KZ</span></p>
                                </div>
                            </div>

                            <div className="space-y-4 text-sm text-slate-500 mb-8 border-t border-slate-100 pt-6">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-slate-900">{planPrice} KZ</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Taxas</span>
                                    <span className="font-medium text-slate-900">0 KZ</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-slate-900 pt-4 border-t border-slate-100">
                                    <span>Total a Pagar</span>
                                    <span className="text-brand-600">{planPrice} KZ</span>
                                </div>
                            </div>

                            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm leading-relaxed flex gap-3 border border-emerald-100 items-start">
                                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p>Após o pagamento, envie o comprovativo abaixo para ativação imediata.</p>
                            </div>
                        </div>

                        {/* Proof Upload Section */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300">
                            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
                            <h2 className="text-xl font-display font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                </span>
                                Enviar Comprovativo
                            </h2>
                            <p className="text-sm text-slate-500 mb-6 pl-10">Foto nítida ou PDF do recibo.</p>

                            {uploadSuccess ? (
                                <div className="text-center animate-in fade-in zoom-in duration-300 py-4">
                                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Recebido com Sucesso!</h3>
                                    <p className="text-sm text-slate-500 mb-6 px-4">
                                        Já recebemos o seu comprovativo e fomos notificados automaticamente. A nossa equipa irá analisar e libertar o seu acesso em instantes.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className={`bg-slate-50 border-2 border-dashed rounded-2xl p-8 text-center transition-all group cursor-pointer relative overflow-hidden ${proofFile ? 'border-brand-400 bg-brand-50/30' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-100'}`}
                                        onClick={() => fileInputRef.current?.click()}>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept="image/*,.pdf"
                                        />
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110 ${proofFile ? 'bg-brand-100 text-brand-600' : 'bg-white text-slate-400 group-hover:text-brand-500'}`}>
                                            {proofFile ? (
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            ) : (
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                            )}
                                        </div>
                                        {proofFile ? (
                                            <div>
                                                <p className="font-bold text-brand-700 text-sm break-all mb-1">{proofFile.name}</p>
                                                <p className="text-xs text-brand-500 font-medium">{(proofFile.size / 1024).toFixed(0)} KB • Pronto para enviar</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-bold text-slate-700 text-base mb-1 group-hover:text-brand-700 transition-colors">Clique para selecionar</p>
                                                <p className="text-xs text-slate-400">Suporta PDF, JPG e PNG</p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleUpload}
                                        disabled={!proofFile || isUploading}
                                        className={`w-full mt-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-base transition-all ${proofFile && !isUploading
                                            ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:shadow-lg hover:shadow-brand-500/25 hover:-translate-y-0.5'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {isUploading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Enviando...
                                            </>
                                        ) : 'Confirmar Envio'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Payment Methods */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden h-full">
                            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-slate-800 to-slate-700" />

                            <h2 className="text-3xl font-display font-bold text-slate-900 mb-2 mt-2">Pagamento Seguro</h2>
                            <p className="text-slate-500 mb-8 text-lg">Escolha o método mais conveniente para si.</p>

                            {loadingMethods ? (
                                <div className="p-12 text-center text-slate-400">
                                    <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-brand-500 rounded-full mx-auto mb-4"></div>
                                    Carregando métodos...
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Reference Payment */}
                                    {getMethod('reference')?.enabled && (
                                        <>
                                            <button
                                                onClick={() => setSelectedMethod('reference')}
                                                className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${selectedMethod === 'reference' ? 'border-brand-500 bg-brand-50/50 shadow-brand-500/10 shadow-lg' : 'border-slate-100 bg-slate-50 hover:border-brand-200 hover:shadow-md hover:bg-white'}`}
                                            >
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${selectedMethod === 'reference' ? 'bg-brand-500 text-white' : 'bg-white text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600'}`}>
                                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold text-lg mb-0.5 ${selectedMethod === 'reference' ? 'text-brand-700' : 'text-slate-900'}`}>{getMethod('reference')?.name || 'Referência'}</h3>
                                                    <p className="text-sm text-slate-500 font-medium">Multicaixa / Internet Banking</p>
                                                </div>
                                                {selectedMethod === 'reference' && (
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                )}
                                            </button>

                                            {selectedMethod === 'reference' && (
                                                <div className="animate-in fade-in slide-in-from-top-4 duration-300 bg-slate-50 border border-slate-200 rounded-2xl p-8 shadow-inner">
                                                    <p className="text-slate-600 mb-6 font-medium">Utilize os dados abaixo para pagamento:</p>
                                                    <div className="flex flex-col md:flex-row gap-6">
                                                        <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Entidade</span>
                                                            <span className="font-mono text-xl font-bold text-slate-800 tracking-wider">{getMethod('reference')?.details.entity || '00000'}</span>
                                                        </div>
                                                        <div className="flex-[2] bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group cursor-pointer hover:border-brand-300 transition-colors" onClick={() => handleCopy(getMethod('reference')?.details.reference || '123 456 789', 'Referência')}>
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Referência</span>
                                                            <span className="font-mono text-xl font-bold text-slate-800 tracking-widest">{getMethod('reference')?.details.reference || '123 456 789'}</span>
                                                            <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                                COPIAR
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Valor</span>
                                                            <span className="font-mono text-xl font-bold text-emerald-600">{planPrice} KZ</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Transfer Payment */}
                                    {getMethod('transfer')?.enabled && (
                                        <>
                                            <button
                                                onClick={() => setSelectedMethod('transfer')}
                                                className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${selectedMethod === 'transfer' ? 'border-brand-500 bg-brand-50/50 shadow-brand-500/10 shadow-lg' : 'border-slate-100 bg-slate-50 hover:border-brand-200 hover:shadow-md hover:bg-white'}`}
                                            >
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${selectedMethod === 'transfer' ? 'bg-brand-500 text-white' : 'bg-white text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600'}`}>
                                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold text-lg mb-0.5 ${selectedMethod === 'transfer' ? 'text-brand-700' : 'text-slate-900'}`}>{getMethod('transfer')?.name || 'Transferência'}</h3>
                                                    <p className="text-sm text-slate-500 font-medium">IBAN / Depósito</p>
                                                </div>
                                                {selectedMethod === 'transfer' && (
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                )}
                                            </button>

                                            {selectedMethod === 'transfer' && (
                                                <div className="animate-in fade-in slide-in-from-top-4 duration-300 bg-slate-50 border border-slate-200 rounded-2xl p-8 shadow-inner">
                                                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                        <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                        Coordenadas Bancárias
                                                    </h4>
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Banco</span>
                                                                <span className="font-bold text-slate-800">{getMethod('transfer')?.details.bank || 'Banco BAI'}</span>
                                                            </div>
                                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Beneficiário</span>
                                                                <span className="font-bold text-slate-800">{getMethod('transfer')?.details.beneficiary || 'Angola Saúde Prep'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group cursor-pointer hover:border-brand-400 transition-colors" onClick={() => handleCopy(getMethod('transfer')?.details.iban || 'AO06 0000 0000...', 'IBAN')}>
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">IBAN</span>
                                                            <span className="font-mono text-lg md:text-xl font-bold text-slate-800 break-all tracking-wider">{getMethod('transfer')?.details.iban || 'AO06 0000 0000 0000 0000 0000 0'}</span>
                                                            <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                                COPIAR
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Unitel Money */}
                                    {getMethod('unitel')?.enabled && (
                                        <>
                                            <button
                                                onClick={() => setSelectedMethod('unitel')}
                                                className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${selectedMethod === 'unitel' ? 'border-brand-500 bg-brand-50/50 shadow-brand-500/10 shadow-lg' : 'border-slate-100 bg-slate-50 hover:border-brand-200 hover:shadow-md hover:bg-white'}`}
                                            >
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-sm bg-white overflow-hidden border border-slate-100`}>
                                                    <img src="/unitel-money.png" alt="Unitel Money" className="w-full h-full object-contain p-1" />
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold text-lg mb-0.5 ${selectedMethod === 'unitel' ? 'text-brand-700' : 'text-slate-900'}`}>{getMethod('unitel')?.name || 'Unitel Money'}</h3>
                                                    <p className="text-sm text-slate-500 font-medium">Pagamento Móvel</p>
                                                </div>
                                                {selectedMethod === 'unitel' && (
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                )}
                                            </button>

                                            {selectedMethod === 'unitel' && (
                                                <div className="animate-in fade-in slide-in-from-top-4 duration-300 bg-slate-50 border border-slate-200 rounded-2xl p-8 shadow-inner">
                                                    <div className="flex items-center gap-4 bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6">
                                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">!</div>
                                                        <p className="text-orange-800 text-sm font-medium">Use esse número de telefone como referência ao fazer o envio.</p>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Enviar Para</span>
                                                            <span className="font-mono text-2xl font-bold text-slate-900">{getMethod('unitel')?.details.phoneNumber || '920 000 000'}</span>
                                                        </div>
                                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Entidade</span>
                                                            <span className="font-bold text-slate-900 text-lg">{getMethod('unitel')?.details.entityName || 'Angola Saúde'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Payment;
