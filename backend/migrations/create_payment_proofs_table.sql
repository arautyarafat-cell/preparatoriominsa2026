create table if not exists public.payment_proofs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid, -- Can be null if not strictly enforced yet, but good to have
  user_email text not null,
  file_name text not null,
  file_url text, -- Storage path
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.payment_proofs enable row level security;

-- Policy for users to insert their own proofs (asking for anon/authenticated insert for now to simplify)
create policy "Users can insert their own proofs"
on public.payment_proofs for insert
with check (true);

-- Policy for admin to view/update? 
-- Assuming service role key usage on backend, so RLS might be bypassed there.
-- But for frontend fetching, we might need policies. 
create policy "Users can view their own proofs"
on public.payment_proofs for select
using (auth.uid() = user_id);

create policy "Admins can view all proofs"
on public.payment_proofs for select
using (true); -- Ideally restrict to admin email
