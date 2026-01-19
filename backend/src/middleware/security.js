/**
 * 🛡️ MIDDLEWARE DE SEGURANÇA
 * Angola Saúde 2026
 * 
 * Este módulo implementa proteções de segurança essenciais:
 * - Rate Limiting (proteção contra DDoS e abuso)
 * - Helmet (headers de segurança)
 * - Sanitização de input
 * - Logging de segurança
 */

import { supabase } from '../lib/supabase.js';

// ============================================================
// RATE LIMITING
// ============================================================

// Armazenamento em memória para rate limiting (usar Redis em produção)
const rateLimitStore = new Map();

// Configuração de rate limiting por tipo de endpoint
const RATE_LIMITS = {
    // Endpoints gerais
    default: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 req/15min

    // Endpoints de autenticação (proteger contra brute force)
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 tentativas/15min

    // Endpoints de IA (proteger contra abuso e custos)
    ai: { windowMs: 60 * 60 * 1000, maxRequests: 30 }, // 30 req/hora

    // Endpoints admin (mais restritivo)
    admin: { windowMs: 15 * 60 * 1000, maxRequests: 50 }, // 50 req/15min

    // Upload de ficheiros
    upload: { windowMs: 60 * 60 * 1000, maxRequests: 20 } // 20 uploads/hora
};

// Limpar entries expiradas periodicamente
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now - data.windowStart > data.windowMs * 2) {
            rateLimitStore.delete(key);
        }
    }
}, 60 * 1000); // Limpar a cada minuto

/**
 * Determina o tipo de rate limit baseado no path
 */
function getRateLimitType(path) {
    if (path.startsWith('/auth/')) return 'auth';
    if (path.startsWith('/generate/') || path.includes('/ai/')) return 'ai';
    if (path.startsWith('/users') || path.startsWith('/payments/proof')) return 'admin';
    if (path.includes('/upload') || path.includes('/proof')) return 'upload';
    return 'default';
}

/**
 * Middleware de Rate Limiting
 */
export async function rateLimiter(request, reply) {
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const userId = request.user?.id || 'anonymous';
    const path = request.url;

    // Criar chave única: IP + User + Tipo de endpoint
    const limitType = getRateLimitType(path);
    const key = `${ip}:${userId}:${limitType}`;
    const config = RATE_LIMITS[limitType];

    const now = Date.now();
    let data = rateLimitStore.get(key);

    if (!data || now - data.windowStart > config.windowMs) {
        // Nova janela de tempo
        data = {
            windowStart: now,
            windowMs: config.windowMs,
            count: 1
        };
        rateLimitStore.set(key, data);
    } else {
        data.count++;
    }

    // Headers informativos
    reply.header('X-RateLimit-Limit', config.maxRequests);
    reply.header('X-RateLimit-Remaining', Math.max(0, config.maxRequests - data.count));
    reply.header('X-RateLimit-Reset', new Date(data.windowStart + config.windowMs).toISOString());

    // Verificar se excedeu o limite
    if (data.count > config.maxRequests) {
        // Log de segurança
        request.log.warn({
            event: 'RATE_LIMIT_EXCEEDED',
            ip,
            userId,
            path,
            limitType,
            count: data.count
        });

        return reply.code(429).send({
            error: 'Demasiados pedidos. Por favor, aguarde antes de tentar novamente.',
            retryAfter: Math.ceil((data.windowStart + config.windowMs - now) / 1000)
        });
    }
}

// ============================================================
// RATE LIMITING ESPECÍFICO PARA IA (por utilizador)
// ============================================================

const aiUsageStore = new Map();

/**
 * Rate limiting específico para endpoints de IA
 * Limita por utilizador autenticado
 */
