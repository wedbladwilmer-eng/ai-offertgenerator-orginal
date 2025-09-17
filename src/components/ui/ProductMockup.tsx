import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  image_url: string | null;
}

interface ProductMockupProps {
  product: Product;
}

const ProductMockup = ({ product }: ProductMockupProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Fel filtyp",
        description: "Välj en PNG-fil",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      await generateMockup(file);
      toast({
        title: "Framgång",
        description: "Mockup skapad och sparad",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel inträffade",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const generateMockup = async (logoFile: File) => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not available');
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // Set canvas size
    canvas.width = 400;
    canvas.height = 400;

    // Load and draw product image
    if (product.image_url) {
      const productImg = new Image();
      productImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        productImg.onload = resolve;
        productImg.onerror = reject;
        productImg.src = product.image_url!;
      });
      
      ctx.drawImage(productImg, 0, 0, 400, 400);
    } else {
      // Fallback background
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 400, 400);
    }

    // Load and draw logo on left chest position
    const logoImg = new Image();
    logoImg.src = URL.createObjectURL(logoFile);
    
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
    });

    // Position logo on left chest (viewer's right side)
    const logoSize = 60;
    const x = canvas.width * 0.65; // Right side from viewer's perspective
    const y = canvas.height * 0.35; // Upper chest area
    
    ctx.drawImage(logoImg, x, y, logoSize, logoSize);

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });

    // Upload mockup to Supabase Storage
    const mockupFileName = `${product.id}-mockup.png`;
    
    const { data: mockupData, error: mockupError } = await supabase.storage
      .from('Mockups')
      .upload(mockupFileName, blob, {
        upsert: true
      });

    if (mockupError) {
      console.error('Mockup upload error:', mockupError);
      throw mockupError;
    }

    // Get public URL
    const { data: mockupUrlData } = supabase.storage
      .from('Mockups')
      .getPublicUrl(mockupData.path);

    setMockupUrl(mockupUrlData.publicUrl);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Produktmockup</h3>
      
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Skapar mockup...' : 'Ladda upp logotyp'}
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {mockupUrl && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Färdig mockup:</p>
          <img 
            src={mockupUrl} 
            alt={`Mockup för ${product.name}`}
            className="w-full max-w-sm border rounded-lg shadow-sm"
          />
        </div>
      )}
    </div>
  );
};

export default ProductMockup;