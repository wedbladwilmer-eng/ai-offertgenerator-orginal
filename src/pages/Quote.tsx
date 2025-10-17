import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { generatePDF } from "@/utils/pdfGenerator";
import { ArrowLeft, Check } from "lucide-react";
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
  angle_images?: Record<string, string>;
}

const AngleImage: React.FC<{ url: string; label: string }> = ({ url, label }) => {
  const [src, setSrc] = useState(url);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative bg-gray-50 border rounded-lg overflow-hidden aspect-square">
      {!hasError ? (
        <img
          src={src}
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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [margin, setMargin] = useState("1.5");
  const [quantity, setQuantity] = useState(1);
  const [isColorConfirmed, setIsColorConfirmed] = useState(false);

  // Läs parametrar
  const productId = searchParams.get("productId");
  const colorCodeParam = searchParams.get("colorCode");
  const folderIdParam = searchParams.get("folderId");
  const slugParam = searchParams.get("slug");
  const viewsParam = searchParams.get("views");

  // Läs valda vinklar
  const selectedViews = viewsParam ? JSON.parse(decodeURIComponent(viewsParam)) : ["Front"];

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        // 🎨 Begär rätt färgvariant om colorCode finns
        const requestedArticle = colorCodeParam ? `${productId}-${colorCodeParam}` : productId;
        
        const { data, error } = await supabase.functions.invoke("new-wave-proxy", {
          body: { articleNumber: requestedArticle },
        });

        if (error) throw error;

        let productData: Product = data;

        // Tvinga in färg och mapp från URL
        if (colorCodeParam) productData.colorCode = colorCodeParam;
        if (folderIdParam) productData.folder_id = folderIdParam;
        if (slugParam) productData.slug_name = slugParam;

        setProduct(productData);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, colorCodeParam, folderIdParam, slugParam]);

  // 🧠 Bildlogik - måste vara före early returns för hook-regler
  const angleImages = useMemo(() => {
    if (!product) return [];
    
    // 🎯 PRIO 1: Om vi har product.pictures från API:et, använd dessa först
    if (product.pictures && Object.keys(product.pictures).length > 0) {
      const viewMapping: Record<string, string> = {
        "Front": product.pictures.front || "",
        "Right": product.pictures.right || "",
        "Back": product.pictures.back || "",
        "Left": product.pictures.left || "",
      };
      
      return selectedViews
        .filter(view => viewMapping[view])
        .map(view => ({ label: view, url: viewMapping[view] }));
    }
    
    // 🎯 PRIO 2: Om vi har angle_images från API:et, använd dessa
    if (product.angle_images && Object.keys(product.angle_images).length > 0) {
      return Object.entries(product.angle_images)
        .filter(([key]) => selectedViews.includes(key))
        .map(([key, url]) => ({ label: key, url }));
    }
    
    // 🎯 PRIO 3: Fallback till generateAngleImages
    const folderId = folderIdParam || product.folder_id || "";
    const articleNumber = product.id || productId || "";
    const colorCode = colorCodeParam || product.colorCode || "";
    const slug = slugParam || product.slug_name || (product.name || "").replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
    
    console.log("✅ Parametrar till generateAngleImages:", { folderId, articleNumber, colorCode, slug, selectedViews });
    
    return generateAngleImages(folderId, articleNumber, colorCode, slug, selectedViews).map((img) => ({
      label: img.label,
      url: img.short,
    }));
  }, [product, selectedViews, folderIdParam, colorCodeParam, slugParam, productId]);

  // 🖼️ Huvudbild - prioritera front från angleImages
  const mainImage = angleImages.find((img) => img.label.toLowerCase() === "front")?.url || product?.image_url || "";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Laddar produkt...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>Produkt ej hittad</p>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Tillbaka
        </Button>
      </div>
    );
  }

  // 🧾 Pris
  const marginValue = parseFloat(margin);
  const pricePerUnit = product.price_ex_vat * marginValue;
  const total = pricePerUnit * quantity;
  const totalWithVat = total * 1.25;

  // 📄 Generera PDF
  const handleGeneratePDF = async () => {
    if (!customerName.trim()) {
      toast({ title: "Fel", description: "Ange kundnamn", variant: "destructive" });
      return;
    }

    // Define these again for the PDF generation scope
    const folderId = folderIdParam || product.folder_id || "";
    const colorCode = colorCodeParam || product.colorCode || "";
    const slug = slugParam || product.slug_name || (product.name || "").replace(/\s+/g, "");

    try {
      await generatePDF({
        companyName: "Kosta Nada Profil AB",
        customerName: customerName.trim(),
        quote: [
          {
            product,
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
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tillbaka
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
                <div className="bg-white border rounded-lg p-4 mb-4 flex justify-center">
                  {mainImage ? (
                    <img src={mainImage} alt={product.name} className="max-h-[400px] w-auto object-contain rounded" />
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-400">Ingen bild</div>
                  )}
                </div>

                {/* Vinkelbilder */}
                {angleImages.length > 0 && (
                  <>
                    <p className="text-sm text-gray-600 mb-2">Visar valda vinklar: {selectedViews.join(", ")}</p>
                    <div
                      className={`grid gap-2 ${
                        angleImages.length === 1
                          ? "grid-cols-1"
                          : angleImages.length === 2
                            ? "grid-cols-2"
                            : "grid-cols-4"
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
                  <h2 className="text-2xl font-bold">{product.name}</h2>
                  <p className="text-sm text-gray-600">Artikelnummer: {product.id}</p>
                  {product.category && <p className="text-sm text-gray-600">Kategori: {product.category}</p>}
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-gray-600">Grundpris (exkl. moms)</p>
                  <p className="text-xl font-semibold">{product.price_ex_vat} kr</p>
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
