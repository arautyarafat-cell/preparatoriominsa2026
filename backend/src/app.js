import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
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

export async function buildApp() {
    const fastify = Fastify({
        logger: true
    });

    await fastify.register(cors, {
        origin: true, // Allow all origins dynamically
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Device-ID'],
        credentials: true,
        preflight: true,
        preflightContinue: false,
        optionsSuccessStatus: 204
    });

    await fastify.register(multipart, {
        limits: {
            fieldNameSize: 100, // Max field name size in bytes
            fieldSize: 1000000, // Max field value size in bytes (text fields)
            fields: 10,         // Max number of non-file fields
            fileSize: 10000000, // For multipart forms, the max file size in bytes (10MB)
            files: 1            // Max number of file fields
        }
    });

    // Health check
    fastify.get('/', async () => {
        return { status: 'ok', message: 'Angola Health Prep Backend API' };
    });

    // Register routes
    fastify.register(authRoutes);
    fastify.register(uploadRoutes);
    fastify.register(quizRoutes);
    fastify.register(flashcardRoutes);
    fastify.register(gameRoutes);
    fastify.register(correctionRoutes);
    fastify.register(syncRoutes);
    fastify.register(questionRoutes);
    fastify.register(contentRoutes);
    fastify.register(lessonRoutes); // Rotas de aulas digitais
    fastify.register(ttsRoutes);    // Rotas de Text-to-Speech com IA
    fastify.register(paymentRoutes); // Rotas de pagamento e comprovativos
    fastify.register(userRoutes);    // Rotas de gestão de usuários (Admin)
    fastify.register(materialRoutes); // Rotas de materiais complementares (PDFs)
    fastify.register(decipherRoutes); // Rotas do jogo "Decifre o Termo"
    fastify.register(settingsRoutes); // Rotas de configurações globais

    return fastify;
}

