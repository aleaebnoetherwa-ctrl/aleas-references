create table if not exists public.references (
  id uuid primary key default gen_random_uuid(),
  image text not null,
  source text,
  title text not null,
  tags text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitter_name text,
  submitted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (cardinality(tags) > 0)
);

create table if not exists public.tag_groups (
  id uuid primary key default gen_random_uuid(),
  group_name text not null unique,
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.references enable row level security;
alter table public.tag_groups enable row level security;

create or replace function public.normalize_reference_status()
returns trigger
language plpgsql
as $$
begin
  new.status = lower(trim(new.status));
  return new;
end;
$$;

drop trigger if exists normalize_reference_status_before_write on public.references;
create trigger normalize_reference_status_before_write
before insert or update on public.references
for each row
execute function public.normalize_reference_status();

drop policy if exists "Approved references are public" on public.references;
create policy "Approved references are public"
on public.references
for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "Anyone can submit pending references" on public.references;
create policy "Anyone can submit pending references"
on public.references
for insert
to anon, authenticated
with check (
  submitted_by is null
  and (
    status = 'pending'
    or (
      status = 'approved'
      and lower(trim(coalesce(submitter_name, ''))) = 'alea'
    )
  )
);

drop policy if exists "Tag groups are public" on public.tag_groups;
create policy "Tag groups are public"
on public.tag_groups
for select
to anon, authenticated
using (true);

create or replace function public.submit_reference(
  p_image text,
  p_source text,
  p_title text,
  p_tags text[],
  p_submitter_name text,
  p_new_tags jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_reference_id uuid;
  category text;
  merged_tags text[];
  reference_status text;
begin
  reference_status := case
    when lower(trim(coalesce(p_submitter_name, ''))) = 'alea' then 'approved'
    else 'pending'
  end;

  insert into public.references (
    image,
    source,
    title,
    tags,
    submitter_name,
    status
  )
  values (
    p_image,
    nullif(p_source, ''),
    p_title,
    p_tags,
    nullif(p_submitter_name, ''),
    reference_status
  )
  returning id into new_reference_id;

  for category in
    select jsonb_object_keys(coalesce(p_new_tags, '{}'::jsonb))
  loop
    select array_agg(distinct tag order by tag)
    into merged_tags
    from (
      select unnest(coalesce(
        (select tags from public.tag_groups where group_name = category),
        '{}'::text[]
      )) as tag
      union
      select jsonb_array_elements_text(p_new_tags -> category) as tag
    ) all_tags
    where tag ~ '^[a-z0-9-]+$';

    insert into public.tag_groups (group_name, tags)
    values (category, coalesce(merged_tags, '{}'::text[]))
    on conflict (group_name)
    do update set tags = excluded.tags;
  end loop;

  return new_reference_id;
end;
$$;

grant execute on function public.submit_reference(text, text, text, text[], text, jsonb) to anon, authenticated;
