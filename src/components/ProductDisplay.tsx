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

  // Debug logging
  console.log("🧪 Produkt i UI:", product);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produktinformation</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Produktbild */}
          <div>
            {product.image_url ? (
              <img
                src={imageError ? "/placeholder.svg" : product.image_url}
                alt={product.name || "Produktbild"}
                className="w-full h-64 object-contain rounded-lg border bg-white"
                onError={() => {
                  console.error("🚨 Bilden kunde inte laddas:", product.image_url);
                  setImageError(true);
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Ingen bild tillgänglig
              </p>
            )}
          </div>

          {/* 📦 Produktinfo */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{product.name}</h3>
              <p className="text-muted-foreground">Artikelnummer: {product.id}</p>
              {product.brand && (
                <p className="text-sm text-muted-foreground">
                  Märke: {product.brand}
                </p>
              )}
            </div>

            {product.description && (
              <div>
                <Label>Beskrivning</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {product.description}
                </p>
              </div>
            )}

            <div>
              <Label>Pris (exkl. moms)</Label>
              <p className="text-lg font-semibold">
                {formatPrice(product.price_ex_vat)}
              </p>
            </div>

            {product.category && (
              <div>
                <Label>Kategori</Label>
                <p className="text-sm text-muted-foreground">
                  {product.category}
                </p>
              </div>
            )}

            {product.variations && product.variations.length > 0 && (
              <div>
                <Label>Tillgängliga färger</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {product.variations.map((variation, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                    >
                      {variation.color}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ➕ Lägg till i offert */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="quantity">Antal</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
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
