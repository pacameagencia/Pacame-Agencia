-- Lista negra absoluta: emails que JAMÁS se contactan en outreach automatizado.
-- Workers consultan esta tabla antes de enviar.

create table if not exists public.protected_contacts (
  email text primary key,
  name text,
  type text not null,                     -- client | friend | provider | personal | pablo | competitor
  notes text,
  added_at timestamptz default now()
);

create index if not exists idx_protected_contacts_email on public.protected_contacts(lower(email));

comment on table public.protected_contacts is
  'Lista negra absoluta. NUNCA contactar. Workers la consultan antes de enviar.';
comment on column public.protected_contacts.type is
  'Tipos: client | friend | provider | personal | pablo | competitor';

-- Pre-poblar con clientes/contactos conocidos de PACAME
insert into public.protected_contacts (email, name, type, notes) values
  ('ecomglobalbox@pm.me', 'César Veld (cuenta Claude Pablo)', 'pablo', 'Cuenta Claude de Pablo - NUNCA enviar'),
  ('pablodesarrolloweb@gmail.com', 'Pablo Calleja', 'pablo', 'Email personal de Pablo'),
  ('hola@pacameagencia.com', 'PACAME inbox', 'pablo', 'Inbox propio'),
  ('responder@replies.pacameagencia.com', 'PACAME replies', 'pablo', 'Inbox replies'),
  ('contacto@pacameagencia.com', 'PACAME contacto', 'pablo', 'Inbox contacto'),
  ('cesar@cesarveld.com', 'César Veld', 'client', 'Cliente Ecomglobalbox'),
  ('cesar@mindset.com', 'César Veld (Mindset)', 'client', 'Cliente Mindset'),
  ('jroyo@joyeriaroyo.com', 'Joyería Royo (J. Royo)', 'client', 'Cliente Capa 2 Royo - Albacete'),
  ('info@royo.es', 'Joyería Royo', 'client', 'Cliente Capa 2'),
  ('info@joyeriaroyo.com', 'Joyería Royo', 'client', 'Cliente Capa 2'),
  ('contacto@royo.com', 'Joyería Royo', 'client', 'Cliente Capa 2'),
  ('info@talleresjaula.com', 'Talleres Jaula', 'client', 'Cliente Capa 2'),
  ('talleresjaula@gmail.com', 'Talleres Jaula', 'client', 'Cliente Capa 2')
on conflict (email) do nothing;
