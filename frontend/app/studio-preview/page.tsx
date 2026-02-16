"use client";

import React, { useEffect, useState } from "react";
import { Canvas } from "../dashboard/pages/studio/internal-studio-parts/Canvas";
import { StudioProvider } from "../dashboard/pages/studio/context";
import { PageSchema } from "../dashboard/pages/studio/context";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PreviewContent() {
  const [data, setData] = useState<PageSchema | null>(null);
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template_id") || localStorage.getItem("last_preview_template_id");
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
          const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
