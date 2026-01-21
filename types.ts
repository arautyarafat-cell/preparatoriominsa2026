
export enum CategoryId {
  MEDICO = 'MEDICO',
  ENFERMAGEM = 'ENFERMAGEM',
  TEC_ENFERMAGEM = 'TEC_ENFERMAGEM',
  TEC_FARMACIA = 'TEC_FARMACIA',
  ANALISES_CLINICAS = 'ANALISES_CLINICAS',
}

export interface Category {
  id: CategoryId;
  title: string;
  description: string;
  icon: string;
  color: string;
  totalQuestions: number;
  totalTopics: number;
  disponivel?: boolean; // Se false, apenas admins podem acessar
}

export interface Topic {
  id: string;
  categoryId: CategoryId;
  title: string;
  content: string; // Markdown content
  tags: string[];
}

export interface QuestionOption {
  letra: string;
  texto: string;
}

export interface GeneratedQuestion {
  id: string;
  nivel: 'facil' | 'medio' | 'dificil';
  enunciado: string;
  alternativas: QuestionOption[];
  correta: string;
  explicacao: string;
  dica?: string; // Hint for the UI
  topico_referencia: string;
}

export interface GameScenario {
  id: string;
  patientName: string;
  age: number;
  chiefComplaint: string; // Queixa principal
  vitals: string; // Contexto rápido (ex: PA 140/90)
  scenarioDescription: string; // Detalhamento do caso
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'normal' | 'critical';
}

export interface MedSimCase {
  id: number | string;
  caseId?: string | number; // ID do caso no banco de dados (para marcar como usado)
  name: string;
  age: number;
  gender: string;
  avatar: string;
  complaint: string;
  vitals: {
    bp: string;
    hr: string;
    temp: string;
    spo2: string;
  };
  disease: string;
  options: string[];
  questions: {
    text: string;
    answer: string;
    clue: string;
  }[];
  exams: { [key: string]: string };
  treatment?: string; // Optional treatment
  conduct?: string; // Optional conduct
  explanation: string;
}

export interface Flashcard {
  id: string;
  front: string; // Termo ou Pergunta
  back: string; // Definição ou Resposta
  status?: 'new' | 'mastered' | 'review';
}

export interface StudyStats {
  questionsAnswered: number;
  accuracy: number;
  hoursStudied: number;
  topicsCompleted: number;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CATEGORY_HUB = 'CATEGORY_HUB',
  LOGIN = 'LOGIN',
  STUDY = 'STUDY',
  LESSON = 'LESSON', // Player
  LESSON_SELECTOR = 'LESSON_SELECTOR', // Lista de Aulas
  GAME = 'GAME',
  FLASHCARDS = 'FLASHCARDS',
  QUIZ = 'QUIZ',
  DECIPHER_GAME = 'DECIPHER_GAME',
  ADMIN = 'ADMIN',
  PRICING = 'PRICING',
  PAYMENT = 'PAYMENT',
  PROFILE = 'PROFILE',
  TERMS = 'TERMS',
  HOW_IT_WORKS = 'HOW_IT_WORKS',
  CONNECTION_GAME = 'CONNECTION_GAME',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
