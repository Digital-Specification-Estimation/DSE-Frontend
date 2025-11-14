"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSessionQuery } from "@/lib/redux/authSlice";
import { useGetCompanyQuery } from "@/lib/redux/companySlice";
import { User, Mail, Building, Shield, Clock, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PendingApproval() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    data: sessionData,
    isLoading: isSessionLoading,
    refetch: refetchSession,
  } = useSessionQuery();
  const { data: companyData, isLoading: isCompanyLoading } = useGetCompanyQuery(
    sessionData?.user?.company_id || "3a0d273c-4567-40b4-85e9-80ea8d4c7b08"
  );

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    registrationDate: "",
    status: "pending",
  });

  useEffect(() => {
    console.log("Session Data:", sessionData);
    if (sessionData?.user) {
      const roleArray = Array.isArray(sessionData.user.role)
        ? sessionData.user.role
        : [];
      const role =
        roleArray.length > 0 ? roleArray[0].replace(/^{|}$/g, "") : "Employee";
      console.log("Role Array:", roleArray, "Processed Role:", role);

      setUserData({
        name: sessionData.user.username || "User",
        email: sessionData.user.email || "",
        company:
          companyData?.company_name ||
          sessionData.user.business_name ||
          "Unknown Company",
        role,
        registrationDate: sessionData.user.created_at
          ? new Date(sessionData.user.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
        status: sessionData.user.role_request_approval || "pending",
      });
    }
  }, [sessionData, companyData]);

  const handleRefreshStatus = async () => {
    try {
      await refetchSession();
      if (sessionData?.user?.role_request_approval === "APPROVED") {
        toast({
          title: "Role Approved",
          description:
            "Your role has been approved! Redirecting to dashboard...",
        });
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        toast({
          title: "Status Update",
          description: "Your role is still pending approval.",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to check role status. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isSessionLoading || isCompanyLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-sm text-gray-500">
              Loading your account information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <Clock className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Account Pending Approval
                </h3>
                <p className="text-yellow-700">
                  Your account is currently awaiting approval from your company
                  administrator. You will gain full access to the system once
                  your role request is approved.
                </p>
                <p className="text-yellow-700 text-sm mt-2">
                  Approvals typically take 24–48 hours. Please contact your
                  administrator if you have any concerns.
                </p>
              </div>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Your Information
              </CardTitle>
              <CardDescription>
                Account details and registration information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Full Name
                    </label>
                    <p className="text-lg font-semibold">{userData.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Email
                    </label>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {userData.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Company
                    </label>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      {userData.company}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Requested Role
                    </label>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      {userData.role}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Registration Date
                  </label>
                  <p className="text-lg font-semibold">
                    {userData.registrationDate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4 mt-6">
            <Button onClick={handleRefreshStatus}>Refresh Status</Button>
            <Button onClick={() => router.push("/")}>Back to Home</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
