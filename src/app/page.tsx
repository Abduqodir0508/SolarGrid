'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ProjectData,
  Roof,
  PlacedPanel,
  SolarPanelSpec,
  SimulationState,
  FinancialSettings,
} from '@/types/solar';
import { DEFAULT_SOLAR_PANELS, DEFAULT_FINANCIAL_SETTINGS } from '@/constants/solarPanels';
import {
  getAllProjects,
  saveSingleProject,
  deleteProjectById,
  duplicateProjectById,
  createDefaultProject,
  getActiveProjectId,
  setActiveProjectId,
  encodeProjectToUrl,
  decodeProjectFromUrl,
} from '@/utils/shareState';
import {
  supabase,
  getUserProStatus,
  getUserProDetails,
  ProDetails,
  syncProjectsToCloud,
  fetchProjectsFromCloud,
  getStoredUserSession,
  saveStoredUserSession,
  clearStoredUserSession,
} from '@/lib/supabase';
import { calculateProjectMetrics } from '@/utils/solarCalc';
import { sanitizeText } from '@/utils/sanitize';
import { calculateNextPanelPlacement, validatePanelPlacement } from '@/utils/geometry';
import { AlertTriangle } from 'lucide-react';

import { Header } from '@/components/Header';
import { Canvas2D } from '@/components/Canvas2D';
import { Viewport3D } from '@/components/Viewport3D';
import { RoofConfigDrawer } from '@/components/RoofConfigDrawer';
import { PanelCatalogSheet } from '@/components/PanelCatalogSheet';
import { SmartLayoutModal } from '@/components/SmartLayoutModal';
import { EstimateModal } from '@/components/EstimateModal';
import { ProjectsManagerModal } from '@/components/ProjectsManagerModal';
import { PricingModal } from '@/components/PricingModal';
import { AuthModal } from '@/components/AuthModal';
import { ProfileSettingsModal } from '@/components/ProfileSettingsModal';

