create schema if not exists auth;

create table if not exists auth.refresh_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    
    hashed_refresh_token text not null  unique,
    
    foreign key (user_id)
    references auth.users(id)
    on delete cascade
)