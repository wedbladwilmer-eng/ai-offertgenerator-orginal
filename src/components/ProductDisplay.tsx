import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Product } from "@/hooks/useProducts";

interface ProductDisplayProps {
  product: Product;
  onAddToQuote: (product: Product, quantity: number) => void;
}

const ProductDisplay = ({ product, onAddToQuote }: ProductDisplayProps) => {
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleAddToQuote = () => {
    if (quantity > 0) {
      onAddToQuote(product, quantity);
      setQuantity(1);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Pris på förfrågan";
    return `${price.toLocaleString("sv-SE")} kr`;
  };

  // Handle image loading
  const handleImageLoad = () => {
    console.log("✅ Image loaded successfully:", product.image_url);
    setImageLoading(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.warn("❌ Image failed to load:", product.image_url);
    setImageError(true);
    setImageLoading(false);

    // Try to set a placeholder image
    const target = e.target as HTMLImageElement;
    target.src = "/placeholder.svg";
  };

  console.log("🖼️ Rendering product image_url:", product.image_url);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produktinformation</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* 📸 Bild */}
          <div className="flex justify-center items-center bg-gray-50 rounded-lg border h-64 relative">
            {product.image_url && !imageError ? (
              <>
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                )}
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="max-h-60 object-contain"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{ display: imageLoading ? "none" : "block" }}
                />
              </>
            ) : (
              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground">Ingen bild tillgänglig</p>
                {imageError && (
                  <p className="text-xs text-red-500 mt-1">Kunde inte ladda bild från: {product.image_url}</p>
                )}
              </div>
            )}
          </div>

          {/* 📦 Produktinfo */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{product.name}</h3>
              <p className="text-muted-foreground">Artikelnummer: {product.id}</p>
              {product.brand && <p className="text-sm text-muted-foreground">Märke: {product.brand}</p>}
            </div>

            {product.description && (
              <div>
                <Label>Beskrivning</Label>
                <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
              </div>
            )}

            <div>
              <Label>Pris (inkl. moms)</Label>
              <p className="text-lg font-semibold">{formatPrice(product.price_ex_vat)}</p>
            </div>

            {product.category && (
              <div>
                <Label>Kategori</Label>
                <p className="text-sm text-muted-foreground">{product.category}</p>
              </div>
            )}

            {product.variations && product.variations.length > 0 && (
              <div>
                <Label>Tillgängliga färger</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {product.variations.map((variation, index) => (
                    <span key={index} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                      {variation.color}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🧾 Offertknapp */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="quantity">Antal</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20"
              />
            </div>
            <Button onClick={handleAddToQuote} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Lägg till i offert
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductDisplay;
