import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const tradeId = params.id
    const body = await request.json()
    const { role, employeesNumber, workDays, plannedSalary } = body

    if (!role || !employeesNumber || !workDays || !plannedSalary) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // In a real implementation, this would update the trade in the database
    const updatedTrade = {
      id: Number(tradeId),
      role,
      employeesNumber: Number(employeesNumber),
      workDays: Number(workDays),
      plannedSalary: Number(plannedSalary),
    }

    return NextResponse.json({
      message: "Trade updated successfully",
      trade: updatedTrade,
    })
  } catch (error) {
    console.error("Error updating trade:", error)
    return NextResponse.json({ error: "Failed to update trade" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const tradeId = params.id

    // In a real implementation, this would delete the trade from the database

    return NextResponse.json({
      message: "Trade deleted successfully",
      id: Number(tradeId),
    })
  } catch (error) {
    console.error("Error deleting trade:", error)
    return NextResponse.json({ error: "Failed to delete trade" }, { status: 500 })
  }
}

