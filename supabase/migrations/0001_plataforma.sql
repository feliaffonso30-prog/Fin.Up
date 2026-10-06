-- FinUp · esquema inicial de la plataforma (usuarios, plan de inversión, uso de FinBot)
--
-- Cómo aplicarlo: Supabase → SQL Editor → pegar y ejecutar (o `supabase db push`
-- si usan la CLI). No toca la tabla `waitlist` de la landing.
--
-- Principio de seguridad: cada usuario solo ve y modifica SUS filas (RLS), y los
-- datos que definen límites del producto (plan Free/Plus, uso de FinBot) solo los
-- escribe el servidor con la service role key, nunca el navegador.

-- ---------------------------------------------------------------------------
-- perfiles: una fila por usuario registrado
-- ---------------------------------------------------------------------------
create table public.perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text,
  plan       text not null default 'free' check (plan in ('free', 'plus')),
  creado_en  timestamptz not null default now()
);

alter table public.perfiles enable row level security;

create policy "perfiles: cada usuario ve el suyo"
  on public.perfiles for select
  to authenticated
  using (id = auth.uid());

create policy "perfiles: cada usuario edita el suyo"
  on public.perfiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- RLS no filtra columnas: sin esto, un usuario podría hacerse "plus" a sí mismo.
-- Solo puede modificar su nombre; el plan lo cambia el servidor (service role).
revoke update on public.perfiles from authenticated;
grant update (nombre) on public.perfiles to authenticated;

-- Crea el perfil automáticamente cuando alguien se registra.
create function public.crear_perfil_al_registrarse()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, new.raw_user_meta_data ->> 'nombre');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_perfil_al_registrarse();

-- ---------------------------------------------------------------------------
-- planes_inversion: el resultado del onboarding (respuestas + cartera generada)
-- ---------------------------------------------------------------------------
-- Se guarda el JSON completo que produce `generarPlan` (lib/plataforma/plan.ts)
-- para poder mostrarlo tal cual, y `motor_version` para saber con qué reglas se
-- generó cuando el motor evolucione. Cada vez que el usuario rehace el
-- cuestionario se inserta una fila nueva y la anterior queda como historial.
create table public.planes_inversion (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references auth.users (id) on delete cascade,
  respuestas     jsonb not null,
  plan           jsonb not null,
  perfil_riesgo  text not null check (perfil_riesgo in ('Conservador', 'Moderado', 'Agresivo')),
  motor_version  int  not null default 1,
  vigente        boolean not null default true,
  creado_en      timestamptz not null default now()
);

-- A lo sumo un plan vigente por usuario.
create unique index planes_inversion_un_vigente
  on public.planes_inversion (usuario_id)
  where vigente;

create index planes_inversion_usuario_idx
  on public.planes_inversion (usuario_id, creado_en desc);

alter table public.planes_inversion enable row level security;

create policy "planes: cada usuario ve los suyos"
  on public.planes_inversion for select
  to authenticated
  using (usuario_id = auth.uid());

create policy "planes: cada usuario crea los suyos"
  on public.planes_inversion for insert
  to authenticated
  with check (usuario_id = auth.uid());

-- Solo puede "archivar" sus planes (vigente = false) al rehacer el cuestionario.
create policy "planes: cada usuario archiva los suyos"
  on public.planes_inversion for update
  to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

revoke update on public.planes_inversion from authenticated;
grant update (vigente) on public.planes_inversion to authenticated;

-- ---------------------------------------------------------------------------
-- uso_finbot: mensajes por usuario y día (para el límite del plan Free)
-- ---------------------------------------------------------------------------
-- Lo escribe únicamente /api/chat con la service role key. El usuario solo lo lee.
create table public.uso_finbot (
  usuario_id  uuid not null references auth.users (id) on delete cascade,
  dia         date not null default current_date,
  mensajes    int  not null default 0 check (mensajes >= 0),
  primary key (usuario_id, dia)
);

alter table public.uso_finbot enable row level security;

create policy "uso_finbot: cada usuario ve el suyo"
  on public.uso_finbot for select
  to authenticated
  using (usuario_id = auth.uid());
