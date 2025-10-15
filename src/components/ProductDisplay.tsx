import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Product } from "@/hooks/useProducts";

type ProductDisplayProps = {
  product: Product;
  onAddToQuote?: (product: Product, quantity: number) => void;
};

const ProductDisplay: React.FC<ProductDisplayProps> = ({ product, onAddToQuote }) => {
  const [currentVariationIndex, setCurrentVariationIndex] = useState(0);
  const variations = product?.variations || [];

  const currentImage = variations.length > 0 ? variations[currentVariationIndex]?.image_url : product?.image_url;

  const currentColor = variations.length > 0 ? variations[currentVariationIndex]?.color : "Standard";

  const hasMultipleVariations = variations.length > 1;

  const handleNext = () => {
    setCurrentVariationIndex((prev) => (prev + 1) % variations.length);
  };

  const handlePrev = () => {
    setCurrentVariationIndex((prev) => (prev === 0 ? variations.length - 1 : prev - 1));
  };

  if (!product) return null;

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <h2 className="text-2xl font-semibold text-center">{product.name}</h2>

      <div className="relative flex items-center justify-center">
        {currentImage ? (
          <img
            src={currentImage}
            alt={product.name}
            className="max-h-[400px] rounded-lg shadow-md transition-all duration-300"
          />
        ) : (
          <div className="text-gray-500 italic">Ingen bild tillgänglig</div>
        )}

        {hasMultipleVariations && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition"
              aria-label="Föregående färg"
            >
              ◀
            </button>

            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition"
              aria-label="Nästa färg"
            >
              ▶
            </button>
          </>
        )}
      </div>

      <p className="text-sm text-gray-600 mt-2">
        Färg: <span className="font-medium">{currentColor}</span>
      </p>

      <p className="text-lg font-semibold">{product.price_ex_vat} kr (exkl. moms)</p>

      {onAddToQuote && <Button onClick={() => onAddToQuote(product, 1)}>Lägg till i offert</Button>}
    </div>
  );
};

export default ProductDisplay;
