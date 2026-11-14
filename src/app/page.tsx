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
import { calculateProjectMetrics } from '@/utils/solarCalc';
import { sanitizeText } from '@/utils/sanitize';

import { Header } from '@/components/Header';
import { Canvas2D } from '@/components/Canvas2D';
import { Viewport3D } from '@/components/Viewport3D';
import { RoofConfigDrawer } from '@/components/RoofConfigDrawer';
import { PanelCatalogSheet } from '@/components/PanelCatalogSheet';
import { SmartLayoutModal } from '@/components/SmartLayoutModal';
import { EstimateModal } from '@/components/EstimateModal';
import { ProjectsManagerModal } from '@/components/ProjectsManagerModal';

export default function SolarGridApp() {
  // 1. Ko'p loyihali tizim holatlari
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [activeProjectIdState, setActiveProjectIdState] = useState<string>('');
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // Joriy faol loyiha parametrlari
  const [currentProject, setCurrentProject] = useState<ProjectData>(() =>
    createDefaultProject('Qo\'yliq 6-massiv, 5-dom', 'Alisher aka', 'Qo\'yliq 6-massiv, 5-dom')
  );

  const [customPanels, setCustomPanels] = useState<SolarPanelSpec[]>([]);

  // 2. Ko'rinish va Simulyatsiya
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

  // 3. Dastlabki yuklanish (URL Hash yoki LocalStorage Workspace)
  useEffect(() => {
    // 1-navbatda URL link tekshiriladi
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

    // 2-navbatda LocalStorage Workspace yuklanadi
    const all = getAllProjects();
    setProjects(all);

    const savedActiveId = getActiveProjectId();
    let initialProject = all.find((p) => p.id === savedActiveId);

    if (!initialProject && all.length > 0) {
      initialProject = all[0];
    } else if (!initialProject) {
      initialProject = createDefaultProject();
      saveSingleProject(initialProject);
    }

    setCurrentProject(initialProject);
    setActiveProjectIdState(initialProject.id);
  }, []);

  // 4. Loyiha o'zgarganda avtomatik saqlash (Auto-save)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateCurrentProject = useCallback(
    (updater: (prev: ProjectData) => ProjectData) => {
      setCurrentProject((prev) => {
        const next = updater(prev);
        setIsSaved(false);

        // Debounced saqlash
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          saveSingleProject(next);
          setProjects(getAllProjects());
          setIsSaved(true);
        }, 300);

        return next;
      });
    },
    []
  );

  // Brauzer yopilishida yoki yangilanishida ma'lumotlarni saqlash
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentProject) {
        saveSingleProject(currentProject);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentProject]);

  // 5. Loyihalar papkasi bilan ishlash
  // A) Boshqa loyihani ochish
  const handleSelectProject = (id: string) => {
    // Avval hozirgisini saqlaymiz
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

  // B) Yangi loyiha yaratish
  const handleCreateProject = (name: string, clientName: string, address: string) => {
    saveSingleProject(currentProject);

    const newProj = createDefaultProject(name, clientName, address);
    saveSingleProject(newProj);

    const updatedList = getAllProjects();
    setProjects(updatedList);
    setCurrentProject(newProj);
    setActiveProjectIdState(newProj.id);
    setActiveProjectId(newProj.id);
    setSelectedPanelId(null);
    setIsSaved(true);
  };

  // C) Loyihani o'chirish
  const handleDeleteProject = (id: string) => {
    const { remaining, nextActive } = deleteProjectById(id);
    setProjects(remaining);

    if (id === activeProjectIdState && nextActive) {
      setCurrentProject(nextActive);
      setActiveProjectIdState(nextActive.id);
      setSelectedPanelId(null);
    }
  };

  // D) Loyihani nusxalash (Duplicate)
  const handleDuplicateProject = (id: string) => {
    const clone = duplicateProjectById(id);
    if (clone) {
      setProjects(getAllProjects());
      setCurrentProject(clone);
      setActiveProjectIdState(clone.id);
      setSelectedPanelId(null);
    }
  };

  // 6. Loyiha nomini o'zgartirish
  const handleProjectNameChange = (name: string) => {
    updateCurrentProject((prev) => ({
      ...prev,
      projectName: sanitizeText(name, 60),
    }));
  };

  // 7. Tom o'lchamlarini yangilash
  const handleRoofChange = (newRoof: Roof) => {
    updateCurrentProject((prev) => ({
      ...prev,
      roof: newRoof,
    }));
  };

  // 8. Panellarni yangilash
  const handlePanelsChange = (newPanels: PlacedPanel[]) => {
    updateCurrentProject((prev) => ({
      ...prev,
      panels: newPanels,
    }));
  };

  // 9. Katalogdan panel qo'shish
  const handleAddPanel = (spec: SolarPanelSpec) => {
    const newW = spec.width;
    const newH = spec.height;

    let startX = Math.round((currentProject.roof.width - newW) / 2);
    let startY = Math.round((currentProject.roof.height - newH) / 2);

    if (currentProject.panels.length > 0) {
      const last = currentProject.panels[currentProject.panels.length - 1];
      if (last.x + last.width + 2 + newW <= currentProject.roof.width) {
        startX = last.x + last.width + 2;
        startY = last.y;
      } else if (last.y + last.height + 2 + newH <= currentProject.roof.height) {
        startX = Math.max(20, (currentProject.roof.width - newW) / 2);
        startY = last.y + last.height + 2;
      }
    }

    const newPanel: PlacedPanel = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      specId: spec.id,
      x: startX,
      y: startY,
      rotation: 0,
      width: newW,
      height: newH,
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

  // 10. Maxsus panel turini qo'shish
  const handleAddCustomSpec = (spec: SolarPanelSpec) => {
    setCustomPanels((prev) => [...prev, spec]);
  };

  // 11. Barcha panellarni tozalash (tasdiqlash bilan)
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

  // 12. AI Avto-joylashtirish
  const handleApplySmartLayout = (newPanels: PlacedPanel[]) => {
    updateCurrentProject((prev) => ({
      ...prev,
      panels: newPanels,
    }));
    setSelectedPanelId(null);
  };

  // 13. Mijoz ma'lumotlarini yangilash
  const handleUpdateClientInfo = (name: string, phone: string) => {
    updateCurrentProject((prev) => ({
      ...prev,
      clientName: sanitizeText(name, 50),
      clientPhone: sanitizeText(phone, 20),
    }));
  };

  // 14. Ulashish
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

  const metrics = calculateProjectMetrics(
    currentProject.roof,
    currentProject.panels,
    currentProject.financialSettings
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-cream-100 select-none">
      
      {/* 1. Yuqori Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        projectName={currentProject.projectName}
        onProjectNameChange={handleProjectNameChange}
        onOpenProjects={() => setIsProjectsModalOpen(true)}
        onOpenSmartLayout={() => setIsSmartLayoutOpen(true)}
        onOpenRoofConfig={() => setIsRoofConfigOpen(true)}
        onOpenEstimate={() => setIsEstimateOpen(true)}
        onShare={handleShare}
        onReset={handleClearPanels}
        panelsCount={currentProject.panels.length}
        totalCapacityKw={metrics.totalCapacityKw}
        isCopied={isCopied}
        isSaved={isSaved}
      />

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
        onOpenSmartLayout={() => setIsSmartLayoutOpen(true)}
        onClearPanels={handleClearPanels}
        customPanels={customPanels}
        onAddCustomSpec={handleAddCustomSpec}
      />

      {/* 4. Loyihalar Papkasi Modali (Excel/Word papkalar tizimi) */}
      <ProjectsManagerModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={projects}
        activeProjectId={activeProjectIdState}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
      />

      {/* 5. Tom Sozlamalari Modali */}
      <RoofConfigDrawer
        isOpen={isRoofConfigOpen}
        onClose={() => setIsRoofConfigOpen(false)}
        roof={currentProject.roof}
        onRoofChange={handleRoofChange}
      />

      {/* 6. AI Optimal Joylashtirish Modali */}
      <SmartLayoutModal
        isOpen={isSmartLayoutOpen}
        onClose={() => setIsSmartLayoutOpen(false)}
        roof={currentProject.roof}
        customPanels={customPanels}
        onApplyLayout={handleApplySmartLayout}
      />

      {/* 7. Tayyor Smeta va Usta Montaj Chizmasi (Print / PDF) */}
      <EstimateModal
        isOpen={isEstimateOpen}
        onClose={() => setIsEstimateOpen(false)}
        project={currentProject}
        onUpdateClientInfo={handleUpdateClientInfo}
      />

    </div>
  );
}
