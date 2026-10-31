// Konva dibuja el texto con la fuente que esté cargada EN ESE INSTANTE. Si el
// navegador todavía no descargó la familia, el lienzo se exporta con la fuente
// de respaldo aunque en pantalla ya se vea bien unos milisegundos después.
// Por eso hay que esperar explícitamente antes de `toDataURL`.

export interface CanvasFontRequest {
  family: string;
  weights?: number[];
  styles?: Array<"normal" | "italic">;
}

export const CANVAS_GOOGLE_FONTS = [
  "Poppins",
  "Playfair Display",
  "Montserrat",
  "Inter",
  "Roboto",
  "Outfit",
  "Open Sans",
  "DM Sans",
  "Lora"
] as const;

const stylesheetPromises = new Map<string, Promise<void>>();
const LOCAL_OR_GENERIC_FONTS = new Set([
  "Arial",
  "Georgia",
  "Garet",
  "Helvetica",
  "Times New Roman",
  "cursive",
  "fantasy",
  "monospace",
  "sans-serif",
  "serif",
  "system-ui"
]);

function normalizeRequests(
  requests: Array<string | CanvasFontRequest>
): CanvasFontRequest[] {
  const merged = new Map<string, { weights: Set<number>; styles: Set<"normal" | "italic"> }>();

  requests.forEach((request) => {
    const family = primaryFamily(typeof request === "string" ? request : request.family);
    if (!family) return;
    const current = merged.get(family) ?? { weights: new Set<number>(), styles: new Set<"normal" | "italic">() };
    const weights = typeof request === "string" ? [400, 700] : request.weights ?? [400];
    const styles = typeof request === "string" ? ["normal" as const] : request.styles ?? ["normal" as const];
    weights.forEach((weight) => current.weights.add(Math.max(100, Math.min(900, weight))));
    styles.forEach((style) => current.styles.add(style));
    merged.set(family, current);
  });

  return Array.from(merged, ([family, value]) => ({
    family,
    weights: Array.from(value.weights).sort((a, b) => a - b),
    styles: Array.from(value.styles).sort()
  }));
}

function googleFontsHref(requests: CanvasFontRequest[]): string {
  const families = requests.map((request) => {
    const family = encodeURIComponent(request.family).replace(/%20/g, "+");
    const weights = request.weights ?? [400];
    const styles = request.styles ?? ["normal"];

    if (styles.includes("italic")) {
      const variants = styles
        .flatMap((style) => weights.map((weight) => `${style === "italic" ? 1 : 0},${weight}`))
        .sort()
        .join(";");
      return `family=${family}:ital,wght@${variants}`;
    }

    return `family=${family}:wght@${weights.join(";")}`;
  });

  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

function loadGoogleStylesheet(requests: CanvasFontRequest[]): Promise<void> {
  if (requests.length === 0) return Promise.resolve();
  const href = googleFontsHref(requests);
  const cached = stylesheetPromises.get(href);
  if (cached) return cached;

  const promise = new Promise<void>((resolve) => {
    const existing = Array.from(document.querySelectorAll<HTMLLinkElement>('link[data-canvas-fonts="google"]'))
      .find((link) => link.href === href);
    if (existing) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.canvasFonts = "google";
    link.onload = () => resolve();
    // La exportación no debe quedar bloqueada si Google Fonts no responde.
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });

  stylesheetPromises.set(href, promise);
  return promise;
}

/**
 * Carga bajo demanda las variantes de Google Fonts usadas por cada texto y
 * espera a que Canvas pueda dibujarlas. Acepta strings por compatibilidad con
 * las llamadas existentes o descriptores con peso/estilo exactos.
 */
export async function ensureFontsLoaded(
  requests: Array<string | CanvasFontRequest>,
  sizePx = 64
): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;

  const normalized = normalizeRequests(requests);

  try {
    await loadGoogleStylesheet(
      normalized.filter(({ family }) => !LOCAL_OR_GENERIC_FONTS.has(family))
    );
    await Promise.all(
      normalized.flatMap(({ family, weights = [400], styles = ["normal"] }) =>
        styles.flatMap((style) =>
          weights.map((weight) =>
            document.fonts.load(`${style} ${weight} ${sizePx}px "${family}"`)
          )
        )
      )
    );
    await document.fonts.ready;
  } catch (error) {
    console.warn("No se pudieron precargar las tipografías del lienzo:", error);
  }
}

/** Extrae la primera familia de un stack CSS ('Inter, sans-serif' -> 'Inter'). */
export function primaryFamily(stack: string): string {
  return (stack || "")
    .split(",")[0]
    .trim()
    .replace(/^['"]|['"]$/g, "");
}
