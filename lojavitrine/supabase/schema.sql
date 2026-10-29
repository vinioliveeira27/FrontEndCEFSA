create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    price numeric(10, 2) not null check (price >= 0),
    image_url text not null,
    badge text,
    description text,
    featured boolean not null default false,
    stock integer not null default 0 check (stock >= 0)
    active boolean not null default true
    created_at timestamp with time zone not null default now(),
);

create TABLE if not EXISTS public.favorites(
    user_id uuid not null references public.users(id) on delete cascade,
)
