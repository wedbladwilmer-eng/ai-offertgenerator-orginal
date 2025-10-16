import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildImageUrls, ProductImageRow } from "@/lib/buildImageUrls";

// 🧩 Produktmodell (utökad med färg & folder)
export interface Product {
  id: string;
  name: string;
  category?: string;
  price_ex_vat?: number;
  image_url?: string;
  images?: string[];
  logo_position?: { x: number; y: number };
  folder_id?: string;
  colorCode?: string;
  slug_name?: string;
  variations?: Array<{
    color: string;
    colorCode?: string;
    folder_id?: string;
    articleNumber?: string;
    image_url?: string;
    slug_name?: string;
  }>;
}

export interface QuoteItem {
  product: Product;
  quantity: number;
  logo_url?: string;
  mockup_url?: string;
  selectedViews?: string[];
}

// 🖼️ Hämtar bildinformation från Supabase-tabellen "product_images"
const fetchImagesFromDatabase = async (articleNumber: string): Promise<ProductImageRow | null> => {
  try {
    const { data, error } = await supabase
      .from("product_images")
      .select("image_url, folder_id, article_number, color_code, slug_name")
      .eq("article_number", articleNumber)
      .maybeSingle();

    if (error) {
      console.warn("Fel vid SELECT mot product_images:", error.message);
      return null;
    }

    if (!data) return null;

    // Returnera hela raden för vidare användning
    return data as ProductImageRow;
  } catch (error) {
    console.error("Fel vid hämtning från product_images:", error);
    return null;
  }
};

export const useProducts = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [quote, setQuote] = useState<QuoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🔍 Hämta produkt + bilder
  const searchByArticleNumber = async (articleNumber: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("new-wave-proxy", {
        body: { articleNumber },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // 🖼️ Försök hämta bildinfo från databasen
      const imageRow = await fetchImagesFromDatabase(articleNumber);

      if (imageRow) {
        // Bygg alla vinklar
        const imageUrls = buildImageUrls(imageRow);

        // Skapa produktobjekt med bilddata, färg och folder
        setProduct({
          ...data,
          folder_id: imageRow.folder_id,
          colorCode: imageRow.color_code,
          slug_name: imageRow.slug_name,
          images: imageUrls,
          image_url: imageUrls[0], // Förhandsvisning
          variations: [
            {
              color: "Standard",
              colorCode: imageRow.color_code,
              folder_id: imageRow.folder_id,
              articleNumber: imageRow.article_number,
              slug_name: imageRow.slug_name,
              image_url: imageUrls[0],
            },
          ],
        });
      } else {
        // Fallback om ingen bild hittas
        setProduct(data);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ➕ Lägg till produkt i offert
  const addToQuote = (product: Product, quantity: number = 1, selectedViews?: string[]) => {
    const existingItem = quote.find((item) => item.product.id === product.id);
    if (existingItem) {
      setQuote(
        quote.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)),
      );
    } else {
      setQuote([...quote, { product, quantity, selectedViews }]);
    }
  };

  // ✏️ Uppdatera offertpost
  const updateQuoteItem = (productId: string, updates: Partial<QuoteItem>) => {
    setQuote(quote.map((item) => (item.product.id === productId ? { ...item, ...updates } : item)));
  };

  // ❌ Ta bort från offert
  const removeFromQuote = (productId: string) => {
    setQuote(quote.filter((item) => item.product.id !== productId));
  };

  // 🧹 Töm offert
  const clearQuote = () => setQuote([]);

  // 💰 Summeringar
  const getQuoteTotal = () =>
    quote.reduce((total, item) => {
      const price = item.product.price_ex_vat || 0;
      return total + price * item.quantity;
    }, 0);

  const getQuoteTotalWithVat = () => getQuoteTotal() * 1.25;

  return {
    product,
    quote,
    isLoading,
    searchByArticleNumber,
    addToQuote,
    updateQuoteItem,
    removeFromQuote,
    clearQuote,
    getQuoteTotal,
    getQuoteTotalWithVat,
  };
};
