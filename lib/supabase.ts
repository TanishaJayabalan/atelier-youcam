import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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

let serverClient: SupabaseClient | null = null;
let browserClient: SupabaseClient | null = null;

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !url.startsWith('https://')) {
    throw new Error('Missing or invalid NEXT_PUBLIC_SUPABASE_URL in environment.');
  }

  const key = serviceKey || anonKey;
  if (!key) {
    throw new Error('Missing Supabase API key (NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY).');
  }

  return { url, key, anonKey: anonKey || key };
}

/**
 * Server-side Supabase client (prefers Service Role Key to bypass RLS in API routes).
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (serverClient) return serverClient;
  const { url, key } = getCredentials();

  serverClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return serverClient;
}

/**
 * Browser / Client-side Supabase client.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const { url, anonKey } = getCredentials();

  browserClient = createClient(url, anonKey);
  return browserClient;
}

// -------------------------------------------------------------
// Real Supabase Database Access Helpers
// -------------------------------------------------------------

/**
 * Fetches all closet items from Supabase.
 */
export async function getClosetItems(filter?: { category?: ClosetCategory; isOwned?: boolean }): Promise<ClosetItem[]> {
  const supabase = getSupabaseServerClient();

  let query = supabase.from('closet_items').select('*');
  if (filter?.category) {
    query = query.eq('category', filter.category);
  }
  if (filter?.isOwned !== undefined) {
    query = query.eq('is_owned', filter.isOwned);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch closet items from Supabase: ${error.message}`);
  }

  return (data || []) as ClosetItem[];
}

/**
 * Upserts a closet item to Supabase PostgreSQL database.
 */
export async function upsertClosetItem(item: Partial<ClosetItem> & { name: string; category: ClosetCategory }): Promise<ClosetItem> {
  const id = item.id && item.id.includes('-') ? item.id : generateUuid();
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

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('closet_items').upsert(fullItem);
  if (error) {
    throw new Error(`Failed to upsert closet item in Supabase: ${error.message}`);
  }

  return fullItem;
}

/**
 * Saves a look session to Supabase PostgreSQL database.
 */
export async function saveLookSession(session: Partial<LookSession>): Promise<LookSession> {
  const id = session.id && session.id.includes('-') ? session.id : generateUuid();
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

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('look_sessions').upsert(fullSession);
  if (error) {
    throw new Error(`Failed to save look session in Supabase: ${error.message}`);
  }

  return fullSession;
}

/**
 * Retrieves a look session by ID from Supabase PostgreSQL database.
 */
export async function getLookSession(id: string): Promise<LookSession | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from('look_sessions').select('*').eq('id', id).single();
  if (error) {
    return null;
  }

  return data as LookSession;
}
