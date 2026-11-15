'use client';

import React, { useState, useRef } from 'react';
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
  Image as ImageIcon,
  ArrowRight,
  AlertCircle,
  Clock,
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
  // To'lov usuli: 'click' | 'payme'
  const [paymentMethod, setPaymentMethod] = useState<'click' | 'payme'>('click');

  // Nusxalash
  const [copiedCard, setCopiedCard] = useState(false);

  // Chek yuklash va tranzaksiya kodi
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [referenceCode, setReferenceCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Holatlar
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const cardNumber = '8600 3304 9812 7741';
  const cardHolder = 'SolarGrid Texnologiyalari (MCHJ)';
  const amountUzs = '49,000 UZS';

  const handleCopyCard = () => {
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''));
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setValidationError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleActivatePro = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Xavfsizlik va tekshiruv: hech qanday to'lov cheki yoki kod kiritilmagan bo'lsa ruxsat berilmaydi!
    if (!receiptFile && !referenceCode.trim()) {
      setValidationError(
        'Iltimos, to\'lov cheki skrinshotini yuklang yoki tranzaksiya (chek) raqamini kiriting!'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const codeOrRef = referenceCode.trim() || `RECEIPT_${receiptFile?.name || 'IMG'}`;
      await activateProStatus(userId, codeOrRef, paymentMethod);

      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#1E293B', '#8B5CF6'],
        });
      } catch (err) {}

      setSuccess(true);
      onProActivated();

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
        setSuccess(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-cream-200 relative my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Yopish tugmasi */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-navy-900 rounded-xl hover:bg-cream-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sarlavha */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-black uppercase tracking-wider mb-2 border border-amber-200">
            <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>SolarGrid PRO Tariflari</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
            Quyosh Panellari O'rnatuvchi Ustalar Uchun Professional Imkoniyatlar
          </h2>
          <p className="text-xs sm:text-sm text-navy-600 max-w-md mx-auto mt-1">
            Mijozlarga professional smeta va montaj chizmasi tuzing, AI avto-terish bilan vaqtingizni tejang
          </p>
        </div>

        {/* Agar foydalanuvchi allaqachon PRO bo'lsa */}
        {isPro && !success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Crown className="w-5 h-5 fill-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-900 block">
                  Sizda PRO tarif allaqachon faollashtirilgan!
                </span>
                <span className="text-[11px] text-emerald-700">
                  Cheksiz loyihalar, AI avto-terish va bulutli saqlash ochiq.
                </span>
              </div>
            </div>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full border border-emerald-300">
              Faol
            </span>
          </div>
        )}

        {/* Muvaffaqiyat xabari */}
        {success && (
          <div className="p-5 bg-emerald-500 text-white rounded-2xl mb-6 text-center animate-in zoom-in-95 shadow-lg">
            <Crown className="w-10 h-10 mx-auto mb-2 animate-bounce" />
            <h3 className="text-lg font-black">To'lovingiz Qabul Qilindi!</h3>
            <p className="text-xs text-emerald-100 mt-1">
              Tabriklaymiz! PRO tarif muvaffaqiyatli faollashtirildi. Barcha cheklovlar olib tashlandi!
            </p>
          </div>
        )}

        {/* 1. TARIFLAR KARTALARI (STANDART VS PRO) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
          
          {/* Standart Bepul */}
          <div className="p-4 rounded-2xl border border-cream-300 bg-cream-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
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

            <div className="py-1.5 text-center text-xs font-bold text-gray-400 bg-cream-200/50 rounded-xl">
              Boshlang'ich rejim
            </div>
          </div>

          {/* PRO Versiya */}
          <div className="p-4 rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50/40 to-white flex flex-col justify-between relative shadow-md shadow-amber-500/10">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-navy-950 font-black text-[10px] uppercase tracking-wider shadow-sm">
              Tavsiya Qilinadi
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 fill-amber-500" />
                  PRO Versiya
                </span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  Maxsus Aksiya
                </span>
              </div>

              <div className="text-2xl font-black text-navy-950 mb-0.5 flex items-baseline gap-1.5">
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
                  <span><strong>Cheksiz</strong> loyihalar va papkalar yaratish</span>
                </li>
                <li className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span><strong>AI Avto-terish:</strong> simmetrik va optimal</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span><strong>PDF Montaj Chizmasi:</strong> usta uchun santimetrlik jadval</span>
                </li>
                <li className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span><strong>3D Simulyatsiya:</strong> real quyosh va soya</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>Supabase Cloud:</strong> barcha telefon/kompyuterda sinxron</span>
                </li>
              </ul>
            </div>

            <div className="py-1.5 text-center text-xs font-extrabold text-navy-950 bg-amber-400 rounded-xl shadow-xs">
              Cheksiz Imkoniyat
            </div>
          </div>

        </div>

        {/* 2. REAL TO'LOV VA AKTIVLASHTIRISH BO'LIMI */}
        {!isPro && !success && (
          <div className="p-4 sm:p-5 bg-cream-50 rounded-2xl border border-cream-300 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-cream-200">
              <span className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-600" />
                To'lov Tizimini Tanlang:
              </span>
              <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                {amountUzs}
              </span>
            </div>

            {/* Click va Payme alohida tugmalari */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('click')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-black text-xs transition-all ${
                  paymentMethod === 'click'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/30 shadow-sm'
                    : 'border-cream-300 hover:border-cream-400 bg-white text-navy-700'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span>Click orqali to'lash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('payme')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-black text-xs transition-all ${
                  paymentMethod === 'payme'
                    ? 'border-teal-500 bg-teal-50/70 text-teal-900 ring-2 ring-teal-500/30 shadow-sm'
                    : 'border-cream-300 hover:border-cream-400 bg-white text-navy-700'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <span>Payme orqali to'lash</span>
              </button>
            </div>

            {/* To'lov uchun karta ma'lumotlari */}
            <div className="p-3.5 bg-white rounded-xl border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">
                  {paymentMethod === 'click' ? 'Click orqali to\'lov kartasi' : 'Payme orqali to\'lov kartasi'}:
                </span>
                <span className="text-base font-mono font-black text-navy-950 tracking-wider">
                  {cardNumber}
                </span>
                <span className="text-[11px] text-gray-600 block">
                  Qabul qiluvchi: <strong>{cardHolder}</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyCard}
                className="flex items-center justify-center gap-1 px-3.5 py-2 bg-cream-100 hover:bg-cream-200 text-navy-900 rounded-xl text-xs font-bold transition-all self-start sm:self-center border border-cream-300 active:scale-95"
              >
                {copiedCard ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Nusxalandi!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-navy-700" />
                    <span>Raqamni Nusxalash</span>
                  </>
                )}
              </button>
            </div>

            {/* Xatolik xabari */}
            {validationError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* To'lovni tasdiqlash: Skrinshot yuklash yoki Kod kiritish */}
            <form onSubmit={handleActivatePro} className="space-y-3">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Chek skrinshotini yuklash */}
                <div>
                  <label className="text-[11px] font-bold text-navy-800 block mb-1">
                    1. To'lov cheki skrinshoti (Rasm):
                  </label>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                      receiptFile
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800'
                        : 'border-cream-300 hover:border-amber-400 bg-white text-navy-700'
                    }`}
                  >
                    {receiptPreview ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={receiptPreview}
                          alt="Chek"
                          className="w-8 h-8 object-cover rounded-lg border border-cream-300"
                        />
                        <span className="text-xs font-bold truncate max-w-[140px]">
                          {receiptFile?.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-xs font-semibold">
                          Chek rasmini yuklash
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Admin tasdig'i / Tranzaksiya kodi */}
                <div>
                  <label className="text-[11px] font-bold text-navy-800 block mb-1">
                    2. Chek raqami yoki Faollashtirish kodi:
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: 9812450 yoki PRO49000"
                    value={referenceCode}
                    onChange={(e) => {
                      setReferenceCode(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white h-[46px]"
                  />
                </div>
              </div>

              {/* Tasdiqlash tugmasi */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 font-black rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>To'lov tekshirilmoqda va faollashtirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 fill-navy-950" />
                    <span>To'lov Chekini Yuborish va PRO ni Faollashtirish</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-gray-500 text-center">
                Click yoki Payme da 49,000 so'm o'tkazib, chek skrinshotini yuklang yoki chek raqamini kiriting
              </p>
            </form>

          </div>
        )}

      </div>
    </div>
  );
};
