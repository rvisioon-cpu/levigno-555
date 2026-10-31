"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { getCanvasImageUrl } from "@/utils/assets";
import {
  resolveToken,
  withAlpha,
  type BrandContext
} from "@/lib/content/brand";
import {
  type CanvasTemplateV3,
  type DomImageLayer,
  type DomPhotoSlotLayer,
  type DomShapeLayer,
  type DomTextLayer,
  type PixelRect
} from "@/lib/content/template-schema";
import { ensureFontsLoaded, primaryFamily } from "@/lib/content/fonts";

export interface DomTextOverride {
  content?: string;
  color?: string;
  font?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  letterSpacing?: number;
  lineHeight?: number;
  bounds?: PixelRect;
}

export interface DomSlotAdjustment {
  x: number;
  y: number;
  zoom: number;
}

export interface DomTemplateRenderState {
  slotMedia: Record<string, string>;
  slotAdjustments?: Record<string, DomSlotAdjustment>;
  imageOverrides?: Record<string, string | null>;
  textOverrides?: Record<string, DomTextOverride>;
  extraLayers?: Array<DomImageLayer | DomTextLayer>;
}

interface DomTemplateRendererProps {
  template: CanvasTemplateV3;
  brand: BrandContext;
  state: DomTemplateRenderState;
  interactive?: boolean;
  selectedLayerId?: string | null;
  className?: string;
  onSelectLayer?: (id: string | null) => void;
  onMoveText?: (id: string, bounds: PixelRect) => void;
  onChangeImageBounds?: (id: string, bounds: PixelRect) => void;
  onTextOverflow?: (id: string, overflowing: boolean) => void;
  onAssetStatus?: (id: string, status: "loading" | "loaded" | "failed") => void;
}

function assetUrl(src: string): string {
  if (!src) return "";
  if (src.startsWith("/") && !src.startsWith("/api/")) return src;
  return getCanvasImageUrl(src);
}

function boundsStyle(bounds: PixelRect): React.CSSProperties {
  return {
    position: "absolute",
    left: bounds[0],
    top: bounds[1],
    width: bounds[2],
    height: bounds[3],
    boxSizing: "border-box"
  };
}

function ImageAsset({
  id,
  src,
  fit,
  objectPosition,
  onStatus
}: {
  id: string;
  src: string;
  fit: "contain" | "cover";
  objectPosition?: [number, number];
  onStatus?: DomTemplateRendererProps["onAssetStatus"];
}) {
  useEffect(() => {
    if (src) onStatus?.(id, "loading");
  }, [id, onStatus, src]);

  if (!src) return null;
  return (
    // The source SVG/bitmap keeps its intrinsic ratio; the wrapper owns the
    // exact Figma geometry and object-fit determines the crop.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={assetUrl(src)}
      alt=""
      draggable={false}
      onLoad={() => onStatus?.(id, "loaded")}
      onError={() => onStatus?.(id, "failed")}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: fit,
        objectPosition: `${objectPosition?.[0] ?? 50}% ${objectPosition?.[1] ?? 50}%`
      }}
    />
  );
}

