"use client";

import React, { useEffect, useState } from "react";
import { Canvas } from "../dashboard/pages/studio/internal-studio-parts/Canvas";
import { StudioProvider } from "../dashboard/pages/studio/context";
import { PageSchema } from "../dashboard/pages/studio/context";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/context/toast-context";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Trash2 } from "lucide-react";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Carrito simulado: en la vista previa no hay tienda publicada todavia,
// asi que mostramos el contenido real del carrito pero el pago final
// solo se simula con un aviso, en vez de procesar un pedido real.
function SimulatedCartDrawer() {
  const { items, removeItem, total, isCartOpen, setIsCartOpen } = useCart();
  const { showToast } = useToast();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[3000] flex justify-end">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-white h-screen shadow-2xl flex flex-col">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#001A1A] text-white">
              <h3 className="text-xl font-black uppercase italic tracking-widest">Tu Selección</h3>
              <button onClick={() => setIsCartOpen(false)} className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30"><ShoppingBag size={64} /><p className="text-[10px] font-black uppercase mt-4">Carrito Vacío</p></div>
              ) : items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-[2rem] border border-gray-100">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden bg-white shrink-0"><img src={item.image} className="h-full w-full object-cover" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 line-clamp-1">{item.title}</p>
                    <p className="text-xs font-bold text-[#004d4d] mt-1">${item.price.toLocaleString()}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Cantidad: {item.quantity}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-rose-500 self-center"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
            {items.length > 0 && (
              <div className="p-8 border-t bg-gray-50/50 space-y-6">
                <div className="flex justify-between items-end"><p className="text-[10px] font-black text-gray-400 uppercase">Total Estimado</p><p className="text-3xl font-black text-gray-900 tracking-tighter">${total.toLocaleString()}</p></div>
                <button onClick={() => showToast('El pago se procesará de verdad cuando publiques tu tienda', 'info')} className="w-full py-6 bg-gray-900 text-[#00f2ff] rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all">Finalizar Compra</button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function PreviewContent() {
  const [data, setData] = useState<PageSchema | null>(null);
  const searchParams = useSearchParams();
  // localStorage no existe durante el render en el servidor (Next.js sigue
  // haciendo un paso de SSR incluso para componentes "use client" antes de
  // hidratar) — leerlo directo en el cuerpo del componente puede disparar
  // "localStorage.getItem is not a function". Se difiere a un estado que
  // solo se calcula en el navegador.
  const [storedTemplateId, setStoredTemplateId] = useState<string | null>(null);
  useEffect(() => {
    setStoredTemplateId(localStorage.getItem("last_preview_template_id"));
  }, []);
  const templateId = searchParams.get("template_id") || storedTemplateId;
  const pageKey = searchParams.get("page") || "home";

  useEffect(() => {
    const loadPreview = async () => {
      // Guardamos el templateId para persistir la sesión de preview al navegar
      if (searchParams.get("template_id")) {
        localStorage.setItem("last_preview_template_id", searchParams.get("template_id")!);
      }

      if (templateId) {
        try {
          const token = localStorage.getItem("token");
          const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.bayup.com.co";
          const res = await fetch(`${apiBase}/super-admin/web-templates`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const all = await res.json();
            const tpl = all.find((t: any) => t.id === templateId);
            if (tpl) {
              // Si el JSON es multi-página, extraemos la página actual
              const schema = tpl.schema_data[pageKey] || tpl.schema_data.home || tpl.schema_data;
              
              // Inyectamos el template_id en los enlaces internos para que no se pierda el contexto al navegar
              if (schema.header?.elements) {
                schema.header.elements.forEach((el: any) => {
                  if (el.type === "navbar" && el.props.menuItems) {
                    el.props.menuItems.forEach((m: any) => {
                      if (m.url && m.url.includes('?page=')) {
                        m.url = m.url + `&template_id=${templateId}`;
                      }
                    });
                  }
                });
              }
              if (schema.body?.elements) {
                schema.body.elements.forEach((el: any) => {
                  if (el.type === "cards" && el.props.cards) {
                    el.props.cards.forEach((c: any) => {
                      if (c.url && c.url.includes('?page=')) {
                        c.url = c.url + `&template_id=${templateId}`;
                      }
                    });
                  }
                });
              }

              setData(schema);
            }
          }
        } catch (e) { console.error(e); }
        return;
      }

      // 2. Si no, buscamos en localStorage (flujo normal del Studio)
      const saved = localStorage.getItem("bayup-studio-preview");
      if (saved) {
        setData(JSON.parse(saved));
      }
    };
    loadPreview();
  }, [templateId]);

  if (!data) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900 text-white space-y-6">
      <div className="h-12 w-12 border-4 border-[#00f2ff]/20 border-t-[#00f2ff] rounded-full animate-spin" />
      <p className="font-black uppercase tracking-[0.5em] animate-pulse">Desplegando Arquitectura...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <StudioProvider>
        <Canvas overrideData={data} isPreview={true} />
      </StudioProvider>
      <SimulatedCartDrawer />
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense>
      <PreviewContent />
    </Suspense>
  );
}
