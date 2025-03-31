import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In a real implementation, this would fetch data from a database
    const locations = [
      { id: 1, name: "Main Office" },
      { id: 2, name: "Site A" },
      { id: 3, name: "Site B" },
      { id: 4, name: "Site C" },
    ]

    return NextResponse.json(locations)
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: "Location name is required" }, { status: 400 })
    }

    // In a real implementation, this would create a new location in the database
    const newLocation = {
      id: Math.floor(Math.random() * 1000),
      name,
    }

    return NextResponse.json({
      message: "Location created successfully",
      location: newLocation,
    })
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
  }
}

