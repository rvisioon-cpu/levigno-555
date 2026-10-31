export function normalizeCategory(cat: string): string {
  const map: Record<string, string> = {
    lifestyle: "Lifestyle",
    comercio: "Comercio",
    educación: "Educación",
    educacion: "Educación",
    "áreas verdes y recreación": "Áreas verdes y Recreación",
    "areas verdes y recreacion": "Áreas verdes y Recreación",
    finanzas: "Finanzas",
    restaurantes: "Restaurantes",
    "salud y bienestar": "Salud y bienestar",
    otros: "Otros",
  };
  return map[cat.toLowerCase().trim()] || cat;
}
