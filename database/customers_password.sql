alter table public.customers
add column if not exists password text;

update public.customers
set password = ''
where password is null;
