import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';

// Routes
import uploadRoutes from './routes/upload.js';
import quizRoutes from './routes/quiz.js';
import flashcardRoutes from './routes/flashcards.js';
import gameRoutes from './routes/game.js';
import correctionRoutes from './routes/correction.js';
import syncRoutes from './routes/sync.js';
import authRoutes from './routes/auth.js';
import questionRoutes from './routes/questions.js';
import contentRoutes from './routes/content.js';
import lessonRoutes from './routes/lessons.js';
import ttsRoutes from './routes/tts.js';
import paymentRoutes from './routes/payments.js';
import userRoutes from './routes/users.js';
import materialRoutes from './routes/materials.js';
import decipherRoutes from './routes/decipher.js';
import settingsRoutes from './routes/settings.js';
import blockingRoutes from './routes/blocking.js';
import healthRoutes from './routes/health.js';
import securityRoutes from './routes/security.js';

// Security Middleware
import {
    rateLimiter,
    securityHeaders,
    sanitizeBody,
    getAllowedOrigins
} from './middleware/security.js';

export async function buildApp() {
    const isProduction = process.env.NODE_ENV === 'production';

    const fastify = Fastify({
        logger: {
            level: isProduction ? 'info' : 'debug',
            // Em produção, log estruturado para melhor análise
            ...(isProduction && {
                formatters: {
                    level: (label) => ({ level: label })
                }
            })
        },
        // Aumentar segurança do parser
        bodyLimit: 10485760, // 10MB max body
        caseSensitive: true,
        // 🛡️ CONFIGURAÇÃO CRÍTICA PARA REVERSE PROXIES (Render/Vercel)
        // 
        // trustProxy: true permite que Fastify confie nos headers X-Forwarded-*
        // Isso é NECESSÁRIO quando a aplicação está atrás de:
        // - Render.com (sempre atrás de proxy)
        // - Vercel (sempre atrás de proxy)
        // - Load balancers
        // - Nginx/Apache como reverse proxy
        //
        // Com trustProxy ativo:
        // - request.ip retorna o IP real do cliente (do X-Forwarded-For)
        // - request.protocol retorna 'https' corretamente
        // - request.hostname retorna o host correto
        //
        // SEGURANÇA: O middleware de rate limiting faz validação adicional
        // dos headers para prevenir spoofing de IP
        trustProxy: isProduction
    });

    // ============================================================
    // 🛡️ CONFIGURAÇÃO DE CORS SEGURO
    // ============================================================

    const allowedOrigins = getAllowedOrigins();

    await fastify.register(cors, {
        // Em produção: apenas origens permitidas
        // Em desenvolvimento: mais permissivo
        origin: (origin, callback) => {
            // Permitir requests sem origin (servidor a servidor, Postman, etc.)
            if (!origin) {
                callback(null, true);
                return;
            }

            if (isProduction) {
                // Produção: verificar lista de origens permitidas
                // Permitir também subdomínios do Vercel e Render para deploys de preview/staging
                const isAllowed = allowedOrigins.includes(origin) ||
                    origin.endsWith('.vercel.app') ||
                    origin.endsWith('.onrender.com') ||
                    origin.includes('angolasaude'); // Permitir domínio customizado se contiver o nome do projeto

                if (isAllowed) {
                    callback(null, true);
                } else {
                    fastify.log.warn(`CORS blocked origin: ${origin}`);
                    callback(new Error('Origem não permitida'), false);
                }
            } else {
                // Desenvolvimento: permitir localhost
                if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                    callback(null, true);
                } else {
                    callback(null, true); // Mais permissivo em dev
                }
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Device-ID'],
        credentials: true,
        preflight: true,
        preflightContinue: false,
        optionsSuccessStatus: 204,
        maxAge: 86400 // Cache preflight por 24h
    });

    // ============================================================
    // 🛡️ HEADERS DE SEGURANÇA (Hook em todas as respostas)
    // ============================================================

    fastify.addHook('onSend', async (request, reply) => {
        // Headers de segurança
        reply.header('X-XSS-Protection', '1; mode=block');
        reply.header('X-Content-Type-Options', 'nosniff');
        reply.header('X-Frame-Options', 'DENY');
        reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
        reply.removeHeader('X-Powered-By');

        if (isProduction) {
            reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
    });

    // ============================================================
    // 🛡️ RATE LIMITING GLOBAL
    // ============================================================

    fastify.addHook('onRequest', rateLimiter);

    // ============================================================
    // 🛡️ SANITIZAÇÃO DE INPUT
    // ============================================================

    fastify.addHook('preHandler', sanitizeBody);

    // ============================================================
    // MULTIPART (Uploads)
    // ============================================================

    await fastify.register(multipart, {
        limits: {
            fieldNameSize: 100,
            fieldSize: 1000000,
            fields: 10,
            fileSize: 10000000, // 10MB
            files: 1
        }
    });

    // ============================================================
    // HEALTH CHECK
    // ============================================================

    fastify.get('/', async () => {
        return {
            status: 'ok',
            message: 'Angola Health Prep Backend API',
            version: '1.0.0',
            environment: isProduction ? 'production' : 'development'
        };
    });

    // ============================================================
    // REGISTER ROUTES
    // ============================================================

    // Auth routes (public)
    fastify.register(authRoutes);

    // Content routes (mostly public with some protection)
    fastify.register(uploadRoutes);
    fastify.register(quizRoutes);
    fastify.register(flashcardRoutes);
    fastify.register(gameRoutes);
    fastify.register(correctionRoutes);
    fastify.register(syncRoutes);
    fastify.register(questionRoutes);
    fastify.register(contentRoutes);
    fastify.register(lessonRoutes);
    fastify.register(ttsRoutes);
    fastify.register(materialRoutes);
    fastify.register(decipherRoutes);
    fastify.register(settingsRoutes);
    fastify.register(blockingRoutes);
    fastify.register(healthRoutes);

    // Payment routes (mix of public and protected)
    fastify.register(paymentRoutes);

    // Admin routes (should have additional protection)
    fastify.register(userRoutes);
    fastify.register(securityRoutes);

    // ============================================================
    // ERROR HANDLER GLOBAL
    // ============================================================

    fastify.setErrorHandler((error, request, reply) => {
        // Log do erro
        request.log.error({
            err: error,
            url: request.url,
            method: request.method,
            ip: request.ip
        });

        // Em produção, não expor detalhes do erro
        if (isProduction) {
            // Erros de validação podem ser expostos
            if (error.validation) {
                return reply.code(400).send({
                    error: 'Dados inválidos',
                    details: error.validation
                });
            }

            // Erros genéricos
            return reply.code(error.statusCode || 500).send({
                error: 'Erro interno do servidor'
            });
        }

        // Em desenvolvimento, mostrar detalhes
        return reply.code(error.statusCode || 500).send({
            error: error.message,
            stack: error.stack
        });
    });

    // ============================================================
    // 404 HANDLER
    // ============================================================

    fastify.setNotFoundHandler((request, reply) => {
        reply.code(404).send({
            error: 'Endpoint não encontrado',
            path: request.url
        });
    });

    return fastify;
}
