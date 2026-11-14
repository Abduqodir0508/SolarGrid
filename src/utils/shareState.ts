import { ProjectData, Roof, PlacedPanel, FinancialSettings } from '@/types/solar';
import { sanitizeText, validateRoofDimensions, validateRoofPitch, validateAzimuth } from './sanitize';
import { DEFAULT_FINANCIAL_SETTINGS } from '@/constants/solarPanels';

const STORAGE_PROJECTS_KEY = 'solargrid_projects_workspace_v1';
const STORAGE_ACTIVE_ID_KEY = 'solargrid_active_project_id';
const LEGACY_STORAGE_KEY = 'solargrid_current_project';

/**
 * Standart yangi loyiha shabloni
 * isEmpty=true bo'lsa, tom mutlaqo bo'sh (0 ta panel bilan) toza ochiladi
 */
export function createDefaultProject(
  name: string = 'Yangi Loyiha',
  clientName: string = 'Mijoz',
  address: string = '',
  isEmpty: boolean = true
): ProjectData {
  const id = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  return {
    id,
    version: '1.0',
    projectName: sanitizeText(name, 60),
    clientName: sanitizeText(clientName, 50),
    clientPhone: '',
    address: sanitizeText(address, 100),
    roof: {
      width: 1200,
      height: 800,
      pitch: 32,
      azimuth: 180,
      material: 'metal_sheet',
    },
    // Foydalanuvchi yangi papka / loyiha ochganda tom mutlaqo bo'sh bo'ladi!
    panels: isEmpty ? [] : [
      {
        id: `p1-${Date.now()}`,
        specId: 'longi-himo6-550',
        x: 370,
        y: 280,
        rotation: 0,
        width: 113.4,
        height: 227.8,
        power: 550,
        label: 'LONGi #1',
        isValid: true,
      },
      {
        id: `p2-${Date.now()}`,
        specId: 'longi-himo6-550',
        x: 485.4,
        y: 280,
        rotation: 0,
        width: 113.4,
        height: 227.8,
        power: 550,
        label: 'LONGi #2',
        isValid: true,
      },
    ],
    financialSettings: { ...DEFAULT_FINANCIAL_SETTINGS },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Barcha saqlangan loyihalarni o'qish (Excel/Word papkalar tizimidek)
 */
export function getAllProjects(): ProjectData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }

    // Agar eski bitta loyiha bo'lsa, uni yangi tizimga ko'chirish (migration)
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      const migrated: ProjectData = {
        ...legacy,
        id: legacy.id || `proj-migrated-${Date.now()}`,
        address: legacy.address || '',
        updatedAt: legacy.updatedAt || new Date().toISOString(),
      };
      saveAllProjects([migrated]);
      setActiveProjectId(migrated.id);
      return [migrated];
    }

    // Yangi bo'lsa standart loyiha yaratish
    const def = createDefaultProject('Qo\'yliq 6-massiv, 5-dom', 'Alisher aka', 'Qo\'yliq 6-massiv, 5-dom');
    saveAllProjects([def]);
    setActiveProjectId(def.id);
    return [def];
  } catch (err) {
    console.error('Loyihalar ro\'yxatini o\'qishda xatolik:', err);
    return [];
  }
}

/**
 * Barcha loyihalarni saqlash
 */
export function saveAllProjects(projects: ProjectData[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    return true;
  } catch (err) {
    console.error('Loyihalarni saqlashda xatolik:', err);
    return false;
  }
}

/**
 * Joriy faol loyiha ID sini olish
 */
export function getActiveProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
}

/**
 * Joriy faol loyiha ID sini o'rnatish
 */
export function setActiveProjectId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_ACTIVE_ID_KEY, id);
}

/**
 * Bitta loyihani yangilash yoki saqlash
 */
export function saveSingleProject(project: ProjectData): boolean {
  try {
    const list = getAllProjects();
    const index = list.findIndex((p) => p.id === project.id);
    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString(),
    };

    let newList: ProjectData[];
    if (index >= 0) {
      newList = [...list];
      newList[index] = updatedProject;
    } else {
      newList = [updatedProject, ...list];
    }

    saveAllProjects(newList);
    setActiveProjectId(project.id);
    return true;
  } catch (err) {
    console.error('Loyiha saqlashda xatolik:', err);
    return false;
  }
}

/**
 * Loyihani o'chirish
 */
