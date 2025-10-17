import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/kosta-nada-profil-logo.png";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/utils/pdfGenerator";
import { getViewLabelInSwedish } from "@/lib/generateAngleImages";

type Product = {
  id: string;
  name: string;
  price_ex_vat: number;
  category?: string;
  colorCode?: string;
  folder_id?: string;
  image_url?: string;
  slug_name?: string;
};

type LocationState = {
  product: Product;
  selectedColorCode?: string;
  selectedFolderId?: string;
  selectedViews?: string[];
  currentImage?: string;
};

const AngleThumb: React.FC<{ shortUrl: string; longUrl: string; label: string }> = ({
  shortUrl,
  longUrl,
  label,
}) => {
  const [src, setSrc] = useState(shortUrl);
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative bg-white border rounded-lg overflow-hidden aspect-square flex items-center justify-center">
      {!failed ? (
        <img
          src={src}
          alt={label}
          className="w-full h-full object-contain"
          onError={() => {
            if (src === shortUrl) setSrc(longUrl);
            else setFailed(true);
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
          Ingen bild
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
        {getViewLabelInSwedish(label)}
      </div>
    </div>
  );
};

const Quote: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const state = location.state as LocationState;

  if (!state?.product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">Ingen produkt vald</p>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tillbaka
        </Button>
      </div>
    );
  }

  const product = state.product;
  const selectedViews = state.selectedViews || ["Front", "Right", "Back", "Left"];
  const rawBaseUrl = state.currentImage || product.image_url || "";

  // 🧠 Bygg korrekt bas-URL (fixar dubbla underscore)
  const { cleanBase, frontUrl } = useMemo(() => {
    if (!rawBaseUrl) return { cleanBase: "", frontUrl: "" };

    const folderId = state.selectedFolderId || product.folder_id || "";
    const articleNumber = product.id || "";
    const colorCode = state.selectedColorCode || product.colorCode || "";
    const slug =
      product.slug_name ||
      (product.name || "").replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");

    // 🧩 Exempel: 354418_955_AdvantagePolo
    const baseFileName = [articleNumber, colorCode, slug]
      .filter(Boolean)
      .join("_")
      .replace(/_+/g, "_");

    const base = `https://images.nwgmedia.com/preview/${folderId}/${baseFileName}`;
    const frontShort = `${base}_F.jpg`;
    const frontLong = `${base}_Front.jpg`;

    return { cleanBase: base, frontUrl: frontShort || frontLong };
  }, [rawBaseUrl, product, state]);

  // 🖼️ Bygg vy-bilder (exkl. Front)
  const angleCandidates = useMemo(() => {
    if (!cleanBase) return [];

    const all = [
      { label: "Front", short: `${cleanBase}_F.jpg`, long: `${cleanBase}_Front.jpg` },
      { label: "Right", short: `${cleanBase}_R.jpg`, long: `${cleanBase}_Right.jpg` },
      { label: "Back", short: `${cleanBase}_B.jpg`, long: `${cleanBase}_Back.jpg` },
      { label: "Left", short: `${cleanBase}_L.jpg`, long: `${cleanBase}_Left.jpg` },
    ];

    return all.filter((a) => selectedViews.includes(a.label) && a.label !== "Front");
  }, [cleanBase, selectedViews]);

  const [customerName, setCustomerName] = useState("");
  const [margin, setMargin] = useState("1.5");
  const [quantity, setQuantity] = useState(1);

  const marginValue = parseFloat(margin);
  const pricePerUnit = product.price_ex_vat * marginValue;
  const total = pricePerUnit * quantity;
  const totalWithVat = total * 1.25;

  const handleGeneratePDF = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Kundnamn saknas",
        description: "Fyll i ett kundnamn innan du skapar PDF.",
        variant: "destructive",
      });
      return;
    }

    const pdfProduct = { ...product, image_url: frontUrl };

    await generatePDF({
      companyName: "Kosta Nada Profil AB",
      customerName,
      quote: [
        {
          product: pdfProduct,
          quantity,
          mockup_url: frontUrl,
          selectedViews,
        },
      ],
      total,
      totalWithVat,
      selectedViews,
    });

    toast({
      title: "PDF skapad!",
      description: "PDF laddas ner automatiskt.",
    });
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
          <img src={logo} alt="Kosta Nada Profil AB" className="h-12 w-auto object-contain" />
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
                  <SelectValue placeholder="Välj marginal" />
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
                {/* Huvudbild */}
                <div className="bg-white border rounded-lg p-4 mb-4 flex items-center justify-center min-h-[280px]">
                  {frontUrl ? (
                    <img
                      src={frontUrl}
                      alt={`${product.name} – Front`}
                      className="w-full h-auto max-h-[400px] object-contain rounded"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">Ingen bild</div>
                  )}
                </div>

                {/* Vinkelbilder */}
                {angleCandidates.length > 0 && (
                  <>
                    <p className="text-sm text-gray-600 mb-2">
                      Valda vinklar: {angleCandidates.map((a) => a.label).join(", ")}
                    </p>
                    <div
                      className={`grid gap-2 ${
                        angleCandidates.length <= 2 ? "grid-cols-2" : "grid-cols-4"
                      }`}
                    >
                      {angleCandidates.map(({ label, short, long }) => (
                        <AngleThumb key={label} shortUrl={short} longUrl={long} label={label} />
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

        {/* Pris */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Prissättning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Pris/st (inkl. marginal):</span>
              <span className="font-semibold">{pricePerUnit.toFixed(2)} kr</span>
            </div>
            <div className="flex justify-between">
              <span>Antal:</span>
              <span className="font-semibold">{quantity}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Total (inkl. moms):</span>
              <span className="font-bold text-primary">{totalWithVat.toFixed(2)} kr</span>
            </div>
          </CardContent>
        </Card>

        {/* PDF */}
        <div className="flex justify-center">
          <Button
            onClick={handleGeneratePDF}
            disabled={!frontUrl || !customerName.trim()}
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