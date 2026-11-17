import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rcurwgkxpiivcfasahfh.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Supabase Admin klienti faqatgina serverda (API Routes va bot logic) ishlatiladi.
 * Service role kaliti orqali emailni avtomatik tasdiqlash, foydalanuvchini yaratish va PRO status berish mumkin.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
