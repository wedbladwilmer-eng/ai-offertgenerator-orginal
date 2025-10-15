import React, { useState, useRef } from "react";
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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

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

  // 👇 Swipe logic
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;

    if (Math.abs(distance) > 50) {
      if (distance > 0) {
        handleNext(); // swipe vänster → nästa
      } else {
        handlePrev(); // swipe höger → föregående
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg text-center">
      <h2 className="text-2xl font-semibold mb-4">{product.name}</h2>

      <div
        className="relative flex justify-center items-center w-full select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentImage ? (
          <img
            ref={imageRef}
            src={currentImage}
            alt={product.name}
            className="w-full h-auto max-h-[420px] object-contain rounded-lg shadow transition-opacity duration-300 ease-in-out"
          />
        ) : (
          <p className="text-gray-500 italic">Ingen bild tillgänglig</p>
        )}

        {/* Vänsterpil */}
        {hasMultiple && (
          <button
            onClick={handlePrev}
            className="absolute left-10 top-1/2 -translate-y-1/2 bg-black/70 text-white hover:bg-black/90 hover:scale-110 rounded-full p-3 shadow-xl border-2 border-white/30 backdrop-blur-sm transition-all z-30"
            aria-label="Föregående färg"
          >
            ◀
          </button>
        )}

        {/* Högerpil */}
        {hasMultiple && (
          <button
            onClick={handleNext}
            className="absolute right-10 top-1/2 -translate-y-1/2 bg-black/70 text-white hover:bg-black/90 hover:scale-110 rounded-full p-3 shadow-xl border-2 border-white/30 backdrop-blur-sm transition-all z-30"
            aria-label="Nästa färg"
          >
            ▶
          </button>
        )}
      </div>

      {/* Färgnamn under bilden */}
      <div className="mt-4">
        <p className="text-sm text-gray-700">
          Färg: <span className="font-medium">{currentColor}</span>
        </p>
        {product.price_ex_vat && <p className="mt-2 font-semibold">{product.price_ex_vat} kr (exkl. moms)</p>}
      </div>

      {hasMultiple && (
        <p className="mt-3 text-xs text-gray-500 italic">Swipe eller klicka på pilarna för att byta färg</p>
      )}

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