export async function aiRateLimiter(request, reply) {
    const userId = request.user?.id;
    const userEmail = request.user?.email;

    if (!userId) {
        return reply.code(401).send({ error: 'Autenticação necessária para usar funcionalidades de IA' });
    }

    // Obter plano do utilizador
    let userPlan = 'free';
    try {
        const { data } = await supabase
            .from('user_profiles')
            .select('plan')
            .eq('email', userEmail)
            .single();
        if (data?.plan) {
            userPlan = data.plan;
        }
    } catch (e) {
        // Assumir free se falhar
    }

    // Limites por plano
    const limits = {
        free: 10,      // 10 requests IA/hora
        lite: 30,      // 30 requests IA/hora
        pro: 100,      // 100 requests IA/hora
        premier: 500   // 500 requests IA/hora
    };

    const maxRequests = limits[userPlan] || limits.free;
    const windowMs = 60 * 60 * 1000; // 1 hora

    const now = Date.now();
    let data = aiUsageStore.get(userId);

    if (!data || now - data.windowStart > windowMs) {
        data = { windowStart: now, count: 1 };
        aiUsageStore.set(userId, data);
    } else {
        data.count++;
    }

    reply.header('X-AI-Limit', maxRequests);
    reply.header('X-AI-Remaining', Math.max(0, maxRequests - data.count));
    reply.header('X-AI-Plan', userPlan);

    if (data.count > maxRequests) {
        request.log.warn({
            event: 'AI_RATE_LIMIT_EXCEEDED',
            userId,
            plan: userPlan,
            count: data.count
        });

        return reply.code(429).send({
            error: `Limite de IA atingido para o plano ${userPlan}. Upgrade para mais requests.`,
            plan: userPlan,
            limit: maxRequests,
            retryAfter: Math.ceil((data.windowStart + windowMs - now) / 1000)
        });
    }
}

// ============================================================
// SANITIZAÇÃO DE INPUT
// ============================================================

/**
 * Sanitiza strings para prevenir prompt injection e XSS
 */
export function sanitizeInput(str) {
    if (typeof str !== 'string') return str;

    return str
        // Remover caracteres de controlo
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Prevenir prompt injection básico
        .replace(/(?:ignore|forget|disregard)\s+(?:previous|all|above)\s+(?:instructions?|prompts?)/gi, '[BLOCKED]')
        .replace(/(?:you are|act as|pretend to be|roleplay as)/gi, '[BLOCKED]')
        // Limitar tamanho
        .substring(0, 10000);
}

/**
 * Middleware para sanitizar body requests
 */
export async function sanitizeBody(request, reply) {
    if (request.body && typeof request.body === 'object') {
        request.body = sanitizeObject(request.body);
    }
}

function sanitizeObject(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }

    if (typeof obj === 'string') {
        return sanitizeInput(obj);
    }

    return obj;
}

// ============================================================
// HEADERS DE SEGURANÇA (Simula Helmet)
// ============================================================

/**
 * Adiciona headers de segurança às respostas
 */
export async function securityHeaders(request, reply) {
    // Prevenir XSS
    reply.header('X-XSS-Protection', '1; mode=block');

    // Prevenir sniffing de MIME type
    reply.header('X-Content-Type-Options', 'nosniff');

    // Prevenir clickjacking
    reply.header('X-Frame-Options', 'DENY');

    // Referrer policy
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Remover header que expõe tecnologia
    reply.removeHeader('X-Powered-By');

    // Content Security Policy (ajustar conforme necessário)
    reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");

    // Strict Transport Security (HTTPS)
    if (process.env.NODE_ENV === 'production') {
        reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
}

// ============================================================
// LOGGING DE SEGURANÇA
// ============================================================

/**
 * Log de eventos de segurança importantes
 */
export function logSecurityEvent(request, eventType, details = {}) {
    const logData = {
        timestamp: new Date().toISOString(),
        event: eventType,
        ip: request.ip || request.headers['x-forwarded-for'],
        userAgent: request.headers['user-agent'],
        userId: request.user?.id || 'anonymous',
        path: request.url,
        method: request.method,
        ...details
    };

    // Em produção, enviar para sistema de logging externo
    if (process.env.NODE_ENV === 'production') {
        // TODO: Integrar com logging service (Datadog, Sentry, etc.)
        console.log('[SECURITY]', JSON.stringify(logData));
    } else {
        request.log.info(logData, `[SECURITY] ${eventType}`);
    }
}

// ============================================================
// VALIDAÇÃO DE ORIGEM (CORS reforçado)
// ============================================================

/**
 * Lista de origens permitidas
 */
export function getAllowedOrigins() {
    const origins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173'
    ];

    // Adicionar domínios de produção
    if (process.env.FRONTEND_URL) {
        origins.push(process.env.FRONTEND_URL);
    }
    if (process.env.ALLOWED_ORIGINS) {
        origins.push(...process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()));
    }

    return origins;
}

/**
 * Verifica se a origem é permitida
 */
export function isOriginAllowed(origin) {
    if (!origin) return true; // Requests internos/server-side
    const allowed = getAllowedOrigins();
    return allowed.includes(origin);
}
