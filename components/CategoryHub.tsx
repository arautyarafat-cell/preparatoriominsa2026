import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { authService } from '../services/auth';

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
            const res = await fetch('http://localhost:3001/blocking/categories');
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
            {/* Navigation & Category Switch */}
            <div className="flex items-center justify-between mb-8">
               <button
                  onClick={onBack}
                  className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
               >
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-slate-400 transition-all">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  </div>
                  <span className="text-sm font-bold">Voltar ao Início</span>
               </button>

               {/* Category Dropdown & Hamburger */}
               <div className="flex items-center gap-3">
                  <div className="relative">
                     <button
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                     >
                        <span>{category.icon}</span>
                        <span className="hidden sm:inline">{category.title}</span>
                        <svg
                           className={`w-4 h-4 text-slate-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`}
                           fill="none"
                           stroke="currentColor"
                           viewBox="0 0 24 24"
                        >
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                     </button>

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

                  {/* Hamburger Button */}
                  <button
                     onClick={() => setShowMobileMenu(true)}
                     className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                     title="Menu de Trilhas"
                     aria-label="Abrir Menu"
                  >
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                     </svg>
                  </button>
               </div>


            </div>

            {/* Mobile Menu Side Drawer */}
            {showMobileMenu && (
               <div className="fixed inset-0 z-[110] flex justify-end">
                  {/* Backdrop */}
                  <div
                     className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
                     onClick={() => setShowMobileMenu(false)}
                  ></div>

                  {/* Drawer */}
                  <div className="relative w-full max-w-sm bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                     <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-display font-bold text-slate-900">Trilhas de Conhecimento</h2>
                        <button
                           onClick={() => setShowMobileMenu(false)}
                           className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
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
                              className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all border ${category.id === cat.id ? 'bg-brand-50 border-brand-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'}`}
                           >
                              <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center text-white text-xl shadow-md shrink-0`}>
                                 {cat.icon}
                              </div>
                              <div className="text-left flex-1">
                                 <div className={`font-bold text-lg ${category.id === cat.id ? 'text-brand-900' : 'text-slate-900'}`}>
                                    {cat.title}
                                 </div>
                                 <div className={`text-sm ${category.id === cat.id ? 'text-brand-600' : 'text-slate-500'}`}>
                                    {cat.totalQuestions} questões
                                 </div>
                              </div>
                              {category.id === cat.id && (
                                 <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                 </div>
                              )}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            )}


            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 animate-fade-in">
               <div className="flex items-center gap-6">
                  <div className={`w-24 h-24 rounded-3xl ${category.color} flex items-center justify-center text-5xl shadow-2xl shadow-brand-900/10`}>
                     {category.icon}
                  </div>
                  <div>
                     <h1 className="text-4xl font-display font-bold text-slate-900">{category.title}</h1>
                     <p className="text-slate-500 text-lg">{category.description}</p>
                     <div className="flex gap-3 mt-3">
                        <span className="bg-green-50 px-3 py-1 rounded-full border border-green-100 text-xs font-bold text-green-600 uppercase tracking-wider">
                           IA Ativa
                        </span>
                        {!hasPremium && (
                           <span className="bg-amber-50 px-3 py-1 rounded-full border border-amber-100 text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                              {isCheckingPlan && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>}
                              Plano Gratuito
                           </span>
                        )}
                        {hasPremium && (
                           <span className="bg-brand-50 px-3 py-1 rounded-full border border-brand-100 text-xs font-bold text-brand-600 uppercase tracking-wider flex items-center gap-1.5">
                              {isCheckingPlan && <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>}
                              {userPlan.toUpperCase()}
                           </span>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Action Section - Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">

               {/* Left Column: Aula + Game */}
               <div className="lg:col-span-2 flex flex-col gap-8">

                  {/* 1. Aulas Digitais - Top Left (PREMIUM) */}
                  <div
                     onClick={() => handlePremiumAction(onEnterLesson)}
                     className={`flex-1 group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 to-brand-800 p-10 cursor-pointer shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-brand-900/30 hover:-translate-y-1 min-h-[320px] flex flex-col justify-between ${!hasPremium ? 'ring-2 ring-amber-400/50' : ''}`}
                  >
                     <div className="absolute inset-0 bg-gradient-to-r from-brand-400/10 to-cyan-400/10 opacity-40"></div>
                     <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-pulse"></div>
                     <div className="absolute -left-10 -bottom-10 h-60 w-60 rounded-full bg-cyan-400/20 blur-3xl"></div>

                     {!hasPremium && (
                        <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                           <span>🔒</span> Premium
                        </div>
                     )}

                     <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white border border-white/20 mb-6 backdrop-blur-sm">
                           <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                           Novo Sistema
                        </div>
                        <h3 className="text-4xl font-display font-bold text-white mb-4">
                           Aulas Digitais Interactivas
                        </h3>
                        <p className="text-white/80 max-w-xl leading-relaxed text-lg mb-8">
                           Aprenda com slides inteligentes, audio explicativo e aulas conversacionais. Sistema completo com quiz integrado.
                        </p>
                     </div>
                     <div className="relative z-10 flex items-center justify-between mt-auto">
                        <span className="text-white/60 text-sm font-medium">
                           Slides + Audio + Quiz
                        </span>
                        <span className="bg-white text-brand-700 px-8 py-4 rounded-2xl font-bold flex items-center gap-3 group-hover:bg-brand-50 transition-colors shadow-lg text-lg">
                           <span className="text-2xl">📚</span> Iniciar Aula
                        </span>
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