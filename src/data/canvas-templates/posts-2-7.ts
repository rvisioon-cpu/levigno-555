import { toDomTemplate, type CanvasTemplateV3, type TemplateLayer } from "@/lib/content/template-schema";

const W = "/content/templates/oceano/icon-windows.svg";
const B = "/content/templates/oceano/icon-boutique.svg";
const G = "/content/templates/oceano/icon-green.svg";
const C = "/content/templates/oceano/icon-customizable.svg";

/** The recurring benefits strip in the Figma campaign, parametrised so every
 * layout remains editable and uses the identity of the active project. */
function benefits(y: number, color: string, vertical = false): TemplateLayer[] {
  const items = [
    [W, "Ventanas\nAmplias"], [B, "Diseño\nBoutique"],
    [G, "Áreas\nVerdes"], [C, "Diseño\nPersonalizable"]
  ] as const;
  if (vertical) return items.flatMap(([src, text], i) => {
    const top = y + i * 0.0815;
    return [
      { id: `benefit-icon-${i}`, type: "image" as const, src, rect: [0.13, top, 0.05, 0.037], fit: "contain" as const },
      { id: `benefit-${i}`, type: "text" as const, content: text, at: [0.188, top + 0.002], sizeRatio: 0.0204, color, font: "Poppins", fontWeight: 300, lineHeight: 1.18 }
    ];
  });
  return items.flatMap(([src, text], i) => {
    const x = 0.09 + i * 0.21;
    return [
      ...(i ? [{ id: `benefit-line-${i}`, type: "shape" as const, shape: "rect" as const, rect: [x - 0.025, y - 0.004, 0.00185, 0.0444], fill: color, opacity: 0.8 }] : []),
      { id: `benefit-icon-${i}`, type: "image" as const, src, rect: [x, y, 0.045, 0.037], fit: "contain" as const },
      { id: `benefit-${i}`, type: "text" as const, content: text, at: [x + 0.055, y + 0.002], sizeRatio: 0.0204, color, font: "Poppins", fontWeight: 300, lineHeight: 1.18 }
    ];
  }) as TemplateLayer[];
}

function showroom(y: number, foreground: string, background: string, width = 0.87, x = 0.065): TemplateLayer[] {
  return [
    { id: "showroom-border", type: "shape", shape: "rect", rect: [x, y, width, 0.0593], stroke: foreground, strokeRatio: 0.0046 },
    { id: "showroom-fill", type: "shape", shape: "rect", rect: [x + 0.007, y + 0.0074, width - 0.014, 0.0445], fill: background },
    { id: "showroom", type: "text", content: "VISITA NUESTRO SHOWROOM VIRTUAL", at: [x + 0.007, y + 0.015], widthRatio: width - 0.014, align: "center", sizeRatio: 0.0296, color: foreground, font: "Poppins", fontWeight: 400, letterSpacingEm: 0.05, lineHeight: 1, wrap: "none" }
  ];
}

const logo = (id = "logo", rect: [number, number, number, number] = [0.36, 0.93, 0.28, 0.06]): TemplateLayer => ({ id, type: "image", src: "/content/templates/logos/logo_full_black.png", rect, fit: "contain", editable: true, label: "Logo" });

export const post2: CanvasTemplateV3 = toDomTemplate({
  version: 2, id: "post-2-entrega", name: "Post 2 · Entrega", category: "Campaña", source: "GLOBAL", width: 1080, height: 1350, aspectRatio: "4:5",
  layers: [
    { id: "bg", type: "photo-slot", role: "background", rect: [0, 0, 1, 1], fit: "cover" },
    { id: "info-bg", type: "shape", shape: "rect", rect: [0.021296, 0.78, 0.961111, 0.23037], fill: "{{brand.primary}}", stroke: "{{brand.light}}", strokeRatio: 0.002778, cornerRatio: 0.060185 },
    { id: "top-card", type: "shape", shape: "rect", rect: [0.561111, -0.00963, 0.512037, 0.099259], fill: "{{brand.primary}}", stroke: "{{brand.light}}", strokeRatio: 0.002778, cornerRatio: 0.046296 },
    { id: "delivery", type: "text", content: "ENTREGA EN 2027", at: [0.606, 0.018], sizeRatio: 0.0417, color: "{{brand.light}}", font: "Poppins", fontWeight: 300, letterSpacingEm: 0.03 },
    { id: "headline-1", type: "text", content: "Pensado", at: [0.605556, 0.205185], sizeRatio: 0.111111, color: "{{brand.light}}", font: "Playfair Display", fontWeight: 800, fontStyle: "italic", letterSpacingEm: -0.1, lineHeight: 0.833, wrap: "none" },
    { id: "headline-2", type: "text", content: "para ti...", at: [0.634259, 0.28], sizeRatio: 0.111111, color: "{{brand.light}}", font: "Poppins", fontWeight: 400, letterSpacingEm: -0.1, lineHeight: 0.9, wrap: "none" },
    ...benefits(0.807, "{{brand.light}}"),
    ...showroom(0.872, "{{brand.primary}}", "{{brand.light}}"),
    { id: "address", type: "text", content: "{{project.buildingAddress}}", at: [0.2, 0.958], widthRatio: 0.6, align: "center", sizeRatio: 0.022, color: "{{brand.light}}", font: "Poppins", fontWeight: 300 }
  ]
});

