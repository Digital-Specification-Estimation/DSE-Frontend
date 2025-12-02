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
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
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
    role: "EMPLOYEE",
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
      [name]: (name === "standard_work_hours" ||
        name === "weekly_work_limit" ||
        name === "overtime_rate")
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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 pt-[10px]">
        <div className="flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo className="h-12 w-auto" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create an Account</h1>
              <p className="text-gray-600">Join us to get started</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              {isCreatingNewCompany && (
                <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
                  <strong>Note:</strong> You are creating a new company. You will automatically become the admin of this company.
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-start">
                  <ShieldCheck className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="company_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="company_id"
                        name="company_id"
                        value={formData.company_id}
                        onChange={handleCompanySelection}
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-150 appearance-none bg-white"
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
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150"
                          disabled={isLoading}
                          onClick={(e) => {
                            e.preventDefault();
                            setModalOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          New
                        </button>
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

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    {isCreatingNewCompany ? "Admin Name" : "Full Name"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
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
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-150"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="johndoe@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-150"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {!isCreatingNewCompany && (
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ShieldCheck className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-150 appearance-none bg-white"
                        disabled={isLoading}
                      >
                        <option value="HR_MANAGER">HR Manager</option>
                        <option value="DEPARTURE_MANAGER">Department Manager</option>
                        <option value="EMPLOYEE">Employee</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Your role request will need approval from the company admin
                    </p>
                  </div>
                )}

                {isCreatingNewCompany && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <ShieldCheck className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Admin</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      You will be the admin of this company with full administrative privileges
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-150"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeToTerms" className="text-gray-600">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          toast({
                            title: "Terms & Privacy",
                            description: "Terms and Privacy Policy will be available soon.",
                          });
                        }}
                        className="font-medium text-orange-600 hover:text-orange-500"
                      >
                        Terms & Privacy Policy
                      </button>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-primary text-white font-medium rounded-full hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
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
        </div>

        <div className="hidden lg:block bg-blue-900 relative h-full m-3 mb-3 rounded-lg">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white py-5">
            <div className="w-full max-w-2xl max-h-xl mx-auto h-full px-5">
              <Image
                src="/home.png"
                alt="Dashboard Preview"
                width={600}
                height={600}
                className=" h-2/3 rounded-lg shadow-lg mb-10 xx-10"
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
    </div>
  );
}
