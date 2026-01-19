/**
 * ==================================================
 * ROTA DE TEXT-TO-SPEECH COM IA
 * Sistema Angola Saude 2026
 * ==================================================
 * 
 * Gera audio de alta qualidade usando Google Cloud TTS
 * ou alternativas como StreamElements (gratuito).
 */

import fetch from 'node-fetch';

// ==================================================
// CONFIGURACAO
// ==================================================

// Opcao 1: Google Cloud TTS (requer credenciais)
const GOOGLE_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Opcao 2: API gratuita de TTS alternativa
const FREE_TTS_ENDPOINT = 'https://api.streamelements.com/kappa/v2/speech';

// Configuracoes de voz para portugues
const VOICE_CONFIGS = {
    google: {
        languageCode: 'pt-PT',
        name: 'pt-PT-Wavenet-A', // Voz feminina portuguesa de alta qualidade
        ssmlGender: 'FEMALE',
        alternativeVoice: 'pt-BR-Wavenet-A' // Fallback para pt-BR
    },
    free: {
        voice: 'Filipa', // Voz portuguesa no StreamElements
        alternativeVoice: 'Ricardo'
    }
};

// ==================================================
// FASTIFY PLUGIN
// ==================================================

export default async function ttsRoutes(fastify, options) {

    // ==================================================
    // ENDPOINT: GERAR AUDIO COM IA
    // ==================================================

    fastify.post('/generate/tts', async (request, reply) => {
        try {
            const { text, voice = 'default', speed = 1.0 } = request.body;

            if (!text || text.trim().length === 0) {
                return reply.status(400).send({ error: 'Texto e obrigatorio' });
            }

            // Limpar texto de marcadores especiais
            const cleanText = text
                .replace(/\[PAUSA\]/gi, '. ')
                .replace(/\[ENFASE\]/gi, '')
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/\n+/g, '. ')
                .trim();

            // Limitar tamanho do texto (TTS tem limites)
            const maxLength = 5000;
            const truncatedText = cleanText.length > maxLength
                ? cleanText.substring(0, maxLength) + '...'
                : cleanText;

            let audioData;

            // Tentar Google Cloud TTS primeiro (se tiver API key)
            if (process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                audioData = await generateWithGoogleTTS(truncatedText, speed);
            }

            // Fallback para API gratuita
            if (!audioData) {
                audioData = await generateWithFreeTTS(truncatedText);
            }

            if (!audioData) {
                return reply.status(500).send({
                    error: 'Falha ao gerar audio',
                    fallback: true
                });
            }

            return {
                success: true,
                audio: audioData.base64,
                format: audioData.format || 'mp3',
                duration: audioData.duration
            };

        } catch (error) {
            fastify.log.error('Erro ao gerar TTS:', error);
            return reply.status(500).send({
                error: 'Falha ao gerar audio',
                details: error.message
            });
        }
    });

    // ==================================================
    // ENDPOINT: GERAR AUDIO PARA SLIDE COMPLETO
    // ==================================================

    fastify.post('/generate/slide-audio', async (request, reply) => {
        try {
            const { slideId, audioScript, slideTitle } = request.body;

            if (!audioScript) {
                return reply.status(400).send({ error: 'Audio script e obrigatorio' });
            }

            // Adicionar introducao ao audio
            const fullText = `${slideTitle ? slideTitle + '. ' : ''}${audioScript}`;

            // Limpar e preparar texto
            const cleanText = fullText
                .replace(/\[PAUSA\]/gi, '. ')
                .replace(/\[ENFASE\]/gi, '')
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .trim();

            let audioData;

            // Tentar gerar com Google Cloud TTS
            if (process.env.GOOGLE_CLOUD_API_KEY) {
                audioData = await generateWithGoogleTTS(cleanText, 0.95);
            }

            // Fallback para API gratuita
            if (!audioData) {
                audioData = await generateWithFreeTTS(cleanText);
            }

            if (!audioData) {
                return reply.status(500).send({ error: 'Falha ao gerar audio' });
            }

            return {
                success: true,
                slideId,
                audio: audioData.base64,
                format: audioData.format || 'mp3',
                duration: audioData.duration
            };

        } catch (error) {
            fastify.log.error('Erro ao gerar audio do slide:', error);
            return reply.status(500).send({
                error: 'Falha ao gerar audio',
                details: error.message
            });
        }
    });
}

// ==================================================
// FUNCAO: GERAR COM GOOGLE CLOUD TTS
// ==================================================

