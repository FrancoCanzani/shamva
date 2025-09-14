-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =========================
-- PROFILES
-- =========================
-- Users can only manage their own profile

create policy "Users can view their own profile"
on profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can create their own profile"
on profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can delete their own profile"
on profiles
for delete
to authenticated
using (auth.uid() = id);
