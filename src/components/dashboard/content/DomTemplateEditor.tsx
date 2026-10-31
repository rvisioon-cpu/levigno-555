"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toJpeg } from "html-to-image";
import { ArrowDown, ArrowUp, Check, ImageOff, Loader2, Plus, RefreshCw, Save, Trash2, Type } from "lucide-react";
import { createCanvasTemplate } from "@/app/actions/templates";
import { TEMPLATE_LOGOS } from "@/data/canvas-templates/logos";
import { buildBrandContext, resolveToken, type BrandContext } from "@/lib/content/brand";
import { CANVAS_GOOGLE_FONTS, ensureFontsLoaded, primaryFamily } from "@/lib/content/fonts";
import {
  type CanvasTemplateV3,
  type DomImageLayer,
  type DomPhotoSlotLayer,
  type DomTemplateLayer,
  type DomTextLayer,
  type PixelRect
} from "@/lib/content/template-schema";
import MediaSidebar from "./MediaSidebar";
import DomTemplateRenderer, {
  type DomSlotAdjustment,
  type DomTemplateRenderState,
  type DomTextOverride
} from "./DomTemplateRenderer";

interface DomTemplateEditorProps {
  mediaUrls: string[];
  aspectRatio: string;
  targetWidth: number;
  targetHeight: number;
  initialTexts: Array<{ text: string; color: string; fontSize: number }>;
  template: CanvasTemplateV3;
  brand?: BrandContext | null;
  showMediaBar?: boolean;
  onSave: (imageBase64: string) => void;
  isSaving: boolean;
}

const VIEWPORT_WIDTH = 720;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(images.map(async (image) => {
    if (image.complete && image.naturalWidth > 0) return;
    await image.decode();
  }));
}

