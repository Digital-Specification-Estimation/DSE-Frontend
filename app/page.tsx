"use client";
import { useEffect } from "react";
import { redirect } from "next/navigation";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";

export default function Home() {
  useEffect(() => {
    // Check for the cookie on the client side
    const myCookie = Cookies.get("connect.sid");
    console.log(myCookie);
    if (!myCookie) {
      redirect("/sign-in");
    } else {
      redirect("/dashboard");
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm text-gray-500">Loading data...</p>
      </div>
    </div>
  );
}
