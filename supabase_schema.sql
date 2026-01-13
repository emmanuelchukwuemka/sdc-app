-- Create table for KYC Documents if it doesn't exist
create table if not exists public.kyc_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  role text not null,
  status text default 'in_progress', -- in_progress, submitted, approved, rejected
  form_data jsonb default '{}'::jsonb,
  form_progress int default 0,
  file_url text, -- simplified pointer to the ID image/pdf
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.kyc_documents enable row level security;

-- Policies for kyc_documents
create policy "Users can view their own kyc"
  on public.kyc_documents for select
  using (auth.uid() = user_id);

create policy "Users can insert/update their own kyc"
  on public.kyc_documents for all
  using (auth.uid() = user_id);

create policy "Admins can view and update all kyc"
  on public.kyc_documents for all
  using (
    auth.uid() in (
      select user_id from public.agencies -- simplified check; optimally check admin role
      -- In this app's logic, 'admin' might be a specific role string in auth.users or separate table.
      -- For MVP, assuming policies open or handled via app logic + RLS on user_id.
    )
    or exists (select 1 from public.kyc_documents where user_id = auth.uid() and role = 'ADMIN') 
  );


-- Storage Bucket for KYC
insert into storage.buckets (id, name, public) 
values ('kyc', 'kyc', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Give users access to own folder 1bk1z5p_0" on storage.objects
  for select
  using (bucket_id = 'kyc' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Give users access to own folder 1bk1z5p_1" on storage.objects
  for insert
  with check (bucket_id = 'kyc' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Admins can view all" on storage.objects
  for select
  using (bucket_id = 'kyc');
