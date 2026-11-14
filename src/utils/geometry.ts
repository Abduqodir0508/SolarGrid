import { PlacedPanel, Roof, RulerMeasurement } from '@/types/solar';

export const MOUNTING_GAP_CM = 2; // Karkas va shamol uchun avtomatik 2 sm masofa
export const ROOF_SAFETY_MARGIN_CM = 20; // Tom chetlaridan tavsiya qilingan 20 sm masofa
export const SNAP_THRESHOLD_CM = 15; // Magnitdek tortishish masofasi (sm)

/**
 * Panel tom ichidami va boshqa panellar bilan to'qnashyaptimi tekshirish
 */
export function validatePanelPlacement(
  panel: PlacedPanel,
  allPanels: PlacedPanel[],
  roof: Roof
): { isValid: boolean; collisionWith: string[]; outOfBounds: boolean } {
  const collisionWith: string[] = [];

  // Tom chegarasidan chiqib ketishni tekshirish
  const outOfBounds =
    panel.x < 0 ||
    panel.y < 0 ||
    panel.x + panel.width > roof.width ||
    panel.y + panel.height > roof.height;

  // Boshqa panellar bilan ustma-ust tushish (AABB collision)
  for (const other of allPanels) {
    if (other.id === panel.id) continue;

    const overlapX =
      panel.x < other.x + other.width &&
      panel.x + panel.width > other.x;
    const overlapY =
      panel.y < other.y + other.height &&
      panel.y + panel.height > other.y;

    if (overlapX && overlapY) {
      collisionWith.push(other.id);
    }
  }

  const isValid = !outOfBounds && collisionWith.length === 0;

  return { isValid, collisionWith, outOfBounds };
}

/**
 * Aqlli Chizg'ich (Smart Ruler):
 * Panelning 4 ta chetidan tomning chegarasigacha bo'lgan masofalarni hisoblash
 */
export function calculateRulerMeasurements(
  panel: PlacedPanel,
  roof: Roof,
  otherPanels: PlacedPanel[] = []
): RulerMeasurement {
  const leftCm = Math.max(0, Math.round(panel.x * 10) / 10);
  const topCm = Math.max(0, Math.round(panel.y * 10) / 10);
  const rightCm = Math.max(0, Math.round((roof.width - (panel.x + panel.width)) * 10) / 10);
  const bottomCm = Math.max(0, Math.round((roof.height - (panel.y + panel.height)) * 10) / 10);

  let nearestNeighbor: RulerMeasurement['nearestNeighbor'] = undefined;
  let minDistance = Infinity;

  for (const other of otherPanels) {
    if (other.id === panel.id) continue;

    // O'ng tomondagi qo'shni
    if (
      other.x >= panel.x + panel.width &&
      Math.abs(other.y - panel.y) < panel.height / 2
    ) {
      const dist = other.x - (panel.x + panel.width);
      if (dist < minDistance) {
        minDistance = dist;
        nearestNeighbor = {
          distanceCm: Math.round(dist * 10) / 10,
          direction: 'right',
          neighborId: other.id,
        };
      }
    }
    // Chap tomondagi qo'shni
    else if (
      other.x + other.width <= panel.x &&
      Math.abs(other.y - panel.y) < panel.height / 2
    ) {
      const dist = panel.x - (other.x + other.width);
      if (dist < minDistance) {
        minDistance = dist;
        nearestNeighbor = {
          distanceCm: Math.round(dist * 10) / 10,
          direction: 'left',
          neighborId: other.id,
        };
      }
    }
    // Pastdagi qo'shni
    else if (
      other.y >= panel.y + panel.height &&
      Math.abs(other.x - panel.x) < panel.width / 2
    ) {
      const dist = other.y - (panel.y + panel.height);
      if (dist < minDistance) {
        minDistance = dist;
        nearestNeighbor = {
          distanceCm: Math.round(dist * 10) / 10,
          direction: 'bottom',
          neighborId: other.id,
        };
      }
    }
    // Tepada qo'shni
    else if (
      other.y + other.height <= panel.y &&
      Math.abs(other.x - panel.x) < panel.width / 2
    ) {
      const dist = panel.y - (other.y + other.height);
      if (dist < minDistance) {
        minDistance = dist;
        nearestNeighbor = {
          distanceCm: Math.round(dist * 10) / 10,
          direction: 'top',
          neighborId: other.id,
        };
      }
    }
  }

  return {
    panelId: panel.id,
    leftCm,
    rightCm,
    topCm,
    bottomCm,
    nearestNeighbor,
  };
}

