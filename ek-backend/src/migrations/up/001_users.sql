create schema if not exists auth;


create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    first_name text not null,
    last_name text not null,
    email text not null unique,
    password_hash text not null,
    preferences jsonb default '{}'::jsonb
);

create index idx_auth_users_first_name on auth.users (first_name);

create unique index idx_auth_users_email_lower on auth.users (lower(email));

-- Create a GIN index on preferences to allow fast querying of JSONB data
create index idx_auth_users_preferences on auth.users using gin (preferences)