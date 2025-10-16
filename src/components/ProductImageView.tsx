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
    // Default: same folder, short then long
    let urls: string[] = [shortUrl, longUrl];

    if (folderMatch) {
      const [, previewRoot, folderIdStr, fileBase] = folderMatch;
      const baseId = parseInt(folderIdStr, 10);
      if (!isNaN(baseId)) {
        const folderCandidates = [baseId, baseId - 1, baseId + 1, baseId - 2, baseId + 2];
        urls = [];
        for (const id of folderCandidates) {
          urls.push(`${previewRoot}/${id}/${fileBase}_${view[0].toUpperCase()}.jpg`);
          urls.push(`${previewRoot}/${id}/${fileBase}_${view}.jpg`);
        }
      }
    }

    // De-duplicate while preserving order
    return Array.from(new Set(urls));
  }, [cleanBase, view, shortUrl, longUrl]);

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
