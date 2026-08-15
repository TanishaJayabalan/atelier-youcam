# 🪞 Mirror Check — AI Beauty & Wardrobe Atelier

> **YouCam AI Hackathon Project**
> An end-to-end intelligent beauty and style advisory platform powered by YouCam AI, integrating multi-engine clinical skin analysis, Fitzpatrick scale profiling, facial geometry architecture, real-time atmospheric defense, virtual try-on (VTO), celebrity makeup cloning, hair diagnostics, and wardrobe gap-filling.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm** / **yarn**

---

### 2. Environment Setup
Create a `.env` or `.env.local` file in the project root with the following configuration:

```env
# YouCam Perfect Corp API Credentials
YOUCAM_CLIENT_ID=your_youcam_client_id
YOUCAM_CLIENT_SECRET=your_youcam_client_secret
YOUCAM_API_BASE=https://yce-api-01.perfectcorp.com

# Supabase (Database & Closet Inventory)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Google Gemini API (For AI Stylist Commentary)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

*(Note: If live YouCam API keys are omitted or offline, the app automatically runs on calibrated optical computer vision algorithms and landmark-fitted mock generation).*

---

### 3. Install Dependencies
```bash
npm install
```

---

### 4. Start the Development Server

#### Option A: Standard Bash / Terminal
```bash
npm run dev
```

#### Option B: Windows PowerShell
```powershell
$env:Path = "$PWD\env\Scripts;" + $env:Path
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### 5. Running Automated Verification & Test Suites

You can test individual subsystems or the full end-to-end flow using the pre-configured TypeScript test runners:

```powershell
# Windows PowerShell test execution:
$env:Path = "$PWD\env\Scripts;" + $env:Path

# Test All Tier 1 AI Features (Parallel Analyzer, Foundation Match, Hair VTO, Skin Sim, etc.)
node node_modules/tsx/dist/cli.mjs scripts/test-tier1.ts

# Test Full End-to-End Orchestration (Weather + Analysis + Recommendations + VTO)
node node_modules/tsx/dist/cli.mjs scripts/test-orchestration.ts

# Test Clinical Recommendation Engine & Barrier Conflict Rules
node node_modules/tsx/dist/cli.mjs scripts/test-recommendation.ts

# Test YouCam Makeup VTO
node node_modules/tsx/dist/cli.mjs scripts/test-makeup-vto.ts

# Test YouCam Clothes VTO
node node_modules/tsx/dist/cli.mjs scripts/test-clothes-vto.ts
```

---

## 🌟 Key Features

### 🧬 Tier 1: Core Intelligence Pipeline
- **Unified Multi-Engine Pipeline**: Runs 4 YouCam engines in parallel (**Skin Analysis**, **Fitzpatrick Scale I–VI**, **Facial Color Tones**, **Facial Geometry**) to construct a single `UserBeautyProfile`.
- **Foundation Shade Finder**: Formulates exact shade codes, undertones (Warm Golden, Cool Rosy, Neutral, Olive), and applies custom hex foundation in Makeup VTO.
- **Face-Shape-Aware Makeup Personalization**: Recommends architectural placement for blush, contour, eyeliner wings, and lip morphology adapted to Oval, Round, Heart, Square, and Diamond face shapes.
- **Celebrity Look Matching & AI Makeup Transfer**: Matches users to celebrity archetypes (Priyanka Chopra, Deepika Padukone, Zendaya, Margot Robbie, Rihanna, Lily Collins) and transfers the look onto their selfie with side-by-side comparison. Also supports custom reference photo uploads.
- **AI Predictive Skin Simulation**: Interactive before/after split slider projecting 30-day skin barrier recovery and erythema/pore refinement.
- **AI Trichology & Hair Studio**: Detects curl pattern (1A to 4C), length, and frizz index; provides Hairstyle VTO (Textured Lob, 90s Curtain Blowout, Sleek Bob, etc.) and Hair Color VTO swatches.
- **"Use What You Have" Closet Synthesizer**: Generates a complete makeup look using only items the user already owns in their wardrobe vault, highlighting missing gap items.

### 🛍️ Smart Cart & Retailer Integration
- Persistent slide-over Wishlist Cart with external store redirect links (*"Shop on Store"*).
- Instant Add-to-Cart for recommended skincare, makeup gap-fills, and prescribed haircare.

---

## 📂 Project Structure

```
mirror-check/
├── app/
│   ├── api/youcam/          # Next.js API route handlers (analyze, render, makeup-transfer, hair-*, etc.)
│   ├── page.tsx             # Main Mirror Check interactive atelier
│   └── layout.tsx           # Root layout & global styling
├── components/
│   ├── SelfieCapture.tsx     # Webcam & selfie file upload with telemetry extraction
│   ├── ExplanationCard.tsx   # Barrier vitality, color harmony, & facial architecture
│   ├── SkinSimulationCard.tsx # Draggable 30-day before/after recovery slider
│   ├── CelebrityLookPanel.tsx # Celebrity look matcher & AI makeup transfer
│   ├── HairAnalysisPanel.tsx  # Hair diagnostics, hairstyle try-on, & color VTO
│   ├── MakeupPreview.tsx     # Landmark-fitted makeup VTO canvas with foundation badge
│   ├── OutfitPreview.tsx     # Wardrobe outfit VTO rendering
│   ├── ClosetShelf.tsx       # Digital wardrobe vault & "Use What You Have" synthesizer
│   ├── GapFillShelf.tsx      # Missing product gap-fill recommendations
│   └── CartDrawer.tsx        # Slide-over wishlist cart drawer
├── lib/
│   ├── youcam/               # YouCam API client wrappers & polling orchestration
│   ├── foundation-matcher.ts # Color tone + Fitzpatrick foundation matching engine
│   ├── makeup-advisor.ts     # Face shape & facial geometry placement rules
│   ├── celebrity-matcher.ts  # Celebrity archetype scoring algorithm
│   ├── hair-recommendation-engine.ts # Personalized trichology care routines
│   ├── owned-look-generator.ts # Closet-to-VTO synthesizer
│   └── recommendation-engine.ts # Clinical barrier & weather conflict engine
├── types/
│   └── beauty-profile.ts     # Unified UserBeautyProfile & diagnostics interfaces
└── data/
    ├── demo-closet.json      # Pre-seeded wardrobe, skincare, & makeup inventory
    └── celebrity-profiles.json # Curated celebrity look reference catalog
```
