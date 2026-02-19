"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudio } from "../context";
import { SmartNavbar, SmartHero, SmartProductGrid } from "@/components/dashboard/studio/HighFidelityBlocks";

export const DraggableCanvasElement = ({ 
  el, 
  section, 
  selectedElementId, 
  selectElement, 
  setActiveSection, 
  removeElement, 
  isPreview = false
}: any) => {
  const { viewport } = useStudio();
  
  const elProps = {
    ...el.props,
    ...(el.props.responsiveOverrides?.[viewport] || {})
  };

  const isSelected = selectedElementId === el.id;

  return (
    <div 
      onClick={(e) => { 
        if (isPreview) return; 
        e.preventDefault();
        e.stopPropagation(); 
        console.log("Editando bloque:", el.type);
        selectElement(el.id); 
        setActiveSection(section); 
      }} 
      className={cn(
        "relative transition-all duration-300 cursor-pointer", 
        !isPreview && (isSelected ? "ring-4 ring-[#00f2ff] ring-inset z-[100] scale-[1.01] shadow-2xl" : "hover:ring-2 hover:ring-blue-300")
      )}
    >
      {/* Botones de control flotantes */}
      {!isPreview && isSelected && (
        <div className="absolute -top-10 left-0 bg-[#00f2ff] text-[#004d4d] px-4 py-1.5 rounded-t-xl text-[8px] font-black uppercase flex items-center gap-3 z-[110]">
          <GripVertical size={12} />
          <span>{el.type}</span>
          <button onClick={() => removeElement(section, el.id)} className="hover:text-red-600 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      )}

      <div className={cn(!isPreview && "p-1")}>
        {el.type === "navbar" && <SmartNavbar props={elProps} />}
        {el.type === "hero-banner" && <SmartHero props={elProps} />}
        {el.type === "product-grid" && <SmartProductGrid props={elProps} />}
        
        {el.type === "text" && (
          <div className="py-10 text-center font-black text-4xl uppercase italic tracking-tighter">
            {elProps.title || elProps.content || "Texto de ejemplo"}
          </div>
        )}
      </div>
    </div>
  );
};
