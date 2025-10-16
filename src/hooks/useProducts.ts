// src/hooks/useProducts.ts
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // Justera om din klient ligger annorlunda
import { buildImageUrls, type ProductImageRow } from "@/lib/buildImageUrls";

export type Product = {
  name: string;
  article_number: string;
  category?: string | null;
  price?: number | null;
  image_url?: string | null; // ev. en primärbild från Edge-funktionen
  images?: string[]; // våra fyra genererade bilder (Front/Right/Back/Left) eller fallback med 1 bild
};

type UseProductsState =
  | { loading: true; error: null; product: null }
  | { loading: false; error: string | null; product: Product | null };

type NewWaveProxyResponse = {
  // Anpassa om din Edge-funktion returnerar annan struktur
  name: string;
  article_number: string;
  category?: string | null;
  price?: number | null;
  image_url?: string | null;
};

async function fetchProductFromEdge(articleNumber: string): Promise<Product> {
  // Om din Edge-funktion förväntar sig annan payload/nyckel,
  // justera body nedan (t.ex. { articleNumber }).
  const { data, error } = await supabase.functions.invoke<NewWaveProxyResponse>("new-wave-proxy", {
    body: { article_number: articleNumber },
  });

  if (error) {
    throw new Error(`Kunde inte hämta produkt: ${error.message}`);
  }
  if (!data) {
    throw new Error("Tomt svar från new-wave-proxy.");
  }

  return {
    name: data.name,
    article_number: data.article_number,
    category: data.category ?? null,
    price: data.price ?? null,
    image_url: data.image_url ?? null,
  };
}

async function maybeLookupImagesInSupabase(articleNumber: string): Promise<string[] | null> {
  // Om du har flera rader per artikelnummer, kan du här lägga till
  // extra filter (t.ex. på färg) eller ta första bästa.
  const { data, error } = await supabase
    .from("product_images")
    .select("folder_id, article_number, color_code, slug_name")
    .eq("article_number", articleNumber)
    .limit(1);

  if (error) {
    // Vi loggar och fortsätter utan att krascha hooken.
    console.warn("Fel vid SELECT mot product_images:", error.message);
    return null;
  }

  const row = (data?.[0] ?? null) as ProductImageRow | null;
  if (!row) return null;

  return buildImageUrls(row);
}

/**
 * useProducts: Hämtar en produkt via Edge-funktionen.
 * Om image_url saknas, slår upp i product_images och genererar fyra bild-URL:er.
 */
export function useProducts(articleNumber: string | null): UseProductsState {
  const [state, setState] = useState<UseProductsState>({
    loading: true,
    error: null,
    product: null,
  });

  const normalizedArticle = useMemo(() => (articleNumber ?? "").trim(), [articleNumber]);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      if (!normalizedArticle) {
        if (isMounted) {
          setState({
            loading: false,
            error: "Inget artikelnummer angivet.",
            product: null,
          });
        }
        return;
      }

      setState({ loading: true, error: null, product: null });

      try {
        const product = await fetchProductFromEdge(normalizedArticle);

        // Om Edge-funktionen inte gav någon bild: använd vår Supabase-tabell.
        let images: string[] | null = null;
        if (!product.image_url) {
          images = await maybeLookupImagesInSupabase(normalizedArticle);
        }

        // Fallback: om vi inte lyckades generera 4 bilder men har en singelbild, visa åtminstone den.
        if (!images || images.length === 0) {
          if (product.image_url) {
            images = [product.image_url];
          }
        }

        const productWithImages: Product = {
          ...product,
          images: images ?? [],
        };

        if (isMounted) {
          setState({ loading: false, error: null, product: productWithImages });
        }
      } catch (err: any) {
        if (isMounted) {
          setState({
            loading: false,
            error: err?.message ?? "Ett oväntat fel uppstod.",
            product: null,
          });
        }
      }
    }

    run();
    return () => {
      isMounted = false;
    };
  }, [normalizedArticle]);

  return state;
}
