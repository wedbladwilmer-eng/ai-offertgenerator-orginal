import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import QuoteGenerator from '@/components/QuoteGenerator';

interface MockupPreviewProps {
  product?: {
    id: string;
    name: string;
    image_url?: string;
    price_ex_vat?: number;
    category?: string;
  };
  previewUrl?: string | null;
  mockupUrl?: string | null;
}

const MockupPreview: React.FC<MockupPreviewProps> = ({ 
  product, 
  previewUrl, 
  mockupUrl 
}) => {
  const [showQuoteGenerator, setShowQuoteGenerator] = useState(false);

  if (!product) {
    return null;
  }

  // Show quote generator if we have a mockup or preview
  if ((previewUrl || mockupUrl) && showQuoteGenerator) {
    return (
      <QuoteGenerator 
        product={product} 
        mockupUrl={mockupUrl || previewUrl} 
      />
    );
  }

  // Show preview section
  if (previewUrl || mockupUrl) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Mockup-förhandsgranskning</CardTitle>
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
              </div>
              <div>
                <h4 className="font-medium mb-2">Med logotyp</h4>
                <img
                  src={previewUrl || mockupUrl}
                  alt="Produktmockup med logotyp"
                  className="max-w-full h-auto rounded border bg-white"
                />
              </div>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowQuoteGenerator(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md font-medium"
              >
                Skapa offert för denna produkt
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default MockupPreview;