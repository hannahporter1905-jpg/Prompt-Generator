import { useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FavoriteHeartProps {
  imageId: string;
  liked: boolean;
  onToggle: (imageId: string, liked: boolean) => void;
  className?: string;
}

export function FavoriteHeart({ imageId, liked, onToggle, className }: FavoriteHeartProps) {
  const [animating, setAnimating] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    onToggle(imageId, !liked);
    setTimeout(() => setAnimating(false), 300);
  }, [imageId, liked, onToggle]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      setAnimating(true);
      onToggle(imageId, !liked);
      setTimeout(() => setAnimating(false), 300);
    }
  }, [imageId, liked, onToggle]);

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
      className={cn(
        'absolute z-20 p-1 rounded-full cursor-pointer',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        // Visibility: always visible when liked, fade in on group hover otherwise
        liked
          ? 'opacity-100'
          : 'opacity-0 group-hover:opacity-100',
        // Background
        'bg-background/70 backdrop-blur-sm hover:bg-background/90',
        // Animation on click
        animating && 'scale-125',
        !animating && 'scale-100',
        className,
      )}
    >
      <Heart
        className={cn(
          'w-3 h-3 transition-all duration-200',
          liked
            ? 'fill-red-500 text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]'
            : 'fill-transparent text-foreground/80',
        )}
      />
    </button>
  );
}
