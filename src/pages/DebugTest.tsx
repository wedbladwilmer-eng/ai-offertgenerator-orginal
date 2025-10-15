import React, { useEffect, useState } from "react";
import { useProducts } from "@/hooks/useProducts";

export default function DebugTest() {
  const { searchByArticleNumber, product } = useProducts();
  const [article, setArticle] = useState("0201050");

  useEffect(() => {
    console.log("🎯 Debug page loaded");
  }, []);

  const handleSearch = () => {
    console.clear();
    console.log("🔍 Searching for article:", article);
    searchByArticleNumber(article);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Test</h1>
      <div className="flex gap-2 mb-4">
        <input
          value={article}
          onChange={(e) => setArticle(e.target.value)}
          className="border p-2 rounded w-full"
          placeholder="Enter article number"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Search
        </button>
      </div>

      {product && (
        <div className="mt-6 border-t pt-4">
          <h2 className="font-semibold mb-2">🧩 Variations Analysis</h2>
          <p>
            Variations Count:{" "}
            <b>{product.variations?.length ?? 0}</b>
          </p>
          <p>
            Has Multiple Variations:{" "}
            {product.variations && product.variations.length > 1 ? "✅ YES" : "❌ NO"}
          </p>

          {product.variations && product.variations.length > 0 && (
            <ul className="mt-3 list-disc ml-5">
              {product.variations.map((v, i) => (
                <li key={i}>
                  {v.color} — {v.image_url}
                </li>
              ))}
            </ul>
          )}

          <pre className="mt-4 bg-gray-100 p-2 rounded overflow-x-auto text-sm">
            {JSON.stringify(product, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
