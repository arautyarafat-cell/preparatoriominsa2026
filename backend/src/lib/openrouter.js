import { OpenRouter } from "@openrouter/sdk";
import { config } from '../config/env.js';

let openrouter = null;

if (config.openai.apiKey) {
    openrouter = new OpenRouter({
        apiKey: config.openai.apiKey
    });
    console.log('🤖 OpenRouter SDK initialized');
} else {
    console.warn('OpenRouter API Key not configured - AI features may be limited');
}

export { openrouter };
