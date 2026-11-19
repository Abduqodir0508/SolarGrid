'use client';

import React from 'react';
import {
  Crown,
  Check,
  X,
  ExternalLink,
  Send,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  FileText,
  UserCheck,
  LogIn,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { ProDetails } from '@/lib/supabase';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  onProActivated?: () => void;
  userId?: string;
  currentUser?: any;
  onOpenAuth?: () => void;
  proDetails?: ProDetails | null;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  isPro,
  userId,
  currentUser,
  onOpenAuth,
  proDetails,
}) => {
  if (!isOpen) return null;

  const botUsername = 'solargridpro_bot';
  const targetUserId = currentUser?.id || userId || '';
  const telegramBotLink = `https://t.me/${botUsername}${targetUserId ? `?start=${encodeURIComponent(targetUserId)}` : ''}`;

  const isGuest = !currentUser && !userId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-navy-900 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-cream-200 dark:border-navy-700 relative my-auto max-h-[92vh] overflow-y-auto text-navy-900 dark:text-cream-100 transition-colors">
        
        {/* Yopish tugmasi */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-navy-900 dark:hover:text-white rounded-xl hover:bg-cream-100 dark:hover:bg-navy-800 transition-colors"
          aria-label="Yopish"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sarlavha qismi */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-400/20 text-amber-900 dark:text-amber-300 text-xs font-black uppercase tracking-wider mb-2.5 border border-amber-300/50 dark:border-amber-700/50">
            <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500" />
            <span>SolarGrid PRO Obunasi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-navy-950 dark:text-white tracking-tight">
            Telegram Bot Orqali PRO Tarifga Ulaning
          </h2>
          <p className="text-xs sm:text-sm text-navy-600 dark:text-cream-300 mt-1">
            Quyosh panellarini professional loyihalash, AI avto-terish va to'liq smeta kalkulyatori
          </p>
        </div>

        {/* Agar foydalanuvchi PRO bo'lsa va tugashiga yaqin qolgan bo'lsa yoki faol bo'lsa */}
        {isPro && proDetails && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                <Crown className="w-4 h-4 fill-white" />
              </div>
              <div>
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                  PRO Tarifingiz Faol
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {proDetails.daysRemaining > 0
                    ? `Amal qilish muddatiga ${proDetails.daysRemaining} kun qoldi`
                    : "Muddati bugun yakunlanadi"}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-black uppercase tracking-wider border border-emerald-300 dark:border-emerald-700">
              Faol
            </span>
          </div>
        )}

        {/* PRO muddati tugashiga 3 kun qolgan ogohlantirish */}
        {proDetails?.isExpiringSoon && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold block">Diqqat: PRO muddati tugash arafasida!</span>
              <span className="text-[11px] text-amber-800 dark:text-amber-300">
                Obunangiz {proDetails.daysRemaining} kundan so'ng tugaydi. Uzluksiz ishlash uchun quyidagi bot orqali muddatni uzaytirib qo'ying.
              </span>
            </div>
          </div>
        )}

        {/* NARXLAR BLOKI: 1-oy (150,000) va Keyingi oylar (280,000) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* Birinchi oy (Start / Aksiya) */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-cream-50 to-amber-500/5 dark:from-navy-800 dark:to-navy-800/80 border-2 border-amber-400 dark:border-amber-500 shadow-sm flex flex-col justify-between">
            <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-navy-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow-xs tracking-wider">
              🔥 START AKSIYA
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-amber-800 dark:text-amber-400 tracking-wider">
                1-Oy (Birinchi marta)
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-navy-950 dark:text-white">
                  150,000
                </span>
                <span className="text-xs font-bold text-navy-700 dark:text-cream-300">
                  so'm
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                30 kunlik to'liq kirish
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-amber-200/60 dark:border-navy-700 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Yangi mijozlar uchun maxsus narx</span>
            </div>
          </div>

          {/* Keyingi oylar (Standart / Uzaytirish) */}
          <div className="p-4 rounded-2xl bg-cream-50 dark:bg-navy-800/50 border border-cream-200 dark:border-navy-700 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-black text-gray-500 dark:text-gray-400 tracking-wider">
                Keyingi oylar
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-navy-950 dark:text-white">
                  280,000
                </span>
                <span className="text-xs font-bold text-navy-700 dark:text-cream-300">
                  so'm
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Har keyingi 30 kun uchun
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-cream-200 dark:border-navy-700 text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Muntazam obunani uzaytirish</span>
            </div>
          </div>
        </div>

        {/* PRO Imkoniyatlar Ro'yxati */}
        <div className="p-4 rounded-2xl bg-cream-50 dark:bg-navy-800/60 border border-cream-200 dark:border-navy-700 text-xs space-y-2.5 mb-5">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Tarif ichiga nimalar kiradi:
          </div>
          <div className="flex items-center gap-2.5 text-navy-900 dark:text-cream-100">
            <div className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">Cheksiz loyihalar va papkalar boshqaruvi</span>
          </div>
          <div className="flex items-center gap-2.5 text-navy-900 dark:text-cream-100">
            <div className="w-5 h-5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">AI Avto-terish & Simmetrik optimizatsiya</span>
          </div>
          <div className="flex items-center gap-2.5 text-navy-900 dark:text-cream-100">
            <div className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">PDF Montaj chizmasi & Batafsil smeta eksporti</span>
          </div>
          <div className="flex items-center gap-2.5 text-navy-900 dark:text-cream-100">
            <div className="w-5 h-5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">24/7 Ustuvor texnik qo'llab-quvvatlash</span>
          </div>
        </div>

        {/* ASOSIY HARAKAT TUGMASI VA HIMOYALAR */}
        {isGuest ? (
          /* AGAR FOYDALANUVCHI SAYTGA KIRMAGAN (GUEST) BO'LSA */
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 font-bold mb-1">
                <LogIn className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Akkauntga Kirish Talab Qilinadi</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                PRO obunani faollashtirish va loyihalaringizni saqlab qolish uchun avval saytdan ro'yxatdan o'tishingiz yoki akkauntingizga kirishingiz lozim.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth();
              }}
              className="w-full py-3.5 bg-navy-900 hover:bg-navy-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-navy-950 text-white font-black rounded-2xl text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Avval Akkauntga Kirish / Ro'yxatdan O'tish</span>
            </button>
          </div>
        ) : (
          /* AGAR FOYDALANUVCHI TIZIMGA KIRGAN BO'LSA */
          <div className="space-y-3">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-cream-50 dark:bg-navy-800 border border-cream-200 dark:border-navy-700 text-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-gray-500 dark:text-gray-400">Ulangan akkaunt:</span>
              </div>
              <span className="font-bold text-navy-950 dark:text-white truncate max-w-[200px]">
                {currentUser?.email || targetUserId}
              </span>
            </div>

            <a
              href={telegramBotLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold rounded-2xl text-sm sm:text-base shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              <span>Telegram Bot Orqali Sotib Olish</span>
              <ExternalLink className="w-4 h-4 opacity-75" />
            </a>

            <p className="text-center text-[11px] text-gray-500 dark:text-gray-400">
              Botga o'tishingiz bilan sizning profilingiz avtomatik aniqlanadi va to'lov yo'riqnomasi taqdim etiladi.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
