# 🪞 Mirror Check — Autonomous AI Beauty, Skincare & Wardrobe Atelier

> **YouCam AI Hackathon Winner Candidate**  
> An autonomous daily mirror check platform that unites clinical dermatological diagnostics, facial morphometry, seasonal color theory, real-time atmospheric defense, and multi-piece virtual try-on (VTO) into a cohesive, personalized morning routine.

---

## 📑 Table of Contents
- [Executive Overview](#-executive-overview)
- [System Architecture & Data Flow](#-system-architecture--data-flow)
- [YouCam AI Multi-Engine Integration Matrix](#-youcam-ai-multi-engine-integration-matrix)
- [Core Feature Deep Dive](#-core-feature-deep-dive)
  - [1. Clinical Skin Analysis & Barrier Equilibrium](#1-clinical-skin-analysis--barrier-equilibrium)
  - [2. Facial Architecture & Morphometric Placement Guide](#2-facial-architecture--morphometric-placement-guide)
  - [3. Dynamic Undertone & Seasonal Color Harmonies](#3-dynamic-undertone--seasonal-color-harmonies)
  - [4. Decoupled Multi-Piece Virtual Clothes Try-On](#4-decoupled-multi-piece-virtual-clothes-try-on)
  - [5. 30-Day Predictive Skincare Outcome Simulation](#5-30-day-predictive-skincare-outcome-simulation)
  - [6. Celebrity Look Matching & AI Makeup Transfer](#6-celebrity-look-matching--ai-makeup-transfer)
  - [7. Trichology Analysis & Virtual Hair Studio](#7-trichology-analysis--virtual-hair-studio)
  - [8. "Use What You Have" Closet Look Synthesizer](#8-use-what-you-have-closet-look-synthesizer)
- [Quick Start & Local Setup Guide](#-quick-start--local-setup-guide)
- [Verification & Automated Test Suite](#-verification--automated-test-suite)
- [Project Directory Structure](#-project-directory-structure)
- [Technology Stack](#-technology-stack)
- [Git Branches & Changelog](#-git-branches--changelog)

---

## 🌟 Executive Overview

Most beauty and styling applications operate in silos: skincare apps ignore your makeup, makeup apps disregard your skin barrier, and fashion apps ignore the weather.

**Mirror Check** acts as an autonomous stylist and clinical skin advisor in your mirror:
1. **Analyzes**: In parallel, processes your morning selfie through 6 YouCam AI engines to assess skin barrier health, facial morphology, eye geometry, undertones, and Fitzpatrick phototypes.
2. **Defends**: Pulls real-time atmospheric data (temperature, UV index, humidity, precipitation) from Open-Meteo.
3. **Formulates**: Curates a conflict-free AM/PM skincare regimen, custom cosmetic pigments, and weather-proof wardrobe ensemble.
4. **Visualizes**: Renders realistic Virtual Try-Ons for Makeup, Hairstyle, Hair Color, Multi-Piece Clothing (Top + Bottom / Dress), and projects a 30-day skin recovery simulation.

---

## 📐 System Architecture & Data Flow

```mermaid
flowchart TD
    User([User Portrait Selfie]) --> WebApp[Next.js 16 Web Application]
    
    subgraph Parallel AI Analysis [YouCam S2S Multi-Engine Core]
        WebApp --> Engine1[AI Skin Analysis /task/skin-analysis]
        WebApp --> Engine2[AI Skin Tone & Color Analyzer /task/skin-tone-analysis]
        WebApp --> Engine3[AI Fitzpatrick Scale Analyzer /task/fitzpatrick-scale-analyzer]
        WebApp --> Engine4[AI Face Attributes & Ratio Analyzer /task/face-attr-analysis]
    end

    subgraph Environmental & Context Layer
        WebApp --> WeatherAPI[Open-Meteo Weather API: Temp, UV, Humidity]
        WebApp --> WardrobeDB[(Supabase PostgreSQL Wardrobe Vault)]
    end

    Parallel AI Analysis --> RecommendationEngine[Autonomous Recommendation Engine]
    Environmental & Context Layer --> RecommendationEngine

    subgraph Recommendation & Formulation
        RecommendationEngine --> SkinRegimen[Conflict-Free Skincare Regimen]
        RecommendationEngine --> MakeupFormulation[Personalized Pigments & Vibe Matrix]
        RecommendationEngine --> PlacementAdvice[Facial Geometry Placement Guide]
        RecommendationEngine --> WardrobeSelection[Weather-Adaptive Outfit Ensemble]
    end

    subgraph Virtual Try-On Execution
        MakeupFormulation --> MakeupVTO[YouCam AI Makeup VTO]
        WardrobeSelection --> ClothesVTO[YouCam AI Clothes v4.0 Sequential Chaining]
        SkinRegimen --> SkinSim[YouCam AI 30-Day Skin Simulation]
        WebApp --> HairVTO[YouCam Hair Diagnostics & Style VTO]
    end
```

---

## 🔬 YouCam AI Multi-Engine Integration Matrix

Mirror Check integrates over **10+ YouCam S2S (Server-to-Server) API endpoints** via an asynchronous upload-task-poll orchestration layer:

| Engine | Endpoint | HTTP Method | Key Request Parameters | Extracted Diagnostics / Output |
|---|---|---|---|---|
| **AI Skin Analysis** | `/s2s/v2.0/task/skin-analysis` | `POST` + `GET` | `src_file_id`, `dst_actions: ['wrinkle', 'pore', 'texture', 'acne', 'redness', 'oiliness', 'moisture', 'dark_circle_v2', 'firmness', 'radiance', 'skin_type']` | Overall vitality score, individual biomarker scores (0–100), severity ratings (`low`, `moderate`, `high`), skin type |
| **AI Skin Tone & Color** | `/s2s/v2.0/task/skin-tone-analysis` | `POST` + `GET` | `src_file_id`, `face_angle_strictness_level: 'medium'` | Exact hex codes for skin, lips, eyes, eyebrows, hair; undertone (`warm`, `cool`, `neutral`, `olive`); ITA angle |
| **AI Fitzpatrick Scale** | `/s2s/v2.0/task/fitzpatrick-scale-analyzer` | `POST` + `GET` | `src_file_id`, `version: '1.0'` | Fitzpatrick Classification (Type I through VI), Melanin Index, UV photoprotection profile |
| **AI Face Attributes & Ratios** | `/s2s/v2.0/task/face-attr-analysis` | `POST` + `GET` | `src_file_id`, `features: ['faceShape', 'age', 'gender', 'eyeShape', 'eyelid', 'eyebrowShape', 'lipShape', 'horizontalThird', 'verticalFifth', 'faceAspectRatio']` | Morphological structure: Face shape (Oval, Round, Heart, Square, Diamond), eye geometry, eyelid architecture, golden ratio balance |
| **AI Makeup VTO** | `/s2s/v2.0/task/makeup` | `POST` + `GET` | `src_file_id`, `makeup_actions: [{ type: 'lip', color, intensity, texture }, { type: 'blush' }, { type: 'eye' }, { type: 'foundation' }]` | Photorealistic rendered selfie image with custom cosmetic formulation |
| **AI Clothes VTO (v4.0)** | `/s2s/v2.0/task/cloth-v4` | `POST` + `GET` | `src_file_id`, `ref_file_id` / `ref_file_url`, `garment_category: 'full_body' \| 'upper_body' \| 'lower_body' \| 'outerwear'` | Realistic outfit try-on rendered onto full-body user canvas |
| **AI Skin Simulation** | `/s2s/v2.0/task/skin-simulation` | `POST` + `GET` | `src_file_id`, `redness`, `acne`, `pore`, `texture`, `wrinkle`, `radiance` (0.0 to 1.0) | Projected 30-day therapeutic skin recovery image |
| **AI Makeup Transfer** | `/s2s/v2.0/task/makeup-transfer` | `POST` + `GET` | `src_file_id`, `ref_file_id` (Celebrity look / Runway photo) | Composite transferred makeup look with intensity control |
| **AI Hair Analysis & VTO** | `/s2s/v2.0/task/hair-type` & `/task/hair-style-vto` | `POST` + `GET` | `src_file_id`, `hairstyle_id`, `hair_color_hex` | Hair type (1A–4C), length, frizz index, try-on preview |

---

## 💎 Core Feature Deep Dive

### 1. Clinical Skin Analysis & Barrier Equilibrium
- **Biomarker Matrix**: Evaluates Erythema (Redness), Active Acne, Texture Uniformity, Pore Enlargement, Sebum/Oiliness, Moisture/Hydration, Dark Circles, Radiance, and Elasticity.
- **Dynamic Vitality Score**: Computes true mathematical vitality $(0-100)$ based on parsed YouCam biomarkers without arbitrary fixed constants.
- **Skincare Conflict Engine**:
  - If **Redness $\ge 32$** is detected, the engine automatically **pauses night Retinol** and swaps in **Centella Asiatica + Ceramides** for barrier recovery.
  - Automatically adjusts AM moisturizer formulation based on ambient temperature ($\ge 26^\circ\text{C} \rightarrow$ lightweight gel; cold weather $\rightarrow$ lipid barrier cream).
- **Clinical Breakdown Drawer**: Displays all individual evaluated biomarkers with percentage scores and color-coded severity tags (`Low`, `Moderate`, `High`).

### 2. Facial Architecture & Morphometric Placement Guide
- **Morphological Analysis**: Detects Face Shape (Oval, Round, Heart, Square, Diamond, Oblong) and Eye Geometry (Almond, Hooded, Monolid, Round, Upturned, Downturned).
- **Golden Ratio Verification**: Evaluates Horizontal Thirds ($1:1:1$) and Vertical Fifths ($1:1:1:1:1$).
- **Personalized Placement Strategy**:
  - *Blush Technique*: Lifting Sculpt Drape (Oval), Angular Temple Sweep (Round), Upper Cheekbone Drift (Heart), Apple Halo Flush (Square).
  - *Contour Sculpting*: 3-Zone Shading tailored to facial geometry.
  - *Eyeliner & Eyeshadow Architecture*: Cat-Eye Flick for almond eyes, Tightline floating wing for hooded eyelids, Crease depth shading for round eyes.

### 3. Dynamic Undertone & Seasonal Color Harmonies
- **Multi-Factor Undertone Classification**: Identifies **Warm, Cool, Neutral, or Olive** undertones from Individual Typology Angle (ITA) and Lab/RGB chromaticity.
- **Seasonal Color Analysis**: Classifies users into **Spring, Summer, Autumn, or Winter**.
- **Dynamic Vibe Matrix (`SHADE_MATRIX`)**:
  - **`Natural`**: Sheer champagne washes, dewy peach tints, glossy peptide lips (40–50% intensity).
  - **`Classy`**: Structured matte taupes, terracotta sculpting blush, velvet rose-nude lips (65–75% intensity).
  - **`Bold`**: High-pigment smoldering bronze/espresso eyes, defined arches, statement crimson/plum lips (75–90% intensity).
  - **`Elegant`**: Antique gold radiance, dusty rose baby cheeks, rich chestnut/wine lips (55–70% intensity).
- **Barrier Adaptation**: If high redness ($\ge 32$) is detected, blush intensity is automatically dampened by 20% to prevent accentuating erythema.

### 4. Decoupled Multi-Piece Virtual Clothes Try-On
- **Decoupled User Input**: Virtual clothes try-on is fully decoupled from the facial portrait selfie with a dedicated full-body input (file upload, live webcam snap, or studio body samples).
- **Valid `cloth-v4` Normalization**: Maps dresses, gowns, and full ensembles to `'full_body'` to strictly comply with YouCam API enum constraints (`'full_body' | 'upper_body' | 'lower_body' | 'outerwear' | 'shoes' | 'auto'`).
- **Sequential Multi-Piece Chaining (`applyMultiGarmentOutfit`)**: Supports multi-piece looks (Top + Pants) by sequentially piping the intermediate rendered output of the first garment into the input canvas of the second garment.
- **Piece Selector UI**: Allows users to try on the *"✨ Full Ensemble"*, *"Top Only"*, *"Pants Only"*, or *"Outerwear Only"*.

### 5. 30-Day Predictive Skincare Outcome Simulation
- **Personalized Therapeutic Intensities**: Maps real baseline concern scores to YouCam's `/s2s/v2.0/task/skin-simulation` engine (0.0 to 1.0 scale).
- **Targeted Improvements**: Demonstrates projected blemish clearance, pore refinement, and erythema reduction rather than a generic brightness filter.
- **Interactive Split Slider**: Draggable Before/After viewport allowing users to visually inspect day 1 vs day 30 barrier outcomes.

### 6. Celebrity Look Matching & AI Makeup Transfer
- **Archetype Vector Matcher**: Computes geometric similarity across face shape, eye geometry, and skin undertones to match users with beauty archetypes (Priyanka Chopra, Zendaya, Margot Robbie, Lupita Nyong'o, Deepika Padukone, Lily Collins).
- **One-Click Makeup Transfer**: Clones the iconic celebrity look or custom user-uploaded makeup reference photo onto the user's selfie.

### 7. Trichology Analysis & Virtual Hair Studio
- **Hair Diagnostics**: Detects hair curl pattern (1A to 4C), hair length, and frizz index.
- **Atmospheric Frizz Defense**: Recommends anti-humidity polymer sealants and silicone-free bonding oils when local humidity exceeds 40%.
- **Hairstyle & Color VTO**: Interactive virtual try-on for trending cuts (Textured Lob, 90s Curtain Blowout, Sleek French Bob) and seasonal hair color swatches.

### 8. "Use What You Have" Closet Look Synthesizer
- **Wardrobe Vault Integration**: Connects to the user's personal digital closet (via Supabase PostgreSQL) containing owned skincare, cosmetics, tops, bottoms, dresses, and outerwear.
- **Completeness Score**: Calculates how much of the prescribed look the user can create with their existing collection.
- **Wardrobe Gap-Fill Shelf**: Identifies missing essential items (e.g. waterproof trench for rain, broad-spectrum mineral SPF for UV $\ge 6$, or bold statement lip) with direct *"Add to Cart"* capability.

---

## 🚀 Quick Start & Local Setup Guide

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher (tested on Node v20/v24/v26)
- **npm** / **pnpm** / **yarn**

### 2. Environment Configuration
Create a `.env` file in the project root:

```env
# YouCam Perfect Corp S2S API
YOUCAM_CLIENT_ID=your_youcam_client_id
YOUCAM_CLIENT_SECRET=your_youcam_client_secret
YOUCAM_API_BASE=https://yce-api-01.makeupar.com

# Supabase (Database & Digital Closet)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: AI Stylist Commentary
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed the Digital Closet Vault
Populate the Supabase database with the curated demo closet (tops, bottoms, dresses, outerwear, makeup, and skincare items):
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Verification & Automated Test Suite

Mirror Check includes standalone TypeScript test suites to verify each layer:

```bash
# Test All Core Features (Parallel Analyzer, Foundation Match, Hair VTO, Skin Sim, etc.)
node node_modules/tsx/dist/cli.mjs scripts/test-tier1.ts

# Test Full End-to-End Orchestration (Weather + Analysis + Recommendations + Supabase Session)
node node_modules/tsx/dist/cli.mjs scripts/test-orchestration.ts

# Test Clothes VTO Sequential Chaining & Category Normalization
node node_modules/tsx/dist/cli.mjs scripts/test-clothes-vto.ts

# Test Live YouCam API Endpoints & Auth Connectivity
node node_modules/tsx/dist/cli.mjs scripts/diagnose-youcam.ts

# Test Production Build
npm run build
```

---

## 📂 Project Directory Structure

```
mirror-check/
├── app/
│   ├── api/
│   │   ├── closet/route.ts            # Digital wardrobe inventory API
│   │   ├── session/[id]/route.ts      # Look session persistence API
│   │   ├── weather/route.ts           # Open-Meteo weather integration
│   │   └── youcam/
│   │       ├── analyze/route.ts       # Unified Multi-AI analysis orchestration
│   │       ├── render/route.ts        # Makeup VTO & Multi-Piece Clothes VTO
│   │       ├── makeup-transfer/route.ts # Celebrity look transfer
│   │       ├── skin-simulation/route.ts # 30-day skin recovery simulation
│   │       ├── hair-analyze/route.ts  # Trichology & hair type diagnostics
│   │       ├── hair-style-vto/route.ts # Virtual hairstyle try-on
│   │       └── hair-color-vto/route.ts # Virtual hair color try-on
│   ├── page.tsx                       # Mirror Check interactive studio
│   ├── layout.tsx                     # Root layout & design tokens
│   └── globals.css                    # Tailored color system & typography
├── components/
│   ├── SelfieCapture.tsx              # Dual portrait & full-body photo capture
│   ├── ExplanationCard.tsx            # Clinical diagnostics, color harmony & breakdown
│   ├── SkinSimulationCard.tsx         # Draggable 30-day before/after recovery slider
│   ├── CelebrityLookPanel.tsx         # Celebrity archetype matcher & transfer
│   ├── HairAnalysisPanel.tsx          # Trichology analysis & hairstyle/color VTO
│   ├── MakeupPreview.tsx              # Makeup VTO display & foundation badge
│   ├── OutfitPreview.tsx              # Decoupled full-body clothes VTO & piece selector
│   ├── ClosetShelf.tsx                # Owned wardrobe shelf & look synthesizer
│   ├── GapFillShelf.tsx               # Missing wardrobe gap recommendations
│   ├── SkincareRoutineCard.tsx        # Conflict-free AM/PM skincare regimen
│   ├── VibePicker.tsx                 # 4-Style Vibe selector (Classy, Elegant, Bold, Natural)
│   └── CartDrawer.tsx                 # Slide-over wishlist cart
├── lib/
│   ├── youcam/                        # YouCam S2S API clients & task pollers
│   │   ├── auth.ts                    # RSA PKCS#1 encrypted id_token generation & token caching
│   │   ├── client.ts                  # Universal S2S uploadFile, runTask, pollTask
│   │   ├── skin-analysis.ts           # AI Skin analysis & biomarker score normalizer
│   │   ├── skin-tone.ts               # AI Skin tone, ITA & seasonal color normalizer
│   │   ├── fitzpatrick-analyzer.ts    # AI Fitzpatrick phototype classifier
│   │   ├── face-attr-analyzer.ts      # AI Face attributes & morphometric ratio extractor
│   │   ├── makeup-vto.ts              # AI Makeup virtual try-on engine
│   │   ├── clothes-vto.ts             # AI Clothes v4.0 sequential multi-piece try-on
│   │   ├── skin-simulation.ts         # AI 30-day skin outcome simulation
│   │   ├── makeup-transfer.ts         # AI Makeup style transfer
│   │   ├── hair-vto.ts                # AI Hair type detection & hairstyle try-on
│   │   └── parallel-analyzer.ts       # Concurrent Multi-AI beauty profile pipeline
│   ├── optical-analyzer.ts            # High-precision optical pixel analysis fallback
│   ├── recommendation-engine.ts       # Clinical conflict rules, VIBE matrix, outfit scoring
│   ├── foundation-matcher.ts          # Fitzpatrick & skin hex foundation formulation
│   ├── makeup-advisor.ts              # Facial geometry placement prescriptions
│   ├── celebrity-matcher.ts           # Celebrity archetype distance matcher
│   ├── hair-recommendation-engine.ts  # Trichology care routines
│   ├── owned-look-generator.ts        # "Use What You Have" closet synthesizer
│   ├── weather.ts                     # Real-time Open-Meteo atmospheric resolver
│   ├── supabase.ts                    # Supabase PostgreSQL database client
│   └── image-utils.ts                 # Base64, Buffer, and MIME utilities
├── types/
│   └── beauty-profile.ts              # Unified TypeScript definitions
├── data/
│   ├── demo-closet.json               # Seed catalog (29 wardrobe, cosmetic & skincare items)
│   └── celebrity-profiles.json        # Curated celebrity look reference catalog
└── scripts/
    ├── seed.ts                        # Supabase closet database seeder
    ├── test-tier1.ts                  # Comprehensive Tier 1 verification suite
    ├── test-orchestration.ts          # End-to-end orchestration pipeline test
    ├── test-clothes-vto.ts            # Multi-piece clothes VTO chaining test
    └── diagnose-youcam.ts             # Live YouCam API connectivity & diagnostic tool
```

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI & Components**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
- **AI & Computer Vision**:
  - [Perfect Corp YouCam S2S AI APIs](https://yce.makeupar.com/) (Skin, Tone, Fitzpatrick, Face Attributes, Makeup VTO, Clothes VTO v4, Skin Simulation, Hair VTO)
  - [Sharp](https://sharp.pixelplumbing.com/) (High-performance pixel-level optical image processing)
- **Database & Storage**: [Supabase PostgreSQL](https://supabase.com/)
- **Live Environmental Data**: [Open-Meteo API](https://open-meteo.com/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)

---

## 🌿 Git Branches & Changelog

- **`main`**: Initial foundation and project scaffolding.
- **`iteration2`**: Initial YouCam API client wrappers and weather integration.
- **`it7`**: Unified Parallel Beauty Profile pipeline and Tier 1 features.
- **`it8_clothes_try_on`** *(Latest & Recommended)*:
  - Decoupled Clothes VTO from facial selfie with dedicated full-body input.
  - Implemented multi-piece sequential clothes try-on (Top + Pants / Dress chaining).
  - Fixed YouCam `cloth-v4` garment category enum validation (`full_body`).
  - Fixed YouCam S2S API host (`https://yce-api-01.makeupar.com`) and `/s2s/v2.0/file` upload endpoint.
  - Fixed response parsing across skin analysis, color tones, and 30-day simulation.
  - Added Clinical Diagnostics & Biomarker Scores Breakdown drawer.
