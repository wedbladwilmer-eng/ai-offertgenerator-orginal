import React, { useEffect, useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

interface ProductImageViewProps {
  view: string;
  baseImageUrl: string;
  selected?: boolean;
  onToggle?: () => void;
}

export const ProductImageView: React.FC<ProductImageViewProps> = ({ 
  view, 
  baseImageUrl, 
  selected = true,
  onToggle 
}) => {
  // Remove any existing suffix from the base URL
  const cleanBase = baseImageUrl.replace(/_(F|B|L|R|Front|Back|Left|Right)\.jpg$/i, "");
  const shortUrl = `${cleanBase}_${view[0].toUpperCase()}.jpg`;
  const longUrl = `${cleanBase}_${view}.jpg`;

  const candidates = useMemo(() => {
    const folderMatch = cleanBase.match(/^(https?:\/\/[^/]+\/preview)\/(\d+)\/(.+)$/);
    // Default candidates from same folder
    let urls: string[] = [shortUrl, longUrl];

    if (folderMatch) {
      const [, previewRoot, folderIdStr, fileBase] = folderMatch;
      const baseId = parseInt(folderIdStr, 10);

      if (!isNaN(baseId)) {
        // Detect original view from the base image url (e.g. _F.jpg or _Front.jpg)
        const baseViewMatch = baseImageUrl.match(/_(F|B|L|R|Front|Back|Left|Right)\.jpg$/i);
        const baseView = baseViewMatch ? baseViewMatch[1] : null;

        // If original is Front/F, prioritize known folder offsets: B:-1, L:+1, R:+2
        const offsetMap: Record<string, number> = { Back: -1, Left: +1, Right: +2, Front: 0, B: -1, L: +1, R: +2, F: 0 };
        const preferredOffset = baseView && baseView.toLowerCase().startsWith('f')
          ? (offsetMap[view] ?? 0)
          : (offsetMap[view] ?? undefined);
        const preferredId = preferredOffset !== undefined ? baseId + preferredOffset : undefined;

        const baseCandidates = [baseId, baseId - 1, baseId + 1, baseId - 2, baseId + 2, baseId - 3, baseId + 3];
        const folderCandidates = preferredId !== undefined
          ? [preferredId, ...baseCandidates.filter((id) => id !== preferredId)]
          : baseCandidates;

        const fileBaseVariants = Array.from(new Set([
          fileBase,
          fileBase.replace(/\s+/g, ''), // no spaces
          fileBase.replace(/[ -]+/g, ''), // no spaces or hyphens
        ]));

        urls = [];
        for (const id of folderCandidates) {
          for (const baseVariant of fileBaseVariants) {
            urls.push(`${previewRoot}/${id}/${baseVariant}_${view[0].toUpperCase()}.jpg`);
            urls.push(`${previewRoot}/${id}/${baseVariant}_${view}.jpg`);
          }
        }
      }
    }

    // De-duplicate while preserving order
    return Array.from(new Set(urls));
  }, [cleanBase, view, shortUrl, longUrl, baseImageUrl]);

  const [idx, setIdx] = useState(0);
  const [src, setSrc] = useState(candidates[0]);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIdx(0);
    setSrc(candidates[0]);
    setHasError(false);
  }, [candidates]);

  const iconMap = {
    Front: ArrowUp,
    Back: ArrowDown,
    Left: ArrowLeft,
    Right: ArrowRight,
  };

  const Icon = iconMap[view as keyof typeof iconMap];

  return (
    <div 
      className={`relative bg-white border-2 rounded-lg overflow-hidden aspect-square flex items-center justify-center cursor-pointer transition-all ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
      }`}
      onClick={onToggle}
    >
      {!hasError ? (
        <img
          src={src}
          alt={`Produktvy ${view}`}
          className="w-full h-full object-contain"
          onError={() => {
            const next = idx + 1;
            if (next < candidates.length) {
              setIdx(next);
              setSrc(candidates[next]);
            } else {
              setHasError(true);
            }
          }}
        />
      ) : (
        <div className="text-center text-muted-foreground flex flex-col items-center justify-center gap-2 p-4">
          <Icon size={32} className="opacity-40" />
          <div className="text-xs font-medium">{view}</div>
          <div className="text-[10px]">Ingen bild tillgänglig</div>
        </div>
      )}
      {onToggle && (
        <div className={`absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          selected ? 'bg-primary border-primary' : 'bg-white border-border'
        }`}>
          {selected && (
            <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};
