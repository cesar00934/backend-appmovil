-- usuarios table (mirror local app users)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id serial PRIMARY KEY,
  id_servidor text, -- supabase auth user id
  usuario text,
  role text,
  fecha_creacion timestamptz DEFAULT now(),
  fecha_actualizacion timestamptz DEFAULT now()
);

-- audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id serial PRIMARY KEY,
  actor text,
  action text,
  payload jsonb,
  timestamp timestamptz DEFAULT now()
);