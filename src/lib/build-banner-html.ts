/**
 * build-banner-html.ts
 *
 * Generates the self-contained HTML string for a promotional banner.
 * Extracted into a plain .ts file (not .tsx) so esbuild's JSX parser
 * doesn't choke on closing HTML tags inside the template literal.
 */
import { getBrandStyle, type BrandStyle } from './brand-standards';

// ── Types shared with HtmlConversionModal ──────────────────────────────

export type OfferType = 'freespins' | 'bonus' | 'nodeposit' | 'freebet';
export type TextPosition = 'left' | 'right';

export const OFFER_CONFIG: Record<OfferType, {
  label: string;
  mainPlaceholder: string;
  typeLabel: string;
  descriptor: string;
  showSubValue: boolean;
}> = {
  freespins: {
    label: 'Number of Spins',
    mainPlaceholder: 'e.g. 20',
    typeLabel: 'Free Spins',
    descriptor: 'No Deposit Bonus',
    showSubValue: false,
  },
  bonus: {
    label: 'Bonus %',
    mainPlaceholder: 'e.g. 400',
    typeLabel: 'Bonus',
    descriptor: '',
    showSubValue: true,
  },
  nodeposit: {
    label: 'Bonus Amount',
    mainPlaceholder: 'e.g. $5',
    typeLabel: 'No Deposit',
    descriptor: 'Bonus',
    showSubValue: false,
  },
  freebet: {
    label: 'Bet Amount',
    mainPlaceholder: 'e.g. $50',
    typeLabel: 'Free Bet',
    descriptor: 'No Deposit Required',
    showSubValue: false,
  },
};

