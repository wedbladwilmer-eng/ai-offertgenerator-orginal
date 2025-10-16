import jsPDF from "jspdf";
import type { QuoteItem } from "@/hooks/useProducts";

interface PDFData {
  quote: QuoteItem[];
  companyName: string;
  customerName: string;
  total: number;
  totalWithVat: number;
  selectedViews?: string[];
}

export const generatePDF = async (data: PDFData) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();

  // 🏢 Företagslogotyp och header
  try {
    const logoModule = await import("@/assets/kosta-nada-profil-logo.png");
    const logoUrl = logoModule.default;

    const img = new Image();
    img.src = logoUrl;

    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
      setTimeout(resolve, 2000);
    });

    if (img.complete && img.naturalHeight > 0) {
      pdf.addImage(img, "PNG", 20, 15, 20, 20);
    }
  } catch (error) {
    console.warn("Logo not loaded:", error);
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Kosta Nada Profil AB", 45, 25);

  pdf.setFontSize(24);
  pdf.text("OFFERT", pageWidth / 2, 50, { align: "center" });

  const today = new Date().toLocaleDateString("sv-SE");
  const quoteNumber = `OFF-${Date.now().toString().slice(-6)}`;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Datum: ${today}`, pageWidth / 2 - 25, 60, { align: "center" });
  pdf.text(`Offertnummer: ${quoteNumber}`, pageWidth / 2 + 25, 60, { align: "center" });

  // 👤 Kundinfo
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Kund:", 20, 75);
  pdf.setFont("helvetica", "normal");
  pdf.text(data.companyName, 20, 82);

  let yPosition = 100;

  const item = data.quote[0];
  const baseImageUrl = item.product.image_url || "";
  const cleanBase = baseImageUrl.replace(/_(F|B|L|R|Front|Back|Left|Right)\.jpg$/i, "");

  // 🧩 Hjälpfunktion för att hämta bild via proxy
  const getImageDataUrl = async (imageUrl: string): Promise<string | null> => {
    try {
      console.log("Fetching image via proxy:", imageUrl);
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("image-proxy", {
        body: { imageUrl }
      });
      
      if (error) {
        console.error("Proxy error:", error);
        return null;
      }
      
      if (!data?.dataUrl) {
        console.error("No dataUrl in response");
        return null;
      }
      
      console.log("Image fetched successfully via proxy");
      return data.dataUrl;
    } catch (error) {
      console.error("Failed to fetch image via proxy:", error);
      return null;
    }
  };

  // 🧩 Hjälpfunktion för att lägga till bild eller placeholder
  const addImageToPDF = async (imageUrl: string, x: number, y: number, w: number, h: number): Promise<boolean> => {
    try {
      const dataUrl = await getImageDataUrl(imageUrl);
      
      if (dataUrl) {
        pdf.addImage(dataUrl, "PNG", x, y, w, h);
        console.log("Image added to PDF successfully");
        return true;
      }
    } catch (error) {
      console.error("Failed to add image to PDF:", error);
    }

    // Placeholder om bilden inte laddas
    console.log("Drawing placeholder for failed image");
    pdf.setFillColor(245, 245, 245);
    pdf.rect(x, y, w, h, "F");
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text("Ingen bild", x + w / 2, y + h / 2, { align: "center" });
    pdf.setTextColor(0, 0, 0);
    return false;
  };

  // 🖼️ Rubrik för produktvinklar
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Produktvinklar", 20, 25);

  // 🖼️ Koordinater för 2x2-grid
  const imageSize = 80;
  const gap = 10;
  const positions = [
    { view: "Front", label: "Framsida", x: 20, y: 40 },
    { view: "Right", label: "Höger sida", x: 110, y: 40 },
    { view: "Back", label: "Baksida", x: 20, y: 130 },
    { view: "Left", label: "Vänster sida", x: 110, y: 130 },
  ];

  // 🎨 Rita bilder eller placeholders
  for (const pos of positions) {
    const shortUrl = `${cleanBase}_${pos.view[0].toUpperCase()}.jpg`;
    const longUrl = `${cleanBase}_${pos.view}.jpg`;

    let loaded = await addImageToPDF(shortUrl, pos.x, pos.y, imageSize, imageSize);
    if (!loaded) {
      await addImageToPDF(longUrl, pos.x, pos.y, imageSize, imageSize);
    }

    // Etikett under varje bild
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(pos.label, pos.x + imageSize / 2, pos.y + imageSize + 6, { align: "center" });

    // Tunn ram runt varje cell
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(pos.x, pos.y, imageSize, imageSize);
  }

  // Flytta ner nästa sektion
  yPosition = 230;

  // 📦 Produktinfo och pris
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(item.product.name, 20, yPosition);

  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Artikelnummer: ${item.product.id}`, 20, yPosition);
  if (item.product.category) {
    yPosition += 7;
    pdf.text(`Kategori: ${item.product.category}`, 20, yPosition);
  }

  yPosition += 15;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Prissättning", 20, yPosition);
  yPosition += 10;

  // 🧾 Tabell
  pdf.setFillColor(240, 240, 240);
  pdf.rect(20, yPosition, pageWidth - 40, 8, "F");
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Artikelnummer", 25, yPosition + 5);
  pdf.text("Pris/st (inkl. moms)", 70, yPosition + 5);
  pdf.text("Antal", 125, yPosition + 5);
  pdf.text("Totalpris", 150, yPosition + 5);
  yPosition += 10;

  const price = (item.product.price_ex_vat || 0) * 2;
  const totalPrice = price * item.quantity;

  pdf.setFont("helvetica", "normal");
  pdf.text(item.product.id, 25, yPosition + 5);
  pdf.text(`${price.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr`, 70, yPosition + 5);
  pdf.text(item.quantity.toString(), 125, yPosition + 5);
  pdf.text(`${totalPrice.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr`, 150, yPosition + 5);

  // 🧮 Total
  yPosition += 20;
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("TOTALT (inkl. moms):", 25, yPosition);
  pdf.text(`${totalPrice.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr`, 150, yPosition);

  // 📜 Villkor
  yPosition += 20;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Villkor och bestämmelser:", 20, yPosition);
  yPosition += 7;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text("• Offerten gäller i 30 dagar från utställningsdatum", 20, yPosition);
  yPosition += 5;
  pdf.text("• Leveranstid: 2-3 veckor från godkänd beställning", 20, yPosition);
  yPosition += 5;
  pdf.text("• Betalningsvillkor: 30 dagar netto", 20, yPosition);
  yPosition += 5;
  pdf.text("• Alla priser anges inklusive moms där inget annat anges", 20, yPosition);

  // 💾 Spara PDF lokalt
  const fileName = `Offert_${data.companyName.replace(/[^a-zA-Z0-9]/g, "_")}_${quoteNumber}.pdf`;
  pdf.save(fileName);

  // ☁️ Ladda upp till Supabase
  try {
    const pdfBlob = pdf.output("blob");
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: uploadData, error } = await supabase.storage
      .from("Offers")
      .upload(fileName, pdfBlob, { contentType: "application/pdf" });

    if (error) console.error("Error uploading PDF:", error);
    else console.log("PDF uploaded:", uploadData);
  } catch (error) {
    console.error("Error uploading to Supabase:", error);
  }
};
