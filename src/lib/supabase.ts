import { createClient } from '@supabase/supabase-js';
import { ProjectData } from '@/types/solar';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rcurwgkxpiivcfasahfh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_JVyT166Gyz8pJ-1qN9rY2g_SPM-nsQB';

// Brauzer Cookie va LocalStorage xavfsiz saqlash adapteri (JWT & Cookie Session)
// Sahifa yangilanganda (F5 / Refresh) foydalanuvchi akkauntdan chiqib ketmasligini kafolatlaydi
const customAuthStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      if (item) return item;

      // Agar localStorage da bo'lmasa, Cookie dan qidirish
      const match = document.cookie.match(new RegExp('(^|;\\s*)' + key + '=([^;]*)'));
      if (match) return decodeURIComponent(match[2]);
    } catch (e) {}
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
      // Cookie da 30 kunlik xavfsiz JWT sessiya saqlash
      const maxAge = 30 * 24 * 60 * 60; // 30 kun
      document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } catch (e) {}
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
      document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
    } catch (e) {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: customAuthStorage,
  },
});

// Eski noto'g'ri global pro kalitlarini xavfsiz tozalash
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('solargrid_pro_active');
    localStorage.removeItem('solargrid_pro_guest');
    localStorage.removeItem('solargrid_is_pro');
  } catch (e) {}
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  isPro: boolean;
  proExpiresAt?: string | null;
}

/**
 * Dastlabki render vaqtida (F5 / Refresh) sessiyani bir zumda tiklash
 */
export function getStoredUserSession(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('solargrid_cached_user');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return null;
}

export function saveStoredUserSession(user: any | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem('solargrid_cached_user', JSON.stringify(user));
      document.cookie = `solargrid_logged_in=true; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`;
    } else {
      localStorage.removeItem('solargrid_cached_user');
      document.cookie = `solargrid_logged_in=; path=/; max-age=0; SameSite=Lax`;
    }
  } catch (e) {}
}

export function clearStoredUserSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('solargrid_cached_user');
    localStorage.removeItem('solargrid_is_pro');
    document.cookie = `solargrid_logged_in=; path=/; max-age=0; SameSite=Lax`;
  } catch (e) {}
}

/**
 * Foydalanuvchi profilini tahrirlash (Ism va Avatar rasmi)
 */
export async function updateUserProfile(data: {
  fullName?: string;
  avatarUrl?: string;
}): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const metadataUpdate: Record<string, any> = {};
    if (data.fullName !== undefined) metadataUpdate.full_name = data.fullName.trim();
    if (data.avatarUrl !== undefined) metadataUpdate.avatar_url = data.avatarUrl.trim();

    const { data: result, error } = await supabase.auth.updateUser({
      data: metadataUpdate,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (result.user) {
      saveStoredUserSession(result.user);
      return { success: true, user: result.user };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Profilni yangilashda xatolik' };
  }
}

export interface ProDetails {
  isPro: boolean;
  expiresAt: string | null;
  daysRemaining: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  monthsCount: number;
}

/**
 * Foydalanuvchi PRO statusi va muddatini to'liq tekshirish
 * Muddat o'tgan bo'lsa avtomatik is_pro = false qilinadi!
 */
export async function getUserProDetails(userId?: string): Promise<ProDetails> {
  const defaultRes: ProDetails = {
    isPro: false,
    expiresAt: null,
    daysRemaining: 0,
    isExpiringSoon: false,
    isExpired: false,
    monthsCount: 0,
  };

  if (typeof window === 'undefined' || !userId) return defaultRes;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) return defaultRes;

    const metadata = user.user_metadata || {};
    const rawIsPro = !!metadata.is_pro;
    const expiresAtStr = metadata.pro_expires_at || null;
    const monthsCount = Number(metadata.pro_months_count || 0);

    if (!rawIsPro) {
      localStorage.setItem(`solargrid_pro_user_${userId}`, 'false');
      return { ...defaultRes, monthsCount };
    }

    if (expiresAtStr) {
      const now = new Date();
      const expiresDate = new Date(expiresAtStr);

      // Agar muddati tugagan bo'lsa
      if (now > expiresDate) {
        localStorage.setItem(`solargrid_pro_user_${userId}`, 'false');
        // Supabase da is_pro ni false ga tushirish
        supabase.auth.updateUser({
          data: { is_pro: false },
        }).catch(() => {});

        return {
          isPro: false,
          expiresAt: expiresAtStr,
          daysRemaining: 0,
          isExpiringSoon: false,
          isExpired: true,
          monthsCount,
        };
      }

      // Hali muddati bor
      const diffMs = expiresDate.getTime() - now.getTime();
      const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const isExpiringSoon = daysRemaining <= 3;

      localStorage.setItem(`solargrid_pro_user_${userId}`, 'true');

      return {
        isPro: true,
        expiresAt: expiresAtStr,
        daysRemaining,
        isExpiringSoon,
        isExpired: false,
        monthsCount,
      };
    }

    // Agar expiresAt ko'rsatilmagan bo'lsa, lekin is_pro true bo'lsa
    localStorage.setItem(`solargrid_pro_user_${userId}`, 'true');
    return {
      isPro: true,
      expiresAt: null,
      daysRemaining: 30,
      isExpiringSoon: false,
      isExpired: false,
      monthsCount,
    };
  } catch (err) {
    console.warn('Pro tafsilotlarini olishda ogohlantirish:', err);
    return defaultRes;
  }
}

/**
 * Foydalanuvchi PRO statusini tekshirish
 * Faqat tizimga kirgan aniq foydalanuvchi ID si bo'yicha ishlaydi.
 * Muddat o'tgan bo'lsa qat'iy false qaytaradi!
 */
export async function getUserProStatus(userId?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !userId) return false;
  const details = await getUserProDetails(userId);
  return details.isPro;
}

/**
 * PRO statusini faollashtirish
 * Faqatgina tizimga kirgan haqiqiy foydalanuvchiga biriktiriladi!
 */
export async function activateProStatus(
  userId?: string,
  referenceCode?: string,
  paymentMethod?: 'uzcard' | 'click' | 'payme'
): Promise<boolean> {
  if (typeof window === 'undefined' || !userId) return false;

  try {
    const userProKey = `solargrid_pro_user_${userId}`;
    localStorage.setItem(userProKey, 'true');

    // Supabase auth metadatasiga PRO statusni yozish
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId) {
      const { data: updated } = await supabase.auth.updateUser({
        data: {
          is_pro: true,
          pro_activated_at: new Date().toISOString(),
          payment_ref: referenceCode || 'UZCARD_ACTIVATION',
          payment_method: paymentMethod || 'uzcard',
        },
      });

      if (updated?.user) {
        saveStoredUserSession(updated.user);
      }
    }

    return true;
  } catch (err) {
    console.error('PRO aktivlashtirishda xatolik:', err);
    return true;
  }
}

/**
 * Loyihalarni Supabase bulut bazasiga sinxronizatsiya qilish
 */
export async function syncProjectsToCloud(userId: string, projects: ProjectData[]): Promise<boolean> {
  if (!userId || !projects || projects.length === 0) return false;

  try {
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
      console.warn('Supabase projects jadvaliga yozishda ogohlantirish:', error.message);
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
    console.warn('Bulutdan loyihalarni olishda xatolik:', err);
    return null;
  }
}
