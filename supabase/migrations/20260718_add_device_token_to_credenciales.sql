alter table public.credenciales
add column if not exists device_token text,
add column if not exists device_token_updated_at timestamp with time zone;

create unique index if not exists credenciales_device_token_key
on public.credenciales (device_token)
where device_token is not null;