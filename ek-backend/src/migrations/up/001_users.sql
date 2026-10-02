create schema if not exists app;
create extension if not exists pgcrypto;


create table if not exists app.users (
    id uuid primary key default gen_random_uuid(),
    first_name text not null,
    last_name text not null,
    email text not null,
    password_hash text not null,
    preferences jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz,
    deleted_at timestamptz
);

create index if not exists idx_app_users_first_name on app.users (first_name);

create unique index if not exists idx_app_users_email_lower on app.users (lower(email));

-- Create a GIN index on preferences to allow fast querying of JSONB data
create index if not exists idx_app_users_preferences on app.users using gin (preferences);