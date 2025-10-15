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
    setCurrentIndex((prev) => (prev + 1) % variations.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? variations.length - 1 : prev - 1));
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg text-center">
      <h2 className="text-2xl font-semibold mb-4">{product.name}</h2>

      <div className="relative flex justify-center items-center w-full">
        {currentImage ? (
          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-auto max-h-[420px] object-contain rounded-lg shadow transition-all duration-300"
          />
        ) : (
          <p className="text-gray-500 italic">Ingen bild tillgänglig</p>
        )}

        {hasMultiple && (
          <>
            {/* Vänsterpil */}
            <button
              onClick={handlePrev}
              className="absolute left-10 top-1/2 -translate-y-1/2 bg-black/70 text-white hover:bg-black/90 hover:scale-110 rounded-full p-3 shadow-xl border-2 border-white/30 backdrop-blur-sm transition-all z-30"
              aria-label="Föregående färg"
            >
              ◀
            </button>

            {/* Högerpil */}
            <button
              onClick={handleNext}
              className="absolute right-10 top-1/2 -translate-y-1/2 bg-black/70 text-white hover:bg-black/90 hover:scale-110 rounded-full p-3 shadow-xl border-2 border-white/30 backdrop-blur-sm transition-all z-30"
              aria-label="Nästa färg"
            >
              ▶
            </button>
          </>
        )}
      </div>

      {/* Info under bilden */}
      <div className="mt-4">
        <p className="text-sm text-gray-700">
          Färg: <span className="font-medium">{currentColor}</span>
        </p>
        {product.price_ex_vat && <p className="mt-2 font-semibold">{product.price_ex_vat} kr (exkl. moms)</p>}
      </div>

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
