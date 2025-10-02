import { useState } from 'react';
import ProductDisplay from '@/components/ProductDisplay';
import { QuoteList } from '@/components/QuoteList';
import ProductMockup from '@/components/ui/ProductMockup';
import MockupPreview from '@/components/MockupPreview';
import { useProducts } from '@/hooks/useProducts';

const Index = () => {
  const [mockupPreviewUrl, setMockupPreviewUrl] = useState<string | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);

  const {
    isLoading,
    product,
    quote,
    addToQuote,
    updateQuoteItem,
    removeFromQuote,
    clearQuote,
    getQuoteTotal,
    getQuoteTotalWithVat,
  } = useProducts();

  const handlePreviewUpdate = (previewUrl: string | null, finalMockupUrl: string | null) => {
    setMockupPreviewUrl(previewUrl);
    setMockupUrl(finalMockupUrl);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        {/* ✅ Header */}
        <header className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Offertgenerator
          </h1>
          <p className="text-xl text-muted-foreground">
            Skapa professionella offerter
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* ✅ Vänstra kolumnen: Mockup */}
          <div className="space-y-6">
            {product && (
              <>
                <ProductDisplay 
                  product={product}
                  onAddToQuote={addToQuote}
                />

                <ProductMockup 
                  product={{
                    id: product.id,
                    name: product.name,
                    image_url: product.image_url,
                    price_ex_vat: product.price_ex_vat,
                    category: product.category
                  }}
                  onPreviewUpdate={handlePreviewUpdate}
                />
              </>
            )}
          </div>

          {/* ✅ Högra kolumnen: Offertlista + Mockup Preview */}
          <div className="space-y-6">
            <QuoteList
              quote={quote}
              onUpdateItem={updateQuoteItem}
              onRemoveItem={removeFromQuote}
              onClearQuote={clearQuote}
              total={getQuoteTotal()}
              totalWithVat={getQuoteTotalWithVat()}
            />

            <MockupPreview
              previewUrl={mockupPreviewUrl}
              mockupUrl={mockupUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

