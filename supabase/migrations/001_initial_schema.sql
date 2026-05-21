-- Supabase PostgreSQL Migration: Complete Schema
-- Target: Production-grade multi-user passport system
-- Author: Migration Script
-- Date: 2024

-- ============================================================================
-- 1. SCHOOLS TABLE
-- ============================================================================

create table if not exists schools (
  id bigserial primary key,
  name text unique not null,
  code text unique not null,
  created_at timestamptz default now()
);

create index idx_schools_code on schools(code);

COMMENT ON COLUMN schools.code IS 
  '3-character school code. Example: DPS, CVT, KPS';

-- ============================================================================
-- 2. USERS TABLE (Flattened from Spring Boot inheritance model)
-- ============================================================================

create table if not exists users (
  id uuid primary key default auth.uid(),
  first_name text,
  last_name text,
  username text unique,
  email text unique,
  full_id text unique,
  role text check (role in ('ADMIN','SCANNER','MEMBER')) default 'MEMBER',
  school_id bigint references schools(id) on delete set null,
  
  -- Member-specific fields
  member_id text unique,
  qr_code_url text,
  ecertificate_url text,
  
  -- Metadata
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_users_username on users(username);
create index idx_users_email on users(email);
create index idx_users_role on users(role);
create index idx_users_school_id on users(school_id);
create index idx_users_member_id on users(member_id);
create index idx_users_full_id on users(full_id);

COMMENT ON COLUMN users.full_id IS 
  'Full ID in format: ICPEPSE-NCR-{SCHOOLCODE}-{ID}. 
   Example: ICPEPSE-NCR-DPS-A7K9M2';

-- ============================================================================
-- 3. EVENTS TABLE
-- ============================================================================

create table if not exists events (
  id bigserial primary key,
  name text unique not null,
  schedule timestamptz,
  venue_name text,
  venue_image text,
  description text,
  badge text,
  event_type text check (
    event_type in ('GENERAL_ASSEMBLY','COMPETITION','WEBINAR','OTHERS')
  ) default 'OTHERS',
  
  -- Metadata
  created_by uuid references users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_events_name on events(name);
create index idx_events_schedule on events(schedule);
create index idx_events_event_type on events(event_type);

-- ============================================================================
-- 4. PASSPORTS TABLE (1-1 with MEMBER users)
-- ============================================================================

create table if not exists passports (
  id bigserial primary key,
  member_id uuid unique not null references users(id) on delete cascade,
  
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_passports_member_id on passports(member_id);

-- ============================================================================
-- 5. STAMPS TABLE (Attendance system)
-- ============================================================================

create table if not exists stamps (
  id bigserial primary key,
  passport_id bigint not null references passports(id) on delete cascade,
  event_id bigint not null references events(id) on delete cascade,
  scanner_id uuid not null references users(id) on delete restrict,
  
  stamp_date timestamptz default now(),
  
  -- Prevent duplicate attendance
  unique(passport_id, event_id),
  
  created_at timestamptz default now()
);

create index idx_stamps_passport_id on stamps(passport_id);
create index idx_stamps_event_id on stamps(event_id);
create index idx_stamps_scanner_id on stamps(scanner_id);
create index idx_stamps_stamp_date on stamps(stamp_date);

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) - ENABLE & POLICIES
-- ============================================================================

-- Enable RLS on all tables
alter table schools enable row level security;
alter table users enable row level security;
alter table events enable row level security;
alter table passports enable row level security;
alter table stamps enable row level security;

-- ============================================================================
-- SCHOOLS RLS POLICIES
-- ============================================================================

create policy "schools_admin_all"
on schools for all
using (
  auth.jwt() ->> 'role' = 'ADMIN'
);

create policy "schools_public_select"
on schools for select
using (true);

-- ============================================================================
-- USERS RLS POLICIES
-- ============================================================================

create policy "users_admin_all"
on users for all
using (
  auth.jwt() ->> 'role' = 'ADMIN'
);

create policy "users_public_select"
on users for select
using (true);

create policy "users_self_update"
on users for update
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
);

-- ============================================================================
-- EVENTS RLS POLICIES
-- ============================================================================

create policy "events_admin_all"
on events for all
using (
  auth.jwt() ->> 'role' = 'ADMIN'
);

create policy "events_public_select"
on events for select
using (true);

-- ============================================================================
-- PASSPORTS RLS POLICIES
-- ============================================================================

create policy "passports_admin_all"
on passports for all
using (
  auth.jwt() ->> 'role' = 'ADMIN'
);

create policy "passports_self_select"
on passports for select
using (
  member_id = auth.uid()
);

create policy "passports_member_select"
on passports for select
using (
  exists (
    select 1 from users
    where users.id = auth.uid()
    and users.role = 'MEMBER'
  )
);

-- ============================================================================
-- STAMPS RLS POLICIES
-- ============================================================================

create policy "stamps_admin_all"
on stamps for all
using (
  auth.jwt() ->> 'role' = 'ADMIN'
);

create policy "stamps_scanner_insert"
on stamps for insert
with check (
  auth.jwt() ->> 'role' = 'SCANNER'
  and scanner_id = auth.uid()
);

create policy "stamps_scanner_select"
on stamps for select
using (
  auth.jwt() ->> 'role' = 'SCANNER'
);

create policy "stamps_member_select"
on stamps for select
using (
  exists (
    select 1 from passports p
    where p.id = stamps.passport_id
    and p.member_id = auth.uid()
  )
);

-- ============================================================================
-- 7. SQL VIEWS FOR ANALYTICS
-- ============================================================================

-- Event popularity and attendance stats
create or replace view event_stats as
select
  e.id,
  e.name,
  e.event_type,
  e.schedule,
  count(s.id) as total_stamps,
  count(distinct p.id) as unique_attendees
from events e
left join stamps s on s.event_id = e.id
left join passports p on p.id = s.passport_id
group by e.id, e.name, e.event_type, e.schedule;

-- Member attendance history
create or replace view member_attendance as
select
  u.id as member_id,
  u.username,
  u.first_name,
  u.last_name,
  e.id as event_id,
  e.name as event_name,
  s.stamp_date,
  s.scanner_id
from users u
join passports p on p.member_id = u.id
left join stamps s on s.passport_id = p.id
left join events e on e.id = s.event_id
where u.role = 'MEMBER'
order by s.stamp_date desc;

-- ============================================================================
-- 8. POSTGRES FUNCTIONS (Business Logic)
-- ============================================================================

-- Function: Create stamp safely (prevent duplicates)
create or replace function create_stamp(
  p_passport_id bigint,
  p_event_id bigint,
  p_scanner_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_existing_stamp_id bigint;
begin
  -- Check for existing stamp
  select id into v_existing_stamp_id
  from stamps
  where passport_id = p_passport_id
  and event_id = p_event_id
  limit 1;
  
  if v_existing_stamp_id is not null then
    return jsonb_build_object(
      'success', false,
      'error', 'STAMP_ALREADY_EXISTS',
      'stamp_id', v_existing_stamp_id
    );
  end if;
  
  -- Create new stamp
  insert into stamps(passport_id, event_id, scanner_id)
  values (p_passport_id, p_event_id, p_scanner_id)
  on conflict (passport_id, event_id) do nothing;
  
  return jsonb_build_object(
    'success', true,
    'message', 'Stamp created successfully'
  );
end;
$$;

-- Function: Get member passport with attendance summary
create or replace function get_member_passport_summary(p_member_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_passport record;
  v_attendance_count int;
begin
  select p.id, p.member_id, p.created_at
  into v_passport
  from passports p
  where p.member_id = p_member_id;
  
  if v_passport is null then
    return jsonb_build_object('error', 'PASSPORT_NOT_FOUND');
  end if;
  
  select count(*)
  into v_attendance_count
  from stamps
  where passport_id = v_passport.id;
  
  return jsonb_build_object(
    'passport_id', v_passport.id,
    'member_id', v_passport.member_id,
    'total_events_attended', v_attendance_count,
    'created_at', v_passport.created_at
  );
end;
$$;

-- Function: Get event attendance list (admin only)
create or replace function get_event_attendance(p_event_id bigint)
returns table(
  member_id uuid,
  username text,
  first_name text,
  last_name text,
  stamp_date timestamptz,
  scanner_name text
)
language plpgsql
security definer
as $$
begin
  return query
  select
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    s.stamp_date,
    scanner.username
  from stamps s
  join passports p on p.id = s.passport_id
  join users u on u.id = p.member_id
  join users scanner on scanner.id = s.scanner_id
  where s.event_id = p_event_id
  order by s.stamp_date asc;
end;
$$;

-- ============================================================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================================================

create index idx_stamps_created_at on stamps(created_at);
create index idx_passports_created_at on passports(created_at);
create index idx_users_created_at on users(created_at);
create index idx_events_created_at on events(created_at);

-- ============================================================================
-- 10. AUDIT TRIGGER (Track updates)
-- ============================================================================

create table if not exists audit_log (
  id bigserial primary key,
  table_name text not null,
  record_id text not null,
  action text not null,
  user_id uuid references users(id),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz default now()
);

create or replace function audit_trigger()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_log(table_name, record_id, action, user_id, new_data)
    values(tg_table_name, new.id::text, 'INSERT', auth.uid(), row_to_json(new));
  elsif tg_op = 'UPDATE' then
    insert into audit_log(table_name, record_id, action, user_id, old_data, new_data)
    values(tg_table_name, new.id::text, 'UPDATE', auth.uid(), row_to_json(old), row_to_json(new));
  elsif tg_op = 'DELETE' then
    insert into audit_log(table_name, record_id, action, user_id, old_data)
    values(tg_table_name, old.id::text, 'DELETE', auth.uid(), row_to_json(old));
  end if;
  return new;
end;
$$;

-- Attach audit triggers
create trigger audit_users after insert or update or delete on users for each row execute function audit_trigger();
create trigger audit_events after insert or update or delete on events for each row execute function audit_trigger();
create trigger audit_stamps after insert or update or delete on stamps for each row execute function audit_trigger();

-- ============================================================================
-- 11. INITIAL DATA (Optional - for testing)
-- ============================================================================

-- insert into schools(name, code) values
-- ('ICPEP', 'ICPEP-001')
-- on conflict do nothing;
