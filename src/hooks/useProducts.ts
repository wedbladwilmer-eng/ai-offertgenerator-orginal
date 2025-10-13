import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

export function useProducts() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // 🔍 Hämtar produkt via artikel
