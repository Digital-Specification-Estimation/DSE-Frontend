import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";

interface DelayItem {
  description: string;
  impact: string;
  duration: number;
  action: string;
}

interface DelaysProps {
  data: DelayItem[];
  updateData: (data: DelayItem[]) => void;
}

export function Delays({ data, updateData }: DelaysProps) {
  const addDelay = () => {
    updateData([
      ...data,
      { description: "", impact: "Low", duration: 0, action: "" },
    ]);
  };

  const removeDelay = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    updateData(newData);
  };

  const updateDelay = (
    index: number,
    field: keyof DelayItem,
    value: string | number
  ) => {
    const newData = [...data];
    newData[index] = {
      ...newData[index],
      [field]: value,
    };
    updateData(newData);
  };

  const impactLevels = ["Low", "Medium", "High", "Critical"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Delays & Issues
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg bg-gray-50"
            >
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor={`delayDesc-${index}`}>
                  Issue/Delay Description
                </Label>
                <Input
                  id={`delayDesc-${index}`}
                  value={item.description}
                  onChange={(e) =>
                    updateDelay(index, "description", e.target.value)
                  }
                  placeholder="Describe the issue or delay"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`delayImpact-${index}`}>Impact Level</Label>
                <Select
                  value={item.impact}
                  onValueChange={(value) => updateDelay(index, "impact", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    {impactLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`delayDuration-${index}`}>
                  Duration (hours)
                </Label>
                <Input
                  id={`delayDuration-${index}`}
                  type="number"
                  step="0.5"
                  min="0"
                  value={item.duration || ""}
                  onChange={(e) =>
                    updateDelay(
                      index,
                      "duration",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`delayAction-${index}`}>
                  Resolution/Action
                </Label>
                <Input
                  id={`delayAction-${index}`}
                  value={item.action}
                  onChange={(e) => updateDelay(index, "action", e.target.value)}
                  placeholder="Action taken or planned"
                />
              </div>

              <div className="flex items-end md:col-span-5">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeDelay(index)}
                  className="ml-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addDelay}
            className="w-full border-dashed border-2 hover:border-red-500 hover:text-red-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Delay/Issue Entry
          </Button>

          {data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>
                No delays or issues recorded yet. Click "Add Delay/Issue Entry"
                to get started.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
