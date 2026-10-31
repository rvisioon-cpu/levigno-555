import { toDomTemplate, type CanvasTemplateV3 } from "@/lib/content/template-schema";

// Adaptación editable del frame "POST 1" de Figma (.fig).
// La geometría conserva las medidas exactas del diseño de Figma (1080×1350),
// con slots de collage independientes, doble caja en el botón del showroom
// y jerarquía tipográfica idéntica a la referencia vectorial.
export const entrega2027: CanvasTemplateV3 = toDomTemplate({
  version: 2,
  id: "entrega-2027-collage",
  name: "Entrega 2027 · Collage",
  category: "Campaña",
  source: "GLOBAL",
  width: 1080,
  height: 1350,
  aspectRatio: "4:5",
  layers: [
    // Fila superior y collage de fotografías (medidas exactas de la grilla de Figma)
    { id: "hero", type: "photo-slot", role: "background", rect: [0.4102, 0, 0.5898, 0.4304], fit: "cover" },
    { id: "photo-1", type: "photo-slot", role: "secondary", rect: [0, 0.4304, 0.3167, 0.2296], fit: "cover" },
    { id: "photo-2", type: "photo-slot", role: "secondary", rect: [0.3194, 0.4304, 0.3546, 0.2296], fit: "cover" },
    { id: "photo-3", type: "photo-slot", role: "secondary", rect: [0.6769, 0.4304, 0.3546, 0.2296], fit: "cover" },

    // Bloques de color del diseño original
    { id: "delivery-bg", type: "shape", shape: "rect", rect: [0, 0, 0.4102, 0.1852], fill: "{{brand.light}}" },
    { id: "headline-bg", type: "shape", shape: "rect", rect: [0, 0.1852, 0.4102, 0.2452], fill: "{{brand.primary}}" },
    { id: "info-bg", type: "shape", shape: "rect", rect: [0, 0.66, 1, 0.2652], fill: "{{brand.primary}}" },
    { id: "footer", type: "shape", shape: "rect", rect: [0, 0.9252, 1, 0.0748], fill: "{{brand.light}}" },

    // Divisores verticales del bloque de atributos (2px de grosor, 60px de alto en Figma)
    { id: "attribute-line-1", type: "shape", shape: "rect", rect: [0.25, 0.6748, 0.00185, 0.0444], fill: "{{brand.light}}" },
    { id: "attribute-line-2", type: "shape", shape: "rect", rect: [0.5, 0.6748, 0.00185, 0.0444], fill: "{{brand.light}}" },
    { id: "attribute-line-3", type: "shape", shape: "rect", rect: [0.75, 0.6748, 0.00185, 0.0444], fill: "{{brand.light}}" },

    // Botón de showroom virtual con efecto de doble caja (borde exterior + relleno blanco)
    { id: "showroom-border", type: "shape", shape: "rect", rect: [0.0653, 0.7348, 0.8694, 0.0593], stroke: "{{brand.light}}", strokeRatio: 0.0046 },
    { id: "showroom-fill", type: "shape", shape: "rect", rect: [0.0725, 0.7422, 0.855, 0.0445], fill: "{{brand.light}}" },

    // Botón CTA con líneas laterales
    { id: "cta-line-left", type: "shape", shape: "rect", rect: [0.0657, 0.8815, 0.176, 0.003], fill: "{{brand.light}}" },
    { id: "cta-border", type: "shape", shape: "rect", rect: [0.2676, 0.8593, 0.4648, 0.0496], stroke: "{{brand.light}}", strokeRatio: 0.0037 },
    { id: "cta-line-right", type: "shape", shape: "rect", rect: [0.7583, 0.8815, 0.176, 0.003], fill: "{{brand.light}}" },

    // Iconos vectoriales de la referencia de Figma
    { id: "icon-windows", type: "image", src: "/content/templates/oceano/icon-windows.svg", rect: [0.0407, 0.678, 0.045, 0.037], fit: "contain" },
    { id: "icon-boutique", type: "image", src: "/content/templates/oceano/icon-boutique.svg", rect: [0.293, 0.678, 0.045, 0.037], fit: "contain" },
    { id: "icon-green", type: "image", src: "/content/templates/oceano/icon-green.svg", rect: [0.545, 0.678, 0.045, 0.037], fit: "contain" },
    { id: "icon-customizable", type: "image", src: "/content/templates/oceano/icon-customizable.svg", rect: [0.779, 0.678, 0.045, 0.037], fit: "contain" },
    { id: "icon-location", type: "image", src: "/content/templates/oceano/icon-location.svg", rect: [0.299, 0.812, 0.022, 0.026], fit: "contain" },

    // Logo provisto en el pie (304×82 centrado)
    { id: "logo", type: "image", src: "/content/templates/logos/logo_full_black.png", rect: [0.3593, 0.9319, 0.2815, 0.0607], fit: "contain", editable: true, label: "Logo del pie" },

    // Bloque Entrega / Año
    { id: "delivery", type: "text", content: "ENTREGA", at: [0.0407, 0.0207], widthRatio: 0.33, align: "left", sizeRatio: 0.0537, color: "{{brand.primary}}", font: "Poppins", fontWeight: 800, fontStyle: "normal", lineHeight: 0.9 },
    { id: "year", type: "text", content: "2027", at: [0.0407, 0.0585], widthRatio: 0.33, align: "left", sizeRatio: 140 / 1080, color: "{{brand.primary}}", font: "Poppins", fontWeight: 800, fontStyle: "normal", lineHeight: 0.9, letterSpacingEm: -0.0125 },

    // Titular "Pensado para ti..."
    { id: "headline-1", type: "text", content: "Pensado", at: [0.0324, 0.2259], sizeRatio: 0.1019, color: "{{brand.light}}", font: "Playfair Display", fontWeight: 800, fontStyle: "italic", letterSpacingEm: -0.1, lineHeight: 0.91 },
    { id: "headline-2", type: "text", content: "para ti...", at: [0.0324, 0.2999], sizeRatio: 0.1019, color: "{{brand.light}}", font: "Poppins", fontWeight: 400, fontStyle: "normal", letterSpacingEm: -0.1, lineHeight: 0.982 },

    // Atributos destacados (Poppins 300 con interlineado holgado)
    { id: "attr-1", type: "text", content: "Ventanas\nAmplias", at: [0.095, 0.6793], sizeRatio: 0.0204, color: "{{brand.light}}", font: "Poppins", fontWeight: 300, lineHeight: 1.18 },
    { id: "attr-2", type: "text", content: "Diseño\nBoutique", at: [0.348, 0.6793], sizeRatio: 0.0204, color: "{{brand.light}}", font: "Poppins", fontWeight: 300, lineHeight: 1.18 },
    { id: "attr-3", type: "text", content: "Áreas\nVerdes", at: [0.601, 0.6793], sizeRatio: 0.0204, color: "{{brand.light}}", font: "Poppins", fontWeight: 300, lineHeight: 1.18 },
    { id: "attr-4", type: "text", content: "Diseño\nPersonalizable", at: [0.834, 0.6793], sizeRatio: 0.0204, color: "{{brand.light}}", font: "Poppins", fontWeight: 300, lineHeight: 1.18 },

    // Showroom virtual (texto con color primario sobre la pastilla blanca interior)
    { id: "website", type: "text", content: "VISITA NUESTRO SHOWROOM VIRTUAL", at: [0.0725, 0.7502], widthRatio: 0.855, align: "center", sizeRatio: 0.0296, color: "{{brand.primary}}", font: "Poppins", fontWeight: 300, letterSpacingEm: 0.05, lineHeight: 1 },

    // Dirección con pin
    { id: "address", type: "text", content: "{{project.buildingAddress}}", at: [0.32, 0.8126], widthRatio: 0.36, align: "center", sizeRatio: 0.0222, color: "{{brand.light}}", font: "Poppins", fontWeight: 300, letterSpacingEm: 0.05, lineHeight: 1 },

    // Botón de llamada a la acción
    { id: "cta", type: "text", content: "AGENDA TU VISITA", at: [0.2676, 0.8692], widthRatio: 0.4648, align: "center", sizeRatio: 0.0296, color: "{{brand.light}}", font: "Poppins", fontWeight: 800, fontStyle: "normal", letterSpacingEm: 0.05, lineHeight: 1, wrap: "none" }
  ]
});
