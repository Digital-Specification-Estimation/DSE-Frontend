import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Calendar, User, MapPin } from "lucide-react";
import { ReportData } from "../page";

interface ProjectInfoProps {
  data: ReportData;
  updateData: (section: keyof ReportData, data: any) => void;
}

export function ProjectInfo({ data, updateData }: ProjectInfoProps) {
  const handleChange = (field: string, value: string) => {
    updateData(field as keyof ReportData, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-orange-500" />
          Project Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              value={data.projectName}
              onChange={(e) => handleChange("projectName", e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectNumber">Project Number</Label>
            <Input
              id="projectNumber"
              value={data.projectNumber}
              onChange={(e) => handleChange("projectNumber", e.target.value)}
              placeholder="Enter project number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportDate">Report Date *</Label>
            <Input
              id="reportDate"
              type="date"
              value={data.reportDate}
              onChange={(e) => handleChange("reportDate", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportBy">Report By *</Label>
            <Input
              id="reportBy"
              value={data.reportBy}
              onChange={(e) => handleChange("reportBy", e.target.value)}
              placeholder="Enter reporter name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractor">Main Contractor</Label>
            <Input
              id="contractor"
              value={data.contractor}
              onChange={(e) => handleChange("contractor", e.target.value)}
              placeholder="Enter contractor name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={data.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Enter project location"
            />
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-500" />
            Project Timeline
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proposedStart">Proposed Start Date</Label>
              <Input
                id="proposedStart"
                type="date"
                value={data.proposedStart}
                onChange={(e) => handleChange("proposedStart", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualStart">Actual Start Date</Label>
              <Input
                id="actualStart"
                type="date"
                value={data.actualStart}
                onChange={(e) => handleChange("actualStart", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposedFinish">Proposed Finish Date</Label>
              <Input
                id="proposedFinish"
                type="date"
                value={data.proposedFinish}
                onChange={(e) => handleChange("proposedFinish", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualFinish">Actual Finish Date</Label>
              <Input
                id="actualFinish"
                type="date"
                value={data.actualFinish}
                onChange={(e) => handleChange("actualFinish", e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
