import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  if (!product) {
    return null;
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
              <Button
                onClick={() => navigate(`/quote?productId=${product.id}&mockup=${encodeURIComponent(previewUrl || mockupUrl || '')}`)}
                size="lg"
                className="gap-2"
              >
                Skapa offert för denna produkt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default MockupPreview;