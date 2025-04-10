import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: string;
    type: "increase" | "decrease";
    text?: string;
  };
  iconBackground?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  iconBackground = "bg-gray-900",
}: StatCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className={`${iconBackground} p-1.5 rounded-md`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold mb-2">{value}</div>
      {change && (
        <div className="flex items-center text-xs">
          <span
            className={
              change.type === "increase"
                ? "text-green-500 border border-green-500 rounded-md h-6 w-10 flex items-center justify-center bg-green-50"
                : "text-red-500 border border-red-500 rounded-md h-6 w-10 flex items-center justify-center bg-red-50"
            }
          >
            {change.type === "increase" ? "+" : ""}
            {change.value}
          </span>
          {change.text && (
            <span className="ml-1 text-muted-foreground">{change.text}</span>
          )}
        </div>
      )}
    </div>
  );
}
