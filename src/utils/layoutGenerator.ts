import { Roof, SolarPanelSpec, PlacedPanel, AutoLayoutConfig } from '@/types/solar';

/**
 * AI Aqlli Avto-Joylashtirish (Smart Layout Generator)
 * Tom o'lchamlari va oraliqlarni millimetrgacha santimetrda simmetrik hisoblaydi
 */
export function generateSmartLayout(
  roof: Roof,
  spec: SolarPanelSpec,
  config: AutoLayoutConfig
): PlacedPanel[] {
  const rotation = config.rotation;
  const panelW = rotation === 0 ? spec.width : spec.height;
  const panelH = rotation === 0 ? spec.height : spec.width;
  const spacing = config.spacingCm || 2;
  const margin = config.marginCm || 20;

  // Foydalanish mumkin bo'lgan maksimal maydon
  const availW = Math.max(0, roof.width - 2 * margin);
  const availH = Math.max(0, roof.height - 2 * margin);

  // Maksimal sig'adigan ustunlar va qatorlar
  const maxCols = Math.max(0, Math.floor((availW + spacing) / (panelW + spacing)));
  const maxRows = Math.max(0, Math.floor((availH + spacing) / (panelH + spacing)));

  if (maxCols === 0 || maxRows === 0) {
    return []; // Tom juda kichik
  }

  let cols = 0;
  let rows = 0;
  let targetTotal = config.targetCount;

  switch (config.mode) {
    case 'center_row': {
      rows = 1;
      cols = targetTotal ? Math.min(targetTotal, maxCols) : maxCols;
      break;
    }

    case 'center_grid': {
      if (targetTotal && targetTotal > 0) {
        // Maqsadli songa mos keluvchi eng simmetrik qator va ustunlarni topish
        let bestCols = 1;
        let bestRows = 1;
        let minDiff = Infinity;

        for (let r = 1; r <= maxRows; r++) {
          const c = Math.ceil(targetTotal / r);
          if (c <= maxCols) {
            const diff = Math.abs(c - r);
            if (diff < minDiff) {
              minDiff = diff;
              bestCols = c;
              bestRows = r;
            }
          }
        }
        cols = bestCols;
        rows = bestRows;
      } else {
        // Standart 2x2 yoki 2x3
        cols = Math.min(2, maxCols);
        rows = Math.min(2, maxRows);
      }
      break;
    }

    case 'top_aligned': {
      if (targetTotal && targetTotal > 0) {
        cols = Math.min(targetTotal, maxCols);
        rows = Math.ceil(targetTotal / cols);
        rows = Math.min(rows, maxRows);
      } else {
        cols = maxCols;
        rows = maxRows;
      }
      break;
    }

    case 'max_fit':
    default: {
      if (targetTotal && targetTotal > 0) {
        cols = maxCols;
        rows = Math.min(Math.ceil(targetTotal / maxCols), maxRows);
      } else {
        cols = maxCols;
        rows = maxRows;
      }
      break;
    }
  }

  if (cols === 0 || rows === 0) return [];

  // Blokning umumiy o'lchamlari
  const totalBlockW = cols * panelW + (cols - 1) * spacing;
  const totalBlockH = rows * panelH + (rows - 1) * spacing;

  // Boshlang'ich koordinatalar
  // Gorizontal markazlashtirish
  const startX = Math.max(margin, Math.round(((roof.width - totalBlockW) / 2) * 10) / 10);
  
  // Vertikal joylashuv: top_aligned bo'lsa tepadan 'margin', aks holda markazda
  const startY = config.mode === 'top_aligned'
    ? margin
    : Math.max(margin, Math.round(((roof.height - totalBlockH) / 2) * 10) / 10);

  const panels: PlacedPanel[] = [];
  let count = 0;
  const maxLimit = targetTotal && targetTotal > 0 ? targetTotal : cols * rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (count >= maxLimit) break;

      const posX = Math.round((startX + c * (panelW + spacing)) * 10) / 10;
      const posY = Math.round((startY + r * (panelH + spacing)) * 10) / 10;

      panels.push({
        id: `panel-${Date.now()}-${r}-${c}-${Math.random().toString(36).substr(2, 4)}`,
        specId: spec.id,
        x: posX,
        y: posY,
        rotation,
        width: panelW,
        height: panelH,
        power: spec.power,
        label: `${spec.model} #${count + 1}`,
        isValid: true,
      });

      count++;
    }
  }

  return panels;
}
