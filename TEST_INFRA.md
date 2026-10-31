# E2E Test & Verification Infrastructure — Livigno Typologies & Units

## Overview
This document describes the automated, opaque-box end-to-end testing and verification suite built for the Livigno real estate interactive showroom. The test suite guarantees complete adherence to user requirements R1, R2, and R3, cryptographic and visual asset fidelity against the authoritative reference directory (`/Users/andrespluska/Downloads/4. TIPOLOGÍAS COMPLETO`), and zero-defect production build health.

---

## Test Architecture (4-Tier Framework)

The test suite is partitioned into four independent, self-contained tiers located under `tests/e2e/`:

```
tests/e2e/
├── helpers/
│   ├── test-constants.ts           # Authoritative typologies metadata, gallery counts, unit lists, resolution & fps constants
│   └── asset-helpers.ts            # WebP binary parser (VP8/VP8L/VP8X), ffprobe metadata extractor, MD5 checksum, file collector
├── tier1-feature-coverage.test.ts  # Tier 1: Unit & Typology asset coverage, WebP dimensions & headers, video transition specs
├── tier2-boundary-corner.test.ts   # Tier 2: Duplex T12 multi-floor assets & transitions, edge units, legacy format fallback independence
├── tier3-cross-feature.test.ts     # Tier 3: Complete 3-node transition graph (6 directed edges), bidirectional manifest-disk sync, geometry & tour sync
├── tier4-parity-and-build.test.ts  # Tier 4: 100% reference parity audit, Next.js production build, 0 TypeScript errors
└── run-all.ts                      # Master runner with colored reporting, summary table, and exit code handling
```

### Tier Breakdown & Test Counts

| Tier | Focus Area | Test Count | Description |
|:---:|:---|:---:|:---|
| **Tier 1** | **Feature Coverage** | **21 tests** | Verifies asset presence for all 42 units across floors 2–17, all 12 typologies (T1–T12), binary WebP headers and 3840x2160 resolution, and 1080p 60fps MP4 transition specs. (>=5 tests per feature). |
| **Tier 2** | **Boundary & Corner Cases** | **14 tests** | Verifies Duplex T12 Floor 1 and Floor 2 assets (`plans_2floor.webp`, `furnished_2floor.webp`, 12 transitions), edge units (Unit 201, Penthouse 1601, top units 1502/1602, sold units), and primary WebP resolution in page.tsx and build scripts. |
| **Tier 3** | **Cross-Feature Combinations** | **14 tests** | Verifies the complete 3-node directed graph (6 transitions between plans, furnished, and unfurnished), UI navigation state (`getNavState()`), bidirectional manifest-to-disk and disk-to-manifest integrity (zero orphan files), and SVG geometry/tour synchronization. |
| **Tier 4** | **Real-World Parity & Build** | **8 tests** | Executes a 100% cryptographic and dimension parity audit against `/Users/andrespluska/Downloads/4. TIPOLOGÍAS COMPLETO`, isolates draft 24fps files from `VIDEOS ANDY`, and verifies `npm run build` exits with code 0. |
| **TOTAL** | **Full Suite** | **57 tests** | **100% pass rate across 16 test suites in ~12–14s**. |

---

## How to Run the Tests

### 1. Run Complete Test Suite via NPM
```bash
npm test
```
*Executes all 57 tests across Tiers 1–4 using Node's native test runner with TypeScript support via `tsx`.*

### 2. Run Complete Suite with Structured Master Report
```bash
npm run test:e2e
# OR
npx tsx tests/e2e/run-all.ts
```
*Runs all tiers sequentially, prints a clean ASCII summary table, and surfaces any identified defects with non-zero exit code if failures occur.*

### 3. Run Individual Tiers
```bash
# Tier 1 - Feature Coverage
node --import tsx --test tests/e2e/tier1-feature-coverage.test.ts

# Tier 2 - Boundary & Corner Cases
node --import tsx --test tests/e2e/tier2-boundary-corner.test.ts

# Tier 3 - Cross-Feature Combinations
node --import tsx --test tests/e2e/tier3-cross-feature.test.ts

# Tier 4 - Reference Parity & Build Health
node --import tsx --test tests/e2e/tier4-parity-and-build.test.ts
```

---

## Verification Criteria & Expected Outputs

### Asset Completeness & Resolution
- **Units**: 42 residential units across Floors 2 to 17.
- **Typologies**: 12 typologies (`T1` through `T12`).
- **WebP Plans**: 39 unique floor plans (33 standard + 6 duplex floor 1 & 2), all formatted as `.webp` at **3840 x 2160** pixels.
- **Gallery Images**: 98 gallery images matching exact typology distribution:
  - T1: 10, T2: 7, T3: 7, T4: 10, T5: 6, T6: 7, T7: 7, T8: 7, T9: 7, T10: 9, T11: 7, T12: 14.
- **Image Format**: WebP container with valid RIFF header (`RIFF....WEBPVP8 `).

### Video Transition Standards
- **Video Count**: 78 production transition MP4 files (66 standard + 12 duplex).
- **Resolution**: 1920 x 1080 (1080p Full HD).
- **Framerate**: 60.0 fps (H.264/AVC).
- **Duration**: 2.50s (150 frames).
- **Mapping Verification**: `plans_to_furnished.mp4` matches CAD-to-Amoblado (`02_cad_a_a`), NOT CAD-to-Entregable (`03_cad_a_e`).

### Reference Directory Parity
- **Source**: `/Users/andrespluska/Downloads/4. TIPOLOGÍAS COMPLETO`.
- **Status**: 100% parity across all 39 plans, 98 gallery renders, and 78 transition animations.
- **Draft Isolation**: 24fps draft files in `VIDEOS ANDY` are strictly isolated from production assets.

### Build Verification
- **Command**: `npm run build`
- **Exit Code**: `0`
- **Routes Generated**: 41/41 routes compiled successfully.
- **TypeScript Errors**: `0`
