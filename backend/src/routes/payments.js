import { supabase } from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';

export default async function paymentRoutes(fastify, options) {
    // ============================================================
    // ROTAS PÚBLICAS (com rate limiting automático via app.js)
    // ============================================================

    /**
     * GET /user/plan/:email
     * Obtém o plano do utilizador
     * 
     * NOTA DE SEGURANÇA: Este endpoint é protegido por autenticação
     * para evitar enumeração de utilizadores
     */
    fastify.get('/user/plan/:email', { preHandler: authenticate }, async (request, reply) => {
        try {
            const { email } = request.params;
            const requestingUser = request.user;

            // Verificar se o utilizador está a consultar o seu próprio plano
            // ou se é admin
            if (requestingUser.email !== email) {
                // Verificar se é admin
                const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
                const isAdmin = adminEmails.includes(requestingUser.email.toLowerCase());

                if (!isAdmin) {
                    return reply.code(403).send({ error: 'Não autorizado a consultar plano de outro utilizador' });
                }
            }

            const { data, error } = await supabase
                .from('user_profiles')
                .select('plan, plan_activated_at')
                .eq('email', email)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            // Se não existir perfil, utilizador é free
            if (!data) {
                return { plan: 'free', plan_activated_at: null };
            }

            return data;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Falha ao obter plano do utilizador' });
        }
    });

    /**
     * GET /payment-methods
     * Lista todos os métodos de pagamento disponíveis
     * Público - utilizadores precisam ver as opções de pagamento
     */
    fastify.get('/payment-methods', async (request, reply) => {
        try {
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .order('id', { ascending: true });

            if (error) {
                console.warn('[Payments] fetch error (table might be missing):', error.message);
                return [];
            }
            return data;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Falha ao obter métodos de pagamento' });
        }
    });

    // ============================================================
    // ROTAS DE UPLOAD DE COMPROVATIVO (Autenticadas)
    // ============================================================

    /**
     * POST /payments/proof
     * Upload de comprovativo de pagamento
     * Requer autenticação
     */
    fastify.post('/payments/proof', { preHandler: authenticate }, async (request, reply) => {
        try {
            const requestingUser = request.user;
            const parts = request.parts();
            let fileBuffer, filename, mimetype, userEmail, planType;

            for await (const part of parts) {
                if (part.file) {
                    fileBuffer = await part.toBuffer();
                    filename = part.filename;
                    mimetype = part.mimetype;

                    // Validar tipo de ficheiro
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
                    if (!allowedTypes.includes(mimetype)) {
                        return reply.code(400).send({ error: 'Tipo de ficheiro não permitido. Use JPEG, PNG, WebP ou PDF.' });
                    }

                    // Validar tamanho (máx 5MB)
                    if (fileBuffer.length > 5 * 1024 * 1024) {
                        return reply.code(400).send({ error: 'Ficheiro muito grande. Máximo 5MB.' });
                    }
                } else {
                    if (part.fieldname === 'userEmail') {
                        userEmail = part.value;
                    }
                    if (part.fieldname === 'planType') {
                        planType = part.value;
                    }
                }
            }

            if (!fileBuffer || !filename) {
                return reply.code(400).send({ error: 'Ficheiro é obrigatório' });
            }

            // Usar email do utilizador autenticado (não confiar no frontend)
            userEmail = requestingUser.email;

            // Validar planType
            const validPlans = ['lite', 'pro', 'premier'];
            if (!validPlans.includes(planType)) {
                planType = 'pro'; // Default
            }

            // Upload para Supabase Storage
            const filePath = `${Date.now()}_${requestingUser.id}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const { data: storageData, error: storageError } = await supabase
                .storage
                .from('proofs')
                .upload(filePath, fileBuffer, {
                    contentType: mimetype,
                    upsert: false
                });

            let fileUrl = '';
            if (storageError) {
                console.warn('Storage upload failed (Bucket might not exist), saving metadata only:', storageError.message);
                fileUrl = `pending_storage/${filename}`;
            } else {
                const { data: publicUrlData } = supabase
                    .storage
                    .from('proofs')
                    .getPublicUrl(filePath);
                fileUrl = publicUrlData.publicUrl;
            }

            // Guardar na base de dados
            const { data: dbData, error: dbError } = await supabase
                .from('payment_proofs')
                .insert({
                    user_email: userEmail,
                    file_name: filename,
                    file_url: fileUrl,
                    status: 'pending',
                    plan_type: planType
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // Log de auditoria
            request.log.info({
                event: 'PAYMENT_PROOF_UPLOADED',
                userId: requestingUser.id,
                email: userEmail,
                planType
            });

            return { success: true, proof: dbData };

        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Falha ao enviar comprovativo: ' + error.message });
        }
    });

    // ============================================================
    // ROTAS ADMIN (Requerem permissões de administrador)
    // ============================================================

    /**
     * GET /payments/proofs
     * Lista todos os comprovativos de pagamento
     * ADMIN ONLY
     */
    fastify.get('/payments/proofs', { preHandler: requireAdmin }, async (request, reply) => {
        try {
            const { status } = request.query;

            let query = supabase
                .from('payment_proofs')
                .select('*')
                .order('created_at', { ascending: false });

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) throw error;

            return data;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Falha ao obter comprovativos' });
        }
    });

    /**
     * PUT /payments/proof/:id/approve
     * Aprova um comprovativo e ativa o plano do utilizador
     * ADMIN ONLY
     */
    fastify.put('/payments/proof/:id/approve', { preHandler: requireAdmin }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { plan } = request.body || {};
            const adminUser = request.user;

            // Obter detalhes do comprovativo
            const { data: proof, error: proofError } = await supabase
                .from('payment_proofs')
                .select('*')
                .eq('id', id)
                .single();

            if (proofError) throw proofError;

            if (proof.status !== 'pending') {
                return reply.code(400).send({ error: 'Este comprovativo já foi processado' });
            }

            const planToActivate = plan || proof.plan_type || 'pro';

            // Validar plano
            if (!['lite', 'pro', 'premier'].includes(planToActivate)) {
                return reply.code(400).send({ error: 'Plano inválido' });
            }

            // Atualizar status do comprovativo
            const { data: updatedProof, error: updateError } = await supabase
                .from('payment_proofs')
                .update({
                    status: 'approved',
                    approved_by: adminUser.email,
                    approved_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Criar ou atualizar perfil do utilizador com o plano
            const { data: existingProfile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('email', proof.user_email)
                .single();

            if (existingProfile) {
                const { error: profileUpdateError } = await supabase
                    .from('user_profiles')
                    .update({
                        plan: planToActivate,
                        plan_activated_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('email', proof.user_email);

                if (profileUpdateError) throw profileUpdateError;
            } else {
                const { error: profileInsertError } = await supabase
                    .from('user_profiles')
                    .insert({
                        email: proof.user_email,
                        plan: planToActivate,
                        plan_activated_at: new Date().toISOString()
                    });

                if (profileInsertError) throw profileInsertError;
            }

            // Log de auditoria
            request.log.info({
                event: 'PAYMENT_APPROVED',
                adminEmail: adminUser.email,
                userEmail: proof.user_email,
                planActivated: planToActivate
            });

            return { success: true, proof: updatedProof, activatedPlan: planToActivate };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Falha ao aprovar comprovativo: ' + error.message });
        }
    });

    /**
     * PUT /payments/proof/:id/reject
     * Rejeita um comprovativo
     * ADMIN ONLY
     */
    fastify.put('/payments/proof/:id/reject', { preHandler: requireAdmin }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { reason } = request.body || {};
            const adminUser = request.user;

            const { data, error } = await supabase
                .from('payment_proofs')
                .update({
                    status: 'rejected',
                    rejection_reason: reason || 'Comprovativo inválido',
                    rejected_by: adminUser.email,
                    rejected_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Log de auditoria
            request.log.info({
                event: 'PAYMENT_REJECTED',
                adminEmail: adminUser.email,
                proofId: id,
                reason
            });

            return { success: true, proof: data };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Falha ao rejeitar comprovativo' });
        }
    });

    /**
     * DELETE /payments/proof/:id
     * Apaga um comprovativo de pagamento
     * ADMIN ONLY
     */
    fastify.delete('/payments/proof/:id', { preHandler: requireAdmin }, async (request, reply) => {
        try {
            const { id } = request.params;
            const adminUser = request.user;

            // Obter detalhes do comprovativo para apagar o ficheiro do storage
            const { data: proof, error: proofError } = await supabase
                .from('payment_proofs')
                .select('*')
                .eq('id', id)
                .single();

            if (proofError) {
                if (proofError.code === 'PGRST116') {
                    return reply.code(404).send({ error: 'Comprovativo não encontrado' });
                }
                throw proofError;
            }

            // Tentar apagar o ficheiro do storage (se existir)
            if (proof.file_url && !proof.file_url.startsWith('pending_storage/')) {
                try {
                    // Extrair o path do ficheiro da URL
                    const urlParts = proof.file_url.split('/proofs/');
                    if (urlParts.length > 1) {
                        const filePath = urlParts[1];
                        await supabase.storage.from('proofs').remove([filePath]);
                    }
                } catch (storageError) {
                    console.warn('Falha ao apagar ficheiro do storage:', storageError.message);
                    // Continuar mesmo se falhar a remoção do storage
                }
            }

            // Apagar o registo da base de dados
            const { error: deleteError } = await supabase
                .from('payment_proofs')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // Log de auditoria
            request.log.info({
                event: 'PAYMENT_PROOF_DELETED',
                adminEmail: adminUser.email,
                proofId: id,
                userEmail: proof.user_email
            });

            return { success: true, message: 'Comprovativo apagado com sucesso' };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Falha ao apagar comprovativo: ' + error.message });
        }
    });

    /**
     * PUT /payment-methods
     * Atualiza métodos de pagamento
     * ADMIN ONLY
     */
    fastify.put('/payment-methods', { preHandler: requireAdmin }, async (request, reply) => {
        try {
            const methods = request.body;
            if (!Array.isArray(methods)) {
                return reply.code(400).send({ error: 'Body deve ser um array' });
            }

            const { data, error } = await supabase
                .from('payment_methods')
                .upsert(methods, { onConflict: 'id' })
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Falha ao atualizar métodos de pagamento: ' + error.message });
        }
    });
}
