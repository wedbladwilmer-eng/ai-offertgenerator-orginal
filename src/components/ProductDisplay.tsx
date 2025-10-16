import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Product } from "@/hooks/useProducts";
import { useNavigate } from "react-router-dom";
import { generateAngleImages, getViewLabelInSwedish } from "@/lib/generateAngleImages";

type ProductDisplayProps = {
  product: Product;
  onAddToQuote?: (product: Product, quantity: number, selectedViews?: string[]) => void;
};

// Separate component for angle image view
const AngleImageView: React.FC<{
  short: string;
  long: string;
  label: string;
  isSelected: boolean;
  onToggle: () => void;
}> = ({ short, long, label, isSelected, onToggle }) => {
  const [src, setSrc] = useState(short);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setSrc(short);
    setHasError(false);
  }, [short]);

  return (
    <div
      onClick={onToggle}
      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="aspect-square bg-gray-50">
        {!hasError ? (
          <img
            src={src}
            alt={label}
            className="w-full h-full object-contain"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onError={() => {
              if (src === short) {
                setSrc(long);
              } else {
                setHasError(true);
              }
            }}
          />
        ) : (
          <img
            src="/placeholder.svg"
            alt={label}
            className="w-full h-full object-contain p-4 opacity-30"
          />
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 text-center">
        {getViewLabelInSwedish(label)}
      </div>
      {isSelected && (
        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

const ProductDisplay: React.FC<ProductDisplayProps> = ({ product, onAddToQuote }) => {
  if (!product) return null;

  const navigate = useNavigate();
  const variations = product.variations || [];
  const images = product.images || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedViews, setSelectedViews] = useState<string[]>(["Front", "Right", "Back", "Left"]);

  const hasMultiple = variations.length > 1 || images.length > 1;
  const currentVariation = variations[currentIndex];
  const currentImage = currentVariation?.image_url || images[currentIndex] || product.image_url;
  const currentColor = currentVariation?.color || "Standard";

  const handleNext = () => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev + 1) % variations.length);
  };

  const handlePrev = () => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev === 0 ? variations.length - 1 : prev - 1));
  };

  // Swipe
  let touchStartX = 0;
  let touchEndX = 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance = touchStartX - touchEndX;
    if (Math.abs(distance) > 50) {
      distance > 0 ? handleNext() : handlePrev();
    }
  };

  const toggleView = (view: string) => {
    setSelectedViews((prev) => (prev.includes(view) ? prev.filter((v) => v !== view) : [...prev, view]));
  };

  // Extract folder_id, article_number, color_code, slug from current variation
  const extractImageParams = () => {
    const imageUrl = currentImage || product.image_url || "";
    
    // Extract folder_id from URL
    let folderId = "";
    const folderMatch = imageUrl.match(/\/preview\/(\d{5,6})\//);
    if (folderMatch) folderId = folderMatch[1];
    
    // Extract color_code from URL
    let colorCode = "";
    const colorMatch = imageUrl.match(/[_-](\d{2,3})[_-]/);
    if (colorMatch) colorCode = colorMatch[1];
    
    // Article number is the product ID
    const articleNumber = product.id;
    
    // Slug from product name (remove spaces)
    const slug = (product.name || "").replace(/\s+/g, "");
    
    return { folderId, articleNumber, colorCode, slug };
  };

  const { folderId, articleNumber, colorCode, slug } = extractImageParams();
  const angleImages = generateAngleImages(folderId, articleNumber, colorCode, slug, ["Front", "Right", "Back", "Left"]);

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg text-center overflow-visible relative">
      <h2 className="text-2xl font-semibold mb-4">{product.name}</h2>

      {/* Bildsektionen - huvudbild till vänster, 4 vinklar till höger */}
      <div className="flex gap-4">
        {/* Huvudbild */}
        <div
          className="flex-1 select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {currentImage ? (
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-auto max-h-[420px] object-contain rounded-lg shadow"
            />
          ) : (
            <p className="text-gray-500 italic">Ingen bild tillgänglig</p>
          )}
        </div>

        {/* 4 vinklar i 2x2 grid */}
        {angleImages.length > 0 && (
          <div className="w-[200px] flex-shrink-0">
            <div className="grid grid-cols-2 gap-2">
              {angleImages.map((img) => (
                <AngleImageView
                  key={img.label}
                  short={img.short}
                  long={img.long}
                  label={img.label}
                  isSelected={selectedViews.includes(img.label)}
                  onToggle={() => toggleView(img.label)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigeringspilar under bilden */}
      {hasMultiple && (
        <div className="flex justify-center gap-6 mt-4">
          <button
            onClick={handlePrev}
            aria-label="Föregående färg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-3 shadow-lg transition-all hover:scale-110"
          >
            ◀
          </button>
          <button
            onClick={handleNext}
            aria-label="Nästa färg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-3 shadow-lg transition-all hover:scale-110"
          >
            ▶
          </button>
        </div>
      )}

      {/* Info under bilden */}
      <div className="mt-4">
        <p className="text-sm text-gray-700">
          Färg: <span className="font-medium">{currentColor}</span>
        </p>

        {hasMultiple && (
          <p className="text-xs text-gray-500 italic mt-1">Swipe eller klicka på pilarna för att byta färg</p>
        )}

        {product.price_ex_vat && <p className="mt-2 font-semibold">{product.price_ex_vat} kr (exkl. moms)</p>}
      </div>

      {/* Skapa offert button */}
      <Button
        onClick={() => {
          navigate(
            `/quote?productId=${articleNumber}&colorCode=${colorCode}&folderId=${folderId}&imageUrl=${encodeURIComponent(
              currentImage || product.image_url || ""
            )}&views=${encodeURIComponent(JSON.stringify(selectedViews))}`
          );
        }}
        className="mt-5 w-full"
        size="lg"
      >
        Skapa offert
      </Button>
    </div>
  );
};

export default ProductDisplay;
