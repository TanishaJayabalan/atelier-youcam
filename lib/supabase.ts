import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type ClosetCategory =
  | 'outfit_top'
  | 'outfit_bottom'
  | 'outfit_dress'
  | 'outfit_outer'
  | 'makeup'
  | 'skincare'
  | 'haircare';

export interface OutfitMetadata {
  formality_tag: 'casual' | 'classy' | 'elegant' | 'bold';
  color: string;
  color_hex?: string;
  weather_tags: string[]; // e.g. ['hot', 'warm', 'rain', 'cool', 'cold']
  fabric?: string;
}

export interface MakeupMetadata {
  product_category: 'foundation' | 'blush' | 'lip' | 'eyeshadow' | 'eyebrow';
  shade_hex: string;
  shade_name?: string;
  finish: 'matte' | 'dewy' | 'satin' | 'glossy' | 'shimmer';
  coverage?: 'sheer' | 'medium' | 'full';
}

export interface SkincareMetadata {
  step_category: 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'spf' | 'treatment' | 'mask';
  active_ingredients: string[]; // e.g. ['retinol', 'niacinamide', 'hyaluronic_acid', 'salicylic_acid', 'ceramides', 'zinc_oxide']
  timing: 'AM' | 'PM' | 'both';
  texture?: 'gel' | 'cream' | 'fluid' | 'oil';
}

export type ClosetMetadata = OutfitMetadata | MakeupMetadata | SkincareMetadata | Record<string, any>;

export interface ClosetItem {
  id: string;
  category: ClosetCategory;
  name: string;
  brand?: string;
  image_url: string;
  is_owned: boolean;
  metadata: ClosetMetadata;
  created_at?: string;
  updated_at?: string;
}

export interface LookSession {
  id: string;
  created_at: string;
  vibe: 'classy' | 'elegant' | 'bold' | 'natural' | string;
  selfie_url?: string;
  skin_analysis?: any;
  skin_tone?: any;
  weather?: any;
  recommendation?: any;
  makeup_result_url?: string;
  outfit_result_url?: string;
}

import demoClosetData from '../data/demo-closet.json';

// In-Memory Fallback Storage (Used when Supabase credentials are not yet configured)
class InMemoryStore {
  private closetItems: Map<string, ClosetItem> = new Map();
  private sessions: Map<string, LookSession> = new Map();

  constructor() {
    this.seedDefaultItems();
  }

  seedDefaultItems() {
    if (Array.isArray(demoClosetData)) {
      for (const item of demoClosetData as ClosetItem[]) {
        this.closetItems.set(item.id, item);
      }
    }
  }

  setItems(items: ClosetItem[]) {
    this.closetItems.clear();
    for (const item of items) {
      this.closetItems.set(item.id, item);
    }
  }

  getItems(): ClosetItem[] {
    return Array.from(this.closetItems.values());
  }

  upsertItem(item: ClosetItem): ClosetItem {
    this.closetItems.set(item.id, item);
    return item;
  }

  saveSession(session: LookSession): LookSession {
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(id: string): LookSession | null {
    return this.sessions.get(id) || null;
  }
}

export const inMemoryStore = new InMemoryStore();

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !url.startsWith('https://') || url.includes('mock.supabase.co')) {
    return false;
  }
  return Boolean(serviceKey || anonKey);
}

let serverClient: SupabaseClient | null = null;
let browserClient: SupabaseClient | null = null;

/**
 * Server-side Supabase client (prefers Service Role Key to bypass RLS in API routes).
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (serverClient) return serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  serverClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return serverClient;
}

/**
 * Browser / Client-side Supabase client.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  browserClient = createClient(url, key);
  return browserClient;
}

// -------------------------------------------------------------
// Unified Database Access Helpers (Transparent Fallback)
// -------------------------------------------------------------

/**
 * Fetches all closet items (from Supabase or in-memory fallback).
 */
export async function getClosetItems(filter?: { category?: ClosetCategory; isOwned?: boolean }): Promise<ClosetItem[]> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    let query = supabase.from('closet_items').select('*');
    if (filter?.category) {
      query = query.eq('category', filter.category);
    }
    if (filter?.isOwned !== undefined) {
      query = query.eq('is_owned', filter.isOwned);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as ClosetItem[];
    }
  }

  // In-memory fallback
  let items = inMemoryStore.getItems();
  if (filter?.category) {
    items = items.filter((i) => i.category === filter.category);
  }
  if (filter?.isOwned !== undefined) {
    items = items.filter((i) => i.is_owned === filter.isOwned);
  }
  return items;
}

/**
 * Upserts a closet item (to Supabase and/or in-memory store).
 */
export async function upsertClosetItem(item: Partial<ClosetItem> & { name: string; category: ClosetCategory }): Promise<ClosetItem> {
  const id = item.id || `item_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const fullItem: ClosetItem = {
    id,
    category: item.category,
    name: item.name,
    brand: item.brand,
    image_url: item.image_url || '',
    is_owned: item.is_owned !== undefined ? item.is_owned : true,
    metadata: item.metadata || {},
    created_at: item.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  inMemoryStore.upsertItem(fullItem);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    await supabase.from('closet_items').upsert(fullItem);
  }

  return fullItem;
}

/**
 * Saves a look session.
 */
export async function saveLookSession(session: Partial<LookSession>): Promise<LookSession> {
  const id = session.id || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const fullSession: LookSession = {
    id,
    created_at: session.created_at || new Date().toISOString(),
    vibe: session.vibe || 'natural',
    selfie_url: session.selfie_url,
    skin_analysis: session.skin_analysis,
    skin_tone: session.skin_tone,
    weather: session.weather,
    recommendation: session.recommendation,
    makeup_result_url: session.makeup_result_url,
    outfit_result_url: session.outfit_result_url,
  };

  inMemoryStore.saveSession(fullSession);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    await supabase.from('look_sessions').upsert(fullSession);
  }

  return fullSession;
}

/**
 * Retrieves a look session by ID.
 */
export async function getLookSession(id: string): Promise<LookSession | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from('look_sessions').select('*').eq('id', id).single();
    if (!error && data) {
      return data as LookSession;
    }
  }

  return inMemoryStore.getSession(id);
}
