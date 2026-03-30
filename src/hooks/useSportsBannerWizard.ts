/**
 * useSportsBannerWizard
 *
 * Manages the 5-step Sports Banner Wizard state and assembles the final FormData
 * that gets sent to the generate-prompt API.
 *
 * Steps:
 *  0 — Q1: Sport
 *  1 — Q2: Scene (player role, count, action, kit, gender, team nationality)
 *  2 — Q3: Subject position
 *  3 — Q4: Background (type, country, flag, lighting tone, props)
 *  4 — Q5: Banner size + occasion
 */

import { useState, useCallback } from 'react';
import { SportsBannerData, FormData } from '@/types/prompt';
import { POSITION_GRID, PositionCell } from '@/components/sports-wizard/scene-presets';
import { BRAND_PALETTES } from '@/lib/brand-colors';

export type { SportsBannerData };

// ─────────────────────────────────────────────
// Brand-specific kit color defaults
// ─────────────────────────────────────────────
const BRAND_KIT_DEFAULTS: Record<string, string> = {
  FortunePlay: 'gold and black',
  SpinJo: 'purple and white',
  Roosterbet: 'red and black',
  LuckyVibe: 'sunset orange and white',
  SpinsUp: 'neon purple and black',
  PlayMojo: 'white and red',
  Lucky7even: 'purple and gold',
  NovaDreams: 'white and blue',
  Rollero: 'crimson and dark grey',
};

// ─────────────────────────────────────────────
// Prompt assembly
// ─────────────────────────────────────────────

/**
 * Builds the full positive_prompt from all wizard answers.
 * Sent as the "Base prompt" to the generate-prompt API which then applies
 * position, aspect ratio, and brand color rules on top.
 */
function buildPositivePrompt(data: SportsBannerData, brand: string): string {
  const kitColors = data.kitColors || BRAND_KIT_DEFAULTS[brand] || 'branded team colors';

  // ── Subject description ──
  const countMap: Record<string, string> = { '1': 'A single', '2': 'Two', '3+': 'A team of' };
  const countLabel = countMap[data.playerCount] ?? 'A';
  const genderLabel = data.gender === 'Mixed' ? 'male and female' : data.gender.toLowerCase();
  const playerWord = data.playerCount === '1' ? 'athlete' : 'athletes';
  // Include role and nationality if provided
  const roleStr = data.playerRole ? ` ${data.playerRole}` : '';
  const nationalityStr = data.teamNationality ? ` (${data.teamNationality})` : '';
  const subjectDesc = `${countLabel} ${genderLabel}${roleStr} ${data.sport} ${playerWord}${nationalityStr}`;

  // ── Background description ──
  const bgParts: string[] = [];
  if (data.backgroundDetail) bgParts.push(data.backgroundDetail);
  else bgParts.push(`${data.sport} stadium`);
  // Country/city atmosphere
  if (data.matchCountry) {
    bgParts.push(`with visual references to ${data.matchCountry} — local atmosphere, architecture, and colours`);
  }
  // Flag
  if (data.flagInBackground && data.flagCountry) {
    bgParts.push(`a large ${data.flagCountry} national flag prominently displayed in the background`);
  }
  // Props
  if (data.hasTrophy) bgParts.push('a golden championship trophy prominently featured in the scene');
  if (data.hasScoreboard) bgParts.push(`a scoreboard showing "${data.scoreboardText || '0 - 0'}"`);
  if (data.hasEquipment) bgParts.push(`floating ${data.sport.toLowerCase()} equipment scattered in the frame`);
  const bgDesc = bgParts.join(', ');

  // ── Lighting ──
  const lightingDesc = data.lightingToneDetail
    || (data.backgroundCategory === 'minimal'
      ? 'single spotlight, dramatic rim light, deep shadows'
      : 'dynamic sports photography lighting, high contrast, cinematic');

  // ── Composition ──
  const positionCell = POSITION_GRID.find((c) => c.value === data.subjectPosition);
  const negSpaceRule = positionCell?.negativeSpaceRule ?? 'balanced composition';

  // ── Format ──
  const sizeDesc = data.bannerSizeLabel
    ? `${data.bannerSizeLabel} banner (${data.bannerDimensions})`
    : 'wide banner';

  // ── Assemble ──
  return [
    `${subjectDesc}, ${data.action}, wearing ${kitColors} kit and matching ${data.sport.toLowerCase()} gear.`,
    `Background: ${bgDesc}.`,
    `Lighting: ${lightingDesc}.`,
    `Mood: ${data.occasionMood || 'energetic, dynamic, high-impact'}.`,
    `Composition: ${negSpaceRule}.`,
    `Format: ${sizeDesc}, designed as a branded sports promotional banner.`,
    'Ultra-realistic sports photography. Dynamic action shot. Professional sports advertising. High contrast. Photorealistic.',
  ].join(' ');
}

function buildNegativePrompt(brand: string): string {
  const paletteStr = BRAND_PALETTES[brand] ?? '';
  const neverMatch = paletteStr.match(/NEVER use ([^.]+)\./);
  const forbiddenColors = neverMatch ? neverMatch[1] : '';
  const base = 'text, logos, watermarks, blurry, out of focus, cartoon, illustration, low quality, nsfw, brand logos, typography, words, lettering, signatures';
  return forbiddenColors ? `${base}, ${forbiddenColors} colors` : base;
}

