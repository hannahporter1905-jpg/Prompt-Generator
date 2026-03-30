/**
 * BackgroundSelect — Q4: Background & lighting.
 *
 * Sections:
 *  - Background type + detail
 *  - Match country / city
 *  - Flag in background
 *  - Lighting tone (auto-filled from brand, overridable, with Custom free-text)
 *  - Optional props (trophy, scoreboard, equipment)
 *
 * Every chip section has a "Custom" escape hatch so the user is never restricted.
 */
import { useState } from 'react';
import {
  BACKGROUND_CATEGORIES,
  TOP_MATCH_COUNTRIES,
  LIGHTING_TONES,
  BRAND_LIGHTING_DEFAULTS,
  BackgroundCategory,
} from './scene-presets';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SportsBannerData } from '@/types/prompt';

type ChangeFn = (
  field: keyof Pick<
    SportsBannerData,
    | 'backgroundCategory' | 'backgroundDetail'
    | 'matchCountry' | 'flagInBackground' | 'flagCountry'
    | 'lightingTone' | 'lightingToneDetail'
    | 'hasTrophy' | 'hasScoreboard' | 'scoreboardText' | 'hasEquipment'
  >,
  value: string | boolean
) => void;

type Props = {
  sport: string;
  /** Active brand — used to show which lighting was auto-filled */
  brand: string;
  backgroundCategory: string;
  backgroundDetail: string;
  matchCountry: string;
  flagInBackground: boolean;
  flagCountry: string;
  lightingTone: string;
  lightingToneDetail: string;
  hasTrophy: boolean;
  hasScoreboard: boolean;
  scoreboardText: string;
  hasEquipment: boolean;
  onChange: ChangeFn;
};

