import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { QuoteItem } from '@/hooks/useProducts';

interface PDFData {
  quote: QuoteItem[];
  companyName: string;
  customerName: string;
  total: number;
  totalWithVat: number;
}

export const generatePDF = async (data: PDFData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Company logo at the top
  try {
    const logoUrl = 'https://media.licdn.com/dms/image/v2/D4D0BAQGdokXqiTIBuA/company-logo_200_200/company-logo_200_200/0/1734010375660/kosta_nada_profil_logo?e=2147483647&v=beta&t=jMm0VZG_jw7yztpxCfQUBhTUyNTqiYhiz-s_o8az0cw';
    
    // Create temporary div for logo loading
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    const logoImg = document.createElement('img');
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = logoUrl;
    tempDiv.appendChild(logoImg);
    
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = resolve; // Continue even if logo fails
      setTimeout(resolve, 3000); // 3 second timeout
    });
    
    if (logoImg.complete) {
      const logoCanvas = await html2canvas(logoImg, {
        width: 100,
        height: 100,
        scale: 1
      });
      
      const logoData = logoCanvas.toDataURL('image/png');
      pdf.addImage(logoData, 'PNG', 20, 15, 20, 20);
    }
    
    document.body.removeChild(tempDiv);
  } catch (error) {
    console.log('Could not add company logo to PDF:', error);
  }
  
  // Company name next to logo
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Kosta Nada Profil AB', 45, 25);
  
  // Header
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('OFFERT', pageWidth / 2, 50, { align: 'center' });
  
  // Date and quote number
  const today = new Date().toLocaleDateString('sv-SE');
  const quoteNumber = `OFF-${Date.now().toString().slice(-6)}`;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Datum: ${today}`, pageWidth / 2 - 25, 60, { align: 'center' });
  pdf.text(`Offertnummer: ${quoteNumber}`, pageWidth / 2 + 25, 60, { align: 'center' });
  
  // Customer info
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Kund:', 20, 75);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.companyName, 20, 82);
  
  let yPosition = 100;
  
  // Product info and mockup image
  const item = data.quote[0];
  
  // Add mockup image if available
  if (item.mockup_url) {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.src = item.mockup_url;
      tempDiv.appendChild(img);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue even if image fails
        setTimeout(resolve, 5000);
      });
      
      if (img.complete) {
        const canvas = await html2canvas(img, {
          width: 600,
          height: 600,
          scale: 1
        });
        
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 20, yPosition, 80, 80);
      }
      
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.log('Could not add mockup image to PDF:', error);
    }
  }
  
  // Product details next to image
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(item.product.name, 110, yPosition + 10);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Artikelnummer: ${item.product.id}`, 110, yPosition + 20);
  if (item.product.category) {
    pdf.text(`Kategori: ${item.product.category}`, 110, yPosition + 27);
  }
  
  yPosition += 95;
  
  // Pricing table header
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Prissättning', 20, yPosition);
  yPosition += 10;
  
  // Table header with background
  pdf.setFillColor(240, 240, 240);
  pdf.rect(20, yPosition, pageWidth - 40, 8, 'F');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Artikelnummer', 25, yPosition + 5);
  pdf.text('Pris/st (inkl. moms)', 70, yPosition + 5);
  pdf.text('Antal', 125, yPosition + 5);
  pdf.text('Totalpris', 150, yPosition + 5);
  
  yPosition += 8;
  
  // Table content
  pdf.setFont('helvetica', 'normal');
  const price = (item.product.price_ex_vat || 0) * 2; // 1:2 ratio
  const totalPrice = price * item.quantity;
  
  pdf.text(item.product.id, 25, yPosition + 5);
  pdf.text(`${price.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr`, 70, yPosition + 5);
  pdf.text(item.quantity.toString(), 125, yPosition + 5);
  pdf.text(`${totalPrice.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr`, 150, yPosition + 5);
  
  yPosition += 15;
  
  // Total section
  yPosition += 10;
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTALT (inkl. moms):', 25, yPosition);
  pdf.text(`${totalPrice.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr`, 150, yPosition);
  
  // Terms
  yPosition += 25;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Villkor och bestämmelser:', 20, yPosition);
  yPosition += 7;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('• Offerten gäller i 30 dagar från utställningsdatum', 20, yPosition);
  yPosition += 5;
  pdf.text('• Leveranstid: 2-3 veckor från godkänd beställning', 20, yPosition);
  yPosition += 5;
  pdf.text('• Betalningsvillkor: 30 dagar netto', 20, yPosition);
  yPosition += 5;
  pdf.text('• Alla priser anges inklusive moms där inget annat anges', 20, yPosition);
  
  // Save PDF
  const fileName = `Offert_${data.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${quoteNumber}.pdf`;
  pdf.save(fileName);
  
  // Also upload to Supabase Storage
  try {
    const pdfBlob = pdf.output('blob');
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data: uploadData, error } = await supabase.storage
      .from('Offers')
      .upload(`${fileName}`, pdfBlob, {
        contentType: 'application/pdf'
      });
    
    if (error) {
      console.error('Error uploading PDF to storage:', error);
    } else {
      console.log('PDF uploaded to storage:', uploadData);
    }
  } catch (error) {
    console.error('Error uploading PDF:', error);
  }
};