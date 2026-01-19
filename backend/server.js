import { buildApp } from './src/app.js';
import { config } from './src/config/env.js';

const start = async () => {
    const app = await buildApp();

    try {
        await app.listen({ port: config.port, host: '0.0.0.0' });
        console.log(`Server listening on http://localhost:${config.port}`);

        const openAIKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
        if (openAIKey && !openAIKey.includes('placeholder')) {
            console.log(`🤖 AI Service Configured: ${process.env.OPENROUTER_API_KEY ? 'OpenRouter' : 'OpenAI'} (${config.openai.model})`);
        } else if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('placeholder')) {
            console.log(`🤖 AI Service Configured: Gemini`);
        } else {
            console.warn(`⚠️ No Valid AI API Key Found! Flashcards will fail.`);
        }
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
