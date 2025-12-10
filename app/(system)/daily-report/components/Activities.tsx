import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Trash2 } from "lucide-react";

interface ActivityItem {
  description: string;
  location: string;
  progress: number;
  crew: number;
}

interface ActivitiesProps {
  data: ActivityItem[];
  updateData: (data: ActivityItem[]) => void;
}

export function Activities({ data, updateData }: ActivitiesProps) {
  const addActivity = () => {
    updateData([
      ...data,
      { description: "", location: "", progress: 0, crew: 0 },
    ]);
  };

  const removeActivity = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    updateData(newData);
  };

  const updateActivity = (
    index: number,
    field: keyof ActivityItem,
    value: string | number
  ) => {
    const newData = [...data];
    newData[index] = {
      ...newData[index],
      [field]: value,
    };
    updateData(newData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-500" />
          Work Activities
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
                <Label htmlFor={`activityDesc-${index}`}>
                  Activity Description
                </Label>
                <Input
                  id={`activityDesc-${index}`}
                  value={item.description}
                  onChange={(e) =>
                    updateActivity(index, "description", e.target.value)
                  }
                  placeholder="Describe the work activity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`activityLocation-${index}`}>
                  Location/Area
                </Label>
                <Input
                  id={`activityLocation-${index}`}
                  value={item.location}
                  onChange={(e) =>
                    updateActivity(index, "location", e.target.value)
                  }
                  placeholder="Work location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`progress-${index}`}>Progress (%)</Label>
                <Input
                  id={`progress-${index}`}
                  type="number"
                  min="0"
                  max="100"
                  value={item.progress || ""}
                  onChange={(e) =>
                    updateActivity(
                      index,
                      "progress",
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`crew-${index}`}>Crew Size</Label>
                <Input
                  id={`crew-${index}`}
                  type="number"
                  min="1"
                  value={item.crew || ""}
                  onChange={(e) =>
                    updateActivity(index, "crew", parseInt(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>

              <div className="flex items-end md:col-span-5">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeActivity(index)}
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
            onClick={addActivity}
            className="w-full border-dashed border-2 hover:border-purple-500 hover:text-purple-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Activity Entry
          </Button>

          {data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>
                No activities recorded yet. Click "Add Activity Entry" to get
                started.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
