-- schema.sql
-- PLUGleads backend foundation for Supabase/Postgres

create extension if not exists pgcrypto;

create or replace function public.request_tenant_id()
returns uuid
language plpgsql
stable
as $$
declare
  v_tenant_id_text text;
begin
  v_tenant_id_text := coalesce(
    auth.jwt() ->> 'tenant_id',
    auth.jwt() -> 'app_metadata' ->> 'tenant_id',
    auth.jwt() -> 'user_metadata' ->> 'tenant_id'
  );

  if v_tenant_id_text is null or btrim(v_tenant_id_text) = '' then
    return null;
  end if;

  if v_tenant_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return null;
  end if;

  return v_tenant_id_text::uuid;
end;
$$;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  twilio_proxy_number text,
  logo_url text,
  created_at timestamptz not null default now(),
  constraint tenants_company_name_not_blank check (length(btrim(company_name)) > 0)
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.request_tenant_id() references public.tenants(id) on delete cascade,
  address text not null,
  heat_score integer not null default 0,
  status text not null default 'NEW',
  phone_numbers text[] not null,
  current_phone_index integer not null default 0,
  next_action_ts timestamptz,
  constraint leads_address_not_blank check (length(btrim(address)) > 0),
  constraint leads_heat_score_range check (heat_score >= 0 and heat_score <= 100),
  constraint leads_current_phone_index_non_negative check (current_phone_index >= 0),
  constraint leads_phone_index_bounds check (
    current_phone_index <= greatest(coalesce(array_length(phone_numbers, 1), 1) - 1, 0)
  ),
  constraint leads_status_allowed check (
    status in ('NEW', 'IN_PROGRESS', 'NO_ANSWER', 'BUSY', 'SPOKE', 'WRONG_NUMBER', 'DEAD', 'DISCONNECTED', 'FOLLOW UP')
  )
);

create table if not exists public.interaction_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  action_type text not null,
  duration_seconds integer not null default 0,
  "timestamp" timestamptz not null default now(),
  constraint interaction_log_action_type_not_blank check (length(btrim(action_type)) > 0),
  constraint interaction_log_duration_non_negative check (duration_seconds >= 0)
);

create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  dial_attempt_index integer not null default 0,
  status text not null default 'initiated',
  proxy_call_id text,
  recording_url text,
  recording_status text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint call_sessions_status_allowed check (
    status in ('initiated', 'in_progress', 'completed', 'no_answer', 'busy', 'failed', 'cancelled')
  ),
  constraint call_sessions_dial_attempt_non_negative check (dial_attempt_index >= 0)
);

create table if not exists public.outbound_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  call_session_id uuid references public.call_sessions(id) on delete set null,
  channel text not null default 'sms',
  direction text not null default 'outbound',
  status text not null default 'queued',
  provider_message_id text,
  message_body text not null,
  created_at timestamptz not null default now(),
  constraint outbound_messages_body_not_blank check (length(btrim(message_body)) > 0),
  constraint outbound_messages_direction_allowed check (direction in ('outbound', 'inbound'))
);

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  template_key text not null,
  template_body text not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint message_templates_key_not_blank check (length(btrim(template_key)) > 0),
  constraint message_templates_body_not_blank check (length(btrim(template_body)) > 0),
  constraint message_templates_tenant_key_unique unique (tenant_id, template_key)
);

create table if not exists public.call_audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  call_session_id uuid references public.call_sessions(id) on delete set null,
  actor_user_id uuid default auth.uid() references auth.users(id) on delete set null,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint call_audit_events_type_not_blank check (length(btrim(event_type)) > 0)
);

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_message_templates_updated_at on public.message_templates;
create trigger trg_message_templates_updated_at
before update on public.message_templates
for each row
execute function public.set_row_updated_at();

