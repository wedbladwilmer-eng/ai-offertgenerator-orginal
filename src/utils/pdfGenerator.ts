import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Use local logo instead of external URL
  try {
    const logoModule = await import("@/assets/kosta-nada-profil-logo.png");
    const logoUrl = logoModule.default;

    const logoImg = document.createElement("img");
    logoImg.src = logoUrl;

    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = resolve;
      setTimeout(resolve, 2000);
    });

    if (logoImg.complete && logoImg.naturalHeight > 0) {
      const logoCanvas = await html2canvas(logoImg, {
        width: 100,
        height: 100,
        scale: 1,
      });

      const logoData = logoCanvas.toDataURL("image/png");
      pdf.addImage(logoData, "PNG", 20, 15, 20, 20);
    }
  } catch (error) {
    console.log("Could not add company logo to PDF:", error);
  }

  // Company name next to logo
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Kosta Nada Profil AB", 45, 25);

  // Header
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text("OFFERT", pageWidth / 2, 50, { align: "center" });

  // Date and quote number
  const today = new Date().toLocaleDateString("sv-SE");
  const quoteNumber = `OFF-${Date.now().toString().slice(-6)}`;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Datum: ${today}`, pageWidth / 2 - 25, 60, { align: "center" });
  pdf.text(`Offertnummer: ${quoteNumber}`, pageWidth / 2 + 25, 60, { align: "center" });

  // Customer info
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Kund:", 20, 75);
  pdf.setFont("helvetica", "normal");
  pdf.text(data.companyName, 20, 82);

  let yPosition = 100;

  // Product info and mockup image
  const item = data.quote[0];

  // Function to add an image to PDF
  const addImageToPDF = async (imageUrl: string, x: number, y: number, width: number, height: number) => {
    try {
      console.log("Adding image to PDF:", imageUrl);

      // Use image proxy for external images
      const isExternalImage = imageUrl.startsWith("http") && !imageUrl.includes("supabase");
      let finalImageUrl = imageUrl;

      if (isExternalImage) {
        console.log("Proxying external image through image-proxy");
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: proxyData, error: proxyError } = await supabase.functions.invoke("image-proxy", {
          body: { imageUrl },
        });

        if (proxyError || !proxyData?.dataUrl) {
          console.error("Failed to proxy image:", proxyError);
          throw new Error("Failed to load image");
        }

        finalImageUrl = proxyData.dataUrl;
        console.log("Image proxied successfully");
      }

      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);

      const img = document.createElement("img");
      if (!finalImageUrl.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      img.src = finalImageUrl;

      const container = document.createElement("div");
      container.style.width = "512px";
      container.style.height = "512px";
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.justifyContent = "center";
      container.style.backgroundColor = "#ffffff";
      container.style.border = "1px solid #e5e5e5";

      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      img.style.objectFit = "contain";

      container.appendChild(img);
      tempDiv.appendChild(container);

      await new Promise((resolve) => {
        img.onload = resolve as any;
        img.onerror = resolve as any;
        setTimeout(resolve, 5000);
      });

      if (img.complete && img.naturalHeight > 0) {
        const canvas = await html2canvas(container, {
          width: 512,
          height: 512,
          scale: 1,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", x, y, width, height);
        console.log("Image added to PDF successfully");
      } else {
        console.log("Image not loaded properly");
      }

      document.body.removeChild(tempDiv);
      return true;
    } catch (error) {
      console.error("Could not add image to PDF:", error);
      return false;
    }
  };

  // Add mockup or product image if available
  const imageUrl = item.mockup_url || item.product.image_url;

  if (imageUrl) {
    await addImageToPDF(imageUrl, 20, yPosition, 56, 56);
  }

  // Add selected product angle views if available
  if (data.selectedViews && data.selectedViews.length > 0) {
    const productId = item.product.id;
    const viewUrls: Record<string, string> = {
      front: `https://images.nwgmedia.com/preview/377113/${productId}_Miami_PRO_Roundneck_Front.jpg`,
      right: `https://images.nwgmedia.com/preview/386550/${productId}_MiamiPRORoundneck_grey_Right.jpg`,
      back: `https://images.nwgmedia.com/preview/386560/${productId}_MiamiPRORoundneck_grey_Back.jpg`,
      left: `https://images.nwgmedia.com/preview/386562/${productId}_MiamiPRORoundneck_grey_Left.jpg`
    };

    // Add a new page for product angles
    pdf.addPage();
    let angleYPosition = 20;

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Produktvinklar", 20, angleYPosition);
    angleYPosition += 15;

    // Display selected views in a grid
    const angleImagesPerRow = 2;
    const angleImageWidth = 80;
    const angleImageHeight = 80;
    const angleGap = 10;

    for (let i = 0; i < data.selectedViews.length; i++) {
      const view = data.selectedViews[i];
      const url = viewUrls[view];
      
      if (url) {
        const col = i % angleImagesPerRow;
        const row = Math.floor(i / angleImagesPerRow);
        const x = 20 + col * (angleImageWidth + angleGap);
        const y = angleYPosition + row * (angleImageHeight + angleGap + 10);

        await addImageToPDF(url, x, y, angleImageWidth, angleImageHeight);

        // Add label below image
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        const labels: Record<string, string> = {
          front: "Framsida",
          right: "Höger sida",
          back: "Baksida",
          left: "Vänster sida"
        };
        pdf.text(labels[view] || view, x + angleImageWidth / 2, y + angleImageHeight + 5, { align: "center" });
      }
    }
  }

  // Product details next to image
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text(item.product.name, 110, yPosition + 10);

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Artikelnummer: ${item.product.id}`, 110, yPosition + 20);
  if (item.product.category) {
    pdf.text(`Kategori: ${item.product.category}`, 110, yPosition + 27);
  }

  yPosition += 95;

  // Pricing table header
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Prissättning", 20, yPosition);
  yPosition += 10;

  // Table header with background
  pdf.setFillColor(240, 240, 240);
  pdf.rect(20, yPosition, pageWidth - 40, 8, "F");

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Artikelnummer", 25, yPosition + 5);
  pdf.text("Pris/st (inkl. moms)", 70, yPosition + 5);
  pdf.text("Antal", 125, yPosition + 5);
  pdf.text("Totalpris", 150, yPosition + 5);

  yPosition += 8;

  // Table content
  pdf.setFont("helvetica", "normal");
  const price = (item.product.price_ex_vat || 0) * 2; // 1:2 ratio
  const totalPrice = price * item.quantity;

  pdf.text(item.product.id, 25, yPosition + 5);
  pdf.text(`${price.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr`, 70, yPosition + 5);
  pdf.text(item.quantity.toString(), 125, yPosition + 5);
  pdf.text(`${totalPrice.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr`, 150, yPosition + 5);

  yPosition += 15;

  // Total section
  yPosition += 10;
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("TOTALT (inkl. moms):", 25, yPosition);
  pdf.text(`${totalPrice.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr`, 150, yPosition);

  // Terms
  yPosition += 25;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Villkor och bestämmelser:", 20, yPosition);
  yPosition += 7;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text("• Offerten gäller i 30 dagar från utställningsdatum", 20, yPosition);
  yPosition += 5;
  pdf.text("• Leveranstid: 2-3 veckor från godkänd beställning", 20, yPosition);
  yPosition += 5;
  pdf.text("• Betalningsvillkor: 30 dagar netto", 20, yPosition);
  yPosition += 5;
  pdf.text("• Alla priser anges inklusive moms där inget annat anges", 20, yPosition);

  // Save PDF
  const fileName = `Offert_${data.companyName.replace(/[^a-zA-Z0-9]/g, "_")}_${quoteNumber}.pdf`;
  pdf.save(fileName);

  // Also upload to Supabase Storage
  try {
    const pdfBlob = pdf.output("blob");
    const { supabase } = await import("@/integrations/supabase/client");

    const { data: uploadData, error } = await supabase.storage.from("Offers").upload(`${fileName}`, pdfBlob, {
      contentType: "application/pdf",
    });

    if (error) {
      console.error("Error uploading PDF to storage:", error);
    } else {
      console.log("PDF uploaded to storage:", uploadData);
    }
  } catch (error) {
    console.error("Error uploading PDF:", error);
  }
};
