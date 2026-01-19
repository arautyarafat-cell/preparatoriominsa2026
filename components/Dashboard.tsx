import React, { useState, useEffect } from 'react';
import { CATEGORIES, MOCK_STATS, MOCK_TOPICS } from '../constants';
import { Category, Topic } from '../types';

import { BarChart, Bar, XAxis, Tooltip, Cell, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

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
              alt="Angola Saúde Prep Logo"
              className="w-12 h-12 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            />
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-slate-900 text-lg tracking-tight">Angola Saúde</span>
              <span className="text-xs font-semibold text-brand-600 tracking-wider uppercase">Prep <span className="text-slate-400">2026</span></span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-full border border-slate-200/50">
            <button className="px-5 py-2 rounded-full text-sm font-semibold text-slate-900 bg-white shadow-sm ring-1 ring-slate-200 transition-all">Início</button>
            <button onClick={onEnterPricing} className="px-5 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-brand-600 hover:bg-white/50 transition-all">Preços</button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {user && user.email === 'arautyarafat@gmail.com' && (
              <button
                onClick={onEnterAdmin}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors hidden lg:block"
              >
                Admin Panel
              </button>
            )}
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <button
                  onClick={onEnterProfile}
                  className="group flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-brand-700 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-100 to-brand-50 flex items-center justify-center text-brand-700 font-bold text-sm border-2 border-white ring-2 ring-brand-100 shadow-sm group-hover:scale-105 transition-transform">
                    {user.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden md:inline-block group-hover:underline decoration-2 underline-offset-4 decoration-brand-200">{user.email.split('@')[0]}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Sair"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" /></svg>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="group relative px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold overflow-hidden shadow-lg shadow-slate-900/20 hover:shadow-slate-900/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative">Acessar Plataforma</span>
              </button>
            )}
          </div>

          {/* Hamburger Button (Mobile) */}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="md:hidden p-2 bg-white/50 backdrop-blur-md rounded-xl text-slate-700 active:bg-slate-100 transition-colors ml-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>


      </header>

      {/* Mobile Menu Drawer - Modern Redesign */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[100] flex justify-end md:hidden">
          {/* Blur Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          ></div>

          {/* Drawer Content */}
          <div className="relative w-[85%] max-w-sm bg-white h-full shadow-[0_0_50px_rgba(0,0,0,0.2)] flex flex-col transform transition-transform duration-300">

            {/* Header with Gradient */}
            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 rounded-full bg-white blur-2xl"></div>
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                  <span className="font-display font-bold text-2xl tracking-tight">Menu</span>
                  <span className="text-slate-400 text-xs font-medium uppercase tracking-wider mt-1">Navegação</span>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all backdrop-blur-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

              {/* Main Links */}
              <div className="flex flex-col gap-2">
                <button onClick={() => { setShowMobileMenu(false); }} className="flex items-center gap-4 p-4 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 hover:text-brand-600 transition-all group border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  </div>
                  <span className="text-lg">Início</span>
                  <svg className="w-5 h-5 ml-auto text-slate-300 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>

                <button onClick={() => { setShowMobileMenu(false); onEnterPricing(); }} className="flex items-center gap-4 p-4 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 hover:text-brand-600 transition-all group border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <span className="text-lg">Planos e Preços</span>
                  <svg className="w-5 h-5 ml-auto text-slate-300 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>

                <button onClick={() => { setShowMobileMenu(false); onEnterHowItWorks(); }} className="flex items-center gap-4 p-4 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 hover:text-brand-600 transition-all group border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <span className="text-lg">Como Funciona</span>
                  <svg className="w-5 h-5 ml-auto text-slate-300 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              {/* Categories Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-start">
                  <span className="bg-white pr-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Trilhas de Estudo</span>
                </div>
              </div>

              {/* Categories List */}
              <div className="grid grid-cols-1 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setShowMobileMenu(false); onSelectCategory(cat); }}
                    className="group flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-100 hover:border-brand-200 hover:shadow-md hover:shadow-brand-500/5 transition-all"
                  >
                    <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center text-white text-xl shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform`}>
                      {cat.icon}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-slate-800 text-sm group-hover:text-brand-700 transition-colors">{cat.title}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{cat.totalQuestions} questões</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer / User */}
            {user && (
              <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto">
                <button
                  onClick={() => { setShowMobileMenu(false); onLogout(); }}
                  className="w-full p-4 bg-white border border-slate-200 text-red-500 font-bold rounded-2xl hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" /></svg>
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
          <div className="text-center lg:text-left space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-brand-100/50 backdrop-blur text-brand-700 text-xs font-bold uppercase tracking-widest shadow-sm hover:shadow-md transition-shadow cursor-default">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              Preparatório Oficial 2026
            </div>

            <h1 className="text-5xl lg:text-7xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Aprovação garantida <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-cyan-500 to-teal-500 animate-gradient-x">
                na palma da mão.
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
              Escolha sua área de atuação e tenha acesso a materiais exclusivos, simulados inteligentes e jogos clínicos para dominar o concurso público.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => document.getElementById('trilhas')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-1 transition-all duration-300"
              >
                Começar Agora
              </button>
              <button
                onClick={onEnterHowItWorks}
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 hover:text-brand-600 rounded-2xl font-bold border border-slate-200 shadow-sm hover:border-brand-200 hover:bg-brand-50/50 transition-all duration-300"
              >
                Saiba Mais
              </button>
            </div>

            <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Material Atualizado
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                IA Integrada
              </span>
            </div>
          </div>

          {/* Right Visual - Stats - Only render chart on large screens */}
          {isLargeScreen && (
            <div className="relative group">
              {/* Floating Elements Background */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-200/50 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-200/50 rounded-full blur-2xl animate-pulse animation-delay-1000"></div>

              <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-2xl transition-all duration-500 group-hover:shadow-3xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-display font-bold text-slate-900 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">📊</span>
                    Estatísticas da Plataforma
                  </h3>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Ao Vivo</span>
                </div>

                <div className="w-full flex justify-center h-[320px]">
                  <BarChart
                    width={450}
                    height={300}
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: '#475569', fontSize: 12, fontWeight: 600, fontFamily: 'Plus Jakarta Sans' }}
                      width={80}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.4)' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', fontFamily: 'Inter', background: 'rgba(255,255,255,0.95)' }}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </div>
              </div>
            </div>
          )}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CATEGORIES.map((cat) => {
              const isBlocked = blockedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => !isBlocked && onSelectCategory(cat)}
                  disabled={isBlocked}
                  className={`group relative bg-white rounded-[2.5rem] p-1 text-left shadow-lg transition-all duration-500 overflow-hidden ${isBlocked
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:shadow-2xl hover:shadow-brand-900/10 hover:-translate-y-2'
                    }`}
                >
                  {/* Blocked Overlay */}
                  {isBlocked && (
                    <div className="absolute inset-0 z-20 bg-slate-900/10 backdrop-blur-[1px] rounded-[2.5rem] flex items-end justify-center pb-24">
                      <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Indisponível no momento
                      </div>
                    </div>
                  )}

                  {/* Border Gradient Container */}
                  <div className={`absolute inset-0 rounded-[2.5rem] ${isBlocked ? 'bg-slate-200' : 'bg-gradient-to-br from-slate-100 to-white'}`}></div>

                  {/* Card Content */}
                  <div className={`relative h-full bg-white rounded-[2.3rem] p-8 overflow-hidden ${isBlocked ? 'grayscale' : ''}`}>
                    {/* Hover Gradient Blob */}
                    <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${cat.color} opacity-0 ${!isBlocked && 'group-hover:opacity-1'} rounded-full blur-3xl transition-opacity duration-500`}></div>

                    <div className="flex justify-between items-start mb-10">
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-xl ${cat.color} text-white ${!isBlocked && 'group-hover:scale-110 group-hover:rotate-3'} transition-transform duration-300 ring-4 ring-white`}>
                        {cat.icon}
                      </div>
                      <div className={`rounded-full p-2 ${isBlocked ? 'bg-red-50' : 'bg-slate-50 group-hover:bg-brand-50'} transition-colors`}>
                        {isBlocked ? (
                          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-slate-300 group-hover:text-brand-500 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        )}
                      </div>
                    </div>

                    <h3 className={`text-2xl font-bold font-display mb-3 transition-colors ${isBlocked ? 'text-slate-400' : 'text-slate-900 group-hover:text-brand-700'}`}>{cat.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-6 h-10 line-clamp-2">{cat.description}</p>

                    <div className="flex flex-wrap gap-2 mt-auto">
                      <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors ${isBlocked ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600'}`}>📚 Material</span>
                      <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors ${isBlocked ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600'}`}>🧪 Quiz</span>
                      <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors ${isBlocked ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600'}`}>🎮 Jogo MedSim</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

      </main>

      {/* Simple Footer */}
      <footer className="mt-20 border-t border-slate-200 py-12 text-center">
        <p className="text-slate-400 text-sm">© 2026 Angola Saúde Prep. Todos os direitos reservados.</p>
        <div className="flex justify-center gap-4 mt-4">
          <span className="text-slate-300">•</span>
          <button onClick={onEnterTerms} className="text-sm text-slate-500 hover:text-brand-600">Termos</button>
          <span className="text-slate-300">•</span>
          <button onClick={onEnterTerms} className="text-sm text-slate-500 hover:text-brand-600">Privacidade</button>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;