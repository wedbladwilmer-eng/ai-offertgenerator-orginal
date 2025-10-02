import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

interface ProductData {
  id: string;
  name: string;
  image_url?: string;
  price_ex_vat?: number;
  category?: string;
  description?: string;
}

interface MockupPreviewProps {
  previewUrl?: string | null;
  mockupUrl?: string | null;
}

const MockupPreview: React.FC<MockupPreviewProps> = ({ previewUrl, mockupUrl }) => {
  const navigate = useNavigate();
  const [articleNumber, setArticleNumber] = useState('');
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);
  const articleSchema = z.string().trim().regex(/^\d+$/, { message: 'Endast siffror' }).min(6, { message: 'Minst 6 siffror' });

  // Use the same product fetching logic as useProducts hook
  const fetchProductData = async (article: string) => {
    const localId = ++requestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const parsed = articleSchema.safeParse(article);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Ogiltigt artikelnummer');
      }

      const { data, error } = await supabase.functions.invoke('new-wave-proxy', {
        body: { articleNumber: article.trim() }
      });

      if (localId !== requestIdRef.current) return;

      if (error) {
        throw new Error(error.message || 'Kunde inte hämta produktdata');
      }

      if (data?.error) {
        const details = data?.details ? ` – ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}` : '';
        throw new Error(`${data.error}${details}`);
      }

      // Transform to local ProductData format
      setProduct({
        id: data.id,
        name: data.name,
        image_url: data.image_url || '/placeholder.svg',
        price_ex_vat: data.price_ex_vat || 0,
        category: data.category || '',
        description: data.description || `${data.brand} – ${data.name}`,
      });
    } catch (err: any) {
      console.error(err);
      if (localId !== requestIdRef.current) return;
      setError(err.message || 'Något gick fel vid hämtning av produktdata');
      setProduct(null);
    } finally {
      if (localId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!articleNumber) return;
    const parsed = articleSchema.safeParse(articleNumber);
    if (!parsed.success) return;
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      fetchProductData(articleNumber);
    }, 500);
    return () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    };
  }, [articleNumber]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Hämta produkt med artikelnummer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            inputMode="numeric"
            pattern="\\d*"
            placeholder="Ange artikelnummer (minst 6 siffror, t.ex. 354418)"
            value={articleNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setArticleNumber(value);
              setError('');
            }}
          />
          <Button
            onClick={() => fetchProductData(articleNumber)}
            disabled={loading || !articleSchema.safeParse(articleNumber).success}
          >
            {loading ? 'Hämtar...' : 'Hämta produkt'}
          </Button>
          {loading && <p className="text-sm text-muted-foreground">Hämtar produktdata...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {product && (
        <Card>
          <CardHeader>
            <CardTitle>Produktinformation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Originalprodukt</h4>
                <img
                  src={product.image_url || '/placeholder.svg'}
                  alt={product.name}
                  className="max-w-full h-auto rounded border bg-white"
                />
                <div className="mt-3">
                  <p className="text-lg font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                  <p className="mt-2 text-md font-bold">{product.price_ex_vat} kr</p>
                </div>
              </div>
              {previewUrl || mockupUrl ? (
                <div>
                  <h4 className="font-medium mb-2">Med logotyp</h4>
                  <img
                    src={previewUrl || mockupUrl}
                    alt="Produktmockup med logotyp"
                    className="max-w-full h-auto rounded border bg-white"
                  />
                </div>
              ) : null}
            </div>
            <div className="mt-6 text-center">
              <Button
                onClick={() =>
                  navigate(
                    `/quote?productId=${product.id}&mockup=${encodeURIComponent(previewUrl || mockupUrl || '')}`
                  )
                }
                size="lg"
                className="gap-2"
              >
                Skapa offert för denna produkt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MockupPreview;
