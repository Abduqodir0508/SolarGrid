import { createClient } from '@supabase/supabase-js';
import { ProjectData } from '@/types/solar';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rcurwgkxpiivcfasahfh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_JVyT166Gyz8pJ-1qN9rY2g_SPM-nsQB';

// Brauzer uchun Supabase mijozi
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface UserProfile {
  id: string;
  email: string;
  isPro: boolean;
  proExpiresAt?: string | null;
}

/**
 * Foydalanuvchi PRO statusini o'qish (localStorage va Supabase user_metadata)
 */
export async function getUserProStatus(userId?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. LocalStorage dan tekshirish
  const localPro = localStorage.getItem(`solargrid_pro_${userId || 'guest'}`);
  if (localPro === 'true') return true;

  // 2. Supabase foydalanuvchi metadatasidan tekshirish
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const isPro = !!user.user_metadata?.is_pro;
      if (isPro) {
        localStorage.setItem(`solargrid_pro_${user.id}`, 'true');
        return true;
      }
    }
  } catch (err) {
    console.warn('Pro statusini olishda xatolik:', err);
  }

  return false;
}

/**
 * PRO statusini faollashtirish (To'lov cheki yuborilganda yoki mock to'lovda)
 */
export async function activateProStatus(userId?: string, referenceCode?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const targetId = userId || 'guest';
    localStorage.setItem(`solargrid_pro_${targetId}`, 'true');
    localStorage.setItem('solargrid_pro_active', 'true');

    // Agar tizimga kirgan bo'lsa Supabase metadatasiga saqlash
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.auth.updateUser({
        data: {
          is_pro: true,
          pro_activated_at: new Date().toISOString(),
          payment_ref: referenceCode || 'MANUAL_ACTIVATION',
        },
      });
    }
    return true;
  } catch (err) {
    console.error('PRO aktivlashtirishda xatolik:', err);
    return true; // LocalStorage da baribir saqlanadi
  }
}

/**
 * Loyihalarni Supabase bulut bazasiga sinxronizatsiya qilish
 */
export async function syncProjectsToCloud(userId: string, projects: ProjectData[]): Promise<boolean> {
  if (!userId || !projects || projects.length === 0) return false;

  try {
    // Supabase da projects jadvali bo'lsa saqlaydi
    const payload = projects.map((p) => ({
      id: p.id,
      user_id: userId,
      project_name: p.projectName,
      client_name: p.clientName,
      address: p.address || '',
      roof_data: p.roof,
      panels_data: p.panels,
      financial_data: p.financialSettings,
      updated_at: p.updatedAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from('projects').upsert(payload, { onConflict: 'id' });
    if (error) {
      // Agar jadval hali mavjud bo'lmasa, ogohlantirish beriladi lekin dastur to'xtamaydi
      console.warn('Supabase projects jadvaliga yozishda eslatma (offline fallback ishlaydi):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Bulutga sinxronlashda xatolik:', err);
    return false;
  }
}

/**
 * Loyihalarni Supabase bulut bazasidan yuklash
 */
export async function fetchProjectsFromCloud(userId: string): Promise<ProjectData[] | null> {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error || !data || data.length === 0) return null;

    return data.map((item: any) => ({
      id: item.id,
      version: '1.0',
      projectName: item.project_name || 'Loyiha',
      clientName: item.client_name || 'Mijoz',
      clientPhone: item.client_phone || '',
      address: item.address || '',
      roof: item.roof_data,
      panels: item.panels_data || [],
      financialSettings: item.financial_data,
      createdAt: item.created_at || new Date().toISOString(),
      updatedAt: item.updated_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Bulutdan yuklashda xatolik:', err);
    return null;
  }
}
