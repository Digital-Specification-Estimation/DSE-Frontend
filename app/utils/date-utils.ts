export function getCurrentMonth(): string {
  const date = new Date();
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function getCalendarDaysForMonth(
  month: string,
  year: string
): { day: number; weekday: string; date: string }[] {
  const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
  const daysInMonth = new Date(
    Number.parseInt(year),
    monthIndex + 1,
    0
  ).getDate();

  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(Number.parseInt(year), monthIndex, i);
    days.push({
      day: i,
      weekday: date.toLocaleString("en-US", { weekday: "short" }),
      date: date.toISOString().split("T")[0],
    });
  }

  return days;
}

export function getCurrentWeekDays(): {
  day: number;
  weekday: string;
  date: string;
}[] {
  const today = new Date();
  const currentDay = today.getDay();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1)); // Start from Monday

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push({
      day: date.getDate(),
      weekday: date.toLocaleString("en-US", { weekday: "short" }),
      date: date.toISOString().split("T")[0],
    });
  }

  return days;
}

export function isToday(dateString: string): boolean {
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function parseMonthAndYear(monthString: string): {
  month: string;
  year: string;
} {
  const [month, year] = monthString.split(" ");
  return { month, year };
}
