import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Heart, Images, RefreshCw, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ── Types ─────────────────────────────────────────────────────────────────────

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

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     || '';
const SUPABASE_ANON    = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

async function fetchImages(page: number, filter: string): Promise<{ data: GeneratedImage[]; hasMore: boolean }> {
  const PAGE_SIZE = 30;
  const offset    = page * PAGE_SIZE;

  let query = `generated_images?select=*&order=created_at.desc&limit=${PAGE_SIZE}&offset=${offset}`;
  if (filter && filter !== 'all') {
    query += `&provider=eq.${encodeURIComponent(filter)}`;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: {
      'apikey':        SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
    },
  });

  if (!res.ok) throw new Error(`Failed to load images (${res.status})`);
  const data: GeneratedImage[] = await res.json();
  return { data, hasMore: data.length === PAGE_SIZE };
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
  image,
  all,
  onClose,
  onPrev,
  onNext,
}: {
  image: GeneratedImage;
  all: GeneratedImage[];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const idx   = all.findIndex(i => i.id === image.id);
  const hasPrev = idx > 0;
  const hasNext = idx < all.length - 1;

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  const date = new Date(image.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-3 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      <div className="flex flex-col items-center gap-4 max-w-4xl w-full">
        <img
          src={image.public_url}
          alt={image.filename}
          className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
        />

        {/* Meta bar */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Badge variant="secondary" className="capitalize">{image.provider}</Badge>
          {image.aspect_ratio !== 'edited' && (
            <Badge variant="outline">{image.aspect_ratio}</Badge>
          )}
          <Badge variant="outline">{image.resolution}</Badge>
          <span className="text-white/50 text-xs">{date}</span>

          {/* Download */}
          <a
            href={image.public_url}
            download={image.filename}
            target="_blank"
            rel="noreferrer"
            className="ml-2 inline-flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </div>

        {/* Counter */}
        <p className="text-white/30 text-xs">{idx + 1} / {all.length}</p>
      </div>

      {/* Next */}
      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-3 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

// ── Image card ─────────────────────────────────────────────────────────────────

function ImageCard({ image, onClick }: { image: GeneratedImage; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);

  const isEdited = image.provider === 'edit';

  return (
    <div
      className="group relative overflow-hidden rounded-xl cursor-pointer bg-muted/30 border border-border hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      onClick={onClick}
    >
      {/* Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-muted/50 animate-pulse" />
      )}

      <img
        src={image.public_url}
        alt={image.filename}
        className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02] ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
          <div className="flex gap-1.5 flex-wrap">
            <Badge className="text-[10px] px-1.5 py-0 capitalize bg-black/60 text-white border-0 hover:bg-black/60">
              {isEdited ? '✏️ edited' : image.provider}
            </Badge>
            {image.aspect_ratio !== 'edited' && (
              <Badge className="text-[10px] px-1.5 py-0 bg-black/60 text-white border-0 hover:bg-black/60">
                {image.aspect_ratio}
              </Badge>
            )}
            <Badge className="text-[10px] px-1.5 py-0 bg-black/60 text-white border-0 hover:bg-black/60">
              {image.resolution}
            </Badge>
          </div>
          <a
            href={image.public_url}
            download={image.filename}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-white/80 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

const FILTERS = [
  { value: 'all',    label: 'All' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'edit',   label: 'Edited' },
];

export default function ImageLibrary() {
  const [images,    setImages]    = useState<GeneratedImage[]>([]);
  const [page,      setPage]      = useState(0);
  const [hasMore,   setHasMore]   = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [filter,    setFilter]    = useState('all');
  const [lightbox,  setLightbox]  = useState<GeneratedImage | null>(null);

  const load = useCallback(async (pageNum: number, activeFilter: string, reset = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, hasMore: more } = await fetchImages(pageNum, activeFilter);
      setImages(prev => reset ? data : [...prev, ...data]);
      setHasMore(more);
      setPage(pageNum);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load images');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    load(0, filter, true);
  }, [filter, load]);

  const handleFilterChange = (f: string) => {
    setFilter(f);
    setPage(0);
    setImages([]);
  };

  // Lightbox navigation
  const lightboxIdx = lightbox ? images.findIndex(i => i.id === lightbox.id) : -1;
  const prevImage   = () => lightboxIdx > 0 && setLightbox(images[lightboxIdx - 1]);
  const nextImage   = () => lightboxIdx < images.length - 1 && setLightbox(images[lightboxIdx + 1]);

  return (
    <div className="min-h-screen bg-background">

      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <Images className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="font-semibold text-foreground">Image Library</h1>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => handleFilterChange(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => load(0, filter, true)}
            disabled={isLoading}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-7xl mx-auto px-4 py-6">

        {/* Error */}
        {error && (
          <div className="text-center py-16">
            <p className="text-destructive mb-3">{error}</p>
            <Button variant="outline" onClick={() => load(0, filter, true)}>Try again</Button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && images.length === 0 && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-6">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No images yet</h2>
            <p className="text-muted-foreground mb-6">Generate some images first and they'll appear here.</p>
            <Link to="/">
              <Button>Go generate images</Button>
            </Link>
          </div>
        )}

        {/* Masonry grid */}
        {images.length > 0 && (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-0">
            {images.map(image => (
              <div key={image.id} className="break-inside-avoid mb-3">
                <ImageCard image={image} onClick={() => setLightbox(image)} />
              </div>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && images.length === 0 && (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="break-inside-avoid mb-3 rounded-xl bg-muted/50 animate-pulse"
                style={{ height: `${180 + (i % 3) * 60}px` }}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !isLoading && images.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              onClick={() => load(page + 1, filter)}
              className="gap-2"
            >
              Load more
            </Button>
          </div>
        )}

        {/* Loading more spinner */}
        {isLoading && images.length > 0 && (
          <div className="flex justify-center mt-8">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Count */}
        {images.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            {images.length} image{images.length !== 1 ? 's' : ''} loaded
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
