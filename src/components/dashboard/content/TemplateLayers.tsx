"use client";

// Dibuja las capas decorativas de una plantilla v2 dentro del Stage de Konva:
// el marco (PNG transparente), las formas vectoriales (degradados, píldoras,
// divisores) y las imágenes fijas (logo, isotipo). Los textos NO se dibujan
// aquí: son nodos editables que maneja TemplateEditor.

import React from "react";
import { Group, Image as KonvaImage, Rect } from "react-konva";
import useImage from "use-image";
import { getCanvasImageUrl } from "@/utils/assets";
import {
  denormRect,
  type TemplateLayer,
  type FrameLayer,
  type ShapeLayer,
  type ImageLayer
} from "@/lib/content/template-schema";
import { resolveToken, withAlpha, type BrandContext } from "@/lib/content/brand";

/**
 * Los recursos de plantilla viven en /public (marcos, logos), que ya es
 * same-origin y por tanto seguro para exportar el canvas. Cualquier otra ruta
 * se enruta por el proxy /api/r2 igual que el resto de medios.
 */
export function getTemplateAssetUrl(src: string): string {
  if (!src) return "";
  if (src.startsWith("/") && !src.startsWith("/api/")) return src;
  return getCanvasImageUrl(src);
}

function FrameNode({
  layer,
  ctx,
  canvasWidth,
  canvasHeight
}: {
  layer: FrameLayer;
  ctx: BrandContext;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const [img] = useImage(getTemplateAssetUrl(resolveToken(layer.src, ctx)), "anonymous");
  if (!img) return null;

  const rect = denormRect(layer.rect || [0, 0, 1, 1], canvasWidth, canvasHeight);

  return (
    <KonvaImage
      image={img}
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
      opacity={layer.opacity ?? 1}
      listening={false}
    />
  );
}

function ImageNode({
  layer,
  ctx,
  canvasWidth,
  canvasHeight,
  srcOverride,
  selected,
  onSelect
}: {
  layer: ImageLayer;
  ctx: BrandContext;
  canvasWidth: number;
  canvasHeight: number;
  srcOverride?: string | null;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const source = srcOverride === null ? "" : srcOverride || resolveToken(layer.src, ctx);
  const [img] = useImage(getTemplateAssetUrl(source), "anonymous");
  if (!img) return null;

  const rect = denormRect(layer.rect, canvasWidth, canvasHeight);

  // 'contain' respeta la proporción natural y centra dentro de la caja: es lo
  // que hace falta para que un logo no salga deformado en ningún proyecto.
  let { x, y, width, height } = rect;
  if ((layer.fit ?? "contain") === "contain" && img.width > 0 && img.height > 0) {
    const scale = Math.min(rect.width / img.width, rect.height / img.height);
    width = img.width * scale;
    height = img.height * scale;
    x = rect.x + (rect.width - width) / 2;
    y = rect.y + (rect.height - height) / 2;
  }

  return (
    <Group onClick={onSelect} onTap={onSelect} listening={Boolean(onSelect)}>
      <KonvaImage
        image={img}
        x={x}
        y={y}
        width={width}
        height={height}
        opacity={layer.opacity ?? 1}
        listening={Boolean(onSelect)}
      />
      {selected && (
        <Rect
          x={rect.x - 3}
          y={rect.y - 3}
          width={rect.width + 6}
          height={rect.height + 6}
          stroke="#FF7A00"
          strokeWidth={1.5}
          dash={[4, 2]}
          listening={false}
        />
      )}
    </Group>
  );
}

function ShapeNode({
  layer,
  ctx,
  canvasWidth,
  canvasHeight,
  colorOverride,
  selected,
  onSelect
}: {
  layer: ShapeLayer;
  ctx: BrandContext;
  canvasWidth: number;
  canvasHeight: number;
  colorOverride?: string;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const rect = denormRect(layer.rect, canvasWidth, canvasHeight);

  let cornerRadius = 0;
  if (layer.shape === "pill") cornerRadius = rect.height / 2;
  else if (layer.shape === "circle")
    cornerRadius = Math.min(rect.width, rect.height) / 2;
  else if (layer.cornerRatio) cornerRadius = layer.cornerRatio * canvasWidth;

  const gradientProps = layer.gradient
    ? {
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint:
          layer.gradient.direction === "horizontal"
            ? { x: rect.width, y: 0 }
            : { x: 0, y: rect.height },
        fillLinearGradientColorStops: [
          0,
          withAlpha(
            colorOverride || resolveToken(layer.gradient.from, ctx),
            layer.gradient.fromAlpha ?? 1
          ),
          1,
          withAlpha(
            colorOverride || resolveToken(layer.gradient.to, ctx),
            layer.gradient.toAlpha ?? 1
          )
        ]
      }
    : {};

  const changesFill = Boolean(layer.fill || layer.gradient || !layer.stroke);

  return (
    <Group
      onClick={(event) => {
        event.cancelBubble = true;
        onSelect?.();
      }}
      onTap={(event) => {
        event.cancelBubble = true;
        onSelect?.();
      }}
      listening={Boolean(onSelect)}
    >
      <Rect
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        cornerRadius={cornerRadius}
        fill={layer.gradient ? undefined : colorOverride && changesFill ? colorOverride : resolveToken(layer.fill, ctx) || undefined}
        stroke={colorOverride && !changesFill ? colorOverride : layer.stroke ? resolveToken(layer.stroke, ctx) : undefined}
        strokeWidth={layer.strokeRatio ? layer.strokeRatio * canvasWidth : undefined}
        opacity={layer.opacity ?? 1}
        listening={Boolean(onSelect)}
        {...gradientProps}
      />
      {selected && (
        <Rect
          x={rect.x - 2}
          y={rect.y - 2}
          width={rect.width + 4}
          height={rect.height + 4}
          cornerRadius={cornerRadius}
          stroke="#FF7A00"
          strokeWidth={1.5}
          dash={[4, 2]}
          listening={false}
        />
      )}
    </Group>
  );
}

export default function TemplateLayers({
  layers,
  ctx,
  canvasWidth,
  canvasHeight,
  imageOverrides = {},
  shapeColorOverrides = {},
  selectedImageId,
  selectedShapeId,
  onSelectImage,
  onSelectShape
}: {
  layers: TemplateLayer[];
  ctx: BrandContext;
  canvasWidth: number;
  canvasHeight: number;
  imageOverrides?: Record<string, string | null>;
  shapeColorOverrides?: Record<string, string>;
  selectedImageId?: string | null;
  selectedShapeId?: string | null;
  onSelectImage?: (layer: ImageLayer) => void;
  onSelectShape?: (layer: ShapeLayer) => void;
}) {
  return (
    <>
      {layers.map((layer) => {
        switch (layer.type) {
          case "frame":
            return (
              <FrameNode
                key={layer.id}
                layer={layer}
                ctx={ctx}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
              />
            );
          case "shape":
            return (
              <ShapeNode
                key={layer.id}
                layer={layer}
                ctx={ctx}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                colorOverride={shapeColorOverrides[layer.id]}
                selected={selectedShapeId === layer.id}
                onSelect={layer.locked ? undefined : () => onSelectShape?.(layer)}
              />
            );
          case "image":
            const imageLayer = layer as ImageLayer;
            return (
              <ImageNode
                key={layer.id}
                layer={imageLayer}
                ctx={ctx}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                srcOverride={Object.prototype.hasOwnProperty.call(imageOverrides, layer.id) ? imageOverrides[layer.id] : undefined}
                selected={selectedImageId === layer.id}
                onSelect={imageLayer.editable ? () => onSelectImage?.(imageLayer) : undefined}
              />
            );
          // 'photo-slot' lo dibuja el editor (es el fondo que elige el usuario)
          // y 'text' son nodos editables, también del editor.
          default:
            return null;
        }
      })}
    </>
  );
}
