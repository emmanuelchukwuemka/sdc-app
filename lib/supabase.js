// lib/supabase.js
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Read from app.json → expo.extra first, then env fallbacks
const extra = Constants?.expoConfig?.extra ?? {};

const SUPABASE_URL =
  extra.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_ANON_KEY =
  extra.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase config: set expo.extra.supabaseUrl / supabaseAnonKey in app.json or EXPO_PUBLIC_/NEXT_PUBLIC_ env vars.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
