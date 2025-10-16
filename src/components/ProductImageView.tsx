import React, { useState } from "react";
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

  const [src, setSrc] = useState(shortUrl);
  const [hasError, setHasError] = useState(false);

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
            // Fallback from short (F) to long (Front) variant
            if (src !== longUrl) {
              setSrc(longUrl);
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
