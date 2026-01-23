import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../constants';
import { Category } from '../types';
import { Icon } from './icons';
import { API_URL } from '../config/api';

export interface HeaderProps {
    user?: any;
    onLogin: () => void;
    onLogout: () => void;
    onEnterAdmin: () => void;
    onEnterPricing: () => void;
    onEnterProfile: () => void;
    onEnterHowItWorks: () => void;
    onSelectCategory: (category: Category) => void;
    onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    user,
    onLogin,
    onLogout,
    onEnterAdmin,
    onEnterPricing,
    onEnterProfile,
    onEnterHowItWorks,
    onSelectCategory,
    onGoHome
}) => {
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [blockedCategories, setBlockedCategories] = useState<string[]>([]);

    // Fetch blocked categories from server
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

    return (
        <>
            <header className="sticky top-0 w-full z-50 backdrop-blur-md bg-white/70 border-b border-white/50 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={onGoHome}>
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
                        <button onClick={onGoHome} className="px-5 py-2 rounded-full text-sm font-semibold text-slate-900 bg-white shadow-sm ring-1 ring-slate-200 transition-all">Início</button>
                        <button onClick={onEnterPricing} className="px-5 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-brand-600 hover:bg-white/50 transition-all">Preços</button>
                    </nav>

                    {/* Action Buttons */}
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
                                    onClick={() => { setShowMobileMenu(false); onGoHome(); }}
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
                                {user && user.email === 'arautyarafat@gmail.com' && (
                                    <button
                                        onClick={() => { setShowMobileMenu(false); onEnterAdmin(); }}
                                        className="text-amber-400 text-xs font-bold uppercase tracking-widest hover:text-amber-300 transition-colors border-b-2 border-amber-400/50 pb-2 whitespace-nowrap"
                                    >
                                        ADMIN
                                    </button>
                                )}
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
                                {CATEGORIES.map(cat => {
                                    // Verificar se usuário é admin
                                    const isAdmin = user?.role === 'admin' ||
                                        user?.email?.toLowerCase() === 'arautyarafat@gmail.com' ||
                                        user?.email?.toLowerCase() === 'admin@angolasaude.ao';

                                    // Categoria bloqueada: APENAS se estiver na lista de blockedCategories
                                    // O sistema de admin sobrescreve a propriedade 'disponivel' do código
                                    const isBlocked = blockedCategories.includes(cat.id) && !isAdmin;

                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                if (!isBlocked) {
                                                    onSelectCategory(cat);
                                                    setShowMobileMenu(false);
                                                }
                                            }}
                                            disabled={isBlocked}
                                            className={`flex items-center gap-4 p-3 rounded-2xl border shadow-sm transition-all group ${isBlocked
                                                ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                                                : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shrink-0 ${isBlocked ? 'bg-slate-300 grayscale' : cat.color
                                                }`}>
                                                {isBlocked ? '🔒' : cat.icon}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className={`font-bold text-base ${isBlocked ? 'text-slate-500' : 'text-slate-900'}`}>
                                                    {cat.title}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400">
                                                    {isBlocked ? 'Indisponível' : `${cat.totalQuestions} questões`}
                                                </div>
                                            </div>
                                            {!isBlocked && (
                                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-slate-500 transition-colors">
                                                    <Icon name="chevron-right" size="sm" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
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
        </>
    );
};