/**
 * Magnit yopishish (Snap to Neighbor & Snap to Roof Margins)
 * Surilayotgan panel boshqa panelga yoki tom chetiga yaqinlashganda avtomatik tortilib yopishadi
 */
export function applyMagneticSnap(
  targetX: number,
  targetY: number,
  panelWidth: number,
  panelHeight: number,
  otherPanels: PlacedPanel[],
  roof: Roof,
  activePanelId?: string
): { x: number; y: number; snappedX: boolean; snappedY: boolean } {
  let newX = targetX;
  let newY = targetY;
  let snappedX = false;
  let snappedY = false;

  // 1. Tomning xavfsizlik chetlariga snap (chap, o'ng, tepa, past 20 sm)
  if (Math.abs(newX - ROOF_SAFETY_MARGIN_CM) < SNAP_THRESHOLD_CM) {
    newX = ROOF_SAFETY_MARGIN_CM;
    snappedX = true;
  } else if (
    Math.abs(newX + panelWidth - (roof.width - ROOF_SAFETY_MARGIN_CM)) < SNAP_THRESHOLD_CM
  ) {
    newX = roof.width - ROOF_SAFETY_MARGIN_CM - panelWidth;
    snappedX = true;
  }

  if (Math.abs(newY - ROOF_SAFETY_MARGIN_CM) < SNAP_THRESHOLD_CM) {
    newY = ROOF_SAFETY_MARGIN_CM;
    snappedY = true;
  } else if (
    Math.abs(newY + panelHeight - (roof.height - ROOF_SAFETY_MARGIN_CM)) < SNAP_THRESHOLD_CM
  ) {
    newY = roof.height - ROOF_SAFETY_MARGIN_CM - panelHeight;
    snappedY = true;
  }

  // 2. Tomning mutlaq chetlariga snap (0 sm)
  if (!snappedX && Math.abs(newX) < SNAP_THRESHOLD_CM) {
    newX = 0;
    snappedX = true;
  } else if (!snappedX && Math.abs(newX + panelWidth - roof.width) < SNAP_THRESHOLD_CM) {
    newX = roof.width - panelWidth;
    snappedX = true;
  }

  if (!snappedY && Math.abs(newY) < SNAP_THRESHOLD_CM) {
    newY = 0;
    snappedY = true;
  } else if (!snappedY && Math.abs(newY + panelHeight - roof.height) < SNAP_THRESHOLD_CM) {
    newY = roof.height - panelHeight;
    snappedY = true;
  }

  // 3. Boshqa panellarga snap (2 sm montaj oraliq masofasi bilan)
  for (const other of otherPanels) {
    if (other.id === activePanelId) continue;

    // Gorizontal qo'shnichilik:
    // O'ng tomondan yopishish (other o'ngida)
    if (Math.abs(newX - (other.x + other.width + MOUNTING_GAP_CM)) < SNAP_THRESHOLD_CM) {
      newX = other.x + other.width + MOUNTING_GAP_CM;
      snappedX = true;
    }
    // Chap tomondan yopishish (other chapida)
    else if (Math.abs(newX + panelWidth + MOUNTING_GAP_CM - other.x) < SNAP_THRESHOLD_CM) {
      newX = other.x - panelWidth - MOUNTING_GAP_CM;
      snappedX = true;
    }
    // Gorizontal qatorda bir xil X ga tekislash
    else if (Math.abs(newX - other.x) < SNAP_THRESHOLD_CM) {
      newX = other.x;
      snappedX = true;
    }

    // Vertikal qo'shnichilik:
    // Pastdan yopishish (other pastida)
    if (Math.abs(newY - (other.y + other.height + MOUNTING_GAP_CM)) < SNAP_THRESHOLD_CM) {
      newY = other.y + other.height + MOUNTING_GAP_CM;
      snappedY = true;
    }
    // Tepadan yopishish (other tepasida)
    else if (Math.abs(newY + panelHeight + MOUNTING_GAP_CM - other.y) < SNAP_THRESHOLD_CM) {
      newY = other.y - panelHeight - MOUNTING_GAP_CM;
      snappedY = true;
    }
    // Vertikal qatorda bir xil Y ga tekislash
    else if (Math.abs(newY - other.y) < SNAP_THRESHOLD_CM) {
      newY = other.y;
      snappedY = true;
    }
  }

  return {
    x: Math.round(newX * 10) / 10,
    y: Math.round(newY * 10) / 10,
    snappedX,
    snappedY,
  };
}