export function BackgroundSelect({
  sport,
  brand,
  backgroundCategory,
  backgroundDetail,
  matchCountry,
  flagInBackground,
  flagCountry,
  lightingTone,
  lightingToneDetail,
  hasTrophy,
  hasScoreboard,
  scoreboardText,
  hasEquipment,
  onChange,
}: Props) {
  const [customBgText, setCustomBgText] = useState('');
  const [showCustomBg, setShowCustomBg] = useState(false);
  const [customCountry, setCustomCountry] = useState('');
  const [showCustomCountry, setShowCustomCountry] = useState(false);

  // The lighting tone the brand defaults to
  const brandDefaultLighting = BRAND_LIGHTING_DEFAULTS[brand] ?? '';

  const selectedCategory: BackgroundCategory | undefined = BACKGROUND_CATEGORIES.find(
    (c) => c.id === backgroundCategory
  );

  // ── handlers ──

  const handleCategorySelect = (cat: BackgroundCategory) => {
    setShowCustomBg(false);
    onChange('backgroundCategory', cat.id);
    onChange('backgroundDetail', '');
  };

  const handleDetailSelect = (detail: string) => {
    setShowCustomBg(false);
    setCustomBgText('');
    onChange('backgroundDetail', detail);
  };

  const handleCountrySelect = (name: string) => {
    setShowCustomCountry(false);
    setCustomCountry('');
    onChange('matchCountry', name);
    if (flagInBackground) onChange('flagCountry', name);
  };

  const handleLightingSelect = (id: string) => {
    if (id === 'custom') {
      // Keep existing detail text if already custom; just set the id
      onChange('lightingTone', 'custom');
      // Don't clear lightingToneDetail — user might be switching back
    } else {
      const tone = LIGHTING_TONES.find((t) => t.id === id);
      onChange('lightingTone', id);
      onChange('lightingToneDetail', tone?.promptDetail ?? '');
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Background type ── */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">Background type</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BACKGROUND_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={[
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150',
                'hover:border-primary/60 hover:bg-primary/5',
                backgroundCategory === cat.id ? 'border-primary bg-primary/10' : 'border-border bg-card',
              ].join(' ')}
            >
              <span className="text-xl">{cat.emoji}</span>
              <span className="text-xs font-medium text-center leading-tight text-foreground">{cat.label}</span>
            </button>
          ))}
          {/* Custom category */}
          <button
            type="button"
            onClick={() => {
              setShowCustomBg(true);
              onChange('backgroundCategory', 'custom');
              onChange('backgroundDetail', customBgText);
            }}
            className={[
              'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150',
              'hover:border-primary/60 hover:bg-primary/5',
              backgroundCategory === 'custom' ? 'border-primary bg-primary/10' : 'border-border bg-card',
            ].join(' ')}
          >
            <span className="text-xl">✏️</span>
            <span className="text-xs font-medium text-center leading-tight text-foreground">Custom</span>
          </button>
        </div>

        {/* Detail sub-chips */}
        {selectedCategory && !showCustomBg && (
          <div className="space-y-2 mt-2">
            <Label className="text-sm text-muted-foreground">Choose a detail:</Label>
            <div className="flex flex-wrap gap-2">
              {selectedCategory.details.map((detail) => (
                <button
                  key={detail}
                  type="button"
                  onClick={() => handleDetailSelect(detail)}
                  className={[
                    'px-3 py-1.5 rounded-full border text-sm transition-all duration-150',
                    'hover:border-primary/60 hover:bg-primary/5',
                    backgroundDetail === detail
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border bg-card text-muted-foreground',
                  ].join(' ')}
                >
                  {detail}
                </button>
              ))}
              {/* Custom detail option */}
              <button
                type="button"
                onClick={() => setShowCustomBg(true)}
                className="px-3 py-1.5 rounded-full border text-sm border-dashed border-border text-muted-foreground hover:border-primary/60 hover:text-foreground transition-all duration-150"
              >
                ✏️ Custom…
              </button>
            </div>
          </div>
        )}

        {(showCustomBg || backgroundCategory === 'custom') && (
          <Input
            placeholder="Describe the background in your own words…"
            value={customBgText}
            onChange={(e) => {
              setCustomBgText(e.target.value);
              onChange('backgroundDetail', e.target.value);
            }}
            autoFocus={showCustomBg}
            className="text-sm"
          />
        )}
      </div>

      {/* ── Match country / city ── */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          Match country / city{' '}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Adds local atmosphere — landmarks, architecture, and colour identity.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TOP_MATCH_COUNTRIES.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => handleCountrySelect(c.name)}
              className={[
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm transition-all duration-150',
                'hover:border-primary/60 hover:bg-primary/5',
                matchCountry === c.name
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border bg-card text-muted-foreground',
              ].join(' ')}
            >
              <span>{c.flag}</span><span>{c.name}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustomCountry(true)}
            className={[
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm transition-all duration-150',
              'hover:border-primary/60 hover:bg-primary/5',
              showCustomCountry ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground',
            ].join(' ')}
          >
            ✏️ Other
          </button>
        </div>
        {showCustomCountry && (
          <Input
            placeholder="Type any country or city…"
            value={customCountry}
            onChange={(e) => {
              setCustomCountry(e.target.value);
              onChange('matchCountry', e.target.value);
            }}
            autoFocus
            className="max-w-xs text-sm"
          />
        )}
      </div>

      {/* ── Flag in background ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between max-w-sm">
          <label htmlFor="toggle-flag" className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
            <span>🚩</span> Add flag in background
          </label>
          <Switch
            id="toggle-flag"
            checked={flagInBackground}
            onCheckedChange={(checked) => {
              onChange('flagInBackground', checked);
              if (checked && !flagCountry && matchCountry) onChange('flagCountry', matchCountry);
            }}
          />
        </div>
        {flagInBackground && (
          <div className="space-y-1.5 ml-6">
            <Label className="text-sm text-muted-foreground">Which flag?</Label>
            <div className="flex flex-wrap gap-1.5">
              {TOP_MATCH_COUNTRIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => onChange('flagCountry', c.name)}
                  className={[
                    'flex items-center gap-1 px-2 py-1 rounded-full border text-xs transition-all duration-150',
                    'hover:border-primary/60 hover:bg-primary/5',
                    flagCountry === c.name
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border bg-card text-muted-foreground',
                  ].join(' ')}
                >
                  <span>{c.flag}</span><span>{c.name}</span>
                </button>
              ))}
            </div>
            <Input
              placeholder="Or type any country flag…"
              value={TOP_MATCH_COUNTRIES.some((c) => c.name === flagCountry) ? '' : flagCountry}
              onChange={(e) => onChange('flagCountry', e.target.value)}
              className="max-w-xs text-sm mt-1"
            />
          </div>
        )}
      </div>

      {/* ── Lighting tone ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold text-foreground">Lighting tone</Label>
          {lightingTone === brandDefaultLighting && brandDefaultLighting && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              ✓ Auto from {brand}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Sets the overall color mood. Auto-configured from your brand — override freely.
        </p>
        <div className="flex flex-wrap gap-2">
          {LIGHTING_TONES.map((tone) => (
            <button
              key={tone.id}
              type="button"
              onClick={() => handleLightingSelect(tone.id)}
              className={[
                'px-3 py-1.5 rounded-full border text-sm transition-all duration-150',
                'hover:border-primary/60 hover:bg-primary/5',
                lightingTone === tone.id
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border bg-card text-muted-foreground',
                // Subtle indicator on the brand default
                tone.id === brandDefaultLighting && lightingTone !== tone.id
                  ? 'border-primary/30'
                  : '',
              ].join(' ')}
            >
              {tone.label}
              {tone.id === brandDefaultLighting && (
                <span className="ml-1 text-[10px] opacity-60">●</span>
              )}
            </button>
          ))}
        </div>

        {/* Custom lighting free-text input */}
        {lightingTone === 'custom' && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Describe the exact lighting you want:</p>
            <Input
              placeholder="e.g. warm Moroccan sunset, blue-tinted floodlights with rim light…"
              value={lightingToneDetail}
              onChange={(e) => onChange('lightingToneDetail', e.target.value)}
              className="text-sm"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* ── Optional props ── */}
      <div className="space-y-3 pt-1 border-t border-border">
        <p className="text-sm font-semibold text-foreground pt-2">Optional extras</p>

        <div className="flex items-center justify-between max-w-sm">
          <label htmlFor="toggle-trophy" className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <span>🏆</span> Add championship trophy
          </label>
          <Switch id="toggle-trophy" checked={hasTrophy} onCheckedChange={(v) => onChange('hasTrophy', v)} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between max-w-sm">
            <label htmlFor="toggle-scoreboard" className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <span>📊</span> Add scoreboard
            </label>
            <Switch id="toggle-scoreboard" checked={hasScoreboard} onCheckedChange={(v) => onChange('hasScoreboard', v)} />
          </div>
          {hasScoreboard && (
            <Input
              placeholder='Score text e.g. "0 - 0"'
              value={scoreboardText}
              onChange={(e) => onChange('scoreboardText', e.target.value)}
              className="max-w-[180px] text-sm"
            />
          )}
        </div>

        <div className="flex items-center justify-between max-w-sm">
          <label htmlFor="toggle-equipment" className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <span>🎯</span> Floating {sport.toLowerCase()} equipment
          </label>
          <Switch id="toggle-equipment" checked={hasEquipment} onCheckedChange={(v) => onChange('hasEquipment', v)} />
        </div>
      </div>

    </div>
  );
}
