import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In a real implementation, this would fetch data from a database
    const employees = [
      {
        id: 1,
        name: "Courtney Henry",
        avatar: "/placeholder.svg?height=40&width=40",
        position: "Electrician",
        assignedProject: "Metro Bridge",
        contractStartDate: "Feb 28, 2018",
        contractEndDate: "Feb 28, 2018",
        dailyRate: 120,
        accountNumber: "12345678",
      },
      {
        id: 2,
        name: "Annette Black",
        avatar: "/placeholder.svg?height=40&width=40",
        position: "Electrician",
        assignedProject: "Mall Construction",
        contractStartDate: "May 31, 2015",
        contractEndDate: "May 20, 2015",
        dailyRate: 120,
        accountNumber: "87654321",
      },
      {
        id: 3,
        name: "Kathryn Murphy",
        avatar: "/placeholder.svg?height=40&width=40",
        position: "HR Manager",
        assignedProject: "Metro Bridge",
        contractStartDate: "May 12, 2019",
        contractEndDate: "Nov 16, 2014",
        dailyRate: 200,
        accountNumber: "12345678",
      },
      // Additional employees would be here
    ]

    return NextResponse.json(employees)
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, position, assignedProject, startDate, endDate, accountNumber, dailyRate } = body

    if (!name || !position || !dailyRate) {
      return NextResponse.json({ error: "Name, position, and daily rate are required" }, { status: 400 })
    }

    // In a real implementation, this would create a new employee in the database
    const newEmployee = {
      id: Math.floor(Math.random() * 1000),
      name,
      avatar: "/placeholder.svg?height=40&width=40",
      position,
      assignedProject: assignedProject || "Unassigned",
      contractStartDate: startDate || "Not set",
      contractEndDate: endDate || "Not set",
      dailyRate: Number(dailyRate),
      accountNumber: accountNumber || "Not set",
    }

    return NextResponse.json({
      message: "Employee created successfully",
      employee: newEmployee,
    })
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 })
  }
}

