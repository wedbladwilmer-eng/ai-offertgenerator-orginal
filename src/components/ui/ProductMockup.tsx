import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  image_url?: string;
}

interface ProductMockupProps {
  product: Product;
}

const ProductMockup: React.FC<ProductMockupProps> = ({ product }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png')) {
      toast({
        title: "Fel filformat",
        description: "Endast PNG-filer är tillåtna för loggor.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create canvas and load product image
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Load product image
      const productImg = new Image();
      productImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        productImg.onload = resolve;
        productImg.onerror = reject;
        productImg.src = product.image_url || '/placeholder.svg';
      });

      // Set canvas size to match product image
      canvas.width = productImg.width;
      canvas.height = productImg.height;

      // Draw product image
      ctx.drawImage(productImg, 0, 0);

      // Load and draw logo
      const logoImg = new Image();
      const logoUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
        logoImg.src = logoUrl;
      });

      // Position logo on left chest area (adjust as needed)
      const logoWidth = productImg.width * 0.15; // 15% of product width
      const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
      const logoX = productImg.width * 0.25; // 25% from left
      const logoY = productImg.height * 0.35; // 35% from top

      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Failed to create mockup image');

        // Upload to Supabase Storage
        const fileName = `${product.id}-mockup.png`;
        const { error: uploadError } = await supabase.storage
          .from('Mockups')
          .upload(fileName, blob, {
            upsert: true,
            contentType: 'image/png'
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('Mockups')
          .getPublicUrl(fileName);

        setMockupUrl(publicUrlData.publicUrl);
        
        toast({
          title: "Mockup skapad!",
          description: "Din produktmockup har sparats framgångsrikt.",
        });

        URL.revokeObjectURL(logoUrl);
      }, 'image/png');

    } catch (error) {
      console.error('Error creating mockup:', error);
      toast({
        title: "Fel vid skapande av mockup",
        description: "Något gick fel när mockupen skapades. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skapa Produktmockup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="logo-upload" className="block text-sm font-medium mb-2">
            Ladda upp logotyp (PNG)
          </label>
          <Input
            id="logo-upload"
            type="file"
            accept=".png"
            onChange={handleLogoUpload}
            disabled={isUploading}
          />
        </div>

        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />

        {isUploading && (
          <div className="text-center">
            <Button disabled>Skapar mockup...</Button>
          </div>
        )}

        {mockupUrl && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Din mockup:</h3>
            <img
              src={mockupUrl}
              alt="Produktmockup"
              className="max-w-full h-auto rounded border"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductMockup;