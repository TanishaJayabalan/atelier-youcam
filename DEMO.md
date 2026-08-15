# Mirror Check — Live Demo & Judging Guide

**Mirror Check** is an AI-powered smart mirror concierge integrating **Perfect Corp YouCam APIs**, **Open-Meteo Weather**, **Supabase**, and a rules-based **Adaptive Recommendation Engine** to deliver clinical skin vitality scores, weather-adaptive skincare routines, and harmonized virtual try-ons from your wardrobe.

---

## 🚀 Quick Start (Local Run)

```bash
# 1. Install dependencies
npm install

# 2. Seed demo digital closet (outfits, makeup shades, active skincare)
npm run seed

# 3. Start local development server
npm run dev
# -> Open http://localhost:3000
```

---

## 🎬 60-Second Judging Walkthrough Script

1. **Top Weather Bar**:
   - Notice the live local temperature, condition, and **UV Index / Humidity badges** automatically fetched via Open-Meteo geolocation.
   - Click **"Change City"** to test different weather scenarios (e.g. `Paris`, `Tokyo`, or `Miami`).

2. **Digital Wardrobe & Beauty Shelf**:
   - Click **"View Wardrobe Shelf"** in the top navigation.
   - Browse the 20 pre-seeded items across **Apparel**, **Makeup Shades**, and **Skincare Actives**.
   - Tap **"Owned in Closet"** / **"Mark as Owned"** to toggle items in real-time.

3. **Step 1: Facial Canvas & Selfie Capture**:
   - Choose one of the **3 Curated Demo Models** (e.g. *Studio Portrait (Warm)*) for zero-friction instant demo, OR tap **"Live Camera"** to snap your own selfie directly in the browser!

4. **Step 2: Desired Vibe Selector**:
   - Select your aesthetic profile:
     - 👑 **Classy Chic** (Tailored structure, satin velvety finish, berry/terracotta lip)
     - ✨ **Ethereal Elegant** (Luminous glow, silk satin drape, romantic soft rose)
     - 🔥 **Statement Bold** (High contrast, matte finish, crimson lip)
     - 🌿 **Effortless Natural** (Clean girl minimalism, sheer tinted glow)

5. **Generate Look (Progressive Reveal Flow)**:
   - Click **"Generate My Personalized Daily Look"**.
   - **Stage 1 (Instant ~2s)**:
     - **Skin Vitality Score (0-100)** and clinical concerns breakdown.
     - **Undertone & Seasonal Color Analysis** (e.g. Warm Autumn vs Cool Summer).
     - **Skincare Routine Correction**: Notice how elevated skin redness automatically pauses Retinol in the PM routine and substitutes soothing Centella/Ceramides!
     - **High UV Defense Alert**: Mineral SPF 50+ enforcement.
   - **Stage 2 (Parallel VTO)**:
     - Shimmering skeletons resolve into rendered **Makeup Virtual Try-On** (foundation, blush, lip, eyeshadow, brow) and **Generative Apparel Virtual Try-On**.
   - **Curated Gap-Fill Shelf**:
     - Highlights items missing from your owned closet with clear, non-generic reasons.

6. **Persistent Session Refresh**:
   - Copy the Session ID or refresh the browser: all analysis and try-on results are persisted in Supabase / Local storage without losing state!

---

## 🧪 Verified Automated Test Scripts

Run each component test suite individually:

```bash
# Component 1: YouCam Auth (RSA PKCS#1 encryption & token caching)
npx tsx scripts/test-auth.ts

# Component 2: Generic Task Client (Upload -> Run -> Poll pipeline & error mapping)
npx tsx scripts/test-client.ts

# Component 3: 14-Concern AI Skin Analysis
npx tsx scripts/test-skin-analysis.ts

# Component 4: AI Skin Tone & Undertone Harmonization
npx tsx scripts/test-skin-tone.ts

# Component 5: Multi-Action Makeup Virtual Try-On
npx tsx scripts/test-makeup-vto.ts

# Component 6: Generative Clothes Virtual Try-On
npx tsx scripts/test-clothes-vto.ts

# Component 7: Open-Meteo Weather & Geocoding Service
npx tsx scripts/test-weather.ts

# Component 8: Supabase Database Layer
npx tsx scripts/test-db.ts

# Component 10: Recommendation Engine (Redness correction, UV rules, Vibe matrix)
npx tsx scripts/test-recommendation.ts

# Component 11: End-to-End Orchestration Pipeline
npx tsx scripts/test-orchestration.ts
```

---

## 🔑 Environment Variables Reference (`.env.local`)

```bash
# YouCam Perfect Corp API
YOUCAM_CLIENT_ID=your_client_id_or_api_key
YOUCAM_CLIENT_SECRET=your_rsa_public_key_pem_or_secret
YOUCAM_API_BASE=https://yce-api-01.perfectcorp.com

# Supabase (Database & Storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
