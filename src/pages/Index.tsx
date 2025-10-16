import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import ProductDisplay from "@/components/ProductDisplay";

const Index = () => {
  const [articleNumber, setArticleNumber] = useState("");
  const { product, isLoading, searchByArticleNumber } = useProducts();

  const handleSearch = async () => {
    if (!articleNumber.trim()) return;
    await searchByArticleNumber(articleNumber.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Offertgenerator</h1>

      {/* 🔍 Sökfält */}
      <div className="flex gap-2 mb-8 w-full max-w-md">
        <Input
          type="text"
          value={articleNumber}
          onChange={(e) => setArticleNumber(e.target.value)}
          placeholder="Ange artikelnummer..."
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? "Laddar..." : "Sök"}
        </Button>
      </div>

      {/* 🧩 Produktvisning */}
      {product ? (
        <div className="w-full max-w-2xl">
          <ProductDisplay product={product} />
        </div>
      ) : (
        <p className="text-gray-500 text-center">Ange ett artikelnummer för att visa produktinformation</p>
      )}
    </div>
  );
};

export default Index;
