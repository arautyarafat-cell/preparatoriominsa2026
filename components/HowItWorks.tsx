import React, { useState, useEffect } from 'react';
import { settingsService, AppSettings } from '../services/settingsService';

interface HowItWorksProps {
    onBack: () => void;
    onStart: () => void;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ onBack, onStart }) => {
    const [activeSection, setActiveSection] = useState(0);
    const [settings, setSettings] = useState<AppSettings>({ whatsapp: '', email: '' });

    const features = [
        {
            title: "Módulos de Estudo",
            description: "Acesse conteúdos completos e atualizados, organizados por trilhas de conhecimento específicas para sua área de atuação (Medicina, Enfermagem, etc).",
            icon: "📚",
            color: "from-blue-500 to-indigo-600",
            bg: "bg-blue-50"
        },
        {
            title: "Tutor IA Inteligente",
            description: "Tire dúvidas em tempo real com nosso assistente de IA treinado especificamente para concursos de saúde em Angola.",
            icon: "🤖",
            color: "from-emerald-500 to-teal-600",
            bg: "bg-emerald-50"
        },
        {
            title: "Simulados e Quiz",
            description: "Teste seus conhecimentos com milhares de questões, simulados cronometrados e feedback imediato sobre seu desempenho.",
            icon: "📝",
            color: "from-amber-500 to-orange-600",
            bg: "bg-amber-50"
        },
        {
            title: "Jogos Clínicos",
            description: "Aprenda de forma lúdica com o MedSim e Decifre o Termo, jogos projetados para reforçar o raciocínio clínico e terminologia.",
            icon: "🎮",
            color: "from-purple-500 to-pink-600",
            bg: "bg-purple-50"
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSection((prev) => (prev + 1) % features.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [features.length]);

    useEffect(() => {
        const loadSettings = async () => {
            const data = await settingsService.getSettings();
            setSettings(data);
        };
        loadSettings();
    }, []);

    // Helper to format WhatsApp link
    const getWhatsAppLink = (contact: string) => {
        if (!contact) return '#';
        if (contact.startsWith('http')) return contact;
        // Remove non-numeric chars
        const number = contact.replace(/\D/g, '');
        return `https://wa.me/${number}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans relative overflow-x-hidden selection:bg-brand-200 selection:text-brand-900">
            {/* Background Ambient Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-200/20 blur-[100px] animate-pulse" />
                <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-100/20 blur-[80px]" />
            </div>

            <div className="w-full max-w-7xl mx-auto px-6 py-12 relative z-10">

                {/* Header */}
                <div className="flex items-center justify-between mb-16">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow-md"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        <span className="font-bold text-sm">Voltar</span>
                    </button>

                    <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Plataforma Oficial 2026
                    </div>
                </div>

                {/* Hero Title */}
                <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up">
                    <h1 className="text-4xl md:text-6xl font-display font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                        Como funciona o <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600">
                            Angola Saúde Prep?
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-light">
                        Uma plataforma completa projetada para maximizar sua aprovação nos concursos públicos de saúde de Angola.
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">

                    {/* Left: Interactive Feature List */}
                    <div className="space-y-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                onClick={() => setActiveSection(index)}
                                className={`p-6 rounded-3xl cursor-pointer transition-all duration-300 border relative overflow-hidden group ${activeSection === index
                                    ? 'bg-white border-brand-200 shadow-xl shadow-brand-900/5 scale-[1.02]'
                                    : 'bg-white/50 border-transparent hover:bg-white hover:border-slate-100 hover:shadow-lg'
                                    }`}
                            >
                                {activeSection === index && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-brand-500 to-brand-600" />
                                )}

                                <div className="flex items-start gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform duration-500 ${activeSection === index ? 'scale-110 rotate-3' : 'scale-100'
                                        } ${feature.bg}`}>
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold font-display mb-2 transition-colors ${activeSection === index ? 'text-slate-900' : 'text-slate-600'
                                            }`}>
                                            {feature.title}
                                        </h3>
                                        <p className={`text-sm leading-relaxed transition-colors ${activeSection === index ? 'text-slate-500' : 'text-slate-400'
                                            }`}>
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: Visual Representation */}
                    <div className="relative h-[600px] hidden lg:block perspective-1000">
                        {/* Abstract Background Blobs */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${features[activeSection].color} opacity-10 rounded-[3rem] blur-3xl transition-all duration-1000 transform`}></div>

                        {/* Phone/Card Mockup */}
                        <div className="relative z-10 w-full h-full bg-white rounded-[3rem] border-8 border-slate-900 shadow-2xl overflow-hidden transform transition-all duration-700 hover:rotate-1">
                            {/* Fake Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-900 rounded-b-3xl z-20"></div>

                            {/* Screen Content - Dynamic based on active section */}
                            <div className="h-full bg-slate-50 flex flex-col">
                                {/* Screen Header */}
                                <div className={`h-40 bg-gradient-to-br ${features[activeSection].color} p-8 flex flex-col justify-end text-white transition-all duration-700`}>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <span>{features[activeSection].icon}</span>
                                        {features[activeSection].title}
                                    </h2>
                                    <p className="text-white/80 text-sm mt-1">Explorar conteúdo</p>
                                </div>

                                {/* Mock Content */}
                                <div className="p-6 space-y-4 flex-1 overflow-hidden">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                            <div className="w-10 h-10 rounded-full bg-slate-100"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-2 w-3/4 bg-slate-100 rounded-full"></div>
                                                <div className="h-2 w-1/2 bg-slate-100 rounded-full"></div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="mt-8 p-6 bg-brand-50 rounded-2xl border border-brand-100 text-center">
                                        <p className="text-brand-700 font-bold mb-2">Desempenho +87%</p>
                                        <div className="h-2 w-full bg-brand-200 rounded-full overflow-hidden">
                                            <div className="h-full w-[87%] bg-brand-500 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Nav Mock */}
                                <div className="h-20 bg-white border-t border-slate-100 flex justify-around items-center px-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className={`w-8 h-8 rounded-lg ${i === 1 ? 'bg-brand-500' : 'bg-slate-200'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute top-20 -right-10 bg-white p-4 rounded-2xl shadow-xl shadow-black/5 animate-bounce-slow z-20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl">🏆</div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Resultado</p>
                                    <p className="font-bold text-slate-900">Aprovado</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Daily Updates Info Section */}
                <div className="mb-24 relative overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[2.5rem] border border-orange-100 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative animate-fade-in-up">

                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative z-10 flex-shrink-0 bg-white p-6 rounded-2xl shadow-lg shadow-orange-900/5 rotate-3 hover:rotate-6 transition-transform duration-500">
                            <span className="text-5xl">📅</span>
                        </div>

                        <div className="relative z-10 flex-1 text-center md:text-left space-y-4">
                            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                Constantemente Atualizado
                            </div>
                            <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-800">
                                Conteúdo novo todos os dias!
                            </h3>
                            <p className="text-slate-600 text-lg leading-relaxed">
                                Nossa equipe trabalha incansavelmente para adicionar <strong className="text-orange-600">novos termos, questionários, flashcards e aulas diariamente</strong>.
                                Você sempre terá material fresco e relevante para estudar, garantindo que sua preparação esteja sempre um passo à frente.
                            </p>
                        </div>

                        {/* Stats pills */}
                        <div className="flex flex-wrap gap-3 justify-center md:justify-end max-w-xs">
                            {["+50 Questões/dia", "+20 Termos/dia", "+5 Aulas/semana"].map((tag, i) => (
                                <span key={i} className="bg-white/60 backdrop-blur border border-orange-100/50 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium shadow-sm">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="bg-slate-900 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                    <div className="absolute -top-[50%] -left-[10%] w-[100%] h-[200%] bg-gradient-to-r from-brand-600/30 to-indigo-600/30 blur-3xl rounded-full animate-rotate-slow"></div>

                    <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                        <h2 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight">
                            Pronto para começar sua jornada?
                        </h2>
                        <p className="text-lg text-slate-300">
                            Junte-se a milhares de profissionais de saúde em Angola que já estão se preparando com a melhor plataforma do mercado.
                        </p>
                        <button
                            onClick={onStart}
                            className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-1 transition-all duration-300"
                        >
                            Começar agora mesmo
                        </button>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6">
                    <a
                        href={getWhatsAppLink(settings.whatsapp || '244923456789')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors group border border-emerald-100"
                    >
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform text-xl">
                            💬
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Dúvidas?</p>
                            <p className="font-bold">Contactar equipe pelo WhatsApp</p>
                        </div>
                    </a>

                    <a
                        href={`mailto:${settings.email || 'contato@angolasaude.com'}`}
                        className="flex items-center gap-3 px-6 py-4 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors group border border-slate-200"
                    >
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform text-xl">
                            📧
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Parcerias</p>
                            <p className="font-bold">Contratar pelo Email</p>
                        </div>
                    </a>
                </div>

            </div>
        </div>
    );
};

export default HowItWorks;
