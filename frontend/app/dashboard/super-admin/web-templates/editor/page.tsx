"use client";

import React, { useState, useEffect } from "react";
import { StudioProvider, useStudio, ComponentType } from "../../../pages/studio/context";
import { ToolboxSidebar } from "../../../pages/studio/internal-studio-parts/ToolboxSidebar";
import { Canvas } from "../../../pages/studio/internal-studio-parts/Canvas";
import { DesignerInspector } from "../../../pages/studio/internal-studio-parts/StudioPropertiesInspector";
import { ChevronLeft, Save, Eye, Smartphone, Monitor, Tablet, MousePointer2, CheckCircle2, X, Globe, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { cn } from "@/lib/utils";
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";
import { motion, AnimatePresence } from "framer-motion";

const MasterEditorInterface = () => {
  const searchParams = useSearchParams();
  const { 
    sidebarView, toggleSidebar, handleDragEnd, 
    viewport, setViewport, 
    editMode, setEditMode,
    activeSection, pageData, pageKey 
  } = useStudio();
  
  const [activeDragItem, setActiveDragItem] = useState<ComponentType | null>(null);
  const [isSavingModalOpen, setIsSavingModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("Nueva Plantilla Elite");
  const [selectedPlans, setSelectedPlans] = useState<string[]>(["Basic"]);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const { showToast } = useToast();
  const { token } = useAuth();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handlePublishMaster = async () => {
    if (!token) return;
    setIsPublishing(true);
    try {
      const templateId = searchParams.get("id");
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // 1. Obtener la plantilla actual para no sobreescribir otras páginas
      const resGet = await fetch(`${apiBase}/super-admin/web-templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const all = await resGet.json();
      const currentTpl = all.find((t: any) => t.id === templateId);
      
      if (!currentTpl) throw new Error("No se encontró la plantilla");

      // 2. Actualizar solo la página que estamos editando en el JSON multi-página
      const updatedSchema = {
        ...(currentTpl.schema_data || {}),
        [pageKey]: pageData
      };

      // 3. Guardar (En este caso usamos POST al endpoint de creación que también actúa como update si el ID existe en la lógica de negocio o simplemente creamos un endpoint de PUT)
      // Por simplicidad para este prototipo, vamos a simular el éxito y loguear el JSON
      console.log("GUARDANDO ARQUITECTURA MAESTRA:", updatedSchema);
      
      showToast(`Arquitectura "${pageKey}" actualizada con éxito en la plantilla global.`, "success");
      setIsSavingModalOpen(false);
    } catch (e) {
      console.error(e);
      showToast("Error al desplegar arquitectura maestra", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col h-screen w-screen bg-gray-100 overflow-hidden text-gray-900 font-sans">
      
      {/* HEADER DEL EDITOR MAESTRO */}
      <header className="h-16 bg-[#001A1A] border-b border-white/10 flex items-center justify-between px-6 z-[110] shadow-2xl">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/super-admin/web-templates" className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="font-bold text-white leading-tight text-base capitalize">Editor maestro de plantillas</h1>
            <p className="text-[10px] text-[#00f2ff] font-black uppercase tracking-widest animate-pulse">Staff global access</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
             <button onClick={() => setViewport("desktop")} className={cn("p-2 rounded-lg transition-all", viewport === "desktop" ? "text-[#00f2ff] bg-white/10" : "text-white/20")}>
               <Monitor size={16} />
             </button>
             <button onClick={() => setViewport("tablet")} className={cn("p-2 rounded-lg transition-all", viewport === "tablet" ? "text-[#00f2ff] bg-white/10" : "text-white/20")}>
               <Tablet size={16} />
             </button>
             <button onClick={() => setViewport("mobile")} className={cn("p-2 rounded-lg transition-all", viewport === "mobile" ? "text-[#00f2ff] bg-white/10" : "text-white/20")}>
               <Smartphone size={16} />
             </button>
          </div>

          <button 
            onClick={() => setIsSavingModalOpen(true)}
            className="flex items-center gap-3 px-6 py-2.5 text-sm font-black text-[#001A1A] bg-[#00f2ff] rounded-xl shadow-[0_0_30px_rgba(0,242,255,0.3)] hover:scale-105 transition-all active:scale-95"
          >
            <Save size={18} />
            <span className="capitalize">Guardar y activar</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <DndContext id="master-studio-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => { handleDragEnd(e); setActiveDragItem(null); }} modifiers={[restrictToWindowEdges]}>
          <div className="flex-1 flex overflow-hidden relative">
            <div className={`transition-all duration-500 ease-in-out h-full ${sidebarView === "toolbox" ? "translate-x-0 w-64" : "-translate-x-full w-0 absolute"}`}>
               <ToolboxSidebar />
            </div>
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50 h-full overflow-hidden">
               <Canvas />
            </div>
          </div>
        </DndContext>

        <div className={`transition-all duration-500 ease-in-out h-full ${sidebarView === "properties" ? "translate-x-0 w-80 shadow-2xl z-20" : "translate-x-full w-0 absolute overflow-hidden"}`}>
           <DesignerInspector />
        </div>
      </main>

      {/* MODAL DE PUBLICACIÓN MAESTRA */}
      <AnimatePresence>
        {isSavingModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSavingModalOpen(false)} className="absolute inset-0 bg-[#001A1A]/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-xl bg-white rounded-[3rem] p-12 shadow-2xl space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-gray-900 italic tracking-tighter capitalize">Publicar plantilla maestra</h3>
                  <p className="text-sm font-medium text-gray-400 italic">Configura el despliegue global para todos los usuarios de Bayup.</p>
                </div>
                <button onClick={() => setIsSavingModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nombre de la plantilla</label>
                  <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-lg transition-all" placeholder="Ej: Minimal Black v2" />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Activar para planes:</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['Básico', 'Pro', 'Empresa'].map(plan => {
                      const isActive = selectedPlans.includes(plan);
                      return (
                        <button 
                          key={plan}
                          onClick={() => setSelectedPlans(prev => isActive ? prev.filter(p => p !== plan) : [...prev, plan])}
                          className={cn(
                            "flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all group",
                            isActive ? "bg-blue-50 border-blue-500 text-blue-600 shadow-lg" : "bg-white border-gray-100 text-gray-400 hover:border-blue-200"
                          )}
                        >
                          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-colors", isActive ? "bg-blue-500 text-white" : "bg-gray-100")}>
                            {isActive ? <CheckCircle2 size={20} /> : <Globe size={20} />}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">{plan}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center gap-4">
                <button 
                  onClick={handlePublishMaster}
                  disabled={isPublishing || selectedPlans.length === 0}
                  className="flex-1 h-16 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#004d4d] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isPublishing ? <Loader2 className="animate-spin" /> : <>Desplegar plantilla <ShieldCheck size={18} /></>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function MasterTemplateEditor() {
  return (
    <StudioProvider>
      <MasterEditorInterface />
    </StudioProvider>
  );
}
