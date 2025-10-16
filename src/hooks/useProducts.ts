import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildImageUrls, ProductImageRow } from "@/lib/buildImageUrls";

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
  variations?: Array<{
    color: string;
    image_url: string;
    colorCode?: string;
    folder_id?: string;
  }>;
}

export interface QuoteItem {
  product: Product;
  quantity: number;
  logo_url?: string;
  mockup_url?: string;
  selectedViews?: string[];
}

// 🖼️ Hämta bilder från tabellen product_images
const fetchImagesFromDatabase = async (articleNumber: string): Promise<string[] | null> => {
  try {
    // ❗ Använd "as any" för att undvika Lovable's strikta generiska typer
    const { data, error } = (supabase as any)
      .from("product_images")
      .select("image_url, folder_id, article_number, color_code, slug_name")
      .eq("article_number", articleNumber)
      .maybeSingle();

    const result = await (data instanceof Promise ? data : Promise.resolve({ data, error }));

    if (result.error) {
      console.warn("Fel vid SELECT mot product_images:", result.error.message);
      return null;
    }

    const row = result.data as any;

    if (!row) return null;

    // Om image_url finns i tabellen → använd den
    if (row.image_url) return [row.image_url];

    // Annars bygg dynamiska URL:er
    if (row.folder_id && row.slug_name && row.color_code) {
      const castedRow = {
        folder_id: row.folder_id,
        article_number: row.article_number,
        color_code: row.color_code,
        slug_name: row.slug_name,
      } as ProductImageRow;

      return buildImageUrls(castedRow);
    }

    return null;
  } catch (error) {
    console.error("Fel vid hämtning från product_images:", error);
    return null;
  }
};

export const useProducts = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [quote, setQuote] = useState<QuoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchByArticleNumber = async (articleNumber: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("new-wave-proxy", {
        body: { articleNumber },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Try to fetch images from database
      const images = await fetchImagesFromDatabase(articleNumber);

      setProduct({
        ...data,
        images: images || undefined,
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  const addToQuote = (product: Product, quantity: number = 1, selectedViews?: string[]) => {
    const existingItem = quote.find((item) => item.product.id === product.id);
    if (existingItem) {
      setQuote(
        quote.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        )
      );
    } else {
      setQuote([...quote, { product, quantity, selectedViews }]);
    }
  };

  const updateQuoteItem = (productId: string, updates: Partial<QuoteItem>) => {
    setQuote(quote.map((item) => (item.product.id === productId ? { ...item, ...updates } : item)));
  };

  const removeFromQuote = (productId: string) => {
    setQuote(quote.filter((item) => item.product.id !== productId));
  };

  const clearQuote = () => {
    setQuote([]);
  };

  const getQuoteTotal = () => {
    return quote.reduce((total, item) => {
      const price = item.product.price_ex_vat || 0;
      return total + price * item.quantity;
    }, 0);
  };

  const getQuoteTotalWithVat = () => {
    return getQuoteTotal() * 1.25;
  };

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
