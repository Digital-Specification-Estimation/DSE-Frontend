import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    console.log(`Updating salary for employee ${id}:`, body);

    // Forward the request to the backend
    const backendResponse = await fetch(
      `https://dse-backend-uv5d.onrender.com/employee/update-salary/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          // Forward any authentication headers if needed
          ...Object.fromEntries(
            Array.from(request.headers.entries()).filter(
              ([key]) =>
                key.toLowerCase().includes("authorization") ||
                key.toLowerCase().includes("cookie")
            )
          ),
        },
        body: JSON.stringify(body),
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error("Backend error:", errorText);
      return NextResponse.json(
        { error: "Failed to update employee salary" },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    console.log("Employee salary updated successfully:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating employee salary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
