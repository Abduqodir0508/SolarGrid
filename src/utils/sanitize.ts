/**
 * XSS va xavfli belgilarni tozalash (Sanitization)
 */
export function sanitizeText(input: string, maxLength: number = 100): string {
  if (typeof input !== 'string') return '';
  // HTML teglarni va skript belgilarni tozalash
  const cleaned = input
    .replace(/[<>'"&;`\\]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case "'": return '&#39;';
        case '"': return '&quot;';
        case '&': return '&amp;';
        case ';': return '';
        case '`': return '';
        case '\\': return '';
        default: return '';
      }
    })
    .trim();

  return cleaned.slice(0, maxLength);
}

/**
 * Raqamli kiritishlarni qat'iy tekshirish va chegaralash (Clamp)
 */
export function validateNumber(
  value: unknown,
  min: number,
  max: number,
  defaultValue: number
): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }
  if (num < min) return min;
  if (num > max) return max;
  return Math.round(num * 100) / 100; // Santimetr/foiz aniqligida yaxlitlash
}

/**
 * Tom o'lchamlarini validatsiya qilish
 * Eni va bo'yi: 100 sm (1m) dan 10,000 sm (100m) gacha
 */
export function validateRoofDimensions(width: number, height: number): { width: number; height: number } {
  return {
    width: validateNumber(width, 100, 10000, 1200),
    height: validateNumber(height, 100, 10000, 800),
  };
}

/**
 * Tom qiyalik burchagini validatsiya qilish (0° dan 60° gacha)
 */
export function validateRoofPitch(pitch: number): number {
  return validateNumber(pitch, 0, 60, 25);
}

/**
 * Kompas azimut burchagini validatsiya qilish (0° dan 360° gacha)
 */
export function validateAzimuth(azimuth: number): number {
  const norm = validateNumber(azimuth, 0, 360, 180);
  return (norm % 360 + 360) % 360;
}