export const post3: CanvasTemplateV3 = toDomTemplate({
  version: 2, id: "post-3-hero", name: "Post 3 · Hero", category: "Campaña", source: "GLOBAL", width: 1080, height: 1350, aspectRatio: "4:5",
  layers: [
    { id: "bg", type: "photo-slot", role: "background", rect: [0, 0, 1, 1], fit: "cover" },
    { id: "footer", type: "shape", shape: "rect", rect: [0, 0.926, 1, 0.074], fill: "{{brand.primary}}" },
    ...benefits(0.042, "{{brand.light}}"),
    { id: "headline-1", type: "text", content: "Pensado", at: [0.14537, 0.14], sizeRatio: 0.148148, color: "{{brand.light}}", font: "Playfair Display", fontWeight: 800, fontStyle: "italic", letterSpacingEm: -0.1, lineHeight: 0.625, wrap: "none" },
    { id: "headline-2", type: "text", content: "para ti...", at: [0.408333, 0.228889], sizeRatio: 0.148148, color: "{{brand.light}}", font: "Poppins", fontWeight: 400, letterSpacingEm: -0.1, lineHeight: 0.675, wrap: "none" },
    ...showroom(0.815, "{{brand.primary}}", "{{brand.light}}", 0.5, 0.25), logo("logo", [0.39, 0.938, 0.22, 0.05])
  ]
});

export const post4: CanvasTemplateV3 = toDomTemplate({
  version: 2, id: "post-4-entrega", name: "Post 4 · Entrega", category: "Campaña", source: "GLOBAL", width: 1080, height: 1350, aspectRatio: "4:5",
  layers: [
    { id: "bg", type: "photo-slot", role: "background", rect: [0, 0, 1, 0.55], fit: "cover" },
    { id: "body", type: "shape", shape: "rect", rect: [0, 0.55, 1, 0.45], fill: "{{brand.primary}}" },
    { id: "delivery-pill", type: "shape", shape: "pill", rect: [0.3, 0.53, 0.4, 0.043], fill: "{{brand.light}}" },
    { id: "delivery", type: "text", content: "ENTREGA 2027", at: [0.3, 0.537], widthRatio: 0.4, align: "center", sizeRatio: 0.033, color: "{{brand.primary}}", font: "Poppins", fontWeight: 400, letterSpacingEm: 0.05 },
    { id: "benefits-bg", type: "shape", shape: "pill", rect: [0.037, 0.83, 0.926, 0.075], fill: "{{brand.light}}" },
    { id: "headline-1", type: "text", content: "Pensado", at: [0.138889, 0.596296], sizeRatio: 0.166667, color: "{{brand.light}}", font: "Playfair Display", fontWeight: 800, fontStyle: "italic", letterSpacingEm: -0.1, lineHeight: 0.556, wrap: "none" },
    { id: "headline-2", type: "text", content: "para ti...", at: [0.355556, 0.688889], widthRatio: 0.505556, sizeRatio: 0.166667, color: "{{brand.light}}", font: "Poppins", fontWeight: 400, letterSpacingEm: -0.1, lineHeight: 0.6, wrap: "none" },
    ...benefits(0.85, "{{brand.primary}}"),
    { id: "showroom", type: "text", content: "VISITA NUESTRO SHOWROOM VIRTUAL", at: [0.15, 0.94], widthRatio: 0.7, align: "center", sizeRatio: 0.028, color: "{{brand.light}}", font: "Poppins", fontWeight: 600, letterSpacingEm: 0.05 }, logo("logo", [0.05, 0.03, 0.25, 0.06])
  ]
});

