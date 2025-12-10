import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Truck, Plus, Trash2 } from "lucide-react";

interface EquipmentItem {
  type: string;
  qty: number;
  hours: number;
  notes: string;
}

interface EquipmentProps {
  data: EquipmentItem[];
  updateData: (data: EquipmentItem[]) => void;
}

export function Equipment({ data, updateData }: EquipmentProps) {
  const addEquipment = () => {
    updateData([...data, { type: "", qty: 0, hours: 0, notes: "" }]);
  };

  const removeEquipment = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    updateData(newData);
  };

  const updateEquipment = (
    index: number,
    field: keyof EquipmentItem,
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
          <Truck className="h-5 w-5 text-yellow-500" />
          Equipment Used
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg bg-gray-50"
            >
              <div className="space-y-2">
                <Label htmlFor={`equipmentType-${index}`}>Equipment Type</Label>
                <Input
                  id={`equipmentType-${index}`}
                  value={item.type}
                  onChange={(e) =>
                    updateEquipment(index, "type", e.target.value)
                  }
                  placeholder="e.g., Excavator, Crane, Pump"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`qty-${index}`}>Quantity</Label>
                <Input
                  id={`qty-${index}`}
                  type="number"
                  min="1"
                  value={item.qty || ""}
                  onChange={(e) =>
                    updateEquipment(index, "qty", parseInt(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`hours-${index}`}>Hours Used</Label>
                <Input
                  id={`hours-${index}`}
                  type="number"
                  step="0.5"
                  min="0"
                  value={item.hours || ""}
                  onChange={(e) =>
                    updateEquipment(
                      index,
                      "hours",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`notes-${index}`}>Status/Notes</Label>
                <Input
                  id={`notes-${index}`}
                  value={item.notes}
                  onChange={(e) =>
                    updateEquipment(index, "notes", e.target.value)
                  }
                  placeholder="Equipment status or notes"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeEquipment(index)}
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
            onClick={addEquipment}
            className="w-full border-dashed border-2 hover:border-yellow-500 hover:text-yellow-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment Entry
          </Button>

          {data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>
                No equipment entries yet. Click "Add Equipment Entry" to get
                started.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
