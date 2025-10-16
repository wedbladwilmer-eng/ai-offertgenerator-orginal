import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Product } from "@/hooks/useProducts";
import { ProductImageView } from "@/components/ProductImageView";
import { useNavigate } from "react-router-dom";

type ProductDisplayProps = {
  product: Product;
  onAddToQuote?: (product: Product, quantity: number, selectedViews?: string[]) => void;
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
        {product.image_url && (
          <div className="w-[200px] flex-shrink-0">
            <div className="grid grid-cols-2 gap-2">
              {["Front", "Right", "Back", "Left"].map((view) => (
                <ProductImageView
                  key={view}
                  view={view}
                  baseImageUrl={currentImage ?? product.image_url ?? ""}
                  selected={selectedViews.includes(view)}
                  onToggle={() => toggleView(view)}
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
          const imageUrl = currentImage || product.image_url || "";
          
          // Extract colorCode and folderId from imageUrl
          // Format: https://images.nwgmedia.com/preview/{folder_id}/{article}_{color}_{slug}_{view}.jpg
          let selectedColorCode = product.colorCode || "";
          let selectedFolderId = product.folder_id || "";
          
          if (imageUrl) {
            const folderMatch = imageUrl.match(/\/preview\/(\d{5,6})\//);
            if (folderMatch) selectedFolderId = folderMatch[1];
            
            const colorMatch = imageUrl.match(/[_-](\d{2,3})[_-]/);
            if (colorMatch) selectedColorCode = colorMatch[1];
          }

          navigate(
            `/quote?productId=${product.id}&colorCode=${selectedColorCode}&folderId=${selectedFolderId}&imageUrl=${encodeURIComponent(
              imageUrl
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
