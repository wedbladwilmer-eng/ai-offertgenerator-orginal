import { useState, useRef } from 'react';
import { Upload, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LogoUploadProps {
  productId: string;
  productImage: string | null;
  logoPosition: string | null;
  onLogoUploaded: (logoUrl: string, mockupUrl: string) => void;
}

export const LogoUpload = ({ 
  productId, 
  productImage, 
  logoPosition,
  onLogoUploaded 
}: LogoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Fel filtyp",
        description: "Välj en bildfil (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Filen är för stor",
        description: "Välj en fil som är mindre än 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Upload logo to Supabase Storage
      const logoFileName = `logo_${productId}_${Date.now()}.${file.name.split('.').pop()}`;
      
      const { data: logoData, error: logoError } = await supabase.storage
        .from('Logos')
        .upload(logoFileName, file);

      if (logoError) {
        console.error('Logo upload error:', logoError);
        toast({
          title: "Upload misslyckades",
          description: "Det gick inte att ladda upp logotypen",
          variant: "destructive",
        });
        return;
      }

      // Get logo URL
      const { data: logoUrlData } = supabase.storage
        .from('Logos')
        .getPublicUrl(logoData.path);

      const uploadedLogoUrl = logoUrlData.publicUrl;
      setLogoUrl(uploadedLogoUrl);

      // Generate mockup
      const mockupUrl = await generateMockup(productImage, uploadedLogoUrl, logoPosition);
      setMockupUrl(mockupUrl);

      onLogoUploaded(uploadedLogoUrl, mockupUrl);

      toast({
        title: "Framgång",
        description: "Logotyp uppladdad och mockup genererad",
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

  const generateMockup = async (
    productImageUrl: string | null, 
    logoUrl: string, 
    position: string | null
  ): Promise<string> => {
    // Simple mockup generation - in a real app, this would be more sophisticated
    // For now, we'll just save a reference and return the logo URL as mockup
    // You could implement actual image composition here using canvas or server-side processing
    
    try {
      const mockupFileName = `mockup_${productId}_${Date.now()}.png`;
      
      // Create a simple mockup by combining the images
      // This is a simplified version - you might want to use canvas manipulation
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Canvas not supported');
      
      canvas.width = 400;
      canvas.height = 400;
      
      // Load product image if available
      if (productImageUrl) {
        const productImg = new Image();
        productImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          productImg.onload = resolve;
          productImg.onerror = reject;
          productImg.src = productImageUrl;
        });
        
        ctx.drawImage(productImg, 0, 0, 400, 400);
      } else {
        // Fallback background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 400, 400);
      }
      
      // Load and draw logo
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
        logoImg.src = logoUrl;
      });
      
      // Position logo based on position parameter
      let x = 50, y = 50;
      const logoSize = 80;
      
      switch (position?.toLowerCase()) {
        case 'top-right':
          x = canvas.width - logoSize - 20;
          y = 20;
          break;
        case 'bottom-left':
          x = 20;
          y = canvas.height - logoSize - 20;
          break;
        case 'bottom-right':
          x = canvas.width - logoSize - 20;
          y = canvas.height - logoSize - 20;
          break;
        case 'center':
          x = (canvas.width - logoSize) / 2;
          y = (canvas.height - logoSize) / 2;
          break;
        default: // top-left
          x = 20;
          y = 20;
      }
      
      ctx.drawImage(logoImg, x, y, logoSize, logoSize);
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });
      
      // Upload mockup to Supabase Storage
      const { data: mockupData, error: mockupError } = await supabase.storage
        .from('Mockups')
        .upload(mockupFileName, blob);

      if (mockupError) {
        console.error('Mockup upload error:', mockupError);
        throw mockupError;
      }

      const { data: mockupUrlData } = supabase.storage
        .from('Mockups')
        .getPublicUrl(mockupData.path);

      return mockupUrlData.publicUrl;
      
    } catch (error) {
      console.error('Mockup generation error:', error);
      // Fallback to logo URL if mockup generation fails
      return logoUrl;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Logotyp</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Laddar upp...' : 'Ladda upp logotyp'}
          </Button>
          
          {mockupUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(mockupUrl, '_blank')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Visa mockup
            </Button>
          )}
        </div>
        
        {logoUrl && (
          <div className="mt-2">
            <img 
              src={logoUrl} 
              alt="Uppladdad logotyp" 
              className="h-16 w-16 object-contain border rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
};