'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ProjectData, CalculationResult } from '@/types/solar';
import { calculateProjectMetrics } from '@/utils/solarCalc';
import {
  Printer,
  X,
  FileText,
  Sun,
  ShieldCheck,
  TrendingUp,
  Zap,
  Calendar,
  DollarSign,
  Ruler,
  Leaf,
} from 'lucide-react';

interface EstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onUpdateClientInfo: (name: string, phone: string) => void;
}

export const EstimateModal: React.FC<EstimateModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateClientInfo,
}) => {
  const metrics: CalculationResult = calculateProjectMetrics(
    project.roof,
    project.panels,
    project.financialSettings
  );

  // Confetti animatsiyasi ochilganda
  useEffect(() => {
    if (isOpen && project.panels.length > 0) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#1E293B'],
        });
      } catch (e) {
        // Confetti xatosi bo'lsa indamay o'tish
      }
    }
  }, [isOpen, project.panels.length]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Usta uchun montaj qatorlarini guruhlash
  // Panellarni Y bo'yicha saralash va qatorlarga ajratish (agar Y lari 10 sm farq qilsa, bitta qatorda)
  const rowsMap = new Map<number, typeof project.panels>();
  const sortedPanels = [...project.panels].sort((a, b) => a.y - b.y || a.x - b.x);

  sortedPanels.forEach((p) => {
    let foundRowKey: number | null = null;
    for (const key of Array.from(rowsMap.keys())) {
      if (Math.abs(key - p.y) < 15) {
        foundRowKey = key;
        break;
      }
    }
    if (foundRowKey !== null) {
      rowsMap.get(foundRowKey)!.push(p);
    } else {
      rowsMap.set(p.y, [p]);
    }
  });

  const rowsList = Array.from(rowsMap.entries()).map(([rowY, rowPanels], idx) => {
    const leftMargin = Math.min(...rowPanels.map((p) => p.x));
    const rightMargin = Math.min(
      ...rowPanels.map((p) => project.roof.width - (p.x + p.width))
    );
    const topMargin = rowY;
    const count = rowPanels.length;
    const totalPower = rowPanels.reduce((sum, p) => sum + p.power, 0);

    return {
      rowNumber: idx + 1,
      topMarginCm: Math.round(topMargin * 10) / 10,
      leftMarginCm: Math.round(leftMargin * 10) / 10,
      rightMarginCm: Math.round(rightMargin * 10) / 10,
      count,
      totalPowerKw: Math.round((totalPower / 1000) * 100) / 100,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-navy-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-cream-200 relative my-auto max-h-[95vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none">
        
        {/* Bosib chiqarishda ko'rinmaydigan yuqori boshqaruv paneli */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-cream-200 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-900">
                Loyiha Smetasi va Montaj Sxemasi
              </h2>
              <p className="text-xs text-navy-600">
                Chop etish (Print / PDF) uchun to'liq tayyorlangan rasmiy hujjat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-navy-900 text-white hover:bg-navy-800 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Chop etish (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-navy-900 rounded-xl hover:bg-cream-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINT HUJJAT BOSHI (Chop etilganda ham chiqadi) */}
        <div className="space-y-6 text-navy-900">
          
          {/* Hujjat shapkasi */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-navy-900">
            <div>
              <div className="flex items-center gap-2">
                <Sun className="w-6 h-6 text-amber-500" />
                <span className="text-2xl font-black text-navy-950 tracking-tight">
                  SolarGrid
                </span>
                <span className="text-[10px] bg-navy-900 text-white font-bold px-2 py-0.5 rounded">
                  MUHANDISLIK SMETASI
                </span>
              </div>
              <p className="text-xs text-navy-700 mt-1">
                Quyosh elektr stansiyasi montaj sxemasi va iqtisodiy hisob-kitobi
              </p>
            </div>

            <div className="text-right text-xs">
              <div className="font-bold text-navy-900">
                Sana: {new Date().toLocaleDateString('uz-UZ')}
              </div>
              <div className="text-navy-600">
                Hujjat №: SG-{Date.now().toString().slice(-6)}
              </div>
            </div>
          </div>

          {/* Mijoz va Loyiha rekvizitlari */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-cream-50 p-4 rounded-2xl border border-cream-200">
            <div>
              <span className="text-[11px] font-bold text-navy-700 uppercase tracking-wider block mb-1">
                Loyiha ma'lumotlari:
              </span>
              <div className="text-sm font-bold text-navy-900">
                {project.projectName}
              </div>
              <div className="text-xs text-navy-700 mt-0.5">
                Tom: {(project.roof.width / 100).toFixed(2)} m × {(project.roof.height / 100).toFixed(2)} m ({metrics.roofAreaSqM} m²)
              </div>
              <div className="text-xs text-navy-700">
                Qiyalik: {project.roof.pitch}° | Yo'nalish: {project.roof.azimuth}° ({metrics.efficiencyScore}% unumdorlik)
              </div>
            </div>

            <div className="print:text-left">
              <span className="text-[11px] font-bold text-navy-700 uppercase tracking-wider block mb-1">
                Buyurtmachi (Mijoz):
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={project.clientName}
                  onChange={(e) => onUpdateClientInfo(e.target.value, project.clientPhone || '')}
                  className="text-sm font-bold text-navy-900 bg-transparent border-b border-dashed border-gray-400 focus:border-amber-500 outline-none print:border-none"
                  placeholder="Mijoz ismi (masalan: Alisher Navoiy)"
                />
              </div>
              <div className="mt-1">
                <input
                  type="text"
                  value={project.clientPhone || ''}
                  onChange={(e) => onUpdateClientInfo(project.clientName, e.target.value)}
                  className="text-xs text-navy-700 bg-transparent border-b border-dashed border-gray-400 focus:border-amber-500 outline-none print:border-none"
                  placeholder="Telefon raqami: +998 90 123-45-67"
                />
              </div>
            </div>
          </div>

          {/* 1-QISM: USTA UCHUN MONTAJ SXEMASI */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-navy-900">
              <Ruler className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                1. Usta uchun montaj o'lchamlari va karkas sxemasi
              </h3>
            </div>
            <p className="text-xs text-navy-700">
              Usta ushbu jadval asosida tom chetlaridan ruletka bilan o'lchab relslarni qotiradi. Barcha oraliqlarga 2 sm shamol va karkas marjasi kiritilgan.
            </p>

            <div className="overflow-x-auto rounded-2xl border border-cream-300">
              <table className="w-full text-xs text-left">
                <thead className="bg-navy-900 text-white font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5">Qator №</th>
                    <th className="px-3 py-2.5">Panellar soni</th>
                    <th className="px-3 py-2.5">Tepa chetidan (sm)</th>
                    <th className="px-3 py-2.5">Chap chetidan (sm)</th>
                    <th className="px-3 py-2.5">O'ng chetidan (sm)</th>
                    <th className="px-3 py-2.5">Qator quvvati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200 bg-white">
                  {rowsList.map((row) => (
                    <tr key={row.rowNumber} className="hover:bg-cream-50 font-medium">
                      <td className="px-3 py-2 font-bold text-navy-950">Qator #{row.rowNumber}</td>
                      <td className="px-3 py-2 font-bold text-amber-700">{row.count} ta panel</td>
                      <td className="px-3 py-2 font-mono font-bold text-navy-900">{row.topMarginCm} sm</td>
                      <td className="px-3 py-2 font-mono font-bold text-navy-900">{row.leftMarginCm} sm</td>
                      <td className="px-3 py-2 font-mono font-bold text-navy-900">{row.rightMarginCm} sm</td>
                      <td className="px-3 py-2 font-semibold text-emerald-700">{row.totalPowerKw} kVt</td>
                    </tr>
                  ))}
                  {rowsList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-gray-500">
                        Hozircha tomda panellar joylashtirilmagan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2-QISM: MIJOZ UCHUN TIJORIY VA IQTISODIY TAKLIF */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-navy-900">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                2. Mijoz uchun texnik va iqtisodiy ko'rsatkichlar
              </h3>
            </div>

            {/* Asosiy raqamlar gridi */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-cream-100/80 p-3 rounded-2xl border border-cream-200">
                <span className="text-[10px] font-bold text-navy-700 uppercase block">
                  Jami Quvvat:
                </span>
                <span className="text-xl sm:text-2xl font-black text-navy-950">
                  {metrics.totalCapacityKw} <span className="text-xs font-semibold">kVt</span>
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  {metrics.totalPanels} ta panel o'rnatilgan
                </span>
              </div>

              <div className="bg-cream-100/80 p-3 rounded-2xl border border-cream-200">
                <span className="text-[10px] font-bold text-navy-700 uppercase block">
                  Oylik Ishlab Chiqarish:
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-600">
                  {metrics.monthlyProductionKwh} <span className="text-xs font-semibold">kVt·s</span>
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Kuniga ~{metrics.dailyProductionKwh} kVt·s
                </span>
              </div>

              <div className="bg-cream-100/80 p-3 rounded-2xl border border-cream-200">
                <span className="text-[10px] font-bold text-navy-700 uppercase block">
                  Oylik Tejamkorlik:
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600">
                  {(metrics.monthlySavingsUzs / 1000).toFixed(0)} <span className="text-xs font-semibold">ming so'm</span>
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Yiliga: {(metrics.annualSavingsUzs / 1000000).toFixed(1)} mln so'm
                </span>
              </div>

              <div className="bg-cream-100/80 p-3 rounded-2xl border border-cream-200">
                <span className="text-[10px] font-bold text-navy-700 uppercase block">
                  O'zini Qoplash (ROI):
                </span>
                <span className="text-xl sm:text-2xl font-black text-purple-700">
                  {metrics.roiYears} <span className="text-xs font-semibold">Yil</span>
                </span>
                <span className="text-[10px] text-purple-600 font-bold block mt-0.5">
                  ({metrics.roiMonths} oyda xarajat 0 ga chiqadi)
                </span>
              </div>
            </div>

            {/* Narx va Xarajatlar tafsiloti */}
            <div className="bg-white rounded-2xl border border-cream-300 p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-cream-200">
                <span className="text-navy-700">Panellar va invertor, alyuminiy karkas:</span>
                <strong className="text-navy-900 font-mono">
                  {metrics.totalEstimatedCostUzs.toLocaleString('uz-UZ')} so'm
                </strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-cream-200">
                <span className="text-navy-700">O'rnatish va montaj kafolati:</span>
                <strong className="text-emerald-700 font-semibold">10 yil to'liq kafolat</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-cream-200">
                <span className="text-navy-700">Yillik ekologik tejamkorlik (CO2):</span>
                <strong className="text-emerald-700 font-mono">{metrics.co2SavedAnnualTons} tonna/yil</strong>
              </div>
              <div className="flex justify-between items-center pt-2 text-sm font-extrabold text-navy-950">
                <span>JAMI TAXMINIY LOYIHA QIYMATI:</span>
                <span className="text-base text-amber-600 font-mono">
                  {metrics.totalEstimatedCostUzs.toLocaleString('uz-UZ')} UZS
                </span>
              </div>
            </div>
          </div>

          {/* Muhr va Imzo joyi (Chop etish uchun) */}
          <div className="pt-8 border-t border-cream-300 grid grid-cols-2 gap-8 text-xs text-navy-800">
            <div>
              <p className="font-bold">O'rnatuvchi mutaxassis (Usta / Kompaniya):</p>
              <div className="mt-8 pt-2 border-t border-gray-400 w-48 text-gray-500 text-[11px]">
                (Imzo va F.I.Sh.)
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">Buyurtmachi (Mijoz tasdig'i):</p>
              <div className="mt-8 pt-2 border-t border-gray-400 w-48 ml-auto text-gray-500 text-[11px]">
                (Imzo va F.I.Sh.)
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
