import OpenAI from 'openai';
import { config } from '../config/env.js';

let openai = null;

if (config.openai.apiKey) {
    const openaiConfig = {
        apiKey: config.openai.apiKey,
        baseURL: config.openai.baseURL
    };

    // Add required headers for OpenRouter
    if (config.openai.baseURL && config.openai.baseURL.includes('openrouter')) {
        openaiConfig.defaultHeaders = {
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'Angola Saude Prep'
        };
    }

    openai = new OpenAI(openaiConfig);
} else {
    console.warn('OpenAI/OpenRouter API Key not configured - AI features may be limited');
}

export { openai };