async function generateWithGoogleTTS(text, speed = 1.0) {
    try {
        const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

        if (!apiKey) {
            console.log('Google Cloud API Key nao configurada');
            return null;
        }

        const requestBody = {
            input: { text },
            voice: {
                languageCode: VOICE_CONFIGS.google.languageCode,
                name: VOICE_CONFIGS.google.name,
                ssmlGender: VOICE_CONFIGS.google.ssmlGender
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: speed,
                pitch: 0, // Tom normal
                volumeGainDb: 0 // Volume normal
            }
        };

        const response = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            // Tentar voz alternativa (pt-BR)
            requestBody.voice.languageCode = 'pt-BR';
            requestBody.voice.name = VOICE_CONFIGS.google.alternativeVoice;

            const retryResponse = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!retryResponse.ok) {
                console.error('Google TTS falhou:', await retryResponse.text());
                return null;
            }

            const retryData = await retryResponse.json();
            return {
                base64: retryData.audioContent,
                format: 'mp3',
                duration: estimateDuration(text, speed)
            };
        }

        const data = await response.json();

        return {
            base64: data.audioContent,
            format: 'mp3',
            duration: estimateDuration(text, speed)
        };

    } catch (error) {
        console.error('Erro no Google TTS:', error);
        return null;
    }
}

// ==================================================
// FUNCAO: GERAR COM APIS GRATUITAS (com fallbacks)
// ==================================================

async function generateWithFreeTTS(text) {
    // Tentar multiplas APIs em sequencia
    const apis = [
        () => tryVoiceRSS(text),
        () => tryStreamElements(text),
        () => tryResponsiveVoice(text)
    ];

    for (const tryApi of apis) {
        try {
            const result = await tryApi();
            if (result) return result;
        } catch (e) {
            console.log('API falhou, tentando proxima...', e.message);
        }
    }

    return null;
}

// ==================================================
// API 1: VoiceRSS (gratuito ate 350 requests/dia)
// ==================================================

async function tryVoiceRSS(text) {
    try {
        // API Key gratuita para VoiceRSS - pode ser obtida em voicerss.org
        const apiKey = process.env.VOICERSS_API_KEY;

        if (!apiKey) {
            console.log('VoiceRSS API Key nao configurada');
            return null;
        }

        const params = new URLSearchParams({
            key: apiKey,
            hl: 'pt-pt',          // Portugues de Portugal
            src: text.substring(0, 1000),
            c: 'MP3',
            f: '48khz_16bit_stereo',
            r: '0'               // Velocidade normal
        });

        const response = await fetch('https://api.voicerss.org/', {
            method: 'POST',
            body: params
        });

        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        return {
            base64,
            format: 'mp3',
            duration: estimateDuration(text, 1.0)
        };
    } catch (error) {
        console.error('VoiceRSS falhou:', error.message);
        return null;
    }
}

// ==================================================
// API 2: StreamElements (gratuito, limite 500 chars)
// ==================================================

async function tryStreamElements(text) {
    try {
        const voices = ['Filipa', 'Ines', 'Ricardo']; // Vozes pt-PT
        const voice = voices[0];
        const encodedText = encodeURIComponent(text.substring(0, 450));

        const url = `${FREE_TTS_ENDPOINT}?voice=${voice}&text=${encodedText}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            console.error('StreamElements falhou:', response.status);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        return {
            base64,
            format: 'mp3',
            duration: estimateDuration(text, 1.0)
        };
    } catch (error) {
        console.error('StreamElements falhou:', error.message);
        return null;
    }
}

// ==================================================
// API 3: ResponsiveVoice (fallback)
// ==================================================

async function tryResponsiveVoice(text) {
    try {
        const encodedText = encodeURIComponent(text.substring(0, 200));
        const url = `https://texttospeech.responsivevoice.org/v1/text:synthesize?text=${encodedText}&lang=pt&engine=g3&pitch=0.5&rate=0.5`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        return {
            base64,
            format: 'mp3',
            duration: estimateDuration(text, 1.0)
        };
    } catch (error) {
        console.error('ResponsiveVoice falhou:', error.message);
        return null;
    }
}

// ==================================================
// FUNCAO: ESTIMAR DURACAO
// ==================================================

function estimateDuration(text, speed) {
    // Media de 150 palavras por minuto a velocidade normal
    const wordsPerMinute = 150;
    const wordCount = text.split(/\s+/).length;
    const minutes = wordCount / wordsPerMinute;
    const seconds = Math.ceil((minutes * 60) / speed);
    return seconds;
}
