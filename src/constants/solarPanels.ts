import { SolarPanelSpec, FinancialSettings } from '@/types/solar';

export const DEFAULT_SOLAR_PANELS: SolarPanelSpec[] = [
  {
    id: 'longi-himo6-550',
    brand: 'LONGi',
    model: 'Hi-MO 6 Explorer',
    power: 550,
    width: 113.4,
    height: 227.8,
    thickness: 3.5,
    efficiency: 22.8,
    priceEstimated: 1150000, // ~1,150,000 UZS
    color: '#1E293B',
  },
  {
    id: 'jinko-tiger-580',
    brand: 'Jinko Solar',
    model: 'Tiger Neo N-type',
    power: 580,
    width: 113.4,
    height: 227.8,
    thickness: 3.5,
    efficiency: 22.5,
    priceEstimated: 1220000, // ~1,220,000 UZS
    color: '#0F172A',
  },
  {
    id: 'trina-vertex-430',
    brand: 'Trina Solar',
    model: 'Vertex S Mono',
    power: 430,
    width: 113.4,
    height: 176.2,
    thickness: 3.0,
    efficiency: 21.8,
    priceEstimated: 920000, // ~920,000 UZS
    color: '#1E3A5F',
  },
  {
    id: 'canadian-hiku-660',
    brand: 'Canadian Solar',
    model: 'HiKu7 BiHiKu',
    power: 660,
    width: 130.3,
    height: 238.4,
    thickness: 3.5,
    efficiency: 21.5,
    priceEstimated: 1400000, // ~1,400,000 UZS
    color: '#111827',
  },
];

export const DEFAULT_FINANCIAL_SETTINGS: FinancialSettings = {
  electricityPricePerKwh: 900,   // O'zbekistonda 1 kVt·soat narxi (so'm)
  systemCostPerWatt: 7200,        // Tizimning to'liq montaj narxi 1 Vt uchun (invertor, montaj, karkas, kabellar)
  solarHoursDaily: 5.2,          // O'zbekistonda o'rtacha quyoshli soat (yillik o'rtacha 5.0 - 5.5 soat)
};

export const COMPASS_POINTS = [
  { label: 'Janub (Eng optimal)', direction: 'S', azimuth: 180, factor: 1.0 },
  { label: 'Janubi-G\'arb', direction: 'SW', azimuth: 225, factor: 0.94 },
  { label: 'Janubi-Sharq', direction: 'SE', azimuth: 135, factor: 0.94 },
  { label: 'G\'arb', direction: 'W', azimuth: 270, factor: 0.82 },
  { label: 'Sharq', direction: 'E', azimuth: 90, factor: 0.82 },
  { label: 'Shimoli-G\'arb', direction: 'NW', azimuth: 315, factor: 0.65 },
  { label: 'Shimoli-Sharq', direction: 'NE', azimuth: 45, factor: 0.65 },
  { label: 'Shimol (Past unumdorlik)', direction: 'N', azimuth: 0, factor: 0.52 },
];
