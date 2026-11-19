import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rcurwgkxpiivcfasahfh.supabase.co';
// Vercel build vaqtida SUPABASE_SERVICE_ROLE_KEY o'rnatilmagan bo'lsa build fail bo'lmasligi uchun xavfsiz fallback
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_JVyT166Gyz8pJ-1qN9rY2g_SPM-nsQB';

/**
 * Supabase Admin klienti:
 * Server muhitida SUPABASE_SERVICE_ROLE_KEY bilan ishlaydi,
 * Build vaqtida esa xatosiz muvaffaqiyatli kompilyatsiya bo'ladi.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
