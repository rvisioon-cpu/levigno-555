"use server";

import { getDb } from "@/lib/db";
import { canvasTemplates } from "@/lib/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { auth } from "@/auth";
import {
  normalizeTemplate,
  type CanvasTemplate,
  type CanvasTemplateLayoutV1
} from "@/lib/content/template-schema";

// Verificar si el rol es SUPER_ADMIN o ADMIN
async function verifyAdminAccess() {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  const role = session.user.role as string;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    throw new Error("Unauthorized: Solo administradores tienen acceso a este módulo.");
  }
  return session.user;
}

// Alias legado: el formato viejo de layout (solo textos en píxeles del editor).
// Se mantiene exportado porque el dashboard todavía lo referencia.
export type CanvasTemplateLayout = CanvasTemplateLayoutV1;

export type StoredCanvasTemplate = {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  createdAt: Date | null;
  // Siempre normalizado a un formato compatible, sin importar cómo se guardó.
  template: CanvasTemplate;
};

export async function getCanvasTemplates(): Promise<StoredCanvasTemplate[]> {
  await verifyAdminAccess();
  const db = await getDb();

  const rows = await db
    .select()
    .from(canvasTemplates)
    .where(isNull(canvasTemplates.deletedAt))
    .orderBy(desc(canvasTemplates.createdAt));

  // Las plantillas guardadas con el formato v1 se migran al vuelo: no hace
  // falta tocar la base de datos ni perder lo que el usuario ya guardó.
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    width: row.width,
    height: row.height,
    aspectRatio: row.aspectRatio,
    createdAt: row.createdAt,
    template: {
      ...normalizeTemplate(row.layout, {
        name: row.name,
        width: row.width,
        height: row.height,
        aspectRatio: row.aspectRatio
      }),
      id: row.id,
      source: "PROJECT" as const
    }
  }));
}

export async function createCanvasTemplate(
  name: string,
  width: number,
  height: number,
  aspectRatio: string,
  layout: CanvasTemplate | CanvasTemplateLayoutV1
) {
  const user = await verifyAdminAccess();
  const db = await getDb();

  // v1 se migra a v2; las plantillas DOM v3 conservan su geometría nativa.
  const normalized = normalizeTemplate(layout, {
    name: name.trim(),
    width,
    height,
    aspectRatio
  });

  const [created] = await db
    .insert(canvasTemplates)
    .values({
      name: name.trim(),
      width,
      height,
      aspectRatio,
      layout: normalized,
      createdBy: user.id as string,
    })
    .returning();

  return created;
}

export async function deleteCanvasTemplate(id: string) {
  await verifyAdminAccess();
  const db = await getDb();

  await db
    .update(canvasTemplates)
    .set({ deletedAt: new Date() })
    .where(eq(canvasTemplates.id, id));

  return { success: true };
}
