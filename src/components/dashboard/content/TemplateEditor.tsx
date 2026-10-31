"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type Konva from "konva";
import { Stage, Layer, Image as KonvaImage, Text, Rect, Transformer, Group, Circle, Line } from "react-konva";
import useImage from "use-image";
import { Trash2, Plus, Type, Check, RefreshCw, Layers, ArrowDown, ArrowUp, Save, ImageOff, LayoutTemplate, PanelRightClose, PanelRightOpen, Loader2 } from "lucide-react";
import { getCanvasImageUrl } from "@/utils/assets";
import { createCanvasTemplate } from "@/app/actions/templates";
import MediaSidebar from "./MediaSidebar";
import TemplateLayers from "./TemplateLayers";
import DomTemplateEditor from "./DomTemplateEditor";
import {
  denormPoint,
  denormRect,
  normPoint,
  type CanvasTemplate,
  type CanvasTemplateV2,
  type TemplateLayer,
  type TextLayer,
  type PhotoSlotLayer,
  type ImageLayer,
  type ShapeLayer
} from "@/lib/content/template-schema";
import { buildBrandContext, resolveToken, type BrandContext } from "@/lib/content/brand";
import { CANVAS_GOOGLE_FONTS, ensureFontsLoaded, primaryFamily } from "@/lib/content/fonts";

interface TextNode {
  id: string;
  text: string;
  color: string;
  // Tamaño en píxeles del lienzo EN PANTALLA; se convierte a ratio al guardar
  fontSize: number;
  x: number;
  y: number;
  font?: string;
  fontWeight?: number;
  fontStyle?: string;
  letterSpacingEm?: number;
  wrap?: "word" | "char" | "none";
  align?: "left" | "center" | "right";
  widthRatio?: number;
  lineHeight?: number;
  // Los textos fijos de la plantilla (marca de agua, claim legal) no se editan
  locked?: boolean;
}

interface MediaNode {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  naturalApplied?: boolean;
}

function textFontWeight(text: Pick<TextNode, "fontWeight" | "fontStyle">): number {
  return text.fontWeight ?? (text.fontStyle === "bold" ? 700 : 400);
}

function canvasFontStyle(text: Pick<TextNode, "fontWeight" | "fontStyle">): string {
  const italic = text.fontStyle === "italic" ? "italic " : "";
  return `${italic}${textFontWeight(text)}`;
}

// Imagen que ocupa un espacio fijo de la plantilla. A diferencia de una capa
// flotante, no puede salirse de su celda: el Group la recorta como en Figma.
function PhotoSlotImage({
  layer,
  url,
  canvasWidth,
  canvasHeight,
  selected,
  onSelect,
  onStatusChange
}: {
  layer: PhotoSlotLayer;
  url?: string;
  canvasWidth: number;
  canvasHeight: number;
  selected: boolean;
  onSelect: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [img, status] = useImage(url ? getCanvasImageUrl(url) : "", "anonymous");
  const rect = denormRect(layer.rect, canvasWidth, canvasHeight);

  useEffect(() => {
    onStatusChange(layer.id, url ? status : "idle");
  }, [layer.id, onStatusChange, status, url]);

  let crop: { x: number; y: number; width: number; height: number } | undefined;
  if (img && img.width > 0 && img.height > 0 && (layer.fit ?? "cover") === "cover") {
    const scale = Math.max(rect.width / img.width, rect.height / img.height);
    const cropWidth = rect.width / scale;
    const cropHeight = rect.height / scale;
    crop = {
      x: (img.width - cropWidth) / 2,
      y: (img.height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight
    };
  }

  return (
    <Group
      x={rect.x}
      y={rect.y}
      clipX={0}
      clipY={0}
      clipWidth={rect.width}
      clipHeight={rect.height}
      onClick={onSelect}
      onTap={onSelect}
    >
      {img ? (
        <KonvaImage
          image={img}
          width={rect.width}
          height={rect.height}
          crop={crop}
          listening={false}
        />
      ) : (
        <>
          <Rect
            width={rect.width}
            height={rect.height}
            fill={status === "failed" ? "#FEF2F2" : "#E5E7EB"}
            stroke={selected ? "#FF7A00" : status === "failed" ? "#FCA5A5" : "#CBD5E1"}
            strokeWidth={selected ? 2 : 1}
            dash={[5, 3]}
          />
          {url && (
            <Text
              text={status === "failed" ? "No se pudo cargar" : "Cargando..."}
              x={0}
              y={rect.height / 2 - 6}
              width={rect.width}
              align="center"
              fontSize={Math.max(8, Math.min(12, rect.width * 0.06))}
              fill={status === "failed" ? "#DC2626" : "#64748B"}
              listening={false}
            />
          )}
        </>
      )}
      {selected && img && (
        <Rect
          width={rect.width}
          height={rect.height}
          stroke="#FF7A00"
          strokeWidth={2}
          listening={false}
        />
      )}
    </Group>
  );
}

interface TemplateEditorProps {
  mediaUrls: string[]; // Primera imagen = fondo del lienzo; el resto, capas movibles
  aspectRatio: string;
  targetWidth: number;
  targetHeight: number;
  initialTexts: Array<{ text: string; color: string; fontSize: number }>;
  // v2 usa Konva; v3 comparte un único renderer DOM para editar y exportar.
  template?: CanvasTemplate | null;
  // Identidad del proyecto para resolver los tokens {{brand.*}} de la plantilla
  brand?: BrandContext | null;
  showMediaBar?: boolean; // Mostrar la barra lateral de medios arrastrables
  onSave: (imageBase64: string) => void;
  isSaving: boolean;
}

// Capa de imagen arrastrable y redimensionable sobre el lienzo
function OverlayImage({
  node,
  isSelected,
  onSelect,
  onChange,
  onDelete
}: {
  node: MediaNode;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (node: MediaNode) => void;
  onDelete: () => void;
}) {
  const [img] = useImage(getCanvasImageUrl(node.url), "anonymous");
  const shapeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Ajustar la altura a la proporción natural de la imagen al cargarla
  useEffect(() => {
    if (img && !node.naturalApplied && img.width > 0) {
      const ratio = img.height / img.width;
      onChange({ ...node, height: Math.round(node.width * ratio), naturalApplied: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img]);

  // Conectar el transformador (manijas de redimensión) al nodo seleccionado
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, img]);

  if (!img) return null;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={img}
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onSelect}
        onDragEnd={(e) => onChange({ ...node, x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const n = shapeRef.current;
          if (!n) return;
          const scaleX = n.scaleX();
          const scaleY = n.scaleY();
          n.scaleX(1);
          n.scaleY(1);
          onChange({
            ...node,
            x: n.x(),
            y: n.y(),
            width: Math.max(20, n.width() * scaleX),
            height: Math.max(20, n.height() * scaleY)
          });
        }}
      />
      {isSelected && (
        <>
          <Transformer
            ref={trRef}
            rotateEnabled={false}
            anchorStroke="#FF7A00"
            anchorFill="#FFFFFF"
            borderStroke="#FF7A00"
            borderDash={[4, 2]}
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
            }
          />
          <Group
            x={node.x + node.width}
            y={node.y - 12}
            onClick={(e) => {
              e.cancelBubble = true;
              onDelete();
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              onDelete();
            }}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = "pointer";
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = "default";
            }}
          >
            <Circle
              radius={9}
              fill="#EF4444"
              stroke="#FFFFFF"
              strokeWidth={1.5}
              shadowBlur={3}
              shadowColor="black"
              shadowOpacity={0.3}
            />
            <Line
              points={[-3, -3, 3, 3]}
              stroke="#FFFFFF"
              strokeWidth={1.5}
              lineCap="round"
              lineJoin="round"
            />
            <Line
              points={[3, -3, -3, 3]}
              stroke="#FFFFFF"
              strokeWidth={1.5}
              lineCap="round"
              lineJoin="round"
            />
          </Group>
        </>
      )}
    </>
  );
}

