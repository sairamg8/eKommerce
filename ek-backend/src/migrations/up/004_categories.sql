create table if not exists app.categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    display_order int not null default 0,
    slug text not null,
    images text[],
    description text,
    is_active boolean not null default true,
    specifications jsonb default '{}'::jsonb,
    user_id uuid not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz,
    deleted_at timestamptz,

    foreign key (user_id) references app.users(id) on delete cascade
);

create unique index if not exists idx_category_name on app.categories(lower(name)) where deleted_at is null;
create unique  index if not exists idx_category_slug on app.categories(lower(slug)) where deleted_at is null;
create index if not exists idx_user_categories on app.categories(user_id);
create index if not exists idx_categories_is_active on app.categories(is_active) where deleted_at is null;
create index if not exists idx_categories_specifications on app.categories using gin (specifications);
