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
  ExternalLink,
  Send,
  Sparkles,
  Info,
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
  // Nusxalash holati
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Tab: 'telegram' (Asosiy rasmiy yo'l) | 'receipt' (Sayt orqali to'g'ridan-to'g'ri chek yuklash)
  const [activeTab, setActiveTab] = useState<'telegram' | 'receipt'>('telegram');

  // Chek yuklash holatlari
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [referenceCode, setReferenceCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Real Uzcard qabul qiluvchi karta ma'lumotlari
  const recipientCardNumber = '5614 6887 1438 0671';
  const recipientRawNumber = '5614688714380671';
  const recipientCardHolder = 'M.S (Uzcard)';
  const amountUzs = '49,000 UZS';
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'SolarGridUzBot';

  // Telegram botga o'tish linki: foydalanuvchi emaili yoki ID si bilan
  const userIdentifier = currentUser?.email || currentUser?.id || userId || '';
  const telegramBotLink = `https://t.me/${botUsername}${userIdentifier ? `?start=${encodeURIComponent(userIdentifier)}` : ''}`;

  // Karta raqamini nusxalash
  const handleCopyCard = () => {
    navigator.clipboard.writeText(recipientRawNumber);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText('49000');
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
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

  // Sayt orqali to'g'ridan-to'g'ri chek topshirish
  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!currentUser && !userId) {
      setValidationError('PRO obunani faollashtirish uchun avval akkauntingizga kiring!');
      return;
    }

    if (!receiptFile && !referenceCode.trim()) {
      setValidationError('Iltimos, to\'lov cheki rasmini yuklang yoki tranzaksiya kodini kiriting!');
      return;
    }

    setIsSubmitting(true);

    try {
      const activeUserId = currentUser?.id || userId;
      await activateProStatus(activeUserId, referenceCode.trim() || 'RECEIPT_SUBMITTED', 'uzcard');

      setIsSubmitting(false);
      setSuccess(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      onProActivated();
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setIsSubmitting(false);
      setValidationError(err.message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-navy-900 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-cream-200 dark:border-navy-700 relative my-auto max-h-[92vh] overflow-y-auto text-navy-900 dark:text-cream-100 transition-colors">
        
        {/* Yopish tugmasi */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-navy-900 dark:hover:text-white rounded-xl hover:bg-cream-100 dark:hover:bg-navy-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Muvaffaqiyat xabari */}
        {success ? (
          <div className="text-center py-8 space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-300 dark:border-emerald-700">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-navy-950 dark:text-white">
              To'lovingiz Qabul Qilindi!
            </h3>
            <p className="text-sm text-navy-700 dark:text-cream-300 max-w-sm mx-auto">
              SolarGrid PRO imkoniyatlari hisobingizda faollashtirildi. Cheksiz papkalar, AI avto-terish va to'liq smeta xizmatidan foydalanishingiz mumkin!
            </p>
          </div>
        ) : (
          <div>
            {/* Sarlavha va Banner */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-400/20 text-amber-900 dark:text-amber-300 text-xs font-black uppercase tracking-wider mb-2 border border-amber-300/50 dark:border-amber-700/50">
                <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500" />
                <span>SolarGrid PRO Obunasi</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-navy-950 dark:text-white tracking-tight">
                Cheksiz Imkoniyatlar va AI Quvvati
              </h2>
              <p className="text-xs sm:text-sm text-navy-600 dark:text-cream-300 mt-1">
                Quyosh tizimlarini loyihalash, hisob-kitob va montaj smetalarini 10 barobar tezroq bajaring
              </p>
            </div>

            {/* Narx va Afzalliklar bloki */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {/* Narx kartasi */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-cream-50 to-amber-500/5 dark:from-navy-800 dark:to-navy-800/60 border border-amber-300/60 dark:border-amber-700/50 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-black text-amber-800 dark:text-amber-300 tracking-wider">
                    PRO Tarif Narxi
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl sm:text-3xl font-black text-navy-950 dark:text-white">49,000</span>
                    <span className="text-xs font-bold text-navy-700 dark:text-cream-300">so'm / oy</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    yoki ~$4 USD (bir oyga cheksiz kirish)
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-navy-700 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Kafolatlangan xavfsiz to'lov</span>
                </div>
              </div>

              {/* Afzalliklar ro'yxati */}
              <div className="p-4 rounded-2xl bg-cream-50 dark:bg-navy-800/60 border border-cream-200 dark:border-navy-700 text-xs space-y-2">
                <div className="flex items-center gap-2 text-navy-900 dark:text-cream-100">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold">Cheksiz loyihalar va papkalar</span>
                </div>
                <div className="flex items-center gap-2 text-navy-900 dark:text-cream-100">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold">AI Avto-terish & Optimizatsiya</span>
                </div>
                <div className="flex items-center gap-2 text-navy-900 dark:text-cream-100">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold">PDF Montaj chizmasi & Batafsil smeta</span>
                </div>
                <div className="flex items-center gap-2 text-navy-900 dark:text-cream-100">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold">Ustuvor texnik yordam</span>
                </div>
              </div>
            </div>

            {/* Foydalanuvchi akkaunt holati ogohlantirishi */}
            {!currentUser && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>PRO ni akkauntingizga biriktirish uchun tizimga kiring:</span>
                </div>
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-navy-950 font-black rounded-xl shrink-0"
                  >
                    Kirish
                  </button>
                )}
              </div>
            )}

            {/* To'lov usuli tanlash (Tablar) */}
            <div className="flex bg-cream-100 dark:bg-navy-800 p-1 rounded-2xl mb-4 border border-cream-200 dark:border-navy-700">
              <button
                type="button"
                onClick={() => setActiveTab('telegram')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'telegram'
                    ? 'bg-white dark:bg-navy-900 text-navy-950 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5 text-sky-500" />
                <span>Telegram Bot Orqali (Tavsiya)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('receipt')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'receipt'
                    ? 'bg-white dark:bg-navy-900 text-navy-950 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                <span>Saytda Chek Yuklash</span>
              </button>
            </div>

            {/* 1-TAB: TELEGRAM BOT ORQALI TO'LASH VA BOG'LASH (ASOSIY OQIM) */}
            {activeTab === 'telegram' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Uzcard Rekvizitlari */}
                <div className="p-4 rounded-2xl bg-cream-50 dark:bg-navy-800 border border-cream-200 dark:border-navy-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Qabul qiluvchi Uzcard karta:
                    </span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      Rasmiy hisob
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white dark:bg-navy-900 p-2.5 rounded-xl border border-cream-300 dark:border-navy-700">
                    <div>
                      <div className="text-sm sm:text-base font-black font-mono tracking-wider text-navy-950 dark:text-white">
                        {recipientCardNumber}
                      </div>
                      <div className="text-xs font-bold text-navy-700 dark:text-cream-300">
                        {recipientCardHolder}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCard}
                      className="p-2 rounded-lg bg-cream-100 hover:bg-cream-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-navy-800 dark:text-white font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
                      title="Karta raqamini nusxalash"
                    >
                      {copiedCard ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 text-[11px]">Nusxalandi!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[11px]">Nusxalash</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* To'lov summasi */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">O'tkazma summasi:</span>
                    <span className="font-black text-navy-950 dark:text-white text-sm">{amountUzs}</span>
                  </div>
                </div>

                {/* Qadamlar yo'riqnomasi */}
                <div className="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-navy-800/40 border border-sky-200/60 dark:border-navy-700 text-xs space-y-1.5 text-navy-800 dark:text-cream-200">
                  <div className="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5 mb-1">
                    <Smartphone className="w-4 h-4 text-sky-600" />
                    <span>Telegram Bot orqali faollashtirish qadamlari:</span>
                  </div>
                  <p>1. Yuqoridagi Uzcard kartasiga <b>49,000 so'm</b> o'tkazing (Click, Payme yoki bank ilovasidan).</p>
                  <p>2. Quyidagi <b>"Telegram Botga O'tish"</b> tugmasini bosing.</p>
                  <p>3. Botda tilingizni tanlang, emailingizni tasdiqlang va <b>to'lov chekini (rasm)</b> botga yuboring.</p>
                  <p>4. Chek tekshirilgach, hisobingiz darhol <b>PRO</b> statusiga o'tadi!</p>
                </div>

                {/* Asosiy Telegram Bot Tugmasi */}
                <a
                  href={telegramBotLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold rounded-2xl text-sm sm:text-base shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                  <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  <span>Telegram Bot Orqali Faollashtirish</span>
                  <ExternalLink className="w-4 h-4 opacity-75" />
                </a>

                {currentUser && (
                  <p className="text-center text-[11px] text-gray-500 dark:text-gray-400">
                    Sizning hisobingiz: <strong className="text-navy-900 dark:text-white">{currentUser.email}</strong> botga avtomatik biriktiriladi.
                  </p>
                )}
              </div>
            )}

            {/* 2-TAB: SAYTNING O'ZIDA CHEK YUKLASH */}
            {activeTab === 'receipt' && (
              <form onSubmit={handleReceiptSubmit} className="space-y-4 animate-in fade-in">
                {/* Uzcard Rekvizitlari */}
                <div className="p-3.5 rounded-2xl bg-cream-50 dark:bg-navy-800 border border-cream-200 dark:border-navy-700">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-gray-500 dark:text-gray-400">Qabul qiluvchi karta:</span>
                    <button
                      type="button"
                      onClick={handleCopyCard}
                      className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedCard ? 'Nusxalandi' : 'Nusxalash'}</span>
                    </button>
                  </div>
                  <div className="font-mono font-bold text-sm text-navy-950 dark:text-white">
                    {recipientCardNumber} ({recipientCardHolder})
                  </div>
                  <div className="text-xs font-semibold text-gray-600 dark:text-cream-300 mt-1">
                    Summa: <strong className="text-navy-950 dark:text-white">{amountUzs}</strong>
                  </div>
                </div>

                {validationError && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Chek rasmini yuklash maydoni */}
                <div>
                  <label className="block text-xs font-bold text-navy-800 dark:text-cream-200 mb-1">
                    To'lov chekini yuklang (Skrinshot):
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-cream-300 dark:border-navy-700 hover:border-amber-400 dark:hover:border-amber-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-cream-50/50 dark:bg-navy-800/40"
                  >
                    {receiptPreview ? (
                      <div className="relative inline-block">
                        <img
                          src={receiptPreview}
                          alt="Chek"
                          className="max-h-32 rounded-lg mx-auto shadow-md"
                        />
                        <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                          ✓ Rasm yuklandi (almashtirish uchun bosing)
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                        <span className="text-xs font-bold text-navy-800 dark:text-cream-200 block">
                          Chek faylini tanlash uchun bosing
                        </span>
                        <span className="text-[10px] text-gray-500">PNG, JPG yoki PDF formatda</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Tranzaksiya yoki chek kodi */}
                <div>
                  <label className="block text-xs font-bold text-navy-800 dark:text-cream-200 mb-1">
                    Tranzaksiya / Chek raqami (ixtiyoriy):
                  </label>
                  <input
                    type="text"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    placeholder="Masalan: 84920491823"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-cream-300 dark:border-navy-700 dark:bg-navy-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 font-black rounded-xl text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Chek yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Chekni Yuborish va PRO ni Faollashtirish</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
