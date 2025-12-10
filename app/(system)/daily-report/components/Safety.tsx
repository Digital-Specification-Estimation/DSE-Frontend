import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";

interface SafetyData {
  inspections: string;
  incidents: string;
  quality: string;
}

interface SafetyProps {
  data: SafetyData;
  updateData: (data: SafetyData) => void;
}

export function Safety({ data, updateData }: SafetyProps) {
  const handleChange = (field: keyof SafetyData, value: string) => {
    updateData({
      ...data,
      [field]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-500" />
          Safety & Quality
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="safetyInspections">
              Safety Inspections Conducted
            </Label>
            <Textarea
              id="safetyInspections"
              value={data.inspections}
              onChange={(e) => handleChange("inspections", e.target.value)}
              placeholder="Describe safety inspections conducted today..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="incidents">Incidents & Near Misses</Label>
            <Textarea
              id="incidents"
              value={data.incidents}
              onChange={(e) => handleChange("incidents", e.target.value)}
              placeholder="Report any incidents, near misses, or safety concerns..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qualityIssues">
              Quality Issues & Corrective Actions
            </Label>
            <Textarea
              id="qualityIssues"
              value={data.quality}
              onChange={(e) => handleChange("quality", e.target.value)}
              placeholder="Document quality issues and corrective actions taken..."
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
