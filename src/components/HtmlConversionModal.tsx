import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Eye, FileCode, AlignLeft, AlignRight, Loader2 } from 'lucide-react';
import { getBrandStyle } from '@/lib/brand-standards';
import {
  buildBannerHtml,
  OFFER_CONFIG,
  type OfferType,
  type TextPosition,
  type BannerFormData,
} from '@/lib/build-banner-html';

interface HtmlConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  brand?: string;
}

/* ────────────────────────────────────────────────────────────────────────
   Native preview — renders a live banner preview using plain React/CSS.
   No iframe needed, so the image always loads normally.
──────────────────────────────────────────────────────────────────────── */
function BannerPreview({
  imageUrl, brand, formData, offerType, textPosition,
}: {
  imageUrl: string;
  brand?: string;
  formData: BannerFormData;
  offerType: OfferType;
  textPosition: TextPosition;
}) {
  const style = getBrandStyle(brand);
  const cfg = OFFER_CONFIG[offerType];
  const headline = offerType === 'bonus' ? `${formData.mainValue}%` : formData.mainValue;
  const descriptor = offerType === 'bonus'
    ? (formData.subValue ? `Up to ${formData.subValue}` : 'Welcome Bonus')
    : cfg.descriptor;
  const ctaLabel = formData.ctaText.trim() || 'Play Now';
  const isRight = textPosition === 'right';

  return (
    <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: 'auto' }}>
      {/* Background image */}
      <img src={imageUrl} alt="" className="w-full h-auto block rounded-lg" draggable={false} />

      {/* Gradient overlay */}
      <div className="absolute inset-0 rounded-lg" style={{
        background: `linear-gradient(${isRight ? 'to right' : 'to left'}, transparent 5%, ${style.panelBg}99 35%, ${style.panelBg}ee 60%, ${style.panelBg}f7 80%)`,
      }} />

      {/* Text layer */}
      <div className={`absolute inset-0 flex items-center ${isRight ? 'justify-end' : 'justify-start'}`}>
        <div className="flex flex-col gap-[2px] w-[46%]" style={{ padding: '8% 7%' }}>
          {brand && (
            <span style={{ fontSize: '0.45em', fontWeight: 700, color: style.accentColor, letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>
              {brand}
            </span>
          )}
          <span style={{ fontSize: 'clamp(20px, 5vw, 42px)', fontWeight: 900, color: style.headlineColor, lineHeight: 0.9, letterSpacing: '-0.02em' }}>
            {headline || '—'}
          </span>
          <span style={{ fontSize: 'clamp(8px, 1.5vw, 14px)', fontWeight: 800, color: style.headlineColor, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginTop: 2 }}>
            {cfg.typeLabel}
          </span>
          {descriptor && (
            <span style={{ fontSize: '0.4em', fontWeight: 600, color: style.bodyColor, letterSpacing: '0.18em', textTransform: 'uppercase' as const, opacity: 0.75 }}>
              {descriptor}
            </span>
          )}
          {formData.crossSell && (
            <span style={{ fontSize: '0.5em', fontWeight: 700, color: style.accentColor }}>
              {formData.crossSell}
            </span>
          )}
          <span className="mt-1 block text-center rounded" style={{
            background: style.buttonBg, color: style.buttonText,
            fontSize: 'clamp(6px, 1vw, 10px)', fontWeight: 800, padding: '5px 8px',
            textTransform: 'uppercase' as const, letterSpacing: '0.1em',
          }}>
            {ctaLabel}
          </span>
          {formData.bonusCode && (
            <span style={{ fontSize: '0.3em', color: style.bodyColor, opacity: 0.4, textAlign: 'center' as const, letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>
              Code: {formData.bonusCode}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   toBase64DataUri — embeds image as data URI for the downloadable HTML
──────────────────────────────────────────────────────────────────────── */
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
    return url;
  }
}

/* ────────────────────────────────────────────────────────────────────────
   Modal
──────────────────────────────────────────────────────────────────────── */
export function HtmlConversionModal({ isOpen, onClose, imageUrl, brand }: HtmlConversionModalProps) {
  const [formData, setFormData] = useState<BannerFormData>({
    mainValue: '', subValue: '', crossSell: '', bonusCode: '', ctaUrl: '#', ctaText: 'Play Now',
  });
  const [offerType, setOfferType] = useState<OfferType>('freespins');
  const [textPosition, setTextPosition] = useState<TextPosition>('right');
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect original image dimensions
  const [imgDims, setImgDims] = useState<{ w: number; h: number }>({ w: 16, h: 9 });
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageUrl;
  }, [imageUrl]);

  const handleInputChange = (field: keyof BannerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setError(null);
    if (!formData.mainValue.trim()) {
      setError(`Please enter the ${OFFER_CONFIG[offerType].label.toLowerCase()}.`);
      return;
    }
    setIsGenerating(true);
    try {
      const imageSrc = await toBase64DataUri(imageUrl);
      setGeneratedHtml(buildBannerHtml({
        imageSrc, brand, formData, offerType, textPosition,
        imgWidth: imgDims.w, imgHeight: imgDims.h,
      }));
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
    a.download = `${brand ? brand.toLowerCase() : 'banner'}-${offerType}-banner.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreview = () => {
    // Build HTML with the raw imageUrl (works in a new tab)
    const html = buildBannerHtml({
      imageSrc: imageUrl, brand, formData, offerType, textPosition,
      imgWidth: imgDims.w, imgHeight: imgDims.h,
    });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleClose = () => {
    setFormData({ mainValue: '', subValue: '', crossSell: '', bonusCode: '', ctaUrl: '#', ctaText: 'Play Now' });
    setOfferType('freespins');
    setGeneratedHtml(null);
    setTextPosition('right');
    setError(null);
    onClose();
  };

  const cfg = OFFER_CONFIG[offerType];
  const dimLabel = `${imgDims.w}x${imgDims.h}`;

  const OFFER_CARDS: Record<OfferType, { icon: string; example: string }> = {
    freespins: { icon: '🎰', example: 'e.g. 20, 50, 100' },
    bonus:     { icon: '💰', example: 'e.g. 400% up to $4k' },
    nodeposit: { icon: '🎁', example: 'e.g. $5, €10' },
    freebet:   { icon: '🎲', example: 'e.g. $50 free bet' },
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5 border-b border-border shrink-0">
          <FileCode className="w-4 h-4 text-primary shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-tight">Convert to HTML Banner</h2>
            <p className="text-[11px] text-muted-foreground truncate">{brand || 'Generic'} · {dimLabel}</p>
          </div>
        </div>

        {!generatedHtml ? (
          /* ── FORM STATE ── */
          <div className="overflow-y-auto flex-1 min-h-0">
            <div className="p-4 space-y-3.5">

              {/* Live native preview */}
              <BannerPreview
                imageUrl={imageUrl} brand={brand} formData={formData}
                offerType={offerType} textPosition={textPosition}
              />

              {/* Text position */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Text Position</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['left', 'right'] as TextPosition[]).map((pos) => (
                    <button key={pos} type="button" onClick={() => setTextPosition(pos)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                        textPosition === pos
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}>
                      {pos === 'left' ? <AlignLeft className="w-3 h-3" /> : <AlignRight className="w-3 h-3" />}
                      Text {pos === 'left' ? 'Left' : 'Right'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Offer type */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Offer Type</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(OFFER_CONFIG) as OfferType[]).map((type) => (
                    <button key={type} type="button" onClick={() => setOfferType(type)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-left transition-colors ${
                        offerType === type
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}>
                      <span className="text-base leading-none">{OFFER_CARDS[type].icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-tight">{OFFER_CONFIG[type].typeLabel}</p>
                        <p className="text-[10px] opacity-50 truncate">{OFFER_CARDS[type].example}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Offer details */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Offer Details</p>
                <div className={`grid gap-1.5 ${cfg.showSubValue ? 'grid-cols-2' : ''}`}>
                  <div>
                    <Label htmlFor="mainValue" className="text-[11px] mb-0.5 block">
                      {cfg.label} <span className="text-destructive">*</span>
                    </Label>
                    <Input id="mainValue" placeholder={cfg.mainPlaceholder} value={formData.mainValue}
                      onChange={(e) => handleInputChange('mainValue', e.target.value)} className="h-8 text-sm" />
                  </div>
                  {cfg.showSubValue && (
                    <div>
                      <Label htmlFor="subValue" className="text-[11px] mb-0.5 block">Up to Amount</Label>
                      <Input id="subValue" placeholder="e.g. $4,000" value={formData.subValue}
                        onChange={(e) => handleInputChange('subValue', e.target.value)} className="h-8 text-sm" />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="crossSell" className="text-[11px] mb-0.5 block">
                    Cross-sell <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input id="crossSell" placeholder="e.g. + 500% Bonus" value={formData.crossSell}
                    onChange={(e) => handleInputChange('crossSell', e.target.value)} className="h-8 text-sm" />
                </div>
              </div>

              {/* Button & Code */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Button & Code</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <Label htmlFor="ctaText" className="text-[11px] mb-0.5 block">Button Text</Label>
                    <Input id="ctaText" placeholder="Play Now" value={formData.ctaText}
                      onChange={(e) => handleInputChange('ctaText', e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="bonusCode" className="text-[11px] mb-0.5 block">Bonus Code</Label>
                    <Input id="bonusCode" placeholder="WELCOME100" value={formData.bonusCode}
                      onChange={(e) => handleInputChange('bonusCode', e.target.value)} className="h-8 text-sm" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="ctaUrl" className="text-[11px] mb-0.5 block">Destination URL</Label>
                  <Input id="ctaUrl" placeholder="https://your-casino.com/register"
                    value={formData.ctaUrl === '#' ? '' : formData.ctaUrl}
                    onChange={(e) => handleInputChange('ctaUrl', e.target.value || '#')} className="h-8 text-sm" />
                </div>
              </div>

              {error && (
                <p className="text-destructive text-xs bg-destructive/10 rounded px-2.5 py-1.5">{error}</p>
              )}
            </div>

            {/* Sticky generate button */}
            <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-background/95 backdrop-blur-sm border-t border-border">
              <Button onClick={handleGenerate} className="w-full gradient-primary gap-2 h-9" disabled={isGenerating}>
                {isGenerating ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Embedding image…</>
                ) : (
                  <><FileCode className="w-3.5 h-3.5" /> Generate HTML</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* ── SUCCESS STATE ── */
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4 space-y-3">
              {/* Native preview */}
              <BannerPreview
                imageUrl={imageUrl} brand={brand} formData={formData}
                offerType={offerType} textPosition={textPosition}
              />
              <div className="text-center">
                <p className="text-foreground font-semibold text-sm">HTML Banner Ready</p>
                <p className="text-[11px] text-muted-foreground">
                  {cfg.typeLabel} · {dimLabel} · Text {textPosition} · {brand || 'Generic'}
                </p>
              </div>
            </div>
            <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-background/95 backdrop-blur-sm border-t border-border space-y-2">
              <Button onClick={handleDownload} className="w-full gradient-primary gap-2 h-9">
                <Download className="w-3.5 h-3.5" /> Download HTML
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setGeneratedHtml(null)} className="flex-1 h-8 text-xs">Edit</Button>
                <Button variant="outline" onClick={handlePreview} className="flex-1 gap-1.5 h-8 text-xs">
                  <Eye className="w-3 h-3" /> Full Preview
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
