import React, { useEffect, useState } from "react";
import { useProducts } from "@/hooks/useProducts";

/** 🔧 Inbäddad test-komponent (ingen separat fil krävs) */
const ArrowTest: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Test 1 – Röda pilar (textbaserade) */}
      <div className="border-2 border-red-400 p-3 rounded">
        <h3 className="font-semibold mb-2">Test 1: Röda pilar (◀ ▶)</h3>
        <div className="flex items-center gap-4">
          <button className="bg-red-600 text-white px-4 py-2 rounded">◀</button>
          <span>Syns dessa två knappar tydligt?</span>
          <button className="bg-red-600 text-white px-4 py-2 rounded">▶</button>
        </div>
      </div>

      {/* Test 2 – Blå pilar (SVG) ovanpå en låtsasbild */}
      <div className="border-2 border-blue-400 p-3 rounded">
        <h3 className="font-semibold mb-2">Test 2: Blå pilar (SVG) ovanpå container</h3>
        <div className="relative w-full max-w-md aspect-[4/3] bg-gray-200 rounded overflow-hidden">
          {/* Fake-bildyta */}
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">(bildyta)</div>
          {/* Vänster */}
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-blue-600/80 hover:bg-blue-700 text-white z-40 shadow"
            aria-label="prev"
          >
            {/* enkel SVG-fyrkant → ”<” */}
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          {/* Höger */}
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-blue-600/80 hover:bg-blue-700 text-white z-40 shadow"
            aria-label="next"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Test 3 – Vita pilar (stil som i ProductDisplay) */}
      <div className="border-2 border-green-400 p-3 rounded">
        <h3 className="font-semibold mb-2">Test 3: Vita pilar (ProductDisplay-stil)</h3>
        <div className="relative w-full max-w-md aspect-[4/3] bg-neutral-800 rounded overflow-visible">
          <div className="absolute inset-0 flex items-center justify-center text-white/70">(mörk bildyta)</div>
          <button
            className="absolute left-10 top-1/2 -translate-y-1/2 bg-black/70 text-white hover:bg-black/90 hover:scale-110 rounded-full p-3 shadow-xl border-2 border-white/30 backdrop-blur-sm transition-all z-50"
            aria-label="prev"
          >
            ◀
          </button>
          <button
            className="absolute right-10 top-1/2 -translate-y-1/2 bg-black/70 text-white hover:bg-black/90 hover:scale-110 rounded-full p-3 shadow-xl border-2 border-white/30 backdrop-blur-sm transition-all z-50"
            aria-label="next"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Test 4 – Villkorstext */}
      <div className="border-2 border-emerald-400 p-3 rounded">
        <h3 className="font-semibold mb-2">Test 4: Villkorskontroll</h3>
        <p className="text-emerald-700">
          Om du ser alla tre testblocken ovan, fungerar rendering och CSS för pilar i denna sida.
        </p>
      </div>
    </div>
  );
};

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
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Test</h1>

      {/* Lägg ArrowTest allra högst upp för att utesluta routing/CSS-problem */}
      <div className="mb-6 border-2 border-red-500 rounded p-3">
        <h2 className="font-bold mb-3">ArrowTest-komponent (bör synas här)</h2>
        <ArrowTest />
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={article}
          onChange={(e) => setArticle(e.target.value)}
          className="border p-2 rounded w-full"
          placeholder="Enter article number"
        />
        <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded">
          Search
        </button>
      </div>

      {product && (
        <div className="mt-6 border-t pt-4">
          <h2 className="font-semibold mb-2">🧩 Variations Analysis</h2>
          <p>
            Variations Count: <b>{product.variations?.length ?? 0}</b>
          </p>
          <p>Has Multiple Variations: {product.variations && product.variations.length > 1 ? "✅ YES" : "❌ NO"}</p>

          {product.variations && product.variations.length > 0 && (
            <ul className="mt-3 list-disc ml-5">
              {product.variations.map((v, i) => (
                <li key={i}>
                  {v.color} — {v.image_url}
                </li>
              ))}
            </ul>
          )}

          <pre className="mt-4 bg-gray-100 p-2 rounded overflow-x-auto text-sm">{JSON.stringify(product, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
