import { supabase } from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

// Mapeamento de IDs do frontend para nomes de categorias no banco de dados
const CATEGORY_MAP = {
    'MEDICO': 'Médicos',
    'ENFERMAGEM': 'Enfermeiros',
    'TEC_ENFERMAGEM': 'Técnicos de Enfermagem',
    'TEC_FARMACIA': 'Técnicos de Farmácia',
    'ANALISES_CLINICAS': 'Técnicos de Análises Clínicas'
};

// Função para buscar o UUID real da categoria no banco de dados
async function getCategoryUUID(frontendCategoryId) {
    if (!frontendCategoryId) return null;

    // Se já for um UUID (contém hífens), retornar direto
    if (frontendCategoryId.includes('-')) {
        return frontendCategoryId;
    }

    // Buscar o nome da categoria pelo ID do frontend
    const categoryName = CATEGORY_MAP[frontendCategoryId];
    // Se não encontrar no mapa, tenta usar o próprio ID como fallback parcial ou nome direto
    const searchTerm = categoryName || frontendCategoryId;

    console.log(`[Quiz] Buscando UUID para categoria: ${frontendCategoryId} -> ${searchTerm}`);

    // Buscar o UUID na tabela categories
    const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', `%${searchTerm}%`)
        .limit(1);

    if (error || !data || data.length === 0) {
        console.log(`[Quiz] UUID não encontrado para categoria: ${searchTerm}`);
        // Log available categories for debugging
        const { data: allCats } = await supabase.from('categories').select('name');
        if (allCats) {
            console.log(`[Quiz] Categorias disponíveis no banco: ${allCats.map(c => c.name).join(', ')}`);
        }
        return null;
    }

    console.log(`[Quiz] Mapeado ${frontendCategoryId} -> ${data[0].name} -> UUID: ${data[0].id}`);
    return data[0].id;
}

// Limite de questionários para utilizadores de teste (sem plano Pro/Premier)
const TRIAL_QUIZ_LIMIT = 5;

/**
 * Obtém o IP real do cliente, considerando proxies (Render/Vercel)
 */
function getClientIp(request) {
    // Tentar X-Forwarded-For primeiro (proxies)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
        // X-Forwarded-For pode conter múltiplos IPs: "client, proxy1, proxy2"
        const ips = forwardedFor.split(',').map(ip => ip.trim());
        return ips[0]; // Primeiro IP é o cliente real
    }

    // Tentar X-Real-IP (alguns proxies usam este)
    const realIp = request.headers['x-real-ip'];
    if (realIp) return realIp;

    // Fallback para IP direto da conexão
    return request.ip || request.connection?.remoteAddress || 'unknown';
}

/**
 * Verifica se o utilizador tem plano Pro ou Premier
 * CORRIGIDO: Verifica AMBAS as tabelas profiles E user_profiles
 */
