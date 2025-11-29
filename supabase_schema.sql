-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Enum for Species
create type species_enum as enum ('Chien', 'Chat');

-- PROFILES (Caregivers)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  role text not null check (role = 'caregiver'),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint email_domain_check check (email like '%@humanea-veterinaire.fr')
);

-- ANIMALS
create table animals (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  species species_enum not null,
  owner_email text not null,
  admission_date date not null default current_date,
  is_hospitalized boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DAILY REPORTS
create table daily_reports (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  animal_id uuid references animals(id) on delete cascade not null,
  caregiver_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- OWNER CONNECTIONS
create table owner_connections (
  id uuid default uuid_generate_v4() primary key,
  owner_email text not null,
  animal_id uuid references animals(id) on delete cascade,
  last_connection timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES

-- Enable RLS
alter table profiles enable row level security;
alter table animals enable row level security;
alter table daily_reports enable row level security;
alter table owner_connections enable row level security;

-- Profiles:
-- Caregivers can view their own profile.
create policy "Caregivers can view own profile" on profiles
  for select using (auth.uid() = id);

-- Animals:
-- Caregivers can view all animals.
create policy "Caregivers can view all animals" on animals
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'caregiver')
  );

create policy "Caregivers can insert animals" on animals
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'caregiver')
  );

create policy "Caregivers can update animals" on animals
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'caregiver')
  );

-- Daily Reports:
-- Caregivers can view all, insert.
create policy "Caregivers can view all reports" on daily_reports
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'caregiver')
  );

create policy "Caregivers can insert reports" on daily_reports
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'caregiver')
  );

-- Owner Connections:
-- Public can insert (for tracking).
create policy "Public can insert owner connections" on owner_connections
  for insert with check (true);

-- Caregivers can view connections.
create policy "Caregivers can view connections" on owner_connections
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'caregiver')
  );

-- SECURE FUNCTIONS FOR OWNERS (Bypass RLS)

-- Function to get animals by email
create or replace function get_animals_by_owner_email(email_input text)
returns setof animals
language sql
security definer
as $$
  select * from animals
  where owner_email = email_input
  and is_hospitalized = true;
$$;

-- Function to get reports for an animal
create or replace function get_animal_reports(p_animal_id uuid, p_owner_email text)
returns setof daily_reports
language sql
security definer
as $$
  select r.*
  from daily_reports r
  join animals a on r.animal_id = a.id
  where a.id = p_animal_id
  and a.owner_email = p_owner_email;
$$;

-- TRIGGER FOR NEW USER SIGNUP
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.email like '%@humanea-veterinaire.fr' then
    insert into public.profiles (id, first_name, last_name, email, role)
    values (
      new.id,
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'last_name',
      new.email,
      'caregiver'
    );
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
