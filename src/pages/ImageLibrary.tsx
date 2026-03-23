import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Download, Images, RefreshCw, X,
  ChevronLeft, ChevronRight, Sparkles, Wand2, Bot, Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Types ──────────────────────────────────────────────────────────────────────

interface GeneratedImage {
  id: string;
  created_at: string;
  filename: string;
  provider: string;
  aspect_ratio: string;
  resolution: string;
  storage_path: string;
  public_url: string;
}

// ── Supabase fetch ─────────────────────────────────────────────────────────────

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL      || '';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

async function fetchImages(
  page: number,
  filter: string,
): Promise<{ data: GeneratedImage[]; hasMore: boolean }> {
  const PAGE_SIZE = 40;
  const offset    = page * PAGE_SIZE;

  let query = `generated_images?select=*&order=created_at.desc&limit=${PAGE_SIZE}&offset=${offset}`;
  if (filter !== 'all') query += `&provider=eq.${encodeURIComponent(filter)}`;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
  });

  if (!res.ok) throw new Error(`Failed to load images (${res.status})`);
  const data: GeneratedImage[] = await res.json();
  return { data, hasMore: data.length === PAGE_SIZE };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function providerLabel(p: string) {
  if (p === 'edit')    return 'Edited';
  if (p === 'gemini')  return 'Gemini';
  if (p === 'chatgpt') return 'ChatGPT';
  return p;
}

