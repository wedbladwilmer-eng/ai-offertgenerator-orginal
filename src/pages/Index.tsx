import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { ProductSearch } from "@/components/ProductSearch";
import { ProductDisplay } from "@/components/ProductDisplay";
import { QuoteList } from "@/components/QuoteList";
import MockupPreview from "@/components/MockupPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  const {
    product,
    quote,
    isLoading,
    searchByArticleNumber,
    addToQuote,
    updateQuoteItem,
    removeFromQuote,
    clearQuote,
    getQuoteTotal,
    getQuoteTotalWithVat
  } = useProducts();

  const handleCreateQuote = () => {
    if (quote.length > 0) {
      navigate("/quote");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container mx-auto max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Offertskapare
          </h1>
          <p className="text-muted-foreground">
            Sök produkter och skapa professionella offerter
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Product Search & Display */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Produktsökning</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductSearch 
                  onSearch={searchByArticleNumber}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            {product && (
              <ProductDisplay
                product={product}
                onAddToQuote={addToQuote}
              />
            )}

          </div>

          {/* Right Column - Quote & Preview */}
          <div className="space-y-6">
            <QuoteList
              quote={quote}
              onUpdateItem={updateQuoteItem}
              onRemoveItem={removeFromQuote}
              onClearQuote={clearQuote}
              total={getQuoteTotal()}
              totalWithVat={getQuoteTotalWithVat()}
            />

            {quote.length > 0 && (
              <div className="flex justify-center">
                <Button
                  onClick={handleCreateQuote}
                  size="lg"
                  className="w-full"
                >
                  Skapa offert
                </Button>
              </div>
            )}

            <MockupPreview />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;