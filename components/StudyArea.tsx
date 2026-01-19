import React, { useState, useEffect, useRef } from 'react';
import { Topic, Category, GeneratedQuestion, ChatMessage } from '../types';
import { generateSummary, generateQuestions, createTutorChat } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface StudyAreaProps {
   category: Category;
   topic: Topic;
   onBack: () => void;
}

enum Tab {
   CONTENT = 'CONTENT',
   QUIZ = 'QUIZ',
}

const StudyArea: React.FC<StudyAreaProps> = ({ category, topic, onBack }) => {
   const [activeTab, setActiveTab] = useState<Tab>(Tab.CONTENT);
   const [summaryLevel, setSummaryLevel] = useState<'ultra' | 'medium' | 'detailed'>('medium');
   const [summaries, setSummaries] = useState<{ ultra: string; medium: string; detailed: string } | null>(null);
   const [isLoadingSummary, setIsLoadingSummary] = useState(false);

   // Quiz State
   const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
   const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
   const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
   const [showQuizResults, setShowQuizResults] = useState(false);

   // Chat State
   const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
   const [chatInput, setChatInput] = useState('');
   const [isChatLoading, setIsChatLoading] = useState(false);
   const chatSessionRef = useRef<{ sendMessage: (opts: { message: string }) => Promise<{ text: string }> } | null>(null);
   const messagesEndRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const loadAI = async () => {
         setIsLoadingSummary(true);
         try {
            // const sum = await generateSummary(topic.title, category.title, topic.content);
            // setSummaries(sum);

            chatSessionRef.current = createTutorChat(category.title, topic.title, topic.content);
            setChatMessages([{
               id: 'welcome',
               role: 'model',
               text: `Olá! Sou seu tutor inteligente de **${category.title}**. \n\nEstou analisando o tópico **${topic.title}**. Como posso ajudar?`,
               timestamp: Date.now()
            }]);

         } catch (err) {
            console.error("AI Error", err);
         } finally {
            setIsLoadingSummary(false);
         }
      };

      if (!summaries) {
         loadAI();
      }
      return () => { chatSessionRef.current = null; }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [topic.id]);

   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [chatMessages, activeTab]);

   const handleGenerateQuiz = async () => {
      if (questions.length > 0) return;
      setIsLoadingQuiz(true);
      try {
         const qs = await generateQuestions(topic.title, category.title, topic.content, category.id);
         setQuestions(qs);
      } catch (e) { console.error(e); } finally { setIsLoadingQuiz(false); }
   };

   const handleSendMessage = async () => {
      if (!chatInput.trim() || !chatSessionRef.current) return;

      const userMsg: ChatMessage = {
         id: Date.now().toString(),
         role: 'user',
         text: chatInput,
         timestamp: Date.now()
      };

      setChatMessages(prev => [...prev, userMsg]);
      setChatInput('');
      setIsChatLoading(true);

      try {
         const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
         const modelMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: result.text || "Desculpe, não consegui processar.",
            timestamp: Date.now()
         };
         setChatMessages(prev => [...prev, modelMsg]);
      } catch (err) { console.error(err); } finally { setIsChatLoading(false); }
   };

   return (
      <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
         {/* Premium Header */}
         <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 z-50 sticky top-0">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <button
                     onClick={onBack}
                     className="group w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
                     title="Voltar ao Dashboard"
                  >
                     <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  </button>
                  <div>
                     <h1 className="text-xl font-display font-bold text-slate-900 truncate max-w-xs sm:max-w-md tracking-tight">{topic.title}</h1>
                     <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{category.title}</p>
                     </div>
                  </div>
               </div>

               <nav className="hidden sm:flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
                  {[
                     { id: Tab.CONTENT, label: 'Material', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
                     { id: Tab.QUIZ, label: 'Simulado', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                  ].map((item) => (
                     <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === item.id
                           ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5 scale-100'
                           : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 scale-95 opacity-80 hover:opacity-100 hover:scale-100'
                           }`}
                     >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                        <span>{item.label}</span>
                     </button>
                  ))}
               </nav>
            </div>
         </header>

         <main className="flex-1 overflow-hidden relative">

            {/* Content Tab */}
            {activeTab === Tab.CONTENT && (
               <div className="h-full max-w-[1800px] mx-auto flex flex-col lg:flex-row gap-8 p-6 lg:p-8">
                  <div className="flex-1 bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col relative">
                     <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        <div className="prose prose-lg prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-a:text-brand-600 prose-strong:text-slate-900 prose-p:text-slate-600 prose-p:leading-8">
                           <ReactMarkdown>{topic.content}</ReactMarkdown>
                        </div>
                     </div>
                     {/* Fade at bottom */}
                     <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                  </div>

                  <div className="lg:w-[600px] flex flex-col gap-6">
                     <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 p-8 flex-1 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                           <h3 className="font-display font-bold text-slate-900 flex items-center gap-3 text-lg">
                              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-100 to-amber-100 text-amber-600 flex items-center justify-center text-sm shadow-sm">⚡</span>
                              Tutor IA
                           </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4 mb-4 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                           {chatMessages.map((msg) => (
                              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                 <div className={`max-w-[90%] rounded-2xl p-3 text-xs leading-relaxed ${msg.role === 'user'
                                    ? 'bg-brand-600 text-white rounded-tr-none'
                                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                                    }`}>
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                 </div>
                              </div>
                           ))}
                           {isChatLoading && (
                              <div className="flex items-center gap-2 text-slate-400 text-xs">
                                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                              </div>
                           )}
                           <div ref={messagesEndRef} />
                        </div>

                        <div className="relative flex items-center gap-2">
                           <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyDown={(e) => {
                                 if (e.key === 'Enter') handleSendMessage();
                              }}
                              placeholder="Pergunte ao Tutor..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                              disabled={isChatLoading}
                           />
                           <button
                              onClick={handleSendMessage}
                              disabled={!chatInput.trim() || isChatLoading}
                              className="absolute right-1 top-1 p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
                           >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            )}



            {/* Quiz Tab */}
            {activeTab === Tab.QUIZ && (
               <div className="h-full overflow-y-auto p-6 bg-slate-50">
                  <div className="max-w-3xl mx-auto">
                     {!questions.length ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10 animate-slide-up">
                           <div className="relative group cursor-pointer" onClick={handleGenerateQuiz}>
                              <div className="absolute inset-0 bg-brand-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                              <div className="relative w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-2xl border border-white/50 group-hover:scale-105 transition-transform duration-300">
                                 <span className="text-7xl drop-shadow-sm">🎓</span>
                              </div>
                           </div>
                           <div className="space-y-4 max-w-lg">
                              <h2 className="text-3xl font-bold font-display text-slate-900 tracking-tight">Hora de Praticar</h2>
                              <p className="text-lg text-slate-500 leading-relaxed">Nossa IA irá criar um simulado exclusivo com base no material que você acabou de ler. Pronto?</p>
                           </div>
                           <button
                              onClick={handleGenerateQuiz}
                              disabled={isLoadingQuiz}
                              className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-3 disabled:opacity-70 disabled:cursor-wait"
                           >
                              {isLoadingQuiz ? (
                                 <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Gerando Questões...
                                 </>
                              ) : 'Gerar Simulado Agora'}
                           </button>
                        </div>
                     ) : (
                        <div className="space-y-8 pb-24 animate-fade-in">
                           <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200/60 sticky top-0 z-20 ring-1 ring-black/5">
                              <div className="flex items-center gap-3">
                                 <div className="flex gap-1">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                 </div>
                                 <h2 className="font-bold text-slate-800 text-sm pl-2 border-l border-slate-200">
                                    Simulado Gerado
                                 </h2>
                              </div>
                              {!showQuizResults ? (
                                 <button
                                    onClick={() => setShowQuizResults(true)}
                                    className="bg-brand-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"
                                 >
                                    Finalizar Simulado
                                 </button>
                              ) : (
                                 <button
                                    onClick={() => { setQuestions([]); setShowQuizResults(false); setQuizAnswers({}); }}
                                    className="text-slate-500 text-sm font-bold hover:text-slate-900 hover:underline px-4"
                                 >
                                    Descartar e Sair
                                 </button>
                              )}
                           </div>

                           {questions.map((q, idx) => {
                              const isCorrect = quizAnswers[q.id] === q.correta;

                              return (
                                 <div key={q.id} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-shadow duration-500">
                                    {/* Question Number Decoration */}
                                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-slate-50 rounded-full flex items-end justify-start p-6 text-6xl font-display font-bold text-slate-100 group-hover:text-brand-50 transition-colors pointer-events-none select-none">
                                       {idx + 1}
                                    </div>

                                    <div className="flex items-center gap-3 mb-6 relative">
                                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${q.nivel === 'facil' ? 'bg-green-50 text-green-700 border-green-100' :
                                          q.nivel === 'medio' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                             'bg-red-50 text-red-700 border-red-100'
                                          }`}>
                                          Nível {q.nivel}
                                       </span>
                                    </div>

                                    <p className="text-xl md:text-2xl font-medium font-display text-slate-900 mb-10 leading-snug relative">{q.enunciado}</p>

                                    <div className="space-y-4 relative z-10">
                                       {q.alternativas.map((alt) => {
                                          const isSelected = quizAnswers[q.id] === alt.letra;

                                          let containerClass = "border-slate-200 hover:border-brand-300 hover:bg-slate-50";
                                          let circleClass = "border-slate-300 text-slate-400 group-hover:border-brand-400 group-hover:text-brand-500";

                                          if (showQuizResults) {
                                             if (alt.letra === q.correta) {
                                                containerClass = "border-green-500 bg-green-50/50 ring-1 ring-green-500";
                                                circleClass = "bg-green-500 border-transparent text-white";
                                             } else if (isSelected) {
                                                containerClass = "border-red-500 bg-red-50/50 opacity-70";
                                                circleClass = "bg-red-500 border-transparent text-white";
                                             } else {
                                                containerClass = "opacity-40 border-slate-100 grayscale";
                                             }
                                          } else if (isSelected) {
                                             containerClass = "border-brand-500 bg-brand-50/50 ring-1 ring-brand-500 shadow-md";
                                             circleClass = "bg-brand-600 border-transparent text-white shadow-sm";
                                          }

                                          return (
                                             <button
                                                key={alt.letra}
                                                onClick={() => !showQuizResults && setQuizAnswers(prev => ({ ...prev, [q.id]: alt.letra }))}
                                                className={`group w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all duration-200 flex items-start gap-5 ${containerClass}`}
                                             >
                                                <span className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold border-2 transition-all ${circleClass}`}>
                                                   {alt.letra}
                                                </span>
                                                <span className={`text-base md:text-lg pt-0.5 ${isSelected || (showQuizResults && alt.letra === q.correta) ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{alt.texto}</span>
                                             </button>
                                          );
                                       })}
                                    </div>

                                    {showQuizResults && (
                                       <div className={`mt-8 p-6 rounded-2xl border-l-4 animate-slide-up ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                                          <h4 className={`font-bold mb-2 flex items-center gap-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                                             {isCorrect ? 'Explicação' : 'Atenção'}
                                          </h4>
                                          <p className="text-slate-700 leading-relaxed">
                                             {q.explicacao}
                                          </p>
                                       </div>
                                    )}
                                 </div>
                              );
                           })}
                        </div>
                     )}
                  </div>
               </div>
            )}
         </main>
      </div>
   );
};

export default StudyArea;