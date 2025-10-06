"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ShieldCheck,
  Check,
  ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { useLoginMutation } from "@/lib/redux/authSlice";

export default function SignIn() {
  const [login] = useLoginMutation();
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
    role: "admin", // Default role
    role: "admin", // Default role
  });
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!formData.email || !formData.password) {
        throw new Error("Email and password are required");
      }
      const data = await login({
        email: formData.email,
        password: formData.password,
        role: formData.role, // Include role in login request
      }).unwrap();
      console.log("Login Response:", data);

      // Store authToken for session persistence
      if (data.access_token) {
        localStorage.setItem("authToken", data.access_token);
        console.log("authToken stored:", data.access_token);
      } else {
        console.warn("No access_token in login response");
      }

      // // Refetch session to get role_request_approval
      // const sessionResult = await refetchSession().unwrap();
      // console.log("Session Refetch Result:", sessionResult);

      // const roleStatus = sessionResult?.user?.role_request_approval;
      // console.log("Role Status:", roleStatus);

      // if (!sessionResult?.user) {
      //   throw new Error("Session data missing user information");
      // }

      toast({
        title: "Login Successful",
        description: "Welcome back! You've been logged in successfully.",
      });

      // Delay redirect to ensure toast is visible
      setTimeout(() => {
        if (data.user.role_request_approval !== "APPROVED") {
          console.log("Redirecting to /pending-role");
          router.push("/pending-role");
        } else {
          console.log("Redirecting to /dashboard");
          router.push("/dashboard");
        }
      }, 1000);

      // Store authToken for session persistence
      if (data.access_token) {
        localStorage.setItem("authToken", data.access_token);
        console.log("authToken stored:", data.access_token);
      } else {
        console.warn("No access_token in login response");
      }

      // // Refetch session to get role_request_approval
      // const sessionResult = await refetchSession().unwrap();
      // console.log("Session Refetch Result:", sessionResult);

      // const roleStatus = sessionResult?.user?.role_request_approval;
      // console.log("Role Status:", roleStatus);

      // if (!sessionResult?.user) {
      //   throw new Error("Session data missing user information");
      // }

      toast({
        title: "Login Successful",
        description: "Welcome back! You've been logged in successfully.",
      });

      // Delay redirect to ensure toast is visible
      setTimeout(() => {
        if (data.user.role_request_approval !== "APPROVED") {
          console.log("Redirecting to /pending-role");
          router.push("/pending-role");
        } else {
          console.log("Redirecting to /dashboard");
          router.push("/dashboard");
        }
      }, 1000);
    } catch (err: any) {
      console.error("Login Error:", err, "Stack:", err.stack);
      const errorMessage =
        err?.data?.message ||
        err?.message ||
        "An unexpected error occurred during login. Please try again.";
      err?.data?.message ||
        err?.message ||
        "An unexpected error occurred during login. Please try again.";
      setError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      title: "Password Reset",
      description: "Password reset functionality will be available soon.",
    });
  };

  return (
    <div className="min-h-screen bg-white ">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link
                href="/"
                className="flex w-full mb-[50px] justify-start items-center text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Home
              </Link>
              <div className="flex justify-center mb-4">
                <Logo className="h-12 w-auto" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Sign in to your account to continue
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-start">
                  <ShieldCheck className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-150"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-orange-600 hover:text-orange-500"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-150"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-150 appearance-none bg-white"
                    >
                      <option value="admin">Admin</option>
                      <option value="hr_manager">HR Manager</option>
                      <option value="employee">Employee</option>
                      <option value="department_manager">
                        Department Manager
                      </option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="rememberMe"
                      name="rememberMe"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Remember me
                    </label>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    href="/sign-up"
                    className="font-medium text-orange-600 hover:text-orange-500"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
