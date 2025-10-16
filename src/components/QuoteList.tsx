import { useState } from "react";
import { Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { QuoteItem } from "@/hooks/useProducts";
import { LogoUpload } from "./LogoUpload";
import { generatePDF } from "@/utils/pdfGenerator";
import { ProductImageView } from "@/components/ProductImageView";

interface QuoteListProps {
  quote: QuoteItem[];
  onUpdateItem: (productId: string, updates: Partial<QuoteItem>) => void;
  onRemoveItem: (productId: string) => void;
  onClearQuote: () => void;
  total: number;
  totalWithVat: number;
}

export const QuoteList = ({ quote, onUpdateItem, onRemoveItem, onClearQuote, total, totalWithVat }: QuoteListProps) => {
  const [companyName, setCompanyName] = useState("");
  const [customerName, setCustomerName] = useState("");

  // 🔹 Hantering av bildvinklar per produkt
  const defaultViews = ["Front", "Right", "Back", "Left"];
  const [selectedViews, setSelectedViews] = useState<Record<string, string[]>>(
    Object.fromEntries(quote.map((item) => [item.product.id, item.selectedViews || [...defaultViews]])),
  );

  const handleToggleView = (productId: string, view: string) => {
    setSelectedViews((prev) => {
      const current = prev[productId] || [];
      const updated = current.includes(view) ? current.filter((v) => v !== view) : [...current, view];
      return { ...prev, [productId]: updated };
    });
  };

  const handleGeneratePDF = async () => {
    if (!companyName.trim() || !customerName.trim()) {
      alert("Fyll i företagsnamn och kundnamn innan du genererar PDF:en");
      return;
    }

    try {
      // Lägg till valda vinklar i offerten innan PDF
      const updatedQuote = quote.map((item) => ({
        ...item,
        selectedViews: selectedViews[item.product.id] || defaultViews,
      }));

      await generatePDF({
        quote: updatedQuote,
        companyName,
        customerName,
        total,
        totalWithVat,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Ett fel inträffade vid PDF-generering");
    }
  };

  if (quote.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Offert</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Inga produkter i offerten än.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Offert ({quote.length} produkter)</CardTitle>
        <Button variant="outline" size="sm" onClick={onClearQuote}>
          Rensa alla
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {quote.map((item) => (
          <div key={item.product.id} className="border rounded-lg p-4 space-y-6">
            {/* Produktinformation */}
            <div className="flex justify-between items-start">
              <div className="flex gap-4 flex-1">
                {(item.mockup_url || item.product.image_url) && (
                  <div className="flex-shrink-0">
                    <img
                      src={item.mockup_url || item.product.image_url}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold">{item.product.name}</h4>
                  <p className="text-sm text-muted-foreground">Art.nr: {item.product.id}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Label htmlFor={`qty-${item.product.id}`}>Antal:</Label>
                    <Input
                      id={`qty-${item.product.id}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        onUpdateItem(item.product.id, {
                          quantity: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-20"
                    />
                    <span className="text-sm">
                      {item.product.price_ex_vat
                        ? `${(item.product.price_ex_vat * item.quantity).toLocaleString("sv-SE")} kr`
                        : "Pris på förfrågan"}
                    </span>
                  </div>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={() => onRemoveItem(item.product.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* 🖼️ Välj vinklar till offerten */}
            {item.product.image_url && (
              <div>
                <h5 className="font-semibold mb-2">🖼️ Välj vinklar till offerten</h5>
                <div className="grid grid-cols-2 gap-4">
                  {["Front", "Right", "Back", "Left"].map((view) => (
                    <div
                      key={view}
                      onClick={() => handleToggleView(item.product.id, view)}
                      className="cursor-pointer"
                    >
                      <ProductImageView
                        view={view}
                        baseImageUrl={item.product.image_url || ""}
                        selected={selectedViews[item.product.id]?.includes(view)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🧢 Logouppladdning */}
            <LogoUpload
              productId={item.product.id}
              productImage={item.product.image_url}
              logoPosition={item.product.logo_position ? JSON.stringify(item.product.logo_position) : undefined}
              onLogoUploaded={(logoUrl, mockupUrl) =>
                onUpdateItem(item.product.id, {
                  logo_url: logoUrl,
                  mockup_url: mockupUrl,
                })
              }
            />
          </div>
        ))}

        <Separator />

        {/* Sammanställning & kundinfo */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Totalt (exkl. moms):</span>
            <span className="font-semibold">{total.toLocaleString("sv-SE")} kr</span>
          </div>
          <div className="flex justify-between">
            <span>Moms (25%):</span>
            <span className="font-semibold">{(totalWithVat - total).toLocaleString("sv-SE")} kr</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Totalt (inkl. moms):</span>
            <span className="font-bold">{totalWithVat.toLocaleString("sv-SE")} kr</span>
          </div>
        </div>

        <Separator />

        {/* Kunduppgifter & PDF */}
        <div className="space-y-4">
          <h4 className="font-semibold">Kunduppgifter för PDF</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Företagsnamn</Label>
              <Input
                id="company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ange företagsnamn"
              />
            </div>
            <div>
              <Label htmlFor="customer">Kundnamn</Label>
              <Input
                id="customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ange kundnamn"
              />
            </div>
          </div>

          <Button onClick={handleGeneratePDF} className="w-full" disabled={!companyName.trim() || !customerName.trim()}>
            <FileText className="h-4 w-4 mr-2" />
            Generera PDF-offert
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
