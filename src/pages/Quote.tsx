import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

/**
 * Liten bildkomponent som försöker kort suffix (_F/_R/_B/_L) först
 * och faller tillbaka till långt suffix (_Front/_Right/_Back/_Left) vid 404.
 */
const AngleThumb: React.FC<{ shortUrl: string; longUrl: string; label: string }> = ({
  shortUrl,
  longUrl,
  label,
}) => {
  const [src, setSrc] = useState<string>(shortUrl);
  const [failed, setFailed] = useState(false);

  const onError = () => {
    if (src === shortUrl) {
      setSrc(longUrl); // prova långt suffix
    } else {
      setFailed(true); // visa "Ingen bild"
    }
  };

  return (
    <div className="relative bg-white border rounded-lg overflow-hidden aspect-square flex items-center justify-center">
      {!failed ? (
        <img
          src={src}
          alt={label}
          className="w-full h-full object-contain"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          onError={onError}
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

type Product = {
  id: string;
  name: string;
  price_ex_vat: number;
  category?: string;
  colorCode?: string;
  folder_id?: string;
  image_url?: string;
  slug_name?: string;
  variations?: Array<{
    color: string;
    image_url: string;
    colorCode?: string;
    folder_id?: string;
    articleNumber?: string;
  }>;
};

type LocationState = {
  product: Product;
  selectedColorCode?: string;
  selectedFolderId?: string;
  selectedViews?: string[]; // ["Front","Right","Back","Left"]
  currentImage?: string;     // den faktiska front-bilden för vald färg
  currentVariation?: any;    // metadata om vald variant (om du skickar detta)
};

const Quote: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  // --------------- Early guard ---------------
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
  const selectedViews = state.selectedViews && state.selectedViews.length > 0
    ? state.selectedViews
    : ["Front", "Right", "Back", "Left"];

  // --------------- Grunddata för bilder ---------------
  // Använd antingen image från state (högst prio), eller produktens image_url.
  const rawBaseUrl = state.currentImage || product.image_url || "";

  // Beräkna slug (om saknas)
  const slug =
    product.slug_name ||
    (product.name || "")
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9]/g, "");

  // Extrahera komponenter ur baseUrl och applicera valt folderId & colorCode
  // Format: https://images.nwgmedia.com/preview/{folder}/{article}_{color}_{slug}_{view}.jpg
  const { cleanBase, frontUrl } = useMemo(() => {
    // Om vi inte har någon bild-URL alls → ingen bild
    if (!rawBaseUrl) {
      return { cleanBase: "", frontUrl: "" };
    }

    let url = rawBaseUrl;

    // 1) Ta bort vy-suffix (_F/_R/_B/_L eller _Front/_Right/_Back/_Left)
    const baseNoView = url.replace(/_(F|R|B|L|Front|Right|Back|Left)\.jpg$/i, "");

    // 2) Byt ut colorCode i basen om "selectedColorCode" finns
    const colorCode = state.selectedColorCode || product.colorCode || "";
    let baseWithColor = baseNoView;
    if (colorCode) {
      // matchar _00_ eller -00- osv mellan artikel & slug
      baseWithColor = baseWithColor.replace(/(_|-)\d{1,3}(_|-)/, `$1${colorCode}$2`);
    }

    // 3) Byt folder om "selectedFolderId" finns
    const folderId = state.selectedFolderId || product.folder_id || "";
    let baseWithFolder = baseWithColor;
    if (folderId) {
      baseWithFolder = baseWithFolder.replace(/\/preview\/\d+\//, `/preview/${folderId}/`);
    }

    const base = baseWithFolder;

    // Front-url (prioritera kort suffix)
    const frontShort = `${base}_F.jpg`;
    const frontLong = `${base}_Front.jpg`;

    // Vi använder kort först; AngleThumb hanterar fallback – men för huvudbilden vill vi visa något direkt.
    // Vi väljer korta först och låter <img onError> visa "Ingen bild" om inget finns.
    return { cleanBase: base, frontUrl: frontShort || frontLong };
  }, [rawBaseUrl, product.colorCode, product.folder_id, state.selectedColorCode, state.selectedFolderId]);

  // --------------- Bygg vinklar (exkl. Front) för grid ---------------
  const angleCandidates = useMemo(() => {
    if (!cleanBase) return [];

    const all = [
      { label: "Front", short: `${cleanBase}_F.jpg`,   long: `${cleanBase}_Front.jpg` },
      { label: "Right", short: `${cleanBase}_R.jpg`,   long: `${cleanBase}_Right.jpg` },
      { label: "Back",  short: `${cleanBase}_B.jpg`,   long: `${cleanBase}_Back.jpg` },
      { label: "Left",  short: `${cleanBase}_L.jpg`,   long: `${cleanBase}_Left.jpg` },
    ];

    // Filtrera till valda vyer
    const onlySelected = all.filter(a => selectedViews.includes(a.label));

    // Se till att Front inte dupliceras (Front är main image)
    return onlySelected.filter(a => a.label !== "Front");
  }, [cleanBase, selectedViews]);

  // --------------- UI-state för kund/pris ---------------
  const [customerName, setCustomerName] = useState("");
  const [margin, setMargin] = useState("1.5");
  const [quantity, setQuantity] = useState(1);

  // --------------- Prislogik ---------------
  const marginValue = parseFloat(margin || "1");
  const pricePerUnit = (product.price_ex_vat || 0) * (isFinite(marginValue) ? marginValue : 1);
  const total = pricePerUnit * quantity;
  const totalWithVat = total * 1.25;

  // --------------- PDF ---------------
  const handleGeneratePDF = async () => {
    if (!customerName.trim()) {
      toast({ title: "Kundnamn saknas", description: "Ange ett kundnamn innan du skapar PDF.", variant: "destructive" });
      return;
    }

    try {
      // För att PDF:n ska generera samma vinklar från bas-URL:
      // vi sätter produktens image_url till front-bildens bas (frontUrl),
      // så att pdfGenerator kan bygga _F/_R/_B/_L från samma mönster.
      const productForPdf: Product = {
        ...product,
        image_url: frontUrl || product.image_url || "",
      };

      await generatePDF({
        companyName: "Kosta Nada Profil AB",
        customerName: customerName.trim(),
        quote: [
          {
            product: productForPdf,
            quantity,
            mockup_url: frontUrl || product.image_url || "",
            selectedViews: selectedViews,
          },
        ],
        total,
        totalWithVat,
        selectedViews,
      });

      toast({ title: "PDF skapad!", description: "Offerten laddas ner och sparas.", variant: "default" });
    } catch (err) {
      console.error("PDF error:", err);
      toast({ title: "Fel vid PDF-generering", description: "Försök igen.", variant: "destructive" });
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
                placeholder="Företagsnamn AB"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
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
                {/* Huvudbild (Front) */}
                <div className="bg-white border rounded-lg p-4 mb-4 flex items-center justify-center min-h-[280px]">
                  {frontUrl ? (
                    <img
                      src={frontUrl}
                      alt={`${product.name} – Front`}
                      className="w-full h-auto max-h-[400px] object-contain rounded"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-[240px] flex items-center justify-center text-gray-400">Ingen bild</div>
                  )}
                </div>

                {/* Vinklar (exkl. Front) i grid */}
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
                  <p className="text-xl font-semibold">{(product.price_ex_vat || 0).toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr</p>
                </div>

                <div>
                  <Label htmlFor="quantity">Antal</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prissättning */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Prissättning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Pris/st (med marginal {margin}):</span>
              <span className="font-semibold">
                {pricePerUnit.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr
              </span>
            </div>
            <div className="flex justify-between">
              <span>Antal:</span>
              <span className="font-semibold">{quantity}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Totalt (exkl. moms):</span>
              <span className="font-bold">
                {total.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr
              </span>
            </div>
            <div className="flex justify-between">
              <span>Totalt (inkl. moms):</span>
              <span className="font-bold text-primary">
                {totalWithVat.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr
              </span>
            </div>
          </CardContent>
        </Card>

        {/* PDF-knapp */}
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

        {!frontUrl && (
          <p className="text-center text-xs text-gray-500 mt-2">
            Tips: Välj en färg/bild på första sidan innan du skapar offerten.
          </p>
        )}
      </div>
    </div>
  );
};

export default Quote;