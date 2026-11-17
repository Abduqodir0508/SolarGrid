'use client';

import React, { useState, useRef, useEffect } from 'react';
import { updateUserProfile } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import {
  X,
  User,
  Camera,
  Mail,
  Crown,
  LogOut,
  Save,
  Check,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  ShieldCheck,
  Clock,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  isPro: boolean;
  onUpdateUser: (updatedUser: any) => void;
  onSignOut: () => void;
  onOpenPricing: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isPro,
  onUpdateUser,
  onSignOut,
  onOpenPricing,
}) => {
  const { theme, setTheme } = useTheme();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      const name = currentUser.user_metadata?.full_name || '';
      const avatar = currentUser.user_metadata?.avatar_url || '';
      setFullName(name);
      setAvatarUrl(avatar);
      setAvatarPreview(avatar);
      setSaveSuccess(false);
      setErrorMessage(null);
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  // Fayldan rasm yuklash (qurilmadan rasm tanlash)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setErrorMessage('Rasm hajmi 3MB dan oshmasligi kerak');
        return;
      }

      setErrorMessage(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarPreview(base64);
        setAvatarUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // URL orqali rasm kiritish
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setAvatarUrl(url);
    setAvatarPreview(url);
    if (errorMessage) setErrorMessage(null);
  };

  // Saqlash
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const res = await updateUserProfile({
        fullName: fullName.trim() || 'Foydalanuvchi',
        avatarUrl: avatarUrl.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Saqlashda xatolik yuz berdi');
        setIsSaving(false);
        return;
      }

      if (res.user) {
        onUpdateUser(res.user);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    if (fullName.trim()) {
      const parts = fullName.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return fullName.slice(0, 2).toUpperCase();
    }
    return currentUser.email?.slice(0, 2).toUpperCase() || 'SG';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-navy-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-cream-200 dark:border-navy-700 relative my-auto max-h-[90vh] overflow-y-auto text-navy-900 dark:text-cream-100 transition-colors">
        
        {/* Yopish tugmasi */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-navy-900 dark:hover:text-white rounded-xl hover:bg-cream-100 dark:hover:bg-navy-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sarlavha */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider mb-2 border border-amber-200 dark:border-amber-700/60">
            <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Akkaunt Boshqaruvi</span>
          </div>
          <h2 className="text-xl font-black text-navy-950 dark:text-white">
            Profil Sozlamalari
          </h2>
          <p className="text-xs text-navy-600 dark:text-cream-300 mt-0.5">
            Shaxsiy ma'lumotlaringiz, profil rasmi va ilova ko'rinishini sozlang
          </p>
        </div>

        {/* 1. Profil rasmi (Avatar) qismi */}
        <div className="flex flex-col items-center mb-5">
          <div className="relative group">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-amber-400 shadow-xl shadow-amber-500/10"
                onError={() => setAvatarPreview('')}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-navy-950 font-black text-2xl flex items-center justify-center border-4 border-amber-300 shadow-xl shadow-amber-500/10">
                {getInitials()}
              </div>
            )}

            {/* Rasm almashtirish tugmachasi */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-navy-900 hover:bg-amber-500 text-white hover:text-navy-950 rounded-full shadow-lg transition-all active:scale-95 border-2 border-white dark:border-navy-900"
              title="Qurilmadan rasm yuklash"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-navy-800 dark:text-cream-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              Qurilmadan yuklash
            </button>
            <span className="text-gray-300 dark:text-navy-700">•</span>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs font-bold text-navy-800 dark:text-cream-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <LinkIcon className="w-3 h-3" />
              <span>URL qo'yish</span>
            </button>
          </div>

          {/* Rasm URL kiritish maydoni (agar ochilgan bo'lsa) */}
          {showUrlInput && (
            <div className="w-full mt-2 animate-in fade-in">
              <input
                type="url"
                placeholder="https://example.com/rasm.jpg"
                value={avatarUrl}
                onChange={handleUrlChange}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-cream-300 dark:border-navy-700 dark:bg-navy-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 bg-cream-50"
              />
            </div>
          )}
        </div>

        {/* 2. Dark / Light Mode (Ilova mavzusi) */}
        <div className="p-3 rounded-2xl bg-cream-50 dark:bg-navy-800 border border-cream-200 dark:border-navy-700 mb-4">
          <label className="text-xs font-bold text-navy-900 dark:text-white block mb-2">
            Ilova mavzusi (Ko'rinishi):
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                theme === 'light'
                  ? 'bg-white dark:bg-navy-700 text-navy-950 dark:text-white border-amber-400 shadow-sm'
                  : 'bg-transparent text-gray-500 hover:text-navy-900 dark:hover:text-white border-transparent'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Yorug' (Light)</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                theme === 'dark'
                  ? 'bg-navy-900 dark:bg-navy-700 text-white border-amber-400 shadow-sm'
                  : 'bg-transparent text-gray-500 hover:text-navy-900 dark:hover:text-white border-transparent'
              }`}
            >
              <Moon className="w-4 h-4 text-amber-400" />
              <span>Qorong'i (Dark)</span>
            </button>
          </div>
        </div>

        {/* 3. PRO Tarif statusi nishoni */}
        <div className="p-3.5 rounded-2xl bg-cream-50 dark:bg-navy-800 border border-cream-200 dark:border-navy-700 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isPro
                  ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-navy-950 shadow-sm'
                  : 'bg-cream-200 dark:bg-navy-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Crown className={`w-5 h-5 ${isPro ? 'fill-navy-950' : ''}`} />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold tracking-wider">
                Tarif holati:
              </span>
              <span className="text-xs font-black text-navy-950 dark:text-white flex items-center gap-1">
                {isPro ? (
                  <strong className="text-amber-600 dark:text-amber-400">PRO Versiya (Cheksiz)</strong>
                ) : (
                  <span>Standart (3 ta loyiha)</span>
                )}
              </span>
            </div>
          </div>

          {!isPro ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPricing();
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 text-xs font-black rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>PRO ga O'tish</span>
            </button>
          ) : (
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700">
              Faol
            </span>
          )}
        </div>

        {/* Xatolik yoki Muvaffaqiyat xabarlari */}
        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-xl border border-red-200 dark:border-red-800/50 flex items-center gap-2 mb-4 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl border border-emerald-300 dark:border-emerald-800/50 flex items-center gap-2 mb-4 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-bold">Profil sozlamalari muvaffaqiyatli saqlandi!</span>
          </div>
        )}

        {/* 4. Ma'lumotlarni tahrirlash formasi */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-navy-800 dark:text-cream-200 block mb-1">
              Foydalanuvchi ismi va familiyasi:
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masalan: Alisher Usmonov"
                maxLength={60}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-cream-300 dark:border-navy-700 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-navy-800 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-navy-800 dark:text-cream-200 block mb-1">
              Elektron pochta (Email):
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                value={currentUser.email || ''}
                disabled
                className="w-full pl-9 pr-24 py-2 text-xs sm:text-sm font-mono text-gray-600 dark:text-gray-300 rounded-xl border border-cream-200 dark:border-navy-700 bg-cream-100/60 dark:bg-navy-800/60 cursor-not-allowed select-all"
              />
              <span className="absolute right-2.5 top-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Tasdiqlangan
              </span>
            </div>
          </div>

          {/* Saqlash tugmasi */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 bg-navy-900 hover:bg-navy-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-navy-950 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Clock className="w-4 h-4 animate-spin text-amber-400 dark:text-navy-950" />
                <span>Saqlanmoqda...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-amber-400 dark:text-navy-950" />
                <span>O'zgarishlarni Saqlash</span>
              </>
            )}
          </button>
        </form>

        {/* 5. Akkauntdan chiqish tugmasi */}
        <div className="mt-5 pt-4 border-t border-cream-200 dark:border-navy-700">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-2 bg-cream-100 dark:bg-navy-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-navy-800 dark:text-cream-200 hover:text-red-600 dark:hover:text-red-400 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-cream-300 dark:border-navy-700 hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Akkauntdan Chiqish (Logout)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