export const post5: CanvasTemplateV3 = toDomTemplate({
  version: 2, id: "post-5-lateral", name: "Post 5 · Lateral", category: "Campaña", source: "GLOBAL", width: 1080, height: 1350, aspectRatio: "4:5",
  layers: [
    { id: "bg", type: "photo-slot", role: "background", rect: [0, 0, 1, 1], fit: "cover" },
    { id: "side", type: "shape", shape: "rect", rect: [0.045, 0, 0.34, 1], gradient: { from: "{{brand.primary}}", to: "{{brand.secondary}}", fromAlpha: 0.95, toAlpha: 0.9, direction: "vertical" } },
    { id: "delivery", type: "text", content: "ENTREGA\n2027", at: [0.13, 0.07], sizeRatio: 0.065, color: "{{brand.light}}", font: "Poppins", fontWeight: 800, lineHeight: 0.85 },
    { id: "headline-1", type: "text", content: "Pensado", at: [0.078704, 0.242222], sizeRatio: 0.092593, color: "{{brand.light}}", font: "Playfair Display", fontWeight: 800, fontStyle: "italic", letterSpacingEm: -0.1, lineHeight: 1, wrap: "none" },
    { id: "headline-2", type: "text", content: "para ti...", at: [0.155556, 0.316296], widthRatio: 0.227778, align: "center", sizeRatio: 0.074074, color: "{{brand.light}}", font: "Poppins", fontWeight: 400, letterSpacingEm: -0.1, lineHeight: 1, wrap: "none" },
    ...benefits(0.46, "{{brand.light}}", true), logo("logo", [0.093519, 0.82963, 0.275926, 0.093333])
  ]
});

export const post6: CanvasTemplateV3 = {
  version: 3, id: "post-6-degradado", name: "Post 6 · Degradado", category: "Campaña", source: "GLOBAL", width: 1080, height: 1350, aspectRatio: "4:5",
  layers: [
    { id: "bg", type: "photo-slot", role: "background", bounds: [0, 0, 1080, 1350], fit: "cover", objectPosition: [50, 50], zoom: 1, editable: true },
    // Geometría nativa del frame POST 6 (1080 × 1350). El renderer DOM no
    // vuelve a convertir estas medidas a ratios, evitando redondeos entre
    // editor, miniatura y exportación.
    { id: "fade", type: "shape", shape: "rect", bounds: [0, 560, 1080, 790], gradient: { from: "{{brand.light}}", to: "{{brand.light}}", fromAlpha: 0, toAlpha: 1, direction: "vertical" }, locked: true },
    { id: "benefits-bg", type: "shape", shape: "pill", bounds: [100, 1117, 880, 88], fill: "{{brand.primary}}", locked: true },
    { id: "benefit-line-1", type: "shape", shape: "rect", bounds: [329, 1135, 1, 53], fill: "{{brand.light}}", opacity: 0.8, locked: true },
    { id: "benefit-line-2", type: "shape", shape: "rect", bounds: [529, 1135, 1, 53], fill: "{{brand.light}}", opacity: 0.8, locked: true },
    { id: "benefit-line-3", type: "shape", shape: "rect", bounds: [706, 1135, 1, 53], fill: "{{brand.light}}", opacity: 0.8, locked: true },
    { id: "benefit-icon-0", type: "image", src: W, bounds: [152, 1139, 47, 44], fit: "contain", locked: true },
    { id: "benefit-icon-1", type: "image", src: B, bounds: [357, 1139, 46, 44], fit: "contain", locked: true },
    { id: "benefit-icon-2", type: "image", src: G, bounds: [557, 1139, 44, 44], fit: "contain", locked: true },
    { id: "benefit-icon-3", type: "image", src: C, bounds: [734, 1138, 46, 46], fit: "contain", locked: true },
    { id: "benefit-0", type: "text", content: "Ventanas\nAmplias", bounds: [208, 1143, 105, 48], fontSize: 20, minFontSize: 16, color: "{{brand.light}}", font: "Poppins", fontWeight: 300, lineHeight: 1.12, overflow: "shrink", editable: true },
    { id: "benefit-1", type: "text", content: "Diseño\nBoutique", bounds: [416, 1142, 98, 48], fontSize: 20, minFontSize: 16, color: "{{brand.light}}", font: "Poppins", fontWeight: 300, lineHeight: 1.12, overflow: "shrink", editable: true },
    { id: "benefit-2", type: "text", content: "Áreas\nVerdes", bounds: [611, 1139, 82, 48], fontSize: 20, minFontSize: 16, color: "{{brand.light}}", font: "Poppins", fontWeight: 300, lineHeight: 1.12, overflow: "shrink", editable: true },
    { id: "benefit-3", type: "text", content: "Diseño\nPersonalizable", bounds: [792, 1142, 165, 48], fontSize: 20, minFontSize: 14, color: "{{brand.light}}", font: "Poppins", fontWeight: 300, lineHeight: 1.12, overflow: "shrink", editable: true },
    { id: "showroom", type: "text", content: "VISITA NUESTRO SHOWROOM VIRTUAL", bounds: [236, 703, 609, 45], align: "center", fontSize: 30, minFontSize: 22, color: "{{brand.light}}", font: "Poppins", fontWeight: 600, letterSpacing: 1.5, lineHeight: 1, wrap: "none", overflow: "shrink", editable: true, movable: true, movementBounds: [176, 663, 729, 125] },
    { id: "headline-1", type: "text", content: "Pensado", bounds: [150, 799, 700, 190], fontSize: 180, minFontSize: 120, color: "{{brand.secondary}}", font: "Playfair Display", fontWeight: 800, fontStyle: "italic", letterSpacing: -18, lineHeight: 0.556, wrap: "none", overflow: "shrink", editable: true, movable: true, movementBounds: [90, 739, 820, 310] },
    { id: "headline-2", type: "text", content: "para ti...", bounds: [384, 924, 546, 160], fontSize: 180, minFontSize: 110, color: "{{brand.secondary}}", font: "Poppins", fontWeight: 400, letterSpacing: -18, lineHeight: 0.6, wrap: "none", overflow: "shrink", editable: true, movable: true, movementBounds: [324, 864, 666, 280] },
    { id: "logo", type: "image", src: "/content/templates/logos/logo_full_black.png", bounds: [415, 1233, 249, 84], fit: "contain", editable: true, label: "Logo" }
  ]
};

