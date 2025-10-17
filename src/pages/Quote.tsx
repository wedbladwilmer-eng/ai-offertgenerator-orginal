import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { generatePDF } from "@/utils/pdfGenerator";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/kosta-nada-profil-logo.png";
import { useToast } from "@/hooks/use-toast";
import { generateAngleImages, getViewLabelInSwedish } from "@/lib/generateAngleImages";

interface Product {
  id: string;
  name: string;
  price_ex_vat: number;
  category?: string;
  colorCode?: string;
  folder_id?: string;
  image_url?: string;
  slug_name?: string;
  pictures?: Record<string, string>;
  variations?: Array<{
    color: string;
    image_url: string;
    colorCode?: string;
    folder_id?: string;
    articleNumber?: string;
  }>;
}

const AngleImage: React.FC<{ url: string; label: string }> = ({ url, label }) => {
  const [hasError, setHasError] = useState(false);
  return (
    <div className="relative bg-gray-50 border rounded-lg overflow-hidden aspect-square">
      {!hasError ? (
        <img
          src={url}
          alt={label}
          onError={() => setHasError(true)}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">Ingen bild</div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
        {getViewLabelInSwedish(label)}
      </div>
    </div>
  );
};

const Quote: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // 🧩 Data direkt från ProductDisplay
  const productData = location.state?.product;
  const selectedColorCode = location.state?.selectedColorCode;
  const selectedFolderId = location.state?.selectedFolderId;
  const selectedViews = location.state?.selectedViews || ["Front"];
  const currentImage = location.state?.currentImage;
  const currentVariation = location.state?.currentVariation;

  const [customerName, setCustomerName] = useState("");
  const [margin, setMargin] = useState("1.5");
  const [quantity, setQuantity] = useState(1);

  if (!productData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">Ingen produkt vald</p>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Tillbaka till startsidan
        </Button>
      </div>
    );
  }

  // 🧠 Bildlogik
  const angleImages = useMemo(() => {
    const folderId = selectedFolderId || productData.folder_id || "";
    const articleNumber = productData.id || "";
    const colorCode = selectedColorCode || productData.colorCode || "";
    const slug =
      productData.slug_name ||
      (productData.name || "").replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");

    const all = generateAngleImages(folderId, articleNumber, colorCode, slug, selectedViews);
    // ❌ Filtrera bort front för att undvika dubblett
    return all.filter((a) => a.label !== "Front");
  }, [productData, selectedFolderId, selectedColorCode, selectedViews]);

  // 🖼️ Huvudbild (Front)
  const mainImage =
    currentImage ||
    productData.image_url ||
    generateAngleImages(
      selectedFolderId || productData.folder_id || "",
      productData.id,
      selectedColorCode || productData.colorCode || "",
      productData.slug_name || (productData.name || "").replace(/\s+/g, "")
    ).find((img) => img.label === "Front")?.short ||
    "";

  // 🧾 Pris
  const marginValue = parseFloat(margin);
  const pricePerUnit = productData.price_ex_vat * marginValue;
  const total = pricePerUnit * quantity;
  const totalWithVat = total * 1.25;

  // 📄 Generera PDF
  const handleGeneratePDF = async () => {
    if (!customerName.trim()) {
      toast({ title: "Fel", description: "Ange kundnamn", variant: "destructive" });
      return;
    }
    try {
      await generatePDF({
        companyName: "Kosta Nada Profil AB",
        customerName: customerName.trim(),
        quote: [
          {
            product: productData,
            quantity,
            mockup_url: mainImage,
            selectedViews,
          },
        ],
        total,
        totalWithVat,
        selectedViews,
      });
      toast({ title: "PDF skapad!", description: "Offerten laddas ner automatiskt." });
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast({ title: "Fel vid PDF-generering", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Tillbaka
          </Button>
          <img src={logo} alt="Kosta Nada" className="h-12" />
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">Offert</h1>

        {/* Kundinformation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Kundinformation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="customerName">Kundnamn</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Företagsnamn AB"
              />
            </div>
            <div>
              <Label htmlFor="margin">Marginal</Label>
              <Select value={margin} onValueChange={setMargin}>
                <SelectTrigger id="margin">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.5">1:1.5</SelectItem>
                  <SelectItem value="2">1:2</SelectItem>
                  <SelectItem value="2.5">1:2.5</SelectItem>
                  <SelectItem value="3">1:3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Produktinformation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Produktinformation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Bilder */}
              <div>
                {/* Front-bild */}
                <div className="bg-white border rounded-lg p-4 mb-4 flex justify-center">
                  {mainImage ? (
                    <img src={mainImage} alt={productData.name} className="max-h-[400px] w-auto object-contain rounded" />
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-400">Ingen bild</div>
                  )}
                </div>

                {/* Vinklar (exkl. front) */}
                {angleImages.length > 0 && (
                  <>
                    <p className="text-sm text-gray-600 mb-2">
                      Visar valda vinklar: {angleImages.map((a) => a.label).join(", ")}
                    </p>
                    <div
                      className={`grid gap-2 ${
                        angleImages.length === 1
                          ? "grid-cols-1"
                          : angleImages.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-3"
                      }`}
                    >
                      {angleImages.map((img) => (
                        <AngleImage key={img.label} url={img.url} label={img.label} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Detaljer */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{productData.name}</h2>
                  <p className="text-sm text-gray-600">Artikelnummer: {productData.id}</p>
                  {productData.category && (
                    <p className="text-sm text-gray-600">Kategori: {productData.category}</p>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-gray-600">Grundpris (exkl. moms)</p>
                  <p className="text-xl font-semibold">{productData.price_ex_vat} kr</p>
                </div>

                <div>
                  <Label htmlFor="quantity">Antal</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prisinfo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Prissättning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Pris/st (inkl. marginal):</span>
              <span className="font-semibold">{pricePerUnit.toFixed(2)} kr</span>
            </div>
            <div className="flex justify-between">
              <span>Antal:</span>
              <span className="font-semibold">{quantity}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span>Total (inkl. moms):</span>
              <span className="font-bold text-primary">{totalWithVat.toFixed(2)} kr</span>
            </div>
          </CardContent>
        </Card>

        {/* Skapa PDF */}
        <div className="flex justify-center">
          <Button
            onClick={handleGeneratePDF}
            disabled={!customerName.trim()}
            size="lg"
            className="px-8 bg-blue-600 hover:bg-blue-700"
          >
            Ladda ner som PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Quote;