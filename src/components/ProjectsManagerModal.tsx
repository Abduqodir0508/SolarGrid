'use client';

import React, { useState } from 'react';
import { ProjectData } from '@/types/solar';
import {
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Check,
  X,
  Search,
  Calendar,
  Zap,
  MapPin,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { sanitizeText } from '@/utils/sanitize';

interface ProjectsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectData[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, clientName: string, address: string) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
}

export const ProjectsManagerModal: React.FC<ProjectsManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onDuplicateProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newAddress, setNewAddress] = useState('');

  if (!isOpen) return null;

  const filteredProjects = projects.filter(
    (p) =>
      p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = sanitizeText(newName, 60) || 'Yangi Loyiha';
    const finalClient = sanitizeText(newClient, 50) || 'Mijoz';
    const finalAddress = sanitizeText(newAddress, 100);

    onCreateProject(finalName, finalClient, finalAddress);
    setIsCreatingNew(false);
    setNewName('');
    setNewClient('');
    setNewAddress('');
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('uz-UZ', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-cream-200 relative max-h-[90vh] flex flex-col">
        
        {/* Sarlavha */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-cream-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-sm">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-navy-950">
                Loyihalar Papkasi (Workspaces)
              </h2>
              <p className="text-xs text-navy-600">
                Barcha obyektlar va mijozlar hisob-kitoblari avtomatik saqlanadi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-navy-900 rounded-xl hover:bg-cream-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Qidiruv va Yangi loyiha ochish paneli */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Loyiha, mijoz yoki manzil bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-cream-50/50"
            />
          </div>

          <button
            onClick={() => setIsCreatingNew(!isCreatingNew)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Yangi Obyekt / Loyiha</span>
          </button>
        </div>

        {/* Yangi loyiha yaratish formasi (agar ochilgan bo'lsa) */}
        {isCreatingNew && (
          <form
            onSubmit={handleCreateSubmit}
            className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl mb-4 space-y-2.5 animate-in fade-in slide-in-from-top-2"
          >
            <div className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-600" />
              <span>Yangi loyiha ma'lumotlarini kiriting:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-navy-700 block mb-0.5">
                  Loyiha / Obyekt nomi:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Qo'yliq 6, 5-dom"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs rounded-lg border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-navy-700 block mb-0.5">
                  Mijoz ismi:
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Jasur aka"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs rounded-lg border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-navy-700 block mb-0.5">
                  Manzili / Mo'ljal:
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Mirzo Ulug'bek tumani"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs rounded-lg border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-navy-700 hover:bg-amber-100/60"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-3.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-navy-950 shadow-sm"
              >
                Yaratish va Ochish
              </button>
            </div>
          </form>
        )}

        {/* Loyihalar ro'yxati (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filteredProjects.map((proj) => {
            const isActive = proj.id === activeProjectId;
            const totalKw = proj.panels.reduce((sum, p) => sum + (p.power || 0), 0) / 1000;

            return (
              <div
                key={proj.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isActive
                    ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-400 shadow-sm'
                    : 'border-cream-300 hover:border-cream-400 bg-cream-50/40 hover:bg-white'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-xs sm:text-sm font-bold text-navy-950 truncate">
                      {proj.projectName}
                    </h3>
                    {isActive && (
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-amber-500 text-navy-950 rounded-full">
                        Hozirgi
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-navy-700">
                    <span className="font-medium text-navy-900">
                      Mijoz: <strong>{proj.clientName || 'Noma\'lum'}</strong>
                    </span>

                    {proj.address && (
                      <span className="flex items-center gap-0.5 text-gray-500">
                        <MapPin className="w-3 h-3 text-amber-600" />
                        <span className="truncate max-w-[150px]">{proj.address}</span>
                      </span>
                    )}

                    <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                      <Zap className="w-3 h-3" />
                      {proj.panels.length} ta panel ({totalKw.toFixed(2)} kVt)
                    </span>

                    <span className="text-gray-400 text-[10px] flex items-center gap-0.5 ml-auto sm:ml-0">
                      <Calendar className="w-3 h-3" />
                      {formatDate(proj.updatedAt || proj.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Harakatlar (Actions) */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {!isActive && (
                    <button
                      onClick={() => {
                        onSelectProject(proj.id);
                        onClose();
                      }}
                      className="px-3 py-1 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm active:scale-95"
                    >
                      Ochish
                    </button>
                  )}

                  <button
                    onClick={() => onDuplicateProject(proj.id)}
                    className="p-1.5 text-gray-600 hover:text-navy-950 hover:bg-cream-200 rounded-lg transition-colors"
                    title="Nusxa olish (Duplicate)"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `"${proj.projectName}" loyihasini o'chirishga ishonchingiz komilmi?`
                        )
                      ) {
                        onDeleteProject(proj.id);
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs">
              Hech qanday loyiha topilmadi.
            </div>
          )}
        </div>

        {/* Pastki qism */}
        <div className="pt-3 mt-3 border-t border-cream-200 flex items-center justify-between text-xs text-gray-500">
          <span>Jami {projects.length} ta loyiha saqlangan</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl font-semibold text-navy-800 hover:bg-cream-100"
          >
            Yopish
          </button>
        </div>

      </div>
    </div>
  );
};
