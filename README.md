# Showroom Virtual - Levigno

Showroom virtual interactivo para Levigno. Diseñado para ofrecer una experiencia inmersiva del proyecto inmobiliario.

## 🚀 Quick Start

### 1. Clone the Template
```bash
git clone https://github.com/pluska/showroom-template.git your-project-name
cd your-project-name
npm install
```

### 2. Configure Environment
Create a `.env.local` file:
```bash
NEXT_PUBLIC_ASSET_BASE_URL=https://your-assets-storage.com
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

### 3. "Fill" Your Project
Update the project identity and data:
- **Identity**: Edit `src/config/config.ts`
- **Building**: Edit `src/data/buildingData.ts`
- **Units & Floors**: Edit `src/data/floors.ts`
- **Map**: Edit `src/data/locations.ts`
- **Tours**: Edit `src/data/tours.ts`

### 4. Run Development
```bash
npm run dev
```

---

## 📂 Documentation

- [**CLONE_AND_FILL.md**](./CLONE_AND_FILL.md): Detailed step-by-step setup guide.
- [**STRUCTURE.md**](./STRUCTURE.md): Overview of the project architecture and file organization.
- [**RULES_AI.md**](./RULES_AI.md): Essential rules for AI coding assistants to maintain template integrity.

## ✨ Key Features

- **360° Scene Controller**: Smooth transitions between building faces with background video support.
- **Interactive Floor Plans**: SVG-based unit highlighting and status management.
- **Virtual Tours Integration**: Seamless embedding of Matterport or similar 360° tours.
- **Dynamic Map**: Custom Mapbox integration with route calculation.
- **Mobile First**: Fully responsive design optimized for mobile showroom experiences.

## 🛠 Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS
- **Animations**: GSAP (GreenSock)
- **State Management**: Zustand
- **Maps**: React Map GL (Mapbox)
- **Icons**: Lucide React

## Cloudflare Pages

The project is deployed to Cloudflare Pages with the OpenNext adapter. Pages is configured with the existing `levigno-db` D1 database and `levigno-assets` R2 bucket. Public project media uses the R2 binding, with Pages static assets as a fallback.

```bash
npm install
npm run dev          # Next.js development server
npm run pages:build  # Build the Pages worker and assets
npm run deploy       # Build and deploy the Pages project
```

`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` and `NEXT_PUBLIC_MAPBOX_STYLE_URL` must be available during the build. The contact form returns a temporary configuration message until the sales email and Resend are configured.
