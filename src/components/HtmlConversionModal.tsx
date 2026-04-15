import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Eye, FileCode, AlignLeft, AlignRight, Loader2 } from 'lucide-react';
import { getBrandStyle } from '@/lib/brand-standards';

interface HtmlConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  brand?: string;
}

interface BannerFormData {
  welcomeBonus: string;
  bonusPercentage: string;
  bonusCode: string;
  ctaUrl: string;
  ctaText: string;
}

type TextPosition = 'left' | 'right';

// Fetches an image URL and returns it as a base64 data URI so the
// downloaded HTML file works everywhere — no blob URLs, no broken images.
async function toBase64DataUri(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    // CORS or network failure — fall back to the original URL
    return url;
  }
}

export function HtmlConversionModal({ isOpen, onClose, imageUrl, brand }: HtmlConversionModalProps) {
  const [formData, setFormData] = useState<BannerFormData>({
    welcomeBonus: '',
    bonusPercentage: '',
    bonusCode: '',
    ctaUrl: '#',
    ctaText: 'Play Now',
  });
  const [textPosition, setTextPosition] = useState<TextPosition>('right');
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof BannerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Builds the final HTML string.
  // imageSrc is already a base64 data URI so the file is self-contained.
  const buildHtml = (imageSrc: string): string => {
    const style = getBrandStyle(brand);

    // 'right' → image LEFT, text RIGHT  → image comes first in DOM, flex-row
    // 'left'  → text LEFT, image RIGHT  → image comes first in DOM, flex-row-reverse
    const flexDirection = textPosition === 'right' ? 'row' : 'row-reverse';

    const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${style.googleFont}&display=swap`;
    const ctaLabel = formData.ctaText.trim() || 'Play Now';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${brand || 'Casino'} Banner</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${googleFontsUrl}" rel="stylesheet" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #0d0d0d;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: ${style.fontFamily};
    }

    .banner {
      display: flex;
      flex-direction: ${flexDirection};
      width: 100%;
      max-width: 900px;
      overflow: hidden;
      border-radius: 10px;
      box-shadow: 0 8px 48px rgba(0,0,0,0.7);
    }

    /* Mobile: stack image on top, text below */
    @media (max-width: 600px) {
      .banner { flex-direction: column; }
      .banner__image { min-height: 220px; flex: 0 0 auto; }
    }

    /* ── Image panel (45%) — bleeds edge to edge, no padding ── */
    .banner__image {
      flex: 0 0 45%;
      min-height: 320px;
      overflow: hidden;
    }

    .banner__image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* ── Text / offer panel (55%) ── */
    .banner__text {
      flex: 0 0 55%;
      background: ${style.panelBg};
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 40px 44px;
      gap: 12px;
    }

    /* Small brand label at the top */
    .banner__brand {
      font-family: ${style.fontFamily};
      font-size: 10px;
      font-weight: 700;
      color: ${style.accentColor};
      letter-spacing: 0.28em;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    /* ── Offer block: number stacked above type label ── */

    /* The dominant visual — huge bold number e.g. "20" or "$5" */
    .banner__number {
      font-family: ${style.fontFamily};
      font-size: clamp(72px, 10vw, 104px);
      font-weight: 900;
      color: ${style.headlineColor};
      line-height: 0.95;
      letter-spacing: -0.03em;
      display: block;
    }

    /* "FREE SPINS" — sits directly below the number */
    .banner__type {
      font-family: ${style.fontFamily};
      font-size: clamp(20px, 3vw, 32px);
      font-weight: 800;
      color: ${style.headlineColor};
      text-transform: uppercase;
      letter-spacing: 0.06em;
      line-height: 1;
      display: block;
      margin-top: 4px;
    }

    /* "NO DEPOSIT BONUS" — smaller faded qualifier */
    .banner__descriptor {
      font-family: ${style.fontFamily};
      font-size: 11px;
      font-weight: 600;
      color: ${style.bodyColor};
      letter-spacing: 0.22em;
      text-transform: uppercase;
      opacity: 0.65;
      margin-top: 2px;
    }

    /* "+ X% BONUS" accent line */
    .banner__bonus {
      font-family: ${style.fontFamily};
      font-size: clamp(16px, 2vw, 22px);
      font-weight: 700;
      color: ${style.accentColor};
      letter-spacing: 0.02em;
    }

    /* ── CTA Button — full-width, flat rounded rect (not pill) ── */
    .banner__cta {
      display: block;
      width: 100%;
      background: ${style.buttonBg};
      color: ${style.buttonText};
      font-family: ${style.fontFamily};
      font-size: 15px;
      font-weight: 800;
      text-decoration: none;
      text-align: center;
      padding: 16px 24px;
      border-radius: 7px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      margin-top: 10px;
      cursor: pointer;
      transition: opacity 0.15s ease;
    }

    .banner__cta:hover {
      opacity: 0.85;
    }

    /* Bonus code — tiny faded text below button */
    .banner__code {
      font-family: ${style.fontFamily};
      font-size: 10px;
      font-weight: 500;
      color: ${style.bodyColor};
      letter-spacing: 0.18em;
      text-transform: uppercase;
      opacity: 0.4;
      margin-top: 2px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="banner">

    <!-- Image panel — base64-embedded so the file is fully self-contained -->
    <div class="banner__image">
      <img src="${imageSrc}" alt="${brand || 'Casino'} promotional banner" />
    </div>

    <!-- Text / offer panel -->
    <div class="banner__text">
      ${brand ? `<p class="banner__brand">${brand}</p>` : ''}

      <!-- Dominant offer: huge number, then "FREE SPINS" stacked below it -->
      <span class="banner__number">${formData.welcomeBonus}</span>
      <span class="banner__type">Free Spins</span>

      <p class="banner__descriptor">No Deposit Bonus</p>
      ${formData.bonusPercentage ? `<p class="banner__bonus">+ ${formData.bonusPercentage}% Bonus</p>` : ''}

      <a href="${formData.ctaUrl || '#'}" class="banner__cta">${ctaLabel}</a>
      ${formData.bonusCode ? `<p class="banner__code">Code: ${formData.bonusCode}</p>` : ''}
    </div>

  </div>
</body>
</html>`;
  };

  const handleGenerate = async () => {
    setError(null);
    if (!formData.welcomeBonus.trim()) {
      setError('Please enter the number of free spins.');
      return;
    }
    setIsGenerating(true);
    try {
      // Convert the image to a base64 data URI before building the HTML.
      // This ensures the downloaded file renders the image everywhere.
      const imageSrc = await toBase64DataUri(imageUrl);
      setGeneratedHtml(buildHtml(imageSrc));
    } catch {
      setError('Failed to embed the image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brand ? brand.toLowerCase() : 'banner'}-email.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreview = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleClose = () => {
    setFormData({ welcomeBonus: '', bonusPercentage: '', bonusCode: '', ctaUrl: '#', ctaText: 'Play Now' });
    setGeneratedHtml(null);
    setTextPosition('right');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5" />
            Convert to HTML Banner
            {brand && (
              <span className="text-xs font-normal text-muted-foreground ml-1">· {brand}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {!generatedHtml ? (
          <>
            <div className="space-y-4 py-4">

              {/* Image position toggle */}
              <div className="space-y-2">
                <Label>Image Position</Label>
                <div className="inline-flex rounded-lg bg-muted p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setTextPosition('right')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      textPosition === 'right'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    Image Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextPosition('left')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      textPosition === 'left'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                    Image Right
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeBonus">Free Spins *</Label>
                <Input
                  id="welcomeBonus"
                  placeholder="e.g. 20"
                  value={formData.welcomeBonus}
                  onChange={(e) => handleInputChange('welcomeBonus', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonusPercentage">Bonus Percentage</Label>
                <Input
                  id="bonusPercentage"
                  placeholder="e.g. 100"
                  value={formData.bonusPercentage}
                  onChange={(e) => handleInputChange('bonusPercentage', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonusCode">Bonus Code</Label>
                <Input
                  id="bonusCode"
                  placeholder="e.g. WELCOME100"
                  value={formData.bonusCode}
                  onChange={(e) => handleInputChange('bonusCode', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctaText">Button Text</Label>
                <Input
                  id="ctaText"
                  placeholder="e.g. Play Now"
                  value={formData.ctaText}
                  onChange={(e) => handleInputChange('ctaText', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctaUrl">CTA Link URL</Label>
                <Input
                  id="ctaUrl"
                  placeholder="https://your-casino.com/register"
                  value={formData.ctaUrl === '#' ? '' : formData.ctaUrl}
                  onChange={(e) => handleInputChange('ctaUrl', e.target.value || '#')}
                />
              </div>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} className="gradient-primary gap-2" disabled={isGenerating}>
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Embedding image…</>
                ) : (
                  <><FileCode className="w-4 h-4" /> Generate HTML</>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileCode className="w-8 h-8 text-primary" />
              </div>
              <p className="text-foreground font-medium mb-1">HTML Banner Ready</p>
              <p className="text-sm text-muted-foreground">
                Image {textPosition === 'right' ? 'left' : 'right'} · {brand || 'Generic'} · image embedded
              </p>
            </div>

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setGeneratedHtml(null)} className="gap-2">
                Edit
              </Button>
              <Button variant="outline" onClick={handlePreview} className="gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button onClick={handleDownload} className="gradient-primary gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
