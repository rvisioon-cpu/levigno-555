"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSetting, updateSetting } from "@/app/actions/settings";
import defaultFeaturesJson from "@/data/dashboard-features.json";

export type SidebarFeature = {
  id: string;
  icon: string;
  label: string;
  path: string;
  preloadKey?: string;
  action?: string;
  active: boolean;
};

const defaultSidebarFeatures = defaultFeaturesJson as SidebarFeature[];

/**
 * Best-effort write of the features list. Only a SUPER_ADMIN session may
 * persist settings, so anonymous visitors simply keep the in-memory defaults
 * instead of failing the whole read path.
 */
async function persistFeatures(features: SidebarFeature[]): Promise<void> {
  try {
    await updateSetting("sidebar_features_list", features);
  } catch {
    // Not authorized (public visitor) or the write failed; defaults still apply.
  }
}

import { connection } from "next/server";

/**
 * Returns the sidebar features list.
 * @param includeHidden - When true (e.g. for the dashboard), the video feature is
 *   always included even if no VIDEO_SIDEBAR media is currently active.
 *   When false (default, e.g. for the public sidebar), the video entry is
 *   hidden whenever there is no active video to show.
 */
export async function getFeatures(includeHidden = false): Promise<SidebarFeature[]> {
  await connection();
  try {
    let dbFeatures = await getSetting("sidebar_features_list");
    
    // Seed database if not existing.
    // Persisting is opportunistic: updateSetting requires a SUPER_ADMIN session,
    // so it throws for public visitors. That must not abort getFeatures, because
    // the catch below strips /video and the entry would silently disappear from
    // the public sidebar.
    if (!dbFeatures || !Array.isArray(dbFeatures) || dbFeatures.length === 0) {
      await persistFeatures(defaultSidebarFeatures);
      dbFeatures = defaultSidebarFeatures;
    } else {
      // Ensure all default features exist in dbFeatures (such as new features added later)
      let changed = false;
      defaultSidebarFeatures.forEach(defaultFeat => {
        const exists = dbFeatures.some((f: SidebarFeature) => f.id === defaultFeat.id);
        if (!exists) {
          dbFeatures.push(defaultFeat);
          changed = true;
        }
      });
      if (changed) {
        await persistFeatures(dbFeatures);
      }
    }
    
    // Si no hay video activo, esconde la opción en el sidebar público.
    // El dashboard (includeHidden=true) siempre recibe todos los features
    // para que el administrador pueda activar/desactivar el módulo.
    if (!includeHidden) {
      const { getActiveMedia } = await import("@/app/actions/media");
      const activeVideo = await getActiveMedia("VIDEO_SIDEBAR");
      if (!activeVideo || activeVideo.length === 0) {
        dbFeatures = dbFeatures.filter((f: SidebarFeature) => f.path !== "/video");
      }
    }

    return dbFeatures;
  } catch (error) {
    console.error("Error reading features from DB:", error);
    // En caso de error en el sidebar público, ocultamos el video por seguridad.
    if (includeHidden) return defaultSidebarFeatures;
    return defaultSidebarFeatures.filter(f => f.path !== "/video");
  }
}

export async function updateFeature(id: string, updates: Partial<SidebarFeature>) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede editar características.");
  }

  try {
    const currentFeatures = await getFeatures();
    
    const newFeatures = currentFeatures.map(feat => 
      feat.id === id ? { ...feat, ...updates } : feat
    );

    await updateSetting("sidebar_features_list", newFeatures);
    
    revalidatePath("/", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Error updating features in DB:", error);
    throw new Error("Failed to update feature");
  }
}

export async function reorderFeatures(newOrderedFeatures: SidebarFeature[]) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede ordenar características.");
  }

  try {
    await updateSetting("sidebar_features_list", newOrderedFeatures);
    
    revalidatePath("/", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Error reordering features in DB:", error);
    throw new Error("Failed to reorder features");
  }
}
