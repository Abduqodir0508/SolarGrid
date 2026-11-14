import { Roof, PlacedPanel, FinancialSettings, CalculationResult } from '@/types/solar';

/**
 * Tom qiyaligi va kompas azimutiga qarab quyosh samaradorlik foizini hisoblash
 * O'zbekiston kengligi (~41° N) uchun kalibrlangan fotovoltaik fizika modeli
 */
export function calculateEfficiencyScore(pitch: number, azimuth: number): number {
  // Agar tom mutlaqo tekis bo'lsa (0°), azimut ta'sir qilmaydi (~87% samaradorlik)
  if (pitch <= 2) {
    return 88;
  }

  // Optimal burchak O'zbekiston uchun 32° - 35°
  const optimalPitch = 33;
  const pitchRad = (pitch * Math.PI) / 180;
  const optimalPitchRad = (optimalPitch * Math.PI) / 180;

  // Janubdan (180°) og'ish burchagi
  const azimuthDeviation = Math.abs(azimuth - 180);
  const azimuthDevRad = (azimuthDeviation * Math.PI) / 180;

  // Burchak koeffitsiyenti
  const pitchFactor = 1 - 0.00025 * Math.pow(pitch - optimalPitch, 2);

  // Azimut koeffitsiyenti (qiyalik qancha baland bo'lsa, azimut shuncha muhim)
  const pitchInfluence = Math.sin(pitchRad);
  const azimuthFactor = 1 - pitchInfluence * 0.45 * (1 - Math.cos(azimuthDevRad));

  let score = pitchFactor * azimuthFactor * 100;

  // Chegaralash: 40% dan 100% gacha
  score = Math.max(40, Math.min(100, score));
  return Math.round(score * 10) / 10;
}

/**
 * Quyoshning osmondagi pozitsiyasini hisoblash (Simulyatsiya uchun)
 * time: 6.0 dan 20.0 gacha
 * season: 'summer' | 'winter' | 'equinox'
 */
export function calculateSunPosition(
  time: number,
  season: 'summer' | 'winter' | 'equinox'
): { altitudeDeg: number; azimuthDeg: number; intensity: number } {
  // 12:00 da quyosh eng balandda
  const hourAngle = (time - 12) * 15; // gradus (-90° 06:00 da, +90° 18:00 da)

  // Mavsumiy maksimal balandlik (deklinatsiya)
  let maxAltitude = 72; // Yozda Toshkentda ~72°
  if (season === 'winter') {
    maxAltitude = 26;   // Qishda ~26°
  } else if (season === 'equinox') {
    maxAltitude = 49;   // Bahor/Kuz ~49°
  }

  // Balandlik (altitude)
  const hourRad = (hourAngle * Math.PI) / 180;
  const altitude = Math.max(0, maxAltitude * Math.cos(hourRad * 0.95));

  // Azimut: ertalab sharqdan (90°), tushda janubdan (180°), kechqurun g'arbdan (270°)
  // O'zbekistonda quyosh sharqdan janub orqali g'arbga o'tadi
  const azimuth = 180 + hourAngle * 1.1;

  // Nur intensivligi (quyosh chiqishi/botishida past, zenitda 1.0)
  const intensity = Math.max(0, Math.sin((altitude * Math.PI) / 180));

  return {
    altitudeDeg: Math.round(altitude * 10) / 10,
    azimuthDeg: Math.round(azimuth * 10) / 10,
    intensity: Math.round(intensity * 100) / 100,
  };
}

/**
 * To'liq texnik va moliyaviy smeta hisoblash
 */
export function calculateProjectMetrics(
  roof: Roof,
  panels: PlacedPanel[],
  financial: FinancialSettings
): CalculationResult {
  const totalPanels = panels.length;
  
  // Jami quvvat (Vt va kVt)
  const totalWatt = panels.reduce((sum, p) => sum + (p.power || 0), 0);
  const totalCapacityKw = Math.round((totalWatt / 1000) * 100) / 100;

  // Tom maydoni (m²)
  const roofAreaSqM = Math.round(((roof.width * roof.height) / 10000) * 10) / 10;

  // Panellar maydoni (m²)
  const panelsAreaSqCm = panels.reduce((sum, p) => sum + (p.width * p.height), 0);
  const panelsAreaSqM = Math.round((panelsAreaSqCm / 10000) * 10) / 10;

  const roofCoveragePercent = roofAreaSqM > 0
    ? Math.min(100, Math.round((panelsAreaSqM / roofAreaSqM) * 100))
    : 0;

  // Unumdorlik koeffitsiyenti
  const efficiencyScore = calculateEfficiencyScore(roof.pitch, roof.azimuth);
  const efficiencyRatio = efficiencyScore / 100;

  // Tizim samaradorligi (inverter va simlardagi yo'qotishlar ~15%)
  const systemPerformanceRatio = 0.85;

  // Kunlik ishlab chiqarish (kVt·soat)
  const dailyProductionKwh = Math.round(
    totalCapacityKw * financial.solarHoursDaily * efficiencyRatio * systemPerformanceRatio * 10
  ) / 10;

  // Oylik va yillik ishlab chiqarish
  const monthlyProductionKwh = Math.round(dailyProductionKwh * 30.5 * 10) / 10;
  const annualProductionKwh = Math.round(dailyProductionKwh * 365);

  // Moliyaviy ko'rsatkichlar
  const totalEstimatedCostUzs = Math.round(totalWatt * financial.systemCostPerWatt);
  const monthlySavingsUzs = Math.round(monthlyProductionKwh * financial.electricityPricePerKwh);
  const annualSavingsUzs = Math.round(annualProductionKwh * financial.electricityPricePerKwh);

  // Qoplash muddati (ROI)
  let roiYears = 0;
  let roiMonths = 0;
  if (annualSavingsUzs > 0) {
    const rawYears = totalEstimatedCostUzs / annualSavingsUzs;
    roiYears = Math.round(rawYears * 10) / 10;
    roiMonths = Math.round(rawYears * 12);
  }

  // CO2 tejalishi (tonna/yil) — 1 kVt·soat ~ 0.52 kg CO2
  const co2SavedAnnualTons = Math.round((annualProductionKwh * 0.00052) * 10) / 10;

  return {
    totalPanels,
    totalCapacityKw,
    roofAreaSqM,
    panelsAreaSqM,
    roofCoveragePercent,
    efficiencyScore,
    dailyProductionKwh,
    monthlyProductionKwh,
    annualProductionKwh,
    totalEstimatedCostUzs,
    monthlySavingsUzs,
    annualSavingsUzs,
    roiYears,
    roiMonths,
    co2SavedAnnualTons,
  };
}
