'use client';

import React from 'react';
import { SimulationState } from '@/types/solar';
import { calculateSunPosition } from '@/utils/solarCalc';
import { Sun, Calendar, Clock, Compass } from 'lucide-react';

interface SunShadowControlsProps {
  simulation: SimulationState;
  onSimulationChange: (sim: SimulationState) => void;
  roofPitch: number;
}

export const SunShadowControls: React.FC<SunShadowControlsProps> = ({
  simulation,
  onSimulationChange,
  roofPitch,
}) => {
  const sunPos = calculateSunPosition(simulation.time, simulation.season);

  // Vaqtni chiroyli formatlash (masalan 13.5 -> "13:30")
  const formatTime = (t: number) => {
    const hours = Math.floor(t);
    const minutes = Math.round((t - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Eng tik tushish burchagi vaqti (Tushki 12:30 - 13:00)
  const isOptimalHour = simulation.time >= 12.0 && simulation.time <= 13.5;

  return (
    <div className="absolute top-4 right-4 z-20 w-80 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-cream-300 text-xs text-navy-900 transition-all">
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-cream-200">
        <div className="flex items-center gap-1.5 font-bold text-navy-900">
          <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
          <span>Quyosh va Soya Simulyatsiyasi</span>
        </div>
        {isOptimalHour && (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-amber-300">
            Zenit (Eng tik)
          </span>
        )}
      </div>

      {/* 1. Vaqt slayderi (06:00 - 20:00) */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1 font-semibold">
          <span className="flex items-center gap-1 text-navy-700">
            <Clock className="w-3.5 h-3.5 text-navy-600" />
            Kun vaqti:
          </span>
          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-mono font-bold text-xs">
            {formatTime(simulation.time)}
          </span>
        </div>
        <input
          type="range"
          min={6.0}
          max={20.0}
          step={0.25}
          value={simulation.time}
          onChange={(e) =>
            onSimulationChange({
              ...simulation,
              time: parseFloat(e.target.value),
            })
          }
          className="w-full h-2 bg-cream-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>06:00 (Tong)</span>
          <span className="font-bold text-amber-800">13:00 (Peshin)</span>
          <span>20:00 (Shom)</span>
        </div>
      </div>

      {/* 2. Fasl tanlagichi */}
      <div className="mb-3">
        <div className="flex items-center gap-1 font-semibold text-navy-700 mb-1.5">
          <Calendar className="w-3.5 h-3.5 text-navy-600" />
          <span>Fasl:</span>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-cream-200/80 p-1 rounded-xl">
          <button
            onClick={() => onSimulationChange({ ...simulation, season: 'summer' })}
            className={`py-1 rounded-lg text-center font-bold text-[11px] transition-all ${
              simulation.season === 'summer'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-navy-700 hover:text-navy-950'
            }`}
          >
            Yoz (72°)
          </button>
          <button
            onClick={() => onSimulationChange({ ...simulation, season: 'equinox' })}
            className={`py-1 rounded-lg text-center font-bold text-[11px] transition-all ${
              simulation.season === 'equinox'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-navy-700 hover:text-navy-950'
            }`}
          >
            Bahor/Kuz (49°)
          </button>
          <button
            onClick={() => onSimulationChange({ ...simulation, season: 'winter' })}
            className={`py-1 rounded-lg text-center font-bold text-[11px] transition-all ${
              simulation.season === 'winter'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-navy-700 hover:text-navy-950'
            }`}
          >
            Qish (26°)
          </button>
        </div>
      </div>

      {/* 3. Jonli hisoblangan quyosh ko'rsatkichlari */}
      <div className="bg-cream-100 rounded-xl p-2 border border-cream-200 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-navy-600 block">Quyosh balandligi:</span>
          <strong className="text-navy-900 font-mono text-xs">
            {sunPos.altitudeDeg > 0 ? `${sunPos.altitudeDeg}°` : 'Ufq ostida'}
          </strong>
        </div>
        <div>
          <span className="text-navy-600 block">Nur intensivligi:</span>
          <strong className="text-amber-700 font-mono text-xs">
            {Math.round(sunPos.intensity * 100)}%
          </strong>
        </div>
      </div>
    </div>
  );
};
