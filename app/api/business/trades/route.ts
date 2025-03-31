import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In a real implementation, this would fetch data from a database
    const trades = [
      { id: 1, name: "Electricians", location: "Main Office", dailyRate: 120, icon: "⚡" },
      { id: 2, name: "Technicians", location: "Site A", dailyRate: 100, icon: "🔧" },
      { id: 3, name: "HR & Admin", location: "Site B", dailyRate: 90, icon: "👨‍💼" },
      { id: 4, name: "Supervisors", location: "Site C", dailyRate: 120, icon: "👷" },
    ]

    return NextResponse.json(trades)
  } catch (error) {
    console.error("Error fetching trades:", error)
    return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, location, dailyRate } = body

    if (!name || !location || !dailyRate) {
      return NextResponse.json({ error: "Name, location, and daily rate are required" }, { status: 400 })
    }

    // Get icon based on trade name
    const getIconForTrade = (tradeName: string): string => {
      const tradeIcons: Record<string, string> = {
        Electricians: "⚡",
        Technicians: "🔧",
        "HR & Admin": "👨‍💼",
        Supervisors: "👷",
      }

      return tradeIcons[tradeName] || "👤"
    }

    // In a real implementation, this would create a new trade in the database
    const newTrade = {
      id: Math.floor(Math.random() * 1000),
      name,
      location,
      dailyRate: Number(dailyRate),
      icon: getIconForTrade(name),
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

