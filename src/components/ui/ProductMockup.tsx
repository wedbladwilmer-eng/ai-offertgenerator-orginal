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
  price_ex_vat?: number;
  category?: string;
}

interface ProductMockupProps {
  product: Product;
}

const ProductMockup: React.FC<ProductMockupProps> = ({ product }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Function to get logo position (left chest from wearer's perspective)
  const getLogoPosition = (productWidth: number, productHeight: number) => {
    const logoWidth = productWidth * 0.12; // 12% of product width
    
    return {
      x: productWidth * 0.65, // 65% from left (wearer's left chest)
      y: productHeight * 0.25, // 25% from top
      width: logoWidth,
    };
  };

 
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

      // Get logo position (left chest from wearer's perspective)
      const logoPosition = getLogoPosition(productImg.width, productImg.height);
      const logoHeight = (logoImg.height / logoImg.width) * logoPosition.width;

      ctx.drawImage(logoImg, logoPosition.x, logoPosition.y, logoPosition.width, logoHeight);

      // Create preview URL for immediate display
      const previewDataUrl = canvas.toDataURL('image/png');
      setPreviewUrl(previewDataUrl);

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skapa Produktmockup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Produktinformation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Produktnamn:</span>
                <p className="text-muted-foreground">{product.name}</p>
              </div>
              <div>
                <span className="font-medium">Artikelnummer:</span>
                <p className="text-muted-foreground">{product.id}</p>
              </div>
              <div>
                <span className="font-medium">Pris (ex. moms):</span>
                <p className="text-muted-foreground">
                  {product.price_ex_vat ? `${product.price_ex_vat} kr` : 'Pris ej tillgängligt'}
                </p>
              </div>
              {product.category && (
                <div>
                  <span className="font-medium">Kategori:</span>
                  <p className="text-muted-foreground">{product.category}</p>
                </div>
              )}
            </div>
          </div>

          {/* Logo Upload */}
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
            <p className="text-xs text-muted-foreground mt-1">
              Logotypen placeras på vänster bröst (från bärarens perspektiv)
            </p>
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
        </CardContent>
      </Card>

      {/* Preview and Result */}
      {(previewUrl || mockupUrl) && (
        <Card>
          <CardHeader>
            <CardTitle>Mockup-förhandsgranskning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Image */}
              <div>
                <h4 className="font-medium mb-2">Originalprodukt</h4>
                <img
                  src={product.image_url || '/placeholder.svg'}
                  alt={product.name}
                  className="max-w-full h-auto rounded border bg-white"
                />
              </div>
              
              {/* Mockup Preview */}
              <div>
                <h4 className="font-medium mb-2">Med logotyp</h4>
                <img
                  src={previewUrl || mockupUrl}
                  alt="Produktmockup med logotyp"
                  className="max-w-full h-auto rounded border bg-white"
                />
                {mockupUrl && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Mockupen har sparats i Supabase Storage
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductMockup;const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not available');

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas context not available');

    // 🖼 Ladda produktbild
    const productImg = new Image();
    productImg.crossOrigin = 'anonymous';
    await new Promise((res, rej) => {
      productImg.onload = res;
      productImg.onerror = rej;
      productImg.src = product.image_url || '/placeholder.svg';
    });

    canvas.width = productImg.width;
    canvas.height = productImg.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(productImg, 0, 0);

    // 🖍 Ladda loggan
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    const logoUrl = URL.createObjectURL(file);
    await new Promise((res, rej) => {
      logoImg.onload = res;
      logoImg.onerror = rej;
      logoImg.src = logoUrl;
    });

    // 🧼 Ta bort vit bakgrund (om det finns)
    const tmp = document.createElement('canvas');
    tmp.width = logoImg.width;
    tmp.height = logoImg.height;
    const tctx = tmp.getContext('2d', { willReadFrequently: true })!;
    tctx.drawImage(logoImg, 0, 0);
    const imgData = tctx.getImageData(0, 0, tmp.width, tmp.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > 240 && d[i+1] > 240 && d[i+2] > 240) d[i+3] = 0; // vit → transparent
    }
    tctx.putImageData(imgData, 0, 0);

    const cleanLogo = new Image();
    cleanLogo.src = tmp.toDataURL();
    await new Promise((res) => (cleanLogo.onload = res));

    // 📍 Placera på bärarens vänstra bröst (bildens högra sida)
    const logoW = productImg.width * 0.12;
    const logoH = (cleanLogo.height / cleanLogo.width) * logoW;
    const posX = productImg.width * 0.65; // 65% från vänster = bildens högra sida
    const posY = productImg.height * 0.25;

    ctx.drawImage(cleanLogo, posX, posY, logoW, logoH);

    // ⚡ Visa preview direkt
    const previewDataUrl = canvas.toDataURL('image/png');
    setPreviewUrl(previewDataUrl);

    // 💾 Ladda upp till Supabase
    canvas.toBlob(async (blob) => {
      if (!blob) throw new Error('Failed to create mockup image');

      const fileName = `${product.id}-mockup.png`;
      const { error: uploadError } = await supabase.storage
        .from('Mockups')
        .upload(fileName, blob, { upsert: true, contentType: 'image/png' });

      if (uploadError) throw uploadError;

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