export interface BannerFormData {
  mainValue: string;
  subValue: string;
  crossSell: string;
  bonusCode: string;
  ctaUrl: string;
  ctaText: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Main builder ────────────────────────────────────────────────────────

export interface BuildHtmlParams {
  imageSrc: string;
  brand?: string;
  formData: BannerFormData;
  offerType: OfferType;
  textPosition: TextPosition;
  /** Natural image dimensions — the banner matches the original image size */
  imgWidth: number;
  imgHeight: number;
}

export function buildBannerHtml(params: BuildHtmlParams): string {
  const { imageSrc, brand, formData, offerType, textPosition, imgWidth, imgHeight } = params;

  const style: BrandStyle = getBrandStyle(brand);
  const cfg = OFFER_CONFIG[offerType];
  const ctaLabel = formData.ctaText.trim() || 'Play Now';

  const dark95 = hexToRgba(style.panelBg, 0.95);
  const dark70 = hexToRgba(style.panelBg, 0.70);
  const dark40 = hexToRgba(style.panelBg, 0.40);

  // Detect shape from the actual image dimensions
  const ratio = imgHeight / imgWidth;
  const isTall = ratio > 1;          // portrait / story
  const isLeaderboard = ratio < 0.2; // ultra-wide strip

  const gradientDirection = textPosition === 'right' ? 'to right' : 'to left';
  const justifyContent = textPosition === 'right' ? 'flex-end' : 'flex-start';

  const descriptor = offerType === 'bonus'
    ? (formData.subValue ? `Up to ${formData.subValue}` : 'Welcome Bonus')
    : cfg.descriptor;

  const headline = offerType === 'bonus'
    ? `${formData.mainValue}%`
    : formData.mainValue;

  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${style.googleFont}&display=swap`;

  // Gradient adapts to image shape
  let gradientCss: string;
  if (isTall) {
    gradientCss = `linear-gradient(to bottom, transparent 15%, ${dark40} 40%, ${dark70} 60%, ${dark95} 80%, ${dark95} 100%)`;
  } else if (isLeaderboard) {
    gradientCss = `linear-gradient(${gradientDirection}, transparent 0%, ${dark70} 30%, ${dark95} 50%, ${dark95} 100%)`;
  } else {
    gradientCss = `linear-gradient(${gradientDirection}, transparent 5%, ${dark40} 35%, ${dark70} 55%, ${dark95} 75%, ${dark95} 100%)`;
  }

  // Content layout adapts to shape
  let contentAlignCss: string;
  if (isTall) {
    contentAlignCss = 'align-items: flex-end; justify-content: center;';
  } else {
    contentAlignCss = `align-items: center; justify-content: ${justifyContent};`;
  }

  const textPanelWidth = isTall ? '90%' : isLeaderboard ? '60%' : '46%';
  const textPanelPadding = isTall ? '24px 28px 32px' : isLeaderboard ? '8px 20px' : '32px 40px';
  const textPanelDirection = isLeaderboard ? 'row' : 'column';
  const textPanelAlign = isLeaderboard ? 'align-items: center;' : 'justify-content: center;';
  const textPanelGap = isLeaderboard ? '16px' : '8px';

  const numberFontSize = isLeaderboard ? 'clamp(28px, 4vw, 40px)' : 'clamp(56px, 8.5vw, 96px)';
  const typeFontSize = isLeaderboard ? 'clamp(11px, 1.4vw, 16px)' : 'clamp(16px, 2.4vw, 26px)';

  // Conditional HTML fragments
  const brandLabel = brand ? `<p class="banner__brand">${brand}</p>` : '';
  const descriptorHtml = descriptor ? `<p class="banner__descriptor">${descriptor}</p>` : '';
  const crossSellHtml = formData.crossSell ? `<p class="banner__crosssell">${formData.crossSell}</p>` : '';
  const bonusCodeHtml = formData.bonusCode ? `<p class="banner__code">Use code: ${formData.bonusCode}</p>` : '';

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `  <title>${brand || 'Casino'} Banner</title>`,
    '  <link rel="preconnect" href="https://fonts.googleapis.com" />',
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
    `  <link href="${googleFontsUrl}" rel="stylesheet" />`,
    '  <style>',
    '    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }',
    '',
    '    body {',
    '      background: #0d0d0d;',
    '      display: flex;',
    '      align-items: center;',
    '      justify-content: center;',
    '      min-height: 100vh;',
    `      font-family: ${style.fontFamily};`,
    '    }',
    '',
    '    .banner {',
    '      position: relative;',
    '      width: 100%;',
    `      max-width: ${imgWidth}px;`,
    '      overflow: hidden;',
    '      border-radius: 10px;',
    '      box-shadow: 0 8px 48px rgba(0,0,0,0.7);',
    `      aspect-ratio: ${imgWidth} / ${imgHeight};`,
    '    }',
    '',
    '    .banner__bg {',
    '      position: absolute;',
    '      inset: 0;',
    '      width: 100%;',
    '      height: 100%;',
    '      object-fit: cover;',
    '      object-position: center;',
    '      display: block;',
    '      z-index: 0;',
    '    }',
    '',
    '    .banner__gradient {',
    '      position: absolute;',
    '      inset: 0;',
    `      background: ${gradientCss};`,
    '      z-index: 1;',
    '    }',
    '',
    '    .banner__content {',
    '      position: relative;',
    '      z-index: 2;',
    '      width: 100%;',
    '      height: 100%;',
    '      display: flex;',
    `      ${contentAlignCss}`,
    '    }',
    '',
    '    .banner__text {',
    '      display: flex;',
    `      flex-direction: ${textPanelDirection};`,
    `      ${textPanelAlign}`,
    `      width: ${textPanelWidth};`,
    `      padding: ${textPanelPadding};`,
    `      gap: ${textPanelGap};`,
    '    }',
    '',
    '    @media (max-width: 600px) {',
    `      .banner__text { width: 100%; padding: 20px; background: ${dark70}; }`,
    '    }',
    '',
    `    .banner__brand { font-size: 10px; font-weight: 700; color: ${style.accentColor}; letter-spacing: 0.28em; text-transform: uppercase; margin-bottom: 4px; }`,
    `    .banner__number { font-size: ${numberFontSize}; font-weight: 900; color: ${style.headlineColor}; line-height: 0.9; letter-spacing: -0.03em; display: block; }`,
    `    .banner__type { font-size: ${typeFontSize}; font-weight: 800; color: ${style.headlineColor}; text-transform: uppercase; letter-spacing: 0.08em; line-height: 1; display: block; margin-top: 6px; }`,
    `    .banner__descriptor { font-size: 11px; font-weight: 600; color: ${style.bodyColor}; letter-spacing: 0.22em; text-transform: uppercase; opacity: 0.8; margin-top: 4px; }`,
    `    .banner__crosssell { font-size: clamp(12px, 1.6vw, 18px); font-weight: 700; color: ${style.accentColor}; letter-spacing: 0.04em; margin-top: 2px; }`,
    `    .banner__cta { display: block; width: 100%; background: ${style.buttonBg}; color: ${style.buttonText}; font-size: 13px; font-weight: 800; text-decoration: none; text-align: center; padding: 13px 20px; border-radius: 7px; text-transform: uppercase; letter-spacing: 0.14em; margin-top: 12px; cursor: pointer; box-shadow: 0 4px 18px ${style.buttonShadow}; transition: opacity 0.15s ease; }`,
    '    .banner__cta:hover { opacity: 0.85; }',
    `    .banner__code { font-size: 10px; font-weight: 500; color: ${style.bodyColor}; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.45; margin-top: 4px; text-align: center; }`,
    '  </style>',
    '</head>',
    '<body>',
    '  <div class="banner">',
    `    <img class="banner__bg" src="${imageSrc}" alt="${brand || 'Casino'} promotional banner" />`,
    '    <div class="banner__gradient"></div>',
    '    <div class="banner__content">',
    '      <div class="banner__text">',
    `        ${brandLabel}`,
    `        <span class="banner__number">${headline}</span>`,
    `        <span class="banner__type">${cfg.typeLabel}</span>`,
    `        ${descriptorHtml}`,
    `        ${crossSellHtml}`,
    `        <a href="${formData.ctaUrl || '#'}" class="banner__cta">${ctaLabel}</a>`,
    `        ${bonusCodeHtml}`,
    '      </div>',
    '    </div>',
    '  </div>',
    '</body>',
    '</html>',
  ].join('\n');
}