export function deleteProjectById(id: string): { remaining: ProjectData[]; nextActive: ProjectData | null } {
  const list = getAllProjects();
  const filtered = list.filter((p) => p.id !== id);

  if (filtered.length === 0) {
    const newDef = createDefaultProject('Yangi Loyiha #1');
    saveAllProjects([newDef]);
    setActiveProjectId(newDef.id);
    return { remaining: [newDef], nextActive: newDef };
  }

  saveAllProjects(filtered);
  const nextActive = filtered[0];
  setActiveProjectId(nextActive.id);
  return { remaining: filtered, nextActive };
}

/**
 * Loyihani nusxalash (Duplicate)
 */
export function duplicateProjectById(id: string): ProjectData | null {
  const list = getAllProjects();
  const target = list.find((p) => p.id === id);
  if (!target) return null;

  const clone: ProjectData = {
    ...target,
    id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    projectName: `${target.projectName} (Nusxa)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    panels: target.panels.map((p) => ({
      ...p,
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    })),
  };

  const updatedList = [clone, ...list];
  saveAllProjects(updatedList);
  setActiveProjectId(clone.id);
  return clone;
}

/**
 * Loyiha obyektini xavfsiz URL Base64 formatga o'tkazish
 */
export function encodeProjectToUrl(project: ProjectData): string {
  try {
    const compactData = {
      id: project.id,
      v: project.version,
      n: sanitizeText(project.projectName, 60),
      c: sanitizeText(project.clientName, 50),
      p: sanitizeText(project.clientPhone || '', 20),
      a: sanitizeText(project.address || '', 100),
      r: {
        w: project.roof.width,
        h: project.roof.height,
        p: project.roof.pitch,
        a: project.roof.azimuth,
      },
      pnl: project.panels.map((p) => ({
        id: p.id,
        sId: p.specId,
        x: p.x,
        y: p.y,
        r: p.rotation,
        w: p.width,
        h: p.height,
        pw: p.power,
      })),
      f: project.financialSettings,
    };

    const jsonStr = JSON.stringify(compactData);
    const base64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.hash = `share=${base64}`;
      return url.toString();
    }
    return `#share=${base64}`;
  } catch (err) {
    console.error('URL kodlashda xatolik:', err);
    return '';
  }
}

/**
 * URL Hash fragmentidan loyihani tiklash
 */
export function decodeProjectFromUrl(): Partial<ProjectData> | null {
  if (typeof window === 'undefined') return null;

  try {
    const hash = window.location.hash;
    if (!hash || !hash.includes('share=')) return null;

    const base64 = hash.split('share=')[1];
    if (!base64) return null;

    const jsonStr = decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    const raw = JSON.parse(jsonStr);

    const roofDims = validateRoofDimensions(raw.r?.w, raw.r?.h);
    const roof: Roof = {
      width: roofDims.width,
      height: roofDims.height,
      pitch: validateRoofPitch(raw.r?.p),
      azimuth: validateAzimuth(raw.r?.a),
    };

    const panels: PlacedPanel[] = Array.isArray(raw.pnl)
      ? raw.pnl.map((p: any, idx: number) => ({
          id: p.id || `restored-p-${idx}`,
          specId: p.sId || 'longi-himo6-550',
          x: Number(p.x) || 0,
          y: Number(p.y) || 0,
          rotation: (p.r === 90 ? 90 : 0) as 0 | 90,
          width: Number(p.w) || 113.4,
          height: Number(p.h) || 227.8,
          power: Number(p.pw) || 550,
          isValid: true,
        }))
      : [];

    return {
      id: raw.id || `proj-url-${Date.now()}`,
      version: '1.0',
      projectName: sanitizeText(raw.n || 'Quyosh Loyihasi', 60),
      clientName: sanitizeText(raw.c || 'Mijoz', 50),
      clientPhone: sanitizeText(raw.p || '', 20),
      address: sanitizeText(raw.a || '', 100),
      roof,
      panels,
      financialSettings: {
        electricityPricePerKwh: raw.f?.electricityPricePerKwh || DEFAULT_FINANCIAL_SETTINGS.electricityPricePerKwh,
        systemCostPerWatt: raw.f?.systemCostPerWatt || DEFAULT_FINANCIAL_SETTINGS.systemCostPerWatt,
        solarHoursDaily: raw.f?.solarHoursDaily || DEFAULT_FINANCIAL_SETTINGS.solarHoursDaily,
      },
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('URL dan loyihani yuklashda xatolik:', err);
    return null;
  }
}
