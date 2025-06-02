// src/utils/generateOvertimePDF.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateOvertimePDF = ({
  title = "Overtime Report",
  headers = [],
  rows = [],
  filename = "Overtime_Report.pdf"
}) => {
  const doc = new jsPDF();

  // Watermark
  doc.setFontSize(50);
  doc.setTextColor(240);
  doc.text("TransitCrew", 35, 150, { angle: 45 });

  // Title
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(title, 14, 20);

  // Table
  autoTable(doc, {
    startY: 30,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [52, 73, 94],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 10,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  doc.save(filename);
};

export default generateOvertimePDF;
