import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In a real implementation, this would fetch data from a database
    const projects = [
      {
        id: 1,
        name: "Project A",
        location: "Site A",
        currency: "USD",
        startDate: "01-Mar-2025",
        endDate: "30-Sep-2025",
      },
      {
        id: 2,
        name: "Project B",
        location: "IT Main Office",
        currency: "USD",
        startDate: "15-Apr-2025",
        endDate: "15-Oct-2025",
      },
      {
        id: 3,
        name: "Project C",
        location: "Site B",
        currency: "USD",
        startDate: "01-Mar-2025",
        endDate: "30-Sep-2025",
      },
      {
        id: 4,
        name: "Project D",
        location: "Site C",
        currency: "USD",
        startDate: "15-Apr-2025",
        endDate: "15-Oct-2025",
      },
    ]

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, location, currency, startDate, endDate } = body

    if (!name || !location || !currency || !startDate || !endDate) {
      return NextResponse.json({ error: "All project fields are required" }, { status: 400 })
    }

    // In a real implementation, this would create a new project in the database
    const newProject = {
      id: Math.floor(Math.random() * 1000),
      name,
      location,
      currency,
      startDate,
      endDate,
    }

    return NextResponse.json({
      message: "Project created successfully",
      project: newProject,
    })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}

