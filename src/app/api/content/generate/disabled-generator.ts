import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { socialContent, socialContentMessages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { normalizeReferences } from "@/lib/content/references";
import { saveGeneratedImage } from "@/lib/content/media";
import { buildCopySystemPrompt } from "@/lib/content/prompts";
import { generateOpenAIImage, generateOpenAICopy } from "@/lib/content/openai";
import { generateGeminiImage, generateGeminiCopy } from "@/lib/content/gemini";
import { getFallbackImage, getFallbackMessage, getMockResponse } from "@/lib/content/fallback";
import { CopyText } from "@/lib/content/types";

// Endpoint del generador de contenido para RRSS. Orquesta dos flujos:
//   - modo "ia":     genera una imagen (OpenAI Responses API; Gemini opcional)
//   - modo "manual": genera copys publicitarios en JSON para el lienzo
// La lógica de cada motor vive en src/lib/content/*.
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const { prompt, referenceUrls, references, aspectRatio, socialContentId, engine, modo } = body;

    if (!socialContentId) {
      return NextResponse.json({ error: "Missing socialContentId" }, { status: 400 });
    }

    const db = await getDb();
    // OpenAI es el motor por defecto; Gemini queda disponible solo si se solicita
    // explícitamente (deshabilitado en la UI, código conservado para el futuro).
    const selectedEngine = engine === "gemini" ? "gemini" : "openai";
    const workMode = modo === "ia" ? "ia" : "manual";
    // Acepta el formato nuevo (references tipadas) o el antiguo (referenceUrls)
    const refs = normalizeReferences(references ?? referenceUrls);

    // Guardar el mensaje del usuario
    if (prompt) {
      await db.insert(socialContentMessages).values({ socialContentId, sender: "USER", text: prompt });
    }

    // Mantener el estado en DRAFT durante la edición
    await db.update(socialContent).set({ status: "DRAFT", prompt }).where(eq(socialContent.id, socialContentId));

    const { env } = (await getCloudflareContext({ async: true })) as any;
    const geminiKey = env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const openaiKey = env?.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    // --- FLUJO IA: GENERACIÓN DE IMAGEN ---
    if (workMode === "ia") {
      let resultUrl = "";
      let aiResponseText = "";

      try {
        if (selectedEngine === "gemini") {
          if (!geminiKey) throw new Error("GEMINI_API_KEY no configurada");
          const img = await generateGeminiImage(prompt, refs, aspectRatio, geminiKey);
          resultUrl = await saveGeneratedImage(env, img.base64, img.mime, "gemini");
          aiResponseText = img.aiResponse;
        } else {
          if (!openaiKey) throw new Error("OPENAI_API_KEY no configurada");
          const img = await generateOpenAIImage(prompt, refs, aspectRatio, openaiKey);
          resultUrl = await saveGeneratedImage(env, img.base64, img.mime, "openai");
          aiResponseText = img.aiResponse;
        }
      } catch (err) {
        console.error("Error en generación de imagen, usando fallback:", err);
        resultUrl = getFallbackImage(prompt);
        aiResponseText = getFallbackMessage(err, aspectRatio);
      }

      await db.insert(socialContentMessages).values({ socialContentId, sender: "AI", text: aiResponseText });
      return NextResponse.json({ success: true, resultUrl, aiResponse: aiResponseText });
    }

    // --- FLUJO MANUAL: GENERACIÓN DE COPYS ---
    const systemPrompt = buildCopySystemPrompt(prompt);
    let aiResponseText = "";
    let textsToInject: CopyText[] = [];

    try {
      if (selectedEngine === "gemini") {
        if (!geminiKey) throw new Error("GEMINI_API_KEY no configurada");
        const copy = await generateGeminiCopy(prompt, systemPrompt, geminiKey);
        aiResponseText = copy.aiResponse;
        textsToInject = copy.texts;
      } else {
        if (!openaiKey) throw new Error("OPENAI_API_KEY no configurada");
        const copy = await generateOpenAICopy(prompt, systemPrompt, openaiKey);
        aiResponseText = copy.aiResponse;
        textsToInject = copy.texts;
      }
    } catch (err) {
      console.error("Error en generación de copy, usando fallback:", err);
      const mock = getMockResponse(prompt);
      aiResponseText = mock.aiResponse;
      textsToInject = mock.texts;
    }

    await db.insert(socialContentMessages).values({ socialContentId, sender: "AI", text: aiResponseText });
    return NextResponse.json({ success: true, aiResponse: aiResponseText, texts: textsToInject });
  } catch (error: any) {
    console.error("Error general en generate/route.ts:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
