import React from 'react';

interface TermsAndPrivacyProps {
    onBack: () => void;
}

const TermsAndPrivacy: React.FC<TermsAndPrivacyProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Header */}
            <header className="sticky top-0 w-full z-50 backdrop-blur-md bg-white/70 border-b border-white/50 shadow-sm transition-all duration-300">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/30">
                            <span className="relative z-10">A</span>
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="font-display font-bold text-slate-900 text-lg tracking-tight">Angola Saúde</span>
                            <span className="text-xs font-semibold text-brand-600 tracking-wider uppercase">Prep <span className="text-slate-400">2026</span></span>
                        </div>
                    </div>
                    <button
                        onClick={onBack}
                        className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        Voltar
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 mt-12 animate-fade-in">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight mb-4">
                        Termos e Privacidade
                    </h1>
                    <p className="text-lg text-slate-500 max-w-xl mx-auto">
                        Transparência e compromisso com sua jornada de preparação para o Concurso Público da Saúde 2026.
                    </p>
                </div>

                <div className="space-y-12">
                    {/* Disclaimer Section */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl">
                                ⚠️
                            </div>
                            <h2 className="text-2xl font-display font-bold text-slate-900">Aviso Legal</h2>
                        </div>
                        <div className="prose prose-slate text-slate-600 leading-relaxed">
                            <p>
                                O <strong>Angola Saúde Prep 2026</strong> é uma plataforma independente de caráter educacional e preparatório.
                                <strong> Não possuímos vínculo oficial</strong> com o Ministério da Saúde de Angola (MINSA) ou com a entidade organizadora do concurso público.
                            </p>
                            <p className="mt-4">
                                Todo o material didático, questões simuladas e jogos clínicos são desenvolvidos por nossa equipe de especialistas com base em editais anteriores e na literatura médica e de enfermagem vigente, com o objetivo de auxiliar no estudo e preparação dos candidatos.
                            </p>
                        </div>
                    </section>

                    {/* Privacy Policy */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-2xl">
                                🔒
                            </div>
                            <h2 className="text-2xl font-display font-bold text-slate-900">Política de Privacidade</h2>
                        </div>
                        <div className="prose prose-slate text-slate-600 leading-relaxed space-y-4">
                            <h3 className="text-lg font-bold text-slate-800">1. Coleta de Dados</h3>
                            <p>
                                Coletamos apenas as informações estritamente necessárias para o funcionamento da plataforma e personalização do seu estudo:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Dados de Conta:</strong> Nome e endereço de e-mail para criação de login e recuperação de senha.</li>
                                <li><strong>Dados de Progresso:</strong> Estatísticas de desempenho, tempo de estudo e respostas em simulados para gerar relatórios personalizados.</li>
                            </ul>

                            <h3 className="text-lg font-bold text-slate-800 mt-6">2. Uso das Informações</h3>
                            <p>
                                Seus dados são utilizados exclusivamente para:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Fornecer acesso aos conteúdos contratados.</li>
                                <li>Melhorar a experiência do usuário através de recomendações de estudo.</li>
                                <li>Comunicar atualizações importantes sobre a plataforma ou sobre o concurso (opcional).</li>
                            </ul>
                            <p className="mt-4">
                                <strong>Jamais vendemos ou compartilhamos seus dados pessoais com terceiros</strong> para fins comerciais.
                            </p>
                        </div>
                    </section>

                    {/* Terms of Service */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-2xl">
                                📜
                            </div>
                            <h2 className="text-2xl font-display font-bold text-slate-900">Termos de Uso</h2>
                        </div>
                        <div className="prose prose-slate text-slate-600 leading-relaxed space-y-4">
                            <h3 className="text-lg font-bold text-slate-800">1. Licença de Uso</h3>
                            <p>
                                Ao adquirir acesso ao Angola Saúde Prep 2026, você recebe uma licença pessoal, intransferível e não exclusiva para acessar os materiais de estudo. É estritamente <strong>proibido o compartilhamento de conta (login/senha)</strong> ou a reprodução, distribuição e venda de qualquer material da plataforma.
                            </p>

                            <h3 className="text-lg font-bold text-slate-800 mt-6">2. Disponibilidade</h3>
                            <p>
                                Esforçamo-nos para manter a plataforma disponível 24 horas por dia, 7 dias por semana. No entanto, interrupções temporárias para manutenção ou por motivos de força maior podem ocorrer.
                            </p>

                            <h3 className="text-lg font-bold text-slate-800 mt-6">3. Atualizações de Conteúdo</h3>
                            <p>
                                Nos comprometemos a manter o conteúdo atualizado conforme novas diretrizes ou editais sejam publicados para o Concurso de Saúde 2026.
                            </p>
                        </div>
                    </section>

                    {/* Contact */}
                    <div className="text-center pt-8">
                        <p className="text-slate-500 text-sm">
                            Dúvidas ou solicitações sobre seus dados? <br />
                            Entre em contato: <a href="mailto:suporte@angolasaudeprep.ao" className="text-brand-600 font-bold hover:underline">suporte@angolasaudeprep.ao</a>
                        </p>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default TermsAndPrivacy;
