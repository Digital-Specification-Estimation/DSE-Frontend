"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Loader2,
  Plus,
  Building,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { useSignupMutation } from "@/lib/redux/authSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAddCompanyMutation,
  useGetCompaniesQuery,
  useDeleteCompanyMutation,
} from "@/lib/redux/companySlice";

export default function SignUp() {
  const [createCompany] = useAddCompanyMutation();
  const [deleteCompany] = useDeleteCompanyMutation();
  const { data: companiesFetched = [], refetch: refetchCompanies } =
    useGetCompaniesQuery();
  const [signup] = useSignupMutation();
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isCreatingNewCompany, setIsCreatingNewCompany] = useState(false);

  const [formData, setFormData] = useState({
    company_id: "",
    username: "",
    email: "",
    password: "",
    role: "EMPLOYEE", // Default to EMPLOYEE for existing companies
    agreeToTerms: false,
  });

  const [companyData, setCompanyData] = useState({
    company_name: "",
    business_type: "",
    standard_work_hours: "",
    weekly_work_limit: "",
    overtime_rate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleCompanyChange = (
    e: React.ChangeEvent<
      HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setCompanyData({
      ...companyData,
      [name]:
        name === "standard_work_hours" ||
        name === "weekly_work_limit" ||
        name === "overtime_rate"
          ? value
          : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate all required fields
      if (
        (!isCreatingNewCompany && !formData.company_id) ||
        !formData.username ||
        !formData.email ||
        !formData.password
      ) {
        throw new Error(
          isCreatingNewCompany
            ? "Please fill all required fields."
            : "Please select a company and fill all required fields."
        );
      }

      if (!formData.agreeToTerms) {
        throw new Error("You must agree to the terms");
      }

      let createdCompanyId: string | null = null;
      try {
        if (isCreatingNewCompany) {
          // Validate company data
          if (
            !companyData.company_name ||
            !companyData.business_type ||
            !companyData.standard_work_hours ||
            !companyData.weekly_work_limit ||
            !companyData.overtime_rate
          ) {
            throw new Error("Please fill all company details.");
          }

          // Create company
          const companyResponse = await createCompany({
            company_name: companyData.company_name,
            business_type: companyData.business_type,
            standard_work_hours: parseFloat(companyData.standard_work_hours),
            weekly_work_limit: parseFloat(companyData.weekly_work_limit),
            overtime_rate: parseFloat(companyData.overtime_rate),
          }).unwrap();
          createdCompanyId = companyResponse.id;
          if (!createdCompanyId) {
            throw new Error("Failed to create company");
          }
          await refetchCompanies(); // Refresh company list
        }

        // Map frontend role to backend role
        const roleMap: Record<string, string> = {
          ADMIN: "admin",
          HR_MANAGER: "hr_manager",
          DEPARTURE_MANAGER: "departure_manager",
          EMPLOYEE: "employee",
        };
        const userRole = isCreatingNewCompany
          ? "admin"
          : roleMap[formData.role] || "employee";

        // Perform signup
        const signupResponse = await signup({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          company_id: createdCompanyId || formData.company_id,
          role: userRole,
        }).unwrap();

        // Redirect to sign-in page
        toast({
          title: "Success",
          description: isCreatingNewCompany
            ? "Company and admin account created successfully!"
            : "Account created successfully! Please sign in.",
        });
        router.push("/sign-in");
      } catch (err) {
        // Rollback company creation if signup fails
        if (createdCompanyId) {
          try {
            await deleteCompany(createdCompanyId).unwrap();
            await refetchCompanies();
          } catch (deleteError) {
            console.error("Failed to rollback company creation:", deleteError);
          }
        }
        throw err;
      }
    } catch (err: any) {
      const errorMessage =
        err?.data?.message || err?.message || "Registration failed";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCompany = () => {
    // Validate company data before proceeding
    if (
      !companyData.company_name ||
      !companyData.business_type ||
      !companyData.standard_work_hours ||
      !companyData.weekly_work_limit ||
      !companyData.overtime_rate
    ) {
      toast({
        title: "Missing details",
        description: "Please fill all company details before continuing.",
        variant: "destructive",
      });
      return;
    }
    setIsCreatingNewCompany(true);
    setModalOpen(false);
    toast({
      title: "Company details saved",
      description:
        "Your company will be created together with your admin account.",
    });
  };

  const handleCompanySelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = e.target.value;
    setFormData({ ...formData, company_id: companyId });
    if (companyId) {
      setIsCreatingNewCompany(false);
    }
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 bg-white">
      <div className="flex flex-col items-center justify-center py-3 bg-white border">
        <div className="mb-8 mr-[400px]">
          <Logo />
        </div>
        <div className="mx-auto w-full px-20 space-y-6">
          <div className="space-y-2 flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold">Sign up to LCM</h1>
            <p className="text-muted-foreground">
              Smart Attendance & Payroll Management
            </p>
          </div>

          {isCreatingNewCompany && (
            <div className="bg-blue-100 text-blue-700 p-3 rounded mb-4 text-sm">
              <strong>Note:</strong> You are creating a new company. You will
              automatically become the admin of this company.
            </div>
          )}

          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="company_id" className="text-sm font-medium">
                Company
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Building className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    id="company_id"
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleCompanySelection}
                    className="w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required={!isCreatingNewCompany}
                    disabled={isLoading || isCreatingNewCompany}
                  >
                    <option value="">Select a company</option>
                    {companiesFetched.map((company: any) => (
                      <option key={company.id} value={company.id}>
                        {company.company_name}
                      </option>
                    ))}
                  </select>
                </div>
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-1"
                      disabled={isLoading}
                      onClick={() => setModalOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      New
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                      <DialogTitle>Create New Company</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-blue-700 text-sm">
                          <strong>Important:</strong> You will become the admin
                          of this company with full administrative privileges.
                        </p>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="company_name" className="text-right">
                          Company Name
                        </Label>
                        <Input
                          id="company_name"
                          name="company_name"
                          value={companyData.company_name}
                          onChange={handleCompanyChange}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="business_type" className="text-right">
                          Business Type
                        </Label>
                        <Input
                          id="business_type"
                          name="business_type"
                          value={companyData.business_type}
                          onChange={handleCompanyChange}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="standard_work_hours"
                          className="text-right"
                        >
                          Work Hours
                        </Label>
                        <Input
                          id="standard_work_hours"
                          name="standard_work_hours"
                          type="number"
                          value={companyData.standard_work_hours}
                          onChange={handleCompanyChange}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="weekly_work_limit"
                          className="text-right"
                        >
                          Weekly Limit
                        </Label>
                        <Input
                          id="weekly_work_limit"
                          name="weekly_work_limit"
                          type="number"
                          value={companyData.weekly_work_limit}
                          onChange={handleCompanyChange}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="overtime_rate" className="text-right">
                          Overtime Rate
                        </Label>
                        <Input
                          id="overtime_rate"
                          name="overtime_rate"
                          type="number"
                          step="0.1"
                          value={companyData.overtime_rate}
                          onChange={handleCompanyChange}
                          className="col-span-3"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCreateCompany}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Company Details"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                {isCreatingNewCompany ? "Admin Name" : "Full Name"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder={
                    isCreatingNewCompany
                      ? "Company Admin Name"
                      : "Your Full Name"
                  }
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="johnyenglish@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {!isCreatingNewCompany && (
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Role
                </label>
                <div className="relative">
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full pl-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  >
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="DEPARTURE_MANAGER">Departure Manager</option>
                    <option value="EMPLOYEE">Employee</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your role request will need approval from the company admin
                </p>
              </div>
            )}

            {isCreatingNewCompany && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <div className="bg-gray-100 p-3 rounded-md">
                  <p className="text-sm text-gray-700">
                    <strong>Admin</strong> (automatically assigned as company
                    creator)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    You will have full administrative privileges
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="flex items-center">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                required
                disabled={isLoading}
              />
              <label
                htmlFor="agreeToTerms"
                className="ml-2 block text-sm text-gray-600"
              >
                By signing up, you agree to our{" "}
                <Link
                  href="#"
                  className="text-primary hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    toast({
                      title: "Terms & Privacy",
                      description:
                        "Terms and Privacy Policy will be available soon.",
                    });
                  }}
                >
                  Terms & Privacy Policy
                </Link>
                .
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-primary text-white font-medium rounded-full hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isCreatingNewCompany
                    ? "Creating Company & Account..."
                    : "Creating Account..."}
                </>
              ) : isCreatingNewCompany ? (
                "Create Company & Sign Up"
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:block bg-blue-900 relative h-full m-3 mb-3 rounded-lg">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white py-5">
          <div className="w-full max-w-2xl max-h-xl mx-auto h-full px-5">
            <Image
              src="/home.png"
              alt="Dashboard Preview"
              width={600}
              height={600}
              className="h-2/3 rounded-lg shadow-lg mb-10"
            />
            <h2 className="text-3xl font-bold mb-4">
              Welcome to Digital Specification Estimation
            </h2>
            <p className="text-sm">
              A Smart Attendance & Payroll Management to track attendance,
              automate payroll, and optimize costs with ease!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
