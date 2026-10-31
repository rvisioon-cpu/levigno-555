import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = await getCloudflareContext({ async: true }) as any;
    if (!env || !env.ASSETS_BUCKET) {
      return NextResponse.json({ error: "R2 binding not found" }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as string || "extra";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const key = category.toLowerCase() === "progress" 
      ? `progress/${fileName}` 
      : `media/${category.toLowerCase()}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    await env.ASSETS_BUCKET.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });

    const isDev = !process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.NODE_ENV === 'development';
    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

    let url = "";
    if (isDev) {
      url = `/api/r2/${key}`;
    } else {
      url = `${r2PublicUrl}/${key}`;
    }

    // Persistir las referencias del generador de contenido en la tabla media
    // para que sigan disponibles en sesiones futuras (antes solo iban a R2)
    if (category === "social_reference") {
      const db = await getDb();
      await db.insert(media).values({
        title: file.name,
        url,
        type: file.type,
        category: "SOCIAL_REFERENCE",
        isActive: false,
      });
    }

    return NextResponse.json({
      success: true,
      url,
      key,
      type: file.type,
      name: file.name
    });
  } catch (error: any) {
    console.error("R2 Upload API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
