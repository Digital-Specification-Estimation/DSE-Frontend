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
import { Textarea } from "@/components/ui/textarea";
import {
  useAddCompanyMutation,
  useGetCompaniesQuery,
} from "@/lib/redux/companySlice";

// Mock company data - replace with actual API call in production
const mockCompanies = [
  { id: "1", company_name: "Acme Inc." },
  { id: "2", company_name: "TechCorp" },
  { id: "3", company_name: "Global Solutions" },
];

export default function SignUp() {
  const [createCompany] = useAddCompanyMutation();
  const { data: companiesFetched = [], refetch: refetchCompanies } =
    useGetCompaniesQuery();

  const [signup] = useSignupMutation();
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState(mockCompanies);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    company_id: "",
    username: "",
    email: "",
    password: "",
    role: "admin",
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
        name === "overtime_rate" ||
        name === "daily_total_planned_cost" ||
        name === "daily_total_actual_cost"
          ? Number.parseFloat(value)
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
        !formData.company_id ||
        !formData.username ||
        !formData.email ||
        !formData.password
      ) {
        throw new Error("All fields are required");
      }

      if (!formData.agreeToTerms) {
        throw new Error("You must agree to the terms");
      }

      const signupResponse = await signup({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        company_id: formData.company_id, // Changed from business_name to company_id
        role: formData.role,
      }).unwrap();
      router.push("/sign-in");
    } catch (err: any) {
      const errorMessage = err ? err.data?.message : "Registration failed";
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

  const handleCreateCompany = async () => {
    setIsLoading(true);
    try {
      await createCompany({
        company_name: companyData.company_name,
        business_type: companyData.business_type,
        standard_work_hours: companyData.standard_work_hours,
        weekly_work_limit: companyData.weekly_work_limit,
        overtime_rate: parseFloat(companyData.overtime_rate),
      }).unwrap();
      await Promise.all([refetchCompanies()]);

      setModalOpen(false);

      toast({
        title: "Success",
        description: "Company created successfully",
      });
    } catch (err: any) {
      console.log(err);
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = (provider: "google" | "apple") => {
    setIsLoading(true);

    // Redirect to backend OAuth endpoint
    if (provider === "google") {
      window.location.href = "http://localhost:4000/auth/google";
    } else {
      // Apple signup would go here
      setTimeout(() => {
        toast({
          title: "Social Sign Up",
          description:
            "Apple sign up is not available yet. Please use email registration.",
        });
        setIsLoading(false);
      }, 1000);
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

          {/* Display error message if registration fails */}
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
                    onChange={(e) =>
                      setFormData({ ...formData, company_id: e.target.value })
                    }
                    className="w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    disabled={isLoading}
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
                    >
                      <Plus className="h-4 w-4" />
                      New
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                      <DialogTitle>Create New Company</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
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
                            Creating...
                          </>
                        ) : (
                          "Create Company"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Admin Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Johny English"
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
                  <option value="admin">Admin</option>
                  <option value="hr manager">HR Manager</option>
                  <option value="departure manager">Departure Manager</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
            </div>

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
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div> */}

          {/* <div className="grid grid-cols-2 gap-3">
            <button
              className="flex items-center justify-center gap-2 py-2 px-4 border rounded-md hover:bg-gray-50"
              onClick={() => handleSocialSignUp("google")}
              disabled={isLoading}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z"
                  fill="#34A853"
                />
                <path
                  d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-sm font-medium">Sign in with Google</span>
            </button>
            <button
              className="flex items-center justify-center gap-2 py-2 px-4 border rounded-md hover:bg-gray-50"
              onClick={() => handleSocialSignUp("apple")}
              disabled={isLoading}
            >
              <svg
                width="16"
                height="20"
                viewBox="0 0 16 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.6442 10.4392C12.6362 8.83984 13.4022 7.6582 14.9522 6.82617C14.0922 5.5957 12.8282 4.92578 11.1842 4.81055C9.63223 4.69922 7.94023 5.74805 7.32423 5.74805C6.67223 5.74805 5.14823 4.85547 3.95623 4.85547C2.02023 4.88281 0 6.43555 0 9.60156C0 10.5762 0.16 11.582 0.48 12.6172C0.91 14.0137 2.53223 17.4219 4.22423 17.3633C5.05223 17.3398 5.63223 16.7051 6.72423 16.7051C7.77223 16.7051 8.30423 17.3633 9.23623 17.3633C10.9442 17.3398 12.4042 14.2344 12.8122 12.834C10.6122 11.8398 10.6442 10.5 10.6442 10.4392H12.6442Z"
                  fill="black"
                />
                <path
                  d="M9.05614 3.94141C10.0321 2.76953 9.91214 1.68359 9.88814 1.28125C9.00414 1.32617 7.96814 1.91406 7.36814 2.66797C6.70414 3.47266 6.32414 4.44922 6.42414 5.71484C7.38414 5.78906 8.16014 5.01953 9.05614 3.94141Z"
                  fill="black"
                />
              </svg>
              <span className="text-sm font-medium">Sign in with Apple</span>
            </button>
          </div> */}

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
  );
}
