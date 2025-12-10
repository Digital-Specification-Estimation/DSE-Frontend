import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserCheck, Plus, Trash2 } from "lucide-react";

interface VisitorItem {
  name: string;
  company: string;
  purpose: string;
  timeIn: string;
}

interface VisitorsProps {
  data: VisitorItem[];
  updateData: (data: VisitorItem[]) => void;
}

export function Visitors({ data, updateData }: VisitorsProps) {
  const addVisitor = () => {
    updateData([...data, { name: "", company: "", purpose: "", timeIn: "" }]);
  };

  const removeVisitor = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    updateData(newData);
  };

  const updateVisitor = (
    index: number,
    field: keyof VisitorItem,
    value: string
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
          <UserCheck className="h-5 w-5 text-cyan-500" />
          Site Visitors
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
                <Label htmlFor={`visitorName-${index}`}>Visitor Name</Label>
                <Input
                  id={`visitorName-${index}`}
                  value={item.name}
                  onChange={(e) => updateVisitor(index, "name", e.target.value)}
                  placeholder="Full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`visitorCompany-${index}`}>Company</Label>
                <Input
                  id={`visitorCompany-${index}`}
                  value={item.company}
                  onChange={(e) =>
                    updateVisitor(index, "company", e.target.value)
                  }
                  placeholder="Company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`visitorPurpose-${index}`}>Purpose</Label>
                <Input
                  id={`visitorPurpose-${index}`}
                  value={item.purpose}
                  onChange={(e) =>
                    updateVisitor(index, "purpose", e.target.value)
                  }
                  placeholder="e.g., Inspection, Meeting"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`visitorTimeIn-${index}`}>Time In</Label>
                <Input
                  id={`visitorTimeIn-${index}`}
                  type="time"
                  value={item.timeIn}
                  onChange={(e) =>
                    updateVisitor(index, "timeIn", e.target.value)
                  }
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeVisitor(index)}
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
            onClick={addVisitor}
            className="w-full border-dashed border-2 hover:border-cyan-500 hover:text-cyan-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Visitor Entry
          </Button>

          {data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>
                No visitors recorded yet. Click "Add Visitor Entry" to get
                started.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
