"use server";

import { getSetting } from "@/app/actions/settings";
import { buildBrandContext, type BrandContext } from "@/lib/content/brand";

/**
 * Contexto de marca del proyecto para resolver los tokens de las plantillas.
 * Si la identidad todavía no está configurada en la BD, cae a los valores de
 * `src/config/config.ts`.
 */
export async function getBrandContext(): Promise<BrandContext> {
  try {
    const identity = await getSetting("identity");
    return buildBrandContext(identity);
  } catch (error) {
    console.error("Error loading identity settings for brand context:", error);
    return buildBrandContext(null);
  }
}
