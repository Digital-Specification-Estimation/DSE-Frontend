import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Cloud, Thermometer, Wind, Clock } from "lucide-react";

interface WeatherData {
  condition: string;
  temperature: string;
  windSpeed: string;
  workTime: string;
  impact: boolean;
}

interface WeatherProps {
  data: WeatherData;
  updateData: (data: WeatherData) => void;
}

export function Weather({ data, updateData }: WeatherProps) {
  const handleChange = (field: keyof WeatherData, value: string | boolean) => {
    updateData({
      ...data,
      [field]: value,
    });
  };

  const weatherConditions = [
    "Sunny",
    "Partly Cloudy",
    "Cloudy",
    "Overcast",
    "Light Rain",
    "Heavy Rain",
    "Drizzle",
    "Snow",
    "Fog",
    "Windy",
    "Storm",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-blue-500" />
          Weather Conditions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weatherCondition">Weather Condition</Label>
            <Select
              value={data.condition}
              onValueChange={(value) => handleChange("condition", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select weather condition" />
              </SelectTrigger>
              <SelectContent>
                {weatherConditions.map((condition) => (
                  <SelectItem key={condition} value={condition}>
                    {condition}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature" className="flex items-center gap-1">
              <Thermometer className="h-4 w-4" />
              Temperature (°C)
            </Label>
            <Input
              id="temperature"
              type="number"
              value={data.temperature}
              onChange={(e) => handleChange("temperature", e.target.value)}
              placeholder="e.g., 25"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="windSpeed" className="flex items-center gap-1">
              <Wind className="h-4 w-4" />
              Wind Speed (km/h)
            </Label>
            <Input
              id="windSpeed"
              type="number"
              value={data.windSpeed}
              onChange={(e) => handleChange("windSpeed", e.target.value)}
              placeholder="e.g., 15"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workTime" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Working Hours
            </Label>
            <Input
              id="workTime"
              value={data.workTime}
              onChange={(e) => handleChange("workTime", e.target.value)}
              placeholder="e.g., 8:00 AM - 5:00 PM"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="weatherImpact"
              checked={data.impact}
              onCheckedChange={(checked) => handleChange("impact", !!checked)}
            />
            <Label
              htmlFor="weatherImpact"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Weather conditions impacted work progress
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
