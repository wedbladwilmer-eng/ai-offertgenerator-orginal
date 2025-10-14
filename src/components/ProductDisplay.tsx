import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Variant = {
  color: string;
  colorCode: string;
  articleNumber: string;
  image_url: string;
};

export default function ProductDisplay({ product }: { product: any }) {
  // 🔹 Förbered variations
  const variations: Variant[] = useMemo(
    () => (Array.isArray(product?.variations) ? product.variations : []),
    [product?.variations],
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  // 🔹 Återställ index när ny produkt laddas
  useEffect(() => {
    setCurrentIndex(0);
  }, [product?.id, variations.length]);

  const hasMultiple = variations.length > 1;
  const currentVariant = variations[currentIndex] ?? null;

  // --- Hjälpfunktioner ---
  const isValidImage = (url?: string | null): boolean => {
    if (!url || typeof url !== "string") return false;
    return /^https:\/\/images\.nwgmedia\.com\/preview\/.+\.(jpg|png|svg)$/i.test(url.trim());
  };

  const src = isValidImage(currentVariant?.image_url)
    ? currentVariant?.image_url
    : isValidImage(product?.image_url)
      ? product.image_url
      : null;

  const handleNext = () => {
    if (!hasMultiple) return;
    const nextIndex = currentIndex === variations.length - 1 ? 0 : currentIndex + 1;
    const nextVariant = variations[nextIndex];
    if (isValidImage(nextVariant?.image_url)) {
      setCurrentIndex(nextIndex);
    } else {
      console.warn("⚠️ Skippade variant utan giltig bild:", nextVariant);
    }
  };

  const handlePrev = () => {
    if (!hasMultiple) return;
    const prevIndex = currentIndex === 0 ? variations.length - 1 : currentIndex - 1;
    const prevVariant = variations[prevIndex];
    if (isValidImage(prevVariant?.image_url)) {
      setCurrentIndex(prevIndex);
    } else {
      console.warn("⚠️ Skippade variant utan giltig bild:", prevVariant);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Bild */}
      <div className="w-full flex justify-center">
        {src ? (
          <img
            src={src}
            alt={`${product?.name ?? "Produkt"}${currentVariant?.color ? " – " + currentVariant.color : ""}`}
            className="object-contain w-full max-h-[400px] rounded-md shadow-md"
          />
        ) : (
          <p className="text-center text-sm text-gray-500 py-10">Ingen bild tillgänglig</p>
        )}
      </div>

      {/* Färgtext */}
      {currentVariant?.color && (
        <p className="text-center text-sm text-gray-700 mt-3">
          Färg: <span className="font-medium">{currentVariant.color}</span>
        </p>
      )}

      {/* Pilar UNDER bilden */}
      {hasMultiple && (
        <div className="mt-4 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={handlePrev}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition"
            aria-label="Föregående färg"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Föregående</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition"
            aria-label="Nästa färg"
          >
            <span className="text-sm">Nästa</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
