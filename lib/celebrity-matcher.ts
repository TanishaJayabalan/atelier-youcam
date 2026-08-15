import { UserBeautyProfile } from '@/types/beauty-profile';
import celebrityProfiles from '@/data/celebrity-profiles.json';

export interface CelebrityProfile {
  id: string;
  name: string;
  title: string;
  faceShape: string;
  undertone: string;
  fitzpatrick: string[];
  vibes: string[];
  referencePhotoUrl: string;
  description: string;
  keyProducts: string[];
}

export interface CelebrityMatch {
  profile: CelebrityProfile;
  matchScore: number;
  matchReasons: string[];
}

export function matchCelebrityLooks(
  beautyProfile: UserBeautyProfile,
  selectedVibe: string = 'Bold'
): CelebrityMatch[] {
  const { faceAttributes, colorTones, fitzpatrick } = beautyProfile;
  const userFaceShape = faceAttributes?.faceShape || 'Oval';
  const userUndertone = colorTones?.undertone || 'warm';
  const userFitzType = fitzpatrick?.type || 'III';

  const scored: CelebrityMatch[] = (celebrityProfiles as CelebrityProfile[]).map((celeb) => {
    let score = 50;
    const matchReasons: string[] = [];

    // Face Shape alignment (30 points)
    if (celeb.faceShape.toLowerCase() === userFaceShape.toLowerCase()) {
      score += 30;
      matchReasons.push(`Shares your ${userFaceShape} facial geometry`);
    } else if (
      (userFaceShape === 'Oval' && (celeb.faceShape === 'Heart' || celeb.faceShape === 'Diamond')) ||
      (userFaceShape === 'Round' && celeb.faceShape === 'Square')
    ) {
      score += 15;
      matchReasons.push(`Complementary bone structure styling`);
    }

    // Undertone alignment (20 points)
    if (celeb.undertone === userUndertone) {
      score += 20;
      matchReasons.push(`Formulated for ${userUndertone} undertones`);
    }

    // Fitzpatrick compatibility (15 points)
    if (celeb.fitzpatrick.includes(userFitzType)) {
      score += 15;
      matchReasons.push(`Ideal pigment harmony for Fitzpatrick Type ${userFitzType}`);
    }

    // Vibe match (10 points)
    if (celeb.vibes.some((v) => v.toLowerCase() === selectedVibe.toLowerCase())) {
      score += 10;
      matchReasons.push(`Matches your ${selectedVibe} vibe request`);
    }

    return {
      profile: celeb,
      matchScore: Math.min(99, score),
      matchReasons,
    };
  });

  // Sort descending by match score
  return scored.sort((a, b) => b.matchScore - a.matchScore);
}