export default function SolarGridApp() {
  // 1. Supabase Auth va PRO holatlari (Sessiyani F5 / Refresh da zudlik bilan tiklash)
  const [currentUser, setCurrentUser] = useState<any>(() => getStoredUserSession());
  const [isPro, setIsPro] = useState<boolean>(false);
  const [proDetails, setProDetails] = useState<ProDetails | null>(null);
  const [proAlertBanner, setProAlertBanner] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalNotice, setAuthModalNotice] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);

  // PRO statusini va muddatini tekshirish
  const refreshPro = useCallback(async (uid?: string) => {
    if (!uid) {
      setIsPro(false);
      setProDetails(null);
      setProAlertBanner(null);
      return;
    }
    const details = await getUserProDetails(uid);
    setIsPro(details.isPro);
    setProDetails(details);
    if (details.isExpired) {
      setProAlertBanner("⚠️ Sizning PRO obuna muddatingiz tugadi. Standart rejimga o'tildi.");
    } else if (details.isExpiringSoon) {
      setProAlertBanner(`⚠️ Diqqat: PRO obunangiz tugashiga ${details.daysRemaining} kun qoldi!`);
    } else {
      setProAlertBanner(null);
    }
  }, []);

  // 2. Ko'p loyihali tizim holatlari
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [activeProjectIdState, setActiveProjectIdState] = useState<string>('');
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // Joriy faol loyiha
  const [currentProject, setCurrentProject] = useState<ProjectData>(() =>
    createDefaultProject('Qo\'yliq 6-massiv, 5-dom', 'Alisher aka', 'Qo\'yliq 6-massiv, 5-dom', false)
  );

  const [customPanels, setCustomPanels] = useState<SolarPanelSpec[]>([]);

  // 3. Ko'rinish va Simulyatsiya
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [simulation, setSimulation] = useState<SimulationState>({
    time: 13.0,
    season: 'summer',
  });

  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

  // Modallar
  const [isRoofConfigOpen, setIsRoofConfigOpen] = useState<boolean>(false);
  const [isSmartLayoutOpen, setIsSmartLayoutOpen] = useState<boolean>(false);
  const [isEstimateOpen, setIsEstimateOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // 4. Supabase seansini yuklash va kuzatish (Cookie & JWT session)
  useEffect(() => {
    // A) Dastlab keshdagi foydalanuvchini tiklash (F5 / Refresh uchun)
    const cachedUser = getStoredUserSession();
    if (cachedUser?.id) {
      setCurrentUser(cachedUser);
      refreshPro(cachedUser.id);
    }

    // B) Supabase server sessiyasini sinxronlash
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user || null;
      setCurrentUser(user);
      saveStoredUserSession(user);

      if (user) {
        refreshPro(user.id);
        // Bulutdan loyihalarni sinxronlash
        fetchProjectsFromCloud(user.id).then((cloudProjects) => {
          if (cloudProjects && cloudProjects.length > 0) {
            setProjects(cloudProjects);
            setCurrentProject(cloudProjects[0]);
            setActiveProjectIdState(cloudProjects[0].id);
          }
        });
      } else {
        refreshPro();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setCurrentUser(user);
      saveStoredUserSession(user);

      if (user) {
        refreshPro(user.id);
      } else {
        refreshPro();
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshPro]);

  // 5. Dastlabki yuklanish (URL Hash yoki LocalStorage)
  useEffect(() => {
    const sharedProject = decodeProjectFromUrl();
    if (sharedProject && sharedProject.roof && sharedProject.panels) {
      const fullProject: ProjectData = {
        id: sharedProject.id || `proj-url-${Date.now()}`,
        version: '1.0',
        projectName: sharedProject.projectName || 'Ulashilgan Loyiha',
        clientName: sharedProject.clientName || 'Mijoz',
        clientPhone: sharedProject.clientPhone || '',
        address: sharedProject.address || '',
        roof: sharedProject.roof,
        panels: sharedProject.panels,
        financialSettings: sharedProject.financialSettings || DEFAULT_FINANCIAL_SETTINGS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveSingleProject(fullProject);
      setCurrentProject(fullProject);
      setActiveProjectIdState(fullProject.id);
      setProjects(getAllProjects());
      return;
    }

    const all = getAllProjects();
    setProjects(all);

    const savedActiveId = getActiveProjectId();
    let initialProject = all.find((p) => p.id === savedActiveId);

    if (!initialProject && all.length > 0) {
      initialProject = all[0];
    } else if (!initialProject) {
      initialProject = createDefaultProject('Yangi Obyekt', 'Mijoz', '', true);
      saveSingleProject(initialProject);
    }

    setCurrentProject(initialProject);
    setActiveProjectIdState(initialProject.id);
  }, []);

  // 6. Loyiha o'zgarganda avtomatik saqlash (Auto-save)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateCurrentProject = useCallback(
    (updater: (prev: ProjectData) => ProjectData) => {
      setCurrentProject((prev) => {
        const next = updater(prev);
        setIsSaved(false);

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          saveSingleProject(next);
          const all = getAllProjects();
          setProjects(all);
          setIsSaved(true);

          // Agar foydalanuvchi tizimga kirgan bo'lsa, bulutga ham saqlash
          if (currentUser?.id) {
            syncProjectsToCloud(currentUser.id, all);
          }
        }, 300);

        return next;
      });
    },
    [currentUser?.id]
  );

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentProject) {
        saveSingleProject(currentProject);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentProject]);

  // 7. Loyihalar papkasi bilan ishlash
  const handleSelectProject = (id: string) => {
    saveSingleProject(currentProject);

    const all = getAllProjects();
    const target = all.find((p) => p.id === id);
    if (target) {
      setCurrentProject(target);
      setActiveProjectIdState(target.id);
      setActiveProjectId(target.id);
      setSelectedPanelId(null);
      setIsSaved(true);
    }
  };

  // YANGI PAPKA / LOYIHA OCHGANDA: TOM MUTLAQO BO'SH (0 TA PANEL) BO'LADI!
  const handleCreateProject = (name: string, clientName: string, address: string) => {
    saveSingleProject(currentProject);

    // isEmpty = true beriladi -> panels: [] bo'm-bo'sh toza ochiladi!
    const newProj = createDefaultProject(name, clientName, address, true);
    saveSingleProject(newProj);

    const updatedList = getAllProjects();
    setProjects(updatedList);
    setCurrentProject(newProj);
    setActiveProjectIdState(newProj.id);
    setActiveProjectId(newProj.id);
    setSelectedPanelId(null);
    setIsSaved(true);

    if (currentUser?.id) {
      syncProjectsToCloud(currentUser.id, updatedList);
    }
  };

  const handleDeleteProject = (id: string) => {
    const { remaining, nextActive } = deleteProjectById(id);
    setProjects(remaining);

    if (id === activeProjectIdState && nextActive) {
      setCurrentProject(nextActive);
      setActiveProjectIdState(nextActive.id);
      setSelectedPanelId(null);
    }

    if (currentUser?.id) {
      syncProjectsToCloud(currentUser.id, remaining);
    }
  };

  const handleDuplicateProject = (id: string) => {
    const clone = duplicateProjectById(id);
    if (clone) {
      const list = getAllProjects();
      setProjects(list);
      setCurrentProject(clone);
      setActiveProjectIdState(clone.id);
      setSelectedPanelId(null);

      if (currentUser?.id) {
        syncProjectsToCloud(currentUser.id, list);
      }
    }
  };

  const handleProjectNameChange = (name: string) => {
    updateCurrentProject((prev) => ({
      ...prev,
      projectName: sanitizeText(name, 60),
    }));
  };

  const handleRoofChange = (newRoof: Roof) => {
    updateCurrentProject((prev) => {
      // Tom o'lchamlari o'zgarganda panellarning tom ichida qolishini ta'minlash (Clamp)
      const adjustedPanels = prev.panels.map((p) => {
        const maxX = Math.max(0, newRoof.width - p.width);
        const maxY = Math.max(0, newRoof.height - p.height);
        const clampedX = Math.round(Math.min(Math.max(0, p.x), maxX) * 10) / 10;
        const clampedY = Math.round(Math.min(Math.max(0, p.y), maxY) * 10) / 10;
        const candidate = { ...p, x: clampedX, y: clampedY };
        const { isValid, collisionWith } = validatePanelPlacement(candidate, prev.panels, newRoof);
        return { ...candidate, isValid, collisionWith };
      });

      return {
        ...prev,
        roof: newRoof,
        panels: adjustedPanels,
      };
    });
  };

  const handlePanelsChange = (newPanels: PlacedPanel[]) => {
    updateCurrentProject((prev) => ({
      ...prev,
      panels: newPanels,
    }));
  };

  const handleAddPanel = (spec: SolarPanelSpec) => {
    // Aqlli koordinata hisoblagich: tomning tepa/markazidan boshlab tartibli joylashtiradi
    const { x, y } = calculateNextPanelPlacement(
      spec,
      currentProject.panels,
      currentProject.roof
    );

    const newPanel: PlacedPanel = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      specId: spec.id,
      x,
      y,
      rotation: 0,
      width: spec.width,
      height: spec.height,
      power: spec.power,
      label: `${spec.model} #${currentProject.panels.length + 1}`,
      isValid: true,
    };

    updateCurrentProject((prev) => ({
      ...prev,
      panels: [...prev.panels, newPanel],
    }));
    setSelectedPanelId(newPanel.id);
  };

  const handleAddCustomSpec = (spec: SolarPanelSpec) => {
    setCustomPanels((prev) => [...prev, spec]);
  };

  const handleClearPanels = () => {
    if (currentProject.panels.length === 0) return;
    if (window.confirm('Ushbu loyihadagi barcha panellarni olib tashlashni xohlaysizmi?')) {
      updateCurrentProject((prev) => ({
        ...prev,
        panels: [],
      }));
      setSelectedPanelId(null);
    }
  };

  const handleApplySmartLayout = (newPanels: PlacedPanel[]) => {
    updateCurrentProject((prev) => ({
      ...prev,
      panels: newPanels,
    }));
    setSelectedPanelId(null);
  };

  const handleUpdateClientInfo = (name: string, phone: string) => {
    updateCurrentProject((prev) => ({
      ...prev,
      clientName: sanitizeText(name, 50),
      clientPhone: sanitizeText(phone, 20),
    }));
  };

  const handleShare = () => {
    saveSingleProject(currentProject);
    const shareUrl = encodeProjectToUrl(currentProject);
    if (shareUrl && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      });
    }
  };

  // --- AUTH HIMOYASI (GUARDS) VA PROFIL BOSHQARUVI ---

  // Guard: Akkauntga kirmasdan turib PRO sotib ololmaydi
  const handleOpenPricing = () => {
    if (!currentUser) {
      setAuthModalNotice('PRO tarifni faollashtirish uchun avval tizimga kiring yoki ro\'yxatdan o\'ting!');
      setIsAuthModalOpen(true);
      return;
    }
    setAuthModalNotice(null);
    refreshPro(currentUser.id);
    setIsPricingModalOpen(true);
  };

  // Guard: Akkauntga kirmasdan turib loyihalar papkasini ocholmaydi
  const handleOpenProjects = () => {
    if (!currentUser) {
      setAuthModalNotice('Loyihalaringizni xavfsiz saqlash va papkalar yaratish uchun avval tizimga kiring!');
      setIsAuthModalOpen(true);
      return;
    }
    setAuthModalNotice(null);
    setIsProjectsModalOpen(true);
  };

  // Akkauntdan xavfsiz chiqish
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearStoredUserSession();
    setCurrentUser(null);
    refreshPro();
    setIsProfileModalOpen(false);
    setIsAuthModalOpen(false);
  };

  // Profil sozlamalari yangilanganda
  const handleUpdateUser = (updatedUser: any) => {
    setCurrentUser(updatedUser);
    saveStoredUserSession(updatedUser);
    if (updatedUser?.id) {
      refreshPro(updatedUser.id);
    }
  };

  const metrics = calculateProjectMetrics(
    currentProject.roof,
    currentProject.panels,
    currentProject.financialSettings
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-cream-100 dark:bg-navy-950 text-navy-900 dark:text-cream-100 select-none transition-colors">
      
      {/* 1. Yuqori Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        projectName={currentProject.projectName}
        onProjectNameChange={handleProjectNameChange}
        onOpenProjects={handleOpenProjects}
        onOpenPricing={handleOpenPricing}
        onOpenAuth={() => {
          setAuthModalNotice(null);
          setIsAuthModalOpen(true);
        }}
        onOpenProfileSettings={() => setIsProfileModalOpen(true)}
        onOpenSmartLayout={() => {
          if (!isPro) {
            handleOpenPricing();
          } else {
            setIsSmartLayoutOpen(true);
          }
        }}
        onOpenRoofConfig={() => setIsRoofConfigOpen(true)}
        onOpenEstimate={() => setIsEstimateOpen(true)}
        onShare={handleShare}
        onReset={handleClearPanels}
        panelsCount={currentProject.panels.length}
        totalCapacityKw={metrics.totalCapacityKw}
        isCopied={isCopied}
        isSaved={isSaved}
        isPro={isPro}
        currentUser={currentUser}
      />

      {/* PRO Muddat Tugashi / Tugash Arafasi Bildirishnomasi */}
      {proAlertBanner && (
        <div className="bg-amber-500/15 dark:bg-amber-950/60 border-b border-amber-300 dark:border-amber-700/60 px-4 py-2 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 z-30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold">{proAlertBanner}</span>
          </div>
          <button
            type="button"
            onClick={handleOpenPricing}
            className="font-bold underline text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-white text-xs ml-3 whitespace-nowrap"
          >
            Bot orqali yangilash →
          </button>
        </div>
      )}

      {/* 2. Asosiy Chizma / Simulyatsiya Maydoni */}
      <main className="flex-1 relative w-full h-[calc(100vh-61px)] overflow-hidden">
        {viewMode === '2d' ? (
          <Canvas2D
            roof={currentProject.roof}
            panels={currentProject.panels}
            onPanelsChange={handlePanelsChange}
            selectedPanelId={selectedPanelId}
            onSelectPanel={setSelectedPanelId}
          />
        ) : (
          <Viewport3D
            roof={currentProject.roof}
            panels={currentProject.panels}
            simulation={simulation}
            onSimulationChange={setSimulation}
          />
        )}
      </main>

      {/* 3. Pastki Panellar Katalogi (Mobile-First Bottom Sheet) */}
      <PanelCatalogSheet
        roof={currentProject.roof}
        panels={currentProject.panels}
        onAddPanel={handleAddPanel}
        onOpenSmartLayout={() => {
          if (!isPro) {
            setIsPricingModalOpen(true);
          } else {
            setIsSmartLayoutOpen(true);
          }
        }}
        onClearPanels={handleClearPanels}
        customPanels={customPanels}
        onAddCustomSpec={handleAddCustomSpec}
      />

      {/* 4. Loyihalar Papkasi Modali */}
      <ProjectsManagerModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={projects}
        activeProjectId={activeProjectIdState}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
        isPro={isPro}
        onOpenPricing={() => setIsPricingModalOpen(true)}
      />

      {/* 5. Tariflar va PRO Sotib olish Modali */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        isPro={isPro}
        proDetails={proDetails}
        onProActivated={() => {
          if (currentUser?.id) refreshPro(currentUser.id);
        }}
        userId={currentUser?.id}
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthModalNotice('PRO tarifni faollashtirish uchun avval tizimga kiring!');
          setIsAuthModalOpen(true);
        }}
      />

      {/* 6. Registratsiya va Login Modali (Supabase Auth) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthModalNotice(null);
        }}
        currentUser={currentUser}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          saveStoredUserSession(user);
          if (user) {
            refreshPro(user.id);
          } else {
            refreshPro();
          }
        }}
        onOpenPricing={handleOpenPricing}
        isPro={isPro}
        notice={authModalNotice}
      />

      {/* 7. Profil Sozlamalari Modali (Ism, Avatar, Chiqish) */}
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        isPro={isPro}
        onUpdateUser={handleUpdateUser}
        onSignOut={handleSignOut}
        onOpenPricing={handleOpenPricing}
      />

      {/* 7. Tom Sozlamalari Modali */}
      <RoofConfigDrawer
        isOpen={isRoofConfigOpen}
        onClose={() => setIsRoofConfigOpen(false)}
        roof={currentProject.roof}
        onRoofChange={handleRoofChange}
      />

      {/* 8. AI Optimal Joylashtirish Modali */}
      <SmartLayoutModal
        isOpen={isSmartLayoutOpen}
        onClose={() => setIsSmartLayoutOpen(false)}
        roof={currentProject.roof}
        customPanels={customPanels}
        onApplyLayout={handleApplySmartLayout}
      />

      {/* 9. Tayyor Smeta va Usta Montaj Chizmasi (Print / PDF) */}
      <EstimateModal
        isOpen={isEstimateOpen}
        onClose={() => setIsEstimateOpen(false)}
        project={currentProject}
        onUpdateClientInfo={handleUpdateClientInfo}
      />

    </div>
  );
}
