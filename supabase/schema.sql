-- =========================================================
-- Mirror Check: Database Schema for Supabase (PostgreSQL)
-- =========================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Closet Items Table (Wardrobe garments, makeup shades, skincare products)
create table if not exists closet_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in (
      'outfit_top',
      'outfit_bottom',
      'outfit_dress',
      'outfit_outer',
      'makeup',
      'skincare',
      'haircare'
    )
  ),
  name text not null,
  brand text,
  image_url text,
  is_owned boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  -- metadata schema:
  -- outfit:   { formality_tag: 'casual'|'classy'|'elegant'|'bold', color: string, weather_tags: string[], fabric?: string }
  -- makeup:   { product_category: 'foundation'|'blush'|'lip'|'eyeshadow'|'eyebrow', shade_hex: string, finish: 'matte'|'dewy'|'satin'|'glossy' }
  -- skincare: { step_category: 'cleanser'|'toner'|'serum'|'moisturizer'|'spf'|'treatment', active_ingredients: string[], timing: 'AM'|'PM'|'both' }
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Look Sessions Table (Persisting user selfie analysis, vibes, and generated recommendations)
create table if not exists look_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  vibe text not null,
  selfie_url text,
  skin_analysis jsonb,
  skin_tone jsonb,
  weather jsonb,
  recommendation jsonb,
  makeup_result_url text,
  outfit_result_url text
);

-- Index for fast lookup by category and formality
create index if not exists idx_closet_items_category on closet_items(category);
create index if not exists idx_look_sessions_created_at on look_sessions(created_at desc);

-- Enable Row Level Security (RLS)
alter table closet_items enable row level security;
alter table look_sessions enable row level security;

-- Public read policies for demo hackathon application
create policy "Allow public read closet_items" on closet_items for select using (true);
create policy "Allow public insert closet_items" on closet_items for insert with check (true);
create policy "Allow public update closet_items" on closet_items for update using (true);

create policy "Allow public read look_sessions" on look_sessions for select using (true);
create policy "Allow public insert look_sessions" on look_sessions for insert with check (true);
create policy "Allow public update look_sessions" on look_sessions for update using (true);
