import { MakeupStep } from './youcam/makeup-vto';

// Indices of facial landmarks for MediaPipe FaceMesh
const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109, 10,
];

const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33];
const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362];
const LEFT_EYEBROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46, 70];
const RIGHT_EYEBROW = [336, 296, 334, 293, 300, 276, 283, 282, 295, 285, 336];

const UPPER_LIP = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78, 61];
const LOWER_LIP = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 61];

let faceMeshInstance: any = null;
let scriptLoadingPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if ((window as any).FaceMesh) return resolve();

    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function getFaceMesh() {
  if (faceMeshInstance) return faceMeshInstance;
  if (!scriptLoadingPromise) {
    scriptLoadingPromise = loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
  }
  await scriptLoadingPromise;

  const FaceMeshClass = (window as any).FaceMesh;
  if (!FaceMeshClass) {
    throw new Error('FaceMesh library not available');
  }

  faceMeshInstance = new FaceMeshClass({
    locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });

  faceMeshInstance.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  await faceMeshInstance.initialize();
  return faceMeshInstance;
}

function drawPolygon(ctx: CanvasRenderingContext2D, landmarks: any[], indices: number[], w: number, h: number) {
  ctx.beginPath();
  indices.forEach((idx, i) => {
    const pt = landmarks[idx];
    if (pt) {
      const x = pt.x * w;
      const y = pt.y * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  });
  ctx.closePath();
}

/**
 * Renders flawless Foundation (Blemish & Acne Smoothing), Blush, and Lipstick
 * using 3D MediaPipe FaceMesh facial segmentation.
 */
export async function applyRealMakeupLandmarks(
  imageSrc: string,
  makeupSteps: MakeupStep[]
): Promise<string> {
  if (typeof window === 'undefined') return imageSrc;

  return new Promise(async (resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      const w = img.width;
      const h = img.height;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageSrc);
        return;
      }

      // Draw original photo as base
      ctx.drawImage(img, 0, 0, w, h);

      const foundation = makeupSteps.find((s) => s.category === 'foundation');
      const blush = makeupSteps.find((s) => s.category === 'blush');
      const lip = makeupSteps.find((s) => s.category === 'lip');
      const eyeshadow = makeupSteps.find((s) => s.category === 'eyeshadow');
      const eyebrow = makeupSteps.find((s) => s.category === 'eyebrow');

      try {
        const fm = await getFaceMesh();
        let landmarksFound = false;

        fm.onResults((results: any) => {
          if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            resolve(canvas.toDataURL('image/jpeg', 0.95));
            return;
          }

          landmarksFound = true;
          const landmarks = results.multiFaceLandmarks[0];

          // =========================================================================
          // 1. FOUNDATION & BLEMISH/ACNE SMOOTHING PASS
          // =========================================================================
          if (foundation) {
            const foundationIntensity = (foundation.intensity || 80) / 100;
            const blurRadius = Math.max(5, Math.round(w * 0.012)); // Adaptive skin smoothing radius

            // Offscreen Canvas 1: High-quality smoothed skin layer
            const smoothCanvas = document.createElement('canvas');
            smoothCanvas.width = w;
            smoothCanvas.height = h;
            const smoothCtx = smoothCanvas.getContext('2d');

            if (smoothCtx) {
              // Apply skin smoothing filter
              smoothCtx.filter = `blur(${blurRadius}px) saturate(95%)`;
              smoothCtx.drawImage(img, 0, 0, w, h);
              smoothCtx.filter = 'none';

              // Apply foundation color tone wash over the smoothed layer
              if (foundation.colorHex) {
                smoothCtx.save();
                smoothCtx.globalCompositeOperation = 'soft-light';
                smoothCtx.fillStyle = foundation.colorHex;
                smoothCtx.globalAlpha = 0.55;
                smoothCtx.fillRect(0, 0, w, h);
                smoothCtx.restore();
              }

              // Offscreen Canvas 2: Precise Facial Mask (Excluding Eyes, Eyebrows, Lips)
              const maskCanvas = document.createElement('canvas');
              maskCanvas.width = w;
              maskCanvas.height = h;
              const maskCtx = maskCanvas.getContext('2d');

              if (maskCtx) {
                // Draw Face Oval with feathered softness
                maskCtx.fillStyle = 'white';
                drawPolygon(maskCtx, landmarks, FACE_OVAL, w, h);
                maskCtx.fill();

                // Cut out eyes, eyebrows, nostrils, and lips so they remain 100% crisp & detailed
                maskCtx.globalCompositeOperation = 'destination-out';

                drawPolygon(maskCtx, landmarks, LEFT_EYE, w, h);
                maskCtx.fill();

                drawPolygon(maskCtx, landmarks, RIGHT_EYE, w, h);
                maskCtx.fill();

                drawPolygon(maskCtx, landmarks, LEFT_EYEBROW, w, h);
                maskCtx.fill();

                drawPolygon(maskCtx, landmarks, RIGHT_EYEBROW, w, h);
                maskCtx.fill();

                drawPolygon(maskCtx, landmarks, UPPER_LIP, w, h);
                maskCtx.fill();

                drawPolygon(maskCtx, landmarks, LOWER_LIP, w, h);
                maskCtx.fill();

                // Clip the smoothed foundation skin with the facial mask
                smoothCtx.globalCompositeOperation = 'destination-in';
                smoothCtx.drawImage(maskCanvas, 0, 0);

                // Composite smoothed & perfected foundation skin onto the main portrait
                ctx.save();
                ctx.globalAlpha = Math.min(0.92, foundationIntensity * 0.95);
                ctx.drawImage(smoothCanvas, 0, 0);

                // Subtle velvety powder sheen for matte / satin foundation finishes
                if (foundation.finish === 'matte' || foundation.finish === 'satin') {
                  ctx.globalCompositeOperation = 'soft-light';
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                  ctx.drawImage(maskCanvas, 0, 0);
                }
                ctx.restore();
              }
            }
          }

          // =========================================================================
          // 2. BLUSH FLUSH ON CHEEKBONES
          // =========================================================================
          if (blush && blush.colorHex) {
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            const blushAlpha = Math.min(0.75, ((blush.intensity || 65) / 100) * 0.7);

            // Left cheek (landmark 116/123)
            const leftCheekPt = landmarks[116] || landmarks[123];
            if (leftCheekPt) {
              const lx = leftCheekPt.x * w;
              const ly = leftCheekPt.y * h;
              const radius = w * 0.11;
              const grad = ctx.createRadialGradient(lx, ly, 2, lx, ly, radius);
              grad.addColorStop(0, blush.colorHex);
              grad.addColorStop(0.6, blush.colorHex);
              grad.addColorStop(1, 'transparent');

              ctx.fillStyle = grad;
              ctx.globalAlpha = blushAlpha;
              ctx.beginPath();
              ctx.arc(lx, ly, radius, 0, Math.PI * 2);
              ctx.fill();
            }

            // Right cheek (landmark 345/352)
            const rightCheekPt = landmarks[345] || landmarks[352];
            if (rightCheekPt) {
              const rx = rightCheekPt.x * w;
              const ry = rightCheekPt.y * h;
              const radius = w * 0.11;
              const grad = ctx.createRadialGradient(rx, ry, 2, rx, ry, radius);
              grad.addColorStop(0, blush.colorHex);
              grad.addColorStop(0.6, blush.colorHex);
              grad.addColorStop(1, 'transparent');

              ctx.fillStyle = grad;
              ctx.globalAlpha = blushAlpha;
              ctx.beginPath();
              ctx.arc(rx, ry, radius, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
          }

          // =========================================================================
          // 3. EYESHADOW SWEEP OVER UPPER EYELIDS
          // =========================================================================
          if (eyeshadow && eyeshadow.colorHex) {
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            const eyeAlpha = Math.min(0.65, ((eyeshadow.intensity || 60) / 100) * 0.6);

            ctx.fillStyle = eyeshadow.colorHex;
            ctx.globalAlpha = eyeAlpha;

            // Fill left eyelid area
            drawPolygon(ctx, landmarks, LEFT_EYE, w, h);
            ctx.fill();

            // Fill right eyelid area
            drawPolygon(ctx, landmarks, RIGHT_EYE, w, h);
            ctx.fill();

            ctx.restore();
          }

          // =========================================================================
          // 4. EYEBROW SHAPE TINT & DEFINITION
          // =========================================================================
          if (eyebrow && eyebrow.colorHex) {
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            const browAlpha = Math.min(0.7, ((eyebrow.intensity || 70) / 100) * 0.65);

            ctx.fillStyle = eyebrow.colorHex;
            ctx.globalAlpha = browAlpha;

            // Left eyebrow polygon
            drawPolygon(ctx, landmarks, LEFT_EYEBROW, w, h);
            ctx.fill();

            // Right eyebrow polygon
            drawPolygon(ctx, landmarks, RIGHT_EYEBROW, w, h);
            ctx.fill();

            ctx.restore();
          }

          // =========================================================================
          // 5. LIPSTICK ON EXACT LIP CONTOURS
          // =========================================================================
          if (lip && lip.colorHex) {
            ctx.save();
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = lip.colorHex;
            ctx.globalAlpha = ((lip.intensity || 75) / 100) * 0.75;

            // Fill outer and inner lip polygon
            drawPolygon(ctx, landmarks, UPPER_LIP, w, h);
            ctx.fill();
            drawPolygon(ctx, landmarks, LOWER_LIP, w, h);
            ctx.fill();

            // Secondary soft-light sheen
            ctx.globalCompositeOperation = 'soft-light';
            ctx.globalAlpha = 0.6;
            drawPolygon(ctx, landmarks, UPPER_LIP, w, h);
            ctx.fill();
            drawPolygon(ctx, landmarks, LOWER_LIP, w, h);
            ctx.fill();

            ctx.restore();
          }

          resolve(canvas.toDataURL('image/jpeg', 0.95));
        });

        await fm.send({ image: img });

        setTimeout(() => {
          if (!landmarksFound) {
            resolve(canvas.toDataURL('image/jpeg', 0.95));
          }
        }, 1500);
      } catch (err) {
        console.warn('FaceMesh error, returning base photo:', err);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      }
    };

    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}
