import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Download, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generatePDF } from '@/utils/pdfGenerator';
import { Product } from '@/hooks/useProducts';
import kostaNadaProfilLogo from '@/assets/kosta-nada-profil-logo.png';

const Quote = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [margin, setMargin] = useState('2');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedViews, setSelectedViews] = useState<string[]>(["front", "right", "back", "left"]);

  const productId = searchParams.get('productId');
  const mockupParam = searchParams.get('mockup');

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
    if (mockupParam) {
      setMockupUrl(mockupParam);
    }
  }, [productId, mockupParam]);

  // Function to fetch product data via New Wave API
  const fetchProductData = async (articleNumber: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('new-wave-proxy', {
        body: { articleNumber }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch product data');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as Product;
    } catch (error) {
      console.error('Error fetching from New Wave API:', error);
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

      setProduct(productData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta produktinformation från New Wave",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">
            {isLoading ? 'Laddar produktinformation...' : 'Produktinformation kunde inte laddas'}
          </p>
        </div>
      </div>
    );
  }

  const marginMultiplier = parseFloat(margin);
  const basePrice = product.price_ex_vat || 0;
  const priceWithMargin = basePrice * marginMultiplier;
  // Prices from New Wave already include VAT, so no need to add VAT again
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
        quote: [{
          product: product,
          quantity: quantity,
          mockup_url: mockupUrl
        }],
        companyName: customerName,
        customerName: customerName,
        total: totalPrice / 1.25, // Ex VAT (for PDF calculation)
        totalWithVat: totalPrice,
        selectedViews: selectedViews
      };

      await generatePDF(quoteData);

      toast({
        title: "Offert skapad!",
        description: "PDF:en har sparats och laddats ner.",
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Fel vid skapande av offert",
        description: "Något gick fel. Försök igen.",
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
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tillbaka
            </Button>
            <div className="flex items-center gap-4">
              <img 
                src={kostaNadaProfilLogo} 
                alt="Kosta Nada Profil AB" 
                className="h-16 w-auto object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">Kosta Nada Profil AB</h1>
                <p className="text-sm text-muted-foreground">Professionella produkter med logotyp</p>
              </div>
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
              <span>Datum: {new Date().toLocaleDateString('sv-SE')}</span>
              <span>Offertnummer: OFF-{Date.now().toString().slice(-6)}</span>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Customer Info */}
              <div className="bg-muted/30 p-6 rounded-lg">
                <div className="grid lg:grid-cols-2 gap-4">
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
                  <div className={`margin-calculator-field ${isGenerating ? 'hidden' : ''}`}>
                    <Label htmlFor="margin-select" className="text-base font-semibold text-orange-600">
                      Marginal (endast för beräkning) *
                    </Label>
                    <Select value={margin} onValueChange={setMargin}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Välj marginal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.5">1:1.5</SelectItem>
                        <SelectItem value="2">1:2</SelectItem>
                        <SelectItem value="2.5">1:2.5</SelectItem>
                        <SelectItem value="3">1:3</SelectItem>
                        <SelectItem value="3.5">1:3.5</SelectItem>
                        <SelectItem value="4">1:4</SelectItem>
                        <SelectItem value="4.5">1:4.5</SelectItem>
                        <SelectItem value="5">1:5</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Detta fält syns inte för kunden i PDF:en
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Product Section */}
              <div>
                <h2 className="text-xl font-semibold mb-6">Produktinformation</h2>
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Product Images - All variations in a grid */}
                  <div className="space-y-4">
                    {(() => {
                      // Get the selected color variation image URL
                      const baseImageUrl = product.image_url || '';
                      
                      // Extract the base URL without the suffix (before _Front, _Right, etc.)
                      const baseUrl = baseImageUrl.replace(/_[A-Za-z]+\.(jpg|png|jpeg)$/i, '');
                      
                      const views = {
                        front: `${baseUrl}_Front.jpg`,
                        right: `${baseUrl}_Right.jpg`,
                        back: `${baseUrl}_Back.jpg`,
                        left: `${baseUrl}_Left.jpg`
                      };

                      const viewLabels = {
                        front: "Framsida",
                        right: "Höger",
                        back: "Baksida",
                        left: "Vänster"
                      };

                      return (
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(views).map(([key, url]) => (
                            <div key={key} className="bg-white p-3 rounded-lg border">
                              <img
                                src={url}
                                alt={viewLabels[key as keyof typeof viewLabels]}
                                className="w-full h-auto object-contain rounded-sm"
                                onError={(e) => {
                                  e.currentTarget.src = mockupUrl || product.image_url || '/placeholder.svg';
                                }}
                              />
                              <p className="text-xs text-center mt-2 text-muted-foreground">
                                {viewLabels[key as keyof typeof viewLabels]}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    {mockupUrl && (
                      <div className="bg-white p-4 rounded-lg border">
                        <img
                          src={mockupUrl}
                          alt="Produkt med din logotyp"
                          className="w-full h-auto object-contain rounded-sm"
                          onError={(e) => {
                            console.error('Failed to load mockup image');
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          Med din logotyp
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
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
                        <p className="mt-1">{basePrice.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr</p>
                      </div>
                    </div>

                    {/* Controls */}
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

              {/* Price Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Prissättning</h3>
                <div className="overflow-hidden rounded-lg border">
                  <div className="bg-primary text-primary-foreground p-4">
                    <div className="grid grid-cols-4 gap-4 font-semibold">
                      <span>Artikelnummer</span>
                      <span>Pris/st (inkl. moms)</span>
                      <span>Antal</span>
                      <span>Totalpris</span>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-4">
                    <div className="grid grid-cols-4 gap-4">
                      <span>{product.id}</span>
                      <span>{priceWithMargin.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr</span>
                      <span>{quantity}</span>
                      <span className="font-semibold">{totalPrice.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-muted/30 p-6 rounded-lg">
                <div className="space-y-2 max-w-sm ml-auto">
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-primary">
                    <span>TOTALT (inkl. moms):</span>
                    <span>{totalPrice.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Product Angles Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-4">🖼️ Välj vinklar till offerten</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    // Get the selected color variation image URL
                    const baseImageUrl = product.image_url || '';
                    
                    // Extract the base URL without the suffix (before _Front, _Right, etc.)
                    const baseUrl = baseImageUrl.replace(/_[A-Za-z]+\.(jpg|png|jpeg)$/i, '');
                    
                    const views = {
                      front: `${baseUrl}_Front.jpg`,
                      right: `${baseUrl}_Right.jpg`,
                      back: `${baseUrl}_Back.jpg`,
                      left: `${baseUrl}_Left.jpg`
                    };

                    const toggleView = (view: string) => {
                      setSelectedViews((prev) =>
                        prev.includes(view) ? prev.filter(v => v !== view) : [...prev, view]
                      );
                    };

                    const viewLabels = {
                      front: "Framsida",
                      right: "Höger sida",
                      back: "Baksida",
                      left: "Vänster sida"
                    };

                    return Object.entries(views).map(([key, url]) => (
                      <div key={key} className="relative">
                        <img
                          src={url}
                          alt={viewLabels[key as keyof typeof viewLabels]}
                          className={`rounded-lg border-2 transition-all ${
                            selectedViews.includes(key)
                              ? "border-blue-500"
                              : "border-gray-300 opacity-40"
                          }`}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <button
                          onClick={() => toggleView(key)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition-colors"
                          aria-label={selectedViews.includes(key) ? "Ta bort vinkel" : "Lägg till vinkel"}
                        >
                          ✕
                        </button>
                        <p className="text-xs text-center mt-1 text-muted-foreground">
                          {viewLabels[key as keyof typeof viewLabels]}
                        </p>
                      </div>
                    ));
                  })()}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Klicka på ✕ för att ta bort en vinkel från offerten. Vinklar med blå ram inkluderas i PDF:en.
                </p>
              </div>

              {/* Terms */}
              <div className="bg-muted/20 p-4 rounded-lg text-sm text-muted-foreground">
                <h4 className="font-semibold text-foreground mb-2">Villkor och bestämmelser:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Offerten gäller i 30 dagar från utställningsdatum</li>
                  <li>Leveranstid: 2-3 veckor från godkänd beställning</li>
                  <li>Betalningsvillkor: 30 dagar netto</li>
                  <li>Alla priser anges inklusive moms där inget annat anges</li>
                </ul>
              </div>

              {/* Generate PDF Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleGeneratePDF}
                  disabled={isGenerating || !customerName.trim()}
                  size="lg"
                  className="gap-2"
                >
                  <Download className="h-5 w-5" />
                  {isGenerating ? 'Skapar PDF...' : 'Ladda ner som PDF'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Quote;