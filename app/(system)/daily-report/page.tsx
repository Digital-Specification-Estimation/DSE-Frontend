"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  Upload,
  Save,
  Printer,
  RefreshCw,
  Eye,
  Copy,
  FolderOpen,
  BarChart3,
} from "lucide-react";

// Import components
import { ProjectInfo } from "./components/ProjectInfo";
import { Weather } from "./components/Weather";
import { Personnel } from "./components/Personnel";
import { Equipment } from "./components/Equipment";
import { Activities } from "./components/Activities";
import { Materials } from "./components/Materials";
import { Visitors } from "./components/Visitors";
import { Delays } from "./components/Delays";
import { Safety } from "./components/Safety";
import { Signatures } from "./components/Signatures";
import { PhotoUpload } from "./components/PhotoUpload";
import { ReportExporter } from "./components/ExportUtils";

export interface ReportData {
  projectName: string;
  projectNumber: string;
  reportDate: string;
  reportBy: string;
  contractor: string;
  location: string;
  proposedStart: string;
  actualStart: string;
  proposedFinish: string;
  actualFinish: string;
  weather: {
    condition: string;
    temperature: string;
    windSpeed: string;
    workTime: string;
    impact: boolean;
  };
  personnel: Array<{
    trade: string;
    count: number;
    company: string;
  }>;
  equipment: Array<{
    type: string;
    qty: number;
    hours: number;
    notes: string;
  }>;
  activities: Array<{
    description: string;
    location: string;
    progress: number;
    crew: number;
  }>;
  materials: Array<{
    description: string;
    unit: string;
    delivered: number;
    used: number;
    balance: number;
    supplier: string;
  }>;
  visitors: Array<{
    name: string;
    company: string;
    purpose: string;
    timeIn: string;
  }>;
  delays: Array<{
    description: string;
    impact: string;
    duration: number;
    action: string;
  }>;
  safety: {
    inspections: string;
    incidents: string;
    quality: string;
  };
  progress: {
    notes: string;
    nextDay: string;
  };
  photos: string[];
  signatures: {
    contractor: string;
    supervisor: string;
    contractorName: string;
    supervisorName: string;
  };
  isLocked?: boolean;
  timestamp?: string;
}

