import React, { useState, useEffect } from "react";

interface Variation {
  color: string;
  colorCode?: string;
  articleNumber?: string;
  image_url?: string;
}

interface ProductDisplayProps {
  product: {
    id: string;
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

  // 🧠 Håll koll på vald variant
  const [currentIndex, setCurrentIndex] = useState(0);

  // 🧩 Säkerställ att variations alltid är en lista
  const variations: Variation[] = Array.isArray(product.variations) ? product.variations : [];

  const hasMultiple = variations.length > 1;

  // 🔁 Sätt aktuell variant (eller fallback till huvudproduktens bild)
  const currentVariant =
    variations.length > 0 ? variations[currentIndex] : { image_url: product.image_url, color: "Standard" };

  const handleNext = () => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev + 1) % variations.length);
  };

  const handlePrev = () => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev - 1 + variations.length) % variations.length);
  };

  useEffect(() => {
    console.log("🎨 Variations found:", variations);
  }, [product]);

  return (
    <div className="max-w-md mx-auto bg-white p-4 rounded-lg shadow-md text-center">
      {/* 🖼️ Bild */}
      <div className="relative">
        {currentVariant.image_url ? (
          <img
            src={currentVariant.image_url}
            alt={`${product.name} – ${currentVariant.color}`}
            className="w-full h-auto rounded-md shadow"
          />
        ) : (
          <p className="text-gray-500">Ingen bild tillgänglig</p>
        )}

        {/* 🔹 Pilar visas bara om det finns flera variationer */}
        {hasMultiple && (
          <>
            <button
              onClick={handlePrev}
              className="absolute bottom-2 left-4 bg-gray-800 text-white rounded-full px-3 py-1 hover:bg-gray-700 transition"
              aria-label="Föregående färg"
            >
              ◀
            </button>
            <button
              onClick={handleNext}
              className="absolute bottom-2 right-4 bg-gray-800 text-white rounded-full px-3 py-1 hover:bg-gray-700 transition"
              aria-label="Nästa färg"
            >
              ▶
            </button>
          </>
        )}
      </div>

      {/* 🎨 Färgtext */}
      <p className="mt-2 text-sm text-gray-700">
        Färg: <span className="font-medium">{currentVariant.color || "Okänd"}</span>
      </p>

      {/* 📦 Produktinfo */}
      <div className="mt-4">
        <h2 className="text-lg font-semibold">{product.name}</h2>
        <p className="text-gray-600">{product.description}</p>
        {product.price_ex_vat && <p className="mt-2 font-medium">{product.price_ex_vat} kr exkl. moms</p>}
      </div>

      {/* ➕ Lägg till i offert */}
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