create unique index if not exists leads_tenant_address_key on public.leads (tenant_id, address);
create index if not exists idx_leads_tenant_id on public.leads (tenant_id);
create index if not exists idx_leads_status_next_action on public.leads (status, next_action_ts);
create index if not exists idx_interaction_log_lead_id on public.interaction_log (lead_id);
create index if not exists idx_interaction_log_user_id on public.interaction_log (user_id);
create index if not exists idx_interaction_log_timestamp on public.interaction_log ("timestamp" desc);
create index if not exists idx_call_sessions_tenant_id on public.call_sessions (tenant_id);
create index if not exists idx_call_sessions_lead_id on public.call_sessions (lead_id);
create index if not exists idx_call_sessions_status on public.call_sessions (status);
create index if not exists idx_outbound_messages_tenant_id on public.outbound_messages (tenant_id);
create index if not exists idx_outbound_messages_lead_id on public.outbound_messages (lead_id);
create index if not exists idx_outbound_messages_created_at on public.outbound_messages (created_at desc);
create index if not exists idx_message_templates_tenant_key on public.message_templates (tenant_id, template_key);
create index if not exists idx_call_audit_events_tenant_id on public.call_audit_events (tenant_id);
create index if not exists idx_call_audit_events_session_id on public.call_audit_events (call_session_id);

alter table public.tenants enable row level security;
alter table public.tenants force row level security;
alter table public.leads enable row level security;
alter table public.leads force row level security;
alter table public.interaction_log enable row level security;
alter table public.interaction_log force row level security;
alter table public.call_sessions enable row level security;
alter table public.call_sessions force row level security;
alter table public.outbound_messages enable row level security;
alter table public.outbound_messages force row level security;
alter table public.message_templates enable row level security;
alter table public.message_templates force row level security;
alter table public.call_audit_events enable row level security;
alter table public.call_audit_events force row level security;

drop policy if exists tenants_select_own on public.tenants;
create policy tenants_select_own
on public.tenants
for select
to authenticated
using (id = public.request_tenant_id());

drop policy if exists tenants_insert_own on public.tenants;
create policy tenants_insert_own
on public.tenants
for insert
to authenticated
with check (id = public.request_tenant_id());

drop policy if exists tenants_update_own on public.tenants;
create policy tenants_update_own
on public.tenants
for update
to authenticated
using (id = public.request_tenant_id())
with check (id = public.request_tenant_id());

drop policy if exists leads_select_own_tenant on public.leads;
create policy leads_select_own_tenant
on public.leads
for select
to authenticated
using (tenant_id = public.request_tenant_id());

drop policy if exists leads_insert_own_tenant on public.leads;
create policy leads_insert_own_tenant
on public.leads
for insert
to authenticated
with check (tenant_id = public.request_tenant_id());

drop policy if exists leads_update_own_tenant on public.leads;
create policy leads_update_own_tenant
on public.leads
for update
to authenticated
using (tenant_id = public.request_tenant_id())
with check (tenant_id = public.request_tenant_id());

drop policy if exists interaction_log_select_own_tenant on public.interaction_log;
create policy interaction_log_select_own_tenant
on public.interaction_log
for select
to authenticated
using (
  exists (
    select 1
    from public.leads l
    where l.id = interaction_log.lead_id
      and l.tenant_id = public.request_tenant_id()
  )
);

drop policy if exists interaction_log_insert_own_tenant on public.interaction_log;
create policy interaction_log_insert_own_tenant
on public.interaction_log
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.leads l
    where l.id = interaction_log.lead_id
      and l.tenant_id = public.request_tenant_id()
  )
);

drop policy if exists interaction_log_update_own_tenant on public.interaction_log;
create policy interaction_log_update_own_tenant
on public.interaction_log
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.leads l
    where l.id = interaction_log.lead_id
      and l.tenant_id = public.request_tenant_id()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.leads l
    where l.id = interaction_log.lead_id
      and l.tenant_id = public.request_tenant_id()
  )
);

drop policy if exists call_sessions_select_own_tenant on public.call_sessions;
create policy call_sessions_select_own_tenant
on public.call_sessions
for select
to authenticated
using (tenant_id = public.request_tenant_id());

drop policy if exists call_sessions_insert_own_tenant on public.call_sessions;
create policy call_sessions_insert_own_tenant
on public.call_sessions
for insert
to authenticated
with check (
  tenant_id = public.request_tenant_id()
  and user_id = auth.uid()
);

