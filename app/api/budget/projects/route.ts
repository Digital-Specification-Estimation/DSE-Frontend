import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In a real implementation, this would fetch data from a database
    const projects = [
      {
        id: 1,
        name: "Project A",
        budget: 32000,
        isExpanded: true,
        trades: [
          {
            id: 1,
            role: "Electricians",
            icon: "⚡",
            employeesNumber: 10,
            workDays: 22,
            plannedSalary: 5000,
            actualCost: 5500,
          },
          {
            id: 2,
            role: "Technicians",
            icon: "🔧",
            employeesNumber: 8,
            workDays: 22,
            plannedSalary: 3200,
            actualCost: 4100,
          },
          {
            id: 3,
            role: "HR & Admin",
            icon: "👨‍💼",
            employeesNumber: 4,
            workDays: 22,
            plannedSalary: 4000,
            actualCost: 6500,
          },
          {
            id: 4,
            role: "Supervisors",
            icon: "👷",
            employeesNumber: 6,
            workDays: 22,
            plannedSalary: 6500,
            actualCost: 3700,
          },
        ],
      },
      {
        id: 2,
        name: "Project B",
        budget: 32000,
        isExpanded: false,
        trades: [
          {
            id: 5,
            role: "Electricians",
            icon: "⚡",
            employeesNumber: 8,
            workDays: 22,
            plannedSalary: 5000,
            actualCost: 4800,
          },
          {
            id: 6,
            role: "Technicians",
            icon: "🔧",
            employeesNumber: 6,
            workDays: 22,
            plannedSalary: 4200,
            actualCost: 4100,
          },
        ],
      },
    ]

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching budget projects:", error)
    return NextResponse.json({ error: "Failed to fetch budget projects" }, { status: 500 })
  }
}