function DomText({
  layer,
  override,
  brand,
  template,
  interactive,
  selected,
  onSelect,
  onMove,
  onOverflow
}: {
  layer: DomTextLayer;
  override?: DomTextOverride;
  brand: BrandContext;
  template: CanvasTemplateV3;
  interactive?: boolean;
  selected: boolean;
  onSelect?: () => void;
  onMove?: (bounds: PixelRect) => void;
  onOverflow?: (id: string, overflowing: boolean) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const content = override?.content ?? resolveToken(layer.content, brand);
  const bounds = override?.bounds ?? layer.bounds;
  const requestedSize = override?.fontSize ?? layer.fontSize;
  const minSize = Math.min(requestedSize, layer.minFontSize ?? requestedSize);
  const family = primaryFamily(override?.font ?? resolveToken(layer.font, brand) ?? "sans-serif");
  const weight = override?.fontWeight ?? layer.fontWeight ?? 400;
  const style = override?.fontStyle ?? layer.fontStyle ?? "normal";
  const [fittedSize, setFittedSize] = useState(requestedSize);

  useEffect(() => {
    let cancelled = false;
    onOverflow?.(layer.id, true);
    const fit = async () => {
      await ensureFontsLoaded([{ family, weights: [weight], styles: [style] }]);
      if (cancelled || !boxRef.current) return;
      const box = boxRef.current;
      const overflows = () => box.scrollWidth > box.clientWidth + 1 || box.scrollHeight > box.clientHeight + 1;
      let next = requestedSize;
      box.style.fontSize = `${next}px`;
      if (layer.overflow === "shrink" && overflows()) {
        let low = minSize;
        let high = requestedSize;
        for (let i = 0; i < 10; i += 1) {
          const candidate = (low + high) / 2;
          box.style.fontSize = `${candidate}px`;
          if (overflows()) high = candidate;
          else low = candidate;
        }
        next = Math.floor(low * 10) / 10;
        box.style.fontSize = `${next}px`;
      }
      const invalid = overflows();
      setFittedSize(next);
      onOverflow?.(layer.id, invalid);
    };
    void fit();
    return () => { cancelled = true; };
  }, [bounds, content, family, layer.id, layer.overflow, minSize, onOverflow, requestedSize, style, weight]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    onSelect?.();
    if (!interactive || !layer.movable || !onMove) return;
    event.preventDefault();
    event.stopPropagation();
    const canvas = event.currentTarget.closest<HTMLElement>("[data-dom-template-root]");
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const scale = canvasRect.width / template.width;
    const startX = event.clientX;
    const startY = event.clientY;
    const original = bounds;
    const limit = layer.movementBounds ?? [0, 0, template.width, template.height];

    const move = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      const minX = limit[0];
      const minY = limit[1];
      const maxX = limit[0] + limit[2] - original[2];
      const maxY = limit[1] + limit[3] - original[3];
      onMove([
        Math.max(minX, Math.min(maxX, original[0] + dx)),
        Math.max(minY, Math.min(maxY, original[1] + dy)),
        original[2],
        original[3]
      ]);
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end, { once: true });
  };

  return (
    <div
      ref={boxRef}
      data-layer-id={layer.id}
      onPointerDown={handlePointerDown}
      style={{
        ...boundsStyle(bounds),
        display: "flex",
        alignItems: layer.verticalAlign === "center" ? "center" : layer.verticalAlign === "bottom" ? "flex-end" : "flex-start",
        overflow: "hidden",
        color: override?.color ?? resolveToken(layer.color, brand),
        fontFamily: `"${family}", sans-serif`,
        fontSize: fittedSize,
        fontWeight: weight,
        fontStyle: style,
        letterSpacing: override?.letterSpacing ?? layer.letterSpacing ?? 0,
        lineHeight: override?.lineHeight ?? layer.lineHeight ?? 1,
        textAlign: layer.align ?? "left",
        whiteSpace: layer.wrap === "none" ? "nowrap" : "pre-wrap",
        overflowWrap: layer.wrap === "char" ? "anywhere" : "normal",
        opacity: layer.opacity ?? 1,
        cursor: interactive && layer.movable ? "move" : interactive && layer.editable !== false ? "pointer" : "default",
        outline: interactive && selected ? "3px solid #FF7A00" : undefined,
        outlineOffset: 3,
        userSelect: "none"
      }}
    >
      <span style={{ width: "100%" }}>{content}</span>
    </div>
  );
}

