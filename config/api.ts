/**
 * 🌐 CONFIGURAÇÃO CENTRALIZADA DE API
 * Angola Saúde 2026
 * 
 * Este arquivo centraliza todas as configurações de endpoints da API.
 * Todos os componentes devem importar API_URL daqui para garantir
 * consistência entre desenvolvimento e produção.
 */

// URL da API Backend
// Em produção (Vercel), usar a variável de ambiente
// Em desenvolvimento, fallback para localhost
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// URL de localhost para substituição
const LOCALHOST_URL = 'http://localhost:3001';

// Helper para construir URLs completas
export const buildApiUrl = (path: string): string => {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_URL}${cleanPath}`;
};

// Configuração de ambientes
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

/**
 * 🔧 PATCH GLOBAL DO FETCH
 * 
 * Esta função substitui o fetch global para redirecionar automaticamente
 * URLs de localhost:3001 para a URL de produção quando necessário.
 * 
 * Isso é uma solução temporária enquanto refatoramos todos os componentes
 * para usar API_URL diretamente.
 */
export const patchGlobalFetch = () => {
    if (typeof window === 'undefined') return;

    // Apenas aplicar patch se NÃO estivermos em localhost
    const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
        console.log('[API Config] Running locally, no fetch patch needed');
        return;
    }

    const originalFetch = window.fetch;

    window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        let url: string;

        if (typeof input === 'string') {
            url = input;
        } else if (input instanceof URL) {
            url = input.toString();
        } else if (input instanceof Request) {
            url = input.url;
        } else {
            return originalFetch.call(window, input, init);
        }

        // Substituir localhost:3001 pela URL de produção
        if (url.includes(LOCALHOST_URL)) {
            const newUrl = url.replace(LOCALHOST_URL, API_URL);
            console.log(`[API Patch] Redirecting: ${url} -> ${newUrl}`);
            return originalFetch.call(window, newUrl, init);
        }

        return originalFetch.call(window, input, init);
    };

    console.log('[API Config] Global fetch patched for production');
};

// Auto-aplicar patch em produção
if (isProduction) {
    patchGlobalFetch();
}

// Log para debug (apenas em desenvolvimento)
if (isDevelopment) {
    console.log('[API Config] URL:', API_URL);
    console.log('[API Config] Environment:', isProduction ? 'production' : 'development');
}
