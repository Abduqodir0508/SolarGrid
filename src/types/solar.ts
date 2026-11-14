export type CompassDirection = 'S' | 'SW' | 'SE' | 'W' | 'E' | 'NW' | 'NE' | 'N';

export interface Roof {
  width: number;       // Santimetrlarda (masalan 1200 = 12m)
  height: number;      // Santimetrlarda (masalan 800 = 8m)
  pitch: number;       // 0° dan 60° gacha qiyalik burchagi
  azimuth: number;     // 0° - 360° (180° = Janub, 90° = Sharq, 270° = G'arb, 0° = Shimol)
  material?: 'metal_sheet' | 'tile' | 'flat_concrete' | 'slate';
}

export interface SolarPanelSpec {
  id: string;
  brand: string;
  model: string;
  power: number;       // Watt (masalan 550W)
  width: number;       // sm (masalan 113.4)
  height: number;      // sm (masalan 227.8)
  thickness: number;   // sm (masalan 3.5)
  efficiency: number;  // Foiz (masalan 22.8%)
  priceEstimated: number; // Taxminiy narxi so'mda
  color: string;
  isCustom?: boolean;
}

export interface PlacedPanel {
  id: string;
  specId: string;
  x: number;           // Tom chap chetidan santimetrda
  y: number;           // Tom tepa chetidan santimetrda
  rotation: 0 | 90;    // 0 = Portret (tik), 90 = Peyzaj (yotgan)
  width: number;       // Amaldagi eni (rotation ga qarab)
  height: number;      // Amaldagi bo'yi (rotation ga qarab)
  power: number;
  label?: string;
  isValid?: boolean;   // Tom ichidami va to'qnashuv yo'qmi
  collisionWith?: string[];
}

export interface SimulationState {
  time: number;        // 6.0 dan 20.0 gacha (masalan 12.5 = 12:30)
  season: 'summer' | 'winter' | 'equinox';
}

export interface FinancialSettings {
  electricityPricePerKwh: number; // So'm (standart 900 so'm)
  systemCostPerWatt: number;      // Invertor, montaj va karkas bilan (standart 7,000 so'm/W)
  solarHoursDaily: number;        // O'rtacha samarali quyosh soatlari (O'zbekistonda 5.2 soat)
}

export interface CalculationResult {
  totalPanels: number;
  totalCapacityKw: number;        // Jami quvvat kVt
  roofAreaSqM: number;            // Tom maydoni m²
  panelsAreaSqM: number;          // Panellar maydoni m²
  roofCoveragePercent: number;    // Tom qoplanishi %
  efficiencyScore: number;        // Azimut va burchak bo'yicha unumdorlik (0 - 100%)
  dailyProductionKwh: number;     // Kunlik ishlab chiqarish
  monthlyProductionKwh: number;   // Oylik ishlab chiqarish
  annualProductionKwh: number;    // Yillik ishlab chiqarish
  totalEstimatedCostUzs: number;  // Jami investitsiya summasi
  monthlySavingsUzs: number;      // Oylik tejamkorlik
  annualSavingsUzs: number;       // Yillik tejamkorlik
  roiYears: number;               // Qoplash muddati (yil)
  roiMonths: number;              // Qoplash muddati (oy)
  co2SavedAnnualTons: number;     // CO2 tejalishi (tonna)
}

export interface RulerMeasurement {
  panelId: string;
  leftCm: number;
  rightCm: number;
  topCm: number;
  bottomCm: number;
  nearestNeighbor?: {
    distanceCm: number;
    direction: 'left' | 'right' | 'top' | 'bottom';
    neighborId: string;
  };
}

export interface AutoLayoutConfig {
  specId: string;
  mode: 'max_fit' | 'center_row' | 'center_grid' | 'top_aligned';
  targetCount?: number;
  rotation: 0 | 90;
  spacingCm: number; // Panellar orasidagi oraliq (standart 2 sm)
  marginCm: number;  // Tom chetlaridan xavfsizlik masofasi (standart 20 sm)
}

export interface ProjectData {
  id: string;          // Har bir loyiha uchun unikal ID
  version: string;
  projectName: string;
  clientName: string;
  clientPhone?: string;
  address?: string;    // Masalan: "Qo'yliq 6-massiv, 5-dom"
  notes?: string;
  roof: Roof;
  panels: PlacedPanel[];
  financialSettings: FinancialSettings;
  createdAt: string;
  updatedAt: string;
}
