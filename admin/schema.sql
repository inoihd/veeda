-- ============================================================
-- Veeda Admin Panel — Database Schema
-- Run this in your Supabase SQL editor (project: veeda)
-- ============================================================

-- Helper: check if current JWT has admin role
create or replace function is_admin() returns boolean as $$
  select coalesce(auth.jwt()->>'app_role', '') = 'admin'
$$ language sql security definer;

-- ============================================================
-- page_views
-- ============================================================
create table if not exists page_views (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete set null,
  page        text not null,
  duration    integer default 0,          -- seconds
  referrer    text,
  user_agent  text,
  ip          text,
  created_at  timestamptz default now()
);

alter table page_views enable row level security;

create policy "admin_select_page_views" on page_views
  for select using (is_admin());

create policy "public_insert_page_views" on page_views
  for insert with check (true);

create index if not exists idx_page_views_created_at on page_views(created_at);
create index if not exists idx_page_views_user_id on page_views(user_id);

-- ============================================================
-- user_limits — per-user overrides
-- ============================================================
create table if not exists user_limits (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  circle_limit  integer not null default 5,
  updated_at    timestamptz default now(),
  unique(user_id)
);

alter table user_limits enable row level security;

create policy "admin_all_user_limits" on user_limits
  for all using (is_admin()) with check (is_admin());

-- ============================================================
-- layout_config — section ordering / visibility
-- ============================================================
create table if not exists layout_config (
  id           bigserial primary key,
  section_key  text not null unique,
  label        text not null,
  enabled      boolean not null default true,
  "order"      integer not null default 0,
  updated_at   timestamptz default now()
);

alter table layout_config enable row level security;

create policy "admin_all_layout_config" on layout_config
  for all using (is_admin()) with check (is_admin());

create policy "public_select_layout_config" on layout_config
  for select using (true);

