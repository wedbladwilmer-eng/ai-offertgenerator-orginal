console.log("🔍 Product received in ProductDisplay:", product);

import React, { useState } from "react";

interface Variation {
  color: string;
  colorCode?: string;
  image_url?: string;
  articleNumber?: string;
}

interface ProductDisplayProps {
  product: {
    name: string;
    description?: string;
    price_ex_vat?: number;
    image_url?: string;
    variations?: Variation[];
  };
  onAddToQuote?: (product: any, quantity: number) => void;
}

export default function ProductDisplay({ product, onAddToQuote }: ProductDisplayProps) {
  if (!product) return <p>Ingen produkt vald</p>;

  // 🧠 State för att hålla koll på vald färgvariant
  const [currentIndex, setCurrentIndex] = useState(0);

  // 🧩 Hämta variationer från produkten (eller fallback till huvudbilden)
  const variations =
    product.variations && product.variations.length > 0
      ? product.variations
      : [
          {
            color: "Standard",
            image_url: product.image_url,
          },
        ];

  const currentVariation = variations[currentIndex];

  // 🔁 Funktioner för att byta bild (vänster/höger)
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % variations.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + variations.length) % variations.length);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-4 rounded-lg shadow-md text-center">
      {/* Produktbild */}
      {currentVariation?.image_url ? (
        <div className="relative">
          <img
            src={currentVariation.image_url}
            alt={`${product.name} - ${currentVariation.color}`}
            className="w-full h-auto rounded-md"
          />

          {/* Vänsterpil */}
          {variations.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 shadow"
                aria-label="Föregående färg"
              >
                ◀
              </button>

              {/* Högerpil */}
              <button
                onClick={handleNext}
                className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 shadow"
                aria-label="Nästa färg"
              >
                ▶
              </button>
            </>
          )}
        </div>
      ) : (
        <p className="text-gray-500">Ingen bild tillgänglig</p>
      )}

      {/* Färgindikator */}
      <p className="mt-2 text-sm text-gray-600">
        Färg: <span className="font-medium">{currentVariation?.color || "Okänd"}</span>
      </p>

      {/* Produktinformation */}
      <div className="mt-4">
        <h2 className="text-lg font-semibold">{product.name}</h2>
        <p className="text-gray-600">{product.description}</p>
        {product.price_ex_vat && <p className="mt-2 font-medium">{product.price_ex_vat} kr exkl. moms</p>}
      </div>

      {/* Lägg till i offert */}
      {onAddToQuote && (
        <button
          onClick={() => onAddToQuote(product, 1)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Lägg till i offert
        </button>
      )}
    </div>
  );
}
