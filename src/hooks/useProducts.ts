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
  variations?: Array<{ color: string }>;
};

// ✅ Funktion för att hämta produktdata från din Supabase Edge Function
export async function fetchProduct(articleNumber: string): Promise<Product | null> {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/new-wave-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ articleNumber }),
    });

    if (!response.ok) {
      console.error("Failed to fetch product:", await response.text());
      return null;
    }

    const data = await response.json();
    console.log("✅ Product fetched:", data);
    return data as Product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

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

  // Function to fetch product data via Supabase Edge Function
  const fetchProductData = async (articleNumber: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("new-wave-proxy", {
        body: { articleNumber },
      });

      if (error) {
        throw new Error(error.message || "Failed to fetch product data");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as Product;
    } catch (error) {
      console.error("Error fetching from New Wave API:", error);
      throw error;
    }
  };

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

  const updateQuoteItem = (productId: string, updates: Partial<QuoteItem>) => {
    setQuote(quote.map((item) => (item.product.id === productId ? { ...item, ...updates } : item)));
  };

  const removeFromQuote = (productId: string) => {
    setQuote(quote.filter((item) => item.product.id !== productId));
    toast({
      title: "Borttagen",
      description: "Produkten togs bort från offerten",
    });
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
    return getQuoteTotal() * 1.25; // 25% VAT
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
