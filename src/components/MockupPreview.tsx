import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MockupPreviewProps {
  product?: {
    name: string;
    image_url?: string;
  };
  previewUrl?: string | null;
  mockupUrl?: string | null;
}

const MockupPreview: React.FC<MockupPreviewProps> = ({ 
  product, 
  previewUrl, 
  mockupUrl 
}) => {
  if (!product || (!previewUrl && !mockupUrl)) {
    return null;
  }

  return (
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
      </CardContent>
    </Card>
  );
};

export default MockupPreview;