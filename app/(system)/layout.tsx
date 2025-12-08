"use client";

import { Suspense, useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useSessionQuery } from "@/lib/redux/authSlice";
import { Loader2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // All hooks must be called unconditionally at the top level
  const {
    data: sessionData,
    isLoading,
    error,
  } = useSessionQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skip: false,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if the device is mobile on mount and on window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
    };

    // Check on mount
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(true); // Always show sidebar on desktop
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        isSidebarOpen &&
        !target.closest(".sidebar") &&
        !target.closest(".menu-button")
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen, isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Redirect to login if not authenticated (403 error or no session data)
  useEffect(() => {
    if (!isLoading && (error || !sessionData?.user)) {
      router.push("/login");
    }
  }, [isLoading, error, sessionData, router]);

  // Show loading state if data is being fetched or session is not available
  if (isLoading || !sessionData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "sidebar fixed md:static z-30 transform transition-transform duration-300 ease-in-out",
          isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
          "w-64 max-sm:w-fit h-full bg-white border-r border-gray-200",
          "md:translate-x-0" // Ensure sidebar is always visible on desktop
        )}
      >
        <Sidebar user={sessionData?.user} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <div className="flex items-center p-2 md:hidden">
          <button
            onClick={toggleSidebar}
            className="menu-button p-0 text-gray-600 hover:bg-gray-100 rounded-lg"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <DashboardHeader />
        <main className="flex-1 overflow-y-auto bg-white p-4 md:p-[40px]">
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
