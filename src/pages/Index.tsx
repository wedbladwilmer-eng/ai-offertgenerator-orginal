import { useState } from "react";
import ProductDisplay from "@/components/ProductDisplay";
import { QuoteList } from "@/components/QuoteList";
import MockupPreview from "@/components/MockupPreview";
import { useProducts } from "@/hooks/useProducts";

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
          <h1 className="text-4xl font-bold text-foreground mb-2">Offertgenerator</h1>
          <p className="text-xl text-muted-foreground">Skapa professionella offerter</p>
        </header>

        {/* ✅ Tvåkolumns-layout */}
        <div className="grid lg:grid-cols-2 gap-8 overflow-visible">
          {/* ✅ Vänster kolumn: Produktvisning */}
          <div className="space-y-6 overflow-visible relative">
            {product ? (
              <ProductDisplay product={product} onAddToQuote={addToQuote} />
            ) : (
              <p className="text-center text-gray-500">Ange ett artikelnummer för att visa produkt.</p>
            )}
          </div>

          {/* ✅ Höger kolumn: Offertlista och Preview */}
          <div className="space-y-6">
            <QuoteList
              quote={quote}
              onUpdateItem={updateQuoteItem}
              onRemoveItem={removeFromQuote}
              onClearQuote={clearQuote}
              total={getQuoteTotal()}
              totalWithVat={getQuoteTotalWithVat()}
            />

            <MockupPreview previewUrl={mockupPreviewUrl} mockupUrl={mockupUrl} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
