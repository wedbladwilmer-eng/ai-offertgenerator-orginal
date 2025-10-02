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
  
  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('OFFERT', pageWidth / 2, 20, { align: 'center' });
  
  // Date and quote number
  const today = new Date().toLocaleDateString('sv-SE');
  const quoteNumber = `OFF-${Date.now().toString().slice(-6)}`;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Datum: ${today}`, 20, 35);
  pdf.text(`Offertnummer: ${quoteNumber}`, 20, 40);
  
  // Customer info
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Kund:', 20, 55);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.companyName, 20, 62);
  pdf.text(data.customerName, 20, 69);
  
  let yPosition = 85;
  
  // Products header
  pdf.setFont('helvetica', 'bold');
  pdf.text('Produkter:', 20, yPosition);
  yPosition += 10;
  
  // Table headers
  pdf.setFontSize(10);
  pdf.text('Art.nr', 20, yPosition);
  pdf.text('Produkt', 45, yPosition);
  pdf.text('Antal', 120, yPosition);
  pdf.text('Pris/st', 140, yPosition);
  pdf.text('Summa', 170, yPosition);
  
  yPosition += 5;
  pdf.line(20, yPosition, pageWidth - 20, yPosition); // Header line
  yPosition += 10;
  
  // Products
  pdf.setFont('helvetica', 'normal');
  for (const item of data.quote) {
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 20;
    }
    
    const price = item.product.price_ex_vat || 0;
    const sum = price * item.quantity;
    
    pdf.text(item.product.id, 20, yPosition);
    
    // Handle long product names
    const productName = item.product.name;
    if (productName.length > 30) {
      const lines = pdf.splitTextToSize(productName, 70);
      pdf.text(lines[0], 45, yPosition);
      if (lines.length > 1) {
        yPosition += 5;
        pdf.text(lines[1], 45, yPosition);
      }
    } else {
      pdf.text(productName, 45, yPosition);
    }
    
    pdf.text(item.quantity.toString(), 120, yPosition);
    pdf.text(`${price.toLocaleString('sv-SE')} kr`, 140, yPosition);
    pdf.text(`${sum.toLocaleString('sv-SE')} kr`, 170, yPosition);
    
    yPosition += 15;
    
    // Add mockup image if available
    if (item.mockup_url) {
      try {
        // Create temporary div for image loading
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
          img.onerror = reject;
          setTimeout(reject, 5000); // 5 second timeout
        });
        
        const canvas = await html2canvas(img, {
          width: 200,
          height: 200,
          scale: 1
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.addImage(imgData, 'PNG', 45, yPosition, 40, 40);
        yPosition += 45;
        
        document.body.removeChild(tempDiv);
      } catch (error) {
        console.log('Could not add mockup image to PDF:', error);
        // Continue without image
      }
    }
  }
  
  // Total section
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = 20;
  }
  
  yPosition += 10;
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text('Totalt (exkl. moms):', 120, yPosition);
  pdf.text(`${data.total.toLocaleString('sv-SE')} kr`, 170, yPosition);
  yPosition += 7;
  
  pdf.text('Moms (25%):', 120, yPosition);
  pdf.text(`${(data.totalWithVat - data.total).toLocaleString('sv-SE')} kr`, 170, yPosition);
  yPosition += 7;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTALT (inkl. moms):', 120, yPosition);
  pdf.text(`${data.totalWithVat.toLocaleString('sv-SE')} kr`, 170, yPosition);
  
  // Terms
  yPosition += 20;
  if (yPosition > pageHeight - 40) {
    pdf.addPage();
    yPosition = 20;
  }
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Villkor:', 20, yPosition);
  yPosition += 5;
  pdf.text('• Offerten gäller i 30 dagar från datum', 20, yPosition);
  yPosition += 4;
  pdf.text('• Leveranstid: 2-3 veckor från godkänd order', 20, yPosition);
  yPosition += 4;
  pdf.text('• Betalningsvillkor: 30 dagar netto', 20, yPosition);
  
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