export default function DomTemplateRenderer({
  template,
  brand,
  state,
  interactive = false,
  selectedLayerId,
  className = "",
  onSelectLayer,
  onMoveText,
  onChangeImageBounds,
  onTextOverflow,
  onAssetStatus
}: DomTemplateRendererProps) {
  const layers = useMemo(
    () => [...template.layers, ...(state.extraLayers ?? [])],
    [state.extraLayers, template.layers]
  );

  return (
    <div
      data-dom-template-root
      className={`relative overflow-hidden bg-white ${className}`}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onSelectLayer?.(null);
      }}
      style={{ width: template.width, height: template.height, isolation: "isolate" }}
    >
      {layers.map((layer) => {
        if (layer.type === "photo-slot") {
          const photo = layer as DomPhotoSlotLayer;
          const source = state.slotMedia[photo.id] || "";
          const adjustment = state.slotAdjustments?.[photo.id] ?? {
            x: photo.objectPosition?.[0] ?? 50,
            y: photo.objectPosition?.[1] ?? 50,
            zoom: photo.zoom ?? 1
          };
          return (
            <div
              key={photo.id}
              data-layer-id={photo.id}
              onPointerDown={(event) => { event.stopPropagation(); onSelectLayer?.(photo.id); }}
              style={{
                ...boundsStyle(photo.bounds),
                overflow: "hidden",
                background: "#E5E7EB",
                outline: interactive && selectedLayerId === photo.id ? "3px solid #FF7A00" : undefined,
                outlineOffset: -3,
                cursor: interactive ? "pointer" : "default",
                opacity: photo.opacity ?? 1
              }}
            >
              {source ? (
                <div style={{ width: "100%", height: "100%", transform: `scale(${adjustment.zoom})` }}>
                  <ImageAsset id={photo.id} src={source} fit={photo.fit ?? "cover"} objectPosition={[adjustment.x, adjustment.y]} onStatus={onAssetStatus} />
                </div>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-400">
                  <ImageIcon size={54} strokeWidth={1.5} />
                  <span style={{ fontSize: 18, fontWeight: 600 }}>Arrastra una imagen aquí</span>
                </div>
              )}
            </div>
          );
        }

        if (layer.type === "shape") {
          const shape = layer as DomShapeLayer;
          const from = resolveToken(shape.gradient?.from, brand);
          const to = resolveToken(shape.gradient?.to, brand);
          return (
            <div
              key={shape.id}
              data-layer-id={shape.id}
              style={{
                ...boundsStyle(shape.bounds),
                background: shape.gradient
                  ? `linear-gradient(${shape.gradient.direction === "horizontal" ? "90deg" : "180deg"}, ${withAlpha(from, shape.gradient.fromAlpha ?? 1)}, ${withAlpha(to, shape.gradient.toAlpha ?? 1)})`
                  : resolveToken(shape.fill, brand) || "transparent",
                border: shape.stroke ? `${shape.strokeWidth ?? 1}px solid ${resolveToken(shape.stroke, brand)}` : undefined,
                borderRadius: shape.shape === "pill" ? 9999 : shape.shape === "circle" ? "50%" : shape.cornerRadius,
                opacity: shape.opacity ?? 1,
                pointerEvents: "none"
              }}
            />
          );
        }

        if (layer.type === "image") {
          const image = layer as DomImageLayer;
          const overridden = state.imageOverrides && Object.prototype.hasOwnProperty.call(state.imageOverrides, image.id)
            ? state.imageOverrides[image.id]
            : undefined;
          const source = overridden === null ? "" : overridden || resolveToken(image.src, brand);
          const beginImageMove = (event: React.PointerEvent<HTMLDivElement>) => {
            if (!interactive || !image.movable || !onChangeImageBounds) return;
            event.preventDefault();
            const root = event.currentTarget.closest<HTMLElement>("[data-dom-template-root]");
            if (!root) return;
            const scale = root.getBoundingClientRect().width / template.width;
            const startX = event.clientX;
            const startY = event.clientY;
            const original = image.bounds;
            const limit = image.movementBounds ?? [0, 0, template.width, template.height];
            const move = (moveEvent: PointerEvent) => {
              const x = Math.max(limit[0], Math.min(limit[0] + limit[2] - original[2], original[0] + (moveEvent.clientX - startX) / scale));
              const y = Math.max(limit[1], Math.min(limit[1] + limit[3] - original[3], original[1] + (moveEvent.clientY - startY) / scale));
              onChangeImageBounds(image.id, [x, y, original[2], original[3]]);
            };
            const end = () => {
              window.removeEventListener("pointermove", move);
              window.removeEventListener("pointerup", end);
            };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", end, { once: true });
          };
          const beginResize = (event: React.PointerEvent<HTMLButtonElement>) => {
            if (!onChangeImageBounds) return;
            event.preventDefault();
            event.stopPropagation();
            const root = event.currentTarget.closest<HTMLElement>("[data-dom-template-root]");
            if (!root) return;
            const scale = root.getBoundingClientRect().width / template.width;
            const startX = event.clientX;
            const startY = event.clientY;
            const original = image.bounds;
            const resize = (moveEvent: PointerEvent) => {
              const width = Math.max(60, Math.min(template.width - original[0], original[2] + (moveEvent.clientX - startX) / scale));
              const height = Math.max(60, Math.min(template.height - original[1], original[3] + (moveEvent.clientY - startY) / scale));
              onChangeImageBounds(image.id, [original[0], original[1], width, height]);
            };
            const end = () => {
              window.removeEventListener("pointermove", resize);
              window.removeEventListener("pointerup", end);
            };
            window.addEventListener("pointermove", resize);
            window.addEventListener("pointerup", end, { once: true });
          };
          return (
            <div
              key={image.id}
              data-layer-id={image.id}
              onPointerDown={(event) => {
                if (!interactive || image.editable === false || image.locked) return;
                event.stopPropagation();
                onSelectLayer?.(image.id);
                beginImageMove(event);
              }}
              style={{
                ...boundsStyle(image.bounds),
                opacity: image.opacity ?? 1,
                cursor: interactive && image.editable ? "pointer" : "default",
                outline: interactive && selectedLayerId === image.id ? "3px solid #FF7A00" : undefined,
                outlineOffset: 3
              }}
            >
              <ImageAsset id={image.id} src={source} fit={image.fit ?? "contain"} objectPosition={image.objectPosition} onStatus={onAssetStatus} />
              {interactive && selectedLayerId === image.id && image.resizable && (
                <button
                  type="button"
                  aria-label="Redimensionar imagen"
                  onPointerDown={beginResize}
                  style={{
                    position: "absolute",
                    right: -10,
                    bottom: -10,
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    border: "3px solid white",
                    background: "#FF7A00",
                    cursor: "nwse-resize"
                  }}
                />
              )}
            </div>
          );
        }

        return (
          <DomText
            key={layer.id}
            layer={layer as DomTextLayer}
            override={state.textOverrides?.[layer.id]}
            brand={brand}
            template={template}
            interactive={interactive && layer.editable !== false && !layer.locked}
            selected={selectedLayerId === layer.id}
            onSelect={() => onSelectLayer?.(layer.id)}
            onMove={(bounds) => onMoveText?.(layer.id, bounds)}
            onOverflow={onTextOverflow}
          />
        );
      })}
    </div>
  );
}
