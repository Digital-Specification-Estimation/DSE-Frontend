"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          "https://dse-backend-uv5d.onrender.com/auth/session"
        );
        const session = await response.json();

        if (!session?.user) {
          router.push("/sign-in");
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/sign-in');
      }
    };

    checkAuth();
  }, [router]); 

  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm text-gray-500">Loading data...</p>
      </div>
    </div>
  );
}