async function hasProPlan(userId) {
    if (!userId) {
        console.log('[Quiz] hasProPlan: userId não fornecido');
        return false;
    }

    const proPlans = ['pro', 'premier', 'premium', 'pro_plan', 'premium_plan', 'premier_plan'];

    try {
        // VERIFICAÇÃO 1: Tabela user_profiles (por user_id)
        const { data: userProfileData, error: userProfileError } = await supabase
            .from('user_profiles')
            .select('plan, email')
            .eq('user_id', userId)
            .single();

        if (!userProfileError && userProfileData?.plan) {
            const normalizedPlan = userProfileData.plan.toLowerCase().trim();
            const isPro = proPlans.includes(normalizedPlan);
            console.log(`[Quiz] hasProPlan: userId=${userId}, fonte=user_profiles (by user_id), plan="${userProfileData.plan}", isPro=${isPro}`);
            if (isPro) return true;
        }

        // VERIFICAÇÃO 2: Tabela profiles (tabela original do Supabase Auth)
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('plan, email')
            .eq('id', userId)
            .single();

        if (!profileError && profileData?.plan) {
            const normalizedPlan = profileData.plan.toLowerCase().trim();
            const isPro = proPlans.includes(normalizedPlan);
            console.log(`[Quiz] hasProPlan: userId=${userId}, fonte=profiles, plan="${profileData.plan}", isPro=${isPro}`);
            if (isPro) return true;

            // VERIFICAÇÃO 3: Se temos o email, verificar user_profiles por email
            if (profileData.email) {
                const { data: userProfileByEmail, error: emailError } = await supabase
                    .from('user_profiles')
                    .select('plan')
                    .eq('email', profileData.email)
                    .single();

                if (!emailError && userProfileByEmail?.plan) {
                    const emailNormalizedPlan = userProfileByEmail.plan.toLowerCase().trim();
                    const isProByEmail = proPlans.includes(emailNormalizedPlan);
                    console.log(`[Quiz] hasProPlan: userId=${userId}, fonte=user_profiles (by email: ${profileData.email}), plan="${userProfileByEmail.plan}", isPro=${isProByEmail}`);
                    if (isProByEmail) return true;
                }
            }
        }

        console.log(`[Quiz] hasProPlan: userId=${userId}, resultado final: NÃO É PRO`);
        return false;
    } catch (e) {
        console.error('[Quiz] Erro ao verificar plano:', e);
        return false;
    }
}

/**
 * Verifica limite de questionários de teste por IP
 */
async function checkTrialLimit(ipAddress, userId = null) {
    try {
        // 1. [NEW] Check User Limit if authenticated
        if (userId) {
            const { data: userData, error: userError } = await supabase
                .from('user_limits')
                .select('quiz_count, blocked_until, is_blocked, block_reason')
                .eq('user_id', userId)
                .single();

            if (userError && userError.code !== 'PGRST116') {
                console.error('[Quiz Trial] Error checking user limit:', userError);
                // Safe default
                return { count: 0, limit: TRIAL_QUIZ_LIMIT, canTakeQuiz: true };
            }

            if (userData) {
                // Check User Blocks
                if (userData.is_blocked) {
                    return {
                        count: userData.quiz_count,
                        limit: TRIAL_QUIZ_LIMIT,
                        canTakeQuiz: false,
                        blocked: true,
                        reason: userData.block_reason || 'Conta bloqueada'
                    };
                }

                if (userData.blocked_until && new Date(userData.blocked_until) > new Date()) {
                    return {
                        count: userData.quiz_count,
                        limit: TRIAL_QUIZ_LIMIT,
                        canTakeQuiz: false,
                        blocked: true,
                        blockedUntil: new Date(userData.blocked_until),
                        reason: userData.block_reason || 'Conta bloqueada temporariamente'
                    };
                }

                // Check Count
                return {
                    count: userData.quiz_count,
                    limit: TRIAL_QUIZ_LIMIT,
                    canTakeQuiz: userData.quiz_count < TRIAL_QUIZ_LIMIT
                };
            } else {
                // User has no record yet -> Empty start
                return {
                    count: 0,
                    limit: TRIAL_QUIZ_LIMIT,
                    canTakeQuiz: true
                };
            }
        }

        // 2. [FALLBACK] Check IP Limit if no user (Anonymous)
        const { data, error } = await supabase
            .from('trial_quiz_limits')
            .select('quiz_count, first_quiz_at, last_quiz_at, blocked_until, is_permanently_blocked, block_reason, last_user_id')
            .eq('ip_address', ipAddress)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            console.error('[Quiz Trial] Erro ao buscar limite:', error);
            // Em caso de erro, permite por segurança (fail open) ou bloqueia?
            // Melhor permitir padrão, mas logar erro
            return { count: 0, limit: TRIAL_QUIZ_LIMIT, canTakeQuiz: true };
        }

        // Se não existe registro, está limpo
        if (!data) {
            return {
                count: 0,
                limit: TRIAL_QUIZ_LIMIT,
                canTakeQuiz: true,
                firstQuizAt: null,
                lastQuizAt: null
            };
        }

        // 1. Verificar Bloqueio Permanente
        if (data.is_permanently_blocked) {
            return {
                count: data.quiz_count,
                limit: TRIAL_QUIZ_LIMIT,
                canTakeQuiz: false,
                blocked: true,
                reason: data.block_reason || 'Bloqueio permanente'
            };
        }

        // 2. Verificar Bloqueio Temporário
        if (data.blocked_until) {
            const blockedUntil = new Date(data.blocked_until);
            if (blockedUntil > new Date()) {
                return {
                    count: data.quiz_count,
                    limit: TRIAL_QUIZ_LIMIT,
                    canTakeQuiz: false,
                    blocked: true,
                    blockedUntil: blockedUntil,
                    reason: data.block_reason || `Bloqueio temporário até ${blockedUntil.toLocaleString()}`
                };
            }
        }

        const count = data.quiz_count || 0;
        return {
            count,
            limit: TRIAL_QUIZ_LIMIT,
            canTakeQuiz: count < TRIAL_QUIZ_LIMIT,
            firstQuizAt: data.first_quiz_at,
            lastQuizAt: data.last_quiz_at
        };
    } catch (e) {
        console.error('[Quiz Trial] Erro ao verificar limite:', e);
        return { count: 0, limit: TRIAL_QUIZ_LIMIT, canTakeQuiz: true };
    }
}