-- ============================================================
-- polls
-- ============================================================
create table if not exists polls (
  id          bigserial primary key,
  question    text not null,
  active      boolean not null default true,
  ends_at     timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table polls enable row level security;

create policy "admin_all_polls" on polls
  for all using (is_admin()) with check (is_admin());

create policy "public_select_polls" on polls
  for select using (active = true);

-- ============================================================
-- poll_options
-- ============================================================
create table if not exists poll_options (
  id        bigserial primary key,
  poll_id   bigint not null references polls(id) on delete cascade,
  text      text not null,
  "order"   integer not null default 0
);

alter table poll_options enable row level security;

create policy "admin_all_poll_options" on poll_options
  for all using (is_admin()) with check (is_admin());

create policy "public_select_poll_options" on poll_options
  for select using (true);

-- ============================================================
-- poll_votes
-- ============================================================
create table if not exists poll_votes (
  id         bigserial primary key,
  poll_id    bigint not null references polls(id) on delete cascade,
  option_id  bigint not null references poll_options(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  unique(poll_id, user_id)
);

alter table poll_votes enable row level security;

create policy "admin_all_poll_votes" on poll_votes
  for all using (is_admin()) with check (is_admin());

create policy "users_insert_poll_votes" on poll_votes
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- ad_boxes
-- ============================================================
create table if not exists ad_boxes (
  id                    bigserial primary key,
  slot_name             text not null,
  size                  text not null default 'banner',   -- banner | rectangle | leaderboard
  adsense_code          text,
  restricted_categories text[] default '{}',
  "order"               integer not null default 0,
  enabled               boolean not null default true,
  updated_at            timestamptz default now()
);

alter table ad_boxes enable row level security;

create policy "admin_all_ad_boxes" on ad_boxes
  for all using (is_admin()) with check (is_admin());

create policy "public_select_ad_boxes" on ad_boxes
  for select using (enabled = true);

-- ============================================================
-- notification_templates
-- ============================================================
create table if not exists notification_templates (
  id          bigserial primary key,
  name        text not null,
  title       text not null,
  body        text not null,
  icon_url    text,
  action_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table notification_templates enable row level security;

create policy "admin_all_notification_templates" on notification_templates
  for all using (is_admin()) with check (is_admin());

-- ============================================================
-- scheduled_notifications
-- ============================================================
create table if not exists scheduled_notifications (
  id           bigserial primary key,
  template_id  bigint references notification_templates(id) on delete set null,
  title        text not null,
  body         text not null,
  icon_url     text,
  action_url   text,
  target       text not null default 'all',    -- all | segment
  segment      jsonb,
  scheduled_at timestamptz not null,
  sent         boolean not null default false,
  sent_at      timestamptz,
  cancelled    boolean not null default false,
  created_at   timestamptz default now()
);

alter table scheduled_notifications enable row level security;

create policy "admin_all_scheduled_notifications" on scheduled_notifications
  for all using (is_admin()) with check (is_admin());

create index if not exists idx_sched_notif_scheduled_at on scheduled_notifications(scheduled_at)
  where sent = false and cancelled = false;

-- ============================================================
-- style_overrides — per-component CSS
-- ============================================================
create table if not exists style_overrides (
  id            bigserial primary key,
  component_key text not null unique,
  label         text not null,
  css           text not null default '',
  updated_at    timestamptz default now()
);

alter table style_overrides enable row level security;

create policy "admin_all_style_overrides" on style_overrides
  for all using (is_admin()) with check (is_admin());

create policy "public_select_style_overrides" on style_overrides
  for select using (true);

-- seed default component keys
insert into style_overrides (component_key, label, css) values
  ('button-primary',  'Botão Primário',    ''),
  ('button-secondary','Botão Secundário',  ''),
  ('card',            'Card',              ''),
  ('header',          'Cabeçalho',         ''),
  ('footer',          'Rodapé',            ''),
  ('modal',           'Modal',             ''),
  ('input',           'Input',             ''),
  ('sidebar',         'Sidebar',           ''),
  ('badge',           'Badge',             ''),
  ('avatar',          'Avatar',            '')
on conflict (component_key) do nothing;

-- ============================================================
-- home_boxes — homepage content blocks
-- ============================================================
create table if not exists home_boxes (
  id        bigserial primary key,
  type      text not null default 'html',   -- youtube | iframe | html | image | gif
  url       text,
  title     text,
  size      text not null default 'medium', -- small | medium | large | full
  "order"   integer not null default 0,
  enabled   boolean not null default true,
  link_url  text,
  content   text,                           -- for html type
  updated_at timestamptz default now()
);

alter table home_boxes enable row level security;

create policy "admin_all_home_boxes" on home_boxes
  for all using (is_admin()) with check (is_admin());

create policy "public_select_home_boxes" on home_boxes
  for select using (enabled = true);

-- ============================================================
-- admin_logs — audit trail
-- ============================================================
create table if not exists admin_logs (
  id         bigserial primary key,
  admin_id   uuid references auth.users(id) on delete set null,
  action     text not null,
  data       jsonb,
  created_at timestamptz default now()
);

alter table admin_logs enable row level security;

create policy "admin_all_admin_logs" on admin_logs
  for all using (is_admin()) with check (is_admin());

create index if not exists idx_admin_logs_admin_id on admin_logs(admin_id);
create index if not exists idx_admin_logs_created_at on admin_logs(created_at);

-- ============================================================
-- reports — user-submitted moderation reports
-- ============================================================
create table if not exists reports (
  id              bigserial primary key,
  reporter_id     uuid references auth.users(id) on delete set null,
  reporter_handle text,
  target_type     text not null,   -- post | user | comment
  target_id       text not null,
  reason          text not null,
  status          text not null default 'open',  -- open | resolved | dismissed
  resolved_by     uuid references auth.users(id) on delete set null,
  resolved_at     timestamptz,
  notes           text,
  created_at      timestamptz default now()
);

alter table reports enable row level security;

create policy "admin_all_reports" on reports
  for all using (is_admin()) with check (is_admin());

create policy "users_insert_reports" on reports
  for insert with check (auth.uid() = reporter_id);

create index if not exists idx_reports_status on reports(status);

-- ============================================================
-- settings — key/value store
-- ============================================================
create table if not exists settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz default now()
);

alter table settings enable row level security;

create policy "admin_all_settings" on settings
  for all using (is_admin()) with check (is_admin());

create policy "public_select_settings" on settings
  for select using (key not in ('maintenance_mode') or is_admin());

-- seed default settings
insert into settings (key, value) values
  ('maintenance_mode',    'false'),
  ('circle_limit_global', '5'),
  ('terms_text',          '<p>Termos de uso do Veeda.</p>'),
  ('privacy_text',        '<p>Política de privacidade do Veeda.</p>'),
  ('backup_schedule',     '0 3 * * *')
on conflict (key) do nothing;

-- ============================================================
-- faq
-- ============================================================
create table if not exists faq (
  id        bigserial primary key,
  question  text not null,
  answer    text not null,
  "order"   integer not null default 0,
  enabled   boolean not null default true,
  updated_at timestamptz default now()
);

alter table faq enable row level security;

create policy "admin_all_faq" on faq
  for all using (is_admin()) with check (is_admin());

create policy "public_select_faq" on faq
  for select using (enabled = true);

-- ============================================================
-- profiles — ensure status column exists (Veeda app table)
-- ============================================================
-- alter table profiles add column if not exists status text not null default 'active';

-- ============================================================
-- Trigger: set app_role = 'admin' for first registered user
-- For subsequent admins, set manually:
--   update auth.users set raw_app_meta_data =
--     raw_app_meta_data || '{"app_role":"admin"}' where id = '<user-id>';
-- ============================================================
create or replace function handle_first_admin()
returns trigger as $$
declare
  user_count integer;
begin
  select count(*) into user_count from auth.users;
  if user_count = 1 then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"app_role":"admin"}'::jsonb
    where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_first_admin on auth.users;
create trigger on_first_admin
  after insert on auth.users
  for each row execute function handle_first_admin();

-- ============================================================
-- pg_cron setup for scheduled notifications
-- Enable pg_cron extension in Supabase dashboard first, then:
--
-- select cron.schedule(
--   'process-scheduled-notifications',
--   '* * * * *',
--   $$
--     select net.http_post(
--       url := 'https://<project-ref>.supabase.co/functions/v1/process-notifications',
--       headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
--     );
--   $$
-- );
-- ============================================================
