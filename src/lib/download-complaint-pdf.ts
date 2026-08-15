import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Renders the complaint document DOM node to a multi-page A4 PDF and downloads it.
 */
export async function downloadComplaintPdf(
  element: HTMLElement,
  fileName: string
): Promise<void> {
  // Wait a frame so fonts/layout settle
  await new Promise((r) => requestAnimationFrame(() => r(undefined)));

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/png", 1.0);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
  heightLeft -= contentHeight;

  while (heightLeft > 2) {
    position = margin - (imgHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= contentHeight;
  }

  const safeName = fileName.replace(/[^\w\-अ-ह\.]+/g, "_").slice(0, 80);
  pdf.save(safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`);
}