/**
 * Incrementa o contador de questionários para um IP
 */
async function incrementTrialCount(ipAddress, userId = null) {
    try {
        // 1. [NEW] Increment User Count
        if (userId) {
            // Check if exists
            const { data: existingUser } = await supabase
                .from('user_limits')
                .select('quiz_count')
                .eq('user_id', userId)
                .single();

            if (existingUser) {
                const { error } = await supabase
                    .from('user_limits')
                    .update({
                        quiz_count: existingUser.quiz_count + 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', userId);
                if (error) throw error;
                return { count: existingUser.quiz_count + 1, success: true };
            } else {
                const { error } = await supabase
                    .from('user_limits')
                    .insert({
                        user_id: userId,
                        quiz_count: 1
                    });
                if (error) throw error;
                return { count: 1, success: true };
            }
        }

        // 2. [FALLBACK] Increment IP Count (Anonymous)
        // Tentar atualizar registro existente
        const { data: existing } = await supabase
            .from('trial_quiz_limits')
            .select('quiz_count')
            .eq('ip_address', ipAddress)
            .single();

        if (existing) {
            // Atualizar contador existente
            const updates = {
                quiz_count: existing.quiz_count + 1,
                last_quiz_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            // Deprecated: userId stored here only for legacy tracking if mixed usage
            // if (userId) updates.last_user_id = userId;

            const { error } = await supabase
                .from('trial_quiz_limits')
                .update(updates)
                .eq('ip_address', ipAddress);

            if (error) throw error;
            return { count: existing.quiz_count + 1, success: true };
        } else {
            // Criar novo registro
            const insertData = {
                ip_address: ipAddress,
                quiz_count: 1,
                first_quiz_at: new Date().toISOString(),
                last_quiz_at: new Date().toISOString()
            };
            // if (userId) insertData.last_user_id = userId;

            const { error } = await supabase
                .from('trial_quiz_limits')
                .insert(insertData);

            if (error) throw error;
            return { count: 1, success: true };
        }
    } catch (e) {
        console.error('[Quiz Trial] Erro ao incrementar contador:', e);
        return { count: 0, success: false, error: e.message };
    }
}

export default async function quizRoutes(fastify, options) {

    /**
     * GET /trial-quiz-limit
     * Verifica o estado do limite de questionários de teste para o IP atual
     * Retorna se o utilizador pode fazer mais questionários e quantos restam
     */
    fastify.get('/trial-quiz-limit', async (request, reply) => {
        const ipAddress = getClientIp(request);
        console.log(`[Quiz Trial] ========================================`);
        console.log(`[Quiz Trial] Verificando limite para IP: ${ipAddress}`);
        console.log(`[Quiz Trial] Headers recebidos:`, {
            authorization: request.headers.authorization ? 'presente' : 'ausente',
            deviceId: request.headers['x-device-id'] ? 'presente' : 'ausente'
        });

        // Verificar se há utilizador autenticado com plano Pro/Premier
        let userHasProPlan = false;
        let userId = null;
        let userPlan = null;

        if (request.headers.authorization && request.headers['x-device-id']) {
            try {
                console.log(`[Quiz Trial] Tentando autenticar utilizador...`);
                await authenticate(request, reply);
                if (reply.sent) return;

                if (request.user?.id) {
                    userId = request.user.id;
                    console.log(`[Quiz Trial] Utilizador autenticado: ${userId}`);
                    userHasProPlan = await hasProPlan(userId);

                    // Buscar plano para logging
                    const { data } = await supabase.from('profiles').select('plan').eq('id', userId).single();
                    userPlan = data?.plan;

                    console.log(`[Quiz Trial] Plano do utilizador: "${userPlan}", hasProPlan: ${userHasProPlan}`);
                } else {
                    console.log(`[Quiz Trial] Autenticação OK mas sem user ID`);
                }
            } catch (authErr) {
                console.warn('[Quiz Trial] Auth check failed:', authErr.message || authErr);
            }
        } else {
            console.log(`[Quiz Trial] Sem headers de autenticação - utilizador anónimo`);
        }

        // Utilizadores Pro/Premier não têm limite
        if (userHasProPlan) {
            console.log(`[Quiz Trial] ✅ Utilizador ${userId} é PRO/PREMIUM - acesso ilimitado`);
            return {
                hasProPlan: true,
                canTakeQuiz: true,
                count: 0,
                limit: TRIAL_QUIZ_LIMIT,
                remaining: Infinity,
                message: 'Acesso ilimitado com plano Pro/Premier'
            };
        }

        // Verificar limite por IP
        console.log(`[Quiz Trial] Utilizador NÃO é Pro - verificando limite por IP ou UserID`);
        const limitStatus = await checkTrialLimit(ipAddress, userId);
        console.log(`[Quiz Trial] Status do limite:`, limitStatus);

        const response = {
            hasProPlan: false,
            canTakeQuiz: limitStatus.canTakeQuiz,
            count: limitStatus.count,
            limit: limitStatus.limit,
            remaining: Math.max(0, limitStatus.limit - limitStatus.count),
            firstQuizAt: limitStatus.firstQuizAt,
            lastQuizAt: limitStatus.lastQuizAt,
            message: limitStatus.canTakeQuiz
                ? `Você tem ${limitStatus.limit - limitStatus.count} questionários gratuitos restantes`
                : 'Limite de questionários gratuitos atingido. Assine o plano Pro ou Premier para continuar.'
        };

        console.log(`[Quiz Trial] Resposta:`, response);
        console.log(`[Quiz Trial] ========================================`);

        return response;
    });

    /**
     * POST /trial-quiz-limit/increment
     * Incrementa o contador de questionários para o IP atual
     * Chamado quando o utilizador completa um questionário
     */
    fastify.post('/trial-quiz-limit/increment', async (request, reply) => {
        const ipAddress = getClientIp(request);
        console.log(`[Quiz Trial] Incrementando contador para IP: ${ipAddress}`);

        // Verificar se há utilizador autenticado com plano Pro/Premier
        let userHasProPlan = false;
        if (request.headers.authorization && request.headers['x-device-id']) {
            try {
                await authenticate(request, reply);
                if (reply.sent) return;

                if (request.user?.id) {
                    userHasProPlan = await hasProPlan(request.user.id);
                }
            } catch (authErr) {
                console.warn('[Quiz Trial] Auth check failed:', authErr);
            }
        }

        // Utilizadores Pro/Premier não precisam incrementar
        if (userHasProPlan) {
            return {
                success: true,
                hasProPlan: true,
                message: 'Utilizador com plano Pro/Premier - sem limite'
            };
        }

        // Incrementar contador
        const userId = request.user?.id;
        const result = await incrementTrialCount(ipAddress, userId);
        const remaining = Math.max(0, TRIAL_QUIZ_LIMIT - result.count);

        return {
            success: result.success,
            hasProPlan: false,
            count: result.count,
            limit: TRIAL_QUIZ_LIMIT,
            remaining,
            canContinue: remaining > 0,
            message: remaining > 0
                ? `Questionário registrado. Restam ${remaining} questionários gratuitos.`
                : 'Limite de questionários gratuitos atingido. Assine o plano Pro ou Premier para continuar.'
        };
    });
    fastify.post('/generate/quiz', async (request, reply) => {
        const { topic, category_id, topic_filter } = request.body;
        const ipAddress = getClientIp(request);

        if (!topic) {
            return reply.code(400).send({ error: 'Topic is required' });
        }

        // Attempt Authentication to check for Pro Plan
        // Attempt Authentication to check for Pro Plan
        const hasAuth = !!request.headers.authorization;
        const hasDevice = !!request.headers['x-device-id'];

        console.log(`[Quiz] Headers check - Auth: ${hasAuth}, DeviceID: ${hasDevice}`);

        if (hasAuth && hasDevice) {
            try {
                await authenticate(request, reply);
                if (reply.sent) return; // Auth failed and sent response
            } catch (authErr) {
                console.warn("[Quiz] Auth attempt failed:", authErr);
            }
        } else {
            if (hasAuth && !hasDevice) {
                console.warn("[Quiz] Auth header present but missing Device-ID - skipping auth");
            }
        }

        const user = request.user;
        const userId = user?.id;

        // 🔒 VERIFICAÇÃO DE LIMITE DE TRIAL 🔒
        // Se usuário tem plano Pro/Premier, pula verificação
        let hasUnlimitedAccess = false;
        if (userId) {
            hasUnlimitedAccess = await hasProPlan(userId);
        }

        if (!hasUnlimitedAccess) {
            const limitStatus = await checkTrialLimit(ipAddress, userId);
            if (!limitStatus.canTakeQuiz) {
                console.warn(`[Quiz] Bloqueado por limite de trial atingido (${limitStatus.count}/${limitStatus.limit}) - User: ${userId || 'Anon'}, IP: ${ipAddress}`);
                return reply.code(403).send({
                    error: 'Limite de questionários gratuitos atingido. Assine o plano Pro ou Premier.',
                    code: 'TRIAL_LIMIT_EXCEEDED'
                });
            }
        }

        try {
            // Buscar questões de quiz EXCLUSIVAMENTE do banco de dados
            let existingQuestions = [];
            let dbError = null;

            console.log(`[Quiz] Recebido - topic: ${topic}, category_id: ${category_id}, topic_filter: ${topic_filter || 'all'}, user: ${userId || 'anon'}`);

            // Converter o category_id do frontend para UUID do banco de dados
            const realCategoryId = await getCategoryUUID(category_id);
            console.log(`[Quiz] category_id convertido: ${category_id} -> ${realCategoryId}`);

            // Strategy 1: If category_id is provided, get questions ONLY from that category
            if (realCategoryId) {
                let query = supabase
                    .from('questions')
                    .select('id, content, topic, category_id')
                    .eq('category_id', realCategoryId)
                    .eq('type', 'quiz'); // Filtrar apenas questões de quiz, não flashcards

                // FILTRAR POR TÓPICO SE FORNECIDO E NÃO FOR 'all'
                if (topic_filter && topic_filter.trim() && topic_filter.toLowerCase() !== 'all') {
                    query = query.eq('topic', topic_filter.trim());
                    console.log(`[Quiz] Filtrando por tópico: ${topic_filter}`);
                }

                // EXCLUIR VISTAS SE USUÁRIO LOGADO
                if (userId) {
                    try {
                        const { data: usedHistory } = await supabase
                            .from('user_question_history')
                            .select('question_id')
                            .eq('user_id', userId);

                        if (usedHistory && usedHistory.length > 0) {
                            const usedIds = usedHistory.map(h => h.question_id);
                            // Only exclude if we have used questions
                            // Note: 'not.in' can be slow with thousands of IDs, but acceptable for this scale
                            query = query.not('id', 'in', `(${usedIds.join(',')})`);
                        }
                    } catch (hErr) {
                        console.warn("[Quiz] Failed to fetch history:", hErr);
                        // Determine whether to create table or ignore
                        // For now ignore history error
                    }
                }

                // Increase limit to allow for 20 questions
                query = query.limit(50);

                const { data, error } = await query;

                existingQuestions = data || [];
                dbError = error;
                console.log(`[Quiz] Strategy 1 (category_id=${realCategoryId}): encontradas ${existingQuestions.length} questões`);
            }

            // Return database questions if found
            if (!dbError && existingQuestions && existingQuestions.length > 0) {
                // Shuffle and pick up to 20
                const shuffled = existingQuestions.sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 20); // CHANGED FROM 5 TO 20

                // REGISTRAR QUE O USUÁRIO VIU ESTAS QUESTÕES
                if (userId && selected.length > 0) {
                    const viewRecords = selected.map(q => ({
                        user_id: userId,
                        question_id: q.id
                    }));

                    try {
                        const { error: insertError } = await supabase
                            .from('user_question_history')
                            .insert(viewRecords)
                            .select(); // To verify if table exists

                        if (insertError) {
                            console.warn("[Quiz] Failed to record usage (table missing?):", insertError.message);
                            // If table missing, we can try to create it here? No, unsafe. 
                        } else {
                            console.log(`[Quiz] Registradas ${selected.length} questões como usadas para ${userId}`);
                        }
                    } catch (recErr) {
                        console.warn("[Quiz] History record error:", recErr);
                    }
                }

                // Save History (Quiz Generation Event) ?
                // The user requirements say "APÓS GERAR... SALVAR HISTÓRICO". 
                // This could mean logging the quiz session.
                if (userId) {
                    try {
                        await supabase.from('user_quiz_history').insert({
                            user_id: userId,
                            total_questions: selected.length,
                            category_id: realCategoryId,
                            topic: topic
                        });
                    } catch (histErr) {
                        // ignore if table missing
                        console.warn("[Quiz] Failed to save quiz history:", histErr.message);
                    }
                }

                const formattedQuiz = selected.map(q => q.content);
                console.log(`[Quiz] Retornando ${formattedQuiz.length} questões de quiz do banco de dados`);
                return { type: 'quiz', data: formattedQuiz, source: 'database' };
            }

            // Não há questões no banco de dados
            console.log(`[Quiz] Nenhuma questão encontrada no banco de dados`);
            return reply.code(404).send({
                error: 'Não há questões disponíveis para esta categoria (ou todas já foram respondidas). Por favor, contacte o administrador para adicionar questões.',
                message: 'Nenhuma questão encontrada no banco de dados',
                type: 'no_questions'
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: `Failed to generate quiz: ${error.message}` });
        }
    });

    /**
     * POST /quiz/session/start
     * Inicia uma nova sessão de quiz para monitoramento de progresso
     */
    fastify.post('/quiz/session/start', async (request, reply) => {
        const ipAddress = getClientIp(request);

        // Ensure authentication runs if headers are present
        if (request.headers.authorization && !request.user) {
            try {
                await authenticate(request, reply);
            } catch (e) {
                console.warn('[Quiz Session] Auth failed:', e.message);
            }
        }

        const finalUserId = request.user?.id;
        console.log(`[Quiz Session] Start request from IP: ${ipAddress}, UserID: ${finalUserId}`);

        try {
            // Verificar limites antes de criar
            // Para usuários free, verificar trial limit (quizzes count)
            const isPro = await hasProPlan(finalUserId);

            if (!isPro) {
                const limitStatus = await checkTrialLimit(ipAddress, finalUserId);
                if (!limitStatus.canTakeQuiz) {
                    return reply.code(403).send({ error: 'Limite de questionários atingido.' });
                }
            }

            // Criar sessão
            const { data, error } = await supabase
                .from('quiz_sessions')
                .insert({
                    user_id: finalUserId,
                    ip_address: ipAddress,
                    questions_answered: 0,
                    status: 'active'
                })
                .select('id')
                .single();

            if (error) {
                // Se tabela não existir (ainda não migrada), falhar graciosamente ou logar
                console.error('[Quiz Session] Falha ao criar sessão:', error);
                // Fallback: retornar session_id falso para não bloquear o frontend se a tabela não existir
                // MAS como o requisito é "Garantir", idealmente deveríamos tratar o erro. 
                // Vamos assumir que o migration foi rodado.
                return reply.code(500).send({ error: 'Erro ao iniciar sessão de monitoramento' });
            }

            return { success: true, sessionId: data.id };
        } catch (e) {
            console.error('[Quiz Session] Erro:', e);
            return reply.code(500).send({ error: e.message });
        }
    });

    /**
     * POST /quiz/session/progress
     * Verifica e incrementa o progresso. Bloqueia se atingir 5 questões no plano Free.
     */
    fastify.post('/quiz/session/progress', async (request, reply) => {
        const { sessionId, answer_count } = request.body;

        if (!sessionId) {
            return reply.code(400).send({ error: 'Session ID required' });
        }

        try {
            // Buscar sessão
            const { data: session, error } = await supabase
                .from('quiz_sessions')
                .select('*')
                .eq('id', sessionId)
                .single();

            if (error || !session) {
                console.warn(`[Quiz Progress] Session not found: ${sessionId}`);
                return reply.code(404).send({ error: 'Sessão não encontrada' });
            }

            const userId = session.user_id;
            console.log(`[Quiz Progress] Session: ${sessionId}, UserID: ${userId}, Answered: ${session.questions_answered}`);

            // SEMPRE re-verificar o plano diretamente da base de dados
            const isPro = await hasProPlan(userId);
            console.log(`[Quiz Progress] User ${userId} isPro=${isPro}, questionsAnswered=${session.questions_answered}`);

            // PRO/PREMIUM: SEMPRE permitir - sem limite de questões
            if (isPro) {
                console.log(`[Quiz Progress] ✅ User ${userId} is PRO/PREMIUM - unlimited access granted`);

                // Incrementar para estatísticas, mas NÃO bloquear
                await supabase.from('quiz_sessions')
                    .update({
                        questions_answered: session.questions_answered + 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', sessionId);

                return {
                    allowed: true,
                    count: session.questions_answered + 1,
                    isPro: true,
                    reason: null
                };
            }

            // PLANO GRATUITO: Verificar limite de 5 questões
            if (session.questions_answered >= 5) {
                console.log(`[Quiz Progress] ❌ Blocking user ${userId} (Plan Free) at count ${session.questions_answered}`);
                return {
                    allowed: false,
                    reason: 'question_limit',
                    message: 'Limite de 5 questões atingido no plano Gratuito.',
                    isPro: false
                };
            }

            // Incrementar contador
            const { error: updateError } = await supabase
                .from('quiz_sessions')
                .update({
                    questions_answered: session.questions_answered + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', sessionId);

            if (updateError) throw updateError;

            const newCount = session.questions_answered + 1;
            const willBlockNext = newCount >= 5;

            console.log(`[Quiz Progress] User ${userId} (Free): count=${newCount}, willBlockNext=${willBlockNext}`);

            return {
                allowed: true,
                count: newCount,
                isPro: false,
                reason: willBlockNext ? 'question_limit_next' : null,
                message: willBlockNext ? 'Esta é sua última questão gratuita.' : null
            };

        } catch (e) {
            console.error('[Quiz Session] Error:', e);
            return reply.code(500).send({ error: e.message });
        }
    });

    /**
     * POST /quiz/result - MANTENHA O EXISTENTE
     */
    fastify.post('/quiz/result', async (request, reply) => {
        const { category_id, topic, score, total_questions } = request.body;

        // Tentar autenticar
        if (request.headers.authorization && request.headers['x-device-id']) {
            try {
                await authenticate(request, reply);
                if (reply.sent) return;
            } catch (authErr) {
                console.warn("[Quiz Result] Auth attempt failed:", authErr);
            }
        }

        const userId = request.user?.id;

        if (!userId) {
            return reply.code(401).send({ error: 'Autenticação necessária para guardar resultados' });
        }

        if (score === undefined || total_questions === undefined) {
            return reply.code(400).send({ error: 'Score e total_questions são obrigatórios' });
        }

        try {
            const realCategoryId = await getCategoryUUID(category_id);

            const { error: insertError } = await supabase
                .from('user_quiz_history')
                .insert({
                    user_id: userId,
                    category_id: realCategoryId,
                    topic: topic || 'Quiz',
                    total_questions: total_questions,
                    score: score,
                    created_at: new Date().toISOString()
                });

            if (insertError) {
                console.error('[Quiz Result] Failed to save:', insertError);
                return reply.code(500).send({ error: 'Falha ao guardar resultado do quiz' });
            }

            // Fechar sessão se existir (opcional, não temos session_id aqui no body original)
            // Mas podemos deixar aberta ou expirar por tempo.

            console.log(`[Quiz Result] Saved: user=${userId}, score=${score}/${total_questions}`);
            return { success: true, message: 'Resultado do quiz guardado com sucesso' };

        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: `Falha ao guardar resultado: ${error.message}` });
        }
    });

    /**
     * POST /flashcards/result
     */
    fastify.post('/flashcards/result', async (request, reply) => {
        const { category_id, cards_reviewed, mastered } = request.body;

        // Tentar autenticar
        if (request.headers.authorization && request.headers['x-device-id']) {
            try {
                await authenticate(request, reply);
                if (reply.sent) return;
            } catch (authErr) {
                console.warn("[Flashcard Result] Auth attempt failed:", authErr);
            }
        }

        const userId = request.user?.id;

        if (!userId) {
            return reply.code(401).send({ error: 'Autenticação necessária para guardar resultados' });
        }

        if (cards_reviewed === undefined) {
            return reply.code(400).send({ error: 'cards_reviewed é obrigatório' });
        }

        try {
            const realCategoryId = await getCategoryUUID(category_id);

            const { error: insertError } = await supabase
                .from('user_flashcard_history')
                .insert({
                    user_id: userId,
                    category_id: realCategoryId,
                    cards_reviewed: cards_reviewed,
                    mastered: mastered || 0,
                    created_at: new Date().toISOString()
                });

            if (insertError) {
                console.error('[Flashcard Result] Failed to save:', insertError);
                return reply.code(500).send({ error: 'Falha ao guardar resultado dos flashcards' });
            }

            console.log(`[Flashcard Result] Saved: user=${userId}, reviewed=${cards_reviewed}, mastered=${mastered}`);
            return { success: true, message: 'Resultado dos flashcards guardado com sucesso' };

        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: `Falha ao guardar resultado: ${error.message}` });
        }
    });
}
