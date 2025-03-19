import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In a real implementation, this would fetch data from a database
    const settings = {
      companySettings: {
        companyName: "Digital Specification Estimation",
        businessType: "Construction & Engineering",
        timeZone: "GMT+3",
        holidays: ["08 August 2024", "15 September 2024"],
        workHours: "08",
        workDays: "Days",
        weeklyWorkLimit: "40",
        overtimeRate: "1.5x after 40 hrs",
      },
      payrollSettings: {
        salaryCalculation: "Daily Rate",
        currency: "USD",
        payslipFormat: "PDF",
      },
      notificationSettings: {
        emailAlerts: true,
        reminder: false,
        deadline: true,
      },
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { companySettings, payrollSettings, notificationSettings } = body

    // Validate required fields
    if (!companySettings.companyName || !companySettings.businessType) {
      return NextResponse.json({ error: "Company name and business type are required" }, { status: 400 })
    }

    // In a real implementation, this would update the settings in the database

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: {
        companySettings,
        payrollSettings,
        notificationSettings,
      },
    })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

