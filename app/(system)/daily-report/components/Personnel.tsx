import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Users, Plus, Trash2 } from "lucide-react";

interface PersonnelItem {
  trade: string;
  count: number;
  company: string;
}

interface PersonnelProps {
  data: PersonnelItem[];
  updateData: (data: PersonnelItem[]) => void;
}

export function Personnel({ data, updateData }: PersonnelProps) {
  const addPersonnel = () => {
    updateData([...data, { trade: "", count: 0, company: "" }]);
  };

  const removePersonnel = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    updateData(newData);
  };

  const updatePersonnel = (
    index: number,
    field: keyof PersonnelItem,
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
          <Users className="h-5 w-5 text-green-500" />
          Personnel on Site
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50"
            >
              <div className="space-y-2">
                <Label htmlFor={`trade-${index}`}>Trade/Category</Label>
                <Input
                  id={`trade-${index}`}
                  value={item.trade}
                  onChange={(e) =>
                    updatePersonnel(index, "trade", e.target.value)
                  }
                  placeholder="e.g., Carpenters, Electricians"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`count-${index}`}>Number of Workers</Label>
                <Input
                  id={`count-${index}`}
                  type="number"
                  min="1"
                  value={item.count || ""}
                  onChange={(e) =>
                    updatePersonnel(
                      index,
                      "count",
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`company-${index}`}>Contractor/Company</Label>
                <Input
                  id={`company-${index}`}
                  value={item.company}
                  onChange={(e) =>
                    updatePersonnel(index, "company", e.target.value)
                  }
                  placeholder="Company name"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removePersonnel(index)}
                  className="w-full"
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
            onClick={addPersonnel}
            className="w-full border-dashed border-2 hover:border-green-500 hover:text-green-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Personnel Entry
          </Button>

          {data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>
                No personnel entries yet. Click "Add Personnel Entry" to get
                started.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
