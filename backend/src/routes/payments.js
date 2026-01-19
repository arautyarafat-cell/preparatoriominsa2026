import { supabase } from '../lib/supabase.js';

export default async function paymentRoutes(fastify, options) {
    // Get user's current plan
    fastify.get('/user/plan/:email', async (request, reply) => {
        try {
            const { email } = request.params;

            const { data, error } = await supabase
                .from('user_profiles')
                .select('plan, plan_activated_at')
                .eq('email', email)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            // If no profile exists, user is free
            if (!data) {
                return { plan: 'free', plan_activated_at: null };
            }

            return data;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch user plan' });
        }
    });

    // List all payment proofs (for admin)
    fastify.get('/payments/proofs', async (request, reply) => {
        try {
            const { data, error } = await supabase
                .from('payment_proofs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch payment proofs' });
        }
    });

    // Upload a payment proof
    fastify.post('/payments/proof', async (request, reply) => {
        try {
            const parts = request.parts();
            let fileBuffer, filename, mimetype, userEmail, planType;

            for await (const part of parts) {
                if (part.file) {
                    fileBuffer = await part.toBuffer();
                    filename = part.filename;
                    mimetype = part.mimetype;
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
                return reply.code(400).send({ error: 'File is required' });
            }

            userEmail = userEmail || 'anonymous@user.com';
            planType = planType || 'pro';

            // Upload to Supabase Storage
            const filePath = `${Date.now()}_${filename}`;
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
                fileUrl = `mock_url_storage_failed/${filename}`;
            } else {
                const { data: publicUrlData } = supabase
                    .storage
                    .from('proofs')
                    .getPublicUrl(filePath);
                fileUrl = publicUrlData.publicUrl;
            }

            // Save to Database
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

            return { success: true, proof: dbData };

        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to upload proof: ' + error.message });
        }
    });

    // Approve a proof and activate user plan
    fastify.put('/payments/proof/:id/approve', async (request, reply) => {
        try {
            const { id } = request.params;
            const { plan } = request.body || {};

            // Get the proof details first
            const { data: proof, error: proofError } = await supabase
                .from('payment_proofs')
                .select('*')
                .eq('id', id)
                .single();

            if (proofError) throw proofError;

            const planToActivate = plan || proof.plan_type || 'pro';

            // Update proof status
            const { data: updatedProof, error: updateError } = await supabase
                .from('payment_proofs')
                .update({ status: 'approved' })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Create or update user profile with the plan
            const { data: existingProfile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('email', proof.user_email)
                .single();

            if (existingProfile) {
                // Update existing profile
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
                // Create new profile
                const { error: profileInsertError } = await supabase
                    .from('user_profiles')
                    .insert({
                        email: proof.user_email,
                        plan: planToActivate,
                        plan_activated_at: new Date().toISOString()
                    });

                if (profileInsertError) throw profileInsertError;
            }

            return { success: true, proof: updatedProof, activatedPlan: planToActivate };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to approve proof: ' + error.message });
        }
    });

    // Reject a proof
    fastify.put('/payments/proof/:id/reject', async (request, reply) => {
        try {
            const { id } = request.params;
            const { data, error } = await supabase
                .from('payment_proofs')
                .update({ status: 'rejected' })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return { success: true, proof: data };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to reject proof' });
        }
    });

    // Fetch all payment methods
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
            return reply.code(500).send({ error: 'Failed to fetch payment methods' });
        }
    });

    // Update payment methods
    fastify.put('/payment-methods', async (request, reply) => {
        try {
            const methods = request.body;
            if (!Array.isArray(methods)) {
                return reply.code(400).send({ error: 'Body must be an array' });
            }

            const { data, error } = await supabase
                .from('payment_methods')
                .upsert(methods, { onConflict: 'id' })
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to update payment methods: ' + error.message });
        }
    });
}
