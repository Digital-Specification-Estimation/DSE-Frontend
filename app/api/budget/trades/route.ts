import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { role, employeesNumber, workDays, plannedSalary, projectId } = body

    if (!role || !employeesNumber || !workDays || !plannedSalary || !projectId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Get icon based on trade role
    const getIconForRole = (role: string): string => {
      switch (role) {
        case "Electricians":
          return "⚡"
        case "Technicians":
          return "🔧"
        case "HR & Admin":
          return "👨‍💼"
        case "Supervisors":
          return "👷"
        default:
          return "👤"
      }
    }

    // In a real implementation, this would create a new trade in the database
    const newTrade = {
      id: Math.floor(Math.random() * 1000),
      role,
      icon: getIconForRole(role),
      employeesNumber: Number(employeesNumber),
      workDays: Number(workDays),
      plannedSalary: Number(plannedSalary),
      actualCost: 0,
      projectId: Number(projectId),
    }

    return NextResponse.json({
      message: "Trade created successfully",
      trade: newTrade,
    })
  } catch (error) {
    console.error("Error creating trade:", error)
    return NextResponse.json({ error: "Failed to create trade" }, { status: 500 })
  }
}

