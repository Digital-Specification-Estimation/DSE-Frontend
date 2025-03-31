// app/api/register/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { businessName, adminName, email, password, agreeToTerms } = body;

    // Validate required fields
    if (!businessName || !adminName || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate terms agreement
    if (!agreeToTerms) {
      return NextResponse.json(
        { message: "You must agree to the terms and privacy policy" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Send registration data to NestJS backend
    const nestResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: adminName,
        email,
        password,
        businessName, // Make sure your CreateUserDto in NestJS includes this field
      }),
    });

    if (!nestResponse.ok) {
      const errorData = await nestResponse.json();
      return NextResponse.json(
        { message: errorData.message || "Registration failed" },
        { status: nestResponse.status }
      );
    }

    const responseData = await nestResponse.json();

    // If you want to automatically log the user in after registration
    const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: email, // Adjust based on your login requirements
        password,
      }),
    });

    if (!loginResponse.ok) {
      return NextResponse.json(responseData, { status: 200 });
    }

    const loginData = await loginResponse.json();

    return NextResponse.json({
      ...responseData,
      token: loginData.access_token, // Include the JWT token
    }, { status: 200 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
}