type KonvaTemplateEditorProps = Omit<TemplateEditorProps, "template"> & {
  template?: CanvasTemplateV2 | null;
};

const KonvaTemplateEditor: React.FC<KonvaTemplateEditorProps> = ({
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
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [toolsCollapsed, setToolsCollapsed] = useState(false);

  // Cada slot tiene su propio medio. Esto permite plantillas de collage sin
  // convertir las fotos secundarias en un PNG fijo.
  const photoSlots = (template?.layers ?? []).filter(
    (layer): layer is PhotoSlotLayer => layer.type === "photo-slot"
  );
  const effectivePhotoSlots: PhotoSlotLayer[] = photoSlots.length > 0 ? photoSlots : [{
    id: "bg",
    type: "photo-slot",
    role: "background",
    rect: [0, 0, 1, 1],
    fit: "cover"
  }];
  const [slotMedia, setSlotMedia] = useState<Record<string, string>>({});
  const [slotLoadStates, setSlotLoadStates] = useState<Record<string, string>>({});
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [imageOverrides, setImageOverrides] = useState<Record<string, string | null>>({});
  const [selectedTemplateImageId, setSelectedTemplateImageId] = useState<string | null>(null);
  const [shapeColorOverrides, setShapeColorOverrides] = useState<Record<string, string>>({});
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  // Dimensiones visuales del lienzo en pantalla, derivadas del formato real
  // Esta pantalla es un área de trabajo: una mesa más amplia deja ver con
  // precisión la relación entre los elementos sin cambiar la resolución final.
  const visualWidth = 720;
  const visualHeight = Math.round(visualWidth * (targetHeight / targetWidth));

  // Factor entre el lienzo en pantalla y la resolución real de salida. Antes
  // estaba fijo en 3, pero el valor correcto depende del formato (1080/320 =
  // 3.375), por eso el tamaño de letra que se elegía no era el que se exportaba.
  const exportScale = targetWidth / visualWidth;

  // Contexto de marca: si no llega desde el servidor se cae a la config local
  const brandCtx: BrandContext = brand ?? buildBrandContext(null);
  const defaultFont = brandCtx.brand.display;

  // Capas decorativas de la plantilla (marco, degradados, píldoras, logo)
  const decorativeLayers: TemplateLayer[] = (template?.layers ?? []).filter(
    (l) => l.type === "frame" || l.type === "shape" || l.type === "image"
  );
  const editableTemplateImages = decorativeLayers.filter(
    (layer): layer is ImageLayer => layer.type === "image" && Boolean(layer.editable)
  );

  const hasAnySlotMedia = effectivePhotoSlots.some((slot) => Boolean(slotMedia[slot.id]));
  const hasLoadingSlots = effectivePhotoSlots.some(
    (slot) => Boolean(slotMedia[slot.id]) && slotLoadStates[slot.id] !== "loaded"
  );
  const handleSlotStatusChange = useCallback((id: string, status: string) => {
    setSlotLoadStates((previous) =>
      previous[id] === status ? previous : { ...previous, [id]: status }
    );
  }, []);

  // Capas de imagen adicionales (medios 2..n seleccionados)
  const [overlays, setOverlays] = useState<MediaNode[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);

  // Estado de los nodos de texto
  const [texts, setTexts] = useState<TextNode[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState("");

  // Inicializar los slots en orden visual cuando cambian los medios
  // seleccionados. El primer medio ocupa el fondo y los siguientes, el collage.
  useEffect(() => {
    setSlotMedia(Object.fromEntries(
      effectivePhotoSlots.map((slot, idx) => [slot.id, mediaUrls[idx] || ""])
    ));
    setSlotLoadStates({});
    const overlayUrls = mediaUrls.slice(effectivePhotoSlots.length);
    setOverlays(
      overlayUrls.map((url, idx) => ({
        id: `media-${idx}-${url.slice(-24)}`,
        url,
        x: 24 + idx * 28,
        y: 24 + idx * 28,
        width: Math.round(visualWidth * 0.45),
        height: Math.round(visualWidth * 0.45)
      }))
    );
    setSelectedMediaId(null);
    setSelectedSlotId(null);
    setSelectedTemplateImageId(null);
    setSelectedShapeId(null);
    setImageOverrides({});
    setShapeColorOverrides({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaUrls.join("|"), template?.id]);

  // Cargar los textos de la plantilla: vienen normalizados (0..1) y se
  // convierten al espacio del lienzo en pantalla
  useEffect(() => {
    const textLayers = (template?.layers ?? []).filter(
      (l): l is TextLayer => l.type === "text"
    );
    if (textLayers.length === 0) return;

    setTexts(
      textLayers.map((layer, idx) => {
        const pos = denormPoint(layer.at, visualWidth, visualHeight);
        return {
          id: `text-tpl-${layer.id || idx}-${Date.now()}`,
          text: resolveToken(layer.content, brandCtx),
          color: resolveToken(layer.color, brandCtx) || "#FFFFFF",
          fontSize: Math.max(6, layer.sizeRatio * visualWidth),
          x: pos.x,
          y: pos.y,
          font: layer.font ? resolveToken(layer.font, brandCtx) : undefined,
          fontWeight: layer.fontWeight,
          fontStyle: layer.fontStyle,
          letterSpacingEm: layer.letterSpacingEm,
          wrap: layer.wrap,
          align: layer.align,
          widthRatio: layer.widthRatio,
          lineHeight: layer.lineHeight,
          locked: layer.editable === false
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  // La vista del editor también debe esperar la variante exacta. El mismo
  // cargador se reutiliza al exportar para evitar diferencias entre ambos.
  const fontLoadSignature = texts
    .map((text) => `${primaryFamily(text.font || defaultFont)}:${textFontWeight(text)}:${text.fontStyle === "italic" ? "italic" : "normal"}`)
    .sort()
    .join("|");
  useEffect(() => {
    void ensureFontsLoaded(
      texts.map((text) => ({
        family: primaryFamily(text.font || defaultFont),
        weights: [textFontWeight(text)],
        styles: [text.fontStyle === "italic" ? "italic" as const : "normal" as const]
      }))
    ).then(() => stageRef.current?.batchDraw());
    // La firma cambia solo cuando cambia una variante tipográfica, no al
    // editar el contenido o mover el elemento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontLoadSignature, defaultFont]);

  // Inyectar los textos sugeridos por la IA sin borrar los textos del usuario
  useEffect(() => {
    if (initialTexts && initialTexts.length > 0) {
      const formatted = initialTexts.map((t, idx) => ({
        id: `text-ai-${idx}-${Date.now()}`,
        text: t.text,
        color: t.color || "#FFFFFF",
        // Escalar tamaño de fuente para el tamaño visual de pantalla
        fontSize: Math.round(t.fontSize / exportScale) || 16,
        font: defaultFont,
        fontWeight: 700,
        fontStyle: "normal",
        x: 30,
        y: 40 + idx * 60
      }));
      setTexts(prev => [...prev.filter(t => !t.id.startsWith("text-ai-")), ...formatted]);
      setSelectedMediaId(null);
      setSelectedTemplateImageId(null);
      setSelectedShapeId(null);
      setSelectedTextId(formatted[0].id);
      setEditingTextValue(formatted[0].text);
    }
  }, [initialTexts, exportScale, defaultFont]);

  const selectText = (t: TextNode) => {
    if (t.locked) return;
    setSelectedTextId(t.id);
    setSelectedMediaId(null);
    setSelectedSlotId(null);
    setSelectedTemplateImageId(null);
    setSelectedShapeId(null);
    setEditingTextValue(t.text);
  };

  const selectMedia = (id: string) => {
    setSelectedMediaId(id);
    setSelectedSlotId(null);
    setSelectedTextId(null);
    setSelectedTemplateImageId(null);
    setSelectedShapeId(null);
    setEditingTextValue("");
  };

  const deselectAll = () => {
    setSelectedTextId(null);
    setSelectedMediaId(null);
    setSelectedSlotId(null);
    setSelectedTemplateImageId(null);
    setSelectedShapeId(null);
    setEditingTextValue("");
  };

  // Manejar el cambio del input de texto seleccionado
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditingTextValue(val);
    setTexts(prev =>
      prev.map(t => (t.id === selectedTextId ? { ...t, text: val } : t))
    );
  };

  // Agregar nuevo texto manualmente
  const handleAddText = () => {
    const newId = `text-manual-${Date.now()}`;
    const newNode: TextNode = {
      id: newId,
      text: "Doble clic para editar",
      color: "#FFFFFF",
      fontSize: 20,
      font: defaultFont,
      fontWeight: 700,
      fontStyle: "normal",
      letterSpacingEm: 0,
      lineHeight: 1,
      x: visualWidth / 2 - 80,
      y: visualHeight / 2 - 10
    };
    setTexts(prev => [...prev, newNode]);
    setSelectedTextId(newId);
    setSelectedMediaId(null);
    setSelectedSlotId(null);
    setSelectedTemplateImageId(null);
    setSelectedShapeId(null);
    setEditingTextValue(newNode.text);
  };

  // Eliminar el elemento seleccionado (texto o capa de imagen)
  const handleDeleteSelected = () => {
    if (selectedTextId) {
      setTexts(prev => prev.filter(t => t.id !== selectedTextId));
      setSelectedTextId(null);
      setEditingTextValue("");
    } else if (selectedMediaId) {
      setOverlays(prev => prev.filter(o => o.id !== selectedMediaId));
      setSelectedMediaId(null);
    } else if (selectedTemplateImageId) {
      setImageOverrides((previous) => ({ ...previous, [selectedTemplateImageId]: null }));
    }
  };

  // Traer la capa de imagen seleccionada al frente
  const handleBringToFront = () => {
    if (!selectedMediaId) return;
    setOverlays(prev => {
      const node = prev.find(o => o.id === selectedMediaId);
      if (!node) return prev;
      return [...prev.filter(o => o.id !== selectedMediaId), node];
    });
  };

  const handleSendToBack = () => {
    if (!selectedMediaId) return;
    setOverlays((previous) => {
      const node = previous.find((item) => item.id === selectedMediaId);
      if (!node) return previous;
      return [node, ...previous.filter((item) => item.id !== selectedMediaId)];
    });
  };

  // Ubica una URL ya disponible, venga de la barra lateral o de una carga local.
  const placeDroppedImage = (url: string, dropX: number, dropY: number) => {
    const hitSlot = [...effectivePhotoSlots].reverse().find((slot) => {
      const slotRect = denormRect(slot.rect, visualWidth, visualHeight);
      return dropX >= slotRect.x && dropX <= slotRect.x + slotRect.width &&
        dropY >= slotRect.y && dropY <= slotRect.y + slotRect.height;
    });

    if (hitSlot) {
      setSlotMedia((previous) => ({ ...previous, [hitSlot.id]: url }));
      setSlotLoadStates((previous) => ({ ...previous, [hitSlot.id]: "loading" }));
      setSelectedSlotId(hitSlot.id);
      setSelectedTextId(null);
      setSelectedMediaId(null);
      setSelectedTemplateImageId(null);
      setSelectedShapeId(null);
      return;
    }

    const hitEditableImage = [...editableTemplateImages].reverse().find((layer) => {
      const imageRect = denormRect(layer.rect, visualWidth, visualHeight);
      return dropX >= imageRect.x && dropX <= imageRect.x + imageRect.width &&
        dropY >= imageRect.y && dropY <= imageRect.y + imageRect.height;
    });
    if (hitEditableImage) {
      setImageOverrides((previous) => ({ ...previous, [hitEditableImage.id]: url }));
      setSelectedTemplateImageId(hitEditableImage.id);
      setSelectedSlotId(null);
      setSelectedTextId(null);
      setSelectedMediaId(null);
      setSelectedShapeId(null);
      return;
    }

    const firstEmptySlot = effectivePhotoSlots.find((slot) => !slotMedia[slot.id]);
    if (firstEmptySlot) {
      setSlotMedia((previous) => ({ ...previous, [firstEmptySlot.id]: url }));
      setSlotLoadStates((previous) => ({ ...previous, [firstEmptySlot.id]: "loading" }));
      setSelectedSlotId(firstEmptySlot.id);
      setSelectedTextId(null);
      setSelectedMediaId(null);
      setSelectedTemplateImageId(null);
      setSelectedShapeId(null);
      return;
    }

    const size = Math.round(visualWidth * 0.45);
    const newNode: MediaNode = {
      id: `media-drop-${Date.now()}`,
      url,
      x: Math.max(0, Math.min(dropX - size / 2, visualWidth - size)),
      y: Math.max(0, Math.min(dropY - size / 2, visualHeight - size)),
      width: size,
      height: size
    };
    setOverlays(prev => [...prev, newNode]);
    setSelectedMediaId(newNode.id);
    setSelectedTextId(null);
    setSelectedTemplateImageId(null);
    setSelectedShapeId(null);
  };

  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploadingExternal, setIsUploadingExternal] = useState(false);
  const [externalUploadError, setExternalUploadError] = useState("");

  const uploadExternalImage = async (file: File, dropX: number, dropY: number) => {
    if (!file.type.startsWith("image/")) {
      setExternalUploadError("Solo puedes soltar archivos de imagen.");
      return;
    }
    setIsUploadingExternal(true);
    setExternalUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      // La categoría la persiste como medio reutilizable del proyecto.
      formData.append("category", "social_reference");
      const response = await fetch("/api/r2/upload", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok || !payload.success || !payload.url) {
        throw new Error(payload.error || "No se pudo subir la imagen a R2.");
      }
      placeDroppedImage(payload.url, dropX, dropY);
      window.dispatchEvent(new CustomEvent("content-media-uploaded", {
        detail: { id: payload.key, title: payload.name || file.name, url: payload.url }
      }));
    } catch (error) {
      console.error("Error al subir imagen externa al lienzo:", error);
      setExternalUploadError(error instanceof Error ? error.message : "No se pudo subir la imagen a R2.");
    } finally {
      setIsUploadingExternal(false);
    }
  };

  // Recibir un medio de la barra lateral o un archivo soltado desde el equipo.
  const handleMediaDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const dropX = Math.round(e.clientX - rect.left);
    const dropY = Math.round(e.clientY - rect.top);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void uploadExternalImage(file, dropX, dropY);
      return;
    }
    const url = e.dataTransfer.getData("text/plain");
    if (url) placeDroppedImage(url, dropX, dropY);
  };

  // Guardar la composición actual como plantilla reutilizable
  const [templateName, setTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateFeedback, setTemplateFeedback] = useState<string>("");
  const handleSaveAsTemplate = async () => {
    if (!templateName.trim() || isSavingTemplate) return;
    setIsSavingTemplate(true);
    setTemplateFeedback("");
    try {
      // Se guarda en v2: coordenadas normalizadas (0..1) para que la
      // plantilla funcione en cualquier formato y en cualquier proyecto, y
      // conservando las capas decorativas de la plantilla de origen.
      const layout: CanvasTemplateV2 = {
        version: 2,
        name: templateName.trim(),
        width: targetWidth,
        height: targetHeight,
        aspectRatio,
        source: "PROJECT",
        basedOn: template?.id,
        layers: [
          ...effectivePhotoSlots,
          ...decorativeLayers.map((layer) => {
            if (layer.type === "image" && Object.prototype.hasOwnProperty.call(imageOverrides, layer.id)) {
              return { ...layer, src: imageOverrides[layer.id] ?? "" };
            }
            if (layer.type === "shape" && shapeColorOverrides[layer.id]) {
              const color = shapeColorOverrides[layer.id];
              if (layer.gradient) {
                return { ...layer, gradient: { ...layer.gradient, from: color, to: color } };
              }
              if (layer.fill || !layer.stroke) return { ...layer, fill: color };
              return { ...layer, stroke: color };
            }
            return layer;
          }),
          ...texts.map((t, idx): TextLayer => ({
            id: `text-${idx}`,
            type: "text",
            content: t.text,
            at: normPoint(t.x, t.y, visualWidth, visualHeight),
            sizeRatio: t.fontSize / visualWidth,
            color: t.color,
            font: t.font,
            fontWeight: textFontWeight(t),
            fontStyle: t.fontStyle === "italic" ? "italic" : "normal",
            letterSpacingEm: t.letterSpacingEm,
            wrap: t.wrap,
            align: t.align,
            widthRatio: t.widthRatio,
            lineHeight: t.lineHeight,
            editable: !t.locked
          }))
        ]
      };
      await createCanvasTemplate(templateName, targetWidth, targetHeight, aspectRatio, layout);
      setTemplateFeedback("¡Plantilla guardada! La encontrarás en \"Mis Plantillas\".");
      setTemplateName("");
    } catch (err) {
      console.error("Error saving canvas template:", err);
      setTemplateFeedback("Error al guardar la plantilla. Intenta de nuevo.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Cambiar color del texto seleccionado
  const handleColorChange = (color: string) => {
    if (!selectedTextId) return;
    setTexts(prev =>
      prev.map(t => (t.id === selectedTextId ? { ...t, color } : t))
    );
  };

  const updateSelectedText = (changes: Partial<TextNode>) => {
    if (!selectedTextId) return;
    setTexts((previous) =>
      previous.map((text) => text.id === selectedTextId ? { ...text, ...changes } : text)
    );
  };

  // Fijar el tamaño de fuente del texto seleccionado (en píxeles de la resolución final)
  const handleFontSizeSet = (targetPx: number) => {
    if (!selectedTextId || Number.isNaN(targetPx)) return;
    const clamped = Math.max(8, Math.min(300, targetPx));
    setTexts(prev =>
      prev.map(t =>
        t.id === selectedTextId ? { ...t, fontSize: clamped / exportScale } : t
      )
    );
  };

  // Exportar y Guardar
  const handleExport = async () => {
    const stage = stageRef.current;
    if (!stage) return;

    // Deseleccionar para que no se exporten contornos ni manijas de selección
    const currentSelectedText = selectedTextId;
    const currentSelectedMedia = selectedMediaId;
    const currentSelectedShape = selectedShapeId;
    setSelectedTextId(null);
    setSelectedMediaId(null);
    setSelectedShapeId(null);

    // Konva rasteriza con la fuente que esté disponible en ese momento: si no
    // se espera, el archivo final sale con la tipografía de respaldo.
    await ensureFontsLoaded(texts.map((text) => ({
      family: primaryFamily(text.font || defaultFont),
      weights: [textFontWeight(text)],
      styles: [text.fontStyle === "italic" ? "italic" as const : "normal" as const]
    })));

    // Esperar un render tick para exportar
    setTimeout(() => {
      // Calcular factor de escala para exportar a la resolución objetivo real
      const pixelRatio = targetWidth / visualWidth;

      const dataUrl = stage.toDataURL({
        mimeType: "image/jpeg",
        quality: 0.95,
        pixelRatio: pixelRatio
      });

      // Restaurar selección
      setSelectedTextId(currentSelectedText);
      setSelectedMediaId(currentSelectedMedia);
      setSelectedShapeId(currentSelectedShape);

      // Enviar al callback
      onSave(dataUrl);
    }, 50);
  };

  const selectedText = texts.find(t => t.id === selectedTextId);
  const selectedSlot = effectivePhotoSlots.find((slot) => slot.id === selectedSlotId);
  const selectedTemplateImage = editableTemplateImages.find((layer) => layer.id === selectedTemplateImageId);
  const selectedShape = decorativeLayers.find(
    (layer): layer is ShapeLayer => layer.type === "shape" && layer.id === selectedShapeId
  );
  const selectedShapeColor = selectedShape
    ? shapeColorOverrides[selectedShape.id] || resolveToken(
        selectedShape.fill || selectedShape.gradient?.from || selectedShape.stroke || "#000000",
        brandCtx
      )
    : "#000000";
  const hasSelection = Boolean(selectedTextId || selectedMediaId || selectedTemplateImageId || selectedShapeId);

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-start w-full">
      {/* Columna Izquierda: Lienzo de Edición */}
      <div className="flex flex-col items-center gap-4 bg-gray-50 border border-base-200 rounded-2xl p-5 shadow-inner mx-auto">
        <span className="text-xs uppercase tracking-widest font-bold text-gray-400">
          Mesa de Trabajo ({targetWidth}x{targetHeight} px)
        </span>

        {/* Contenedor del Canvas de Konva (acepta medios arrastrados desde la barra) */}
        <div
          className={`relative bg-white shadow-lg border rounded-lg overflow-hidden flex items-center justify-center select-none transition-all ${
            isDragOver ? "border-brand-orange ring-4 ring-orange-100" : "border-gray-200"
          }`}
          style={{ width: visualWidth, height: visualHeight }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleMediaDrop}
        >
          {isUploadingExternal && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-white/85 text-brand-orange pointer-events-none">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-semibold">Subiendo imagen a R2…</span>
            </div>
          )}
          {externalUploadError && !isUploadingExternal && (
            <div className="absolute top-2 inset-x-2 z-20 rounded-md bg-red-50 border border-red-200 px-2 py-1.5 text-center text-[10px] font-medium text-red-600">
              {externalUploadError}
            </div>
          )}
          {!hasAnySlotMedia && overlays.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300 pointer-events-none z-10 p-4 text-center">
              <LayoutTemplate className="w-8 h-8" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Arrastra aquí un medio desde la barra derecha
              </span>
            </div>
          )}
          <Stage
            width={visualWidth}
            height={visualHeight}
            ref={stageRef}
            onMouseDown={(e) => {
              // Si hace click en el fondo (Stage o imagen de fondo), deseleccionar
              const clickedOnEmpty =
                e.target === e.target.getStage() || e.target.name() === "background";
              if (clickedOnEmpty) deselectAll();
            }}
          >
            <Layer>
              {/* Base neutra cuando no hay imagen (hace visibles los textos claros) */}
              {!hasAnySlotMedia && (
                <Rect
                  name="background"
                  x={0}
                  y={0}
                  width={visualWidth}
                  height={visualHeight}
                  fill="#E5E7EB"
                />
              )}

              {/* Todas las celdas de foto de la plantilla se recortan de forma
                  independiente. El orden respeta el diseño definido en Figma. */}
              {effectivePhotoSlots.map((slot) => (
                <PhotoSlotImage
                  key={slot.id}
                  layer={slot}
                  url={slotMedia[slot.id]}
                  canvasWidth={visualWidth}
                  canvasHeight={visualHeight}
                  selected={slot.id === selectedSlotId}
                  onSelect={() => {
                    setSelectedSlotId(slot.id);
                    setSelectedTextId(null);
                    setSelectedMediaId(null);
                    setSelectedTemplateImageId(null);
                    setSelectedShapeId(null);
                  }}
                  onStatusChange={handleSlotStatusChange}
                />
              ))}

              {/* Capas decorativas de la plantilla: marco, degradados, píldora
                  del CTA y logo. Se dibujan sobre la foto y debajo de los
                  textos, y no son seleccionables. */}
              {decorativeLayers.length > 0 && (
                <TemplateLayers
                  layers={decorativeLayers}
                  ctx={brandCtx}
                  canvasWidth={visualWidth}
                  canvasHeight={visualHeight}
                  imageOverrides={imageOverrides}
                  shapeColorOverrides={shapeColorOverrides}
                  selectedImageId={selectedTemplateImageId}
                  selectedShapeId={selectedShapeId}
                  onSelectImage={(image) => {
                    setSelectedTemplateImageId(image.id);
                    setSelectedSlotId(null);
                    setSelectedTextId(null);
                    setSelectedMediaId(null);
                    setSelectedShapeId(null);
                    setEditingTextValue("");
                  }}
                  onSelectShape={(shape) => {
                    setSelectedShapeId(shape.id);
                    setSelectedTemplateImageId(null);
                    setSelectedSlotId(null);
                    setSelectedTextId(null);
                    setSelectedMediaId(null);
                    setEditingTextValue("");
                  }}
                />
              )}

              {/* Capas de imagen adicionales (movibles y redimensionables) */}
              {overlays.map((node) => (
                <OverlayImage
                  key={node.id}
                  node={node}
                  isSelected={node.id === selectedMediaId}
                  onSelect={() => selectMedia(node.id)}
                  onChange={(updated) =>
                    setOverlays(prev => prev.map(o => (o.id === updated.id ? updated : o)))
                  }
                  onDelete={() => {
                    setOverlays(prev => prev.filter(o => o.id !== node.id));
                    setSelectedMediaId(null);
                  }}
                />
              ))}

              {/* Nodos de Texto */}
              {texts.map((t) => {
                const isSelected = t.id === selectedTextId;
                return (
                  <React.Fragment key={t.id}>
                    {/* Rectángulo de selección flotante para feedback visual */}
                    {isSelected && (
                      <>
                        <Rect
                          x={t.x - 4}
                          y={t.y - 4}
                          // Cálculo aproximado de la caja del texto para dibujar el contorno
                          width={t.text.length * (t.fontSize * 0.58) + 8}
                          height={t.fontSize + 8}
                          stroke="#FF7A00"
                          strokeWidth={1.5}
                          dash={[4, 2]}
                          cornerRadius={2}
                        />
                        <Group
                          x={t.x + t.text.length * (t.fontSize * 0.58) + 4}
                          y={t.y - 12}
                          onClick={(e) => {
                            e.cancelBubble = true;
                            setTexts(prev => prev.filter(item => item.id !== t.id));
                            setSelectedTextId(null);
                            setEditingTextValue("");
                          }}
                          onTap={(e) => {
                            e.cancelBubble = true;
                            setTexts(prev => prev.filter(item => item.id !== t.id));
                            setSelectedTextId(null);
                            setEditingTextValue("");
                          }}
                          onMouseEnter={(e) => {
                            const stage = e.target.getStage();
                            if (stage) stage.container().style.cursor = "pointer";
                          }}
                          onMouseLeave={(e) => {
                            const stage = e.target.getStage();
                            if (stage) stage.container().style.cursor = "default";
                          }}
                        >
                          <Circle
                            radius={9}
                            fill="#EF4444"
                            stroke="#FFFFFF"
                            strokeWidth={1.5}
                            shadowBlur={3}
                            shadowColor="black"
                            shadowOpacity={0.3}
                          />
                          <Line
                            points={[-3, -3, 3, 3]}
                            stroke="#FFFFFF"
                            strokeWidth={1.5}
                            lineCap="round"
                            lineJoin="round"
                          />
                          <Line
                            points={[3, -3, -3, 3]}
                            stroke="#FFFFFF"
                            strokeWidth={1.5}
                            lineCap="round"
                            lineJoin="round"
                          />
                        </Group>
                      </>
                    )}
                    <Text
                      text={t.text}
                      fontSize={t.fontSize}
                      fill={t.color}
                      fontFamily={t.font || defaultFont}
                      fontStyle={canvasFontStyle(t)}
                      letterSpacing={(t.letterSpacingEm ?? 0) * t.fontSize}
                      wrap={t.wrap}
                      align={t.align}
                      width={t.widthRatio ? t.widthRatio * visualWidth : undefined}
                      lineHeight={t.lineHeight}
                      x={t.x}
                      y={t.y}
                      listening={!t.locked}
                      draggable={!t.locked}
                      onDragStart={() => selectText(t)}
                      onDragEnd={(e) => {
                        setTexts(prev =>
                          prev.map(item =>
                            item.id === t.id
                              ? { ...item, x: e.target.x(), y: e.target.y() }
                              : item
                          )
                        );
                      }}
                      onClick={() => selectText(t)}
                      onTap={() => selectText(t)}
                    />
                  </React.Fragment>
                );
              })}
            </Layer>
          </Stage>
        </div>

        <p className="text-[10px] text-gray-400 font-medium text-center">
          💡 Arrastra los textos y las imágenes libremente sobre el lienzo.<br/>
          Puedes soltar una imagen desde tu equipo: se subirá a R2 y se colocará donde la sueltes.
        </p>

      </div>

      {/* Columna Derecha: Panel de Herramientas del Editor */}
      {toolsCollapsed ? (
        <button
          onClick={() => setToolsCollapsed(false)}
          className="w-full xl:w-14 xl:min-h-[260px] bg-white border border-base-200 rounded-2xl p-3 flex xl:flex-col items-center justify-center gap-2 text-gray-500 hover:text-brand-orange hover:border-brand-orange/40 transition-colors"
          title="Mostrar herramientas de diseño"
        >
          <PanelRightOpen className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider xl:[writing-mode:vertical-rl]">
            Herramientas
          </span>
        </button>
      ) : (
      <div className="bg-white border border-base-200 rounded-2xl p-4 w-full xl:w-[310px] xl:flex-none flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold font-primary text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Type className="w-4 h-4 text-brand-orange" />
            Herramientas de Diseño
          </h3>
          <button
            onClick={() => setToolsCollapsed(true)}
            className="btn btn-ghost btn-xs text-gray-400 hover:text-brand-orange shrink-0"
            title="Ocultar herramientas y ampliar la vista previa"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex gap-2">
          <button
            onClick={handleAddText}
            className="btn btn-sm btn-outline border-base-300 hover:bg-base-100 flex-1 gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5 text-brand-orange" />
            Añadir Texto
          </button>

          {hasSelection && (
            <button
              onClick={handleDeleteSelected}
              className="btn btn-sm btn-outline border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 gap-1 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          )}
        </div>

        {/* Cada foto del collage se gestiona por separado; no hay una única
            acción de "fondo" que deje las demás celdas sin control. */}
        <div className="border border-base-200 rounded-xl p-3 flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-orange" />
            Fotos de la plantilla
          </span>
          {effectivePhotoSlots.map((slot, index) => {
            const hasPhoto = Boolean(slotMedia[slot.id]);
            const state = slotLoadStates[slot.id];
            const label = slot.role === "background" ? "Foto principal" : `Foto ${index + 1}`;
            return (
              <div key={slot.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5">
                <button
                  onClick={() => {
                    setSelectedSlotId(slot.id);
                    setSelectedTextId(null);
                    setSelectedMediaId(null);
                    setSelectedTemplateImageId(null);
                    setSelectedShapeId(null);
                  }}
                  className="text-left text-[11px] font-semibold text-gray-600 hover:text-brand-orange flex-1"
                >
                  {label}
                  {hasPhoto && state === "loading" && <span className="ml-1 text-[9px] text-gray-400">cargando…</span>}
                  {hasPhoto && state === "failed" && <span className="ml-1 text-[9px] text-red-500">con error</span>}
                </button>
                {hasPhoto ? (
                  <button
                    onClick={() => {
                      setSlotMedia((previous) => ({ ...previous, [slot.id]: "" }));
                      setSlotLoadStates((previous) => ({ ...previous, [slot.id]: "idle" }));
                    }}
                    className="btn btn-ghost btn-xs text-red-500 hover:bg-red-50"
                    title={`Quitar ${label.toLowerCase()}`}
                  >
                    <ImageOff className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-[9px] text-gray-400">vacía</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Configuración del elemento seleccionado */}
        {selectedText ? (
          <div className="border border-base-200 bg-gray-50/50 rounded-xl p-4 flex flex-col gap-4 animate-fade-in">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              Texto Seleccionado
            </span>

            {/* Input de Contenido */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Contenido del texto:</label>
              <textarea
                value={editingTextValue}
                onChange={handleTextChange}
                placeholder="Escribe el copy aquí..."
                rows={3}
                className="textarea textarea-sm border-base-300 focus:border-brand-orange focus:ring-1 focus:ring-orange-100 rounded-lg text-xs leading-relaxed resize-y min-h-20"
              />
              <p className="text-[10px] text-gray-400">Usa Enter para crear un salto de línea.</p>
            </div>

            {/* Tipografía por elemento: familia de Google, variante y métricas
                equivalentes a las propiedades disponibles en Figma. */}
            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex flex-col gap-1 text-[10px] font-semibold text-gray-500">
                Fuente
                <select
                  value={primaryFamily(selectedText.font || defaultFont)}
                  onChange={(event) => updateSelectedText({ font: event.target.value })}
                  className="select select-xs w-full border-base-300 bg-white text-xs"
                >
                  {Array.from(new Set([primaryFamily(selectedText.font || defaultFont), ...CANVAS_GOOGLE_FONTS])).map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[10px] font-semibold text-gray-500">
                Peso
                <select
                  value={textFontWeight(selectedText)}
                  onChange={(event) => updateSelectedText({ fontWeight: Number(event.target.value) })}
                  className="select select-xs w-full border-base-300 bg-white text-xs"
                >
                  {[300, 400, 500, 600, 700, 800, 900].map((weight) => (
                    <option key={weight} value={weight}>{weight}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-base-200 bg-white px-2.5 py-2 text-[10px] font-semibold text-gray-500">
                <input
                  type="checkbox"
                  checked={selectedText.fontStyle === "italic"}
                  onChange={(event) => updateSelectedText({ fontStyle: event.target.checked ? "italic" : "normal" })}
                  className="checkbox checkbox-xs checkbox-warning"
                />
                Cursiva
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-base-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-gray-500">
                Tracking
                <input
                  type="number"
                  min={-25}
                  max={50}
                  step={1}
                  value={Math.round((selectedText.letterSpacingEm ?? 0) * 100)}
                  onChange={(event) => updateSelectedText({ letterSpacingEm: Number(event.target.value) / 100 })}
                  className="input input-xs min-w-0 w-full border-base-300 text-center"
                />
                <span>%</span>
              </label>
              <label className="col-span-2 flex items-center gap-2 text-[10px] font-semibold text-gray-500">
                Interlineado
                <input
                  type="number"
                  min={0.7}
                  max={2.5}
                  step={0.05}
                  value={selectedText.lineHeight ?? 1}
                  onChange={(event) => updateSelectedText({ lineHeight: Number(event.target.value) })}
                  className="input input-xs flex-1 border-base-300 text-center"
                />
              </label>
            </div>

            {/* Paleta de Colores: presets corporativos + selector libre */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Color del texto:</label>
              <div className="flex items-center gap-3">
                {[
                  { name: "Naranja", hex: "#F59C1D" },
                  { name: "Blanco", hex: "#FFFFFF" },
                  { name: "Amarillo", hex: "#FAE200" },
                  { name: "Negro", hex: "#111111" }
                ].map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => handleColorChange(color.hex)}
                    className={`w-7 h-7 rounded-full border shadow-xs transition-transform ${
                      selectedText.color.toUpperCase() === color.hex ? "scale-110 ring-2 ring-brand-orange/40" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.hex, borderColor: color.hex === "#FFFFFF" ? "#E5E7EB" : color.hex }}
                    title={color.name}
                  >
                    {selectedText.color.toUpperCase() === color.hex && (
                      <Check className={`w-3.5 h-3.5 mx-auto ${color.hex === "#FFFFFF" || color.hex === "#FAE200" ? "text-gray-800" : "text-white"}`} />
                    )}
                  </button>
                ))}

                {/* Selector libre: cualquier color */}
                <label
                  className="relative w-7 h-7 rounded-full border border-gray-200 shadow-xs cursor-pointer overflow-hidden hover:scale-105 transition-transform shrink-0"
                  title="Elegir cualquier color"
                  style={{ background: "conic-gradient(#ef4444, #f59e0b, #84cc16, #06b6d4, #6366f1, #d946ef, #ef4444)" }}
                >
                  <input
                    type="color"
                    value={selectedText.color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>

                <div className="flex items-center gap-1.5 ml-auto">
                  <span
                    className="w-4 h-4 rounded border border-gray-200 shrink-0"
                    style={{ backgroundColor: selectedText.color }}
                  />
                  <span className="text-[10px] font-mono text-gray-500 uppercase">{selectedText.color}</span>
                </div>
              </div>
            </div>

            {/* Selector de Tamaño de Letra: deslizador + valor editable */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Tamaño de la tipografía:</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={24}
                  max={240}
                  step={1}
                  value={Math.round(selectedText.fontSize * exportScale)}
                  onChange={(e) => handleFontSizeSet(Number(e.target.value))}
                  className="range range-xs [--range-shdw:#F59C1D] flex-1"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min={8}
                    max={300}
                    value={Math.round(selectedText.fontSize * exportScale)}
                    onChange={(e) => handleFontSizeSet(Number(e.target.value))}
                    className="input input-xs w-16 border-base-300 focus:border-brand-orange text-xs font-bold text-center rounded"
                  />
                  <span className="text-[10px] text-gray-400 font-semibold">px</span>
                </div>
              </div>
            </div>
          </div>
        ) : selectedShape ? (
          <div className="border border-base-200 bg-gray-50/50 rounded-xl p-4 flex flex-col gap-4 animate-fade-in">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-orange" />
              Objeto seleccionado
            </span>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500">Color del objeto:</label>
              <div className="flex items-center gap-3">
                {[
                  { name: "Primario", hex: brandCtx.brand.primary },
                  { name: "Secundario", hex: brandCtx.brand.secondary },
                  { name: "Blanco", hex: brandCtx.brand.light },
                  { name: "Negro", hex: brandCtx.brand.dark }
                ].map((color) => (
                  <button
                    key={`${color.name}-${color.hex}`}
                    onClick={() => setShapeColorOverrides((previous) => ({ ...previous, [selectedShape.id]: color.hex }))}
                    className={`w-8 h-8 rounded-full border shadow-xs transition-transform ${
                      selectedShapeColor.toUpperCase() === color.hex.toUpperCase()
                        ? "scale-110 ring-2 ring-brand-orange/40"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.hex, borderColor: color.hex.toUpperCase() === "#FFFFFF" ? "#E5E7EB" : color.hex }}
                    title={color.name}
                  >
                    {selectedShapeColor.toUpperCase() === color.hex.toUpperCase() && (
                      <Check className={`w-3.5 h-3.5 mx-auto ${color.hex.toUpperCase() === "#FFFFFF" ? "text-gray-800" : "text-white"}`} />
                    )}
                  </button>
                ))}
                <label
                  className="relative w-8 h-8 rounded-full border border-gray-200 shadow-xs cursor-pointer overflow-hidden hover:scale-105 transition-transform"
                  title="Elegir cualquier color"
                  style={{ background: "conic-gradient(#ef4444, #f59e0b, #84cc16, #06b6d4, #6366f1, #d946ef, #ef4444)" }}
                >
                  <input
                    type="color"
                    value={selectedShapeColor}
                    onChange={(event) => setShapeColorOverrides((previous) => ({ ...previous, [selectedShape.id]: event.target.value }))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg bg-white border border-base-200 px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: selectedShapeColor }} />
                  <span className="text-[10px] font-mono text-gray-500 uppercase">{selectedShapeColor}</span>
                </div>
                {shapeColorOverrides[selectedShape.id] && (
                  <button
                    onClick={() => setShapeColorOverrides((previous) => {
                      const restored = { ...previous };
                      delete restored[selectedShape.id];
                      return restored;
                    })}
                    className="btn btn-ghost btn-xs text-gray-500"
                  >
                    Restaurar
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Los colores primario y secundario corresponden a la identidad configurada del proyecto.
            </p>
          </div>
        ) : selectedSlot ? (
          <div className="border border-base-200 bg-gray-50/50 rounded-xl p-4 flex flex-col gap-3 animate-fade-in">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-orange" />
              Celda de Foto
            </span>
            <p className="text-xs text-gray-500 leading-relaxed">
              Arrastra una imagen desde la barra lateral sobre esta celda para reemplazarla. La foto se recorta automáticamente sin modificar el diseño.
            </p>
            {slotMedia[selectedSlot.id] && (
              <button
                onClick={() => {
                  setSlotMedia((previous) => ({ ...previous, [selectedSlot.id]: "" }));
                  setSlotLoadStates((previous) => ({ ...previous, [selectedSlot.id]: "idle" }));
                }}
                className="btn btn-sm btn-outline border-red-200 text-red-500 hover:bg-red-50 gap-1 text-xs self-start"
              >
                <ImageOff className="w-3.5 h-3.5" />
                Quitar foto de esta celda
              </button>
            )}
          </div>
        ) : selectedTemplateImage ? (
          <div className="border border-base-200 bg-gray-50/50 rounded-xl p-4 flex flex-col gap-3 animate-fade-in">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-orange" />
              {selectedTemplateImage.label || "Imagen de plantilla"}
            </span>
            <p className="text-xs text-gray-500 leading-relaxed">
              Arrastra una imagen desde “Medios del proyecto” directamente sobre esta área para reemplazarla.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setImageOverrides((previous) => ({ ...previous, [selectedTemplateImage.id]: null }));
                }}
                className="btn btn-sm btn-outline border-red-200 text-red-500 hover:bg-red-50 gap-1 text-xs"
              >
                <ImageOff className="w-3.5 h-3.5" />
                Quitar
              </button>
              {Object.prototype.hasOwnProperty.call(imageOverrides, selectedTemplateImage.id) && (
                <button
                  onClick={() => {
                    setImageOverrides((previous) => {
                      const restored = { ...previous };
                      delete restored[selectedTemplateImage.id];
                      return restored;
                    });
                  }}
                  className="btn btn-sm btn-outline border-base-300 hover:bg-base-100 text-xs"
                >
                  Restaurar original
                </button>
              )}
            </div>
          </div>
        ) : selectedMediaId ? (
          <div className="border border-base-200 bg-gray-50/50 rounded-xl p-4 flex flex-col gap-4 animate-fade-in">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-orange" />
              Capa de Imagen Seleccionada
            </span>
            <p className="text-xs text-gray-500 leading-relaxed">
              Arrastra la imagen para reubicarla o usa las manijas naranjas del lienzo para cambiar su tamaño.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleBringToFront}
                className="btn btn-sm btn-outline border-base-300 hover:bg-base-100 gap-1 text-xs"
              >
                <ArrowUp className="w-3.5 h-3.5 text-brand-orange" />
                Traer al frente
              </button>
              <button
                onClick={handleSendToBack}
                className="btn btn-sm btn-outline border-base-300 hover:bg-base-100 gap-1 text-xs"
              >
                <ArrowDown className="w-3.5 h-3.5 text-brand-orange" />
                Enviar atrás
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-base-300 rounded-xl p-8 text-center text-gray-400 text-xs">
            Selecciona un texto o una imagen en el lienzo para personalizarlos.
          </div>
        )}

        {/* Guardar como Plantilla reutilizable */}
        <div className="border border-base-200 bg-orange-50/30 rounded-xl p-4 flex flex-col gap-2.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1.5">
            <LayoutTemplate className="w-3.5 h-3.5 text-brand-orange" />
            Guardar como Plantilla
          </span>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Guarda la medida del lienzo y la posición de los textos para reutilizarlos con otros medios.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Nombre de la plantilla..."
              className="input input-sm border-base-300 focus:border-brand-orange rounded-lg text-xs flex-1"
              disabled={isSavingTemplate}
            />
            <button
              onClick={handleSaveAsTemplate}
              disabled={!templateName.trim() || isSavingTemplate}
              className="btn btn-sm btn-outline border-brand-orange/40 text-brand-orange hover:bg-orange-50 hover:border-brand-orange gap-1 text-xs"
            >
              {isSavingTemplate ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Guardar
            </button>
          </div>
          {templateFeedback && (
            <p className={`text-[10px] font-semibold ${templateFeedback.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
              {templateFeedback}
            </p>
          )}
        </div>

        {/* Botón de Finalización */}
        <div className="mt-4 pt-4 border-t border-base-100 flex flex-col gap-2">
          <button
            onClick={handleExport}
            disabled={isSaving || hasLoadingSlots}
            className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0 w-full"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Guardando en la nube...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Finalizar y Guardar Publicación
              </>
            )}
          </button>
        </div>
      </div>
      )}

      {/* Barra lateral derecha: Medios arrastrables del proyecto */}
      {showMediaBar && <MediaSidebar />}
    </div>
  );
};

const TemplateEditor: React.FC<TemplateEditorProps> = (props) => {
  if (props.template?.version === 3) {
    return <DomTemplateEditor {...props} template={props.template} />;
  }
  return <KonvaTemplateEditor {...props} template={props.template as CanvasTemplateV2 | null | undefined} />;
};

export default TemplateEditor;
