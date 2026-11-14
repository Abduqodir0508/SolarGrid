'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { activateProStatus } from '@/lib/supabase';
import {
  Crown,
  Check,
  X,
  CreditCard,
  Copy,
  Sparkles,
  Zap,
  Layers,
  Wand2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Upload,
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  onProActivated: () => void;
  userId?: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  isPro,
  onProActivated,
  userId,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [copiedCard, setCopiedCard] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const cardNumber = '8600 3304 9812 7741';

  const handleCopyCard = () => {
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''));
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  const handleActivatePro = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await activateProStatus(userId, paymentRef || 'CLICK_PAYME_VERIFIED');

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#1E293B', '#8B5CF6'],
        });
      } catch (err) {}

      setSuccess(true);
      onProActivated();

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-cream-200 relative my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Yopish tugmasi */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-navy-900 rounded-xl hover:bg-cream-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sarlavha */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-black uppercase tracking-wider mb-2 border border-amber-200">
            <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>SolarGrid PRO Tariflari</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
            Quyosh Panellari O'rnatuvchi Ustalar Uchun Professional Imkoniyatlar
          </h2>
          <p className="text-xs sm:text-sm text-navy-600 max-w-md mx-auto mt-1">
            Mijozlarga professional smeta tuzing va ob'yektlarni bir zumda hisoblang
          </p>
        </div>

        {/* Agar foydalanuvchi allaqachon PRO bo'lsa */}
        {isPro && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl mb-6 text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-sm mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Sizda PRO tarif allaqachon faol!</span>
            </div>
            <p className="text-xs text-emerald-700">
              Cheksiz loyihalar, AI avto-terish va bulutli sinxronizatsiya imkoniyatlaridan to'liq foydalanishingiz mumkin.
            </p>
          </div>
        )}

        {/* Muvaffaqiyat xabari */}
        {success && (
          <div className="p-4 bg-emerald-500 text-white rounded-2xl mb-6 text-center animate-in zoom-in-95">
            <Crown className="w-8 h-8 mx-auto mb-1 animate-bounce" />
            <h3 className="text-base font-extrabold">Tabriklaymiz! PRO Tarif Faollashtirildi!</h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              Barcha cheklovlar olib tashlandi. Dasturdan zavqlanib foydalaning!
            </p>
          </div>
        )}

        {/* Solishtirma tariflar kartalari */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          
          {/* 1. Standart Tarif */}
          <div className="p-4 sm:p-5 rounded-2xl border border-cream-300 bg-cream-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                  Standart
                </span>
                <span className="text-[10px] font-semibold text-gray-500 bg-cream-200 px-2 py-0.5 rounded-full">
                  Bepul
                </span>
              </div>

              <div className="text-2xl font-black text-navy-950 mb-3">
                0 <span className="text-xs font-semibold text-gray-500">so'm</span>
              </div>

              <ul className="space-y-2 text-xs text-navy-700 mb-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>3 tagacha saqlanadigan loyiha</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>2D muhandislik chizmasi</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Standart quyosh panellari</span>
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <X className="w-4 h-4 flex-shrink-0" />
                  <span>AI Avto-Joylashtirish yo'q</span>
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <X className="w-4 h-4 flex-shrink-0" />
                  <span>PDF / Print smeta chiqarish yo'q</span>
                </li>
              </ul>
            </div>

            <div className="py-2 text-center text-xs font-bold text-gray-400 bg-cream-200/50 rounded-xl">
              Joriy asosiy tarif
            </div>
          </div>

          {/* 2. PRO Tarif (Tavsiya qilinadi) */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50/40 to-white flex flex-col justify-between relative shadow-lg shadow-amber-500/10">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-navy-950 font-black text-[10px] uppercase tracking-wider shadow-sm">
              Tavsiya Qilinadi
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 fill-amber-500" />
                  PRO Versiya
                </span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  Aksiya 50%
                </span>
              </div>

              <div className="text-2xl font-black text-navy-950 mb-1 flex items-baseline gap-1.5">
                <span>49,000</span>
                <span className="text-xs font-bold text-navy-700">so'm / oyiga</span>
                <span className="text-xs line-through text-gray-400 font-normal">($30)</span>
              </div>
              <p className="text-[11px] text-amber-800 font-medium mb-3">
                Kompaniyalar va mustaqil quyosh ustalari uchun
              </p>

              <ul className="space-y-2 text-xs text-navy-800 mb-4 font-medium">
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span><strong>Cheksiz</strong> loyihalar va papkalar</span>
                </li>
                <li className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span><strong>AI Avto-Terish:</strong> simmetrik va optimal</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span><strong>Tayyor Smeta:</strong> A4 Print va PDF eksport</span>
                </li>
                <li className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span><strong>3D Simulyatsiya:</strong> real quyosh va soya</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>Supabase Cloud:</strong> barcha telefon/kompyuterda</span>
                </li>
              </ul>
            </div>

            <div className="py-2 text-center text-xs font-extrabold text-navy-950 bg-amber-400 rounded-xl shadow-xs">
              Eng foydali tanlov
            </div>
          </div>

        </div>

        {/* To'lov bo'limi (Click / Payme / Karta) */}
        {!isPro && !success && (
          <div className="p-4 sm:p-5 bg-cream-50 rounded-2xl border border-cream-300 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cream-200">
              <div className="flex items-center gap-2 text-xs font-extrabold text-navy-900">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>To'lov usuli (Click / Payme / UzCard / Humo):</span>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-lg">
                49,000 UZS
              </span>
            </div>

            {/* Karta rekvizitlari */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-xl border border-cream-200">
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-semibold">
                  Qabul qiluvchi karta:
                </span>
                <span className="text-sm font-mono font-bold text-navy-950 tracking-wider">
                  {cardNumber}
                </span>
                <span className="text-[10px] text-gray-600 block">
                  SolarGrid Texnologiyalari (MCHJ)
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyCard}
                className="flex items-center justify-center gap-1 px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-navy-800 rounded-lg text-xs font-bold transition-all self-start sm:self-center"
              >
                {copiedCard ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Nusxalandi!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Nusxalash</span>
                  </>
                )}
              </button>
            </div>

            {/* To'lov cheki kiritish / faollashtirish */}
            <form onSubmit={handleActivatePro} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-navy-800 block mb-1">
                  Click/Payme tranzaksiya raqami yoki chek kodi:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Masalan: 98451230 yoki Chek raqami"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Click yoki Payme ilovasida 49,000 so'm o'tkazib, chekdagi raqamni kiriting
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 font-black rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4 fill-navy-950" />
                <span>
                  {isSubmitting
                    ? 'Tekshirilmoqda va Faollashtirilmoqda...'
                    : 'To\'lovni Tasdiqlash va PRO ni Faollashtirish'}
                </span>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
