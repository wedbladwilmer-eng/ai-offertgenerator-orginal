import React, { useState } from "react";

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
        <div className="text-center text-muted-foreground text-xs p-2">
          <div className="font-medium">{view}</div>
          <div className="text-[10px]">Ingen bild tillgänglig</div>
        </div>
      )}
    </div>
  );
};
