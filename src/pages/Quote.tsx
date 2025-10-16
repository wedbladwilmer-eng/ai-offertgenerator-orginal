import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Download, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/utils/pdfGenerator";
import { Product } from "@/hooks/useProducts";
import kostaNadaProfilLogo from "@/assets/kosta-nada-profil-logo.png";

// 🔹 Liten bildkomponent som försöker kort suffix först, sedan lång.
const AngleImage = ({ shortUrl, longUrl, label }: { shortUrl: string; longUrl: string; label: string }) => {
  const [src, setSrc] = useState(shortUrl);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="border rounded-lg flex items-center justify-center h-32 text-sm text-gray-400">Ingen bild</div>
    );
  }

  return (
    <img
      src={src}
      alt={label}
      onError={() => {
        if (src === shortUrl) setSrc(longUrl);
        else setError(true);
      }}
      className="w-full h-32 object-contain rounded-lg border bg-white p-2"
    />
  );
};

const Quote = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // 🟩 Läs in parametrar från URL
  const productId = searchParams.get("productId");
  const colorCodeParam = searchParams.get("colorCode");
  const folderIdParam = searchParams.get("folderId");
  const imageUrlParam = searchParams.get("imageUrl");

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [margin, setMargin] = useState("2");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Hämta produktdata från Edge Function
  const fetchProductData = async (articleNumber: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("new-wave-proxy", {
        body: { articleNumber },
      });
      if (error) throw new Error(error.message || "Misslyckades att hämta produktdata");
      if (data.error) throw new Error(data.error);
      return data as Product;
    } catch (err) {
      console.error("Error fetching product:", err);
      return null;
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;
      setIsLoading(true);

      try {
        const data = await fetchProductData(productId);
        if (!data) throw new Error("Produktdata saknas");

        // 🧠 Uppdatera med färgkod & folder från URL-parametrar
        if (colorCodeParam) data.colorCode = colorCodeParam;
        if (folderIdParam) data.folder_id = folderIdParam;
        if (imageUrlParam) data.image_url = decodeURIComponent(imageUrlParam);

        setProduct(data);
      } catch (err) {
        toast({
          title: "Fel vid hämtning",
          description: "Kunde inte ladda produktinformationen.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  if (isLoading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {isLoading ? "Laddar produkt..." : "Ingen produktdata kunde hämtas"}
      </div>
    );
  }

  // 🧩 Hämta slug_name från bildadressen
  const baseImage = decodeURIComponent(imageUrlParam || product.image_url || "");
  const match = baseImage.match(/_\d{2,3}_(.*?)_(?:F|B|L|R|Front|Back|Left|Right)\.jpg$/i);
  const slug = match ? match[1] : product.slug_name || "Produkt";

  const folder = folderIdParam || product.folder_id || "";
  const article = productId || product.id || "";
  const color = colorCodeParam || product.colorCode || "";

  // 🖼️ Huvudbild
  const mainImage = `https://images.nwgmedia.com/preview/${folder}/${article}_${color}_${slug}_Front.jpg`;

  // 🔄 4 vinklar
  const views = [
    {
      label: "Front",
      short: `${folder}/${article}_${color}_${slug}_F.jpg`,
      long: `${folder}/${article}_${color}_${slug}_Front.jpg`,
    },
    {
      label: "Right",
      short: `${folder}/${article}_${color}_${slug}_R.jpg`,
      long: `${folder}/${article}_${color}_${slug}_Right.jpg`,
    },
    {
      label: "Back",
      short: `${folder}/${article}_${color}_${slug}_B.jpg`,
      long: `${folder}/${article}_${color}_${slug}_Back.jpg`,
    },
    {
      label: "Left",
      short: `${folder}/${article}_${color}_${slug}_L.jpg`,
      long: `${folder}/${article}_${color}_${slug}_Left.jpg`,
    },
  ];

  const full = (rel: string) => `https://images.nwgmedia.com/preview/${rel}`;

  const basePrice = product.price_ex_vat || 0;
  const total = basePrice * parseFloat(margin) * quantity;
  const totalWithVat = total * 1.25;

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
        quote: [{ product, quantity }],
        companyName: customerName,
        total,
        totalWithVat,
      };
      await generatePDF(quoteData);
      toast({ title: "Offert skapad!", description: "PDF har genererats." });
    } catch {
      toast({
        title: "Fel vid PDF-generering",
        description: "Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
            <img src={kostaNadaProfilLogo} alt="Kosta Nada Profil AB" className="h-16 w-auto" />
            <div>
              <h1 className="font-bold text-lg">Kosta Nada Profil AB</h1>
              <p className="text-sm text-gray-500">Professionella produkter med logotyp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-8 space-y-8">
        <Card>
          <CardHeader className="text-center bg-muted/20 border-b">
            <h1 className="text-3xl font-bold text-primary">OFFERT</h1>
          </CardHeader>

          <CardContent className="space-y-8 p-8">
            {/* Kundinfo */}
            <div className="grid lg:grid-cols-2 gap-4 bg-muted/30 p-6 rounded-lg">
              <div>
                <Label>Kundnamn *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ange kundens namn"
                />
              </div>
              <div>
                <Label>Marginal (endast beräkning)</Label>
                <Select value={margin} onValueChange={setMargin}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj marginal" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        1:{m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Visas ej i PDF</p>
              </div>
            </div>

            <Separator />

            {/* Produktinformation */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Produktinformation</h2>
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Bildsektion */}
                <div className="space-y-4">
                  <div className="border rounded-lg bg-white p-4 flex items-center justify-center">
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="max-h-[400px] w-auto object-contain rounded-lg"
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">🖼️ Produktvyer</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {views.map((v) => (
                        <AngleImage key={v.label} label={v.label} shortUrl={full(v.short)} longUrl={full(v.long)} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Produktdetaljer */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Produktnamn</Label>
                      <p className="mt-1">{product.name}</p>
                    </div>
                    <div>
                      <Label>Artikelnummer</Label>
                      <p className="mt-1">{product.id}</p>
                    </div>
                    {product.category && (
                      <div>
                        <Label>Kategori</Label>
                        <p className="mt-1">{product.category}</p>
                      </div>
                    )}
                    <div>
                      <Label>Grundpris (exkl. moms)</Label>
                      <p className="mt-1">{basePrice.toFixed(2)} kr</p>
                    </div>
                  </div>

                  <div>
                    <Label>Antal</Label>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Prisberäkning */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Prissättning</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-primary text-primary-foreground grid grid-cols-4 font-semibold p-3">
                  <span>Artikelnummer</span>
                  <span>Pris/st</span>
                  <span>Antal</span>
                  <span>Totalpris</span>
                </div>
                <div className="bg-muted/30 grid grid-cols-4 p-3">
                  <span>{product.id}</span>
                  <span>{(basePrice * parseFloat(margin)).toFixed(2)} kr</span>
                  <span>{quantity}</span>
                  <span className="font-semibold">{total.toFixed(2)} kr</span>
                </div>
              </div>
            </div>

            {/* Totalt */}
            <div className="bg-muted/30 p-5 rounded-lg max-w-sm ml-auto">
              <div className="flex justify-between font-semibold text-primary">
                <span>TOTALT (inkl. moms)</span>
                <span>{totalWithVat.toFixed(2)} kr</span>
              </div>
            </div>

            {/* PDF-knapp */}
            <div className="flex justify-center">
              <Button onClick={handleGeneratePDF} disabled={isGenerating || !customerName.trim()} className="gap-2">
                <Download className="w-5 h-5" />
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
