import { GeneratedQuestion, Category, GameScenario, Flashcard, QuestionOption, MedSimCase } from "../types";
import { API_URL } from "../config/api";

// Usar API_URL centralizado do config/api.ts
const BACKEND_URL = API_URL;

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  // Inject token if available
  if (typeof window !== 'undefined') {
    const session = localStorage.getItem('sb-access-token'); // Check Supabase default key or custom
    // Note: Supabase usually stores in localStorage with key `sb-<project-ref>-auth-token`
    // We should allow the caller or a context to provide this, but for now let's try to find it or use a simpler auth token key if the app sets one.
    // Based on auth.js, the login returns { session: { access_token } }. The frontend likely stores this.
    // Let's assume a generic key or check standard ones.
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Try looking for supabase key pattern
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          const val = localStorage.getItem(key);
          if (val) {
            try {
              const parsed = JSON.parse(val);
              if (parsed.access_token) {
                headers['Authorization'] = `Bearer ${parsed.access_token}`;
                break;
              }
            } catch (e) { }
          }
        }
      }
    }

    const deviceId = localStorage.getItem('deviceId');
    if (deviceId) {
      headers['x-device-id'] = deviceId;
    }
  }
  return headers;
};

/**
 * Generates summaries for a given topic content.
 * Creates structured summaries by extracting sections and key points.
 */
export const generateSummary = async (
  topicTitle: string,
  categoryTitle: string,
  content: string
): Promise<{ ultra: string; medium: string; detailed: string }> => {
  // Extract sections from markdown content
  const sections = extractSections(content);
  const cleanContent = cleanText(content);

  // Ultra short summary - just key topics
  const ultraSummary = generateUltraSummary(topicTitle, categoryTitle, sections);

  // Medium summary - topics with brief descriptions
  const mediumSummary = generateMediumSummary(topicTitle, categoryTitle, sections, cleanContent);

  // Detailed summary - full content preview
  const detailedSummary = generateDetailedSummary(topicTitle, categoryTitle, sections, cleanContent);

  return {
    ultra: ultraSummary,
    medium: mediumSummary,
    detailed: detailedSummary
  };
};

/**
 * Clean text by removing excessive whitespace and formatting
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\.{3,}/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\s*\d+\s*$/gm, '')
    .trim();
}

/**
 * Extract section titles from markdown content
 */
function extractSections(content: string): string[] {
  const sectionPattern = /^##?\s+(.+)$/gm;
  const sections: string[] = [];
  let match;

  while ((match = sectionPattern.exec(content)) !== null) {
    const title = match[1].trim();
    if (title && title.length < 100 && !title.match(/^índice$/i)) {
      sections.push(title);
    }
  }

  // If no markdown sections found, try to extract numbered sections
  if (sections.length === 0) {
    const numberedPattern = /^(\d+[-.]?\s*)([A-ZÀ-Ú][a-zà-ú\s]+)/gm;
    while ((match = numberedPattern.exec(content)) !== null) {
      sections.push(match[2].trim());
    }
  }

  return sections.slice(0, 15); // Limit to 15 sections
}

/**
 * Generate ultra-short summary
 */
function generateUltraSummary(title: string, category: string, sections: string[]): string {
  let summary = `**${title}**\n\n`;
  summary += `*${category}*\n\n`;

  if (sections.length > 0) {
    const topSections = sections.slice(0, 5);
    summary += `**Tópicos:** ${topSections.join(', ')}`;
    if (sections.length > 5) {
      summary += ` (+${sections.length - 5} mais)`;
    }
  }

  return summary;
}

/**
 * Generate medium-length summary
 */
function generateMediumSummary(title: string, category: string, sections: string[], content: string): string {
  let summary = `**${title}**\n`;
  summary += `*Trilha: ${category}*\n\n`;

  if (sections.length > 0) {
    summary += `### Conteúdo do Material\n\n`;
    sections.slice(0, 8).forEach((section, i) => {
      summary += `${i + 1}. ${section}\n`;
    });
    if (sections.length > 8) {
      summary += `\n*...e mais ${sections.length - 8} seções*\n`;
    }
  } else {
    // No sections found, show content preview
    summary += content.substring(0, 400) + '...';
  }

  return summary;
}

/**
 * Generate detailed summary
 */
