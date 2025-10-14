import React from "react";

interface ProductDisplayProps {
  product: any;
  onAddToQuote?: (product: any, quantity: number) => void;
}

export default function ProductDisplay({ product, onAddToQuote }: ProductDisplayProps) {
  if (!product) return <p>Ingen produkt vald</p>;

  return (
    <div className="max-w-md mx-auto bg-white p-4 rounded-lg shadow-md">
      {/* Produktbild */}
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="w-full h-auto rounded-md" />
      ) : (
        <p className="text-center text-gray-500">Ingen bild tillgänglig</p>
      )}

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
