import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rgnzrcuredtbwcnnimta.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnbnpyY3VyZWR0Yndjbm5pbXRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU5NTA5MSwiZXhwIjoyMDgzMTcxMDkxfQ.zvjGXHMfEyPQcyrkbVGh3OFgZXsJLtPt8XkRaLCcDzE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const fixUser = async () => {
    const email = 'arautyarafat@gmail.com';
    const password = 'Caquinda55';

    console.log(`Fixing user ${email}...`);

    // 1. Check if user exists (even if unconfirmed)
    // List users (requires admin)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('List Users Error:', listError);
        return;
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log(`User found (ID: ${existingUser.id}). Status: ${existingUser.email_confirmed_at ? 'Confirmed' : 'Unconfirmed'}`);

        // Update user to be confirmed
        const { data, error } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            {
                email_confirm: true,
                user_metadata: { email_confirmed: true },
                password: password // Reset password to ensure it matches
            }
        );

        if (error) {
            console.error('Update Error:', error);
        } else {
            console.log('User confirmed successfully via Admin API.');
        }

    } else {
        console.log('User not found. Creating new confirmed user...');

        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (error) {
            console.error('Create Error:', error);
        } else {
            console.log('User created and confirmed successfully.');
        }
    }
};

fixUser();