function generateDetailedSummary(title: string, category: string, sections: string[], content: string): string {
  let summary = `## ${title}\n`;
  summary += `### ${category}\n\n`;

  if (sections.length > 0) {
    summary += `**Estrutura do Documento:**\n\n`;
    sections.forEach((section, i) => {
      summary += `${i + 1}. **${section}**\n`;
    });
    summary += '\n---\n\n';
  }

  // Add content preview
  summary += `**Visão Geral:**\n\n`;

  // Get first meaningful paragraph (skip headers)
  const paragraphs = content.split('\n\n').filter(p =>
    p.trim().length > 50 &&
    !p.startsWith('#') &&
    !p.match(/^\d+\.\s/)
  );

  if (paragraphs.length > 0) {
    summary += paragraphs[0].substring(0, 600);
    if (paragraphs[0].length > 600) summary += '...';
  } else {
    summary += content.substring(0, 600) + '...';
  }

  return summary;
}


/**
 * Fetches the category_id from the database based on category title
 */
const getCategoryIdByTitle = async (categoryTitle: string): Promise<string | null> => {
  try {
    const response = await fetch(`${BACKEND_URL}/categories`);
    if (!response.ok) return null;

    const result = await response.json();
    const categories = result.data || [];

    // Try to find matching category by name (case-insensitive, partial match)
    const category = categories.find((c: any) =>
      c.name.toLowerCase().includes(categoryTitle.toLowerCase()) ||
      categoryTitle.toLowerCase().includes(c.name.toLowerCase())
    );

    return category?.id || null;
  } catch (e) {
    console.error('Failed to fetch category ID:', e);
    return null;
  }
};

/**
 * Generates quiz questions based on content.
 */
export const generateQuestions = async (
  topicTitle: string,
  categoryTitle: string,
  content: string,
  categoryId?: string, // Novo: ID direto da categoria
  topicFilter?: string // Novo: Filtro por tópico específico
): Promise<GeneratedQuestion[]> => {
  try {
    // Usar o categoryId passado diretamente, ou tentar buscar pelo título
    let category_id = categoryId || null;
    if (!category_id) {
      category_id = await getCategoryIdByTitle(categoryTitle);
    }

    console.log(`Quiz: Buscando para categoria: ${categoryTitle}, category_id: ${category_id}, topic_filter: ${topicFilter || 'all'}`);

    const response = await fetch(`${BACKEND_URL}/generate/quiz`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        topic: `${topicTitle} - ${categoryTitle}\n\n${content}`,
        category_id: category_id, // Send category_id to filter by trail
        topic_filter: topicFilter || null // Send topic filter if provided
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      // Se não há questões, retornar array vazio
      if (errorData.type === 'no_questions') {
        console.warn('Nenhuma questão encontrada no banco de dados');
        return [];
      }
      throw new Error('Backend error');
    }

    const result = await response.json();
    // Backend returns: { type: 'quiz', data: [ { question, options, correctAnswer, explanation } ] }

    // Safety check for result.data
    if (!result.data || !Array.isArray(result.data)) {
      console.warn('No quiz data returned from backend');
      return [];
    }

    // Transform to frontend format
    return result.data.map((q: any, index: number) => {
      // Safety check for options
      const options = Array.isArray(q.options) ? q.options : [];

      return {
        id: `q-${Date.now()}-${index}`,
        nivel: 'medio', // Backend doesn't differentiate yet
        enunciado: q.question || 'Pergunta não disponível',
        alternativas: options.map((opt: string, i: number) => ({
          letra: String.fromCharCode(65 + i), // A, B, C, D
          texto: opt || ''
        })),
        correta: typeof q.correctAnswer === 'number'
          ? String.fromCharCode(65 + q.correctAnswer)
          : (q.correctAnswer || 'A'),
        explicacao: q.explanation || 'Explicação não disponível',
        topico_referencia: topicTitle
      };
    });

  } catch (e) {
    console.error("Failed to generate questions", e);
    return [];
  }
};

/**
 * Generates a general quiz for the category hub.
 */
export const generateGeneralQuiz = async (categoryTitle: string, categoryId?: string, topicFilter?: string): Promise<GeneratedQuestion[]> => {
  return generateQuestions("Simulado Geral", categoryTitle, "Tópicos variados: Legislação, Prática Clínica, Ética e Saúde Pública.", categoryId, topicFilter);
};

/**
 * Creates a chat session for the interactive tutor.
 * Returns a mock chat object for MVP that simulates responses.
 */
