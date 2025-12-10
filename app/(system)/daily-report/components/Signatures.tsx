import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PenTool, RotateCcw } from "lucide-react";
import { useRef, useEffect } from "react";

interface SignatureData {
  contractor: string;
  supervisor: string;
  contractorName: string;
  supervisorName: string;
}

interface ProgressData {
  notes: string;
  nextDay: string;
}

interface SignaturesProps {
  data: SignatureData;
  updateData: (data: SignatureData) => void;
  progressData: ProgressData;
  updateProgressData: (data: ProgressData) => void;
}

export function Signatures({
  data,
  updateData,
  progressData,
  updateProgressData,
}: SignaturesProps) {
  const contractorCanvasRef = useRef<HTMLCanvasElement>(null);
  const supervisorCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleChange = (field: keyof SignatureData, value: string) => {
    updateData({
      ...data,
      [field]: value,
    });
  };

  const handleProgressChange = (field: keyof ProgressData, value: string) => {
    updateProgressData({
      ...progressData,
      [field]: value,
    });
  };

  const setupCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      lastX = clientX - rect.left;
      lastY = clientY - rect.top;
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const currentX = clientX - rect.left;
      const currentY = clientY - rect.top;

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(currentX, currentY);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();

      lastX = currentX;
      lastY = currentY;

      // Save signature data
      const signatureData = canvas.toDataURL();
      if (canvas === contractorCanvasRef.current) {
        handleChange("contractor", signatureData);
      } else {
        handleChange("supervisor", signatureData);
      }
    };

    const stopDrawing = () => {
      isDrawing = false;
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("touchstart", startDrawing);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", stopDrawing);

    // Prevent scrolling when touching the canvas
    canvas.addEventListener("touchstart", (e) => e.preventDefault());
    canvas.addEventListener("touchend", (e) => e.preventDefault());
    canvas.addEventListener("touchmove", (e) => e.preventDefault());
  };

  const clearSignature = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    field: "contractor" | "supervisor"
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleChange(field, "");
  };

  useEffect(() => {
    if (contractorCanvasRef.current) {
      setupCanvas(contractorCanvasRef.current);
    }
    if (supervisorCanvasRef.current) {
      setupCanvas(supervisorCanvasRef.current);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Progress Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-indigo-500" />
            Progress Notes & Planning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="progressNotes">Today's Progress Summary</Label>
              <Textarea
                id="progressNotes"
                value={progressData.notes}
                onChange={(e) => handleProgressChange("notes", e.target.value)}
                placeholder="Summarize today's work progress, achievements, and key activities..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextDayPlan">Tomorrow's Work Plan</Label>
              <Textarea
                id="nextDayPlan"
                value={progressData.nextDay}
                onChange={(e) =>
                  handleProgressChange("nextDay", e.target.value)
                }
                placeholder="Outline planned activities and priorities for tomorrow..."
                rows={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signatures Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-indigo-500" />
            Signatures & Approval
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-700">
                Contractor Signature
              </h4>
              <div className="space-y-2">
                <Label htmlFor="contractorName">Contractor Name</Label>
                <Input
                  id="contractorName"
                  value={data.contractorName}
                  onChange={(e) =>
                    handleChange("contractorName", e.target.value)
                  }
                  placeholder="Enter contractor name"
                />
              </div>
              <div className="space-y-2">
                <Label>Digital Signature</Label>
                <div className="border-2 border-gray-300 rounded-lg bg-white">
                  <canvas
                    ref={contractorCanvasRef}
                    width={300}
                    height={150}
                    className="w-full h-32 cursor-crosshair"
                    style={{ touchAction: "none" }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    clearSignature(contractorCanvasRef, "contractor")
                  }
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear Signature
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-700">
                Supervisor Signature
              </h4>
              <div className="space-y-2">
                <Label htmlFor="supervisorName">Supervisor Name</Label>
                <Input
                  id="supervisorName"
                  value={data.supervisorName}
                  onChange={(e) =>
                    handleChange("supervisorName", e.target.value)
                  }
                  placeholder="Enter supervisor name"
                />
              </div>
              <div className="space-y-2">
                <Label>Digital Signature</Label>
                <div className="border-2 border-gray-300 rounded-lg bg-white">
                  <canvas
                    ref={supervisorCanvasRef}
                    width={300}
                    height={150}
                    className="w-full h-32 cursor-crosshair"
                    style={{ touchAction: "none" }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    clearSignature(supervisorCanvasRef, "supervisor")
                  }
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear Signature
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
