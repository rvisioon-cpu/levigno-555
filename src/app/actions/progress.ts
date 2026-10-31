"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { constructionProgress } from "@/lib/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getProgressUpdates() {
  const db = await getDb();
  
  // Fetch active progress updates ordered by date descending
  const updates = await db
    .select()
    .from(constructionProgress)
    .where(isNull(constructionProgress.deletedAt))
    .orderBy(desc(constructionProgress.date));

  return updates;
}

export async function createProgressUpdate(data: {
  title: string;
  year: number;
  month: number;
  mediaUrl: string;
  description?: string;
}) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized: Solo administradores pueden crear avances de obra.");
  }

  const db = await getDb();
  const dateVal = new Date(data.year, data.month - 1, 1);

  const [newUpdate] = await db
    .insert(constructionProgress)
    .values({
      title: data.title,
      date: dateVal,
      mediaUrl: data.mediaUrl,
      description: data.description || "",
    })
    .returning();

  revalidatePath("/dashboard/progress");
  revalidatePath("/avance-de-obra");
  return newUpdate;
}

export async function updateProgressUpdate(
  id: string,
  data: {
    title: string;
    year: number;
    month: number;
    mediaUrl: string;
    description?: string;
  }
) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized: Solo administradores pueden editar avances de obra.");
  }

  const db = await getDb();
  const dateVal = new Date(data.year, data.month - 1, 1);

  const [updatedUpdate] = await db
    .update(constructionProgress)
    .set({
      title: data.title,
      date: dateVal,
      mediaUrl: data.mediaUrl,
      description: data.description || "",
    })
    .where(eq(constructionProgress.id, id))
    .returning();

  revalidatePath("/dashboard/progress");
  revalidatePath("/avance-de-obra");
  return updatedUpdate;
}

export async function deleteProgressUpdate(id: string) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized: Solo administradores pueden eliminar avances de obra.");
  }

  const db = await getDb();
  await db
    .update(constructionProgress)
    .set({ deletedAt: new Date() })
    .where(eq(constructionProgress.id, id));

  revalidatePath("/dashboard/progress");
  revalidatePath("/avance-de-obra");
  return { success: true };
}

export async function uploadMedia(formData: FormData) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized: Solo administradores pueden subir archivos.");
  }

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  // Subida real a R2 (antes era un stub mock que devolvía una URL sin subir el
  // archivo, por eso los avances de obra daban 404). La clave usa el prefijo
  // "progress/" para mantener la convención existente en la base de datos.
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const key = `progress/${fileName}`;

  const { env } = (await getCloudflareContext({ async: true })) as any;
  if (!env?.ASSETS_BUCKET) {
    throw new Error("No se pudo subir a R2. Verifica el binding de R2 en Cloudflare Pages.");
  }

  const arrayBuffer = await file.arrayBuffer();
  await env.ASSETS_BUCKET.put(key, arrayBuffer, {
    httpMetadata: { contentType: file.type },
  });

  const isDev = process.env.NODE_ENV === "development";
  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  return isDev ? `/api/r2/${key}` : `${r2PublicUrl}/${key}`;
}
