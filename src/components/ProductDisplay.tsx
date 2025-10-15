import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/hooks/useProducts";

type ProductDisplayProps = {
  product: Product;
  onAddToQuote?: (product: Product, quantity: number) => void;
};

const ProductDisplay: React.FC<ProductDisplayProps> = ({ product, onAddToQuote }) => {
  const [currentVariationIndex, setCurrentVariationIndex] = useState(0);

  // Debug logging
  useEffect(() => {
    console.log("🔍 ProductDisplay Debug Info:");
    console.log("📦 Product:", product);
    console.log("🎨 Variations:", product?.variations);
    console.log("📊 Variations length:", product?.variations?.length || 0);
    console.log("🔢 Current variation index:", currentVariationIndex);
  }, [product, currentVariationIndex]);

  if (!product) {
    console.log("❌ No product provided to ProductDisplay");
    return null;
  }

  const variations = product?.variations || [];
  const hasMultipleVariations = variations.length > 1;

  console.log("🎯 Has multiple variations:", hasMultipleVariations);
  console.log("🎨 Variations array:", variations);

  const currentVariation = variations.length > 0 ? variations[currentVariationIndex] : null;
  const currentImage = currentVariation?.image_url || product?.image_url;
  const currentColor = currentVariation?.color || "Standard";

  console.log("🖼️ Current image:", currentImage);
  console.log("🎨 Current color:", currentColor);

  const handlePrevious = () => {
    console.log("⬅️ Previous button clicked");
    setCurrentVariationIndex((prev) => {
      const newIndex = prev === 0 ? variations.length - 1 : prev - 1;
      console.log("📍 New index:", newIndex);
      return newIndex;
    });
  };

  const handleNext = () => {
    console.log("➡️ Next button clicked");
    setCurrentVariationIndex((prev) => {
      const newIndex = (prev + 1) % variations.length;
      console.log("📍 New index:", newIndex);
      return newIndex;
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-center">{product.name}</h2>

      {/* Debug info - remove this in production */}
      <div className="bg-gray-100 p-2 rounded text-xs text-gray-600 w-full">
        <p>🔍 Debug: Variations count: {variations.length}</p>
        <p>🔍 Debug: Has multiple: {hasMultipleVariations ? "YES" : "NO"}</p>
        <p>🔍 Debug: Current index: {currentVariationIndex}</p>
        <p>🔍 Debug: Current color: {currentColor}</p>
      </div>

      <div className="relative flex items-center justify-center w-full">
        {/* Image container */}
        <div className="flex-1 flex justify-center">
          {currentImage ? (
            <img
              src={currentImage}
              alt={`${product.name} - ${currentColor}`}
              className="max-h-[400px] max-w-full object-contain rounded-lg shadow-md transition-all duration-300"
              onError={(e) => {
                console.error("❌ Image failed to load:", currentImage);
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
              onLoad={() => {
                console.log("✅ Image loaded successfully:", currentImage);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg">
              <span className="text-gray-500 italic">No image available</span>
            </div>
          )}
        </div>

        {/* Navigation arrows - Always visible when hasMultipleVariations is true */}
        {hasMultipleVariations && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border border-gray-200 transition-all duration-200 z-10"
              aria-label="Previous variation"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border border-gray-200 transition-all duration-200 z-10"
              aria-label="Next variation"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Color indicator */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Color: <span className="font-medium text-gray-800">{currentColor}</span>
        </p>
        {hasMultipleVariations && (
          <p className="text-xs text-gray-500 mt-1">
            {currentVariationIndex + 1} of {variations.length} variations
          </p>
        )}
      </div>

      {/* Price */}
      <p className="text-lg font-semibold text-center">
        {product.price_ex_vat ? `${product.price_ex_vat} kr (excl. VAT)` : "Price on request"}
      </p>

      {/* Color dots indicator */}
      {hasMultipleVariations && (
        <div className="flex gap-2 justify-center">
          {variations.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                console.log("🎯 Dot clicked, setting index to:", index);
                setCurrentVariationIndex(index);
              }}
              className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                index === currentVariationIndex
                  ? "bg-blue-500 border-blue-500"
                  : "bg-gray-200 border-gray-300 hover:border-gray-400"
              }`}
              aria-label={`Select variation ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Add to quote button */}
      {onAddToQuote && (
        <Button onClick={() => onAddToQuote(product, 1)} className="mt-4">
          Add to quote
        </Button>
      )}
    </div>
  );
};

export default ProductDisplay;