export const createTutorChat = (categoryTitle: string, topicTitle: string, contentSummary: string, categoryId?: string) => {
  // Mock chat session for MVP
  const context = {
    category: categoryTitle,
    topic: topicTitle,
    summary: contentSummary
  };

  return {
    sendMessage: async ({ message }: { message: string }): Promise<{ text: string }> => {
      try {
        let catId = categoryId;
        if (!catId) {
          catId = await getCategoryIdByTitle(categoryTitle) || undefined;
        }

        // Try to use backend correction endpoint for intelligent responses
        const response = await fetch(`${BACKEND_URL}/correct`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            question: message,
            userAnswer: "Preciso de ajuda para entender",
            topic: `${context.category} - ${context.topic}`,
            category_id: catId
          })
        });

        if (response.ok) {
          const data = await response.json();
          return { text: data.feedback || "Não consegui processar sua pergunta. Tente novamente." };
        }
      } catch (e) {
        console.error('Chat backend error:', e);
      }

      // Fallback response
      return {
        text: `Obrigado pela sua pergunta sobre **${context.topic}**!\n\nEsta é uma versão de demonstração do tutor. Para respostas completas, o backend precisa estar configurado com a API de IA.\n\nSua pergunta: "${message}"\n\n*Dica: Revise o material de estudo para encontrar a resposta.*`
      };
    }
  };
};

/**
 * Smart Search (Simulated for Demo using Generative response as search result explanation)
 */
export const smartSearchExplain = async (query: string, categoryTitle: string) => {
  // Reuse correction/quiz logic or add specific endpoint
  try {
    const response = await fetch(`${BACKEND_URL}/correct`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        question: query,
        userAnswer: "Explain this term",
        topic: categoryTitle
      })
    });
    const data = await response.json();
    return data.feedback; // The backend 'correction' provides an explanation
  } catch (e) {
    return "Não foi possível buscar a informação.";
  }
}

/**
 * Generates a Game Scenario (Clinical Case).
 * DEPRECATED: Use generateMedSimCase for new UI.
 */
export const generateGameScenario = async (categoryTitle: string, difficultyLevel: number): Promise<GameScenario> => {
  return {
    id: 'deprecated',
    patientName: 'Deprecated',
    age: 0,
    chiefComplaint: '',
    vitals: '',
    scenarioDescription: '',
    question: '',
    options: [],
    correctAnswer: '',
    explanation: '',
    difficulty: 'normal'
  };
};

/**
 * Mapeia dados brutos do backend para o formato MedSimCase
 */
const mapToMedSimCase = (gameData: any, index: number = 0): MedSimCase => {
  let options: string[] = [];
  if (Array.isArray(gameData.options)) {
    if (typeof gameData.options[0] === 'string') {
      options = gameData.options;
    } else {
      options = gameData.options.map((o: any) => o.text || o);
    }
  }

  return {
    id: gameData.id || Date.now() + index,
    caseId: gameData.caseId, // ID do banco de dados para marcar como usado
    name: gameData.name || gameData.patientName || `Paciente ${index + 1}`,
    age: gameData.age || 30,
    gender: gameData.gender || "M",
    avatar: gameData.avatar || "👨",
    complaint: gameData.complaint || "Queixa não informada",
    vitals: gameData.vitals || { bp: "120/80", hr: "80", temp: "36.5", spo2: "98" },
    disease: gameData.disease || "Diagnóstico pendente",
    options: options,
    questions: gameData.questions || [],
    exams: gameData.exams || {},
    explanation: gameData.explanation || "Sem explicação.",
    treatment: gameData.treatment || "Não especificado.",
    conduct: gameData.conduct || "Não especificado."
  };
};

/**
 * Busca múltiplos casos clínicos pré-gerados do banco de dados (INSTANTÂNEO)
 * @param categoryId - ID da categoria para filtrar casos
 * @param limit - Número de casos a buscar (padrão: 10)
 * @returns Array de casos pré-gerados
 */
export const fetchPreGeneratedCases = async (categoryId?: string, limit: number = 10): Promise<MedSimCase[]> => {
  try {
    let url = `${BACKEND_URL}/game-cases?limit=${limit}`;
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }

    console.log(`🔍 Buscando ${limit} casos pré-gerados para categoria: ${categoryId || 'todas'}`);

    const response = await fetch(url, {
      headers: getHeaders()
    });

    if (response.status === 404) {
      console.log('📭 Nenhum caso pré-gerado disponível');
      return [];
    }

    if (!response.ok) {
      throw new Error('Failed to fetch pre-generated cases');
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      const mappedCases = result.data.map((caseData: any) => mapToMedSimCase(caseData));
      console.log(`✅ ${mappedCases.length} casos pré-gerados encontrados!`);
      return mappedCases;
    }

    return [];
  } catch (e) {
    console.warn('Erro ao buscar casos pré-gerados:', e);
    return [];
  }
};

