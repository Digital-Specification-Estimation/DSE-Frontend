import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In a real implementation, this would fetch data from a database
    const dashboardData = {
      summary: {
        totalEmployees: 120,
        attendanceToday: "92%",
        lateArrivals: 8,
        totalPayroll: "$25,000",
        employeeChange: "2.5%",
        attendanceChange: "3.2%",
        lateArrivalsChange: "1",
        payrollChange: "2.5%",
      },
      payrollData: [
        { month: "Jan", cost: 5000, planned: 5000 },
        { month: "Feb", cost: 6000, planned: 6000 },
        { month: "Mar", cost: 7000, planned: 7000 },
        { month: "Apr", cost: 8000, planned: 8000 },
        { month: "May", cost: 14000, planned: 14056, highlight: true },
        { month: "Jun", cost: 9000, planned: 9000 },
        { month: "Jul", cost: 10000, planned: 10000 },
        { month: "Aug", cost: 11000, planned: 11000 },
        { month: "Sep", cost: 12000, planned: 12000 },
        { month: "Oct", cost: 13000, planned: 13000 },
        { month: "Nov", cost: 14000, planned: 14000 },
        { month: "Dec", cost: 15000, planned: 15000 },
      ],
      attendanceData: [
        { day: 1, attendance: 10 },
        { day: 2, attendance: 35 },
        { day: 3, attendance: 40 },
        { day: 4, attendance: 25 },
        { day: 5, attendance: 35 },
        { day: 6, attendance: 30 },
        { day: 7, attendance: 60 },
        { day: 8, attendance: 45 },
        { day: 9, attendance: 55 },
        { day: 10, attendance: 95, highlight: true },
        { day: 11, attendance: 45 },
        { day: 12, attendance: 50 },
        { day: 13, attendance: 45 },
        { day: 14, attendance: 50 },
        { day: 15, attendance: 48 },
        { day: 16, attendance: 48 },
        { day: 17, attendance: 48 },
        { day: 18, attendance: 65 },
        { day: 19, attendance: 60 },
        { day: 20, attendance: 65 },
        { day: 21, attendance: 65 },
        { day: 22, attendance: 65 },
        { day: 23, attendance: 45 },
        { day: 24, attendance: 65 },
        { day: 25, attendance: 65 },
        { day: 26, attendance: 40 },
        { day: 27, attendance: 70 },
        { day: 28, attendance: 75 },
        { day: 29, attendance: 35 },
        { day: 30, attendance: 35 },
      ],
      employeeData: [
        {
          id: 1,
          position: "Construction Workers",
          plannedBudget: "$5,000",
          actualCost: "$5,500",
          difference: "$500",
          icon: "👷",
        },
        {
          id: 2,
          position: "Electricians",
          plannedBudget: "$4,200",
          actualCost: "$4,100",
          difference: "-$100",
          icon: "⚡",
        },
        {
          id: 3,
          position: "IT Staff",
          plannedBudget: "$6,000",
          actualCost: "$6,500",
          difference: "$500",
          icon: "💻",
        },
        {
          id: 4,
          position: "Admin Staff",
          plannedBudget: "$3,800",
          actualCost: "$3,700",
          difference: "-$100",
          icon: "👨‍💼",
        },
      ],
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}

