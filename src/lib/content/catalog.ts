// Punto de acceso único al catálogo de plantillas globales.
//
// Hoy lee los archivos locales de `src/data/canvas-templates`. Si más adelante
// se quiere que las plantillas nuevas lleguen a proyectos ya desplegados sin
// volver a compilarlos, basta con que esta función consulte un catálogo
// remoto (por ejemplo un catalog.json en R2) y deje los archivos locales como
// respaldo: ningún componente de la UI se entera del cambio.

import { GLOBAL_CANVAS_TEMPLATES } from "@/data/canvas-templates";
import type { CanvasTemplate } from "./template-schema";

export function getGlobalTemplates(filter?: {
  aspectRatio?: string;
}): CanvasTemplate[] {
  const all = GLOBAL_CANVAS_TEMPLATES.map((t) => ({
    ...t,
    source: "GLOBAL" as const
  }));

  if (filter?.aspectRatio) {
    return all.filter((t) => t.aspectRatio === filter.aspectRatio);
  }
  return all;
}

export function getGlobalTemplateById(
  id: string
): CanvasTemplate | undefined {
  return getGlobalTemplates().find((t) => t.id === id);
}
