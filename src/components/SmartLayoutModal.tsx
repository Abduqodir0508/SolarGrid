'use client';

import React, { useState } from 'react';
import { Roof, SolarPanelSpec, AutoLayoutConfig, PlacedPanel } from '@/types/solar';
import { DEFAULT_SOLAR_PANELS } from '@/constants/solarPanels';
import { generateSmartLayout } from '@/utils/layoutGenerator';
import {
  Wand2,
  X,
  Sparkles,
  Grid,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  Maximize,
  Check,
} from 'lucide-react';

interface SmartLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  roof: Roof;
  customPanels: SolarPanelSpec[];
  onApplyLayout: (panels: PlacedPanel[]) => void;
}

export const SmartLayoutModal: React.FC<SmartLayoutModalProps> = ({
  isOpen,
  onClose,
  roof,
  customPanels,
  onApplyLayout,
}) => {
  const allSpecs = [...DEFAULT_SOLAR_PANELS, ...customPanels];

  const [selectedSpecId, setSelectedSpecId] = useState<string>(allSpecs[0]?.id || 'longi-himo6-550');
  const [mode, setMode] = useState<AutoLayoutConfig['mode']>('max_fit');
  const [rotation, setRotation] = useState<0 | 90>(0);
  const [useMaxCount, setUseMaxCount] = useState<boolean>(true);
  const [targetCount, setTargetCount] = useState<number>(8);

  if (!isOpen) return null;

  const currentSpec = allSpecs.find((s) => s.id === selectedSpecId) || allSpecs[0];

  // Algoritmni sinab ko'rish va natijani hisoblash
  const previewPanels = generateSmartLayout(roof, currentSpec, {
    specId: currentSpec.id,
    mode,
    rotation,
    targetCount: useMaxCount ? undefined : targetCount,
    spacingCm: 2,
    marginCm: 20,
  });

  const previewCapacityKw = Math.round(((previewPanels.length * currentSpec.power) / 1000) * 100) / 100;

  const handleApply = () => {
    onApplyLayout(previewPanels);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-cream-200 relative max-h-[90vh] overflow-y-auto">
        
        {/* Sarlavha */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-cream-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-navy-900">
                AI Aqlli Avto-Joylashtirish
              </h2>
              <p className="text-xs text-navy-600">
                Tom markazini millimetrgacha hisoblab ideal simmetrik terish
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

        {/* 1. Panel modelini tanlash */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-bold text-navy-800 uppercase tracking-wider block">
            1. Panel turi
          </label>
          <div className="grid grid-cols-2 gap-2">
            {allSpecs.map((spec) => (
              <button
                key={spec.id}
                type="button"
                onClick={() => setSelectedSpecId(spec.id)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  selectedSpecId === spec.id
                    ? 'border-purple-500 bg-purple-50/70 ring-1 ring-purple-500'
                    : 'border-cream-300 hover:border-cream-400 bg-cream-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-navy-900">
                  <span className="truncate">{spec.brand}</span>
                  <span className="text-purple-700">{spec.power}W</span>
                </div>
                <div className="text-[11px] text-gray-500 truncate mt-0.5">
                  {spec.model} ({spec.width}×{spec.height} sm)
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Joylashtirish usuli (Mode) */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-bold text-navy-800 uppercase tracking-wider block">
            2. Joylashuv sxemasi
          </label>

          <div className="grid grid-cols-2 gap-2">
            {[
              {
                id: 'max_fit',
                label: 'Maksimal sig\'im',
                desc: 'Tomga to\'liq simmetrik to\'ldirish',
                icon: Maximize,
              },
              {
                id: 'center_grid',
                label: 'Markazda Blok (2x2 / 2x3)',
                desc: 'Tomning qoq o\'rtasida to\'rtburchak',
                icon: Grid,
              },
              {
                id: 'center_row',
                label: 'Markazda 1 qator',
                desc: 'Yonma-yon bitta tekis qator',
                icon: AlignVerticalJustifyCenter,
              },
              {
                id: 'top_aligned',
                label: 'Tepaga tekislangan',
                desc: 'Tomning tepa qismidan boshlab',
                icon: AlignVerticalJustifyStart,
              },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id as AutoLayoutConfig['mode'])}
                  className={`p-2.5 rounded-xl text-left border transition-all flex items-start gap-2 ${
                    mode === m.id
                      ? 'border-purple-500 bg-purple-50/70 ring-1 ring-purple-500'
                      : 'border-cream-300 hover:border-cream-400 bg-cream-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 ${mode === m.id ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="text-xs font-bold text-navy-900">{m.label}</div>
                    <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{m.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Panel yo'nalishi (Portret / Peyzaj) */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-bold text-navy-800 uppercase tracking-wider block">
            3. Panel o'rnatilish yo'nalishi
          </label>
          <div className="grid grid-cols-2 gap-2 bg-cream-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setRotation(0)}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                rotation === 0
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-gray-500 hover:text-navy-900'
              }`}
            >
              Vertikal (Portret • Tik)
            </button>
            <button
              type="button"
              onClick={() => setRotation(90)}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                rotation === 90
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-gray-500 hover:text-navy-900'
              }`}
            >
              Gorizontal (Peyzaj • Yotgan)
            </button>
          </div>
        </div>

        {/* 4. Panellar soni */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
              4. Panellar soni
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setUseMaxCount(true)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  useMaxCount
                    ? 'bg-purple-600 text-white'
                    : 'bg-cream-200 text-navy-700'
                }`}
              >
                Maksimal sig'im
              </button>
              <button
                type="button"
                onClick={() => setUseMaxCount(false)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  !useMaxCount
                    ? 'bg-purple-600 text-white'
                    : 'bg-cream-200 text-navy-700'
                }`}
              >
                Aniq son
              </button>
            </div>
          </div>

          {!useMaxCount && (
            <div className="flex items-center gap-3 pt-1">
              <input
                type="range"
                min={1}
                max={60}
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value))}
                className="w-full h-2 bg-cream-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 min-w-12 text-center">
                {targetCount} ta
              </span>
            </div>
          )}
        </div>

        {/* AI Hisob-kitob natijasi (Live preview card) */}
        <div className="bg-gradient-to-r from-purple-50 to-cream-100 p-4 rounded-2xl border border-purple-200 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-navy-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                AI Hisobladi:
              </span>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Tom: {(roof.width / 100).toFixed(1)}m × {(roof.height / 100).toFixed(1)}m, 2 sm montaj oraliq
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-purple-700">
                {previewPanels.length} ta panel
              </span>
              <span className="block text-[11px] font-bold text-navy-800">
                {previewCapacityKw} kVt tizim quvvati
              </span>
            </div>
          </div>
        </div>

        {/* Boshqaruv tugmalari */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-cream-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-700 hover:bg-cream-100 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleApply}
            disabled={previewPanels.length === 0}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-white" />
            <span>AI Bilan Terish ({previewPanels.length} ta)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
