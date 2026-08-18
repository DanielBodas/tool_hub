// WHO Weight-for-Age Standards (0 to 365 days / 0 to 12 months)
// Data points derived from WHO Child Growth Standards (Girls / Boys)

export type Sex = "female" | "male";

export interface WHOPercentileBand {
  day: number;
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

// Girls (Niñas) Weight-for-Age (in kg)
export const WHO_GIRLS_WEIGHT: WHOPercentileBand[] = [
  { day: 0, p3: 2.4, p15: 2.8, p50: 3.2, p85: 3.7, p97: 4.2 },
  { day: 7, p3: 2.6, p15: 3.0, p50: 3.4, p85: 3.9, p97: 4.4 },
  { day: 14, p3: 2.8, p15: 3.2, p50: 3.7, p85: 4.2, p97: 4.8 },
  { day: 30, p3: 3.2, p15: 3.6, p50: 4.2, p85: 4.8, p97: 5.5 },
  { day: 60, p3: 3.9, p15: 4.5, p50: 5.1, p85: 5.8, p97: 6.6 },
  { day: 90, p3: 4.5, p15: 5.2, p50: 5.8, p85: 6.6, p97: 7.5 },
  { day: 120, p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.3, p97: 8.2 },
  { day: 150, p3: 5.4, p15: 6.1, p50: 6.9, p85: 7.8, p97: 8.8 },
  { day: 180, p3: 5.7, p15: 6.5, p50: 7.3, p85: 8.2, p97: 9.3 },
  { day: 210, p3: 6.0, p15: 6.8, p50: 7.6, p85: 8.6, p97: 9.8 },
  { day: 240, p3: 6.3, p15: 7.1, p50: 7.9, p85: 9.0, p97: 10.2 },
  { day: 270, p3: 6.5, p15: 7.3, p50: 8.2, p85: 9.3, p97: 10.5 },
  { day: 300, p3: 6.7, p15: 7.5, p50: 8.5, p85: 9.6, p97: 10.9 },
  { day: 330, p3: 6.9, p15: 7.7, p50: 8.7, p85: 9.9, p97: 11.2 },
  { day: 365, p3: 7.0, p15: 7.9, p50: 8.9, p85: 10.1, p97: 11.5 }
];

// Boys (Niños) Weight-for-Age (in kg)
export const WHO_BOYS_WEIGHT: WHOPercentileBand[] = [
  { day: 0, p3: 2.5, p15: 2.9, p50: 3.3, p85: 3.9, p97: 4.4 },
  { day: 7, p3: 2.7, p15: 3.1, p50: 3.6, p85: 4.1, p97: 4.7 },
  { day: 14, p3: 3.0, p15: 3.4, p50: 3.9, p85: 4.5, p97: 5.1 },
  { day: 30, p3: 3.4, p15: 3.9, p50: 4.5, p85: 5.1, p97: 5.8 },
  { day: 60, p3: 4.3, p15: 4.9, p50: 5.6, p85: 6.3, p97: 7.1 },
  { day: 90, p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.2, p97: 8.0 },
  { day: 120, p3: 5.6, p15: 6.3, p50: 7.0, p85: 7.8, p97: 8.7 },
  { day: 150, p3: 6.0, p15: 6.7, p50: 7.5, p85: 8.4, p97: 9.3 },
  { day: 180, p3: 6.4, p15: 7.1, p50: 7.9, p85: 8.8, p97: 9.8 },
  { day: 210, p3: 6.7, p15: 7.4, p50: 8.3, p85: 9.2, p97: 10.3 },
  { day: 240, p3: 6.9, p15: 7.7, p50: 8.6, p85: 9.6, p97: 10.7 },
  { day: 270, p3: 7.1, p15: 8.0, p50: 8.9, p85: 9.9, p97: 11.0 },
  { day: 300, p3: 7.3, p15: 8.2, p50: 9.2, p85: 10.2, p97: 11.4 },
  { day: 330, p3: 7.5, p15: 8.4, p50: 9.4, p85: 10.5, p97: 11.7 },
  { day: 365, p3: 7.7, p15: 8.6, p50: 9.6, p85: 10.8, p97: 12.0 }
];

/**
 * Linearly interpolates WHO weight percentiles for a given age in days.
 */
export function getWHOPercentilesAtAge(ageInDays: number, sex: Sex = "female"): WHOPercentileBand {
  const dataset = sex === "male" ? WHO_BOYS_WEIGHT : WHO_GIRLS_WEIGHT;
  const clampedDays = Math.max(0, Math.min(365, ageInDays));

  if (clampedDays <= dataset[0].day) {
    return { ...dataset[0], day: clampedDays };
  }
  if (clampedDays >= dataset[dataset.length - 1].day) {
    return { ...dataset[dataset.length - 1], day: clampedDays };
  }

  // Find bounding keyframes
  let prev = dataset[0];
  let next = dataset[dataset.length - 1];

  for (let i = 0; i < dataset.length - 1; i++) {
    if (clampedDays >= dataset[i].day && clampedDays <= dataset[i + 1].day) {
      prev = dataset[i];
      next = dataset[i + 1];
      break;
    }
  }

  const span = next.day - prev.day;
  const fraction = span > 0 ? (clampedDays - prev.day) / span : 0;

  const lerp = (a: number, b: number) => a + fraction * (b - a);

  return {
    day: clampedDays,
    p3: lerp(prev.p3, next.p3),
    p15: lerp(prev.p15, next.p15),
    p50: lerp(prev.p50, next.p50),
    p85: lerp(prev.p85, next.p85),
    p97: lerp(prev.p97, next.p97)
  };
}

/**
 * Calculates the estimated WHO percentile number (1 - 99) for a baby's weight at a specific age in days.
 */
export function calculateWHOPercentile(
  weight: number,
  ageInDays: number,
  sex: Sex = "female"
): { percentile: number; label: string } {
  if (weight <= 0 || ageInDays < 0) {
    return { percentile: 50, label: "P50 (OMS)" };
  }

  const band = getWHOPercentilesAtAge(ageInDays, sex);

  // Compare against WHO percentiles
  if (weight < band.p3) {
    const fraction = Math.max(0, weight / band.p3);
    const p = Math.round(1 + fraction * 2);
    return { percentile: Math.max(1, p), label: `< P3 (${p}%)` };
  }
  if (weight === band.p3) return { percentile: 3, label: "P3 (OMS)" };

  if (weight < band.p15) {
    const fraction = (weight - band.p3) / (band.p15 - band.p3);
    const p = Math.round(3 + fraction * 12);
    return { percentile: p, label: `P${p} (OMS)` };
  }
  if (weight === band.p15) return { percentile: 15, label: "P15 (OMS)" };

  if (weight < band.p50) {
    const fraction = (weight - band.p15) / (band.p50 - band.p15);
    const p = Math.round(15 + fraction * 35);
    return { percentile: p, label: `P${p} (OMS)` };
  }
  if (weight === band.p50) return { percentile: 50, label: "P50 (OMS)" };

  if (weight < band.p85) {
    const fraction = (weight - band.p50) / (band.p85 - band.p50);
    const p = Math.round(50 + fraction * 35);
    return { percentile: p, label: `P${p} (OMS)` };
  }
  if (weight === band.p85) return { percentile: 85, label: "P85 (OMS)" };

  if (weight < band.p97) {
    const fraction = (weight - band.p85) / (band.p97 - band.p85);
    const p = Math.round(85 + fraction * 12);
    return { percentile: p, label: `P${p} (OMS)` };
  }
  if (weight === band.p97) return { percentile: 97, label: "P97 (OMS)" };

  // Above P97
  const excess = (weight - band.p97) / (band.p97 - band.p85);
  const p = Math.min(99, Math.round(97 + excess * 2));
  return { percentile: p, label: `> P97 (${p}%)` };
}

/**
 * Calculates age in days between birthDate string (YYYY-MM-DD) and a measurement date string (YYYY-MM-DD).
 */
export function getAgeInDays(birthDateStr: string, dateStr: string): number {
  if (!birthDateStr || !dateStr) return 0;
  const birth = new Date(birthDateStr).getTime();
  const current = new Date(dateStr).getTime();
  if (isNaN(birth) || isNaN(current)) return 0;
  const diff = current - birth;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
