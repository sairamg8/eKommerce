create schema if not exists app;

create table if not exists app.refresh_tokens (
    id uuid primary key,
    user_id uuid not null,

    token_hash text not null,

    expires_at timestamptz not null,
    revoked_at timestamptz,

    replaced_by_id uuid,

    ip inet,

    created_at timestamptz not null default now(),

    
    
    foreign key (user_id) references app.users(id) on delete cascade,

    foreign key (replaced_by_id) references app.refresh_tokens on delete cascade
);

create index if not exists idx_refresh_tokens_active on app.refresh_tokens(user_id) where revoked_at is null;

create index if not exists idx_refresh_expires on app.refresh_tokens(expires_at);