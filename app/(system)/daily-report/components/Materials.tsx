import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Package, Plus, Trash2 } from "lucide-react";

interface MaterialItem {
  description: string;
  unit: string;
  delivered: number;
  used: number;
  balance: number;
  supplier: string;
}

interface MaterialsProps {
  data: MaterialItem[];
  updateData: (data: MaterialItem[]) => void;
}

export function Materials({ data, updateData }: MaterialsProps) {
  const addMaterial = () => {
    updateData([
      ...data,
      {
        description: "",
        unit: "",
        delivered: 0,
        used: 0,
        balance: 0,
        supplier: "",
      },
    ]);
  };

  const removeMaterial = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    updateData(newData);
  };

  const updateMaterial = (
    index: number,
    field: keyof MaterialItem,
    value: string | number
  ) => {
    const newData = [...data];
    newData[index] = {
      ...newData[index],
      [field]: value,
    };

    // Auto-calculate balance when delivered or used changes
    if (field === "delivered" || field === "used") {
      const delivered =
        field === "delivered" ? Number(value) : newData[index].delivered;
      const used = field === "used" ? Number(value) : newData[index].used;
      newData[index].balance = delivered - used;
    }

    updateData(newData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-500" />
          Materials Delivered & Used
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg bg-gray-50"
            >
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor={`materialDesc-${index}`}>
                  Material Description
                </Label>
                <Input
                  id={`materialDesc-${index}`}
                  value={item.description}
                  onChange={(e) =>
                    updateMaterial(index, "description", e.target.value)
                  }
                  placeholder="e.g., Concrete C30/37, Steel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`unit-${index}`}>Unit</Label>
                <Input
                  id={`unit-${index}`}
                  value={item.unit}
                  onChange={(e) =>
                    updateMaterial(index, "unit", e.target.value)
                  }
                  placeholder="m³, tonnes, pcs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`delivered-${index}`}>Delivered</Label>
                <Input
                  id={`delivered-${index}`}
                  type="number"
                  step="0.01"
                  value={item.delivered || ""}
                  onChange={(e) =>
                    updateMaterial(
                      index,
                      "delivered",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`used-${index}`}>Used</Label>
                <Input
                  id={`used-${index}`}
                  type="number"
                  step="0.01"
                  value={item.used || ""}
                  onChange={(e) =>
                    updateMaterial(
                      index,
                      "used",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`balance-${index}`}>Balance</Label>
                <Input
                  id={`balance-${index}`}
                  type="number"
                  step="0.01"
                  value={item.balance || ""}
                  readOnly
                  className="bg-yellow-50 font-semibold"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor={`supplier-${index}`}>Supplier</Label>
                <Input
                  id={`supplier-${index}`}
                  value={item.supplier}
                  onChange={(e) =>
                    updateMaterial(index, "supplier", e.target.value)
                  }
                  placeholder="Supplier name"
                />
              </div>

              <div className="flex items-end md:col-span-4">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeMaterial(index)}
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
            onClick={addMaterial}
            className="w-full border-dashed border-2 hover:border-blue-500 hover:text-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Material Entry
          </Button>

          {data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>
                No materials recorded yet. Click "Add Material Entry" to get
                started.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
