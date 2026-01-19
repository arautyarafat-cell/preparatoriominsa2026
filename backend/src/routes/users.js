import { supabase } from '../lib/supabase.js';

export default async function userRoutes(fastify, options) {
    // Get all users with their plan info
    fastify.get('/users', async (request, reply) => {
        try {
            // 1. Get all auth users (requires service role key)
            const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
                page: 1,
                perPage: 1000 // Reasonable limit for now
            });

            if (authError) {
                request.log.error(authError);
                return reply.code(500).send({ error: 'Failed to fetch auth users' });
            }

            // 2. Get all user profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('*');

            if (profilesError) {
                request.log.error(profilesError);
                // Continue even if profiles fail, assuming free plan
            }

            // 3. Merge data
            const users = authData.users.map(user => {
                const profile = profiles?.find(p => p.email === user.email);
                return {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at,
                    last_sign_in_at: user.last_sign_in_at,
                    plan: profile?.plan || 'free',
                    plan_activated_at: profile?.plan_activated_at || null,
                    status: 'active'
                };
            });

            // Sort by created_at desc
            users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return users;

        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Manually update user plan (Admin override)
    fastify.put('/users/:id/plan', async (request, reply) => {
        const { id } = request.params;
        const { plan, email } = request.body;

        if (!['free', 'lite', 'pro', 'premier'].includes(plan)) {
            return reply.code(400).send({ error: 'Invalid plan type' });
        }

        try {
            // Check if profile exists
            const { data: existingProfile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('email', email)
                .single();

            if (existingProfile) {
                await supabase
                    .from('user_profiles')
                    .update({
                        plan,
                        updated_at: new Date().toISOString()
                    })
                    .eq('email', email);
            } else {
                await supabase
                    .from('user_profiles')
                    .insert({
                        email: email,
                        plan,
                        plan_activated_at: new Date().toISOString()
                    });
            }

            return { success: true, message: `User plan updated to ${plan}` };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to update user plan' });
        }
    });
}
