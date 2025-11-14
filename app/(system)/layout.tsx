"use client";

import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useSessionQuery } from "@/lib/redux/authSlice";
import { Loader2 } from "lucide-react";

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: sessionData, isLoading } = useSessionQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skip: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar user={sessionData?.user} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto bg-white p-4 md:p-6">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
