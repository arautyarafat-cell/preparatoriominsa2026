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

// Helper para construir URLs completas
export const buildApiUrl = (path: string): string => {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_URL}${cleanPath}`;
};

// Configuração de ambientes
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

// Log para debug (apenas em desenvolvimento)
if (isDevelopment) {
    console.log('[API Config] URL:', API_URL);
    console.log('[API Config] Environment:', isProduction ? 'production' : 'development');
}
