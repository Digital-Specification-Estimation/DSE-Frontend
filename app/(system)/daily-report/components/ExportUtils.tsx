import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  WidthType,
  AlignmentType,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";
import { ReportData } from "../page";

export class ReportExporter {
  static async exportToPDF(reportData: ReportData) {
    try {
      // Debug all data
      console.log("Export data debug:", {
        signatures: {
          contractor: reportData.signatures?.contractor ? "Present" : "Missing",
          supervisor: reportData.signatures?.supervisor ? "Present" : "Missing",
        },
        personnel: reportData.personnel
          ? `${reportData.personnel.length} items`
          : "Missing",
        activities: reportData.activities
          ? `${reportData.activities.length} items`
          : "Missing",
        materials: reportData.materials
          ? `${reportData.materials.length} items`
          : "Missing",
      });

      // Create PDF using jsPDF directly for better control
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = margin;

      // Helper function to check if we need a new page
      const checkNewPage = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
      };

      // Header
      pdf.setFillColor(255, 107, 53);
      pdf.rect(margin, yPosition, contentWidth, 25, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "CONSTRUCTION SITE DAILY REPORT",
        pageWidth / 2,
        yPosition + 15,
        { align: "center" }
      );
      yPosition += 35;

      // Project Information
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("PROJECT INFORMATION", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const projectInfo = [
        `Project Name: ${reportData.projectName || "N/A"}`,
        `Project Number: ${reportData.projectNumber || "N/A"}`,
        `Report Date: ${reportData.reportDate || "N/A"}`,
        `Reported By: ${reportData.reportBy || "N/A"}`,
        `Contractor: ${reportData.contractor || "N/A"}`,
        `Location: ${reportData.location || "N/A"}`,
      ];

      projectInfo.forEach((info, index) => {
        const x = index % 2 === 0 ? margin : margin + contentWidth / 2;
        const y = yPosition + Math.floor(index / 2) * 8;
        pdf.text(info, x, y);
      });
      yPosition += Math.ceil(projectInfo.length / 2) * 8 + 10;

      // Weather Conditions
      checkNewPage(30);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("WEATHER CONDITIONS", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const weatherInfo = [
        `Condition: ${reportData.weather?.condition || "N/A"}`,
        `Temperature: ${reportData.weather?.temperature || "N/A"}`,
        `Wind Speed: ${reportData.weather?.windSpeed || "N/A"}`,
        `Work Hours: ${reportData.weather?.workTime || "N/A"}`,
      ];

      weatherInfo.forEach((info, index) => {
        const x = index % 2 === 0 ? margin : margin + contentWidth / 2;
        const y = yPosition + Math.floor(index / 2) * 8;
        pdf.text(info, x, y);
      });
      yPosition += Math.ceil(weatherInfo.length / 2) * 8 + 10;

      // Personnel Table (always show, even if empty)
      checkNewPage(60);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("PERSONNEL ON SITE", margin, yPosition);
      yPosition += 15;

      if (reportData.personnel && reportData.personnel.length > 0) {
        // Table headers
        const colWidths = [60, 30, 100];
        const tableStartX = margin;
        let currentX = tableStartX;

        pdf.setFillColor(248, 249, 250);
        pdf.rect(
          currentX,
          yPosition,
          colWidths[0] + colWidths[1] + colWidths[2],
          8,
          "F"
        );

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text("Trade", currentX + 2, yPosition + 6);
        currentX += colWidths[0];
        pdf.text("Count", currentX + 2, yPosition + 6);
        currentX += colWidths[1];
        pdf.text("Company", currentX + 2, yPosition + 6);
        yPosition += 8;

        // Table rows
        pdf.setFont("helvetica", "normal");
        reportData.personnel.forEach((person) => {
          currentX = tableStartX;
          pdf.setDrawColor(221, 221, 221);
          pdf.rect(currentX, yPosition, colWidths[0], 8);
          pdf.text(person.trade, currentX + 2, yPosition + 6);

          currentX += colWidths[0];
          pdf.rect(currentX, yPosition, colWidths[1], 8);
          pdf.text(person.count.toString(), currentX + 2, yPosition + 6);

          currentX += colWidths[1];
          pdf.rect(currentX, yPosition, colWidths[2], 8);
          pdf.text(person.company, currentX + 2, yPosition + 6);

          yPosition += 8;
        });
      } else {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text("No personnel recorded", margin, yPosition);
        yPosition += 8;
      }
      yPosition += 10;

      // Activities Table (always show, even if empty)
      checkNewPage(60);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("WORK ACTIVITIES", margin, yPosition);
      yPosition += 15;

      if (reportData.activities && reportData.activities.length > 0) {
        // Table headers
        const colWidths = [70, 50, 30, 40];
        const tableStartX = margin;
        let currentX = tableStartX;

        pdf.setFillColor(248, 249, 250);
        pdf.rect(
          currentX,
          yPosition,
          colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
          8,
          "F"
        );

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text("Description", currentX + 2, yPosition + 6);
        currentX += colWidths[0];
        pdf.text("Location", currentX + 2, yPosition + 6);
        currentX += colWidths[1];
        pdf.text("Progress", currentX + 2, yPosition + 6);
        currentX += colWidths[2];
        pdf.text("Crew Size", currentX + 2, yPosition + 6);
        yPosition += 8;

        // Table rows
        pdf.setFont("helvetica", "normal");
        reportData.activities.forEach((activity) => {
          currentX = tableStartX;
          pdf.setDrawColor(221, 221, 221);

          pdf.rect(currentX, yPosition, colWidths[0], 8);
          const descLines = pdf.splitTextToSize(
            activity.description,
            colWidths[0] - 4
          );
          pdf.text(
            descLines[0] || activity.description,
            currentX + 2,
            yPosition + 6
          );

          currentX += colWidths[0];
          pdf.rect(currentX, yPosition, colWidths[1], 8);
          pdf.text(activity.location, currentX + 2, yPosition + 6);

          currentX += colWidths[1];
          pdf.rect(currentX, yPosition, colWidths[2], 8);
          pdf.text(`${activity.progress}%`, currentX + 2, yPosition + 6);

          currentX += colWidths[2];
          pdf.rect(currentX, yPosition, colWidths[3], 8);
          pdf.text(activity.crew.toString(), currentX + 2, yPosition + 6);

          yPosition += 8;
        });
      } else {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text("No activities recorded", margin, yPosition);
        yPosition += 8;
      }
      yPosition += 10;

      // Materials Table (always show, even if empty)
      checkNewPage(60);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("MATERIALS", margin, yPosition);
      yPosition += 15;

      if (reportData.materials && reportData.materials.length > 0) {
        // Table headers
        const colWidths = [50, 20, 25, 25, 25, 45];
        const tableStartX = margin;
        let currentX = tableStartX;

        pdf.setFillColor(248, 249, 250);
        pdf.rect(
          currentX,
          yPosition,
          colWidths.reduce((a, b) => a + b, 0),
          8,
          "F"
        );

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text("Description", currentX + 2, yPosition + 6);
        currentX += colWidths[0];
        pdf.text("Unit", currentX + 2, yPosition + 6);
        currentX += colWidths[1];
        pdf.text("Delivered", currentX + 2, yPosition + 6);
        currentX += colWidths[2];
        pdf.text("Used", currentX + 2, yPosition + 6);
        currentX += colWidths[3];
        pdf.text("Balance", currentX + 2, yPosition + 6);
        currentX += colWidths[4];
        pdf.text("Supplier", currentX + 2, yPosition + 6);
        yPosition += 8;

        // Table rows
        pdf.setFont("helvetica", "normal");
        reportData.materials.forEach((material) => {
          currentX = tableStartX;
          pdf.setDrawColor(221, 221, 221);

          pdf.rect(currentX, yPosition, colWidths[0], 8);
          const descLines = pdf.splitTextToSize(
            material.description,
            colWidths[0] - 4
          );
          pdf.text(
            descLines[0] || material.description,
            currentX + 2,
            yPosition + 6
          );

          currentX += colWidths[0];
          pdf.rect(currentX, yPosition, colWidths[1], 8);
          pdf.text(material.unit, currentX + 2, yPosition + 6);

          currentX += colWidths[1];
          pdf.rect(currentX, yPosition, colWidths[2], 8);
          pdf.text(material.delivered.toString(), currentX + 2, yPosition + 6);

          currentX += colWidths[2];
          pdf.rect(currentX, yPosition, colWidths[3], 8);
          pdf.text(material.used.toString(), currentX + 2, yPosition + 6);

          currentX += colWidths[3];
          pdf.rect(currentX, yPosition, colWidths[4], 8);
          pdf.text(material.balance.toString(), currentX + 2, yPosition + 6);

          currentX += colWidths[4];
          pdf.rect(currentX, yPosition, colWidths[5], 8);
          const supplierLines = pdf.splitTextToSize(
            material.supplier,
            colWidths[5] - 4
          );
          pdf.text(
            supplierLines[0] || material.supplier,
            currentX + 2,
            yPosition + 6
          );

          yPosition += 8;
        });
      } else {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text("No materials recorded", margin, yPosition);
        yPosition += 8;
      }
      yPosition += 10;

      // Safety & Quality
      checkNewPage(40);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("SAFETY & QUALITY", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Inspections: ${reportData.safety?.inspections || "None reported"}`,
        margin,
        yPosition
      );
      yPosition += 8;
      pdf.text(
        `Incidents: ${reportData.safety?.incidents || "None reported"}`,
        margin,
        yPosition
      );
      yPosition += 8;
      pdf.text(
        `Quality Issues: ${reportData.safety?.quality || "None reported"}`,
        margin,
        yPosition
      );
      yPosition += 15;

      // Progress Notes
      checkNewPage(50);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("PROGRESS NOTES", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("Today's Progress:", margin, yPosition);
      yPosition += 8;
      pdf.setFont("helvetica", "normal");
      const todayProgress =
        reportData.progress?.notes || "No progress notes recorded";
      const todayLines = pdf.splitTextToSize(todayProgress, contentWidth);
      pdf.text(todayLines, margin, yPosition);
      yPosition += todayLines.length * 6 + 10;

      pdf.setFont("helvetica", "bold");
      pdf.text("Tomorrow's Plan:", margin, yPosition);
      yPosition += 8;
      pdf.setFont("helvetica", "normal");
      const tomorrowPlan = reportData.progress?.nextDay || "No plans recorded";
      const tomorrowLines = pdf.splitTextToSize(tomorrowPlan, contentWidth);
      pdf.text(tomorrowLines, margin, yPosition);
      yPosition += tomorrowLines.length * 6 + 15;

      // Signatures Section
      checkNewPage(80);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("SIGNATURES", margin, yPosition);
      yPosition += 15;

      // Contractor Signature
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        `Contractor: ${reportData.signatures?.contractorName || "N/A"}`,
        margin,
        yPosition
      );
      yPosition += 8;

      // Draw signature box for contractor
      const signatureBoxHeight = 30;
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, yPosition, contentWidth / 2 - 5, signatureBoxHeight);

      // Add contractor signature if present
      if (
        reportData.signatures?.contractor &&
        reportData.signatures.contractor.length > 100
      ) {
        try {
          pdf.addImage(
            reportData.signatures.contractor,
            "PNG",
            margin + 2,
            yPosition + 2,
            contentWidth / 2 - 9,
            signatureBoxHeight - 4
          );
        } catch (error) {
          console.error("Error adding contractor signature:", error);
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text("Digital Signature Present", margin + 5, yPosition + 15);
          pdf.setTextColor(0, 0, 0);
        }
      } else {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text("No Signature", margin + 5, yPosition + 15);
        pdf.setTextColor(0, 0, 0);
      }

      // Supervisor Signature
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        `Supervisor: ${reportData.signatures?.supervisorName || "N/A"}`,
        margin + contentWidth / 2 + 5,
        yPosition - 8
      );

      // Draw signature box for supervisor
      pdf.rect(
        margin + contentWidth / 2 + 5,
        yPosition,
        contentWidth / 2 - 5,
        signatureBoxHeight
      );

      // Add supervisor signature if present
      if (
        reportData.signatures?.supervisor &&
        reportData.signatures.supervisor.length > 100
      ) {
        try {
          pdf.addImage(
            reportData.signatures.supervisor,
            "PNG",
            margin + contentWidth / 2 + 7,
            yPosition + 2,
            contentWidth / 2 - 9,
            signatureBoxHeight - 4
          );
        } catch (error) {
          console.error("Error adding supervisor signature:", error);
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text(
            "Digital Signature Present",
            margin + contentWidth / 2 + 10,
            yPosition + 15
          );
          pdf.setTextColor(0, 0, 0);
        }
      } else {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          "No Signature",
          margin + contentWidth / 2 + 10,
          yPosition + 15
        );
        pdf.setTextColor(0, 0, 0);
      }

      yPosition += signatureBoxHeight + 20;

      // Footer
      checkNewPage(20);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
      pdf.text(
        "Construction Site Daily Report - Professional Documentation System",
        pageWidth / 2,
        yPosition + 5,
        { align: "center" }
      );

      const fileName = `Daily_Report_${reportData.projectName || "Project"}_${
        reportData.reportDate
      }.pdf`;
      pdf.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error("PDF export error:", error);
      return {
        success: false,
        error: (error as Error).message || "Unknown error",
      };
    }
  }

  static async exportToWord(reportData: ReportData) {
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Header
              new Paragraph({
                children: [
                  new TextRun({
                    text: "CONSTRUCTION SITE DAILY REPORT",
                    bold: true,
                    size: 32,
                    color: "FF6B35",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),

              // Project Info Section
              new Paragraph({
                children: [
                  new TextRun({
                    text: "PROJECT INFORMATION",
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Project Name: ", bold: true }),
                  new TextRun({ text: reportData.projectName || "N/A" }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Project Number: ", bold: true }),
                  new TextRun({ text: reportData.projectNumber || "N/A" }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Report Date: ", bold: true }),
                  new TextRun({ text: reportData.reportDate || "N/A" }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Contractor: ", bold: true }),
                  new TextRun({ text: reportData.contractor || "N/A" }),
                ],
                spacing: { after: 200 },
              }),

              // Weather Section
              new Paragraph({
                children: [
                  new TextRun({
                    text: "WEATHER CONDITIONS",
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Condition: ", bold: true }),
                  new TextRun({ text: reportData.weather?.condition || "N/A" }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Temperature: ", bold: true }),
                  new TextRun({
                    text: reportData.weather?.temperature || "N/A",
                  }),
                ],
                spacing: { after: 200 },
              }),

              // Safety Section
              new Paragraph({
                children: [
                  new TextRun({
                    text: "SAFETY & QUALITY",
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Inspections: ", bold: true }),
                  new TextRun({
                    text: reportData.safety?.inspections || "None reported",
                  }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Incidents: ", bold: true }),
                  new TextRun({
                    text: reportData.safety?.incidents || "None reported",
                  }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Quality Issues: ", bold: true }),
                  new TextRun({
                    text: reportData.safety?.quality || "None reported",
                  }),
                ],
                spacing: { after: 200 },
              }),

              // Progress Notes
              new Paragraph({
                children: [
                  new TextRun({ text: "PROGRESS NOTES", bold: true, size: 24 }),
                ],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Today's Progress:", bold: true }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      reportData.progress?.notes ||
                      "No progress notes recorded",
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Tomorrow's Plan:", bold: true }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: reportData.progress?.nextDay || "No plans recorded",
                  }),
                ],
                spacing: { after: 200 },
              }),

              // Signatures
              new Paragraph({
                children: [
                  new TextRun({ text: "SIGNATURES", bold: true, size: 24 }),
                ],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Contractor: ", bold: true }),
                  new TextRun({
                    text: reportData.signatures?.contractorName || "N/A",
                  }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: reportData.signatures?.contractor
                      ? "[Digital Signature Present - Canvas signature data included]"
                      : "[No Signature]",
                    italics: true,
                    color: reportData.signatures?.contractor
                      ? "666666"
                      : "999999",
                  }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Supervisor: ", bold: true }),
                  new TextRun({
                    text: reportData.signatures?.supervisorName || "N/A",
                  }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: reportData.signatures?.supervisor
                      ? "[Digital Signature Present - Canvas signature data included]"
                      : "[No Signature]",
                    italics: true,
                    color: reportData.signatures?.supervisor
                      ? "666666"
                      : "999999",
                  }),
                ],
                spacing: { after: 200 },
              }),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      const fileName = `Daily_Report_${reportData.projectName || "Project"}_${
        reportData.reportDate
      }.docx`;
      saveAs(new Blob([buffer as BlobPart]), fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error("Word export error:", error);
      return {
        success: false,
        error: (error as Error).message || "Unknown error",
      };
    }
  }
}