/**
 * Marca um caso como usado no banco de dados
 * @param caseId - ID do caso no banco de dados
 */
export const markCaseAsUsed = async (caseId: string | number): Promise<void> => {
  try {
    const response = await fetch(`${BACKEND_URL}/game-cases/${caseId}/used`, {
      method: 'POST',
      headers: getHeaders()
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to mark case used: ${response.status} ${errText}`);
    }

    console.log(`📌 Caso ${caseId} marcado como usado`);
  } catch (e) {
    console.warn('Erro ao marcar caso como usado:', e);
  }
};

/**
 * Gera casos clínicos via IA (usado quando não há casos pré-gerados)
 */
const generateCasesViaAI = async (
  categoryTitle: string,
  difficultyLevel: number,
  count: number,
  categoryId?: string
): Promise<MedSimCase[]> => {
  const response = await fetch(`${BACKEND_URL}/generate/game`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      topic: categoryTitle,
      difficulty: difficultyLevel,
      seed: Date.now(),
      count: count,
      categoryId: categoryId
    })
  });

  if (!response.ok) {
    throw new Error('Backend generation failed');
  }

  const result = await response.json();
  const gameDataList = Array.isArray(result.data) ? result.data : [result.data];

  return gameDataList.map((gameData: any, index: number) => mapToMedSimCase(gameData, index));
};

/**
 * Generates a MedSim Clinical Case (Single or Batch).
 * PRIMEIRO tenta buscar do banco de dados (instantâneo), depois gera via IA se necessário.
 * 
 * @param categoryTitle - O título da categoria (ex: "Téc. Enfermagem")
 * @param difficultyLevel - Nível de dificuldade (1-10)
 * @param count - Número de casos a gerar
 * @param categoryId - ID da categoria (ex: "TEC_ENFERMAGEM") para personalizar o jogo
 */
export const generateMedSimCase = async (
  categoryTitle: string,
  difficultyLevel: number,
  count: number = 10,
  categoryId?: string
): Promise<MedSimCase | MedSimCase[]> => {
  try {
    // PRIMEIRO: Tentar buscar casos pré-gerados do banco de dados (INSTANTÂNEO)
    const preGenerated = await fetchPreGeneratedCases(categoryId, count);
    if (preGenerated.length > 0) {
      console.log(`⚡ Usando ${preGenerated.length} casos pré-gerados do banco de dados (instantâneo!)`);
      if (count === 1) {
        return preGenerated[0];
      }
      return preGenerated;
    }

    // Se não há casos pré-gerados, gerar via IA (fallback)
    console.log('🤖 Nenhum caso no banco. Gerando via IA (pode demorar)...');
    const generatedCases = await generateCasesViaAI(categoryTitle, difficultyLevel, count, categoryId);

    if (count === 1) {
      return generatedCases[0];
    }
    return generatedCases;

  } catch (e) {
    console.error("Game gen failed", e);
    // Fallback Mock
    const mockCase: MedSimCase = {
      id: Date.now(),
      name: "Erro na IA",
      age: 0,
      gender: "X",
      avatar: "🤖",
      complaint: "Erro ao conectar com servidor de IA.",
      vitals: { bp: "--", hr: "--", temp: "--", spo2: "--" },
      disease: "Erro",
      options: ["Erro", "Tente", "Novamente", "Mais Tarde"],
      questions: [],
      exams: {},
      explanation: "Verifique sua conexão ou a chave de API.",
      treatment: "Reiniciar sistema.",
      conduct: "Contactar suporte."
    };

    return count === 1 ? mockCase : [mockCase];
  }
};


/**
 * Generates Flashcards for a category.
 */
export const generateFlashcards = async (categoryTitle: string, categoryId?: string): Promise<Flashcard[]> => {
  try {
    console.log("Calling backend for flashcards:", categoryTitle, "categoryId:", categoryId);

    // Usar o categoryId passado diretamente, ou tentar buscar pelo título
    let category_id = categoryId || null;
    if (!category_id) {
      category_id = await getCategoryIdByTitle(categoryTitle);
    }

    console.log(`Flashcards: Buscando para categoria: ${categoryTitle}, category_id: ${category_id}`);

    const response = await fetch(`${BACKEND_URL}/generate/flashcards`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        topic: categoryTitle,
        category_id: category_id // Send category_id to filter by trail
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      // Se não há flashcards, retornar array vazio
      if (errorData.type === 'no_questions') {
        console.warn('Nenhum flashcard encontrado no banco de dados');
        return [];
      }
      throw new Error(`Backend Error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    // Backend returns: { type: 'flashcard', data: [ { front: '...', back: '...' } ] }

    if (!result.data || !Array.isArray(result.data)) {
      console.error("Invalid format", result);
      return [];
    }

    return result.data.map((card: any, index: number) => ({
      id: `fc-${Date.now()}-${index}`,
      front: card.front,
      back: card.back,
      status: 'new'
    }));

  } catch (e) {
    console.error("Failed to generate flashcards", e);
    throw e;
  }
};

/**
 * Generates a term challenge for the "Decipher" game.
 * Fetches terms from the database, with fallback to a mock term.
 */
export const generateTermChallenge = async (categoryTitle: string, categoryId?: string) => {
  try {
    let url = `${BACKEND_URL}/decipher-terms/random`;

    // Add category filter if available
    if (categoryId) {
      url += `?category_id=${categoryId}`;
    }

    const response = await fetch(url, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch term');
    }

    const result = await response.json();

    if (result.data) {
      return {
        term: result.data.term.toUpperCase(),
        hint: result.data.hint,
        definition: result.data.definition
      };
    }

    throw new Error('No term data');
  } catch (e) {
    console.warn('Failed to fetch term from database, using fallback:', e);
    // Fallback mock term
    return {
      term: "HIPERTENSAO",
      hint: "Pressão alta sustentada",
      definition: "Condição clínica caracterizada por elevação sustentada dos níveis pressóricos."
    };
  }
};

/**
 * Fetches all valid terms for a game session (specific category + global)
 * to allow local shuffling and non-repeating gameplay.
 */
export const fetchDecipherTermsForGame = async (categoryTitle: string, categoryId?: string) => {
  try {
    let url = `${BACKEND_URL}/decipher-terms/game`;

    // Add category filter if available
    if (categoryId) {
      url += `?category_id=${categoryId}`;
    }

    console.log(`Fetching terms for game: ${url}`);

    const response = await fetch(url, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch terms list');
    }

    const result = await response.json();
    const terms = result.data || [];

    if (terms.length === 0) {
      console.warn('No terms found in DB, using fallback');
      return [{
        id: 'fallback-1',
        term: "HIPERTENSAO",
        hint: "Pressão alta sustentada",
        definition: "Condição clínica caracterizada por elevação sustentada dos níveis pressóricos."
      }];
    }

    return terms.map((t: any) => ({
      id: t.id,
      term: t.term.toUpperCase(),
      hint: t.hint,
      definition: t.definition
    }));

  } catch (e) {
    console.error('Error in fetchDecipherTermsForGame:', e);
    // Fallback
    return [{
      id: 'fallback-err',
      term: "HIPERTENSAO",
      hint: "Pressão alta sustentada",
      definition: "Condição clínica caracterizada por elevação sustentada dos níveis pressóricos."
    }];
  }
};

/**
 * Fetches questions for the Connection Game.
 * Reuses flashcards from the database.
 */
export const fetchConnectionQuestions = async (categoryTitle: string, categoryId?: string) => {
  try {
    let url = `${BACKEND_URL}/questions?type=flashcard&limit=40`;

    // Add category filter if available
    let catId = categoryId;
    if (!catId) {
      catId = await getCategoryIdByTitle(categoryTitle) || undefined;
    }

    if (catId) {
      url += `&category_id=${catId}`;
    }

    console.log(`Fetching connection questions: ${url}`);

    const response = await fetch(url, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch questions');
    }

    const result = await response.json();

    if (!result.data || !Array.isArray(result.data)) {
      console.warn('Invalid data format from questions endpoint');
      return [];
    }

    // Map backend format to game format
    return result.data.map((q: any) => ({
      id: q.id,
      left: q.content.front,
      right: q.content.back
    }));

  } catch (e) {
    console.error('Error fetching connection questions:', e);
    return [];
  }
};