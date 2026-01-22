import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { authService, API_URL } from '../services/auth';

interface CategoryHubProps {
   category: Category;
   categories: Category[];
   onSelectCategory: (category: Category) => void;
   onEnterGame: () => void;
   onEnterFlashcards: () => void;
   onEnterQuiz: () => void;
   onEnterDecipher: () => void;
   onEnterConnectionGame: () => void;
   onEnterLesson: () => void;
   onBack: () => void;
   onEnterPricing: () => void;
}

const CategoryHub: React.FC<CategoryHubProps> = ({
   category,
   categories,
   onSelectCategory,
   onEnterGame,
   onEnterFlashcards,
   onEnterQuiz,
   onEnterDecipher,
   onEnterConnectionGame,
   onEnterLesson,
   onBack,
   onEnterPricing
}) => {
   const [showUpgradeModal, setShowUpgradeModal] = useState(false);
   const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
   const [showMobileMenu, setShowMobileMenu] = useState(false);
   const [isBlocked, setIsBlocked] = useState(false);
   const [blockedCategories, setBlockedCategories] = useState<string[]>([]);

   // Initialize from localStorage to prevent flash of free plan
   const initialUser = authService.getUser();
   const initialPlan = initialUser?.plan || 'free';
   const initialHasPremium = ['lite', 'pro', 'premier'].includes(initialPlan);

   const [hasPremium, setHasPremium] = useState(initialHasPremium);
   const [userPlan, setUserPlan] = useState<string>(initialPlan);
   const [isCheckingPlan, setIsCheckingPlan] = useState(true);

   // Check if category is blocked
   useEffect(() => {
      const checkBlocked = async () => {
         try {
            const res = await fetch(`${API_URL}/blocking/categories`);
            const data = await res.json();
            const blocked = data.blockedCategories || [];
            setBlockedCategories(blocked);
            setIsBlocked(blocked.includes(category.id));
         } catch (e) {
            console.error('Failed to check blocked status:', e);
         }
      };
      checkBlocked();
   }, [category.id]);

   // Fetch fresh plan data on component mount (to catch admin updates)
   useEffect(() => {
      const checkPlan = async () => {
         setIsCheckingPlan(true);
         try {
            const updatedUser = await authService.refreshUserPlan();
            const plan = updatedUser?.plan || 'free';
            const isPremium = ['lite', 'pro', 'premier'].includes(plan);
            setHasPremium(isPremium);
            setUserPlan(plan);
         } catch (error) {
            console.error('Error checking plan:', error);
            // Keep existing state from localStorage (no changes on error)
         } finally {
            setIsCheckingPlan(false);
         }
      };
      checkPlan();
   }, []);

   const handlePremiumAction = (action: () => void) => {
      if (isBlocked) {
         return; // Don't allow any action if blocked
      }
      if (hasPremium) {
         action();
      } else {
         setShowUpgradeModal(true);
      }
   };

   // If category is blocked, show unavailable message
   if (isBlocked) {
      return (
         <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
               <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
               </div>
               <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
                  Trilha Indisponível
               </h2>
               <p className="text-slate-500 mb-6 leading-relaxed">
                  A trilha <strong>{category.title}</strong> está temporariamente indisponível. Por favor, selecione outra trilha ou tente novamente mais tarde.
               </p>
               <button
                  onClick={onBack}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors"
               >
                  Voltar ao Início
               </button>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-slate-50 font-sans">
         {/* Dynamic Background based on category color */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute -top-[20%] -right-[10%] w-[700px] h-[700px] ${category.color.replace('bg-', 'text-')} opacity-5 rounded-full blur-3xl bg-current`}></div>
         </div>

         {/* Upgrade Modal */}
         {showUpgradeModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
               <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                  {/* Decorative gradient */}
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"></div>

                  <div className="text-center">
                     <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🔒</span>
                     </div>
                     <h3 className="text-2xl font-display font-bold text-slate-900 mb-3">
                        Conteúdo Premium
                     </h3>
                     <p className="text-slate-500 mb-6 leading-relaxed">
                        Este recurso está disponível apenas para assinantes dos planos <span className="font-bold text-brand-600">Lite</span>, <span className="font-bold text-brand-600">Pro</span> ou <span className="font-bold text-brand-600">Premier</span>.
                     </p>
                     <p className="text-sm text-slate-400 mb-8">
                        Faça upgrade para ter acesso a Aulas Digitais, Questionários, Flashcards, Jogos Clínicos e muito mais!
                     </p>

                     <div className="flex flex-col gap-3">
                        <button
                           onClick={() => {
                              setShowUpgradeModal(false);
                              onEnterPricing();
                           }}
                           className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:shadow-brand-500/25 hover:-translate-y-0.5 transition-all"
                        >
                           Ver Planos e Preços
                        </button>
                        <button
                           onClick={() => setShowUpgradeModal(false)}
                           className="w-full bg-slate-100 text-slate-600 font-bold py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                           Voltar
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">

            {/* Navigation */}
            {/* Mobile Header Moderno */}
            <div className="flex items-center justify-between mb-8 md:mb-12">
               <button
                  onClick={onBack}
                  className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
               >
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-slate-400 transition-all shadow-sm">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  </div>
                  <span className="hidden md:inline font-bold">Voltar ao Início</span>
                  <span className="md:hidden font-bold text-slate-700">Voltar</span>
               </button>

               <div className="flex items-center gap-3">
                  {/* Category Switcher - Minimal */}
                  <div className="relative">
                     <button
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                     >
                        <span className="text-xl">{category.icon}</span>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                     </button>

                     {/* Dropdown Content */}
                     {showCategoryDropdown && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-[100]">
                           <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Selecionar Trilha
                           </div>
                           <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
                              {categories && categories.length > 0 ? (
                                 categories.map((cat) => (
                                    <button
                                       key={cat.id}
                                       onClick={() => {
                                          onSelectCategory(cat);
                                          setShowCategoryDropdown(false);
                                       }}
                                       className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors text-left ${category.id === cat.id ? 'bg-slate-50 ring-1 ring-slate-200' : 'hover:bg-slate-50'}`}
                                    >
                                       <div className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center text-white text-sm shadow-sm shrink-0`}>
                                          {cat.icon}
                                       </div>
                                       <div>
                                          <div className={`font-bold ${category.id === cat.id ? 'text-slate-900' : 'text-slate-600'}`}>
                                             {cat.title}
                                          </div>
                                          <div className="text-xs text-slate-400">
                                             {cat.totalQuestions} questões
                                          </div>
                                       </div>
                                       {category.id === cat.id && (
                                          <svg className="w-4 h-4 text-brand-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                       )}
                                    </button>
                                 ))
                              ) : (
                                 <div className="p-3 text-sm text-slate-500 text-center">
                                    Nenhuma outra trilha disponível
                                 </div>
                              )}
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Mobile Menu Side Drawer */}
            {showMobileMenu && (
               <div className="fixed inset-0 z-[110] flex justify-end">
                  <div
                     className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
                     onClick={() => setShowMobileMenu(false)}
                  ></div>
                  <div className="relative w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                     <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-slate-900">Trilhas</h2>
                        <button
                           onClick={() => setShowMobileMenu(false)}
                           className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                        >
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                     </div>
                     <div className="flex flex-col gap-3">
                        {categories && categories.map((cat) => (
                           <button
                              key={cat.id}
                              onClick={() => {
                                 onSelectCategory(cat);
                                 setShowMobileMenu(false);
                              }}
                              className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all border ${category.id === cat.id ? 'bg-brand-50 border-brand-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                           >
                              <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center text-white text-lg`}>
                                 {cat.icon}
                              </div>
                              <div className="text-left flex-1 font-bold text-slate-700">
                                 {cat.title}
                              </div>
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {/* Hero Section - Image Match */}
            <div className="flex flex-row items-center md:items-start gap-6 mb-12 animate-fade-in px-2">
               <div className={`w-24 h-24 md:w-32 md:h-32 rounded-[2rem] ${category.color} flex items-center justify-center text-5xl md:text-6xl shadow-2xl shadow-brand-900/10 rotate-[-3deg] shrink-0`}>
                  {category.icon}
               </div>

               <div className="flex-1">
                  <h1 className="text-3xl md:text-5xl font-display font-bold text-slate-900 leading-[1.1] mb-2">
                     {category.title.replace('Lic.', '').replace('Téc.', 'Téc.\n')}
                  </h1>
                  <p className="text-slate-500 font-medium text-sm md:text-lg leading-relaxed mb-4 max-w-lg">
                     {category.description}
                  </p>

                  <div className="flex flex-wrap gap-2 md:gap-3">
                     <span className="bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 text-[10px] md:text-xs font-bold text-emerald-600 uppercase tracking-wider shadow-sm">
                        IA Ativa
                     </span>
                     {!hasPremium && (
                        <span className="bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 text-[10px] md:text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                           Plano Gratuito
                        </span>
                     )}
                     {hasPremium && (
                        <span className="bg-brand-50 px-3 py-1.5 rounded-full border border-brand-100 text-[10px] md:text-xs font-bold text-brand-600 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                           {userPlan.toUpperCase()}
                        </span>
                     )}
                  </div>
               </div>
            </div>

            {/* Action Section - Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">

               {/* Left Column: Aula + Game */}
               <div className="lg:col-span-2 flex flex-col gap-8">

                  {/* 1. Aulas Digitais - Modern Card Style */}
                  <div
                     onClick={() => handlePremiumAction(onEnterLesson)}
                     className={`flex-1 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0088CC] to-[#006699] p-8 md:p-10 cursor-pointer shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-sky-900/30 hover:-translate-y-1 min-h-[380px] flex flex-col justify-between group ${!hasPremium ? 'ring-2 ring-amber-400/50' : ''}`}
                  >
                     {/* Background Elements */}
                     <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none"></div>
                     <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-[60px] -ml-10 -mb-10 pointer-events-none"></div>

                     {/* Top Badges */}
                     <div className="relative z-10 flex justify-between items-start mb-6 gap-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider text-white border border-white/20 backdrop-blur-sm shadow-sm">
                           <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse"></span>
                           Novo Sistema
                        </div>

                        {!hasPremium ? (
                           <div className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 animate-bounce-subtle">
                              <span>🔒</span> Premium
                           </div>
                        ) : (
                           <div className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold">
                              Acesso Liberado
                           </div>
                        )}
                     </div>

                     {/* Main Content */}
                     <div className="relative z-10 flex-1 flex flex-col justify-center">
                        <h3 className="text-4xl md:text-[3.5rem] font-display font-bold text-white mb-6 leading-[0.95] tracking-tight">
                           Aulas Digitais <br /> Interactivas
                        </h3>
                        <p className="text-white/90 text-lg md:text-xl leading-relaxed max-w-sm font-medium">
                           Aprenda com slides inteligentes, áudio explicativo e aulas conversacionais.
                           Sistema completo com quiz integrado.
                        </p>
                     </div>

                     {/* Bottom Action */}
                     <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                        <span className="text-white/70 text-sm font-bold tracking-wide uppercase">Conteúdo Completo</span>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#0088CC] transition-all transform group-hover:scale-110 shadow-lg border border-white/10">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </div>
                     </div>
                  </div>

                  {/* 3. Plantão de Emergência - Bottom Left (PREMIUM) */}
                  <div
                     onClick={() => handlePremiumAction(onEnterGame)}
                     className={`group relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 cursor-pointer shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/20 hover:-translate-y-1 ${!hasPremium ? 'ring-2 ring-amber-400/50' : ''}`}
                  >
                     <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-600/20 opacity-40"></div>
                     <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-red-600/20 blur-3xl animate-pulse"></div>

                     {!hasPremium && (
                        <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg z-10">
                           <span>🔒</span> Premium
                        </div>
                     )}

                     <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                           <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 border border-red-500/20 mb-3">
                              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                              Simulação Realista
                           </div>
                           <h3 className="text-2xl font-display font-bold text-white mb-2">Plantão de Emergência</h3>
                           <p className="text-slate-400 leading-relaxed max-w-lg">
                              Simule casos clínicos em tempo real e tome decisões sob pressão.
                           </p>
                        </div>
                        <div className="flex-shrink-0">
                           <span className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-3 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                              <span className="text-xl">🎮</span> Jogar
                           </span>
                        </div>
                     </div>
                  </div>

               </div>

               {/* Right Column: Tools Stack */}
               <div className="flex flex-col gap-6">

                  {/* Flashcards Card (PREMIUM) */}
                  <div
                     onClick={() => handlePremiumAction(onEnterFlashcards)}
                     className={`flex-1 bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm cursor-pointer group hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all min-h-[140px] flex flex-col justify-center relative ${!hasPremium ? 'ring-2 ring-amber-400/50' : ''}`}
                  >
                     {!hasPremium && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                           <span>🔒</span>
                        </div>
                     )}
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                           🗂️
                        </div>
                        <div>
                           <h3 className="text-xl font-bold font-display text-slate-900">Flashcards</h3>
                           <p className="text-sm text-slate-500 mt-1">Revise termos técnicos.</p>
                        </div>
                     </div>
                  </div>

                  {/* Quiz Card (PREMIUM) */}
                  <div
                     onClick={() => handlePremiumAction(onEnterQuiz)}
                     className={`flex-1 bg-[#1A1D21] rounded-[2rem] p-6 border border-slate-700 shadow-sm cursor-pointer group hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 transition-all relative overflow-hidden min-h-[140px] flex flex-col justify-center ${!hasPremium ? 'ring-2 ring-amber-400/50' : ''}`}
                  >
                     {!hasPremium && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 z-10">
                           <span>🔒</span>
                        </div>
                     )}
                     <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center text-2xl group-hover:bg-white group-hover:text-[#1A1D21] transition-colors shrink-0">
                           📝
                        </div>
                        <div>
                           <h3 className="text-xl font-bold font-display text-white">Questionário</h3>
                           <p className="text-sm text-slate-400 mt-1">Simulado estilo concurso.</p>
                        </div>
                     </div>
                  </div>

                  {/* Decipher Game Card (PREMIUM) */}
                  <div
                     onClick={() => handlePremiumAction(onEnterDecipher)}
                     className={`flex-1 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-[2rem] p-6 border border-transparent shadow-sm cursor-pointer group hover:shadow-xl hover:shadow-fuchsia-500/20 hover:-translate-y-1 transition-all relative overflow-hidden min-h-[140px] flex flex-col justify-center ${!hasPremium ? 'ring-2 ring-amber-400/50' : ''}`}
                  >
                     {!hasPremium && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 z-10">
                           <span>🔒</span>
                        </div>
                     )}
                     <div className="absolute top-0 right-0 p-4 opacity-20">
                        <span className="text-6xl">🧩</span>
                     </div>
                     <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center text-2xl group-hover:bg-white group-hover:text-fuchsia-600 transition-colors backdrop-blur-sm shrink-0">
                           🔍
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold font-display text-white">Decifre</h3>
                              <span className="text-[10px] font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">Novo</span>
                           </div>
                           <p className="text-sm text-white/80">Adivinhe palavras.</p>
                        </div>
                     </div>
                  </div>

                  {/* Connection Game Card (PREMIUM) */}
                  <div
                     onClick={() => handlePremiumAction(onEnterConnectionGame)}
                     className={`flex-1 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[2rem] p-6 border border-transparent shadow-sm cursor-pointer group hover:shadow-xl hover:shadow-cyan-500/20 hover:-translate-y-1 transition-all relative overflow-hidden min-h-[140px] flex flex-col justify-center ${!hasPremium ? 'ring-2 ring-amber-400/50' : ''}`}
                  >
                     {!hasPremium && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 z-10">
                           <span>🔒</span>
                        </div>
                     )}
                     <div className="absolute top-0 right-0 p-4 opacity-20">
                        <span className="text-6xl">🔗</span>
                     </div>
                     <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center text-2xl group-hover:bg-white group-hover:text-blue-600 transition-colors backdrop-blur-sm shrink-0">
                           🔄
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold font-display text-white">Ligação</h3>
                              <span className="text-[10px] font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">Novo</span>
                           </div>
                           <p className="text-sm text-white/80">Conecte os conceitos.</p>
                        </div>
                     </div>
                  </div>

               </div>
            </div>

         </div>
      </div>
   );
};

export default CategoryHub;