export const post7: CanvasTemplateV3 = toDomTemplate({
  version: 2, id: "post-7-marco", name: "Post 7 · Marco", category: "Campaña", source: "GLOBAL", width: 1080, height: 1350, aspectRatio: "4:5",
  layers: [
    { id: "canvas", type: "shape", shape: "rect", rect: [0, 0, 1, 1], fill: "{{brand.primary}}" },
    { id: "inner", type: "shape", shape: "rect", rect: [0.044444, 0.034815, 0.911111, 0.986667], stroke: "{{brand.light}}", strokeRatio: 0.009259 },
    { id: "headline-1", type: "text", content: "Pensado", at: [0.138889, 0.094074], sizeRatio: 0.166667, color: "{{brand.light}}", font: "Playfair Display", fontWeight: 800, fontStyle: "italic", letterSpacingEm: -0.1, lineHeight: 0.556, wrap: "none" },
    { id: "headline-2", type: "text", content: "para ti...", at: [0.355556, 0.186667], widthRatio: 0.505556, sizeRatio: 0.166667, color: "{{brand.light}}", font: "Poppins", fontWeight: 400, letterSpacingEm: -0.1, lineHeight: 0.6, wrap: "none" },
    ...benefits(0.36, "{{brand.light}}"),
    { id: "showroom", type: "text", content: "VISITA NUESTRO SHOWROOM VIRTUAL", at: [0.15, 0.45], widthRatio: 0.7, align: "center", sizeRatio: 0.028, color: "{{brand.light}}", font: "Poppins", fontWeight: 600, letterSpacingEm: 0.05 },
    { id: "hero", type: "photo-slot", role: "background", rect: [0, 0.479259, 1, 0.305185], fit: "cover" },
    { id: "delivery", type: "text", content: "ENTREGA\n2027", at: [0.40463, 0.764926], widthRatio: 0.191667, align: "center", sizeRatio: 0.055, color: "{{brand.light}}", font: "Poppins", fontWeight: 800, lineHeight: 0.85 }, logo("logo", [0.314815, 0.886667, 0.37037, 0.08])
  ]
});
