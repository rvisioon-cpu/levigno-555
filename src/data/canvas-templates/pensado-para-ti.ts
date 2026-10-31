import { toDomTemplate, type CanvasTemplateV3 } from "@/lib/content/template-schema";

// Plantilla "Pensado para ti": foto a sangre completa, degradado de marca en
// la mitad superior, fila de atributos, titular a dos líneas, píldora de CTA
// y franja blanca inferior con el logo del proyecto.
//
// Está construida con capas vectoriales (no con un PNG horneado) para que el
// degradado y el CTA tomen el color de CADA proyecto vía los tokens
// {{brand.*}}. Lo único que cambia entre proyectos es la identidad.

const DIVIDER_Y = 0.028;
const DIVIDER_H = 0.032;
const FEATURE_Y = 0.03;

export const pensadoParaTi: CanvasTemplateV3 = toDomTemplate({
  version: 2,
  id: "pensado-para-ti",
  name: "Pensado para ti",
  category: "Campaña",
  source: "GLOBAL",
  width: 1080,
  height: 1350,
  aspectRatio: "4:5",
  layers: [
    // 1. La foto que elige el usuario
    {
      id: "bg",
      type: "photo-slot",
      role: "background",
      rect: [0, 0, 1, 1],
      fit: "cover"
    },

    // 2. Degradado de marca que baja desde el borde superior
    {
      id: "veil",
      type: "shape",
      shape: "rect",
      rect: [0, 0, 1, 0.62],
      gradient: {
        from: "{{brand.secondary}}",
        to: "{{brand.secondary}}",
        fromAlpha: 0.95,
        toAlpha: 0,
        direction: "vertical"
      }
    },

    // 3. Divisores verticales de la fila de atributos
    {
      id: "div-1",
      type: "shape",
      shape: "rect",
      rect: [0.283, DIVIDER_Y, 0.0018, DIVIDER_H],
      fill: "{{brand.light}}",
      opacity: 0.75
    },
    {
      id: "div-2",
      type: "shape",
      shape: "rect",
      rect: [0.482, DIVIDER_Y, 0.0018, DIVIDER_H],
      fill: "{{brand.light}}",
      opacity: 0.75
    },
    {
      id: "div-3",
      type: "shape",
      shape: "rect",
      rect: [0.677, DIVIDER_Y, 0.0018, DIVIDER_H],
      fill: "{{brand.light}}",
      opacity: 0.75
    },

    // 4. Píldora del CTA (el texto va como capa aparte para poder editarlo)
    {
      id: "cta-pill",
      type: "shape",
      shape: "pill",
      rect: [0.305, 0.325, 0.39, 0.05],
      fill: "{{brand.primary}}",
      stroke: "{{brand.light}}",
      strokeRatio: 0.005
    },

    // 5. Franja blanca inferior con el logo
    {
      id: "footer",
      type: "shape",
      shape: "rect",
      rect: [0, 0.922, 1, 0.078],
      fill: "{{brand.light}}"
    },
    {
      id: "logo",
      type: "image",
      src: "/content/templates/logos/logo_full_black.png",
      rect: [0.33, 0.935, 0.34, 0.05],
      fit: "contain"
    },

    // 6. Fila de atributos: editable en cada publicación
    {
      id: "feat-1",
      type: "text",
      content: "Ventanas\nAmplias",
      at: [0.155, FEATURE_Y],
      sizeRatio: 0.0245,
      color: "{{brand.light}}",
      font: "{{brand.body}}",
      fontStyle: "normal",
      lineHeight: 1.25
    },
    {
      id: "feat-2",
      type: "text",
      content: "Diseño\nBoutique",
      at: [0.352, FEATURE_Y],
      sizeRatio: 0.0245,
      color: "{{brand.light}}",
      font: "{{brand.body}}",
      fontStyle: "normal",
      lineHeight: 1.25
    },
    {
      id: "feat-3",
      type: "text",
      content: "Áreas\nVerdes",
      at: [0.55, FEATURE_Y],
      sizeRatio: 0.0245,
      color: "{{brand.light}}",
      font: "{{brand.body}}",
      fontStyle: "normal",
      lineHeight: 1.25
    },
    {
      id: "feat-4",
      type: "text",
      content: "Diseño\nPersonalizable",
      at: [0.745, FEATURE_Y],
      sizeRatio: 0.0245,
      color: "{{brand.light}}",
      font: "{{brand.body}}",
      fontStyle: "normal",
      lineHeight: 1.25
    },

    // 7. Titular a dos líneas
    {
      id: "title-1",
      type: "text",
      content: "Pensado",
      at: [0.135, 0.088],
      sizeRatio: 0.135,
      color: "{{brand.light}}",
      font: "{{brand.script}}",
      fontStyle: "italic"
    },
    {
      id: "title-2",
      type: "text",
      content: "para ti...",
      at: [0.46, 0.185],
      sizeRatio: 0.115,
      color: "{{brand.light}}",
      font: "{{brand.display}}",
      fontStyle: "bold"
    },

    // 8. Texto del CTA, centrado sobre la píldora
    {
      id: "cta-label",
      type: "text",
      content: "AGENDA TU CITA",
      at: [0.305, 0.339],
      widthRatio: 0.39,
      align: "center",
      sizeRatio: 0.032,
      color: "{{brand.onPrimary}}",
      font: "{{brand.display}}",
      fontStyle: "bold"
    }
  ]
});
