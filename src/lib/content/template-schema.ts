// Formato v2 de las plantillas de lienzo del generador de contenido.
//
// Diferencia clave con v1: todas las coordenadas y tamaños son *normalizados*
// (fracciones de 0 a 1 respecto al ancho/alto del lienzo) en lugar de píxeles
// del editor. Eso hace que una plantilla se vea igual sin importar la
// resolución de salida ni el tamaño del lienzo en pantalla, y permite
// reutilizar la misma plantilla entre proyectos.
//
// Los colores, tipografías y logos no se escriben literales: se usan tokens
// ({{brand.primary}}, {{brand.logoHorizontal}}, ...) que resuelve
// `resolveBrandToken` con la identidad de cada proyecto.

// [x, y, ancho, alto] normalizados (0..1)
export type Rect = [number, number, number, number];
// [x, y] normalizados (0..1)
export type Point = [number, number];

export type LayerType = "photo-slot" | "frame" | "shape" | "image" | "text";

interface BaseLayer {
  id: string;
  type: LayerType;
  // Las capas bloqueadas se dibujan pero no se pueden seleccionar ni mover
  locked?: boolean;
  opacity?: number;
}

// Hueco donde entra la foto que elige el usuario. Una plantilla puede tener
// varios slots: por ejemplo, una foto hero y tres fotos de un collage.
export interface PhotoSlotLayer extends BaseLayer {
  type: "photo-slot";
  rect: Rect;
  fit?: "cover" | "contain";
  // 'background' = el fondo principal del lienzo; 'secondary' = una celda de
  // collage independiente. Cada id recibe y conserva su propio medio.
  role?: "background" | "secondary";
}

// Marco decorativo: PNG transparente exportado desde Canva/Figma
export interface FrameLayer extends BaseLayer {
  type: "frame";
  src: string;
  rect?: Rect; // por defecto ocupa todo el lienzo
}

// Primitiva vectorial: degradados, píldoras del CTA, divisores, franjas
export interface ShapeLayer extends BaseLayer {
  type: "shape";
  shape: "rect" | "pill" | "circle";
  rect: Rect;
  fill?: string;
  gradient?: {
    from: string;
    to: string;
    // Opacidad de cada extremo: un degradado que se desvanece es el mismo
    // color con alfa 0, no el color "transparent"
    fromAlpha?: number;
    toAlpha?: number;
    direction?: "vertical" | "horizontal";
  };
  stroke?: string;
  // Grosor y radio como fracción del ancho del lienzo (para que escalen)
  strokeRatio?: number;
  cornerRatio?: number;
}

// Imagen fija de la plantilla: logo, isotipo, íconos de atributos
export interface ImageLayer extends BaseLayer {
  type: "image";
  src: string;
  rect: Rect;
  fit?: "contain" | "cover";
  // Permite que una imagen decorativa concreta (por ejemplo, un logo) se
  // sustituya desde los medios del proyecto sin volver editables los íconos.
  editable?: boolean;
  label?: string;
}

export interface TextLayer extends BaseLayer {
  type: "text";
  content: string;
  at: Point;
  // Tamaño de fuente como fracción del ANCHO del lienzo
  sizeRatio: number;
  color: string;
  font?: string;
  // Se mantienen separados porque Canvas/Konva necesita conocer el peso real
  // (Playfair 800 no se ve igual que un simple "bold") y el estilo inclinado.
  fontWeight?: number; // 100..900
  fontStyle?: string; // 'bold' (legado) | 'italic' | 'normal'
  // Tracking relativo al tamaño de fuente: -0.1 equivale a -10% en Figma.
  letterSpacingEm?: number;
  wrap?: "word" | "char" | "none";
  align?: "left" | "center" | "right";
  // Ancho de la caja de texto (necesario para centrar o alinear a la derecha)
  widthRatio?: number;
  lineHeight?: number;
  // false = texto fijo de la plantilla; por defecto es editable
  editable?: boolean;
}

export type TemplateLayer =
  | PhotoSlotLayer
  | FrameLayer
  | ShapeLayer
  | ImageLayer
  | TextLayer;

export interface CanvasTemplateV2 {
  version: 2;
  id?: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  // GLOBAL = viene del catálogo compartido (archivos); PROJECT = guardada en D1
  source?: "GLOBAL" | "PROJECT";
  // Id de la plantilla global de la que se duplicó
  basedOn?: string;
  category?: string;
  thumbnail?: string;
  layers: TemplateLayer[];
}

// ---------------------------------------------------------------------------
// v3: plantillas DOM/React con geometría nativa en píxeles de Figma
// ---------------------------------------------------------------------------

export type PixelRect = [number, number, number, number];

interface DomBaseLayer {
  id: string;
  opacity?: number;
  locked?: boolean;
}

export interface DomPhotoSlotLayer extends DomBaseLayer {
  type: "photo-slot";
  bounds: PixelRect;
  fit?: "cover" | "contain";
  objectPosition?: [number, number];
  zoom?: number;
  role?: "background" | "secondary";
  editable?: boolean;
}