export default function DomTemplateEditor({
  mediaUrls,
  aspectRatio,
  targetWidth,
  targetHeight,
  initialTexts,
  template,
  brand,
  showMediaBar,
  onSave,
  isSaving
}: DomTemplateEditorProps) {
  const brandCtx = brand ?? buildBrandContext(null);
  const scale = VIEWPORT_WIDTH / template.width;
  const viewportHeight = Math.round(template.height * scale);
  const nativeCanvasRef = useRef<HTMLDivElement>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [slotMedia, setSlotMedia] = useState<Record<string, string>>({});
  const [slotAdjustments, setSlotAdjustments] = useState<Record<string, DomSlotAdjustment>>({});
  const [textOverrides, setTextOverrides] = useState<Record<string, DomTextOverride>>({});
  const [imageOverrides, setImageOverrides] = useState<Record<string, string | null>>({});
  const [extraLayers, setExtraLayers] = useState<Array<DomImageLayer | DomTextLayer>>([]);
  const [textOverflow, setTextOverflow] = useState<Record<string, boolean>>({});
  const [assetStates, setAssetStates] = useState<Record<string, "loading" | "loaded" | "failed">>({});
  const [isExporting, setIsExporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const photoSlots = useMemo(
    () => template.layers.filter((layer): layer is DomPhotoSlotLayer => layer.type === "photo-slot"),
    [template.layers]
  );

  useEffect(() => {
    setSlotMedia(Object.fromEntries(photoSlots.map((slot, index) => [slot.id, mediaUrls[index] || ""])));
    setSlotAdjustments(Object.fromEntries(photoSlots.map((slot) => [slot.id, {
      x: slot.objectPosition?.[0] ?? 50,
      y: slot.objectPosition?.[1] ?? 50,
      zoom: slot.zoom ?? 1
    }])));
    setExtraLayers(mediaUrls.slice(photoSlots.length).map((url, index) => ({
      id: `extra-image-${index}-${url.slice(-16)}`,
      type: "image" as const,
      src: url,
      bounds: [80 + index * 30, 80 + index * 30, 360, 360] as PixelRect,
      fit: "cover" as const,
      editable: true,
      movable: true,
      resizable: true,
      label: "Imagen añadida"
    })));
    setTextOverrides({});
    setImageOverrides({});
    setTextOverflow({});
    setAssetStates({});
    setSelectedLayerId(null);
  }, [mediaUrls, photoSlots, template.id]);

  useEffect(() => {
    if (!initialTexts.length) return;
    setExtraLayers((previous) => {
      const withoutAi = previous.filter((layer) => !layer.id.startsWith("extra-ai-"));
      return [
        ...withoutAi,
        ...initialTexts.map((text, index): DomTextLayer => ({
          id: `extra-ai-${index}`,
          type: "text",
          content: text.text,
          color: text.color || "#FFFFFF",
          bounds: [80, 120 + index * 100, 700, 90],
          font: brandCtx.brand.display,
          fontSize: text.fontSize,
          minFontSize: 16,
          fontWeight: 700,
          lineHeight: 1,
          overflow: "shrink",
          editable: true,
          movable: true
        }))
      ];
    });
  }, [brandCtx.brand.display, initialTexts]);

  const allLayers = useMemo<DomTemplateLayer[]>(
    () => [...template.layers, ...extraLayers],
    [extraLayers, template.layers]
  );
  const selectedLayer = allLayers.find((layer) => layer.id === selectedLayerId);
  const selectedText = selectedLayer?.type === "text" ? selectedLayer : null;
  const selectedSlot = selectedLayer?.type === "photo-slot" ? selectedLayer : null;
  const selectedImage = selectedLayer?.type === "image" ? selectedLayer : null;
  const isSelectedLogo = Boolean(selectedImage?.editable && (selectedImage.id.toLowerCase().includes("logo") || selectedImage.label?.toLowerCase().includes("logo")));
  const selectedImageSource = selectedImage
    ? (imageOverrides[selectedImage.id] === undefined ? selectedImage.src : imageOverrides[selectedImage.id])
    : null;
  const hasOverflow = Object.values(textOverflow).some(Boolean);
  const hasFailedAsset = Object.values(assetStates).some((status) => status === "failed");
  const hasLoadingAsset = Object.values(assetStates).some((status) => status === "loading");

  const renderState: DomTemplateRenderState = {
    slotMedia,
    slotAdjustments,
    imageOverrides,
    textOverrides,
    extraLayers
  };

  const handleTextOverflow = useCallback((id: string, overflowing: boolean) => {
    setTextOverflow((previous) => previous[id] === overflowing ? previous : { ...previous, [id]: overflowing });
  }, []);
  const handleAssetStatus = useCallback((id: string, status: "loading" | "loaded" | "failed") => {
    setAssetStates((previous) => previous[id] === status ? previous : { ...previous, [id]: status });
  }, []);

  const updateText = (id: string, changes: DomTextOverride) => {
    setTextOverrides((previous) => ({
      ...previous,
      [id]: { ...previous[id], ...changes }
    }));
  };

  const updateExtraImageBounds = (id: string, bounds: PixelRect) => {
    setExtraLayers((previous) => previous.map((layer) =>
      layer.id === id && layer.type === "image" ? { ...layer, bounds } : layer
    ));
  };

  const addText = () => {
    const id = `extra-text-${Date.now()}`;
    setExtraLayers((previous) => [...previous, {
      id,
      type: "text",
      content: "Escribe aquí",
      color: "#FFFFFF",
      bounds: [190, 600, 700, 100],
      font: brandCtx.brand.display,
      fontSize: 54,
      minFontSize: 18,
      fontWeight: 700,
      lineHeight: 1,
      overflow: "shrink",
      editable: true,
      movable: true
    }]);
    setSelectedLayerId(id);
  };

  const removeSelected = () => {
    if (!selectedLayerId) return;
    if (selectedLayerId.startsWith("extra-")) {
      setExtraLayers((previous) => previous.filter((layer) => layer.id !== selectedLayerId));
      setTextOverflow((previous) => {
        const next = { ...previous };
        delete next[selectedLayerId];
        return next;
      });
    } else if (selectedImage?.editable) {
      setImageOverrides((previous) => ({ ...previous, [selectedLayerId]: null }));
    }
    setSelectedLayerId(null);
  };

  const moveSelectedExtraLayer = (position: "front" | "back") => {
    if (!selectedLayerId?.startsWith("extra-")) return;
    setExtraLayers((previous) => {
      const layer = previous.find((item) => item.id === selectedLayerId);
      if (!layer) return previous;
      const remaining = previous.filter((item) => item.id !== selectedLayerId);
      return position === "front" ? [...remaining, layer] : [layer, ...remaining];
    });
  };

  const nativePointFromDrop = (event: React.DragEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale
    };
  };

  const placeImage = (url: string, x: number, y: number) => {
    const slot = [...photoSlots].reverse().find((item) => {
      const [left, top, width, height] = item.bounds;
      return x >= left && x <= left + width && y >= top && y <= top + height;
    });
    if (slot) {
      setSlotMedia((previous) => ({ ...previous, [slot.id]: url }));
      setSelectedLayerId(slot.id);
      return;
    }
    const editableImage = [...template.layers].reverse().find((item): item is DomImageLayer => {
      if (item.type !== "image" || !item.editable) return false;
      const [left, top, width, height] = item.bounds;
      return x >= left && x <= left + width && y >= top && y <= top + height;
    });
    if (editableImage) {
      setImageOverrides((previous) => ({ ...previous, [editableImage.id]: url }));
      setSelectedLayerId(editableImage.id);
      return;
    }
    const id = `extra-image-${Date.now()}`;
    setExtraLayers((previous) => [...previous, {
      id,
      type: "image",
      src: url,
      bounds: [Math.max(0, Math.min(template.width - 320, x - 160)), Math.max(0, Math.min(template.height - 320, y - 160)), 320, 320],
      fit: "cover",
      editable: true,
      movable: true,
      resizable: true,
      label: "Imagen añadida"
    }]);
    setSelectedLayerId(id);
  };

  const uploadFile = async (file: File, x: number, y: number) => {
    if (!file.type.startsWith("image/")) {
      setFeedback("Solo puedes soltar archivos de imagen.");
      return;
    }
    setIsUploading(true);
    setFeedback("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "social_reference");
      const response = await fetch("/api/r2/upload", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok || !payload.success || !payload.url) throw new Error(payload.error || "No se pudo subir la imagen.");
      placeImage(payload.url, x, y);
      window.dispatchEvent(new CustomEvent("content-media-uploaded", {
        detail: { id: payload.key, title: payload.name || file.name, url: payload.url }
      }));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo subir la imagen.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const point = nativePointFromDrop(event);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void uploadFile(file, point.x, point.y);
      return;
    }
    const url = event.dataTransfer.getData("text/plain");
    if (url) placeImage(url, point.x, point.y);
  };

  const composeTemplate = (name: string): CanvasTemplateV3 => ({
    ...template,
    name,
    source: "PROJECT",
    basedOn: template.id,
    layers: [
      ...template.layers.map((layer): DomTemplateLayer => {
        if (layer.type === "photo-slot" && slotAdjustments[layer.id]) {
          const adjustment = slotAdjustments[layer.id];
          return { ...layer, objectPosition: [adjustment.x, adjustment.y], zoom: adjustment.zoom };
        }
        if (layer.type === "text" && textOverrides[layer.id]) return { ...layer, ...textOverrides[layer.id] };
        if (layer.type === "image" && Object.prototype.hasOwnProperty.call(imageOverrides, layer.id)) {
          return { ...layer, src: imageOverrides[layer.id] ?? "" };
        }
        return layer;
      }),
      ...extraLayers
    ]
  });

  const saveAsTemplate = async () => {
    if (!templateName.trim() || isSavingTemplate) return;
    setIsSavingTemplate(true);
    setFeedback("");
    try {
      await createCanvasTemplate(templateName.trim(), targetWidth, targetHeight, aspectRatio, composeTemplate(templateName.trim()));
      setTemplateName("");
      setFeedback("¡Plantilla guardada! La encontrarás en Mis Plantillas.");
    } catch (error) {
      console.error("Error saving DOM template", error);
      setFeedback("No se pudo guardar la plantilla.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const exportImage = async () => {
    if (!nativeCanvasRef.current || hasOverflow || hasFailedAsset || hasLoadingAsset) return;
    setIsExporting(true);
    setFeedback("");
    try {
      const textLayers = allLayers.filter((layer): layer is DomTextLayer => layer.type === "text");
      await ensureFontsLoaded(textLayers.map((layer) => ({
        family: primaryFamily(textOverrides[layer.id]?.font ?? resolveToken(layer.font, brandCtx) ?? "sans-serif"),
        weights: [textOverrides[layer.id]?.fontWeight ?? layer.fontWeight ?? 400],
        styles: [(textOverrides[layer.id]?.fontStyle ?? layer.fontStyle) === "italic" ? "italic" as const : "normal" as const]
      })));
      await waitForImages(nativeCanvasRef.current);
      await nextFrame();
      const dataUrl = await toJpeg(nativeCanvasRef.current, {
        width: template.width,
        height: template.height,
        canvasWidth: template.width,
        canvasHeight: template.height,
        pixelRatio: 1,
        quality: 0.95,
        backgroundColor: "#FFFFFF",
        cacheBust: true
      });
      onSave(dataUrl);
    } catch (error) {
      console.error("Error exporting DOM template", error);
      setFeedback("No se pudo exportar: revisa que todas las imágenes y fuentes estén disponibles.");
    } finally {
      setIsExporting(false);
    }
  };

  const selectedTextOverride = selectedText ? textOverrides[selectedText.id] ?? {} : {};
  const selectedSlotAdjustment = selectedSlot ? slotAdjustments[selectedSlot.id] : undefined;
  const exportBlockedReason = hasOverflow
    ? "Hay texto que no cabe en su caja. Acórtalo o reduce su tamaño."
    : hasFailedAsset
      ? "Una imagen o icono no pudo cargarse."
      : hasLoadingAsset
        ? "Espera a que terminen de cargar las imágenes."
        : "";

  return (
    <div className="flex w-full flex-col items-start gap-4 xl:flex-row">
      <div className="mx-auto flex flex-col items-center gap-4 rounded-2xl border border-base-200 bg-gray-50 p-5 shadow-inner">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Mesa de Trabajo ({targetWidth}x{targetHeight} px) · HTML
        </span>
        <div
          className={`relative overflow-hidden rounded-lg border bg-white shadow-lg ${isDragOver ? "border-brand-orange ring-4 ring-orange-100" : "border-gray-200"}`}
          style={{ width: VIEWPORT_WIDTH, height: viewportHeight }}
          onDragOver={(event) => { event.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          {(isUploading || isExporting) && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-white/80 text-brand-orange">
              <Loader2 className="h-7 w-7 animate-spin" />
              <span className="text-xs font-semibold">{isExporting ? "Generando imagen…" : "Subiendo imagen…"}</span>
            </div>
          )}
          <div style={{ width: template.width, height: template.height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <div ref={nativeCanvasRef} style={{ width: template.width, height: template.height }}>
              <DomTemplateRenderer
                template={template}
                brand={brandCtx}
                state={renderState}
                interactive={!isExporting}
                selectedLayerId={isExporting ? null : selectedLayerId}
                onSelectLayer={setSelectedLayerId}
                onMoveText={(id, bounds) => updateText(id, { bounds })}
                onChangeImageBounds={updateExtraImageBounds}
                onTextOverflow={handleTextOverflow}
                onAssetStatus={handleAssetStatus}
              />
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] font-medium text-gray-400">
          La vista y la exportación usan el mismo HTML a resolución nativa.
        </p>
      </div>

      <div className="flex w-full flex-col gap-4 rounded-2xl border border-base-200 bg-white p-4 xl:w-[310px] xl:flex-none">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-800">
          <Type className="h-4 w-4 text-brand-orange" /> Herramientas de diseño
        </h3>
        <div className="flex gap-2">
          <button onClick={addText} className="btn btn-sm btn-outline flex-1 gap-1 border-base-300 text-xs">
            <Plus className="h-3.5 w-3.5 text-brand-orange" /> Añadir texto
          </button>
          {selectedLayerId && (selectedLayerId.startsWith("extra-") || selectedImage?.editable) && (
            <button onClick={removeSelected} className="btn btn-sm btn-outline border-red-200 text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {selectedLayerId?.startsWith("extra-") && (
          <div className="flex gap-2 rounded-xl border border-base-200 bg-gray-50/50 p-2">
            <button onClick={() => moveSelectedExtraLayer("front")} className="btn btn-xs flex-1 border-base-300 bg-white text-xs text-gray-600 hover:border-brand-orange hover:text-brand-orange">
              <ArrowUp className="h-3.5 w-3.5" /> Traer al frente
            </button>
            <button onClick={() => moveSelectedExtraLayer("back")} className="btn btn-xs flex-1 border-base-300 bg-white text-xs text-gray-600 hover:border-brand-orange hover:text-brand-orange">
              <ArrowDown className="h-3.5 w-3.5" /> Enviar atrás
            </button>
          </div>
        )}

        {selectedText ? (
          <div className="flex flex-col gap-3 rounded-xl border border-base-200 bg-gray-50/50 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Texto seleccionado</span>
            <textarea
              rows={3}
              value={selectedTextOverride.content ?? resolveToken(selectedText.content, brandCtx)}
              onChange={(event) => updateText(selectedText.id, { content: event.target.value })}
              className="textarea textarea-sm min-h-20 resize-y rounded-lg border-base-300 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-[10px] font-semibold text-gray-500">
                Fuente
                <select
                  value={primaryFamily(selectedTextOverride.font ?? resolveToken(selectedText.font, brandCtx) ?? brandCtx.brand.display)}
                  onChange={(event) => updateText(selectedText.id, { font: event.target.value })}
                  className="select select-xs w-full border-base-300 bg-white text-xs"
                >
                  {Array.from(new Set([primaryFamily(resolveToken(selectedText.font, brandCtx) || brandCtx.brand.display), ...CANVAS_GOOGLE_FONTS])).map((font) => <option key={font}>{font}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[10px] font-semibold text-gray-500">
                Tamaño
                <input
                  type="number"
                  min={selectedText.minFontSize ?? 8}
                  max={300}
                  value={selectedTextOverride.fontSize ?? selectedText.fontSize}
                  onChange={(event) => updateText(selectedText.id, { fontSize: Number(event.target.value) })}
                  className="input input-xs w-full border-base-300"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-[10px] font-semibold text-gray-500">
              Color
              <input
                type="color"
                value={selectedTextOverride.color ?? resolveToken(selectedText.color, brandCtx)}
                onChange={(event) => updateText(selectedText.id, { color: event.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-base-300 bg-white p-1"
              />
            </label>
            {textOverflow[selectedText.id] && (
              <p className="rounded-lg bg-red-50 p-2 text-[10px] font-semibold text-red-600">Este texto no cabe ni con el tamaño mínimo.</p>
            )}
          </div>
        ) : selectedSlot && selectedSlotAdjustment ? (
          <div className="flex flex-col gap-3 rounded-xl border border-base-200 bg-gray-50/50 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Encuadre de fotografía</span>
            {(["x", "y", "zoom"] as const).map((key) => (
              <label key={key} className="flex flex-col gap-1 text-[10px] font-semibold text-gray-500">
                {key === "x" ? "Posición horizontal" : key === "y" ? "Posición vertical" : "Zoom"}
                <input
                  type="range"
                  min={key === "zoom" ? 1 : 0}
                  max={key === "zoom" ? 2.5 : 100}
                  step={key === "zoom" ? 0.05 : 1}
                  value={selectedSlotAdjustment[key]}
                  onChange={(event) => setSlotAdjustments((previous) => ({
                    ...previous,
                    [selectedSlot.id]: { ...previous[selectedSlot.id], [key]: Number(event.target.value) }
                  }))}
                  className="range range-xs [--range-shdw:#F59C1D]"
                />
              </label>
            ))}
            {slotMedia[selectedSlot.id] && (
              <button onClick={() => setSlotMedia((previous) => ({ ...previous, [selectedSlot.id]: "" }))} className="btn btn-sm btn-outline self-start border-red-200 text-xs text-red-500">
                <ImageOff className="h-3.5 w-3.5" /> Quitar foto
              </button>
            )}
          </div>
        ) : selectedImage ? (
          <div className="flex flex-col gap-3 rounded-xl border border-base-200 bg-gray-50/50 p-4 text-xs text-gray-500">
            <p>{selectedImage.label || "Imagen"}. Arrastra otra imagen sobre esta área para reemplazarla.</p>
            {isSelectedLogo && (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Elegir logo</span>
                <div className="grid grid-cols-3 gap-2">
                  {TEMPLATE_LOGOS.map((logo) => (
                    <button
                      key={logo.id}
                      type="button"
                      onClick={() => setImageOverrides((previous) => ({ ...previous, [selectedImage.id]: logo.src }))}
                      className={`rounded-lg border p-1.5 ${selectedImageSource === logo.src ? "border-brand-orange bg-orange-50" : "border-base-300 bg-white hover:border-brand-orange/50"}`}
                      title={logo.label}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo.src} alt={logo.label} className="h-10 w-full object-contain" />
                      <span className="mt-1 block truncate text-[9px] font-medium">{logo.label}</span>
                    </button>
                  ))}
                </div>
                {imageOverrides[selectedImage.id] !== undefined && (
                  <button
                    type="button"
                    onClick={() => setImageOverrides((previous) => {
                      const next = { ...previous };
                      delete next[selectedImage.id];
                      return next;
                    })}
                    className="btn btn-xs btn-ghost self-start text-xs text-gray-500"
                  >Restaurar logo predeterminado</button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-base-300 p-8 text-center text-xs text-gray-400">
            Selecciona un texto, imagen o fotografía para editarlo.
          </div>
        )}

        <div className="flex flex-col gap-2.5 rounded-xl border border-base-200 bg-orange-50/30 p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Guardar como plantilla HTML</span>
          <div className="flex gap-2">
            <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Nombre de la plantilla…" className="input input-sm min-w-0 flex-1 border-base-300 text-xs" />
            <button onClick={saveAsTemplate} disabled={!templateName.trim() || isSavingTemplate} className="btn btn-sm btn-outline border-brand-orange/40 text-brand-orange">
              {isSavingTemplate ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {(feedback || exportBlockedReason) && (
          <p className={`rounded-lg p-2 text-[10px] font-semibold ${(feedback || exportBlockedReason).startsWith("¡") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {feedback || exportBlockedReason}
          </p>
        )}
        <button
          onClick={exportImage}
          disabled={isSaving || isExporting || hasOverflow || hasFailedAsset || hasLoadingAsset}
          className="btn mt-2 w-full border-0 bg-brand-orange text-white hover:bg-brand-dark-orange"
        >
          {isSaving || isExporting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          Finalizar y Guardar Publicación
        </button>
      </div>

      {showMediaBar && <MediaSidebar />}
    </div>
  );
}
