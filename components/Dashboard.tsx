import React, { useState, useEffect } from 'react';
import { CATEGORIES, MOCK_STATS, MOCK_TOPICS } from '../constants';
import { Category, Topic } from '../types';
import { Icon } from './icons';
import { Header } from './Header';
import { API_URL } from '../config/api';



interface DashboardProps {
  onSelectCategory: (category: Category) => void;
  onSelectTopic: (topic: Topic) => void;
  onEnterAdmin: () => void;
  onLogin: () => void;
  onEnterPricing: () => void;
  onEnterProfile: () => void;
  onEnterTerms: () => void;
  onEnterHowItWorks: () => void;
  onEnterKnowledgeTest: () => void;
  onLogout: () => void;
  user?: any;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectCategory, onSelectTopic, onEnterAdmin, onLogin, onEnterPricing, onEnterProfile, onEnterTerms, onEnterHowItWorks, onEnterKnowledgeTest, onLogout, user }) => {
  // Track if screen is large enough for chart (lg breakpoint = 1024px)
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [blockedCategories, setBlockedCategories] = useState<string[]>([]);
  const [featuredVideoId, setFeaturedVideoId] = useState<string | null>(null); // No default video - show placeholder image when null

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch blocked categories
  useEffect(() => {
    const fetchBlocked = async () => {
      try {
        const res = await fetch(`${API_URL}/blocking/categories`);
        const data = await res.json();
        setBlockedCategories(data.blockedCategories || []);
      } catch (e) {
        console.error('Failed to fetch blocked categories:', e);
      }
    };
    fetchBlocked();
  }, []);

  // Fetch featured video setting
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        const data = await res.json();
        if (data.featured_video_url) {
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
          const match = data.featured_video_url.match(regExp);
          if (match && match[2].length === 11) {
            setFeaturedVideoId(match[2]);
          }
        }
      } catch (e) {
        console.error('Failed to fetch settings:', e);
      }
    };
    fetchSettings();
  }, []);

  const data = [
    { name: 'Médico', value: 65, color: '#3b82f6' },
    { name: 'Enfermagem', value: 45, color: '#14b8a6' },
    { name: 'Téc. Enf', value: 30, color: '#10b981' },
    { name: 'Farmácia', value: 55, color: '#6366f1' },
    { name: 'Análises', value: 80, color: '#8b5cf6' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-brand-200 selection:text-brand-900 pb-12">
      {/* Ambient Background - Enhanced */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-brand-200/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] bg-teal-200/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Glassmorphic Header */}
      {/* Glassmorphic Header */}
      <Header
        user={user}
        onLogin={onLogin}
        onLogout={onLogout}
        onEnterAdmin={onEnterAdmin}
        onEnterPricing={onEnterPricing}
        onEnterProfile={onEnterProfile}
        onEnterHowItWorks={onEnterHowItWorks}
        onSelectCategory={onSelectCategory}
        onGoHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">

          {/* Left Content */}
          <div className="text-center lg:text-left space-y-6 lg:space-y-8 animate-fade-in relative z-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 border border-sky-100/50 text-sky-700 text-[10px] lg:text-xs font-bold uppercase tracking-widest shadow-sm hover:shadow-md transition-shadow cursor-default">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              Preparatório de Excelência
            </div>

            <h1 className="text-5xl lg:text-7xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.05]">
              Aprovação <br className="lg:hidden" /> garantida <br />
              <span className="text-sky-500">
                na palma da mão.
              </span>
            </h1>

            <p className="text-base lg:text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Todo o material utilizado é de origem angolana e cuidadosamente selecionado, garantindo fiabilidade. Os questionários são elaborados com base em exames anteriores, e os demais conteúdos estão alinhados ao Sistema Nacional de Saúde
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => document.getElementById('trilhas')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-10 py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-sky-500/20 hover:shadow-sky-500/30 hover:-translate-y-1 transition-all duration-300"
              >
                Começar Agora
              </button>
              <button
                onClick={onEnterHowItWorks}
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-500 hover:text-sky-600 rounded-2xl font-bold border border-slate-200 shadow-sm hover:border-sky-100 hover:bg-sky-50/30 transition-all duration-300"
              >
                Saiba Mais
              </button>
            </div>

            <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Icon name="check-circle" size="md" className="text-emerald-500" />
                Material Atualizado
              </span>
              <span className="flex items-center gap-1">
                <Icon name="check-circle" size="md" className="text-emerald-500" />
                IA Integrada
              </span>
            </div>
          </div>

          {/* Right Visual - Video Card - Desktop */}
          <div className="relative group hidden lg:block">
            {/* Floating Elements Background */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-200/50 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-200/50 rounded-full blur-2xl animate-pulse animation-delay-1000"></div>

            <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/60 shadow-2xl transition-all duration-500 group-hover:shadow-3xl">
              <div className="mb-6 text-center">
                <h3 className="font-display font-bold text-slate-900 text-xl">Conheça a Plataforma</h3>
              </div>

              <div className="w-full relative pt-[56.25%] rounded-2xl overflow-hidden shadow-lg border border-white/50">
                {featuredVideoId ? (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${featuredVideoId}?autoplay=1&mute=1&controls=1&loop=1&playlist=${featuredVideoId}&rel=0&modestbranding=1&showinfo=0&cc_load_policy=0&iv_load_policy=3`}
                    title="Apresentação Minsa Preparatório"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <img
                    src="/hero-placeholder.png"
                    alt="Plataforma Minsa Preparatório"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                {/* Overlay for better integration (optional) */}
                <div className="absolute inset-0 ring-1 ring-black/5 rounded-2xl pointer-events-none"></div>
              </div>
            </div>

            {/* Botão Teste - Desktop */}
            <div className="mt-4">
              <button
                onClick={onEnterKnowledgeTest}
                className="w-full px-10 py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 hover:from-purple-700 hover:via-pink-600 hover:to-rose-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/30 hover:shadow-purple-500/40 hover:-translate-y-1 transition-all duration-300 inline-flex items-center justify-center gap-3 group"
              >
                <span className="text-2xl group-hover:animate-bounce">🎯</span>
                <span>Teste o seu Conhecimento</span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">MINSA 2026</span>
              </button>
            </div>
          </div>

          {/* Video Card - Mobile */}
          <div className="lg:hidden mt-10 relative flex flex-col gap-4">
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-4 border border-white/60 shadow-xl">
              <div className="mb-4 text-center">
                <h3 className="font-display font-bold text-slate-900 text-lg">Conheça a Plataforma</h3>
              </div>

              <div className="w-full relative pt-[56.25%] rounded-xl overflow-hidden shadow-lg">
                {featuredVideoId ? (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${featuredVideoId}?autoplay=0&mute=0&controls=1&loop=1&playlist=${featuredVideoId}&rel=0&modestbranding=1&showinfo=0&cc_load_policy=0&iv_load_policy=3&playsinline=1`}
                    title="Apresentação Minsa Preparatório"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <img
                    src="/hero-placeholder.png"
                    alt="Plataforma Minsa Preparatório"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>
            </div>

            {/* Botão Teste - Mobile */}
            <button
              onClick={onEnterKnowledgeTest}
              className="w-full px-10 py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 hover:from-purple-700 hover:via-pink-600 hover:to-rose-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/30 hover:shadow-purple-500/40 hover:-translate-y-1 transition-all duration-300 inline-flex items-center justify-center gap-3 group"
            >
              <span className="text-2xl group-hover:animate-bounce">🎯</span>
              <span>Teste o seu Conhecimento</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">MINSA 2026</span>
            </button>
          </div>

          {/* Botão Destacado - Teste o seu Conhecimento - Abaixo do vídeo */}

        </div>
      </section>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 relative z-20">

        {/* KPI Cards - Floating Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 -mt-4 lg:-mt-10 mb-20">
          {[
            { label: 'Questões Resolvidas', val: '+1000', icon: '✍️', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Precisão Geral', val: '+87%', icon: '🎯', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Horas de Estudo', val: MOCK_STATS.hoursStudied, icon: '⏱️', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Tópicos Concluídos', val: MOCK_STATS.topicsCompleted, icon: '📚', color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300 flex items-center justify-between group cursor-default">
              <div>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1 group-hover:text-brand-600 transition-colors">{stat.label}</p>
                <p className="text-3xl font-display font-extrabold text-slate-800 tracking-tight">{stat.val}</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${stat.bg} ${stat.color} transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm ring-4 ring-white`}>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Categories Section */}
        <div id="trilhas" className="scroll-mt-24">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 tracking-tight mb-2">Trilhas de Conhecimento</h2>
              <p className="text-slate-500 font-medium">Selecione sua área profissional para iniciar a jornada.</p>
            </div>
            <div className="h-px flex-1 bg-slate-200 ml-8 hidden md:block opacity-50"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => {
              // Verificar se usuário é admin
              const isAdmin = user?.role === 'admin' ||
                user?.email?.toLowerCase() === 'arautyarafat@gmail.com' ||
                user?.email?.toLowerCase() === 'admin@angolasaude.ao';

              // Categoria bloqueada: APENAS se estiver na lista de blockedCategories
              // O sistema de admin sobrescreve a propriedade 'disponivel' do código
              // Se o admin desbloqueou a trilha (removeu de blockedCategories), ela fica disponível
              const isBlockedByServer = blockedCategories.includes(cat.id);
              const isBlocked = isBlockedByServer && !isAdmin;

              return (
                <button
                  key={cat.id}
                  onClick={() => !isBlocked && onSelectCategory(cat)}
                  disabled={isBlocked}
                  className={`group relative h-full flex flex-col items-start p-8 rounded-[2rem] text-left transition-all duration-300 ${isBlocked
                    ? 'bg-slate-50/80 border border-slate-100 cursor-not-allowed opacity-70'
                    : 'bg-white hover:bg-slate-50/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 border border-slate-100'
                    }`}
                >
                  {/* Status Indicator */}
                  <div className="absolute top-8 right-8">
                    {isBlocked ? (
                      <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-full text-slate-400">
                        <Icon name="lock" size="sm" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-10 h-10 bg-slate-50 text-slate-300 rounded-full group-hover:bg-brand-600 group-hover:text-white transition-all duration-300 group-hover:rotate-[-45deg]">
                        <Icon name="arrow-right" size="sm" />
                      </div>
                    )}
                  </div>

                  {/* Icon Container */}
                  <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center text-3xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-md ${isBlocked ? 'bg-slate-200 text-slate-400 grayscale' : `${cat.color} text-white shadow-brand-500/10`
                    }`}>
                    {cat.icon}
                  </div>

                  {/* Content */}
                  <div className="w-full">
                    <h3 className={`text-xl font-display font-bold mb-3 tracking-tight ${isBlocked ? 'text-slate-500' : 'text-slate-900 group-hover:text-brand-700 transition-colors'}`}>
                      {cat.title}
                    </h3>
                    <p className={`text-sm font-medium leading-relaxed ${isBlocked ? 'text-slate-400' : 'text-slate-500'}`}>
                      Acesse materiais exclusivos, simulados e conteúdos preparados para a sua aprovação.
                    </p>
                  </div>

                  {/* Progress / Footer (Minimalist) */}
                  {!isBlocked && (
                    <div className="w-full mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-brand-600 transition-colors">
                      <span>Ver Conteúdo</span>
                      <span className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">➜</span>
                    </div>
                  )}

                  {/* Blocked/Unavailable message */}
                  {isBlocked && (
                    <div className="w-full mt-6 flex items-center gap-2 text-xs font-bold text-amber-600/80 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      Indisponível
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="mt-20 border-t border-slate-200 py-12 text-center">
        <p className="text-slate-400 text-sm">© 2026 Minsa Preparatório. Todos os direitos reservados.</p>
        <div className="flex justify-center gap-4 mt-4">
          <span className="text-slate-300">•</span>
          <button onClick={onEnterTerms} className="text-sm text-slate-500 hover:text-brand-600">Termos</button>
          <span className="text-slate-300">•</span>
          <button onClick={onEnterTerms} className="text-sm text-slate-500 hover:text-brand-600">Privacidade</button>
        </div>
      </footer >
    </div >
  );
};

export default Dashboard;