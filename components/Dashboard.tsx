import React, { useState, useEffect } from 'react';
import { CATEGORIES, MOCK_STATS, MOCK_TOPICS } from '../constants';
import { Category, Topic } from '../types';
import { Icon } from './icons';



interface DashboardProps {
  onSelectCategory: (category: Category) => void;
  onSelectTopic: (topic: Topic) => void;
  onEnterAdmin: () => void;
  onLogin: () => void;
  onEnterPricing: () => void;
  onEnterProfile: () => void;
  onEnterTerms: () => void;
  onEnterHowItWorks: () => void;
  onLogout: () => void;
  user?: any;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectCategory, onSelectTopic, onEnterAdmin, onLogin, onEnterPricing, onEnterProfile, onEnterTerms, onEnterHowItWorks, onLogout, user }) => {
  // Track if screen is large enough for chart (lg breakpoint = 1024px)
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [blockedCategories, setBlockedCategories] = useState<string[]>([]);
  const [featuredVideoId, setFeaturedVideoId] = useState<string>('LXb3EKWsInQ'); // Default video

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
        const res = await fetch('http://localhost:3001/blocking/categories');
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
        const res = await fetch('http://localhost:3001/settings');
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
      <header className="sticky top-0 w-full z-50 backdrop-blur-md bg-white/70 border-b border-white/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img
              src="/logo.png"
              alt="Minsa Preparatório Logo"
              className="w-12 h-12 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            />
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-slate-900 text-sm md:text-lg tracking-tight">Minsa Preparatório</span>
              <span className="text-[10px] md:text-xs font-semibold text-brand-600 tracking-wider uppercase">2026</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-full border border-slate-200/50">
            <button className="px-5 py-2 rounded-full text-sm font-semibold text-slate-900 bg-white shadow-sm ring-1 ring-slate-200 transition-all">Início</button>
            <button onClick={onEnterPricing} className="px-5 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-brand-600 hover:bg-white/50 transition-all">Preços</button>
          </nav>

          {/* Action Buttons */}
          {/* Action Buttons & Mobile Menu */}
          <div className="flex items-center gap-2 md:gap-4">
            {user && user.email === 'arautyarafat@gmail.com' && (
              <button
                onClick={onEnterAdmin}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors hidden lg:block"
              >
                Admin Panel
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2 md:gap-3 md:pl-4 md:border-l border-slate-200">
                <button
                  onClick={onEnterProfile}
                  className="group flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-brand-700 transition-colors"
                >
                  <div className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-slate-100 md:bg-gradient-to-tr md:from-brand-100 md:to-brand-50 flex items-center justify-center text-slate-700 md:text-brand-700 font-bold text-xs md:text-sm border border-slate-200 md:border-2 md:border-white md:ring-2 md:ring-brand-100 shadow-sm group-hover:scale-105 transition-transform">
                    {user.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden md:inline-block group-hover:underline decoration-2 underline-offset-4 decoration-brand-200">{user.email.split('@')[0]}</span>
                </button>

                <button
                  onClick={onLogout}
                  className="hidden md:block p-1.5 md:p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Sair"
                >
                  <Icon name="logout" size="md" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="group relative px-4 py-2 md:px-6 md:py-2.5 rounded-xl bg-slate-900 text-white text-xs md:text-sm font-bold overflow-hidden shadow-lg shadow-slate-900/20 hover:shadow-slate-900/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative">Acessar</span>
              </button>
            )}

            {/* Hamburger Button (Mobile) */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 active:bg-slate-100 transition-colors"
            >
              <Icon name="menu" size="md" />
            </button>
          </div>
        </div>


      </header>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[100] flex justify-end md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Drawer */}
          <div className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

            {/* Header Dark: Logo + Horizontal Nav */}
            <div className="bg-[#1A1F2C] flex flex-col shrink-0 pb-2">
              {/* Top Row: Logo + Close */}
              <div className="px-6 pt-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="Minsa Logo" className="w-8 h-8 object-contain brightness-0 invert opacity-90" />
                  <div>
                    <h2 className="text-xl font-display font-bold text-white leading-none">Minsa</h2>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none mt-0.5">Preparatório</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <Icon name="x" size="md" />
                </button>
              </div>

              {/* Horizontal Navigation Tabs */}
              <div className="flex items-center gap-6 px-6 mt-4 overflow-x-auto no-scrollbar scroll-smooth">
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="text-white text-xs font-bold uppercase tracking-widest hover:text-brand-400 transition-colors border-b-2 border-white pb-2"
                >
                  INÍCIO
                </button>
                <button
                  onClick={() => { setShowMobileMenu(false); onEnterPricing(); }}
                  className="text-white/60 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors border-b-2 border-transparent pb-2"
                >
                  PLANOS
                </button>
                <button
                  onClick={() => { setShowMobileMenu(false); onEnterHowItWorks(); }}
                  className="text-white/60 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors border-b-2 border-transparent pb-2 whitespace-nowrap"
                >
                  COMO FUNCIONA
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-white">
              {/* Divider / Title */}
              <div className="mb-6 flex items-center gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Trilhas de Estudo</span>
                <div className="h-px bg-slate-100 w-full"></div>
              </div>

              {/* Categories List */}
              <div className="flex flex-col gap-3 pb-6">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { onSelectCategory(cat); setShowMobileMenu(false); }}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center text-white text-xl shadow-lg shrink-0`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-slate-900 text-base">{cat.title}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{cat.totalQuestions} questões</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-slate-500 transition-colors">
                      <Icon name="chevron-right" size="sm" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sticky Footer */}
            {user && (
              <div className="p-6 bg-white border-t border-slate-50 z-10">
                <button
                  onClick={() => { onLogout(); setShowMobileMenu(false); }}
                  className="w-full py-4 rounded-2xl border border-red-100 bg-white text-red-500 font-bold flex items-center justify-center gap-3 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                >
                  <Icon name="logout" size="md" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
              Escolha sua área de atuação e tenha acesso a materiais exclusivos, simulados inteligentes e jogos clínicos para dominar o concurso público.
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
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${featuredVideoId}?autoplay=1&mute=1&controls=1&loop=1&playlist=${featuredVideoId}&rel=0&modestbranding=1&showinfo=0&cc_load_policy=0&iv_load_policy=3`}
                  title="Apresentação Minsa Preparatório"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                ></iframe>
                {/* Overlay for better integration (optional) */}
                <div className="absolute inset-0 ring-1 ring-black/5 rounded-2xl pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* Video Card - Mobile */}
          <div className="lg:hidden mt-10 relative">
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-4 border border-white/60 shadow-xl">
              <div className="mb-4 text-center">
                <h3 className="font-display font-bold text-slate-900 text-lg">Conheça a Plataforma</h3>
              </div>

              <div className="w-full relative pt-[56.25%] rounded-xl overflow-hidden shadow-lg">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${featuredVideoId}?autoplay=0&mute=0&controls=1&loop=1&playlist=${featuredVideoId}&rel=0&modestbranding=1&showinfo=0&cc_load_policy=0&iv_load_policy=3&playsinline=1`}
                  title="Apresentação Minsa Preparatório"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 relative z-20">

        {/* KPI Cards - Floating Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 -mt-10 mb-20">
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
              const isBlocked = blockedCategories.includes(cat.id);
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

                  {/* Blocked message */}
                  {/* Blocked message */}
                  {isBlocked && (
                    <div className="w-full mt-6 flex items-center gap-2 text-xs font-bold text-red-500/70 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
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