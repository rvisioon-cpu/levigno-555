"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ImageIcon } from "lucide-react";
import type {
  CanvasTemplate,
  CanvasTemplateV2,
  CanvasTemplateV3,
  ImageLayer,
  PhotoSlotLayer,
  ShapeLayer,
  TextLayer
} from "@/lib/content/template-schema";
import { buildBrandContext, resolveToken, type BrandContext } from "@/lib/content/brand";
import { getAssetUrl } from "@/utils/assets";
import { ensureFontsLoaded } from "@/lib/content/fonts";
import DomTemplateRenderer from "./DomTemplateRenderer";

interface TemplatePreviewProps {
  template: CanvasTemplate;
  brand?: BrandContext | null;
  className?: string;
}

function rectStyle(
  rect: [number, number, number, number]
): CSSProperties {
  return {
    left: `${rect[0] * 100}%`,
    top: `${rect[1] * 100}%`,
    width: `${rect[2] * 100}%`,
    height: `${rect[3] * 100}%`
  };
}

function slotShade(index: number) {
  return ["#CBD5E1", "#94A3B8", "#64748B", "#475569"][index % 4];
}

/** Miniatura DOM de una plantilla: representa exactamente la distribución de
 * sus capas sin depender de que haya imágenes de usuario cargadas. */
function LegacyTemplatePreview({ template, brand, className = "" }: TemplatePreviewProps & { template: CanvasTemplateV2 }) {
  const ctx = brand;
  const resolve = (value?: string) => ctx ? resolveToken(value, ctx) : value || "";
  let photoIndex = 0;

  useEffect(() => {
    const fonts = template.layers
      .filter((layer): layer is TextLayer => layer.type === "text")
      .map((text) => ({
        family: text.font ? (brand ? resolveToken(text.font, brand) : text.font) : "sans-serif",
        weights: [text.fontWeight ?? (text.fontStyle === "bold" ? 700 : 400)],
        styles: [text.fontStyle === "italic" ? "italic" as const : "normal" as const]
      }));
    void ensureFontsLoaded(fonts);
  }, [brand, template]);

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 ${className}`}
      style={{ aspectRatio: `${template.width} / ${template.height}` }}
      aria-label={`Vista previa de ${template.name}`}
    >
      {template.layers.map((layer) => {
        if (layer.type === "photo-slot") {
          const slot = layer as PhotoSlotLayer;
          const index = photoIndex++;
          return (
            <div
              key={slot.id}
              className="absolute flex items-center justify-center border border-white/70"
              style={{ ...rectStyle(slot.rect), background: `linear-gradient(135deg, ${slotShade(index)}, #E2E8F0)` }}
            >
              <ImageIcon className="w-1/4 h-1/4 min-w-3 min-h-3 text-white/75" />
            </div>
          );
        }

        if (layer.type === "shape") {
          const shape = layer as ShapeLayer;
          const from = resolve(shape.gradient?.from);
          const to = resolve(shape.gradient?.to);
          return (
            <div
              key={shape.id}
              className="absolute"
              style={{
                ...rectStyle(shape.rect),
                background: shape.gradient
                  ? `linear-gradient(${shape.gradient.direction === "horizontal" ? "90deg" : "180deg"}, ${from}, ${to})`
                  : resolve(shape.fill) || "transparent",
                border: shape.stroke ? `${Math.max(1, (shape.strokeRatio || 0.004) * 180)}px solid ${resolve(shape.stroke)}` : undefined,
                borderRadius: shape.shape === "pill" ? 999 : shape.shape === "circle" ? "50%" : undefined,
                opacity: shape.opacity ?? 1
              }}
            />
          );
        }

        if (layer.type === "image") {
          const image = layer as ImageLayer;
          const src = resolve(image.src);
          const previewSrc = src.startsWith("/") ? src : getAssetUrl(src);
          return src ? (
            // Los assets pueden venir de R2 con dimensiones dinámicas; aquí
            // necesitamos respetar el rect normalizado de la plantilla.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={image.id}
              src={previewSrc}
              alt=""
              className="absolute object-contain"
              style={{ ...rectStyle(image.rect), opacity: image.opacity ?? 1 }}
            />
          ) : null;
        }

        if (layer.type === "text") {
          const text = layer as TextLayer;
          return (
            <span
              key={text.id}
              className={`absolute overflow-hidden leading-tight ${text.wrap === "none" ? "whitespace-nowrap" : "whitespace-pre-line"}`}
              style={{
                left: `${text.at[0] * 100}%`,
                top: `${text.at[1] * 100}%`,
                width: text.widthRatio ? `${text.widthRatio * 100}%` : undefined,
                fontSize: `${Math.max(5, text.sizeRatio * 180)}px`,
                color: resolve(text.color) || "#FFFFFF",
                fontFamily: resolve(text.font) || "sans-serif",
                fontWeight: text.fontWeight ?? (text.fontStyle === "bold" ? 700 : 400),
                fontStyle: text.fontStyle === "italic" ? "italic" : undefined,
                letterSpacing: text.letterSpacingEm ? `${text.letterSpacingEm}em` : undefined,
                textAlign: text.align,
                lineHeight: text.lineHeight || 1.05
              }}
            >
              {resolve(text.content)}
            </span>
          );
        }

        return null;
      })}
    </div>
  );
}

function DomTemplatePreview({ template, brand, className = "" }: TemplatePreviewProps & { template: CanvasTemplateV3 }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(180);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  const scale = width / template.width;
  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden bg-slate-100 ${className}`}
      style={{ aspectRatio: `${template.width} / ${template.height}` }}
      aria-label={`Vista previa de ${template.name}`}
    >
      <div style={{ width: template.width, height: template.height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <DomTemplateRenderer
          template={template}
          brand={brand ?? buildBrandContext(null)}
          state={{ slotMedia: {} }}
        />
      </div>
    </div>
  );
}

export default function TemplatePreview(props: TemplatePreviewProps) {
  return props.template.version === 3
    ? <DomTemplatePreview {...props} template={props.template} />
    : <LegacyTemplatePreview {...props} template={props.template} />;
}
