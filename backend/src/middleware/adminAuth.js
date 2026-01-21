/**
 * 🛡️ MIDDLEWARE DE AUTENTICAÇÃO ADMIN
 * Angola Saúde 2026
 * 
 * Protege endpoints administrativos garantindo que:
 * 1. O utilizador está autenticado
 * 2. O utilizador tem permissões de admin
 * 
 * IMPORTANTE: Nunca confiar no frontend para verificações de admin!
 */

import { supabase } from '../lib/supabase.js';
import { authenticate } from './auth.js';
import { logSecurityEvent } from './security.js';

// Lista de emails de administradores (SEMPRE incluídos)
// Estes emails têm acesso admin garantido
const DEFAULT_ADMIN_EMAILS = [
    'admin@angolasaude.ao',
    'arautyarafat@gmail.com',
];

// Combinar emails padrão com variável de ambiente
function getAdminEmails() {
    const envAdmins = process.env.ADMIN_EMAILS;

    // Começar com emails padrão
    const allAdmins = new Set(DEFAULT_ADMIN_EMAILS.map(e => e.trim().toLowerCase()));

    // Adicionar emails da variável de ambiente (se existir)
    if (envAdmins) {
        envAdmins.split(',').forEach(e => {
            const email = e.trim().toLowerCase();
            if (email) allAdmins.add(email);
        });
    }

    const adminList = Array.from(allAdmins);
    console.log('[AdminAuth] Admin emails configured:', adminList);
    return adminList;
}

/**
 * Middleware que verifica se o utilizador é admin
 * Deve ser usado APÓS o middleware de autenticação
 */
export async function requireAdmin(request, reply) {
    // Primeiro, garantir que está autenticado
    await authenticate(request, reply);

    // Se a autenticação falhou, já retornou erro
    if (reply.sent) return;

    const user = request.user;

    if (!user || !user.email) {
        logSecurityEvent(request, 'ADMIN_ACCESS_DENIED', {
            reason: 'No user or email in request'
        });

        return reply.code(401).send({
            error: 'Autenticação inválida'
        });
    }

    const userEmail = user.email.toLowerCase();
    const adminEmails = getAdminEmails();

    // Log para debug
    console.log('[AdminAuth] Checking admin access for:', userEmail);
    console.log('[AdminAuth] Admin list includes user:', adminEmails.includes(userEmail));

    // Verificar se o email está na lista de admins
    const isAdmin = adminEmails.includes(userEmail);

    // Verificar também na base de dados (mais seguro)
    let dbAdmin = false;
    try {
        const { data } = await supabase
            .from('user_profiles')
            .select('is_admin, role')
            .eq('email', userEmail)
            .single();

        dbAdmin = data?.is_admin === true || data?.role === 'admin';
        console.log('[AdminAuth] DB admin check:', { data, dbAdmin });
    } catch (e) {
        console.log('[AdminAuth] DB check failed:', e.message);
        // Continuar sem verificação de BD se falhar
    }

    if (!isAdmin && !dbAdmin) {
        console.log('[AdminAuth] ACCESS DENIED for:', userEmail);
        logSecurityEvent(request, 'ADMIN_ACCESS_DENIED', {
            email: userEmail,
            reason: 'User is not admin',
            adminEmails: adminEmails
        });

        return reply.code(403).send({
            error: 'Acesso negado. Permissões de administrador necessárias.',
            debug: { email: userEmail, isInList: isAdmin, isInDb: dbAdmin }
        });
    }

    // Marcar request como admin
    request.isAdmin = true;

    logSecurityEvent(request, 'ADMIN_ACCESS_GRANTED', {
        email: userEmail
    });
}

/**
 * Middleware de autenticação opcional
 * Não falha se não autenticado, mas adiciona user se estiver
 */
export async function optionalAuth(request, reply) {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
        request.user = null;
        return;
    }

    try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (!error && user) {
            request.user = user;
        } else {
            request.user = null;
        }
    } catch (e) {
        request.user = null;
    }
}

/**
 * Verifica se o utilizador tem um plano específico ou superior
 */
export async function requirePlan(minPlan) {
    return async function (request, reply) {
        // Primeiro autenticar
        await authenticate(request, reply);
        if (reply.sent) return;

        const user = request.user;
        const planHierarchy = ['free', 'lite', 'pro', 'premier'];

        // Obter plano do utilizador
        let userPlan = 'free';
        try {
            const { data } = await supabase
                .from('user_profiles')
                .select('plan')
                .eq('email', user.email)
                .single();

            if (data?.plan) {
                userPlan = data.plan;
            }
        } catch (e) {
            // Assumir free se falhar
        }

        const userPlanIndex = planHierarchy.indexOf(userPlan);
        const minPlanIndex = planHierarchy.indexOf(minPlan);

        if (userPlanIndex < minPlanIndex) {
            return reply.code(403).send({
                error: `Esta funcionalidade requer o plano ${minPlan} ou superior.`,
                currentPlan: userPlan,
                requiredPlan: minPlan
            });
        }

        request.userPlan = userPlan;
    };
}

/**
 * Middleware para verificar se o utilizador não está bloqueado
 */
export async function checkNotBlocked(request, reply) {
    // Primeiro autenticar
    await authenticate(request, reply);
    if (reply.sent) return;

    const user = request.user;

    try {
        // Verificar se existe na tabela de bloqueados
        const { data, error } = await supabase
            .from('blocked_users')
            .select('id, reason')
            .eq('email', user.email)
            .single();

        if (data && !error) {
            logSecurityEvent(request, 'BLOCKED_USER_ACCESS_ATTEMPT', {
                email: user.email,
                reason: data.reason
            });

            return reply.code(403).send({
                error: 'A sua conta foi suspensa.',
                reason: data.reason || 'Contacte o suporte para mais informações.',
                code: 'USER_BLOCKED'
            });
        }
    } catch (e) {
        // Se a tabela não existir ou erro, permitir acesso
        if (e.code !== 'PGRST116') { // PGRST116 = no rows
            request.log.warn('Error checking blocked status:', e.message);
        }
    }
}

/**
 * Rate limiting específico por funcionalidade para admins
 * Mesmo admins têm limites para evitar erros acidentais
 */
const adminActionCounts = new Map();

export async function adminActionLimit(request, reply) {
    const userId = request.user?.id || 'unknown';
    const action = request.url;

    const key = `${userId}:${action}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minuto
    const maxActions = 30; // 30 ações por minuto

    let data = adminActionCounts.get(key);

    if (!data || now - data.start > windowMs) {
        data = { start: now, count: 1 };
        adminActionCounts.set(key, data);
    } else {
        data.count++;
    }

    if (data.count > maxActions) {
        logSecurityEvent(request, 'ADMIN_RATE_LIMIT', {
            userId,
            action,
            count: data.count
        });

        return reply.code(429).send({
            error: 'Demasiadas ações em pouco tempo. Aguarde um momento.'
        });
    }
}