export interface DomShapeLayer extends DomBaseLayer {
  type: "shape";
  bounds: PixelRect;
  shape: "rect" | "pill" | "circle";
  fill?: string;
  gradient?: {
    from: string;
    to: string;
    fromAlpha?: number;
    toAlpha?: number;
    direction?: "vertical" | "horizontal";
  };
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export interface DomImageLayer extends DomBaseLayer {
  type: "image";
  bounds: PixelRect;
  src: string;
  fit?: "contain" | "cover";
  objectPosition?: [number, number];
  editable?: boolean;
  label?: string;
  movable?: boolean;
  resizable?: boolean;
  movementBounds?: PixelRect;
}

export interface DomTextLayer extends DomBaseLayer {
  type: "text";
  bounds: PixelRect;
  content: string;
  color: string;
  font?: string;
  fontSize: number;
  minFontSize?: number;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  letterSpacing?: number;
  lineHeight?: number;
  wrap?: "word" | "char" | "none";
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "center" | "bottom";
  overflow?: "shrink" | "clip";
  editable?: boolean;
  movable?: boolean;
  movementBounds?: PixelRect;
}

export type DomTemplateLayer =
  | DomPhotoSlotLayer
  | DomShapeLayer
  | DomImageLayer
  | DomTextLayer;

export interface CanvasTemplateV3 {
  version: 3;
  id?: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  source?: "GLOBAL" | "PROJECT";
  basedOn?: string;
  category?: string;
  thumbnail?: string;
  layers: DomTemplateLayer[];
}

export type CanvasTemplate = CanvasTemplateV2 | CanvasTemplateV3;

// ---------------------------------------------------------------------------
// v1: el formato que ya está guardado en la tabla `canvas_templates`
// ---------------------------------------------------------------------------

export interface CanvasTemplateLayoutV1 {
  version: number;
  texts: Array<{
    text: string;
    color: string;
    fontSize: number;
    x: number;
    y: number;
  }>;
}

// Ancho del lienzo en pantalla que usaba el editor cuando se guardó v1.
// Las coordenadas v1 están expresadas en ese espacio, así que es la referencia
// para normalizarlas.
export const LEGACY_EDITOR_WIDTH = 320;

export function isTemplateV2(layout: unknown): layout is CanvasTemplateV2 {
  return (
    typeof layout === "object" &&
    layout !== null &&
    (layout as CanvasTemplateV2).version === 2 &&
    Array.isArray((layout as CanvasTemplateV2).layers)
  );
}

export function isTemplateV3(layout: unknown): layout is CanvasTemplateV3 {
  return (
    typeof layout === "object" &&
    layout !== null &&
    (layout as CanvasTemplateV3).version === 3 &&
    Array.isArray((layout as CanvasTemplateV3).layers)
  );
}

/**
 * Convierte un layout v1 (posiciones en píxeles del editor de 320px) al
 * formato v2 normalizado. El resultado se ve idéntico al original: v1
 * exportaba con pixelRatio = width/320, que es justo lo que reproduce
 * multiplicar los ratios por el ancho real.
 */
export function migrateV1ToV2(
  layout: CanvasTemplateLayoutV1,
  meta: { name: string; width: number; height: number; aspectRatio: string }
): CanvasTemplateV2 {
  const legacyHeight = Math.round(
    LEGACY_EDITOR_WIDTH * (meta.height / meta.width)
  );

  const texts = Array.isArray(layout?.texts) ? layout.texts : [];

  return {
    version: 2,
    name: meta.name,
    width: meta.width,
    height: meta.height,
    aspectRatio: meta.aspectRatio,
    source: "PROJECT",
    layers: [
      {
        id: "bg",
        type: "photo-slot",
        role: "background",
        rect: [0, 0, 1, 1],
        fit: "cover"
      },
      ...texts.map((t, idx) => ({
        id: `text-${idx}`,
        type: "text" as const,
        content: t.text,
        at: [t.x / LEGACY_EDITOR_WIDTH, t.y / legacyHeight] as Point,
        sizeRatio: t.fontSize / LEGACY_EDITOR_WIDTH,
        color: t.color || "#FFFFFF",
        fontWeight: 700,
        fontStyle: "normal",
        editable: true
      }))
    ]
  };
}

/**
 * Punto de entrada único: acepta lo que venga guardado (v1, v2 o basura) y
 * siempre devuelve una plantilla v2 utilizable.
 */
export function normalizeTemplate(
  layout: unknown,
  meta: { name: string; width: number; height: number; aspectRatio: string }
): CanvasTemplate {
  if (isTemplateV3(layout)) {
    return {
      ...layout,
      name: layout.name || meta.name,
      width: meta.width,
      height: meta.height,
      aspectRatio: meta.aspectRatio
    };
  }

  if (isTemplateV2(layout)) {
    // Se respetan las capas guardadas pero la medida manda la fila de la BD
    return {
      ...layout,
      name: layout.name || meta.name,
      width: meta.width,
      height: meta.height,
      aspectRatio: meta.aspectRatio
    };
  }

  const v1 = (layout || { version: 1, texts: [] }) as CanvasTemplateLayoutV1;
  return migrateV1ToV2(v1, meta);
}

/**
 * Adapta una plantilla v2 del catálogo al renderer DOM. La definición fuente
 * sigue siendo estructurada (nunca HTML), pero todas las medidas se resuelven
 * una única vez a píxeles nativos para que editor, miniatura y exportación
 * compongan exactamente el mismo árbol DOM.
 *
 * Las plantillas guardadas en proyectos no se convierten implícitamente: v2
 * continúa siendo el formato legado de compatibilidad. Este helper se usa por
 * las plantillas globales que ya fueron aprobadas para el renderer nuevo.
 */
export function toDomTemplate(template: CanvasTemplateV2): CanvasTemplateV3 {
  const rect = ([x, y, width, height]: Rect): PixelRect => [
    Math.round(x * template.width),
    Math.round(y * template.height),
    Math.round(width * template.width),
    Math.round(height * template.height)
  ];

  return {
    ...template,
    version: 3,
    layers: template.layers.map((layer): DomTemplateLayer => {
      if (layer.type === "photo-slot") {
        return {
          id: layer.id,
          type: "photo-slot",
          bounds: rect(layer.rect),
          fit: layer.fit,
          role: layer.role,
          opacity: layer.opacity,
          locked: layer.locked,
          editable: !layer.locked
        };
      }

      if (layer.type === "shape") {
        return {
          id: layer.id,
          type: "shape",
          bounds: rect(layer.rect),
          shape: layer.shape,
          fill: layer.fill,
          gradient: layer.gradient,
          stroke: layer.stroke,
          strokeWidth: layer.strokeRatio ? layer.strokeRatio * template.width : undefined,
          cornerRadius: layer.cornerRatio ? layer.cornerRatio * template.width : undefined,
          opacity: layer.opacity,
          locked: true
        };
      }

      if (layer.type === "image" || layer.type === "frame") {
        const imageRect = layer.type === "frame" ? layer.rect ?? [0, 0, 1, 1] : layer.rect;
        const editable = layer.type === "image" && layer.editable;
        return {
          id: layer.id,
          type: "image",
          bounds: rect(imageRect),
          src: layer.src,
          fit: layer.type === "image" ? layer.fit : "contain",
          editable,
          label: layer.type === "image" ? layer.label : undefined,
          opacity: layer.opacity,
          locked: editable ? false : true
        };
      }

      const fontSize = layer.sizeRatio * template.width;
      const textWidth = (layer.widthRatio ?? Math.max(0.08, 1 - layer.at[0])) * template.width;
      const lineCount = Math.max(1, layer.content.split("\n").length);
      const lineHeight = layer.lineHeight ?? 1.15;
      const textHeight = Math.min(
        template.height - layer.at[1] * template.height,
        Math.max(fontSize * 1.65, fontSize * lineHeight * lineCount * 1.45)
      );

      return {
        id: layer.id,
        type: "text",
        bounds: [
          Math.round(layer.at[0] * template.width),
          Math.round(layer.at[1] * template.height),
          Math.round(textWidth),
          Math.round(textHeight)
        ],
        content: layer.content,
        color: layer.color,
        font: layer.font,
        fontSize,
        minFontSize: Math.max(8, Math.round(fontSize * 0.65)),
        fontWeight: layer.fontWeight ?? (layer.fontStyle === "bold" ? 700 : 400),
        fontStyle: layer.fontStyle === "italic" ? "italic" : "normal",
        letterSpacing: (layer.letterSpacingEm ?? 0) * fontSize,
        lineHeight,
        wrap: layer.wrap,
        align: layer.align,
        overflow: "shrink",
        editable: layer.editable !== false,
        movable: layer.editable !== false,
        opacity: layer.opacity,
        locked: layer.locked
      };
    })
  };
}

/** Plantilla vacía: solo el hueco de la foto de fondo. */
export function createEmptyTemplate(meta: {
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
}): CanvasTemplateV2 {
  return {
    version: 2,
    name: meta.name,
    width: meta.width,
    height: meta.height,
    aspectRatio: meta.aspectRatio,
    source: "PROJECT",
    layers: [
      {
        id: "bg",
        type: "photo-slot",
        role: "background",
        rect: [0, 0, 1, 1],
        fit: "cover"
      }
    ]
  };
}

// ---------------------------------------------------------------------------
// Helpers de coordenadas: normalizado <-> píxeles de un lienzo concreto
// ---------------------------------------------------------------------------

export function denormRect(
  rect: Rect,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: rect[0] * canvasWidth,
    y: rect[1] * canvasHeight,
    width: rect[2] * canvasWidth,
    height: rect[3] * canvasHeight
  };
}

export function denormPoint(
  at: Point,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  return { x: at[0] * canvasWidth, y: at[1] * canvasHeight };
}

export function normPoint(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number
): Point {
  return [x / canvasWidth, y / canvasHeight];
}
