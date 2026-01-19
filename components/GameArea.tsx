import React, { useState, useEffect, useRef } from 'react';
import './GameArea.css';
import { Category, MedSimCase } from '../types';
import { generateMedSimCase, markCaseAsUsed } from '../services/geminiService';

interface GameAreaProps {
   category: Category;
   onExit: () => void;
}

interface LogEntry {
   msg: string;
   type: 'info' | 'success' | 'error';
}

const GameArea: React.FC<GameAreaProps> = ({ category, onExit }) => {
   // Game State
   const [currentPatient, setCurrentPatient] = useState<MedSimCase | null>(null);
   const [loadingPatient, setLoadingPatient] = useState(false);

   // Buffering State
   const [patientQueue, setPatientQueue] = useState<MedSimCase[]>([]);
   const [isBuffering, setIsBuffering] = useState(false);
   const hasInitialized = useRef(false);

   const [score, setScore] = useState(100);
   const [money, setMoney] = useState(500);
   const [patientsSolved, setPatientsSolved] = useState(0);

   // Current Case State
   const [questionsAsked, setQuestionsAsked] = useState<number[]>([]);
   const [examsDone, setExamsDone] = useState<string[]>([]);
   const [logs, setLogs] = useState<LogEntry[]>([]);
   const [activeTab, setActiveTab] = useState<'anamnese' | 'exames' | 'diagnostico'>('anamnese');
   const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

   // Modal State
   const [modalState, setModalState] = useState<{
      isOpen: boolean;
      title: string;
      titleColor: string;
      content: React.ReactNode;
      note: string;
      isEndGame?: boolean;
      victory?: boolean;
   }>({
      isOpen: false,
      title: '',
      titleColor: '',
      content: null,
      note: ''
   });

   const logPanelRef = useRef<HTMLDivElement>(null);

   // Initial Load Phase
   useEffect(() => {
      if (!hasInitialized.current) {
         hasInitialized.current = true;
         initializeApp();
      }
   }, []);

   const initializeApp = async () => {
      setLoadingPatient(true);

      try {
         // Buscar 10 casos de uma vez do banco de dados
         console.log('🎮 Iniciando jogo - buscando 10 casos...');
         const cases = await generateMedSimCase(category.title, 1, 10, category.id) as MedSimCase[];

         if (Array.isArray(cases) && cases.length > 0) {
            // Primeiro caso vai para o paciente atual
            const firstCase = cases[0];
            // Restante vai para a fila
            setPatientQueue(cases.slice(1));
            setupNewPatient(firstCase);
            console.log(`✅ ${cases.length} casos carregados! Fila: ${cases.length - 1}`);
         } else {
            console.error('Nenhum caso disponível');
         }

         setLoadingPatient(false);

      } catch (error) {
         console.error("Critical error loading patients:", error);
         setLoadingPatient(false);
      }
   };

   const loadMoreCases = async () => {
      if (isBuffering) return;

      setIsBuffering(true);
      console.log("🔄 Buscando mais 10 casos do banco...");

      try {
         const newCases = await generateMedSimCase(category.title, 1, 10, category.id) as MedSimCase[];

         if (Array.isArray(newCases) && newCases.length > 0) {
            setPatientQueue(prev => [...prev, ...newCases]);
            console.log(`✅ +${newCases.length} casos adicionados à fila!`);
         }
      } catch (err) {
         console.warn("Erro ao buscar mais casos:", err);
      } finally {
         setIsBuffering(false);
      }
   };

   const setupNewPatient = (newCase: MedSimCase, previousCase?: MedSimCase | null) => {
      // Marcar caso anterior como usado no banco de dados
      if (previousCase?.caseId) {
         markCaseAsUsed(previousCase.caseId);
      }

      setModalState(prev => ({ ...prev, isOpen: false }));
      setCurrentPatient(newCase);

      // Reset Case State
      setQuestionsAsked([]);
      setExamsDone([]);
      setLogs([]);
      setActiveTab('anamnese');

      // Shuffle options ensuring correct one is present
      let options = [...(newCase.options || [])];
      if (!options.includes(newCase.disease)) {
         options.pop();
         options.push(newCase.disease);
      }
      options.sort(() => Math.random() - 0.5);
      setShuffledOptions(options);

      setLogs([{ msg: `Bem-vindo ao plantão, Dr(a). O paciente ${newCase.name} entrou na sala.`, type: 'info' }]);
   };

   const handleNextPatient = async () => {
      if (score <= 0) {
         handleEndGame(false);
         return;
      }

      setLoadingPatient(true);

      // Check Queue
      if (patientQueue.length > 0) {
         // Use buffered patient
         const nextCase = patientQueue[0];
         setPatientQueue(prev => prev.slice(1));
         setupNewPatient(nextCase, currentPatient);
         setLoadingPatient(false);

         // Se a fila acabou ou está baixa, buscar mais 10 casos
         if (patientQueue.length <= 1) {
            console.log('📦 Fila baixa, buscando mais 10 casos...');
            loadMoreCases();
         }
      } else {
         // Fila vazia - buscar 10 novos casos
         console.log("⚠️ Fila vazia, buscando 10 novos casos...");
         try {
            const newCases = await generateMedSimCase(category.title, 1, 10, category.id) as MedSimCase[];

            if (Array.isArray(newCases) && newCases.length > 0) {
               const first = newCases[0];
               setPatientQueue(newCases.slice(1));
               setupNewPatient(first, currentPatient);
               console.log(`✅ ${newCases.length} novos casos carregados!`);
            } else {
               console.error('Nenhum caso disponível no banco');
            }
         } catch (e) {
            console.error("Erro ao buscar casos:", e);
         } finally {
            setLoadingPatient(false);
         }
      }
   };

   // Scroll logs to bottom
   useEffect(() => {
      if (logPanelRef.current) {
         logPanelRef.current.scrollTop = logPanelRef.current.scrollHeight;
      }
   }, [logs]);

   const addLog = (msg: string, type: 'info' | 'success' | 'error') => {
      setLogs(prev => [...prev, { msg, type }]);
   };

   const handleAskQuestion = (idx: number) => {
      if (!currentPatient || questionsAsked.includes(idx)) return;

      const q = currentPatient.questions[idx];
      setQuestionsAsked(prev => [...prev, idx]);

      addLog(`Dr: ${q.text}`, 'info');
      setTimeout(() => {
         addLog(`Paciente: ${q.answer}`, 'info');
         addLog(`[Nota]: ${q.clue}`, 'success');
      }, 500);
   };

   const handleRequestExam = (examType: string) => {
      if (!currentPatient || examsDone.includes(examType)) return;

      // Custos dinâmicos para todos os tipos de exames/procedimentos
      const costs: { [key: string]: number } = {
         hemograma: 50, raiox: 80, ecg: 60, usg: 120, cultura: 90,
         sinaisVitais: 20, glicemia: 15, escalaGlasgow: 10, escalaDor: 10, balanco: 25,
         anamnese: 15, exameFisico: 20, escalaBraden: 10, escalaFugulin: 10, historicoFamiliar: 15,
         prescricao: 20, interacoes: 30, alergias: 15, adesao: 20, estoque: 10,
         bioquimica: 60, urina: 40, coagulacao: 70
      };
      const cost = costs[examType] || 40;

      if (money < cost) {
         addLog("Saldo insuficiente para esta avaliação!", "error");
         return;
      }

      setMoney(prev => prev - cost);
      setExamsDone(prev => [...prev, examType]);

      const result = currentPatient.exams[examType] || "Sem alterações";
      addLog(`Avaliação de ${examType.toUpperCase()} realizada. (-R$ ${cost})`, 'success');
      addLog(`Resultado: ${result}`, 'info');
   };

   const handleSubmitDiagnosis = (diagnosis: string) => {
      if (!currentPatient) return;

      const isCorrect = diagnosis === currentPatient.disease;

      if (isCorrect) {
         const bonus = (100 - (10 - Math.min(10, patientsSolved))) + 10;
         setScore(prev => Math.min(100, prev + 5)); // Recover reputation
         setMoney(prev => prev + 150); // Earn money
         setPatientsSolved(prev => prev + 1);
         addLog(`DIAGNÓSTICO CORRETO: ${diagnosis}`, 'success');

         setModalState({
            isOpen: true,
            title: "Diagnóstico Correto!",
            titleColor: "var(--success)",
            content: <div>
               <p className="mb-4">Parabéns, Dr(a)! O tratamento para <strong>{diagnosis}</strong> foi iniciado.</p>

               <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-3 text-left shadow-sm">
                  <strong className="block text-blue-800 text-xs uppercase tracking-wider mb-1">📋 Conduta Médica</strong>
                  <p className="text-sm text-blue-900">{currentPatient.conduct}</p>
               </div>

               <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-left shadow-sm">
                  <strong className="block text-green-800 text-xs uppercase tracking-wider mb-1">💊 Tratamento</strong>
                  <p className="text-sm text-green-900">{currentPatient.treatment}</p>
               </div>
            </div>,
            note: currentPatient.explanation,
            isEndGame: false
         });
      } else {
         setScore(prev => prev - 15);
         addLog(`ERRO: Diagnóstico ${diagnosis} estava incorreto.`, 'error');

         setModalState({
            isOpen: true,
            title: "Diagnóstico Incorreto",
            titleColor: "var(--danger)",
            content: <div>
               <p className="mb-2">Infelizmente, esse não era o diagnóstico correto.</p>
               <p className="mb-4">O diagnóstico correto era <strong>{currentPatient.disease}</strong>.</p>

               <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-left opacity-75">
                  <strong className="block text-slate-600 text-xs uppercase tracking-wider mb-1">Conduta que seria ideal:</strong>
                  <p className="text-sm text-slate-700">{currentPatient.conduct}</p>
               </div>
            </div>,
            note: currentPatient.explanation,
            isEndGame: false
         });
      }
   };

   const handleEndGame = (victory: boolean) => {
      setModalState({
         isOpen: true,
         title: victory ? "Plantão Finalizado!" : "Demissão",
         titleColor: victory ? "var(--primary)" : "var(--danger)",
         content: victory ? (
            <>
               <h3>Excelente trabalho!</h3>
               <p>Você é um médico exemplar.</p>
               <p>Reputação Final: {score}%</p>
            </>
         ) : (
            <>
               <h3>Sua reputação chegou a 0%.</h3>
               <p>O conselho médico decidiu encerrar seu contrato devido a erros sucessivos.</p>
            </>
         ),
         note: "", // Hide note on end game
         isEndGame: true,
         victory
      });
   };

   const handleRestart = () => {
      setScore(100);
      setMoney(500);
      setPatientsSolved(0);
      setPatientQueue([]); // Clear old queue
      // Re-initialize
      hasInitialized.current = false;
      initializeApp();
   };

   if (loadingPatient) {
      return (
         <div className="medsim-wrapper" style={{ justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)' }}>
            <div className="flex flex-col items-center justify-center p-10 md:p-16 rounded-3xl bg-white/60 backdrop-blur-xl shadow-2xl border border-white/50 max-w-3xl w-full mx-4 transition-all duration-500">

               {/* Icon */}
               <div className="relative mb-10 group">
                  <div className="absolute inset-0 bg-blue-500 rounded-full opacity-10 group-hover:opacity-20 animate-ping duration-[3s]"></div>
                  <div className="bg-white p-8 rounded-full shadow-lg relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                     <div className="text-7xl md:text-8xl animate-bounce">🚑</div>
                  </div>
               </div>

               {/* Main Title */}
               <h2 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 mb-6 text-center tracking-tight leading-tight">
                  Aguardando próximo paciente...
               </h2>

               {/* Status Text */}
               <div className="flex flex-col items-center gap-3">
                  <p className="text-xl md:text-2xl text-slate-600 font-medium text-center max-w-lg leading-relaxed">
                     {patientQueue.length > 0
                        ? "Preparando prontuário..."
                        : "A ambulância está chegando..."}
                  </p>

                  {patientQueue.length === 0 && (
                     <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold animate-pulse border border-blue-100">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                        Gerando lote de casos
                     </span>
                  )}
               </div>
            </div>
         </div>
      );
   }

   if (!currentPatient) return <div className="medsim-wrapper">Erro ao carregar.</div>;

   return (
      <div className="medsim-wrapper">
         <header>
            <div className="brand">
               <span>⚕️</span> MedSim
            </div>
            <div className="stats-bar">
               <span>Pacientes Salvos: {patientsSolved}</span>
               <span>Reputação: <span style={{ color: score < 30 ? 'red' : 'white' }}>{score}%</span></span>
            </div>
            <div className="header-actions">
               <button
                  onClick={handleNextPatient}
                  className="next-case-btn"
                  disabled={loadingPatient}
                  title="Pular para o próximo caso clínico"
               >
                  ⏩ Próximo Caso
               </button>
               <button
                  onClick={onExit}
                  className="exit-btn"
               >
                  Sair
               </button>
            </div>
         </header>

         <main>
            {/* Left Column: Patient Info */}
            <section className="patient-card">
               <div className="patient-header">
                  <div className="avatar">{currentPatient.avatar}</div>
                  <div>
                     <h2>{currentPatient.name}</h2>
                     <p style={{ color: '#666' }}>{currentPatient.age} anos • {currentPatient.gender}</p>
                     <p style={{ marginTop: '5px', fontStyle: 'italic', color: 'var(--danger)' }}>"{currentPatient.complaint}"</p>
                  </div>
               </div>

               <div>
                  <h3>Sinais Vitais (Triagem)</h3>
                  <div className="vital-signs">
                     <div className="vital-item">PA: <span className="vital-value">{currentPatient.vitals.bp || '--'}</span></div>
                     <div className="vital-item">FC: <span className="vital-value">{currentPatient.vitals.hr || '--'}</span> bpm</div>
                     <div className="vital-item">Temp: <span className="vital-value">{currentPatient.vitals.temp || '--'}</span> °C</div>
                     <div className="vital-item">Sat O2: <span className="vital-value">{currentPatient.vitals.spo2 || '--'}</span>%</div>
                  </div>
               </div>

               <div className="log-panel" ref={logPanelRef}>
                  {logs.map((log, i) => (
                     <div key={i} className={`log-entry ${log.type}`}>
                        &gt; {log.msg}
                     </div>
                  ))}
               </div>
            </section>

            {/* Right Column: Actions */}
            <section className="action-area">
               <div className="tabs">
                  <button
                     className={`tab-btn ${activeTab === 'anamnese' ? 'active' : ''}`}
                     onClick={() => setActiveTab('anamnese')}
                  >
                     📋 Anamnese
                  </button>
                  <button
                     className={`tab-btn ${activeTab === 'exames' ? 'active' : ''}`}
                     onClick={() => setActiveTab('exames')}
                  >
                     🔬 Exames
                  </button>
                  {/* Diagnóstico/Conduta Tab Label */}
                  <button
                     className={`tab-btn ${activeTab === 'diagnostico' ? 'active' : ''}`}
                     onClick={() => setActiveTab('diagnostico')}
                  >
                     💊 {category.id === 'TEC_ENFERMAGEM' ? 'Conduta' : 'Diagnóstico'}
                  </button>
               </div>

               {/* Anamnese Panel */}
               {activeTab === 'anamnese' && (
                  <div className="panel active">
                     <h3>Perguntas Clínicas</h3>
                     <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>Clique para perguntar sobre sintomas específicos.</p>
                     <div className="flex flex-col gap-2">
                        {currentPatient.questions.map((q, idx) => (
                           <button
                              key={idx}
                              className="action-btn"
                              onClick={() => handleAskQuestion(idx)}
                              disabled={questionsAsked.includes(idx)}
                              style={{ opacity: questionsAsked.includes(idx) ? 0.6 : 1 }}
                           >
                              {q.text} {questionsAsked.includes(idx) && "(✔)"}
                           </button>
                        ))}
                     </div>
                  </div>
               )}

               {/* Exames/Procedimentos Panel */}
               {activeTab === 'exames' && (
                  <div className="panel active">
                     <h3>Solicitar Avaliações</h3>
                     <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>Avaliações e procedimentos ajudam a confirmar hipóteses, mas custam créditos.</p>
                     <div className="flex flex-col gap-2">
                        {/* Exames dinâmicos baseados no caso atual */}
                        {currentPatient.exams && Object.keys(currentPatient.exams).map((examKey) => {
                           // Custos dinâmicos baseados no tipo de exame
                           const baseCosts: { [key: string]: number } = {
                              hemograma: 50, raiox: 80, ecg: 60, usg: 120, cultura: 90,
                              sinaisVitais: 20, glicemia: 15, escalaGlasgow: 10, escalaDor: 10, balanco: 25,
                              anamnese: 15, exameFisico: 20, escalaBraden: 10, escalaFugulin: 10, historicoFamiliar: 15,
                              prescricao: 20, interacoes: 30, alergias: 15, adesao: 20, estoque: 10,
                              bioquimica: 60, urina: 40, coagulacao: 70
                           };
                           const cost = baseCosts[examKey] || 40;

                           // Labels amigáveis para os exames
                           const examLabels: { [key: string]: string } = {
                              hemograma: 'Hemograma Completo',
                              raiox: 'Raio-X de Tórax',
                              ecg: 'Eletrocardiograma (ECG)',
                              usg: 'Ultrassonografia Abdominal',
                              cultura: 'Cultura de Secreção',
                              sinaisVitais: 'Verificação de Sinais Vitais',
                              glicemia: 'Glicemia Capilar',
                              escalaGlasgow: 'Escala de Coma de Glasgow',
                              escalaDor: 'Escala de Dor (EVA)',
                              balanco: 'Balanço Hídrico',
                              anamnese: 'Anamnese de Enfermagem',
                              exameFisico: 'Exame Físico Sistematizado',
                              escalaBraden: 'Escala de Braden',
                              escalaFugulin: 'Escala de Fugulin',
                              historicoFamiliar: 'Histórico Familiar e Social',
                              prescricao: 'Análise da Prescrição',
                              interacoes: 'Verificar Interações',
                              alergias: 'Histórico de Alergias',
                              adesao: 'Adesão ao Tratamento',
                              estoque: 'Consultar Estoque',
                              bioquimica: 'Painel Bioquímico',
                              urina: 'Exame de Urina (EAS)',
                              coagulacao: 'Coagulograma'
                           };

                           const label = examLabels[examKey] || examKey;

                           return (
                              <button
                                 key={examKey}
                                 className="action-btn"
                                 onClick={() => handleRequestExam(examKey)}
                                 disabled={examsDone.includes(examKey)}
                                 style={{ opacity: examsDone.includes(examKey) ? 0.6 : 1 }}
                              >
                                 {label} {examsDone.includes(examKey) ? "(✔)" : <span>R$ {cost}</span>}
                              </button>
                           );
                        })}
                     </div>

                     {examsDone.length > 0 && (
                        <div style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
                           <h4>Resultados:</h4>
                           {examsDone.map(ex => (
                              <p key={ex} style={{ marginBottom: '4px' }}>
                                 <strong>{ex.toUpperCase()}:</strong> {currentPatient.exams[ex] || "Indisponível"}
                              </p>
                           ))}
                        </div>
                     )}
                  </div>
               )}

               {/* Diagnóstico Panel */}
               {activeTab === 'diagnostico' && (
                  <div className="panel active">
                     <h3>{category.id === 'TEC_ENFERMAGEM' ? 'Definir Conduta Prioritária' : 'Definir Diagnóstico'}</h3>
                     <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>Escolha a condição clínica que melhor se encaixa.</p>
                     <div className="diagnosis-grid">
                        {shuffledOptions.map(opt => (
                           <button
                              key={opt}
                              className="diagnosis-btn"
                              onClick={() => handleSubmitDiagnosis(opt)}
                           >
                              {opt}
                           </button>
                        ))}
                     </div>
                  </div>
               )}
            </section>
         </main>

         {/* Modal for Feedback */}
         {modalState.isOpen && (
            <div className="modal-overlay">
               <div className="modal">
                  <h2 style={{ color: modalState.titleColor }}>{modalState.title}</h2>
                  <div style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                     {modalState.content}
                  </div>

                  {!modalState.isEndGame && (
                     <div className="fact-box">
                        <strong>💡 Nota Médica:</strong>
                        <span> {modalState.note}</span>
                     </div>
                  )}

                  {modalState.isEndGame ? (
                     <button className="next-btn" onClick={handleRestart}>Jogar Novamente</button>
                  ) : (
                     <button className="next-btn" onClick={handleNextPatient}>Próximo Paciente</button>
                  )}
               </div>
            </div>
         )}
      </div>
   );
};

export default GameArea;