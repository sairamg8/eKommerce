create table if not exists app.reset_password (
    id uuid primary key not null,
    user_id uuid not null,
    token_hash text not null unique,
    expiry_time timestamptz not null,
    created_at timestamptz not null default now(),

    foreign key (user_id) references app.users(id) on delete cascade
);

create index if not exists idx_reset_password_token_hash on app.reset_password(token_hash);
create index if not exists idx_reset_password_user_id on app.reset_password(user_id);