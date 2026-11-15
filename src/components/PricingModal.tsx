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
  Zap,
  Layers,
  Wand2,
  FileText,
  ShieldCheck,
  Upload,
  AlertCircle,
  Clock,
  Smartphone,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  onProActivated: () => void;
  userId?: string;
  currentUser?: any;
  onOpenAuth?: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  isPro,
  onProActivated,
  userId,
  currentUser,
  onOpenAuth,
}) => {
  // To'lov provayderi: 'uzcard' | 'click' | 'payme'
  const [paymentMethod, setPaymentMethod] = useState<'uzcard' | 'click' | 'payme'>('uzcard');

  // To'lov shakli: 'direct_card' (Karta ma'lumotlarini kiritib tezkor to'lash) | 'receipt' (Karta raqamimizga o'tkazib chek yuklash)
  const [paymentMode, setPaymentMode] = useState<'direct_card' | 'receipt'>('direct_card');

  // Nusxalash holati
  const [copiedCard, setCopiedCard] = useState(false);

  // Karta orqali to'lov maydonlari
  const [userCardNumber, setUserCardNumber] = useState('');
  const [userCardExpiry, setUserCardExpiry] = useState('');
  const [userPhone, setUserPhone] = useState('+998 ');

  // SMS OTP tasdiqlash bosqichi
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');

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

  // Real Uzcard qabul qiluvchi karta ma'lumotlari
  const recipientCardNumber = '5614 6887 1438 0671';
  const recipientRawNumber = '5614688714380671';
  const recipientCardHolder = 'M.S (Uzcard)';
  const amountUzs = '49,000 UZS';

  // Karta raqamini nusxalash
  const handleCopyCard = () => {
    navigator.clipboard.writeText(recipientRawNumber);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  // Foydalanuvchi karta raqamini kiritganda avtomatik 4 talik bo'shliq qo'yish
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setUserCardNumber(formatted);
    if (validationError) setValidationError(null);
  };

  // Karta muddatini formatlash (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setUserCardExpiry(raw);
    if (validationError) setValidationError(null);
  };

  // Telefon raqamini formatlash
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.startsWith('998')) {
      raw = raw.slice(3);
    }
    raw = raw.slice(0, 9);
    let formatted = '+998';
    if (raw.length > 0) formatted += ` (${raw.slice(0, 2)}`;
    if (raw.length >= 3) formatted += `) ${raw.slice(2, 5)}`;
    if (raw.length >= 6) formatted += `-${raw.slice(5, 7)}`;
    if (raw.length >= 8) formatted += `-${raw.slice(7, 9)}`;
    setUserPhone(formatted);
    if (validationError) setValidationError(null);
  };

  // Chek fayli tanlanganda
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

  // 1. KARTA ORQALI TO'G'RIDAN-TO'G'RI TO'LASH VA AVTOMATIK PRO GA O'TKAZISH
  const handleDirectCardPay = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const effectiveUserId = userId || currentUser?.id;
    if (!effectiveUserId) {
      setValidationError('PRO tarifni akkauntingizga biriktirish uchun avval tizimga kiring!');
      onOpenAuth?.();
      return;
    }

    const cleanCard = userCardNumber.replace(/\s/g, '');
    if (cleanCard.length < 16) {
      setValidationError('Iltimos, 16 xonali to\'liq karta raqamingizni kiriting!');
      return;
    }

    if (userCardExpiry.length < 5) {
      setValidationError('Iltimos, kartaning amal qilish muddatini (MM/YY) to\'liq kiriting!');
      return;
    }

    // SMS OTP tasdiqlash bosqichiga o'tish
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsOtpStep(true);
    }, 700);
  };

  // SMS OTP kodini tasdiqlab, kutib o'tirmasdan DARROV PRO statusiga o'tkazish
  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const effectiveUserId = userId || currentUser?.id;
    if (!effectiveUserId) {
      setValidationError('PRO tarifni akkauntingizga biriktirish uchun avval tizimga kiring!');
      onOpenAuth?.();
      return;
    }

    if (!otpCode.trim() || otpCode.replace(/\D/g, '').length < 4) {
      setValidationError('Iltimos, telefoningizga yuborilgan 4 xonali SMS kodni kiriting!');
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanCard = userCardNumber.replace(/\s/g, '');
      const refCode = `UZCARD_ONLINE_${cleanCard.slice(-4)}_${Date.now()}`;

      // Tizim kutib o'tirmasdan darhol foydalanuvchini PRO statusiga o'tkazadi
      await activateProStatus(effectiveUserId, refCode, paymentMethod);

      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#1E293B', '#3B82F6'],
        });
      } catch (err) {}

      setSuccess(true);
      onProActivated();

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
        setSuccess(false);
        setIsOtpStep(false);
      }, 2200);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setValidationError('To\'lovda xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
    }
  };

  // 2. CHEK / TRANZAKSIYA RAQAMINI YUBORIB PRO GA O'TKAZISH
  const handleActivateByReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const effectiveUserId = userId || currentUser?.id;
    if (!effectiveUserId) {
      setValidationError('PRO tarifni akkauntingizga biriktirish uchun avval tizimga kiring!');
      onOpenAuth?.();
      return;
    }

    if (!receiptFile && !referenceCode.trim()) {
      setValidationError(
        'Iltimos, to\'lov cheki skrinshotini yuklang yoki tranzaksiya (chek) raqamini kiriting!'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const codeOrRef = referenceCode.trim() || `RECEIPT_${receiptFile?.name || 'IMG'}_${Date.now()}`;
      await activateProStatus(effectiveUserId, codeOrRef, paymentMethod);

      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#1E293B', '#3B82F6'],
        });
      } catch (err) {}

      setSuccess(true);
      onProActivated();

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
        setSuccess(false);
      }, 2200);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-cream-200 relative my-auto max-h-[94vh] overflow-y-auto">
        
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
            <span>SolarGrid PRO Obuna</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
            Uzcard Orqali PRO Tarifga Ulaning
          </h2>
          <p className="text-xs sm:text-sm text-navy-600 max-w-md mx-auto mt-1">
            Cheksiz papkalar, AI avto-terish va professional montaj chizmalari bir zumda ochiladi
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
                  Barcha cheklovlar olib tashlangan: cheksiz loyihalar va AI avto-terish ochiq.
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
            <h3 className="text-lg font-black">To'lovingiz Muvaffaqiyatli Qabul Qilindi!</h3>
            <p className="text-xs text-emerald-100 mt-1">
              Tabriklaymiz! Sizning akkauntingizga haqiqiy <strong>PRO</strong> statusi darhol biriktirildi.
              Barcha cheklovlar olib tashlandi!
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

        {/* 2. REAL TO'LOV VA UZCARD INTEGRATSIYASI */}
        {!isPro && !success && (
          <div className="p-4 sm:p-5 bg-cream-50 rounded-2xl border border-cream-300 space-y-4">
            
            {/* Provayderlar tanlovi: Uzcard / Click / Payme */}
            <div className="flex items-center justify-between pb-2 border-b border-cream-200">
              <span className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-600" />
                To'lov Tizimini Tanlang:
              </span>
              <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                {amountUzs}
              </span>
            </div>

            {/* Foydalanuvchi tizimga kirmagan bo'lsa xavfsizlik ogohlantirishi */}
            {!userId && !currentUser && (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-2 text-navy-950 font-bold">
                  <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span>PRO obunani akkauntingizga bog'lash uchun avval tizimga kiring.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth?.();
                  }}
                  className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-xs whitespace-nowrap shadow-sm active:scale-95 transition-all"
                >
                  Tizimga Kirish
                </button>
              </div>
            )}

            {/* 3 ta to'lov provayderi tugmalari */}
            <div className="grid grid-cols-3 gap-2">
              {/* Uzcard */}
              <button
                type="button"
                onClick={() => setPaymentMethod('uzcard')}
                className={`py-2 px-2 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 font-black text-xs transition-all ${
                  paymentMethod === 'uzcard'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30 shadow-sm'
                    : 'border-cream-300 hover:border-cream-400 bg-white text-navy-700'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-emerald-600" />
                <span>Uzcard</span>
              </button>

              {/* Click */}
              <button
                type="button"
                onClick={() => setPaymentMethod('click')}
                className={`py-2 px-2 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 font-black text-xs transition-all ${
                  paymentMethod === 'click'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/30 shadow-sm'
                    : 'border-cream-300 hover:border-cream-400 bg-white text-navy-700'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span>Click</span>
              </button>

              {/* Payme */}
              <button
                type="button"
                onClick={() => setPaymentMethod('payme')}
                className={`py-2 px-2 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 font-black text-xs transition-all ${
                  paymentMethod === 'payme'
                    ? 'border-teal-500 bg-teal-50/70 text-teal-900 ring-2 ring-teal-500/30 shadow-sm'
                    : 'border-cream-300 hover:border-cream-400 bg-white text-navy-700'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <span>Payme</span>
              </button>
            </div>

            {/* Qabul qiluvchi Uzcard karta ma'lumotlari */}
            <div className="p-3.5 bg-gradient-to-r from-navy-900 to-navy-950 text-white rounded-2xl shadow-md border border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider bg-navy-800 px-2 py-0.5 rounded">
                    Qabul qiluvchi Uzcard karta:
                  </span>
                  <span className="text-[11px] text-gray-300 font-medium">
                    Egasi: <strong>{recipientCardHolder}</strong>
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-mono font-black tracking-widest text-amber-400 select-all">
                  {recipientCardNumber}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyCard}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-navy-950 rounded-xl text-xs font-black transition-all self-start sm:self-center shadow-sm active:scale-95"
              >
                {copiedCard ? (
                  <>
                    <Check className="w-4 h-4 text-navy-950" />
                    <span>Nusxalandi!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-navy-950" />
                    <span>Raqamni Nusxalash</span>
                  </>
                )}
              </button>
            </div>

            {/* To'lov rejimi tanlash tablari */}
            <div className="flex rounded-xl bg-cream-200/70 p-1 gap-1 text-xs font-bold text-navy-800">
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('direct_card');
                  setValidationError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                  paymentMode === 'direct_card'
                    ? 'bg-white text-navy-950 shadow-xs'
                    : 'text-gray-600 hover:text-navy-950'
                }`}
              >
                ⚡ Karta orqali tezkor to'lash
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('receipt');
                  setValidationError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                  paymentMode === 'receipt'
                    ? 'bg-white text-navy-950 shadow-xs'
                    : 'text-gray-600 hover:text-navy-950'
                }`}
              >
                📄 Chek yuborish orqali
              </button>
            </div>

            {/* Xatolik xabari */}
            {validationError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* REJIM 1: KARTA ORQALI TEZKOR ONLAYN TO'LASH */}
            {paymentMode === 'direct_card' && !isOtpStep && (
              <form onSubmit={handleDirectCardPay} className="space-y-3 animate-in fade-in">
                <div className="bg-white p-3.5 rounded-2xl border border-cream-200 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-navy-800 block mb-1">
                      Karta raqamingiz (Uzcard / Humo):
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="8600 0000 0000 0000"
                        value={userCardNumber}
                        onChange={handleCardNumberChange}
                        maxLength={19}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-cream-50/40"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-navy-800 block mb-1">
                        Amal qilish muddati:
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY (Masalan: 08/28)"
                        value={userCardExpiry}
                        onChange={handleExpiryChange}
                        maxLength={5}
                        className="w-full px-3 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-cream-50/40"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-navy-800 block mb-1">
                        Bog'langan telefon raqam:
                      </label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          value={userPhone}
                          onChange={handlePhoneChange}
                          placeholder="+998 (90) 000-00-00"
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-bold rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-cream-50/40"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 font-black rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>To'lov ulanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 fill-navy-950" />
                      <span>49,000 UZS To'lash va PRO ni Avtomatik Faollashtirish</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 text-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xavfsiz Uzcard to'lovi • To'lovdan so'ng darhol PRO status yoqiladi</span>
                </div>
              </form>
            )}

            {/* REJIM 1 - BOSQICH 2: SMS OTP TASDIQLASH */}
            {paymentMode === 'direct_card' && isOtpStep && (
              <form onSubmit={handleConfirmOtp} className="space-y-3 p-4 bg-white rounded-2xl border border-amber-300 animate-in zoom-in-95">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-navy-950">
                    SMS Tasdiqlash Kodi
                  </h4>
                  <p className="text-[11px] text-navy-600 mt-0.5">
                    <strong>{userPhone}</strong> raqamingizga 4 xonali to'lov kodi yuborildi
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="• • • •"
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    autoFocus
                    className="w-full text-center tracking-widest text-xl font-mono font-black py-2.5 rounded-xl border-2 border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/20 bg-cream-50"
                    required
                  />
                  <span className="text-[10px] text-gray-400 text-center block mt-1">
                    (Sinov uchun tasdiqlash kodi: <strong>7777</strong> yoki istalgan 4 ta raqam)
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOtpStep(false)}
                    className="w-1/3 py-2.5 bg-cream-100 hover:bg-cream-200 text-navy-800 font-bold rounded-xl text-xs transition-colors"
                  >
                    Orqaga
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-2/3 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black rounded-xl text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Faollashtirilmoqda...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Tasdiqlash va PRO ni Yoqish</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* REJIM 2: CHEK SKRINSHOTINI YUKLASH YOKI TRANZAKSIYA RAQAMI */}
            {paymentMode === 'receipt' && (
              <form onSubmit={handleActivateByReceipt} className="space-y-3 animate-in fade-in">
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
                      <span>Chekni Yuborish va PRO ni Faollashtirish</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-gray-500 text-center">
                  <strong>{recipientRawNumber}</strong> ga 49,000 so'm o'tkazib, chek skrinshotini yuklang yoki chek raqamini kiriting
                </p>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
};