import React from 'react';

interface PricingProps {
    onBack: () => void;
    onSubscribe: (plan: { name: string, price: string }) => void;
}

const Pricing: React.FC<PricingProps> = ({ onBack, onSubscribe }) => {
    const plans = [
        {
            name: 'Pro',
            price: '2.500',
            currency: 'KZ',
            period: '/mês',
            description: 'A melhor escolha para ser aprovado.',
            features: [
                'Acesso a Todas as Trilhas',
                'Simulados com IA',
                'Correção de Provas Ilimitada',
                'Tutor Virtual 24h'
            ],
            cta: 'Assinar Pro',
            highlight: false,
            recommended: false,
            color: 'bg-gradient-to-br from-indigo-50 to-purple-50',
            textColor: 'text-slate-900',
            buttonColor: 'bg-slate-900 text-white hover:bg-slate-800'
        },
        {
            name: 'Premium',
            price: '3.000',
            currency: 'KZ',
            period: '/mês',
            description: 'Experiência VIP completa.',
            features: [
                'Tudo do Plano Pro',
                'Mentoria Mensal',
                'Materiais Impressos (PDF)',
                'Acesso Antecipado a Novos Jogos'
            ],
            cta: 'Virar Premium',
            highlight: true,
            recommended: true,
            color: 'bg-slate-900',
            textColor: 'text-white',
            buttonColor: 'bg-brand-500 text-white hover:bg-brand-600'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-slate-200/50 to-transparent pointer-events-none"></div>
            <div className="absolute -top-[200px] -right-[200px] w-[800px] h-[800px] bg-brand-100/30 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="absolute top-[200px] -left-[200px] w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">

                {/* Header */}
                <div className="flex items-center justify-between mb-16">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        <span className="font-bold text-sm">Voltar</span>
                    </button>
                </div>

                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-brand-600 font-bold tracking-widest uppercase text-xs mb-4">Planos Flexíveis</h2>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 mb-6 leading-tight">
                        Invista no seu futuro na <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Saúde Pública</span>.
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                        Escolha o plano ideal para sua preparação e garanta sua vaga no concurso de 2026.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="flex flex-wrap justify-center gap-8 items-start">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative w-full max-w-sm rounded-[2.5rem] p-8 transition-all duration-300 ${plan.highlight ? 'scale-105 shadow-2xl z-10 ring-4 ring-brand-500/20' : 'hover:-translate-y-2 hover:shadow-xl border border-slate-200'} ${plan.color} ${plan.textColor}`}
                        >
                            {plan.recommended && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-brand-500/30">
                                    Recomendado
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="font-bold text-xl mb-2 opacity-80">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-display font-bold">{plan.price}</span>
                                    <span className="text-sm font-bold opacity-60">{plan.currency}</span>
                                    <span className="text-sm opacity-60">{plan.period}</span>
                                </div>
                                <p className="mt-4 text-sm opacity-70 leading-relaxed min-h-[40px]">
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-4 mb-10">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm font-medium opacity-90">
                                        <svg className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? 'text-brand-400' : 'text-brand-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => onSubscribe({ name: plan.name, price: plan.price })}
                                className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 ${plan.buttonColor}`}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <p className="text-slate-400 text-sm">
                        Dúvidas sobre os planos? <a href="https://wa.me/244934931225" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Fale com nossa equipe</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
