import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_ex_vat: number | null;
  image_url: string | null;
  category: string | null;
  logo_position: string | null;
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
      // Use RPC or direct query to bypass strict typing
      const { data, error } = await (supabase as any)
        .from('products')
        .select('*')
        .eq('id', articleNumber.trim())
        .maybeSingle();

      if (error) {
        console.error('Error fetching product:', error);
        toast({
          title: "Fel",
          description: "Det gick inte att hämta produkten",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        toast({
          title: "Produkt ej hittad",
          description: `Ingen produkt med artikelnummer ${articleNumber} hittades`,
          variant: "destructive",
        });
        setProduct(null);
        return;
      }

      const productData = data as Product;
      setProduct(productData);
      toast({
        title: "Produkt hittad",
        description: `${productData.name} laddades framgångsrikt`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel inträffade",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToQuote = (product: Product, quantity: number) => {
    const existingItem = quote.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setQuote(quote.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setQuote([...quote, { product, quantity }]);
    }

    toast({
      title: "Tillagd i offert",
      description: `${quantity} st ${product.name} tillagd`,
    });
  };

  const updateQuoteItem = (productId: string, updates: Partial<QuoteItem>) => {
    setQuote(quote.map(item => 
      item.product.id === productId 
        ? { ...item, ...updates }
        : item
    ));
  };

  const removeFromQuote = (productId: string) => {
    setQuote(quote.filter(item => item.product.id !== productId));
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
      return total + (price * item.quantity);
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