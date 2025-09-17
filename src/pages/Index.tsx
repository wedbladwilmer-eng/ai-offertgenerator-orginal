import { ProductSearch } from '@/components/ProductSearch';
import { ProductDisplay } from '@/components/ProductDisplay';
import { QuoteList } from '@/components/QuoteList';
import { useProducts } from '@/hooks/useProducts';

const Index = () => {
  const {
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
  } = useProducts();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Produktsökning & Offertgenerator
          </h1>
          <p className="text-xl text-muted-foreground">
            Sök produkter med artikelnummer och skapa professionella offerter
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <ProductSearch 
              onSearch={searchByArticleNumber}
              isLoading={isLoading}
            />
            
            {product && (
              <ProductDisplay 
                product={product}
                onAddToQuote={addToQuote}
              />
            )}
          </div>

          <div>
            <QuoteList
              quote={quote}
              onUpdateItem={updateQuoteItem}
              onRemoveItem={removeFromQuote}
              onClearQuote={clearQuote}
              total={getQuoteTotal()}
              totalWithVat={getQuoteTotalWithVat()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
