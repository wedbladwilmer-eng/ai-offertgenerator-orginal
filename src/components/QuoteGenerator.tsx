import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Product {
  id: string;
  name: string;
  image_url?: string;
  price_ex_vat?: number;
  category?: string;
}

interface QuoteGeneratorProps {
  product: Product;
  mockupUrl?: string | null;
}

const QuoteGenerator: React.FC<QuoteGeneratorProps> = ({ product, mockupUrl }) => {
  const [quantity, setQuantity] = useState(1);
  const [margin, setMargin] = useState(25); // Default 25% margin
  const [customerName, setCustomerName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const priceExVat = product.price_ex_vat || 0;
  const priceWithMargin = priceExVat * (1 + margin / 100);
  const priceIncVat = priceWithMargin * 1.25; // 25% VAT
  const totalPrice = priceIncVat * quantity;

  const generatePDF = async () => {
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
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Company Header
      pdf.setFillColor(245, 245, 245);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(44, 62, 80);
      pdf.text('Kosta Nada Profil AB', 20, 20);
      
      // Offert title
      pdf.setFontSize(32);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(52, 152, 219);
      pdf.text('OFFERT', pageWidth / 2, 50, { align: 'center' });
      
      // Date and quote info
      const today = new Date().toLocaleDateString('sv-SE');
      const quoteNumber = `OFF-${Date.now().toString().slice(-6)}`;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Datum: ${today}`, 20, 65);
      pdf.text(`Offertnummer: ${quoteNumber}`, 20, 72);
      
      // Customer info box
      pdf.setFillColor(248, 249, 250);
      pdf.rect(20, 80, pageWidth - 40, 25, 'F');
      pdf.setDrawColor(220, 220, 220);
      pdf.rect(20, 80, pageWidth - 40, 25);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(44, 62, 80);
      pdf.text('Kund:', 25, 90);
      pdf.setFont('helvetica', 'normal');
      pdf.text(customerName, 25, 98);
      
      let yPos = 120;
      
      // Product section header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(44, 62, 80);
      pdf.text('Produktinformation', 20, yPos);
      yPos += 15;
      
      // Add mockup image if available
      if (mockupUrl) {
        try {
          const img = document.createElement('img');
          img.crossOrigin = 'anonymous';
          img.src = mockupUrl;
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            setTimeout(reject, 5000);
          });
          
          const canvas = await html2canvas(img, {
            width: 300,
            height: 300,
            scale: 1
          });
          
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 20, yPos, 60, 60);
          
          // Product details next to image
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Produktnamn:', 90, yPos + 10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(product.name, 90, yPos + 17);
          
          pdf.setFont('helvetica', 'bold');
          pdf.text('Artikelnummer:', 90, yPos + 27);
          pdf.setFont('helvetica', 'normal');
          pdf.text(product.id, 90, yPos + 34);
          
          if (product.category) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Kategori:', 90, yPos + 44);
            pdf.setFont('helvetica', 'normal');
            pdf.text(product.category, 90, yPos + 51);
          }
          
          yPos += 75;
        } catch (error) {
          console.error('Failed to add image:', error);
          yPos += 10;
        }
      } else {
        yPos += 10;
      }
      
      // Price table
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(44, 62, 80);
      pdf.text('Prissättning', 20, yPos);
      yPos += 15;
      
      // Table headers
      pdf.setFillColor(52, 152, 219);
      pdf.rect(20, yPos - 5, pageWidth - 40, 10, 'F');
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('Artikelnummer', 25, yPos + 2);
      pdf.text('Pris/st (inkl. moms)', 75, yPos + 2);
      pdf.text('Antal', 130, yPos + 2);
      pdf.text('Totalpris', 155, yPos + 2);
      
      yPos += 15;
      
      // Table row
      pdf.setFillColor(248, 249, 250);
      pdf.rect(20, yPos - 5, pageWidth - 40, 12, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(44, 62, 80);
      pdf.text(product.id, 25, yPos + 2);
      pdf.text(`${priceIncVat.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr`, 75, yPos + 2);
      pdf.text(quantity.toString(), 135, yPos + 2);
      pdf.text(`${totalPrice.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr`, 155, yPos + 2);
      
      yPos += 25;
      
      // Summary
      pdf.setDrawColor(52, 152, 219);
      pdf.setLineWidth(0.5);
      pdf.line(120, yPos, pageWidth - 20, yPos);
      yPos += 10;
      
      const subtotal = totalPrice / 1.25;
      const vatAmount = totalPrice - subtotal;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Subtotal (exkl. moms):', 120, yPos);
      pdf.text(`${subtotal.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr`, 155, yPos);
      yPos += 8;
      
      pdf.text('Moms (25%):', 120, yPos);
      pdf.text(`${vatAmount.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr`, 155, yPos);
      yPos += 12;
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('TOTALT (inkl. moms):', 120, yPos);
      pdf.text(`${totalPrice.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr`, 155, yPos);
      
      // Footer terms
      yPos += 30;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Villkor och bestämmelser:', 20, yPos);
      yPos += 6;
      pdf.text('• Offerten gäller i 30 dagar från utställningsdatum', 20, yPos);
      yPos += 5;
      pdf.text('• Leveranstid: 2-3 veckor från godkänd beställning', 20, yPos);
      yPos += 5;
      pdf.text('• Betalningsvillkor: 30 dagar netto', 20, yPos);
      yPos += 5;
      pdf.text('• Alla priser anges inklusive moms där inget annat anges', 20, yPos);
      
      // Save and upload PDF
      const fileName = `Offert_${customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${quoteNumber}.pdf`;
      const pdfBlob = pdf.output('blob');
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('Offers')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Download PDF
      pdf.save(fileName);
      
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
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl">Kosta Nada Profil AB</CardTitle>
            <p className="text-muted-foreground">Professionella produkter med logotyp</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-2">OFFERT</h1>
            <div className="flex justify-center gap-8 text-sm text-muted-foreground">
              <span>Datum: {new Date().toLocaleDateString('sv-SE')}</span>
              <span>Offertnummer: OFF-{Date.now().toString().slice(-6)}</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Customer Info */}
          <div className="bg-muted/30 p-6 rounded-lg">
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
          
          {/* Product Section */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Produktinformation</h2>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Product Image */}
              <div className="space-y-4">
                {mockupUrl ? (
                  <div className="bg-white p-4 rounded-lg border">
                    <img
                      src={mockupUrl}
                      alt="Produktmockup med logotyp"
                      className="w-full h-auto rounded"
                    />
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Produkt med din logotyp
                    </p>
                  </div>
                ) : (
                  <div className="bg-muted/30 p-8 rounded-lg text-center">
                    <p className="text-muted-foreground">
                      Ladda upp en logotyp för att se mockup
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
                    <Label className="font-semibold">Pris (inkl. moms)</Label>
                    <p className="mt-1 text-lg font-semibold text-primary">
                      {priceIncVat.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                    </p>
                  </div>
                </div>
                
                {/* Quantity and Margin Controls */}
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <Label htmlFor="margin">Marginal (%)</Label>
                    <Input
                      id="margin"
                      type="number"
                      min="0"
                      step="0.1"
                      value={margin}
                      onChange={(e) => setMargin(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
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
                  <span>{priceIncVat.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr</span>
                  <span>{quantity}</span>
                  <span className="font-semibold">{totalPrice.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Summary */}
          <div className="bg-muted/30 p-6 rounded-lg">
            <div className="space-y-2 max-w-sm ml-auto">
              <div className="flex justify-between">
                <span>Subtotal (exkl. moms):</span>
                <span>{(totalPrice / 1.25).toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr</span>
              </div>
              <div className="flex justify-between">
                <span>Moms (25%):</span>
                <span>{(totalPrice - totalPrice / 1.25).toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold text-primary">
                <span>TOTALT (inkl. moms):</span>
                <span>{totalPrice.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr</span>
              </div>
            </div>
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
              onClick={generatePDF}
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
  );
};

export default QuoteGenerator;