drop policy if exists call_sessions_update_own_tenant on public.call_sessions;
create policy call_sessions_update_own_tenant
on public.call_sessions
for update
to authenticated
using (tenant_id = public.request_tenant_id())
with check (tenant_id = public.request_tenant_id());

drop policy if exists outbound_messages_select_own_tenant on public.outbound_messages;
create policy outbound_messages_select_own_tenant
on public.outbound_messages
for select
to authenticated
using (tenant_id = public.request_tenant_id());

drop policy if exists outbound_messages_insert_own_tenant on public.outbound_messages;
create policy outbound_messages_insert_own_tenant
on public.outbound_messages
for insert
to authenticated
with check (
  tenant_id = public.request_tenant_id()
  and user_id = auth.uid()
);

drop policy if exists outbound_messages_update_own_tenant on public.outbound_messages;
create policy outbound_messages_update_own_tenant
on public.outbound_messages
for update
to authenticated
using (tenant_id = public.request_tenant_id())
with check (tenant_id = public.request_tenant_id());

drop policy if exists message_templates_select_own_tenant on public.message_templates;
create policy message_templates_select_own_tenant
on public.message_templates
for select
to authenticated
using (tenant_id = public.request_tenant_id());

drop policy if exists message_templates_insert_own_tenant on public.message_templates;
create policy message_templates_insert_own_tenant
on public.message_templates
for insert
to authenticated
with check (
  tenant_id = public.request_tenant_id()
  and created_by = auth.uid()
);

drop policy if exists message_templates_update_own_tenant on public.message_templates;
create policy message_templates_update_own_tenant
on public.message_templates
for update
to authenticated
using (tenant_id = public.request_tenant_id())
with check (tenant_id = public.request_tenant_id());

drop policy if exists call_audit_events_select_own_tenant on public.call_audit_events;
create policy call_audit_events_select_own_tenant
on public.call_audit_events
for select
to authenticated
using (tenant_id = public.request_tenant_id());

drop policy if exists call_audit_events_insert_own_tenant on public.call_audit_events;
create policy call_audit_events_insert_own_tenant
on public.call_audit_events
for insert
to authenticated
with check (tenant_id = public.request_tenant_id());

create or replace function public.increment_phone_index(p_lead_id uuid)
returns table (
  success boolean,
  lead_id uuid,
  current_phone_index integer,
  current_phone_number text,
  exhausted boolean
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_phone_numbers text[];
  v_current_index integer;
  v_new_index integer;
  v_phone_count integer;
  v_max_index integer;
  v_success boolean;
  v_exhausted boolean;
begin
  select l.phone_numbers, l.current_phone_index
  into v_phone_numbers, v_current_index
  from public.leads l
  where l.id = p_lead_id
  for update;

  if not found then
    raise exception 'Lead % not found or not accessible', p_lead_id using errcode = 'P0002';
  end if;

  v_phone_count := coalesce(array_length(v_phone_numbers, 1), 0);

  if v_phone_count = 0 then
    update public.leads
    set current_phone_index = 0
    where id = p_lead_id;

    return query
    select false, p_lead_id, 0, null::text, true;
    return;
  end if;

  v_max_index := v_phone_count - 1;
  v_new_index := least(greatest(v_current_index, 0), v_max_index);

  if v_new_index < v_max_index then
    v_new_index := v_new_index + 1;
    v_success := true;
    v_exhausted := false;
  else
    v_new_index := v_max_index;
    v_success := false;
    v_exhausted := true;
  end if;

  update public.leads
  set current_phone_index = v_new_index
  where id = p_lead_id;

  return query
  select
    v_success,
    p_lead_id,
    v_new_index,
    v_phone_numbers[v_new_index + 1],
    v_exhausted;
end;
$$;

grant usage on schema public to authenticated;
grant select, insert, update on public.tenants to authenticated;
grant select, insert, update on public.leads to authenticated;
grant select, insert, update on public.interaction_log to authenticated;
grant select, insert, update on public.call_sessions to authenticated;
grant select, insert, update on public.outbound_messages to authenticated;
grant select, insert, update on public.message_templates to authenticated;
grant select, insert on public.call_audit_events to authenticated;
grant execute on function public.increment_phone_index(uuid) to authenticated;
