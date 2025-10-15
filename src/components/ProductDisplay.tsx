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
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentImage = variations.length > 0 ? variations[currentIndex]?.image_url : product.image_url;

  const currentColor = variations.length > 0 ? variations[currentIndex]?.color : "Standard";

  const hasMultiple = variations.length > 1;

  const handleNext = () => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev + 1) % variations.length);
  };

  const handlePrev = () => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev === 0 ? variations.length - 1 : prev - 1));
  };

  // Touch/swipe
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
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg text-center">
      <h2 className="text-2xl font-semibold mb-4">{product.name}</h2>

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

      {/* Navigeringspilar UNDER bilden */}
      {hasMultiple && (
        <div className="flex justify-center items-center gap-8 mt-4">
          <button
            onClick={handlePrev}
            className="bg-black/70 text-white px-4 py-2 rounded-full hover:bg-black/90 transition"
          >
            ◀
          </button>
          <p className="text-sm font-medium text-gray-700">
            {currentColor} ({currentIndex + 1}/{variations.length})
          </p>
          <button
            onClick={handleNext}
            className="bg-black/70 text-white px-4 py-2 rounded-full hover:bg-black/90 transition"
          >
            ▶
          </button>
        </div>
      )}

      {product.price_ex_vat && <p className="mt-4 font-semibold">{product.price_ex_vat} kr (exkl. moms)</p>}

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
