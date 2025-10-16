import React, { useEffect, useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

interface ProductImageViewProps {
  view: string;
  baseImageUrl: string;
}

export const ProductImageView: React.FC<ProductImageViewProps> = ({ view, baseImageUrl }) => {
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
    <div className="relative bg-white border rounded-lg overflow-hidden aspect-square flex items-center justify-center">
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
    </div>
  );
};
