import { PageSchema } from "@/app/dashboard/pages/studio/context";

/**
 * Motor de carga universal de arquitecturas.
 * Intenta cargar el JSON desde la carpeta de la plantilla.
 */
export const getSmartTemplate = async (folderPath: string): Promise<PageSchema> => {
  try {
    // Intentamos cargar el archivo architecture.json de la carpeta pública
    const response = await fetch(`/templates/custom-html/${folderPath}/architecture.json`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error("Error cargando arquitectura inteligente:", error);
  }

  // Esquema de respaldo (vacío)
  return {
    header: { elements: [], styles: {} },
    body: { elements: [], styles: {} },
    footer: { elements: [], styles: {} }
  };
};
