import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Product } from "@/hooks/useProducts";

type ProductDisplayProps = {
  product: Product;
  onAddToQuote?: (product: Product, quantity: number) => void;
};

const ProductDisplay: React.FC<ProductDisplayProps> = ({ product, onAddToQuote }) => {
  if (!product) return null;

  const variations = product.variations || [];
  const images = product.images || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasMultiple = variations.length > 1 || images.length > 1;
  const currentImage = variations.length > 0 
    ? variations[currentIndex]?.image_url 
    : images.length > 0 
    ? images[currentIndex]
    : product.image_url;
  const currentColor = variations.length > 0 ? variations[currentIndex]?.color : "Standard";

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

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg text-center overflow-visible relative">
      <h2 className="text-2xl font-semibold mb-4">{product.name}</h2>

      {/* Bildsektionen */}
      <div
        className="w-full select-none"
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

      {/* Offertknapp */}
      {onAddToQuote && (
        <Button
          onClick={() => onAddToQuote(product, 1)}
          className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
        >
          Lägg till i offert
        </Button>
      )}
    </div>
  );
};

export default ProductDisplay;
