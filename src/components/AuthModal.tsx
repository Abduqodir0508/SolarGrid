'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
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
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onAuthSuccess: (user: any) => void;
  onOpenPricing: () => void;
  isPro: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onOpenPricing,
  isPro,
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

    try {
      if (mode === 'signup') {
        if (password.length < 6) {
          setErrorMsg('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || 'Foydalanuvchi',
              is_pro: false,
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.user) {
          setSuccessMsg('Muvaffaqiyatli ro\'yxatdan o\'tdingiz!');
          onAuthSuccess(data.user);
          setTimeout(() => onClose(), 1200);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMsg('Email yoki parol noto\'g\'ri kiritildi');
          } else {
            setErrorMsg(error.message);
          }
        } else if (data.user) {
          setSuccessMsg('Xush kelibsiz! Tizimga muvaffaqiyatli kirdingiz.');
          onAuthSuccess(data.user);
          setTimeout(() => onClose(), 1000);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    onAuthSuccess(null);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-cream-200 relative">
        
        {/* Yopish tugmasi */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-navy-900 rounded-xl hover:bg-cream-100 transition-colors"
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
              <h2 className="text-lg font-black text-navy-950">
                {currentUser.user_metadata?.full_name || 'Foydalanuvchi'}
              </h2>
              <p className="text-xs text-navy-600 font-mono mt-0.5">
                {currentUser.email}
              </p>
            </div>

            {/* Status nishoni */}
            <div className="p-3 rounded-2xl bg-cream-50 border border-cream-200 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[11px] text-gray-500 block">Hisobingiz holati:</span>
                <span className="text-xs font-bold text-navy-900 flex items-center gap-1">
                  {isPro ? (
                    <>
                      <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <strong className="text-amber-600">PRO Tarif (Faol)</strong>
                    </>
                  ) : (
                    <span>Standart (Bepul)</span>
                  )}
                </span>
              </div>

              {!isPro ? (
                <button
                  onClick={() => {
                    onClose();
                    onOpenPricing();
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-navy-950 text-xs font-extrabold rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>PRO ga O'tish</span>
                </button>
              ) : (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  Cheksiz imkoniyat
                </span>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-cream-100 hover:bg-red-50 text-navy-800 hover:text-red-600 rounded-xl text-xs font-bold transition-all border border-cream-300"
              >
                <LogOut className="w-4 h-4" />
                <span>Hisobdan chiqish</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login yoki Register formasi */
          <div>
            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 border border-amber-200">
                {mode === 'signin' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              </div>
              <h2 className="text-lg font-black text-navy-950">
                {mode === 'signin' ? 'SolarGrid Tizimiga Kirish' : 'Yangi Hisob Ochish'}
              </h2>
              <p className="text-xs text-navy-600 mt-0.5">
                Loyihalaringizni bulutda saqlang va PRO tarifdan foydalaning
              </p>
            </div>

            {/* Sign in / Sign up tab */}
            <div className="flex bg-cream-100 p-1 rounded-xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  mode === 'signin' ? 'bg-white text-navy-950 shadow-sm' : 'text-gray-500 hover:text-navy-900'
                }`}
              >
                Kirish
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  mode === 'signup' ? 'bg-white text-navy-950 shadow-sm' : 'text-gray-500 hover:text-navy-900'
                }`}
              >
                Ro'yxatdan o'tish
              </button>
            </div>

            {errorMsg && (
              <div className="mb-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-3 p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="text-[11px] font-bold text-navy-700 block mb-1">
                    Ism va familiyangiz:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Masalan: Sardor Rustamov"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-cream-50/50"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-navy-700 block mb-1">
                  Email manzilingiz:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="usta@solargrid.uz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-cream-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-navy-700 block mb-1">
                  Parol (kamida 6 ta belgi):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-cream-50/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 mt-2"
              >
                {loading
                  ? 'Kutilmoqda...'
                  : mode === 'signin'
                  ? 'Kirish'
                  : 'Ro\'yxatdan o\'tish'}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-cream-200 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-gray-500 hover:text-navy-900"
              >
                Mehmon sifatida davom etish (Offline)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
