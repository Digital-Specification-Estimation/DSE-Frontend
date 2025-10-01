"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { useLoginMutation, useSessionQuery } from "@/lib/redux/authSlice";

export default function SignIn() {
  const [login] = useLoginMutation();
  const { data: sessionData, refetch: refetchSession } = useSessionQuery();
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
    role: "admin", // Default role
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    } catch (err: any) {
      console.error("Login Error:", err, "Stack:", err.stack);
      const errorMessage =
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

  const handleSocialLogin = (provider: "google" | "apple") => {
    setIsLoading(true);

    if (provider === "google") {
      const width = 500;
      const height = 600;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      const popup = window.open(
        "https://dse-backend-uv5d.onrender.com/auth/google",
        "GoogleAuth",
        `width=${width},height=${height},top=${top},left=${left}`
      );

      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === "google-auth-success") {
          localStorage.setItem("authToken", event.data.token);
          try {
            const response = await fetch("https://dse-backend-uv5d.onrender.com/auth/session", {
              headers: { Authorization: `Bearer ${event.data.token}` },
            });
            const sessionData = await response.json();
            console.log("Google Login Session Data:", sessionData);
            const roleStatus = sessionData?.user?.role_request_approval;
            toast({
              title: "Success!",
              description: "Logged in with Google",
            });
            setTimeout(() => {
              if (roleStatus && roleStatus !== "APPROVED") {
                router.push("/pending-role");
              } else {
                router.push("/dashboard");
              }
            }, 1000);
          } catch (err) {
            toast({
              title: "Error",
              description: "Failed to verify Google authentication",
              variant: "destructive",
            });
          }
        } else if (event.data.type === "google-auth-error") {
          toast({
            title: "Error",
            description: "Google authentication failed",
            variant: "destructive",
          });
        }

        window.removeEventListener("message", handleMessage);
        setIsLoading(false);
      };

      window.addEventListener("message", handleMessage);
    } else {
      toast({
        title: "Social Login",
        description:
          "Apple login is not available yet. Please use email login.",
      });
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
    <div className="w-full h-full lg:grid lg:grid-cols-2 bg-white">
      <div className="flex flex-col items-center justify-center py-3 bg-white h-screen">
        <div className="mb-8 mt-0 mr-[400px]">
          <Logo />
        </div>
        <div className="mx-auto w-full px-24 space-y-6">
          <div className="space-y-2 flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold">Sign in to LCM</h1>
            <p className="text-muted-foreground">
              Smart Attendance & Payroll Management
            </p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="johndoe@example.com"
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
                  <option value="hr_manager">HR Manager</option>
                  <option value="departure_manager">Departure Manager</option>
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
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 block text-sm text-gray-600"
                >
                  Remember me
                </label>
              </div>
              <Link
                href="#"
                onClick={handleForgotPassword}
                className="text-sm text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-orange-500 text-white font-medium rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          <div className="text-center text-sm">
            Need an account?{" "}
            <Link href="/sign-up" className="text-orange-500 font-medium">
              Get started
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:block bg-blue-900 relative h-full m-3 mb-3 rounded-lg">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white py-5">
          <div className="w-full max-w-2xl max-h-xl mx-auto h-full lg:px-3 flex flex-col items-center justify-center">
            <Image
              src="/home.png"
              alt="Dashboard Preview"
              width={600}
              height={600}
              className="h-2/3 w-[500px] rounded-lg shadow-lg mb-10"
            />
            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center">
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