export default function DailyReportPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reportData, setReportData] = useState<ReportData>({
    projectName: "",
    projectNumber: "",
    reportDate: new Date().toISOString().split("T")[0],
    reportBy: "",
    contractor: "",
    location: "",
    proposedStart: "",
    actualStart: "",
    proposedFinish: "",
    actualFinish: "",
    weather: {
      condition: "Sunny",
      temperature: "",
      windSpeed: "",
      workTime: "",
      impact: false,
    },
    personnel: [],
    equipment: [],
    activities: [],
    materials: [],
    visitors: [],
    delays: [],
    safety: {
      inspections: "",
      incidents: "",
      quality: "",
    },
    progress: {
      notes: "",
      nextDay: "",
    },
    photos: [],
    signatures: {
      contractor: "",
      supervisor: "",
      contractorName: "",
      supervisorName: "",
    },
  });

  const updateReportData = (section: keyof ReportData, data: any) => {
    setReportData((prev) => ({
      ...prev,
      [section]: data,
    }));
  };

  const saveReport = () => {
    try {
      const reportKey = `daily_report_${reportData.projectName}_${reportData.reportDate}`;
      localStorage.setItem(
        reportKey,
        JSON.stringify({
          ...reportData,
          timestamp: new Date().toISOString(),
        })
      );
      toast({
        title: "Report Saved",
        description: "Daily report has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportReport = () => {
    try {
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `daily_report_${reportData.projectName}_${reportData.reportDate}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Exported",
        description: "Report has been exported as JSON file.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report.",
        variant: "destructive",
      });
    }
  };

  const clearForm = () => {
    if (
      confirm("Are you sure you want to clear all data? This cannot be undone.")
    ) {
      setReportData({
        projectName: "",
        projectNumber: "",
        reportDate: new Date().toISOString().split("T")[0],
        reportBy: "",
        contractor: "",
        location: "",
        proposedStart: "",
        actualStart: "",
        proposedFinish: "",
        actualFinish: "",
        weather: {
          condition: "Sunny",
          temperature: "",
          windSpeed: "",
          workTime: "",
          impact: false,
        },
        personnel: [],
        equipment: [],
        activities: [],
        materials: [],
        visitors: [],
        delays: [],
        safety: {
          inspections: "",
          incidents: "",
          quality: "",
        },
        progress: {
          notes: "",
          nextDay: "",
        },
        photos: [],
        signatures: {
          contractor: "",
          supervisor: "",
          contractorName: "",
          supervisorName: "",
        },
      });
      toast({
        title: "Form Cleared",
        description: "All form data has been cleared.",
      });
    }
  };

  const importReport = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setReportData(data);
        toast({
          title: "Report Imported",
          description: "Report has been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to import report. Invalid file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const duplicateReport = () => {
    if (!reportData.projectName) {
      toast({
        title: "Error",
        description: "Please load a report first before duplicating.",
        variant: "destructive",
      });
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    setReportData((prev) => ({
      ...prev,
      reportDate: tomorrow.toISOString().split("T")[0],
      signatures: {
        contractor: "",
        supervisor: "",
        contractorName: "",
        supervisorName: "",
      },
      progress: {
        notes: prev.progress.nextDay || "",
        nextDay: "",
      },
      timestamp: new Date().toISOString(),
    }));

    toast({
      title: "Report Duplicated",
      description: "Report duplicated for next day. Update details as needed.",
    });
  };

  const exportToPDF = async () => {
    if (!reportData.projectName) {
      toast({
        title: "Error",
        description: "Please fill in project information before exporting.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Generating PDF...",
      description: "Please wait while we generate your PDF report.",
    });

    const result = await ReportExporter.exportToPDF(reportData);

    if (result.success) {
      toast({
        title: "PDF Export Successful",
        description: `Report exported as ${result.fileName}`,
      });
    } else {
      toast({
        title: "Export Failed",
        description: result.error || "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  const exportToWord = async () => {
    if (!reportData.projectName) {
      toast({
        title: "Error",
        description: "Please fill in project information before exporting.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Generating Word Document...",
      description: "Please wait while we generate your Word document.",
    });

    const result = await ReportExporter.exportToWord(reportData);

    if (result.success) {
      toast({
        title: "Word Export Successful",
        description: `Report exported as ${result.fileName}`,
      });
    } else {
      toast({
        title: "Export Failed",
        description: result.error || "Failed to export Word document",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">
              Construction Site Daily Report
            </h1>
            <p className="text-orange-100">
              Professional Construction Management System
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3 p-4 bg-white rounded-lg border">
        <Button onClick={saveReport} className="gap-2">
          <Save className="h-4 w-4" />
          Save Report
        </Button>
        <Button variant="outline" onClick={exportReport} className="gap-2">
          <Download className="h-4 w-4" />
          Export JSON
        </Button>
        <Button variant="outline" onClick={importReport} className="gap-2">
          <Upload className="h-4 w-4" />
          Import JSON
        </Button>
        <Button variant="outline" onClick={duplicateReport} className="gap-2">
          <Copy className="h-4 w-4" />
          Duplicate Report
        </Button>
        <Button
          variant="outline"
          onClick={exportToPDF}
          className="gap-2 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
        >
          <FileText className="h-4 w-4" />
          Export PDF
        </Button>
        <Button
          variant="outline"
          onClick={exportToWord}
          className="gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
        >
          <FileText className="h-4 w-4" />
          Export Word
        </Button>
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          Print Report
        </Button>
        <Button variant="outline" onClick={clearForm} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Clear Form
        </Button>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileImport}
      />

      {/* Form Sections */}
      <div className="space-y-6">
        <ProjectInfo data={reportData} updateData={updateReportData} />

        <Weather
          data={reportData.weather}
          updateData={(data) => updateReportData("weather", data)}
        />

        <Personnel
          data={reportData.personnel}
          updateData={(data) => updateReportData("personnel", data)}
        />

        <Equipment
          data={reportData.equipment}
          updateData={(data) => updateReportData("equipment", data)}
        />

        <Activities
          data={reportData.activities}
          updateData={(data) => updateReportData("activities", data)}
        />

        <Materials
          data={reportData.materials}
          updateData={(data) => updateReportData("materials", data)}
        />

        <Visitors
          data={reportData.visitors}
          updateData={(data) => updateReportData("visitors", data)}
        />

        <Delays
          data={reportData.delays}
          updateData={(data) => updateReportData("delays", data)}
        />

        <Safety
          data={reportData.safety}
          updateData={(data) => updateReportData("safety", data)}
        />

        <PhotoUpload
          photos={reportData.photos}
          updatePhotos={(photos) => updateReportData("photos", photos)}
        />

        <Signatures
          data={reportData.signatures}
          updateData={(data) => updateReportData("signatures", data)}
          progressData={reportData.progress}
          updateProgressData={(data) => updateReportData("progress", data)}
        />

        {/* Bottom Action Bar - Export & Save */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 rounded-lg">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold mb-2">Export Your Report</h3>
            <p className="text-orange-100">
              Generate professional documents for sharing and archiving
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={saveReport}
              className="gap-2 bg-white text-orange-600 hover:bg-orange-50 border-0"
            >
              <Save className="h-4 w-4" />
              Save Report
            </Button>

            <Button
              onClick={exportToPDF}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white border-0"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>

            <Button
              onClick={exportToWord}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0"
            >
              <FileText className="h-4 w-4" />
              Export Word
            </Button>

            <Button
              onClick={exportReport}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white border-0"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </Button>

            <Button
              onClick={() => window.print()}
              className="gap-2 bg-gray-600 hover:bg-gray-700 text-white border-0"
            >
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </div>

          <div className="text-center mt-4 text-orange-100 text-sm">
            <p>
              💡 Tip: Save your work regularly and export in your preferred
              format
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
