import React, { useState, useEffect } from "react";
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

interface Product {
  id: string;
  name: string;
  price_ex_vat: number;
  category?: string;
  colorCode?: string;
  folder_id?: string;
  image_url?: string;
  slug_name?: string;
}

// AngleImage component for handling fallback from short to long view suffix
const AngleImage: React.FC<{ shortUrl: string; longUrl: string; label: string }> = ({
  shortUrl,
  longUrl,
  label,
}) => {
  const [src, setSrc] = useState(shortUrl);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setSrc(shortUrl);
    setHasError(false);
  }, [shortUrl]);

  const handleError = () => {
    if (src === shortUrl) {
      setSrc(longUrl);
    } else {
      setHasError(true);
    }
  };

  const getLabelInSwedish = (view: string) => {
    switch (view) {
      case "Front": return "Framsida";
      case "Right": return "Höger sida";
      case "Back": return "Baksida";
      case "Left": return "Vänster sida";
      default: return view;
    }
  };

  return (
    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border">
      {!hasError ? (
        <img
          src={src}
          alt={label}
          className="w-full h-full object-contain"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          onError={handleError}
        />
      ) : (
        <img
          src="/placeholder.svg"
          alt={label}
          className="w-full h-full object-contain p-4 opacity-50"
        />
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
        {getLabelInSwedish(label)}
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
  const [confirmedData, setConfirmedData] = useState<{
    colorCode: string;
    folderId: string;
    imageUrl: string;
  } | null>(null);

  // Read URL parameters
  const productId = searchParams.get("productId");
  const colorCodeParam = searchParams.get("colorCode");
  const folderIdParam = searchParams.get("folderId");
  const imageUrlParam = searchParams.get("imageUrl");
  const viewsParam = searchParams.get("views");
  
  // Parse selected views from URL or fallback to ["Front"]
  const selectedViews = viewsParam 
    ? JSON.parse(decodeURIComponent(viewsParam)) 
    : ["Front"];

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("new-wave-proxy", {
          body: { articleNumber: productId },
        });

        if (error) throw error;

        let productData: Product = data;

        // Override with URL parameters if available
        if (colorCodeParam) productData.colorCode = colorCodeParam;
        if (folderIdParam) productData.folder_id = folderIdParam;
        if (imageUrlParam) productData.image_url = decodeURIComponent(imageUrlParam);

        setProduct(productData);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, colorCodeParam, folderIdParam, imageUrlParam]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Laddar produkt...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg">Produkt ej hittad</p>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tillbaka
        </Button>
      </div>
    );
  }

  // Get the base image URL from params
  const mainImage = decodeURIComponent(imageUrlParam || product.image_url || "");
  
  // Build angle images using the same logic as ProductImageView
  const buildAngleImages = () => {
    if (!mainImage) return [];
    
    // Remove any existing suffix from the base URL (same as ProductImageView)
    const cleanBase = mainImage.replace(/_(F|B|L|R|Front|Back|Left|Right)\.jpg$/i, "");
    
    // Build URLs for each selected view
    return selectedViews.map((view) => ({
      label: view,
      short: `${cleanBase}_${view[0].toUpperCase()}.jpg`,
      long: `${cleanBase}_${view}.jpg`,
    }));
  };

  const angleImages = buildAngleImages();

  const handleConfirmColor = () => {
    setIsColorConfirmed(true);
    setConfirmedData({
      colorCode: product.colorCode || "",
      folderId: product.folder_id || "",
      imageUrl: mainImage,
    });
  };

  const handleGeneratePDF = async () => {
    if (!customerName.trim()) {
      alert("Vänligen fyll i kundnamn");
      return;
    }

    const marginValue = parseFloat(margin);
    const pricePerUnit = product.price_ex_vat * marginValue;
    const total = pricePerUnit * quantity;
    const totalWithVat = total * 1.25;

    const pdfData = {
      companyName: "Kosta Nada",
      customerName: customerName.trim(),
      quote: [
        {
          product: {
            ...product,
            price_ex_vat: pricePerUnit,
          },
          quantity,
          selectedViews: selectedViews,
          mockup_url: confirmedData?.imageUrl || mainImage,
        },
      ],
      total,
      totalWithVat,
    };

    try {
      await generatePDF(pdfData);
      toast({
        title: "PDF skapad!",
        description: `PDF skapad med vyer: ${selectedViews.join(", ")}`,
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Fel vid generering av PDF");
    }
  };

  const marginValue = parseFloat(margin);
  const pricePerUnit = product.price_ex_vat * marginValue;
  const total = pricePerUnit * quantity;
  const totalWithVat = total * 1.25;

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

        <h1 className="text-3xl font-bold mb-8 text-center">Skapa offert</h1>

        {/* Customer Info */}
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

        {/* Product Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Produktinformation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left: Images */}
              <div>
                {/* Main Image */}
                <div className="mb-4 bg-white rounded-lg border p-4">
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="w-full h-auto max-h-[400px] object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-[400px] flex items-center justify-center text-gray-400">
                      Ingen bild tillgänglig
                    </div>
                  )}
                </div>

                {/* Selected Angle Thumbnails */}
                {angleImages.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Visar valda vinklar: {selectedViews.join(", ")}
                    </p>
                    <div className={`grid gap-2 ${
                      angleImages.length === 1 ? "grid-cols-1" : 
                      angleImages.length === 2 ? "grid-cols-2" :
                      "grid-cols-4"
                    }`}>
                      {angleImages.map((img) => (
                        <AngleImage
                          key={img.label}
                          shortUrl={img.short}
                          longUrl={img.long}
                          label={img.label}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirm Color Button */}
                <Button
                  onClick={handleConfirmColor}
                  disabled={isColorConfirmed}
                  className={`w-full mt-4 ${
                    isColorConfirmed
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  size="lg"
                >
                  {isColorConfirmed ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Färg bekräftad ✅
                    </>
                  ) : (
                    "Bekräfta färg"
                  )}
                </Button>
              </div>

              {/* Right: Product Details */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{product.name}</h2>
                  <p className="text-sm text-gray-600">Artikelnummer: {product.id}</p>
                  {product.category && (
                    <p className="text-sm text-gray-600">Kategori: {product.category}</p>
                  )}
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

        {/* Pricing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Prissättning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Pris per enhet (med marginal {margin}):</span>
              <span className="font-semibold">{pricePerUnit.toFixed(2)} kr</span>
            </div>
            <div className="flex justify-between">
              <span>Antal:</span>
              <span className="font-semibold">{quantity} st</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span>Totalt (exkl. moms):</span>
              <span className="font-bold">{total.toFixed(2)} kr</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Totalt (inkl. moms):</span>
              <span className="font-bold text-primary">{totalWithVat.toFixed(2)} kr</span>
            </div>
          </CardContent>
        </Card>

        {/* Generate PDF Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleGeneratePDF}
            disabled={!isColorConfirmed}
            size="lg"
            className="px-8"
          >
            Ladda ner som PDF
          </Button>
        </div>

        {!isColorConfirmed && (
          <p className="text-center text-sm text-gray-500 mt-2">
            Du måste bekräfta färgen innan du kan skapa PDF
          </p>
        )}
      </div>
    </div>
  );
};

export default Quote;
