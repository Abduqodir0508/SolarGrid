'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Roof, PlacedPanel, RulerMeasurement } from '@/types/solar';
import {
  calculateRulerMeasurements,
  applyMagneticSnap,
  validatePanelPlacement,
} from '@/utils/geometry';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Trash2,
  Copy,
  Compass,
  AlertTriangle,
} from 'lucide-react';

interface Canvas2DProps {
  roof: Roof;
  panels: PlacedPanel[];
  onPanelsChange: (panels: PlacedPanel[]) => void;
  selectedPanelId: string | null;
  onSelectPanel: (id: string | null) => void;
}

export const Canvas2D: React.FC<Canvas2DProps> = ({
  roof,
  panels,
  onPanelsChange,
  selectedPanelId,
  onSelectPanel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ko'rinish masshtabi va siljishi (Pan & Zoom)
  const [scale, setScale] = useState<number>(0.8);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Drag holatlari
  const [draggingPanelId, setDraggingPanelId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Jonli aqlli chizg'ich ko'rsatkichi
  const [liveRuler, setLiveRuler] = useState<RulerMeasurement | null>(null);
  const [hasCollision, setHasCollision] = useState<boolean>(false);

  // Ekranga avtomatik moslashtirish (Fit to screen)
  // Pastki panel katalogi drawerini hisobga olib, tomni ochiq maydonda markazlashtiradi
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    // Pastki panel katalogi (Bottom Sheet) balandligini hisobga olish
    // Desktopda ~116px, mobilda ~96px pastki qism katalog bilan band
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const bottomSheetH = isMobile ? 96 : 116;
    const availableHeight = Math.max(200, clientHeight - bottomSheetH);

    const marginX = isMobile ? 40 : 80;
    const marginY = isMobile ? 40 : 60;
    const scaleX = (clientWidth - marginX) / roof.width;
    const scaleY = (availableHeight - marginY) / roof.height;
    const newScale = Math.min(scaleX, scaleY, 1.3);

    const newOffsetX = (clientWidth - roof.width * newScale) / 2;
    // Tomni aynan ko'rinadigan bo'sh ish maydonida markazlashtirish (pastki drawer ustida)
    const newOffsetY = Math.max(16, (availableHeight - roof.height * newScale) / 2 + 12);

    setScale(Math.max(0.08, newScale));
    setOffset({ x: newOffsetX, y: newOffsetY });
  }, [roof.width, roof.height]);

  useEffect(() => {
    fitToScreen();
  }, [roof.width, roof.height, fitToScreen]);

  // Ekran koordinatasidan tom koordinatasiga (sm ga) o'girish
  const screenToRoof = useCallback(
    (screenX: number, screenY: number) => {
      const roofX = (screenX - offset.x) / scale;
      const roofY = (screenY - offset.y) / scale;
      return { x: roofX, y: roofY };
    },
    [offset, scale]
  );

  // Sichqoncha / Barmoq pozitsiyasidagi panelni topish
  const getPanelAtPosition = useCallback(
    (roofX: number, roofY: number) => {
      for (let i = panels.length - 1; i >= 0; i--) {
        const p = panels[i];
        if (
          roofX >= p.x &&
          roofX <= p.x + p.width &&
          roofY >= p.y &&
          roofY <= p.y + p.height
        ) {
          return p;
        }
      }
      return null;
    },
    [panels]
  );

  // 1. Panelni 90° aylantirish (Rotate)
  const handleRotatePanel = (id: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const updated = panels.map((p) => {
      if (p.id !== id) return p;
      const newRotation: 0 | 90 = p.rotation === 0 ? 90 : 0;
      const newWidth = p.height;
      const newHeight = p.width;

      // Tom chegarasidan chiqib ketmasligi uchun clamp
      let newX = Math.max(0, Math.min(p.x, roof.width - newWidth));
      let newY = Math.max(0, Math.min(p.y, roof.height - newHeight));

      const candidate: PlacedPanel = {
        ...p,
        rotation: newRotation,
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
        width: newWidth,
        height: newHeight,
      };

      const { isValid, collisionWith } = validatePanelPlacement(candidate, panels, roof);
      return { ...candidate, isValid, collisionWith };
    });

    onPanelsChange(updated);
    const rotated = updated.find((p) => p.id === id);
    if (rotated) {
      setLiveRuler(calculateRulerMeasurements(rotated, roof, updated));
      setHasCollision(!rotated.isValid);
    }
  };

  // 2. Panelni o'chirish (Delete)
  const handleDeletePanel = (id: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const updated = panels.filter((p) => p.id !== id);
    onPanelsChange(updated);
    onSelectPanel(null);
    setLiveRuler(null);
    setHasCollision(false);
  };

  // 3. Panelni nusxalash (Duplicate)
  const handleDuplicatePanel = (id: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const target = panels.find((p) => p.id === id);
    if (!target) return;

    // A) Avval o'ng tomonga qo'yib ko'rish (o'sha qator davomi)
    let newX = target.x + target.width + 2;
    let newY = target.y;

    // B) Agar o'ng tomonga sig'masa, qatorning boshidan pastga tushirish
    if (newX + target.width > roof.width - 20) {
      const rowPanels = panels.filter((p) => Math.abs(p.y - target.y) < 20);
      const minX = rowPanels.length > 0 ? Math.min(...rowPanels.map((p) => p.x)) : 20;
      newX = minX;
      newY = target.y + target.height + 2;
    }

    // C) Agar pastga ham sig'masa, yuqoridagi qatordan joy tekshirish
    if (newY + target.height > roof.height - 20) {
      newY = Math.max(20, target.y - target.height - 2);
      newX = target.x;
    }

    // D) Tom chegarasida qat'iy ushlash (Clamp)
    newX = Math.max(0, Math.min(newX, roof.width - target.width));
    newY = Math.max(0, Math.min(newY, roof.height - target.height));

    const clone: PlacedPanel = {
      ...target,
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10,
      label: `${target.label || 'Panel'} #nusxa`,
      isValid: true,
    };

    const { isValid, collisionWith } = validatePanelPlacement(clone, panels, roof);
    clone.isValid = isValid;
    clone.collisionWith = collisionWith;

    const updated = [...panels, clone];
    onPanelsChange(updated);
    onSelectPanel(clone.id);
    setLiveRuler(calculateRulerMeasurements(clone, roof, updated));
    setHasCollision(!isValid);
  };

  // --- MOUSE & TOUCH EVENTLARI ---
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const roofPos = screenToRoof(x, y);
    const clickedPanel = getPanelAtPosition(roofPos.x, roofPos.y);

    if (clickedPanel) {
      onSelectPanel(clickedPanel.id);
      setDraggingPanelId(clickedPanel.id);
      setDragOffset({
        x: roofPos.x - clickedPanel.x,
        y: roofPos.y - clickedPanel.y,
      });

      const ruler = calculateRulerMeasurements(clickedPanel, roof, panels);
      setLiveRuler(ruler);
      setHasCollision(!clickedPanel.isValid);
    } else {
      onSelectPanel(null);
      setLiveRuler(null);
      setHasCollision(false);
      setIsPanning(true);
      setPanStart({ x: clientX - offset.x, y: clientY - offset.y });
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (isPanning) {
      setOffset({
        x: clientX - panStart.x,
        y: clientY - panStart.y,
      });
      return;
    }

    if (!draggingPanelId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const roofPos = screenToRoof(x, y);

    const activePanel = panels.find((p) => p.id === draggingPanelId);
    if (!activePanel) return;

    const rawX = roofPos.x - dragOffset.x;
    const rawY = roofPos.y - dragOffset.y;

    // Magnit snap (2 sm montaj oraliq va tom chetlariga)
    const snapped = applyMagneticSnap(
      rawX,
      rawY,
      activePanel.width,
      activePanel.height,
      panels,
      roof,
      activePanel.id
    );

    // Tom ichida qolishini qat'iy kafolatlash (Clamp to roof boundaries)
    const clampedX = Math.round(Math.max(0, Math.min(snapped.x, roof.width - activePanel.width)) * 10) / 10;
    const clampedY = Math.round(Math.max(0, Math.min(snapped.y, roof.height - activePanel.height)) * 10) / 10;

    const candidate: PlacedPanel = {
      ...activePanel,
      x: clampedX,
      y: clampedY,
    };

    const { isValid, collisionWith } = validatePanelPlacement(candidate, panels, roof);
    candidate.isValid = isValid;
    candidate.collisionWith = collisionWith;

    setHasCollision(!isValid);

    const ruler = calculateRulerMeasurements(candidate, roof, panels);
    setLiveRuler(ruler);

    const updated = panels.map((p) => (p.id === activePanel.id ? candidate : p));
    onPanelsChange(updated);
  };

  const handlePointerUp = () => {
    setDraggingPanelId(null);
    setIsPanning(false);
  };

  const handleZoom = (delta: number) => {
    setScale((prev) => {
      const next = Math.max(0.1, Math.min(3.0, prev + delta));
      return Math.round(next * 100) / 100;
    });
  };

  // --- ASOSIY CANVAS CHIZISH SIKLI ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Fon
    ctx.fillStyle = '#F8F6F0';
    ctx.fillRect(0, 0, width, height);

    // 2. Transformatsiya
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // 3. Tom maydoni
    const roofW = roof.width;
    const roofH = roof.height;

    ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
    ctx.shadowBlur = 24 / scale;
    ctx.shadowOffsetX = 4 / scale;
    ctx.shadowOffsetY = 8 / scale;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, roofW, roofH);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 4. Grid
    const gridStep = 50;
    ctx.strokeStyle = '#EFECE6';
    ctx.lineWidth = 1 / scale;

    for (let gx = 0; gx <= roofW; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, roofH);
      ctx.stroke();
    }

    for (let gy = 0; gy <= roofH; gy += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(roofW, gy);
      ctx.stroke();
    }

    ctx.strokeStyle = '#E5E1D8';
    ctx.lineWidth = 1.5 / scale;
    for (let gx = 0; gx <= roofW; gx += 100) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, roofH);
      ctx.stroke();
    }
    for (let gy = 0; gy <= roofH; gy += 100) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(roofW, gy);
      ctx.stroke();
    }

    // 5. 20 sm xavfsizlik chegarasi
    const margin = 20;
    if (roofW > margin * 2 && roofH > margin * 2) {
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1 / scale;
      ctx.setLineDash([6 / scale, 6 / scale]);
      ctx.strokeRect(margin, margin, roofW - margin * 2, roofH - margin * 2);
      ctx.setLineDash([]);
    }

    // 6. Tom chegarasi
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.5 / scale;
    ctx.strokeRect(0, 0, roofW, roofH);

    // 7. Tom o'lchamlari
    ctx.fillStyle = '#475569';
    ctx.font = `bold ${Math.max(12, 14 / scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${(roofW / 100).toFixed(2)} m (${roofW} sm)`, roofW / 2, -10 / scale);

    ctx.save();
    ctx.translate(-15 / scale, roofH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${(roofH / 100).toFixed(2)} m (${roofH} sm)`, 0, 0);
    ctx.restore();

    // 8. Panellarni chizish
    panels.forEach((p, idx) => {
      const isSelected = p.id === selectedPanelId;
      const isValid = p.isValid !== false;

      ctx.save();
      ctx.translate(p.x, p.y);

      // Panel foni
      ctx.fillStyle = isValid ? '#1E293B' : '#EF4444';
      ctx.fillRect(0, 0, p.width, p.height);

      // Quyosh katakchalari
      if (isValid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1 / scale;

        const cellCols = p.rotation === 0 ? 6 : 10;
        const cellRows = p.rotation === 0 ? 10 : 6;
        const cellW = p.width / cellCols;
        const cellH = p.height / cellRows;

        for (let c = 1; c < cellCols; c++) {
          ctx.beginPath();
          ctx.moveTo(c * cellW, 0);
          ctx.lineTo(c * cellW, p.height);
          ctx.stroke();
        }
        for (let r = 1; r < cellRows; r++) {
          ctx.beginPath();
          ctx.moveTo(0, r * cellH);
          ctx.lineTo(p.width, r * cellH);
          ctx.stroke();
        }
      }

      // Alyuminiy ramka
      if (!isValid) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 3 / scale;
      } else if (isSelected) {
        ctx.strokeStyle = '#F59E0B'; // Oltin sariq tanlov hoshiyasi
        ctx.lineWidth = 3.5 / scale;
      } else {
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1.5 / scale;
      }
      ctx.strokeRect(0, 0, p.width, p.height);

      // Panel matni
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(10, 11 / scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const label = `#${idx + 1} • ${p.power}W`;
      ctx.fillText(label, p.width / 2, p.height / 2);

      ctx.font = `${Math.max(8, 9 / scale)}px sans-serif`;
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(
        `${p.width.toFixed(0)}×${p.height.toFixed(0)} sm`,
        p.width / 2,
        p.height / 2 + 14 / scale
      );

      ctx.restore();
    });

    // 9. Aqlli Chizg'ich (Smart Ruler)
    if (liveRuler && selectedPanelId) {
      const activePanel = panels.find((p) => p.id === selectedPanelId);
      if (activePanel) {
        ctx.strokeStyle = hasCollision ? '#EF4444' : '#F59E0B';
        ctx.fillStyle = hasCollision ? '#EF4444' : '#B45309';
        ctx.lineWidth = 1.5 / scale;
        ctx.setLineDash([4 / scale, 4 / scale]);

        const midX = activePanel.x + activePanel.width / 2;
        const midY = activePanel.y + activePanel.height / 2;
        const fontSz = Math.max(11, 12 / scale);
        ctx.font = `bold ${fontSz}px sans-serif`;

        // Chap
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(activePanel.x, midY);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${liveRuler.leftCm} sm`, activePanel.x / 2, midY - 4 / scale);

        // O'ng
        ctx.beginPath();
        ctx.moveTo(activePanel.x + activePanel.width, midY);
        ctx.lineTo(roofW, midY);
        ctx.stroke();
        ctx.fillText(
          `${liveRuler.rightCm} sm`,
          activePanel.x + activePanel.width + (roofW - (activePanel.x + activePanel.width)) / 2,
          midY - 4 / scale
        );

        // Tepa
        ctx.beginPath();
        ctx.moveTo(midX, 0);
        ctx.lineTo(midX, activePanel.y);
        ctx.stroke();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${liveRuler.topCm} sm`, midX - 6 / scale, activePanel.y / 2);

        // Past
        ctx.beginPath();
        ctx.moveTo(midX, activePanel.y + activePanel.height);
        ctx.lineTo(midX, roofH);
        ctx.stroke();
        ctx.fillText(
          `${liveRuler.bottomCm} sm`,
          midX - 6 / scale,
          activePanel.y + activePanel.height + (roofH - (activePanel.y + activePanel.height)) / 2
        );

        ctx.setLineDash([]);
      }
    }

    ctx.restore();
    ctx.restore();
  }, [
    roof,
    panels,
    selectedPanelId,
    draggingPanelId,
    scale,
    offset,
    liveRuler,
    hasCollision,
  ]);

  const selectedPanel = panels.find((p) => p.id === selectedPanelId);

  // Tanlangan panelning FIXED ekran koordinatalarini hisoblash
  // Bu koordinatalar barcha drawerlar va elementlardan ustda turadi (z-index: 9999)
  const [toolbarCoords, setToolbarCoords] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!selectedPanel || !containerRef.current) {
      setToolbarCoords(null);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const panelCenterX = rect.left + offset.x + (selectedPanel.x + selectedPanel.width / 2) * scale;
    const panelTopY = rect.top + offset.y + selectedPanel.y * scale;
    const panelHeightPx = selectedPanel.height * scale;

    // Gorizontal: ekrandan chiqib ketmaslik uchun clamp
    const safeX = Math.max(160, Math.min(window.innerWidth - 160, panelCenterX));

    // Vertikal: agar panel yuqorida bo'lsa panel ostiga, aks holda panel tepasiga qo'yish
    let safeY = panelTopY - 60;
    if (safeY < 75) {
      // Tepa Header tagiga tushib qolmasligi uchun panel tagiga qo'yiladi
      safeY = panelTopY + panelHeightPx + 16;
    }

    // Pastki panel katalogi balandligini hisobga olish (pastki cheklov)
    const bottomSheetLimit = window.innerHeight - 130;
    if (safeY > bottomSheetLimit) {
      safeY = Math.max(80, panelTopY - 60);
    }

    setToolbarCoords({ x: safeX, y: safeY });
  }, [selectedPanel, scale, offset]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-cream-100 flex items-center justify-center cursor-crosshair touch-none"
      onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={(e) => {
        if (e.touches.length === 1) {
          handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 1) {
          handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchEnd={handlePointerUp}
      onWheel={(e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        handleZoom(delta);
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Kompas nishoni */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cream-200 shadow-sm text-xs font-semibold text-navy-800 pointer-events-none">
        <Compass
          className="w-4 h-4 text-amber-500 transition-transform duration-300"
          style={{ transform: `rotate(${roof.azimuth}deg)` }}
        />
        <span>
          {roof.azimuth === 180
            ? 'Janub (180°)'
            : roof.azimuth === 90
            ? 'Sharq (90°)'
            : roof.azimuth === 270
            ? 'G\'arb (270°)'
            : roof.azimuth === 0
            ? 'Shimol (0°)'
            : `${roof.azimuth}°`}
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-navy-700">Qiyalik: {roof.pitch}°</span>
      </div>

      {/* Ogohlantirish xabari */}
      {hasCollision && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-red-600 text-white px-3.5 py-2 rounded-xl shadow-lg text-xs font-bold animate-bounce pointer-events-none">
          <AlertTriangle className="w-4 h-4" />
          <span>Diqqat: Panel tom chegarasidan chiqdi yoki ustma-ust tushdi!</span>
        </div>
      )}

      {/* Jonli Aqlli Chizg'ich paneli (Tepada) */}
      {liveRuler && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 hidden sm:flex items-center gap-3 bg-navy-900/95 text-white backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-medium shadow-md border border-navy-700 pointer-events-none">
          <span>Chapdan: <strong className="text-amber-400">{liveRuler.leftCm} sm</strong></span>
          <span className="text-navy-600">•</span>
          <span>Tepadan: <strong className="text-amber-400">{liveRuler.topCm} sm</strong></span>
          <span className="text-navy-600">•</span>
          <span>O'ngdan: <strong className="text-amber-400">{liveRuler.rightCm} sm</strong></span>
          <span className="text-navy-600">•</span>
          <span>Pastdan: <strong className="text-amber-400">{liveRuler.bottomCm} sm</strong></span>
        </div>
      )}

      {/* CRITICAL FIX: FIXED POSITION FLOATING TOOLBAR (z-index: 9999)
          Hech qachon panellar katalogi ostida qolmaydi, doimo eng yuqori qatlamda! */}
      {selectedPanel && toolbarCoords && (
        <div
          className="fixed z-[9999] flex items-center gap-1.5 sm:gap-2 bg-navy-950/95 text-white backdrop-blur-xl px-3 sm:px-4 py-2 rounded-2xl shadow-[0_15px_45px_rgba(0,0,0,0.6)] border-2 border-amber-400 animate-in fade-in zoom-in-95 pointer-events-auto select-none"
          style={{
            top: `${toolbarCoords.y}px`,
            left: `${toolbarCoords.x}px`,
            transform: 'translateX(-50%)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Panel info */}
          <div className="flex items-center gap-1.5 pr-2.5 border-r border-navy-700 text-xs font-black whitespace-nowrap">
            <span className="text-amber-400 font-mono">{selectedPanel.power}W</span>
            <span className="text-[10px] text-gray-400 font-semibold hidden xs:inline">
              ({selectedPanel.width}×{selectedPanel.height}sm)
            </span>
          </div>

          {/* 90° Aylantirish (Rotate) */}
          <button
            type="button"
            onClick={(e) => handleRotatePanel(selectedPanel.id, e)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 hover:bg-amber-500 text-white hover:text-navy-950 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm whitespace-nowrap"
            title="90 gradusga aylantirish (Portret / Peyzaj)"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400 group-hover:text-navy-950" />
            <span>90° Aylantirish</span>
          </button>

          {/* Nusxa olish (Duplicate) */}
          <button
            type="button"
            onClick={(e) => handleDuplicatePanel(selectedPanel.id, e)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm whitespace-nowrap"
            title="Yana bitta nusxa qo'shish"
          >
            <Copy className="w-3.5 h-3.5 text-gray-300" />
            <span className="hidden sm:inline">Nusxa</span>
          </button>

          {/* O'chirish (Delete) */}
          <button
            type="button"
            onClick={(e) => handleDeletePanel(selectedPanel.id, e)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm whitespace-nowrap"
            title="Panelni o'chirish"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>O'chirish</span>
          </button>
        </div>
      )}

      {/* Zoom va Fit to Screen boshqaruv tugmalari */}
      <div
        className="absolute bottom-28 right-4 z-20 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-cream-200 shadow-md"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => handleZoom(0.15)}
          className="p-2 text-navy-800 hover:bg-cream-100 rounded-xl transition-colors active:scale-95"
          title="Kattalashtirish"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.15)}
          className="p-2 text-navy-800 hover:bg-cream-100 rounded-xl transition-colors active:scale-95"
          title="Kichiklashtirish"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={fitToScreen}
          className="p-2 text-navy-800 hover:bg-cream-100 rounded-xl transition-colors active:scale-95"
          title="Ekranga to'liq moslashtirish"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
