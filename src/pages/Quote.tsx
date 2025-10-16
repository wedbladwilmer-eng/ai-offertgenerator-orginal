import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Download, ArrowLeft, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/utils/pdfGenerator";
import { Product } from "@/hooks/useProducts";
import kostaNadaProfilLogo from "@/assets/kosta-nada-profil-logo.png";
import { ProductImageView } from "@/components/ProductImageView";

const AngleImage = ({ shortUrl, longUrl, label }: { shortUrl: string; longUrl: string; label: string }) => {
  const [src, setSrc] = useState(shortUrl);
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative bg-white border rounded-lg overflow-hidden flex items-center justify-center h-40">
      {!failed ? (
        <img
          src={src}
          alt={label}
          className="object-contain w-full h-full"
          onError={() => {
            if (src === shortUrl) setSrc(longUrl);
            else setFailed(true);
          }}
        />
      ) : (
        <div className="flex items-center justify-center text-gray-400 text-sm h-full">Ingen bild tillgänglig</div>
      )}
    </div>
  );
};

const Quote = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [margin, setMargin] = useState("2");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedViews, setSelectedViews] = useState<string[]>(["Front", "Right", "Back", "Left"]);

  const productId = searchParams.get("productId");
  const mockupParam = searchParams.get("mockup");
  const colorCodeParam = searchParams.get("colorCode");
  const folderIdParam = searchParams.get("folderId");
  const imageUrlParam = searchParams.get("imageUrl");

  useEffect(() => {
    if (productId) fetchProduct();
    if (mockupParam) setMockupUrl(mockupParam);
  }, [productId, mockupParam]);

  // 🔹 Hämta produktdata via Supabase Edge Function
  const fetchProductData = async (articleNumber: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("new-wave-proxy", {
        body: { articleNumber },
      });
      if (error) throw new Error(error.message || "Failed to fetch product data");
      if (data.error) throw new Error(data.error);
      return data as Product;
    } catch (error) {
      console.error("Error fetching from New Wave API:", error);
      throw error;
    }
  };

  const fetchProduct = async () => {
    if (!productId) return;
    setIsLoading(true);
    try {
      const productData = await fetchProductData(productId);
      if (!productData) {
        toast({
          title: "Produkt ej hittad",
          description: `Ingen produkt med artikelnummer ${productId} hittades`,
          variant: "destructive",
        });
        setProduct(null);
        return;
      }
      
      // Uppdatera med färgkod och folder_id från URL-parametrar
      if (colorCodeParam) productData.colorCode = colorCodeParam;
      if (folderIdParam) productData.folder_id = folderIdParam;
      if (imageUrlParam) productData.image_url = decodeURIComponent(imageUrlParam);
      
      setProduct(productData);
    } catch {
      toast({
        title: "Fel",
        description: "Kunde inte hämta produktinformation från New Wave",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = (view: string) => {
    setSelectedViews((prev) => 
      prev.includes(view) ? prev.filter((v) => v !== view) : [...prev, view]
    );
  };

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">
          {isLoading ? "Laddar produktinformation..." : "Produktinformation kunde inte laddas"}
        </p>
      </div>
    );
  }

  const marginMultiplier = parseFloat(margin);
  const basePrice = product.price_ex_vat || 0;
  const priceWithMargin = basePrice * marginMultiplier;
  const totalPrice = priceWithMargin * quantity;

  const handleGeneratePDF = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Kundnamn saknas",
        description: "Ange kundnamn innan du skapar offerten.",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    try {
      const quoteData = {
        quote: [{ product, quantity, mockup_url: mockupUrl, selectedViews }],
        companyName: customerName,
        customerName,
        total: totalPrice / 1.25,
        totalWithVat: totalPrice,
      };
      await generatePDF(quoteData);
      toast({ title: "Offert skapad!", description: "PDF:en har sparats och laddats ner." });
    } catch {
      toast({
        title: "Fel vid skapande av offert",
        description: "Något gick fel. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 🧠 Skapa dynamiska bildlänkar utifrån huvudbilden
  const generateAngleImages = (baseUrl: string) => {
    if (!baseUrl) return [];
    let cleanBase = baseUrl.replace(/_(F|B|L|R|Front|Back|Left|Right)\.jpg$/i, "");
    
    // Byt färgkod om den finns i URL-parametrarna
    if (colorCodeParam) {
      cleanBase = cleanBase.replace(/[_-]\d{2,3}[_-]/, `_${colorCodeParam}_`);
    }
    
    // Byt folder_id om den finns i URL-parametrarna
    if (folderIdParam) {
      cleanBase = cleanBase.replace(/\/\d{5,6}\//, `/${folderIdParam}/`);
    }
    
    return [
      { label: "front", short: `${cleanBase}_F.jpg`, long: `${cleanBase}_Front.jpg` },
      { label: "right", short: `${cleanBase}_R.jpg`, long: `${cleanBase}_Right.jpg` },
      { label: "back", short: `${cleanBase}_B.jpg`, long: `${cleanBase}_Back.jpg` },
      { label: "left", short: `${cleanBase}_L.jpg`, long: `${cleanBase}_Left.jpg` },
    ];
  };

  const angleImages = generateAngleImages(product.image_url || "");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka
          </Button>
          <div className="flex items-center gap-4">
            <img src={kostaNadaProfilLogo} alt="Kosta Nada Profil AB" className="h-16 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Kosta Nada Profil AB</h1>
              <p className="text-sm text-muted-foreground">Professionella produkter med logotyp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="bg-white shadow-lg">
          <CardHeader className="text-center border-b bg-muted/30">
            <h1 className="text-4xl font-bold text-primary">OFFERT</h1>
            <div className="flex justify-center gap-8 text-sm text-muted-foreground mt-2">
              <span>Datum: {new Date().toLocaleDateString("sv-SE")}</span>
              <span>Offertnummer: OFF-{Date.now().toString().slice(-6)}</span>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Kundinfo */}
            <div className="bg-muted/30 p-6 rounded-lg grid lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-name" className="text-base font-semibold">
                  Kundnamn *
                </Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ange företag eller kundnamn"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="margin-select" className="text-base font-semibold text-orange-600">
                  Marginal (endast beräkning) *
                </Label>
                <Select value={margin} onValueChange={setMargin}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Välj marginal" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((v) => (
                      <SelectItem key={v} value={v.toString()}>
                        1:{v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Detta fält syns inte i PDF:en</p>
              </div>
            </div>

            <Separator />

            {/* Produktinfo */}
            <div>
              <h2 className="text-xl font-semibold mb-6">Produktinformation</h2>
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  {/* Huvudbild */}
                  <div className="bg-white p-4 rounded-lg border flex items-center justify-center">
                    <img
                      src={mockupUrl || product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="max-h-[400px] w-auto object-contain rounded-sm border border-border"
                    />
                  </div>

                  {/* Fyra vinklade bilder */}
                  <div>
                    <h4 className="font-semibold mb-2">🖼️ Produktbilder (vinklar)</h4>
                    <p className="text-xs text-muted-foreground mb-3">Klicka för att välja vilka vinklar som ska ingå i offerten</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {["Front", "Right", "Back", "Left"].map((view) => (
                        <ProductImageView 
                          key={view} 
                          view={view} 
                          baseImageUrl={product.image_url || ""} 
                          selected={selectedViews.includes(view)}
                          onToggle={() => toggleView(view)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Detaljer */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Produktnamn</Label>
                      <p className="mt-1">{product.name}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Artikelnummer</Label>
                      <p className="mt-1">{product.id}</p>
                    </div>
                    {product.category && (
                      <div>
                        <Label className="font-semibold">Kategori</Label>
                        <p className="mt-1">{product.category}</p>
                      </div>
                    )}
                    <div>
                      <Label className="font-semibold">Grundpris (inkl. moms)</Label>
                      <p className="mt-1">{basePrice.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr</p>
                    </div>
                  </div>

                  <div className="max-w-xs">
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
            </div>

            <Separator />

            {/* Priser */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Prissättning</h3>
              <div className="overflow-hidden rounded-lg border">
                <div className="bg-primary text-primary-foreground p-4 grid grid-cols-4 gap-4 font-semibold">
                  <span>Artikelnummer</span>
                  <span>Pris/st (inkl. moms)</span>
                  <span>Antal</span>
                  <span>Totalpris</span>
                </div>
                <div className="bg-muted/30 p-4 grid grid-cols-4 gap-4">
                  <span>{product.id}</span>
                  <span>{priceWithMargin.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr</span>
                  <span>{quantity}</span>
                  <span className="font-semibold">
                    {totalPrice.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr
                  </span>
                </div>
              </div>
            </div>

            {/* Summering */}
            <div className="bg-muted/30 p-6 rounded-lg max-w-sm ml-auto">
              <div className="flex justify-between text-lg font-bold text-primary">
                <span>TOTALT (inkl. moms):</span>
                <span>{totalPrice.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr</span>
              </div>
            </div>

            {/* Villkor */}
            <div className="bg-muted/20 p-4 rounded-lg text-sm text-muted-foreground">
              <h4 className="font-semibold text-foreground mb-2">Villkor och bestämmelser:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Offerten gäller i 30 dagar från utställningsdatum</li>
                <li>Leveranstid: 2–3 veckor från godkänd beställning</li>
                <li>Betalningsvillkor: 30 dagar netto</li>
                <li>Alla priser anges inklusive moms där inget annat anges</li>
              </ul>
            </div>

            {/* PDF-knapp */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleGeneratePDF}
                disabled={isGenerating || !customerName.trim()}
                size="lg"
                className="gap-2"
              >
                <Download className="h-5 w-5" />
                {isGenerating ? "Skapar PDF..." : "Ladda ner som PDF"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Quote;
