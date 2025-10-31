import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// MOCK AI LISTING VALIDATOR
export function mockAiCheckForListing({ name, imageUrl, voiceText, description }: {
  name: string; imageUrl?: string | null; voiceText?: string | null; description?: string | null;
}) {
  // Fake AI: basic keyword and structure matching
  const produceList = ["tomato", "potato", "spinach", "maize", "cabbage", "beans"]; 
  const lcName = name.toLowerCase();
  const category = produceList.find(p => lcName.includes(p)) || "unknown";

  let flags: string[] = [];
  let score = 80;
  let confidence = 0.83;

  if (!imageUrl) flags.push("missing_image");
  if (!produceList.some(p => lcName.includes(p))) {
    flags.push("unrecognized_produce"); score -= 30;
  }
  if (voiceText && !voiceText.toLowerCase().includes(category)) {
    flags.push("voice_text_mismatch"); score -= 10;
  }
  if (description && description.length < 5) {
    flags.push("description_too_short"); score -= 5;
  }
  if (flags.length === 0) confidence = 0.98;

  return {
    ai_classification: { type: category, confidence, flags },
    quality_score: Math.max(0, score),
    flags
  };
}

// PLAUSIBILITY AND SEASONAL CHECKS
export function checkPlausibilityAndSeason(listing: {
  name: string; quantity_kg: number; grade?: string | null; created_channel?: string;
}, farmerProfile: {
  farm_size_ha: number; main_crop: string; region: string;
  yield_history?: Record<string, number[]>; // e.g., { tomato: [100, 120, 90] }
}, currentMonth: number) {
  const result: string[] = [];
  // Quant plausibility: max 20 tons/ha as upper bound
  const maxYield = (farmerProfile.yield_history?.[listing.name.toLowerCase()] || [20 * farmerProfile.farm_size_ha])[0];
  if (listing.quantity_kg > maxYield * 1.5) {
    result.push("quantity_exceeds_expected_yield");
  }
  // Seasonal: mock simple KEN major season cal (e.g. tomatoes: Mar-Aug)
  const seasonMap: Record<string, number[]> = {
    tomato: [3,4,5,6,7,8], potato: [1,2,3,9,10,11], spinach: [2,3,4,5,8,9,10], maize: [2,3,4,10,11], beans: [3,4,11,12]
  };
  const crop = listing.name.toLowerCase();
  if (seasonMap[crop] && !seasonMap[crop].includes(currentMonth)) {
    result.push("out_of_season");
  }
  return result;
}

// MOCK TRUST SCORE (repeatable)
export function mockTrustScore(farmerId: string) {
  // Dev: Use hash of farmerId (or return random if no id)
  let h = 0; for (let i = 0; i < farmerId.length; ++i) h = Math.imul(31, h) + farmerId.charCodeAt(i)|0;
  return 50 + (Math.abs(h) % 51); // 50-100 for demo
}
