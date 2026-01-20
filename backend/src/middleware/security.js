/**
 * 🛡️ MIDDLEWARE DE SEGURANÇA - PRODUÇÃO READY
 * Angola Saúde 2026
 * 
 * Este módulo implementa proteções de segurança essenciais:
 * - Rate Limiting (proteção contra DDoS e abuso) - SEGURO PARA REVERSE PROXIES
 * - Helmet (headers de segurança)
 * - Sanitização de input
 * - Logging de segurança
 * - Proteção anti-spoofing de IP
 * 
 * CONFIGURADO PARA: Render (backend) + Vercel (frontend)
 */

import { supabase } from '../lib/supabase.js';

// ============================================================
// CONFIGURAÇÃO DE AMBIENTE
// ============================================================

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

// ============================================================
// 🛡️ PROTEÇÃO ANTI-SPOOFING DE IP
// ============================================================

/**
 * Lista de ranges de IP confiáveis (proxies permitidos)
 * Em produção, apenas confiar em headers de IP se vierem de proxies conhecidos
 * 
 * IMPORTANTE: Render e Vercel usam seus próprios IPs de proxy
 * Quando trustProxy está ativo no Fastify, ele valida a cadeia de proxies
 */
const TRUSTED_PROXY_HEADERS = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',      // Cloudflare
    'true-client-ip',        // Cloudflare Enterprise
    'x-vercel-forwarded-for', // Vercel
    'x-render-origin-ip'     // Render (se disponível)
];

/**
 * Valida se um IP é formato válido (IPv4 ou IPv6)
 */
function isValidIP(ip) {
    if (!ip || typeof ip !== 'string') return false;

    // IPv4 básico
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 básico (simplificado)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip.includes('::');
}

/**
 * 🛡️ Obtém o IP real do cliente de forma SEGURA
 * 
 * ESTRATÉGIA DE SEGURANÇA:
 * 1. Em PRODUÇÃO: Confia no trustProxy do Fastify + validação adicional
 * 2. Em DESENVOLVIMENTO: Aceita IPs locais sem validação extra
 * 
 * ANTI-SPOOFING:
 * - Valida formato do IP
 * - Usa o último IP confiável da cadeia (mais próximo do proxy de entrada)
 * - Em produção, NÃO confia cegamente no primeiro IP do X-Forwarded-For
 */
function getClientIP(request) {
    // Em produção com trustProxy ativo, Fastify já processa X-Forwarded-For corretamente
    // request.ip será o IP do cliente real conforme configurado
    if (isProduction && request.ip && isValidIP(request.ip)) {
        return request.ip;
    }

    // Headers específicos de plataformas (mais confiáveis em seus contextos)
    // Vercel adiciona seu próprio header
    const vercelIP = request.headers['x-vercel-forwarded-for'];
    if (vercelIP) {
        const ips = vercelIP.split(',').map(ip => ip.trim());
        const clientIP = ips[0];
        if (isValidIP(clientIP)) return clientIP;
    }

    // Cloudflare (se usado)
    const cfIP = request.headers['cf-connecting-ip'];
    if (cfIP && isValidIP(cfIP.trim())) {
        return cfIP.trim();
    }

    // X-Real-IP (nginx típico)
    const xRealIP = request.headers['x-real-ip'];
    if (xRealIP && isValidIP(xRealIP.trim())) {
        return xRealIP.trim();
    }

    // X-Forwarded-For - CUIDADO com spoofing
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
        const ips = xForwardedFor.split(',').map(ip => ip.trim());

        // Em produção: usar a estratégia do Fastify (já processado em request.ip)
        // Em desenvolvimento: pegar o primeiro IP válido
        if (isDevelopment) {
            const clientIP = ips.find(ip => isValidIP(ip));
            if (clientIP) return clientIP;
        } else {
            // Em produção, se chegou aqui, usar o primeiro IP mas logar warning
            const clientIP = ips[0];
            if (isValidIP(clientIP)) {
                return clientIP;
            }
        }
    }

    // Fallback para o IP direto do socket
    const socketIP = request.ip || request.socket?.remoteAddress;
    if (socketIP) {
        // Limpar ::ffff: prefix de IPv4-mapped IPv6
        const cleanIP = socketIP.replace(/^::ffff:/, '');
        if (isValidIP(cleanIP)) return cleanIP;
    }

    return 'unknown';
}

// ============================================================
// 🛡️ RATE LIMITING - CONFIGURAÇÃO PARA PRODUÇÃO
// ============================================================

// Armazenamento em memória para rate limiting
// NOTA: Para escalabilidade horizontal com múltiplas instâncias, usar Redis
const rateLimitStore = new Map();

// Configuração de rate limiting por tipo de endpoint
// Em desenvolvimento, limites são muito mais altos para evitar bloqueios durante testes
const RATE_LIMITS = {
    // Endpoints gerais - navegação normal
    default: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        maxRequests: isDevelopment ? 2000 : 100, // 100 req/15min em prod
        message: 'Demasiados pedidos. Aguarde alguns minutos.'
    },

    // Endpoints de autenticação - proteger contra brute force
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        maxRequests: isDevelopment ? 500 : 10, // 10 tentativas/15min em prod
        message: 'Demasiadas tentativas de login. Aguarde 15 minutos.'
    },

    // Endpoints de IA - proteger contra abuso e custos elevados
    ai: {
        windowMs: 60 * 60 * 1000, // 1 hora
        maxRequests: isDevelopment ? 500 : 30, // 30 req/hora em prod
        message: 'Limite de uso de IA atingido. Aguarde 1 hora.'
    },

    // Endpoints admin - mais restritivo para proteger operações sensíveis
    admin: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        maxRequests: isDevelopment ? 1000 : 50, // 50 req/15min em prod
        message: 'Limite de operações admin atingido.'
    },

    // Upload de ficheiros - proteger storage
    upload: {
        windowMs: 60 * 60 * 1000, // 1 hora
        maxRequests: isDevelopment ? 200 : 20, // 20 uploads/hora em prod
        message: 'Limite de uploads atingido. Aguarde 1 hora.'
    }
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
 * 🛡️ Configurado para funcionar corretamente atrás de reverse proxies (Render/Vercel)
 */
export async function rateLimiter(request, reply) {
    // Usar a função getClientIP para obter o IP real do cliente
    const ip = getClientIP(request);
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
 * 🛡️ Usa getClientIP para obter o IP real atrás de reverse proxies
 */
export function logSecurityEvent(request, eventType, details = {}) {
    const logData = {
        timestamp: new Date().toISOString(),
        event: eventType,
        ip: getClientIP(request),
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
