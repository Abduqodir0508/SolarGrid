'use client';

import React, { useState } from 'react';
import { SolarPanelSpec, PlacedPanel, Roof } from '@/types/solar';
import { DEFAULT_SOLAR_PANELS } from '@/constants/solarPanels';
import { validatePanelPlacement } from '@/utils/geometry';
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Layers,
  Wand2,
  Trash2,
  Check,
} from 'lucide-react';

interface PanelCatalogSheetProps {
  roof: Roof;
  panels: PlacedPanel[];
  onAddPanel: (spec: SolarPanelSpec) => void;
  onOpenSmartLayout: () => void;
  onClearPanels: () => void;
  customPanels: SolarPanelSpec[];
  onAddCustomSpec: (spec: SolarPanelSpec) => void;
}

export const PanelCatalogSheet: React.FC<PanelCatalogSheetProps> = ({
  roof,
  panels,
  onAddPanel,
  onOpenSmartLayout,
  onClearPanels,
  customPanels,
  onAddCustomSpec,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);

  // Yangi maxsus panel kiritish holatlari
  const [customBrand, setCustomBrand] = useState('Maxsus');
  const [customModel, setCustomModel] = useState('Panel 600W');
  const [customPower, setCustomPower] = useState('600');
  const [customWidth, setCustomWidth] = useState('113.4');
  const [customHeight, setCustomHeight] = useState('230.0');

  const allSpecs = [...DEFAULT_SOLAR_PANELS, ...customPanels];

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const power = parseInt(customPower) || 500;
    const width = parseFloat(customWidth) || 113.4;
    const height = parseFloat(customHeight) || 220.0;

    const newSpec: SolarPanelSpec = {
      id: `custom-${Date.now()}`,
      brand: customBrand || 'Maxsus',
      model: customModel || 'Panel',
      power,
      width,
      height,
      thickness: 3.5,
      efficiency: 22.0,
      priceEstimated: power * 2000,
      color: '#0F172A',
      isCustom: true,
    };

    onAddCustomSpec(newSpec);
    setShowCustomModal(false);
  };

  return (
    <>
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-cream-300 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 ease-in-out ${
          isExpanded ? 'h-80' : 'h-24 sm:h-28'
        }`}
      >
        {/* Yuqori ochish/yopish barmoq tutqichi (Drag Pill) */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-1.5 flex flex-col items-center justify-center cursor-pointer hover:bg-cream-100/50 transition-colors"
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-0.5" />
          <div className="flex items-center gap-1 text-[11px] font-bold text-navy-700">
            <span>Quyosh Panellari Katalogi</span>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-navy-500" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-navy-500" />
            )}
          </div>
        </div>

        {/* Ichki qism */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[calc(100%-36px)] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-cream-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-navy-900">
                O'rnatish uchun panelni tanlang:
              </span>
              <span className="text-xs text-gray-500">
                (Tomga bosing yoki qo'shing)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSmartLayout}
                className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                <span>AI Avto-Terish</span>
              </button>

              <button
                onClick={() => setShowCustomModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-cream-100 text-navy-800 hover:bg-cream-200 border border-cream-300 rounded-xl text-xs font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Maxsus panel</span>
              </button>
            </div>
          </div>

          {/* Panellar kartochkalari gorizontal ro'yxati */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pb-4">
            {allSpecs.map((spec) => (
              <div
                key={spec.id}
                className="group relative bg-white border border-cream-300 hover:border-amber-400 rounded-2xl p-2.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      {spec.brand}
                    </span>
                    <span className="text-xs font-black text-navy-900">
                      {spec.power}W
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-navy-900 truncate">
                    {spec.model}
                  </h3>

                  <div className="text-[11px] text-gray-500 mt-1 flex flex-col gap-0.5">
                    <span>
                      O'lcham: <strong>{spec.width} × {spec.height} sm</strong>
                    </span>
                    <span>
                      Unumdorlik: <strong>{spec.efficiency}%</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAddPanel(spec)}
                  className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 bg-navy-900 group-hover:bg-amber-500 text-white group-hover:text-navy-950 font-bold rounded-xl text-xs shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tomga qo'yish</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Maxsus panel qo'shish modali */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-cream-200">
            <h3 className="text-base font-bold text-navy-900 mb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              <span>Yangi Maxsus Quyosh Paneli</span>
            </h3>

            <form onSubmit={handleCreateCustom} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Ishlab chiqaruvchi (Brend):
                </label>
                <input
                  type="text"
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-cream-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Masalan: SunPower"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Model nomi:
                </label>
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-cream-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Masalan: Maxeon 6"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">
                    Quvvat (Watt):
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="1000"
                    value={customPower}
                    onChange={(e) => setCustomPower(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-cream-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">
                    Eni (sm):
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="300"
                    step="0.1"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-cream-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">
                    Bo'yi (sm):
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="300"
                    step="0.1"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-cream-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-cream-100 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-navy-900 text-white rounded-xl hover:bg-navy-800"
                >
                  Katalogga qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