// ─────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────

const INITIAL_WIZARD_DATA: SportsBannerData = {
  // Q1
  sport: '',
  // Q2
  playerRole: '',
  playerCount: '1',
  action: '',
  kitColors: '',
  gender: 'Male',
  teamNationality: '',
  // Q3
  subjectPosition: 'Centered',
  negativeSpaceRule: 'subject centered, balanced composition',
  // Q4
  backgroundCategory: '',
  backgroundDetail: '',
  matchCountry: '',
  flagInBackground: false,
  flagCountry: '',
  lightingTone: '',
  lightingToneDetail: '',
  hasTrophy: false,
  hasScoreboard: false,
  scoreboardText: '0 - 0',
  hasEquipment: false,
  // Q5
  bannerSizeId: '',
  bannerSizeLabel: '',
  bannerDimensions: '',
  aspectRatio: '16:9',
  occasion: '',
  occasionMood: '',
};

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export const TOTAL_STEPS = 5;

export function useSportsBannerWizard() {
  const [step, setStep] = useState(0);
  const [wizardData, setWizardData] = useState<SportsBannerData>(INITIAL_WIZARD_DATA);

  const updateField = useCallback(<K extends keyof SportsBannerData>(
    field: K,
    value: SportsBannerData[K]
  ) => {
    setWizardData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updatePosition = useCallback((cell: PositionCell) => {
    setWizardData((prev) => ({
      ...prev,
      subjectPosition: cell.value,
      negativeSpaceRule: cell.negativeSpaceRule,
    }));
  }, []);

  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)), []);
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);
  const resetWizard = useCallback(() => {
    setStep(0);
    setWizardData(INITIAL_WIZARD_DATA);
  }, []);

  /**
   * Returns true when the user has filled enough to advance from the current step.
   * Steps 3 and 4 are mostly optional — only size + occasion are required on step 4.
   */
  const canAdvance = useCallback((): boolean => {
    switch (step) {
      case 0: return !!wizardData.sport;
      case 1: return !!wizardData.action; // role optional, action required
      case 2: return !!wizardData.subjectPosition;
      case 3: return true; // everything on background is optional
      case 4: {
        const sizeOk = !!wizardData.bannerSizeId;
        const occasionOk = !!wizardData.occasion && (wizardData.occasion !== 'custom' || !!wizardData.occasionMood);
        return sizeOk && occasionOk;
      }
      default: return false;
    }
  }, [step, wizardData]);

  const assembleFormData = useCallback((brand: string): Partial<FormData> => {
    const positive_prompt = buildPositivePrompt(wizardData, brand);
    const negative_prompt = buildNegativePrompt(brand);

    const countLabel = wizardData.playerCount === '1' ? 'Single' : wizardData.playerCount === '2' ? 'Two' : 'Team of';
    const roleStr = wizardData.playerRole ? ` ${wizardData.playerRole}` : '';
    const nationalityStr = wizardData.teamNationality ? ` — ${wizardData.teamNationality}` : '';

    return {
      brand,
      reference: `Sports Banner (${wizardData.sport})`,
      subjectPosition: wizardData.subjectPosition,
      aspectRatio: wizardData.aspectRatio,
      theme: `${wizardData.sport} sports banner — ${
        wizardData.occasion === 'custom'
          ? wizardData.occasionMood
          : wizardData.occasion.replace(/-/g, ' ')
      }`,
      description: '',
      format_layout: wizardData.bannerSizeLabel
        ? `${wizardData.bannerSizeLabel} (${wizardData.bannerDimensions}), ${wizardData.negativeSpaceRule}`
        : wizardData.negativeSpaceRule,
      primary_object: wizardData.hasTrophy ? 'golden championship trophy' : '',
      subject: `${countLabel}${roleStr} ${wizardData.gender.toLowerCase()} ${wizardData.sport} ${wizardData.playerCount === '1' ? 'athlete' : 'athletes'}${nationalityStr}, ${wizardData.action}`,
      lighting: wizardData.lightingToneDetail
        || (wizardData.backgroundCategory === 'minimal'
          ? 'single spotlight, dramatic rim light'
          : 'dynamic sports photography lighting, high contrast'),
      mood: wizardData.occasionMood || 'energetic, dynamic, high-impact',
      background: [
        wizardData.backgroundDetail,
        wizardData.matchCountry && `${wizardData.matchCountry} atmosphere`,
        wizardData.flagInBackground && wizardData.flagCountry && `${wizardData.flagCountry} flag`,
        wizardData.hasTrophy && 'championship trophy',
        wizardData.hasScoreboard && `scoreboard: ${wizardData.scoreboardText || '0 - 0'}`,
        wizardData.hasEquipment && `${wizardData.sport} equipment props`,
      ].filter(Boolean).join(', '),
      positive_prompt,
      negative_prompt,
    };
  }, [wizardData]);

  return {
    step,
    wizardData,
    updateField,
    updatePosition,
    goNext,
    goBack,
    resetWizard,
    canAdvance,
    assembleFormData,
  };
}
