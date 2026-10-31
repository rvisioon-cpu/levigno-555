import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { GLOBAL_CANVAS_TEMPLATES } from "@/data/canvas-templates";
import { post6 } from "@/data/canvas-templates/post-6-degradado";
import { isTemplateV3, normalizeTemplate } from "./template-schema";

test("Post 6 is a native DOM template with valid geometry", () => {
  assert.equal(post6.version, 3);
  assert.equal(post6.width, 1080);
  assert.equal(post6.height, 1350);
  assert.equal(post6.layers.length, 18);

  for (const layer of post6.layers) {
    const [x, y, width, height] = layer.bounds;
    assert.ok(width > 0 && height > 0, `${layer.id} must have a positive box`);
    assert.ok(x >= 0 && y >= 0, `${layer.id} must start inside the canvas`);
    assert.ok(x + width <= post6.width, `${layer.id} exceeds the canvas width`);
    assert.ok(y + height <= post6.height, `${layer.id} exceeds the canvas height`);

    if (layer.type === "image" && layer.src.startsWith("/")) {
      assert.ok(fs.existsSync(`public${layer.src}`), `${layer.id} asset is missing`);
    }
  }
});

test("all editable Post 6 text has an explicit overflow policy", () => {
  const textLayers = post6.layers.filter((layer) => layer.type === "text");
  assert.ok(textLayers.length > 0);
  for (const layer of textLayers) {
    assert.equal(layer.overflow, "shrink", `${layer.id} must shrink before overflowing`);
    assert.ok((layer.minFontSize ?? 0) > 0, `${layer.id} must define a minimum font size`);
  }
});

test("the global catalog uses the shared DOM renderer", () => {
  for (const template of GLOBAL_CANVAS_TEMPLATES) {
    assert.equal(template.version, 3, `${template.name} must be a DOM template`);
  }
});

test("normalization preserves v3 instead of downgrading it to Konva", () => {
  const normalized = normalizeTemplate(post6, {
    name: post6.name,
    width: post6.width,
    height: post6.height,
    aspectRatio: post6.aspectRatio
  });
  assert.ok(isTemplateV3(normalized));
  assert.equal(normalized.layers[0].type, "photo-slot");
});
