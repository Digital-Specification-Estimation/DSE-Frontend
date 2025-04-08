"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetAttendanceQuery,
  useUpdateDailyAttendanceMutation,
} from "@/lib/redux/api";
import {
  getCurrentWeekDays,
  parseMonthAndYear,
  isToday,
} from "@/utils/date-utils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AttendanceCalendarProps {
  employeeId: number;
  currentMonth: string;
  onMonthChange: (month: string) => void;
}

export default function AttendanceCalendar({
  employeeId,
  currentMonth,
  onMonthChange,
}: AttendanceCalendarProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"1week" | "2weeks" | "month">(
    "1week"
  );
  const [calendarDays, setCalendarDays] = useState(getCurrentWeekDays());

  const { month, year } = parseMonthAndYear(currentMonth);

  const { data: attendanceData, isLoading } = useGetAttendanceQuery({
    month: currentMonth,
    employeeId,
  });

  const [updateDailyAttendance, { isLoading: isUpdating }] =
    useUpdateDailyAttendanceMutation();

  useEffect(() => {
    // Update the calendar days based on the view mode
    if (viewMode === "1week") {
      setCalendarDays(getCurrentWeekDays());
    } else {
      // For 2 weeks or month views, we would have different logic
      // For now, just showing current week for all modes
      setCalendarDays(getCurrentWeekDays());
    }
  }, [viewMode]);

  const handleAttendanceChange = async (
    date: string,
    status: "Present" | "Absent" | "Late"
  ) => {
    try {
      await updateDailyAttendance({
        employeeId,
        date,
        status,
      }).unwrap();

      toast({
        title: "Attendance Updated",
        description: `Marked as ${status} for ${new Date(
          date
        ).getDate()} ${month}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusForDay = (dateString: string) => {
    if (!attendanceData) return "Present"; // Default

    const attendance = attendanceData.find(
      (a: any) => a.date === dateString && a.employeeId === employeeId
    );

    return attendance?.status || "Present";
  };

  const handlePreviousMonth = () => {
    // Logic to navigate to previous month
    const { month, year } = parseMonthAndYear(currentMonth);
    const date = new Date(`${month} 1, ${year}`);
    date.setMonth(date.getMonth() - 1);
    const newMonth = date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    onMonthChange(newMonth);
  };

  const handleNextMonth = () => {
    // Logic to navigate to next month
    const { month, year } = parseMonthAndYear(currentMonth);
    const date = new Date(`${month} 1, ${year}`);
    date.setMonth(date.getMonth() + 1);
    const newMonth = date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    onMonthChange(newMonth);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="border rounded-md bg-white p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{currentMonth}</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handlePreviousMonth}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleNextMonth}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
          </div>
        </div>
        <div>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <SelectTrigger className="h-8 w-32">
              <SelectValue placeholder="Show" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1week">1 Week</SelectItem>
              <SelectItem value="2weeks">2 Weeks</SelectItem>
              <SelectItem value="month">Full Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-4">
        {calendarDays.map((day: any, index: any) => {
          const status = getStatusForDay(day.date);
          const isCurrentDay = isToday(day.date);

          return (
            <div
              key={index}
              className={`text-center ${
                isCurrentDay ? "bg-orange-50 rounded-md p-1" : ""
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {day.day < 10 ? `0${day.day}` : day.day}
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                {day.weekday}
              </div>
              <div className="flex flex-col gap-1">
                <Badge
                  className={
                    status === "Present"
                      ? "bg-green-50 text-green-700 border-0"
                      : status === "Late"
                      ? "bg-yellow-50 text-yellow-700 border-0"
                      : "bg-red-50 text-red-700 border-0"
                  }
                >
                  {status}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-transparent border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleAttendanceChange(day.date, "Late")}
                >
                  {isUpdating ? "..." : "Late"}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-transparent border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleAttendanceChange(day.date, "Absent")}
                >
                  {isUpdating ? "..." : "Absent"}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
