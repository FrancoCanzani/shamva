create table if not exists "public"."profiles" (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create or replace function handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, created_at)
    values (new.id, new.email, new.created_at);
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
