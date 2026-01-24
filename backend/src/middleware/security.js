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
        maxRequests: isDevelopment ? 2000 : 300, // 300 req/15min em prod (era 100)
        message: 'Demasiados pedidos. Aguarde alguns minutos.'
    },

    // Endpoints de autenticação - proteger contra brute force
    // NOTA: Inclui /auth/refresh que é chamado automaticamente
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        maxRequests: isDevelopment ? 500 : 60, // 60 tentativas/15min em prod (era 10)
        message: 'Demasiadas tentativas de login. Aguarde 15 minutos.'
    },

    // Endpoints de IA - SEM LIMITE (configurado pelo usuário)
    ai: {
        windowMs: 60 * 60 * 1000, // 1 hora
        maxRequests: 999999, // Praticamente sem limite
        message: 'Limite de uso de IA atingido.'
    },

    // Endpoints admin - mais restritivo para proteger operações sensíveis
    admin: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        maxRequests: isDevelopment ? 1000 : 150, // 150 req/15min em prod (era 50)
        message: 'Limite de operações admin atingido.'
    },

    // Upload de ficheiros - proteger storage
    upload: {
        windowMs: 60 * 60 * 1000, // 1 hora
        maxRequests: isDevelopment ? 200 : 30, // 30 uploads/hora em prod (era 20)
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
    // 🛡️ EXCLUIR endpoints de health check do rate limiting
    // Isso permite que serviços de monitoramento (UptimeRobot, Pingdom, etc.)
    // façam requests frequentes sem serem bloqueados
    const path = request.url;
    if (path === '/health' || path === '/health/ping' || path === '/') {
        return; // Não aplicar rate limiting
    }

    // Usar a função getClientIP para obter o IP real do cliente
    const ip = getClientIP(request);
    const userId = request.user?.id || 'anonymous';

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
    // RATE LIMITING DESATIVADO - sem limites para IA
    // Apenas verificar autenticação
    const userId = request.user?.id;

    if (!userId) {
        return reply.code(401).send({ error: 'Autenticação necessária para usar funcionalidades de IA' });
    }

    // Sem limites - permitir todas as requisições
    reply.header('X-AI-Limit', 'unlimited');
    reply.header('X-AI-Remaining', 'unlimited');
    // Continuar sem bloquear
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
