import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { buildImageUrls, type ProductImageRow } from "@/lib/buildImageUrls";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_ex_vat: number | null;
  image_url: string | null;
  category: string | null;
  logo_position: string | null;
  brand?: string;
  slug?: string;
  folder_id?: string;
  colorCode?: string;
  variations?: Array<{
    color: string;
    colorCode?: string;
    articleNumber?: string;
    image_url?: string;
  }>;
  images?: string[]; // nya genererade bilder
};

export type QuoteItem = {
  product: Product;
  quantity: number;
  logo_url?: string;
  mockup_url?: string;
};

export const useProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [quote, setQuote] = useState<QuoteItem[]>([]);
  const { toast } = useToast();

  // 🧩 Hämta produktdata från nya Edge Function "new-wave-proxy"
  const fetchProductData = async (articleNumber: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("new-wave-proxy", {
        body: { articleNumber },
      });

      if (error) throw new Error(error.message || "Failed to fetch product data");
      if (!data) throw new Error("No data returned from new-wave-proxy");

      console.log("✅ Product fetched from Edge Function:", data);
      return data as Product;
    } catch (error) {
      console.error("Error fetching from new-wave-proxy:", error);
      throw error;
    }
  };

  // 🖼️ Hämta bilder från tabellen product_images
  const fetchImagesFromDatabase = async (articleNumber: string): Promise<string[] | null> => {
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

      // Om image_url finns i tabellen → använd den
      if (data.image_url) return [data.image_url];

      // Annars bygg dynamiska URL:er
      if (data.folder_id && data.slug_name && data.color_code) {
        return buildImageUrls(data as ProductImageRow);
      }

      return null;
    } catch (error) {
      console.error("Fel vid hämtning från product_images:", error);
      return null;
    }
  };

  // 🔍 Sök produkt via artikelnummer
  const searchByArticleNumber = async (articleNumber: string) => {
    if (!articleNumber.trim()) {
      toast({
        title: "Fel",
        description: "Ange ett artikelnummer",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const productData = await fetchProductData(articleNumber.trim());

      if (!productData) {
        toast({
          title: "Produkt ej hittad",
          description: `Ingen produkt med artikelnummer ${articleNumber} hittades`,
          variant: "destructive",
        });
        setProduct(null);
        return;
      }

      // 🧠 Hämta bilder om saknas
      let images: string[] | null = null;
      if (!productData.image_url) {
        images = await fetchImagesFromDatabase(articleNumber.trim());
      }

      productData.images = images?.length ? images : productData.image_url ? [productData.image_url] : [];

      setProduct(productData);

      toast({
        title: "Produkt hittad",
        description: `${productData.name} laddades framgångsrikt`,
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Fel",
        description: "Det gick inte att hämta produkten från New Wave",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ➕ Lägg till produkt i offert
  const addToQuote = (product: Product, quantity: number) => {
    const existingItem = quote.find((item) => item.product.id === product.id);

    if (existingItem) {
      setQuote(
        quote.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)),
      );
    } else {
      setQuote([...quote, { product, quantity }]);
    }

    toast({
      title: "Tillagd i offert",
      description: `${quantity} st ${product.name} tillagd`,
    });
  };

  // ✏️ Uppdatera offertpost
  const updateQuoteItem = (productId: string, updates: Partial<QuoteItem>) => {
    setQuote(quote.map((item) => (item.product.id === productId ? { ...item, ...updates } : item)));
  };

  // ❌ Ta bort från offert
  const removeFromQuote = (productId: string) => {
    setQuote(quote.filter((item) => item.product.id !== productId));
    toast({
      title: "Borttagen",
      description: "Produkten togs bort från offerten",
    });
  };

  // 🧹 Töm hela offerten
  const clearQuote = () => {
    setQuote([]);
  };

  // 💰 Beräkna totalsumma exkl. moms
  const getQuoteTotal = () => {
    return quote.reduce((total, item) => {
      const price = item.product.price_ex_vat || 0;
      return total + price * item.quantity;
    }, 0);
  };

  // 💰 Beräkna totalsumma inkl. moms
  const getQuoteTotalWithVat = () => {
    return getQuoteTotal() * 1.25; // 25% moms
  };

  return {
    isLoading,
    product,
    quote,
    searchByArticleNumber,
    addToQuote,
    updateQuoteItem,
    removeFromQuote,
    clearQuote,
    getQuoteTotal,
    getQuoteTotalWithVat,
  };
};
