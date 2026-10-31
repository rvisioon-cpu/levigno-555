// Identidad del proyecto expuesta a las plantillas de lienzo.
//
// Una plantilla del catálogo es genérica: no conoce colores ni logos. Escribe
// tokens ({{brand.primary}}, {{brand.logoWhite}}, {{project.buildingName}}) y
// aquí se resuelven con la identidad del proyecto en el que corre. Ese es el
// mecanismo que permite que la misma plantilla sirva en cualquier proyecto.

import config from "@/config/config";

export interface BrandTokens {
  // Colores
  primary: string;
  secondary: string;
  onPrimary: string; // color de texto legible sobre `primary`
  light: string;
  dark: string;
  // Tipografías (nombres de familia CSS ya cargadas por la app)
  display: string;
  body: string;
  script: string;
  // Logos (rutas same-origin dentro de /public)
  logoHorizontal: string;
  logoWhite: string;
  logoBlack: string;
  isotipo: string;
  isotipoWhite: string;
}

export interface ProjectTokens {
  name: string;
  buildingName: string;
  buildingAddress: string;
  developer: string;
  realState: string;
  website: string;
  email: string;
  slogan: string;
}

export interface BrandContext {
  brand: BrandTokens;
  project: ProjectTokens;
}

// Lo que guarda /dashboard/identity en globalSettings("identity")
export interface IdentitySetting {
  primaryColor?: string;
  secondaryColor?: string;
  typography?: string;
  logoHorizontal?: string;
  logoWhite?: string;
  logoBlack?: string;
  isotipo?: string;
  isotipoWhite?: string;
}

/**
 * Elige negro o blanco según la luminancia del color de fondo, para que el
 * texto sobre la píldora del CTA siempre se lea.
 */
export function readableOn(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#FFFFFF";
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  // Luminancia relativa (WCAG)
  const channel = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const L = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  return L > 0.45 ? "#111111" : "#FFFFFF";
}

/**
 * Convierte un color a rgba() con la opacidad dada. Los degradados que se
 * desvanecen necesitan que el color final sea el MISMO color con alfa 0: si se
 * usa "transparent", el navegador interpola pasando por negro y ensucia la
 * mezcla.
 */
export function withAlpha(color: string, alpha: number): string {
  if (alpha >= 1) return color;
  const clean = color.replace("#", "");
  if (clean.length !== 6) return color;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Construye el contexto de marca combinando la config estática del proyecto
 * con lo que el admin haya guardado en /dashboard/identity (que manda).
 */
export function buildBrandContext(identity?: IdentitySetting | null): BrandContext {
  const primary = identity?.primaryColor || config.colors.main || "#F59C1D";
  const secondary = identity?.secondaryColor || "#1F3D64";

  return {
    brand: {
      primary,
      secondary,
      onPrimary: readableOn(primary),
      light: "#FFFFFF",
      dark: "#111111",
      display: identity?.typography || "Montserrat",
      body: "Inter",
      script: "Georgia",
      logoHorizontal:
        identity?.logoHorizontal || "identity/livigno-logo.png",
      logoWhite: identity?.logoWhite || "identity/livigno-logo-negative.png",
      logoBlack: identity?.logoBlack || "identity/livigno-logo.png",
      isotipo: identity?.isotipo || "/identity/livigno-logo.png",
      isotipoWhite:
        identity?.isotipoWhite || "/identity/livigno-logo-negative.png"
    },
    project: {
      name: config.appName,
      buildingName: config.company.buildingName,
      buildingAddress: config.company.buildingAddress,
      developer: config.company.developer,
      realState: config.company.realStateName,
      website: config.company.website,
      email: config.company.email,
      slogan: config.company.realStateSlogan
    }
  };
}

const TOKEN_RE = /\{\{\s*(brand|project)\.([a-zA-Z0-9_]+)\s*\}\}/g;

/**
 * Reemplaza los tokens de un valor de la plantilla. Si el token no existe se
 * deja el texto tal cual, para que el fallo sea visible en el editor y no un
 * valor vacío silencioso.
 */
export function resolveToken(
  value: string | undefined,
  ctx: BrandContext
): string {
  if (!value) return "";
  return value.replace(TOKEN_RE, (match, scope: string, key: string) => {
    const bag = (scope === "brand" ? ctx.brand : ctx.project) as unknown as Record<string, string>;
    const resolved = bag[key];
    return resolved !== undefined ? resolved : match;
  });
}
