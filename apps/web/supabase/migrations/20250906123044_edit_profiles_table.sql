alter table "public"."profiles"
add column "first_name" text,
add column "last_name" text;

create or replace function handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, created_at)
    values (new.id, new.email, new.created_at);
    return new;
end;
$$ language plpgsql security definer;
