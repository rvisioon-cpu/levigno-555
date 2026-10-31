// Catálogo de plantillas compartidas entre TODOS los proyectos.
//
// Vive en archivos (no en la base de datos) a propósito: este repositorio es
// la plantilla base desde la que se clona cada proyecto nuevo, así que una
// plantilla añadida aquí aparece automáticamente en el siguiente proyecto sin
// migraciones ni seeds. Las plantillas propias de un proyecto siguen
// guardándose en la tabla `canvas_templates`.

import type { CanvasTemplate } from "@/lib/content/template-schema";
import { pensadoParaTi } from "./pensado-para-ti";
import { entrega2027 } from "./entrega-2027";
import { oceanoAtlanticoReference } from "./oceano-atlantico-reference";
import { post2 } from "./post-2-entrega";
import { post3 } from "./post-3-hero";
import { post4 } from "./post-4-entrega";
import { post5 } from "./post-5-lateral";
import { post6 } from "./post-6-degradado";
import { post7 } from "./post-7-marco";

export const GLOBAL_CANVAS_TEMPLATES: CanvasTemplate[] = [
  pensadoParaTi,
  entrega2027,
  oceanoAtlanticoReference,
  post2,
  post3,
  post4,
  post5,
  post6,
  post7
];
