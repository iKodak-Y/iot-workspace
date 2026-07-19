alter table public.usuarios
add column if not exists activation_code text,
add column if not exists activation_code_expires_at timestamp with time zone,
add column if not exists recovery_code text;

create unique index if not exists usuarios_activation_code_key
on public.usuarios (activation_code)
where activation_code is not null;

create unique index if not exists usuarios_recovery_code_key
on public.usuarios (recovery_code)
where recovery_code is not null;
