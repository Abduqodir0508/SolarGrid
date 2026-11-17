'use client';

import React, { useState } from 'react';
import { supabase, saveStoredUserSession, clearStoredUserSession } from '@/lib/supabase';
import {
  X,
  User,
  Lock,
  Mail,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Crown,
  LogOut,
  Sparkles,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onAuthSuccess: (user: any) => void;
  onOpenPricing: () => void;
  isPro: boolean;
  notice?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onOpenPricing,
  isPro,
  notice,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (mode === 'signup') {
        if (password.length < 6) {
          setErrorMsg('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
          setLoading(false);
          return;
        }

        // Server orqali auto-confirm qilib foydalanuvchi yaratish
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            fullName: fullName.trim() || 'Foydalanuvchi',
          }),
        });

        const regData = await regRes.json();

        if (!regRes.ok) {
          if (regData.alreadyExists) {
            setErrorMsg(regData.error);
            setMode('signin');
            setLoading(false);
            return;
          }
          throw new Error(regData.error || 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
        }

        // Auto-login (Registratsiyadan so'ng darhol tizimga kirish)
        const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signinError) {
          // Agar kutilmaganda signin da xatolik bo'lsa
          throw signinError;
        }

        if (signinData.user) {
          saveStoredUserSession(signinData.user);
          setSuccessMsg('Muvaffaqiyatli ro\'yxatdan o\'tdingiz! Xush kelibsiz.');
          onAuthSuccess(signinData.user);
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else {
        // Tizimga kirish (Login)
        let { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        // Agar "Email not confirmed" xatoligi bo'lsa, server orqali darhol tasdiqlab qayta kiramiz
        if (error && error.message.toLowerCase().includes('email not confirmed')) {
          try {
            await fetch('/api/auth/confirm-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: cleanEmail }),
            });

            // Qaytadan kirishga urinish
            const retry = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            data = retry.data;
            error = retry.error;
          } catch (confirmErr) {
            console.warn('Avto-tasdiqlashda xato:', confirmErr);
          }
        }

        if (error) {
          if (
            error.message.includes('Invalid login credentials') ||
            error.message.includes('invalid_grant')
          ) {
            setErrorMsg('Email yoki parol noto\'g\'ri kiritildi');
          } else {
            setErrorMsg(error.message);
          }
        } else if (data?.user) {
          saveStoredUserSession(data.user);
          setSuccessMsg('Xush kelibsiz! Tizimga muvaffaqiyatli kirdingiz.');
          onAuthSuccess(data.user);
          setTimeout(() => {
            onClose();
          }, 800);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    clearStoredUserSession();
    onAuthSuccess(null);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-navy-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-cream-200 dark:border-navy-700 relative text-navy-900 dark:text-cream-100 transition-colors">
        
        {/* Yopish tugmasi */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-navy-900 dark:hover:text-white rounded-xl hover:bg-cream-100 dark:hover:bg-navy-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Agar foydalanuvchi tizimga kirgan bo'lsa (Profile card) */}
        {currentUser ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <User className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-black text-navy-950 dark:text-white">
                {currentUser.user_metadata?.full_name || 'Foydalanuvchi'}
              </h2>
              <p className="text-xs text-navy-600 dark:text-cream-300 font-mono mt-0.5">
                {currentUser.email}
              </p>
            </div>

            {/* PRO Status nishoni */}
            <div className="p-3 rounded-2xl bg-cream-50 dark:bg-navy-800 border border-cream-200 dark:border-navy-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className={`w-5 h-5 ${isPro ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                <span className="text-xs font-bold text-navy-900 dark:text-white">
                  {isPro ? 'PRO Tarif Faol' : 'Standart Tarif (Tekin)'}
                </span>
              </div>
              {!isPro && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenPricing();
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-navy-950 rounded-lg flex items-center gap-1 active:scale-95 transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>PRO ga O'tish</span>
                </button>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Akkauntdan Chiqish</span>
              </button>
            </div>
          </div>
        ) : (
          /* Kirish yoki Ro'yxatdan o'tish formasi */
          <div>
            {notice && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/50 rounded-2xl flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            <div className="text-center mb-5">
              <h2 className="text-xl font-black text-navy-950 dark:text-white">
                {mode === 'signin' ? 'Tizimga Kirish' : 'Ro\'yxatdan O\'tish'}
              </h2>
              <p className="text-xs text-navy-600 dark:text-cream-300 mt-1">
                {mode === 'signin'
                  ? 'SolarGrid loyihalaringizni boshqarish uchun profilingizga kiring'
                  : 'Yangi hisob yarating va loyihalaringizni xavfsiz saqlang'}
              </p>
            </div>

            {/* Rejimni o'zgartirish (Tab) */}
            <div className="flex bg-cream-100 dark:bg-navy-800 p-1 rounded-2xl mb-4 border border-cream-200 dark:border-navy-700">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'signin'
                    ? 'bg-white dark:bg-navy-900 text-navy-950 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                Kirish
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-navy-900 text-navy-950 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                Ro'yxatdan O'tish
              </button>
            </div>

            {/* Xatolik xabari */}
            {errorMsg && (
              <div className="mb-4 p-2.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-xl border border-red-200 dark:border-red-800/50 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Muvaffaqiyat xabari */}
            {successMsg && (
              <div className="mb-4 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl border border-emerald-300 dark:border-emerald-800/50 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-navy-800 dark:text-cream-200 mb-1">
                    To'liq ismingiz
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Masalan: Sardor Rahimov"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-cream-300 dark:border-navy-700 dark:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-cream-200 mb-1">
                  Elektron pochta (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ism@kompaniya.uz"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-cream-300 dark:border-navy-700 dark:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-cream-200 mb-1">
                  Parol
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-cream-300 dark:border-navy-700 dark:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-navy-900 hover:bg-navy-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-navy-950 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Yuklanmoqda...</span>
                  </>
                ) : mode === 'signin' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Akkauntga Kirish</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Ro'yxatdan O'tish</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