function providerColors(p: string): string {
  if (p === 'edit')    return 'bg-amber-500 text-white';
  if (p === 'gemini')  return 'bg-blue-500 text-white';
  if (p === 'chatgpt') return 'bg-emerald-500 text-white';
  return 'bg-muted text-muted-foreground';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Lightbox ───────────────────────────────────────────────────────────────────

function Lightbox({
  image, all, onClose, onPrev, onNext,
}: {
  image: GeneratedImage;
  all: GeneratedImage[];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const idx     = all.findIndex(i => i.id === image.id);
  const hasPrev = idx > 0;
  const hasNext = idx < all.length - 1;
  const isEdited = image.provider === 'edit';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft' && hasPrev)  onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div className="fixed inset-0 z-50 flex bg-black/90 backdrop-blur-md">

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Prev */}
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
          hasPrev
            ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Image area */}
      <div
        className="flex-1 flex items-center justify-center p-16 cursor-pointer"
        onClick={onClose}
      >
        <img
          src={image.public_url}
          alt={image.filename}
          className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
          onClick={e => e.stopPropagation()}
        />
      </div>

      {/* Right panel — metadata */}
      <div className="w-72 flex-shrink-0 bg-zinc-900 border-l border-white/10 flex flex-col overflow-y-auto">
        {/* Provider badge */}
        <div className="p-6 border-b border-white/10">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
            isEdited ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                     : image.provider === 'gemini'
                       ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                       : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {isEdited ? <Wand2 className="w-3.5 h-3.5" />
              : image.provider === 'gemini' ? <Cpu className="w-3.5 h-3.5" />
              : <Bot className="w-3.5 h-3.5" />}
            {providerLabel(image.provider)}
          </span>
        </div>

        {/* Details */}
        <div className="p-6 space-y-5 flex-1">
          {image.aspect_ratio !== 'edited' && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Aspect Ratio</p>
              <p className="text-white font-medium">{image.aspect_ratio}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Resolution</p>
            <p className="text-white font-medium">{image.resolution}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Created</p>
            <p className="text-white/80 text-sm">{formatDate(image.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Filename</p>
            <p className="text-white/60 text-xs break-all font-mono">{image.filename}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-white/10 space-y-2">
          <a
            href={image.public_url}
            download={image.filename}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
          <p className="text-center text-white/30 text-xs">
            {idx + 1} of {all.length}
          </p>
        </div>
      </div>

      {/* Next */}
      <button
        onClick={onNext}
        disabled={!hasNext}
        className={`absolute right-[18.5rem] top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
          hasNext
            ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ── Image card ─────────────────────────────────────────────────────────────────

function ImageCard({ image, onClick }: { image: GeneratedImage; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const isEdited = image.provider === 'edit';

  return (
    <div
      className="group relative overflow-hidden rounded-2xl cursor-pointer bg-muted/40 border border-border/60 hover:border-primary/50 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
      onClick={onClick}
    >
      {/* Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-muted/60 animate-pulse rounded-2xl" />
      )}

      <img
        src={image.public_url}
        alt={image.filename}
        className={`w-full object-cover rounded-2xl transition-transform duration-300 group-hover:scale-[1.03] ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />

      {/* Always-visible provider badge — top left */}
      {loaded && (
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-sm ${providerColors(image.provider)}`}>
            {isEdited && <Wand2 className="w-2.5 h-2.5" />}
            {providerLabel(image.provider)}
          </span>
        </div>
      )}

      {/* Hover overlay — pointer-events-none so clicks pass through to the parent card */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl">
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
          <div className="space-y-0.5">
            {image.aspect_ratio !== 'edited' && (
              <p className="text-white/80 text-[10px] font-medium">{image.aspect_ratio}</p>
            )}
            <p className="text-white/60 text-[10px]">{image.resolution}</p>
          </div>
          <a
            href={image.public_url}
            download={image.filename}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="pointer-events-auto w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Filter tab ─────────────────────────────────────────────────────────────────

const FILTERS = [
  { value: 'all',     label: 'All',      icon: Images },
  { value: 'gemini',  label: 'Gemini',   icon: Cpu },
  { value: 'chatgpt', label: 'ChatGPT',  icon: Bot },
  { value: 'edit',    label: 'Edited',   icon: Wand2 },
];

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ImageLibrary() {
  const [images,    setImages]    = useState<GeneratedImage[]>([]);
  const [page,      setPage]      = useState(0);
  const [hasMore,   setHasMore]   = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [filter,    setFilter]    = useState('all');
  const [lightbox,  setLightbox]  = useState<GeneratedImage | null>(null);
  const [total,     setTotal]     = useState(0);

  const load = useCallback(async (pageNum: number, activeFilter: string, reset = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, hasMore: more } = await fetchImages(pageNum, activeFilter);
      setImages(prev => {
        const next = reset ? data : [...prev, ...data];
        setTotal(next.length);
        return next;
      });
      setHasMore(more);
      setPage(pageNum);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load images');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, filter, true);
  }, [filter, load]);

  const handleFilter = (f: string) => {
    if (f === filter) return;
    setFilter(f);
    setImages([]);
    setPage(0);
  };

  const lightboxIdx = lightbox ? images.findIndex(i => i.id === lightbox.id) : -1;
  const prevImage   = () => lightboxIdx > 0 && setLightbox(images[lightboxIdx - 1]);
  const nextImage   = () => lightboxIdx < images.length - 1 && setLightbox(images[lightboxIdx + 1]);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center gap-6">

          {/* Back + title */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
                <Images className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground text-sm leading-tight">Image Library</h1>
                {total > 0 && (
                  <p className="text-[11px] text-muted-foreground leading-tight">{total} image{total !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1">
              {FILTERS.map(f => {
                const Icon = f.icon;
                const active = filter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => handleFilter(f.value)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {f.label}
                    {active && filter === 'edit' && (
                      <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => load(0, filter, true)}
            disabled={isLoading}
            className="gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading && images.length > 0 ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-sm">Refresh</span>
          </Button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">

        {/* Error */}
        {error && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-destructive/10 mb-4">
              <X className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-foreground font-medium mb-1">Failed to load images</p>
            <p className="text-muted-foreground text-sm mb-6">{error}</p>
            <Button variant="outline" onClick={() => load(0, filter, true)}>Try again</Button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && images.length === 0 && (
          <div className="text-center py-28">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-primary shadow-glow mb-6">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {filter === 'all' ? 'No images yet' : `No ${providerLabel(filter).toLowerCase()} images`}
            </h2>
            <p className="text-muted-foreground mb-8">
              {filter === 'all'
                ? 'Generate some images and they\'ll appear here.'
                : 'Try switching to a different filter.'}
            </p>
            <div className="flex gap-3 justify-center">
              {filter !== 'all' && (
                <Button variant="outline" onClick={() => handleFilter('all')}>Show all images</Button>
              )}
              <Link to="/"><Button>Generate images</Button></Link>
            </div>
          </div>
        )}

        {/* Loading skeleton — first load */}
        {isLoading && images.length === 0 && (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="break-inside-avoid mb-4 rounded-2xl bg-muted/60 animate-pulse"
                style={{ height: `${160 + (i % 4) * 55}px` }}
              />
            ))}
          </div>
        )}

        {/* Masonry grid */}
        {images.length > 0 && (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
            {images.map(image => (
              <div key={image.id} className="break-inside-avoid mb-4">
                <ImageCard image={image} onClick={() => setLightbox(image)} />
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !isLoading && images.length > 0 && (
          <div className="flex justify-center mt-10">
            <Button
              variant="outline"
              size="lg"
              onClick={() => load(page + 1, filter)}
              className="gap-2 px-8 rounded-xl"
            >
              Load more images
            </Button>
          </div>
        )}

        {/* Loading more */}
        {isLoading && images.length > 0 && (
          <div className="flex justify-center mt-10">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          </div>
        )}

        {/* End of results */}
        {!hasMore && !isLoading && images.length > 0 && (
          <p className="text-center text-xs text-muted-foreground/50 mt-10">
            — All {total} images loaded —
          </p>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          image={lightbox}
          all={images}
          onClose={() => setLightbox(null)}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </div>
  );
}
