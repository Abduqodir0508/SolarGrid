'use client';

import React, { useState } from 'react';
import { Roof } from '@/types/solar';
import { COMPASS_POINTS } from '@/constants/solarPanels';
import { calculateEfficiencyScore } from '@/utils/solarCalc';
import { validateNumber, validateRoofDimensions, validateRoofPitch, validateAzimuth } from '@/utils/sanitize';
import {
  X,
  Compass,
  Maximize2,
  TrendingUp,
  Check,
  AlertCircle,
} from 'lucide-react';

interface RoofConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roof: Roof;
  onRoofChange: (roof: Roof) => void;
}

export const RoofConfigDrawer: React.FC<RoofConfigDrawerProps> = ({
  isOpen,
  onClose,
  roof,
  onRoofChange,
}) => {
  // Mahalliy holatlar (formani boshqarish uchun)
  const [widthM, setWidthM] = useState<string>((roof.width / 100).toString());
  const [heightM, setHeightM] = useState<string>((roof.height / 100).toString());
  const [pitch, setPitch] = useState<number>(roof.pitch);
  const [azimuth, setAzimuth] = useState<number>(roof.azimuth);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Jonli samaradorlik foizi
  const efficiency = calculateEfficiencyScore(pitch, azimuth);

  // Saqlash
  const handleSave = () => {
    const rawW = parseFloat(widthM) * 100;
    const rawH = parseFloat(heightM) * 100;

    if (isNaN(rawW) || rawW < 100 || rawW > 10000) {
      setErrorMsg('Tom eni 1 metrdan 100 metrgacha bo\'lishi shart');
      return;
    }
    if (isNaN(rawH) || rawH < 100 || rawH > 10000) {
      setErrorMsg('Tom bo\'yi 1 metrdan 100 metrgacha bo\'lishi shart');
      return;
    }

    const dims = validateRoofDimensions(rawW, rawH);
    const validPitch = validateRoofPitch(pitch);
    const validAzimuth = validateAzimuth(azimuth);

    onRoofChange({
      ...roof,
      width: dims.width,
      height: dims.height,
      pitch: validPitch,
      azimuth: validAzimuth,
    });

    setErrorMsg(null);
    onClose();
  };

  // Tezkor o'lcham shablonlari
  const setPresetDimensions = (w: number, h: number) => {
    setWidthM(w.toString());
    setHeightM(h.toString());
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-cream-200 relative max-h-[90vh] overflow-y-auto">
        
        {/* Sarlavha */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-cream-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-navy-900">
                Tom O'lchamlari va Kompas
              </h2>
              <p className="text-xs text-navy-600">
                Faqat tomning o'zi (devorlarsiz) va samaradorlik hisobi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-navy-900 rounded-xl hover:bg-cream-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Tom o'lchamlari (Eni va Bo'yi) */}
        <div className="space-y-3 mb-5">
          <label className="text-xs font-bold text-navy-800 uppercase tracking-wider block">
            1. Tom o'lchamlari (Metrlarda / Santimetrgacha)
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs font-semibold text-navy-700 block mb-1">
                Tom Eni (metr):
              </span>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.1"
                  value={widthM}
                  onChange={(e) => setWidthM(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-cream-50"
                  placeholder="12.0"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-medium">
                  {parseFloat(widthM) ? `${Math.round(parseFloat(widthM) * 100)} sm` : 'm'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-navy-700 block mb-1">
                Tom Qiyaligi / Bo'yi (metr):
              </span>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.1"
                  value={heightM}
                  onChange={(e) => setHeightM(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-cream-50"
                  placeholder="8.0"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-medium">
                  {parseFloat(heightM) ? `${Math.round(parseFloat(heightM) * 100)} sm` : 'm'}
                </span>
              </div>
            </div>
          </div>

          {/* Tezkor shablonlar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-gray-500 font-medium">Tayyor o'lchamlar:</span>
            {[
              { label: '8 × 6 m', w: 8, h: 6 },
              { label: '10 × 7 m', w: 10, h: 7 },
              { label: '12 × 8 m', w: 12, h: 8 },
              { label: '15 × 10 m', w: 15, h: 10 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setPresetDimensions(p.w, p.h)}
                className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-cream-100 hover:bg-cream-200 text-navy-800 border border-cream-300 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Qiyalik burchagi (0° - 60°) */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
              2. Qiyalik burchagi (0° tekis — 60° qiya)
            </label>
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-lg">
              {pitch}° {pitch === 0 ? '(Tekis tom)' : pitch === 33 ? '★ (Ideal)' : ''}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={pitch}
            onChange={(e) => setPitch(parseInt(e.target.value))}
            className="w-full h-2.5 bg-cream-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />

          <div className="flex justify-between text-[10px] text-gray-500">
            <span>0° (Beton / Tekis)</span>
            <span className="text-amber-800 font-semibold">30° - 35° (Optimal qiyalik)</span>
            <span>60° (Tik tom)</span>
          </div>
        </div>

        {/* 3. Kompas yo'nalishi (Azimut) */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-navy-800 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              <span>3. Tom qaysi tarafga qaragan? (Kompas)</span>
            </label>
            <span className="text-xs font-mono font-bold text-navy-800">
              {azimuth}°
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {COMPASS_POINTS.map((cp) => (
              <button
                key={cp.direction}
                type="button"
                onClick={() => setAzimuth(cp.azimuth)}
                className={`p-2 rounded-xl text-left border transition-all ${
                  azimuth === cp.azimuth
                    ? 'border-amber-500 bg-amber-50/80 ring-1 ring-amber-500'
                    : 'border-cream-300 hover:border-cream-400 bg-cream-50'
                }`}
              >
                <div className="font-bold text-xs text-navy-900 flex items-center justify-between">
                  <span>{cp.direction}</span>
                  <span className="text-[10px] font-normal text-gray-500">{cp.azimuth}°</span>
                </div>
                <div className="text-[10px] text-gray-600 truncate mt-0.5">
                  {cp.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Avtomatik hisoblangan Samaradorlik foizi */}
        <div className="bg-gradient-to-r from-cream-100 to-amber-50/70 p-4 rounded-2xl border border-amber-200/80 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                Quyosh Unumdorligi:
              </span>
              <p className="text-[11px] text-gray-600 mt-0.5">
                {azimuth === 180 ? 'Janub' : `${azimuth}°`}, {pitch}° qiyalik bo'yicha
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-600">
                {efficiency}%
              </span>
              <span className="block text-[10px] font-semibold text-emerald-700">
                {efficiency >= 95 ? 'Maksimal daraja' : efficiency >= 80 ? 'Yaxshi daraja' : 'O\'rtacha'}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-cream-200 h-2 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                efficiency >= 90
                  ? 'bg-emerald-500'
                  : efficiency >= 75
                  ? 'bg-amber-500'
                  : 'bg-red-400'
              }`}
              style={{ width: `${efficiency}%` }}
            />
          </div>
        </div>

        {/* Saqlash tugmasi */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-cream-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-700 hover:bg-cream-100 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-navy-900 hover:bg-navy-800 shadow-md active:scale-95 transition-all"
          >
            <Check className="w-4 h-4 text-amber-400" />
            <span>Tomni Saqlash</span>
          </button>
        </div>

      </div>
    </div>
  );
};
