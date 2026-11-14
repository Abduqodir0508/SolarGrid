'use client';

import React, { useState } from 'react';
import {
  Sun,
  Layers,
  Box,
  Wand2,
  Share2,
  FileText,
  Sliders,
  Check,
  RotateCcw,
  FolderOpen,
  Crown,
  User,
  Sparkles,
} from 'lucide-react';
import { sanitizeText } from '@/utils/sanitize';

interface HeaderProps {
  viewMode: '2d' | '3d';
  onViewModeChange: (mode: '2d' | '3d') => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onOpenProjects: () => void;
  onOpenPricing: () => void;
  onOpenAuth: () => void;
  onOpenSmartLayout: () => void;
  onOpenRoofConfig: () => void;
  onOpenEstimate: () => void;
  onShare: () => void;
  onReset: () => void;
  panelsCount: number;
  totalCapacityKw: number;
  isCopied: boolean;
  isSaved?: boolean;
  isPro?: boolean;
  currentUser?: any;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  projectName,
  onProjectNameChange,
  onOpenProjects,
  onOpenPricing,
  onOpenAuth,
  onOpenSmartLayout,
  onOpenRoofConfig,
  onOpenEstimate,
  onShare,
  onReset,
  panelsCount,
  totalCapacityKw,
  isCopied,
  isSaved = true,
  isPro = false,
  currentUser = null,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);

  const handleNameSubmit = () => {
    onProjectNameChange(sanitizeText(tempName, 50) || 'Yangi Loyiha');
    setIsEditingName(false);
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-cream-200 sticky top-0 z-40 px-3 sm:px-6 py-2.5 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        
        {/* Chap tomon: Logo, PRO nishoni va Loyiha nomi */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white shadow-md shadow-amber-500/20">
            <Sun className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-navy-900 tracking-tight flex items-center gap-1.5">
                SolarGrid
              </h1>

              {/* PRO TUGMASI (Tariflar oynasini ochadi) */}
              <button
                type="button"
                onClick={onOpenPricing}
                className={`flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-full border shadow-xs transition-all active:scale-95 ${
                  isPro
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-navy-950 border-amber-500 shadow-amber-500/20'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                }`}
                title="Tariflar va PRO imkoniyatlarni ko'rish"
              >
                <Crown className={`w-3 h-3 ${isPro ? 'fill-navy-950 text-navy-950' : 'text-amber-700'}`} />
                <span>{isPro ? 'PRO AKTIV' : 'PRO'}</span>
              </button>

              {/* Papkalar / Loyihalarim tugmasi */}
              <button
                onClick={onOpenProjects}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold text-navy-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-all shadow-xs"
                title="Barcha saqlangan loyihalar va papkalar"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>Papkalar</span>
              </button>
            </div>
            
            {/* Loyiha nomi (tahrirlanadigan) */}
            <div className="flex items-center gap-1.5 text-xs text-navy-700">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                    onBlur={handleNameSubmit}
                    autoFocus
                    maxLength={50}
                    className="px-1.5 py-0.5 text-xs border border-amber-400 rounded outline-none focus:ring-1 focus:ring-amber-500 bg-amber-50/50 font-bold"
                  />
                  <button
                    onClick={handleNameSubmit}
                    className="p-0.5 text-emerald-600 hover:text-emerald-700"
                    title="Saqlash"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTempName(projectName);
                    setIsEditingName(true);
                  }}
                  className="hover:underline flex items-center gap-1 font-bold text-navy-900 truncate max-w-[160px] sm:max-w-[240px]"
                  title="Nomini o'zgartirish uchun bosing"
                >
                  <span className="truncate">{projectName}</span>
                  <span className="text-gray-400 text-[10px]">✎</span>
                </button>
              )}

              <span className="text-gray-300">|</span>
              <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] whitespace-nowrap">
                {panelsCount} ta panel ({totalCapacityKw} kVt)
              </span>

              {isSaved && (
                <span className="hidden md:inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  <Check className="w-2.5 h-2.5" />
                  Saqlangan
                </span>
              )}
            </div>
          </div>
        </div>

        {/* O'rta: 2D va 3D o'tkazgich */}
        <div className="flex items-center bg-cream-200/80 p-1 rounded-xl border border-cream-300">
          <button
            onClick={() => onViewModeChange('2d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === '2d'
                ? 'bg-white text-navy-900 shadow-sm border border-cream-200'
                : 'text-navy-700 hover:text-navy-900'
            }`}
          >
            <Layers className="w-4 h-4 text-navy-800" />
            <span>2D Chizma</span>
          </button>
          <button
            onClick={() => onViewModeChange('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === '3d'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'text-navy-700 hover:text-navy-900'
            }`}
          >
            <Box className="w-4 h-4 text-amber-400" />
            <span>3D Simulyatsiya</span>
          </button>
        </div>

        {/* O'ng tomon: Harakat tugmalari va Auth */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Tom sozlamalari */}
          <button
            onClick={onOpenRoofConfig}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-navy-800 bg-cream-100 hover:bg-cream-200 border border-cream-300 transition-colors"
            title="Tom o'lchami va kompas yo'nalishi"
          >
            <Sliders className="w-4 h-4 text-navy-700" />
            <span className="hidden md:inline">Tom</span>
          </button>

          {/* AI Optimal Joylashtirish */}
          <button
            onClick={onOpenSmartLayout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors shadow-sm"
            title="AI yordamida panellarni avtomatik simmetrik terish"
          >
            <Wand2 className="w-4 h-4 text-purple-600" />
            <span className="hidden sm:inline">AI Terish</span>
          </button>

          {/* Ulashish (Link nusxalash) */}
          <button
            onClick={onShare}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-navy-800 bg-cream-100 hover:bg-cream-200 border border-cream-300 transition-colors"
            title="Loyihani link orqali ulashish"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Nusxalandi!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-navy-700" />
                <span className="hidden sm:inline">Ulashish</span>
              </>
            )}
          </button>

          {/* Qayta tozalash (Reset) */}
          {panelsCount > 0 && (
            <button
              onClick={onReset}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Tomdagi panellarni tozalash"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Tayyor Smeta va Chizma */}
          <button
            onClick={onOpenEstimate}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-navy-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Smeta</span>
          </button>

          {/* Foydalanuvchi / Kirish tugmasi */}
          <button
            type="button"
            onClick={onOpenAuth}
            className={`p-1.5 rounded-xl border transition-all flex items-center justify-center ${
              currentUser
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-cream-100 hover:bg-cream-200 text-navy-800 border-cream-300'
            }`}
            title={currentUser ? `${currentUser.email} (Profil)` : 'Kirish yoki Ro\'yxatdan o\'tish'}
          >
            <User className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
